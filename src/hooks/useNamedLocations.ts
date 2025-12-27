import { useLiveQuery } from 'dexie-react-hooks'
import { nanoid } from 'nanoid'
import { db } from '../db'
import type { NamedLocation } from '../types/common'

/**
 * Custom hook for Named Location CRUD operations
 *
 * Features:
 * - Real-time reactive queries using useLiveQuery
 * - Query locations by dogId
 * - Auto-match location based on GPS coordinates and radius
 * - Create, update, delete operations
 *
 * @param dogId - The dog to fetch locations for
 * @returns Location data and CRUD operations
 */
export function useNamedLocations(dogId: string) {
  // Query named locations with useLiveQuery for reactive updates
  const locations = useLiveQuery(
    () => db.namedLocations.where('dogId').equals(dogId).toArray(),
    [dogId]
  )

  // Loading state: useLiveQuery returns undefined while loading
  const isLoading = locations === undefined

  /**
   * Create a new named location
   * @param location - Location data without id
   * @returns The generated location ID
   */
  const createLocation = async (
    location: Omit<NamedLocation, 'id'>
  ): Promise<string> => {
    const id = nanoid()
    await db.namedLocations.add({ ...location, id })
    return id
  }

  /**
   * Update an existing named location
   * @param id - Location ID
   * @param updates - Partial location data to update
   */
  const updateLocation = async (
    id: string,
    updates: Partial<NamedLocation>
  ): Promise<void> => {
    await db.namedLocations.update(id, updates)
  }

  /**
   * Delete a named location
   * @param id - Location ID to delete
   */
  const deleteLocation = async (id: string): Promise<void> => {
    await db.namedLocations.delete(id)
  }

  /**
   * Find location within radius of given coordinates
   * Returns the location with smallest radius if multiple match
   *
   * @param lat - Latitude
   * @param lng - Longitude
   * @returns The nearest location within its radius, or undefined
   */
  const findLocationByCoords = (
    lat: number,
    lng: number
  ): NamedLocation | undefined => {
    if (!locations || locations.length === 0) return undefined

    // Calculate distance for each location
    const locationsWithDistance = locations
      .map(location => {
        const distance = calculateDistance(lat, lng, location.lat, location.lng)
        return { location, distance }
      })
      .filter(({ location, distance }) => distance <= location.radiusMeters)
      .sort((a, b) => a.distance - b.distance)

    return locationsWithDistance[0]?.location
  }

  return {
    locations: locations || [],
    isLoading,
    createLocation,
    updateLocation,
    deleteLocation,
    findLocationByCoords,
  }
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @returns Distance in meters
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}
