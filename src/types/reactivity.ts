// Reactivity module types
// See DESIGN.md for specifications

export type TriggerType =
  | 'dog'
  | 'person'
  | 'bike'
  | 'car'
  | 'skateboard'
  | 'loud_noise'
  | 'child'
  | 'jogger'
  | 'other'

export type DogBehavior =
  | 'barking'
  | 'lunging'
  | 'growling'
  | 'whining'
  | 'freezing'
  | 'hackling'
  | 'pulling'
  | 'hiding'

export type HandlerResponse =
  | 'redirected'
  | 'treated'
  | 'removed'
  | 'waited_out'
  | 'counter_conditioned'
  | 'other'

export interface Incident {
  id: string
  dogId: string
  timestamp: string // ISO 8601

  // Core (required)
  trigger: TriggerType
  intensity: 1 | 2 | 3 | 4 | 5

  // Context (optional)
  location?: {
    lat: number
    lng: number
    namedLocationId?: string
  }
  duration?: 'brief' | 'moderate' | 'prolonged'
  dogBehaviors?: DogBehavior[]
  handlerResponse?: HandlerResponse
  notes?: string
  tags?: string[]
  distance?: 'far' | 'medium' | 'close'
}
