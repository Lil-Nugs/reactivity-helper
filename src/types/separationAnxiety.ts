// Separation Anxiety module types
// See DESIGN.md for specifications

export type DogState = 'calm' | 'relaxed' | 'tired' | 'anxious' | 'hyper' | 'alert' | 'neutral'

export type ExerciseType = 'walk' | 'run' | 'play_session' | 'training' | 'sniff_walk' | 'fetch' | 'none'

export type DepartureCue =
  | 'grabbed_jacket'
  | 'grabbed_keys'
  | 'grabbed_backpack'
  | 'grabbed_purse'
  | 'showered'
  | 'got_dressed'
  | 'put_on_shoes'
  | 'turned_on_white_noise'
  | 'gave_chew'
  | 'gave_enrichment'
  | 'said_goodbye'
  | 'used_cue_word'
  | 'other'

export type ExitType = 'front_door' | 'garage_door' | 'back_door' | 'no_exit'

export type ConfinementType = 'crate' | 'gated_room' | 'closed_room' | 'free_roam' | 'penned_area'

export type Companion = 'alone' | 'other_dog' | 'other_pet' | 'person'

export type EnrichmentType =
  | 'frozen_kong'
  | 'kong'
  | 'puzzle_feeder'
  | 'bully_stick'
  | 'snuffle_mat'
  | 'lick_mat'
  | 'chew'
  | 'toppl'
  | 'other'

export interface Enrichment {
  type: EnrichmentType
  engagementLevel?: 'ignored' | 'engaged' | 'finished' | 'partial'
}

export type DepartureBehavior =
  | 'calm'
  | 'resting'
  | 'sleeping'
  | 'playing'
  | 'pacing'
  | 'whining'
  | 'barking'
  | 'howling'
  | 'scratching_door'
  | 'destructive'
  | 'drooling'
  | 'panting'
  | 'escape_attempt'
  | 'elimination'

export interface BehaviorEntry {
  minuteMark: number
  behavior: DepartureBehavior
  intensity?: 1 | 2 | 3 | 4 | 5
  notes?: string
}

export type ReturnBehavior = 'calm' | 'normal_greeting' | 'excited' | 'over_excited' | 'frantic' | 'clingy'

export type DistressEvidence =
  | 'none'
  | 'destruction'
  | 'elimination'
  | 'drooling'
  | 'self_harm'
  | 'escape_damage'
  | 'moved_objects'

export interface Departure {
  id: string
  dogId: string
  timestamp: string // ISO 8601

  // Core (required)
  duration: number // minutes (0-480)
  exitType: ExitType
  outcome: 'calm' | 'okay' | 'rough'

  // Optional context
  preDepartureState?: DogState
  exerciseBeforehand?: ExerciseType
  timeSinceLastMeal?: number
  departureCues?: DepartureCue[]
  confinementSetup?: ConfinementType
  companionsRemaining?: Companion[]
  externalFactors?: string[]
  enrichment?: Enrichment[]
  behaviorLog?: BehaviorEntry[]
  returnBehavior?: ReturnBehavior
  distressEvidence?: DistressEvidence[]
  notes?: string
  tags?: string[]
}

export interface WeeklyTarget {
  id: string
  dogId: string
  weekStart: string // ISO 8601 date of Monday
  targetDuration: number // minutes (0-480)
  notes?: string
}
