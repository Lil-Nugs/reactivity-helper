// Medication module types
// See DESIGN.md for specifications

export interface DoseSchedule {
  id: string
  label: string // "Morning", "Evening", "Daily", etc.
  targetTime: string // 24-hour format: "08:00", "20:00"
  defaultDose: number // in mg (0.1-1000)
}

export interface MedicationConfig {
  id: string
  dogId: string
  name: string // 1-50 chars
  doses: DoseSchedule[]
  notes?: string
}

export interface MedicationEntry {
  id: string
  dogId: string
  date: string // ISO 8601 date (e.g., "2024-12-25")
  medicationId: string
  doseScheduleId: string
  targetTime: string // 24-hour format
  actualTime: string // 24-hour format
  dose: number // in mg
  notes?: string
  tags?: string[]
}
