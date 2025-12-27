import { useLiveQuery } from 'dexie-react-hooks'
import { nanoid } from 'nanoid'
import { db } from '../db'
import type { Incident } from '../types/reactivity'

interface UseIncidentsOptions {
  limit?: number
  offset?: number
}

/**
 * Custom hook for Reactivity incident CRUD operations
 *
 * Features:
 * - Real-time reactive queries using useLiveQuery
 * - Query incidents by dogId, sorted by timestamp (newest first)
 * - Optional pagination with limit/offset
 * - Create, update, delete operations
 *
 * @param dogId - The dog to fetch incidents for
 * @param options - Optional pagination parameters
 * @returns Incident data and CRUD operations
 */
export function useIncidents(dogId: string, options?: UseIncidentsOptions) {
  const { limit, offset = 0 } = options || {}

  // Query incidents with useLiveQuery for reactive updates
  const incidents = useLiveQuery(
    async () => {
      const results = await db.incidents
        .where('dogId')
        .equals(dogId)
        .reverse()
        .sortBy('timestamp')

      // Apply pagination if specified
      if (limit !== undefined) {
        return results.slice(offset, offset + limit)
      }

      return results
    },
    [dogId, limit, offset]
  )

  // Loading state: useLiveQuery returns undefined while loading
  const isLoading = incidents === undefined

  /**
   * Create a new incident
   * @param incident - Incident data without id
   * @returns The generated incident ID
   */
  const createIncident = async (incident: Omit<Incident, 'id'>): Promise<string> => {
    const id = nanoid()
    await db.incidents.add({ ...incident, id })
    return id
  }

  /**
   * Update an existing incident
   * @param id - Incident ID
   * @param updates - Partial incident data to update
   */
  const updateIncident = async (id: string, updates: Partial<Incident>): Promise<void> => {
    await db.incidents.update(id, updates)
  }

  /**
   * Delete an incident
   * @param id - Incident ID to delete
   */
  const deleteIncident = async (id: string): Promise<void> => {
    await db.incidents.delete(id)
  }

  return {
    incidents: incidents || [],
    isLoading,
    createIncident,
    updateIncident,
    deleteIncident,
  }
}
