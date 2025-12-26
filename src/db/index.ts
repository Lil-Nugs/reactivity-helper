import Dexie, { type Table } from 'dexie';
import type {
  Dog,
  UserSettings,
  NamedLocation,
  Incident,
  Departure,
  WeeklyTarget,
  MedicationConfig,
  MedicationEntry,
} from '../types';

export class ReactivityHelperDB extends Dexie {
  // Table declarations
  dogs!: Table<Dog, string>;
  userSettings!: Table<UserSettings, string>;
  namedLocations!: Table<NamedLocation, string>;
  incidents!: Table<Incident, string>;
  departures!: Table<Departure, string>;
  weeklyTargets!: Table<WeeklyTarget, string>;
  medicationConfigs!: Table<MedicationConfig, string>;
  medicationEntries!: Table<MedicationEntry, string>;

  constructor() {
    super('ReactivityHelperDB');

    this.version(1).stores({
      // Simple tables (primary key only)
      dogs: 'id, name',

      // UserSettings - single row, keyed by 'current'
      userSettings: 'activeDogId',

      // Named locations - queryable by dogId
      namedLocations: 'id, dogId, name',

      // Incidents - compound index for efficient dog+date queries
      incidents: 'id, dogId, timestamp, [dogId+timestamp], trigger, intensity',

      // Departures - compound index for efficient dog+date queries
      departures: 'id, dogId, timestamp, [dogId+timestamp], exitType, outcome',

      // Weekly targets - queryable by dog and week
      weeklyTargets: 'id, dogId, weekStart, [dogId+weekStart]',

      // Medication configs - queryable by dogId
      medicationConfigs: 'id, dogId, name',

      // Medication entries - compound index for date-based queries
      medicationEntries: 'id, dogId, date, medicationId, [dogId+date], [dogId+medicationId]',
    });
  }
}

// Export singleton instance
export const db = new ReactivityHelperDB();

// Export convenience methods for common operations

/**
 * Get the current user settings (or create default)
 */
export async function getUserSettings(activeDogId: string): Promise<UserSettings> {
  const settings = await db.userSettings.get(activeDogId);

  if (!settings) {
    // Create default settings
    const defaultSettings: UserSettings = {
      activeDogId,
      recentTags: [],
      darkMode: false,
    };
    await db.userSettings.put(defaultSettings);
    return defaultSettings;
  }

  return settings;
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  activeDogId: string,
  changes: Partial<Omit<UserSettings, 'activeDogId'>>
): Promise<void> {
  await db.userSettings.update(activeDogId, changes);
}

/**
 * Add a tag to recent tags (max 10)
 */
export async function addRecentTag(activeDogId: string, tag: string): Promise<void> {
  const settings = await getUserSettings(activeDogId);
  const recentTags = [tag, ...settings.recentTags.filter(t => t !== tag)].slice(0, 10);
  await updateUserSettings(activeDogId, { recentTags });
}

/**
 * Get incidents for a dog in a date range
 */
export async function getIncidentsInRange(
  dogId: string,
  startDate: string,
  endDate: string
): Promise<Incident[]> {
  return db.incidents
    .where('[dogId+timestamp]')
    .between([dogId, startDate], [dogId, endDate], true, true)
    .reverse()
    .toArray();
}

/**
 * Get departures for a dog in a date range
 */
export async function getDeparturesInRange(
  dogId: string,
  startDate: string,
  endDate: string
): Promise<Departure[]> {
  return db.departures
    .where('[dogId+timestamp]')
    .between([dogId, startDate], [dogId, endDate], true, true)
    .reverse()
    .toArray();
}

/**
 * Get medication entries for a dog in a date range
 */
export async function getMedicationEntriesInRange(
  dogId: string,
  startDate: string,
  endDate: string
): Promise<MedicationEntry[]> {
  return db.medicationEntries
    .where('[dogId+date]')
    .between([dogId, startDate], [dogId, endDate], true, true)
    .toArray();
}

/**
 * Get medication entries for a specific medication
 */
export async function getMedicationEntriesByMedication(
  dogId: string,
  medicationId: string
): Promise<MedicationEntry[]> {
  return db.medicationEntries
    .where('[dogId+medicationId]')
    .equals([dogId, medicationId])
    .toArray();
}

/**
 * Get weekly target for a specific week
 */
export async function getWeeklyTarget(
  dogId: string,
  weekStart: string
): Promise<WeeklyTarget | undefined> {
  return db.weeklyTargets
    .where('[dogId+weekStart]')
    .equals([dogId, weekStart])
    .first();
}

/**
 * Get named locations for a dog
 */
export async function getNamedLocations(dogId: string): Promise<NamedLocation[]> {
  return db.namedLocations.where('dogId').equals(dogId).toArray();
}

/**
 * Find nearest named location to GPS coordinates
 * @param dogId - The dog ID
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns The nearest location within its radius, or undefined
 */
export async function findNearestLocation(
  dogId: string,
  lat: number,
  lng: number
): Promise<NamedLocation | undefined> {
  const locations = await getNamedLocations(dogId);

  // Calculate distance for each location
  const locationsWithDistance = locations
    .map(location => {
      const distance = calculateDistance(lat, lng, location.lat, location.lng);
      return { location, distance };
    })
    .filter(({ location, distance }) => distance <= location.radiusMeters)
    .sort((a, b) => a.distance - b.distance);

  return locationsWithDistance[0]?.location;
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
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
