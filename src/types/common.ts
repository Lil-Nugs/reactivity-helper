// Common types shared across modules

export interface Dog {
  id: string
  name: string
}

export interface UserSettings {
  activeDogId: string
  recentTags: string[]
  darkMode: boolean
}

export interface NamedLocation {
  id: string
  dogId: string
  name: string // "Home", "Central Park", "Vet", etc.
  lat: number
  lng: number
  radiusMeters: number // Default 50m for auto-matching
}
