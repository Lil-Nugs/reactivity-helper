import type { TriggerType } from '../types/reactivity'

/**
 * Explicit display order for triggers in the UI grid.
 * "Other" is always last. TypeScript will error if a trigger is missing.
 */
export const TRIGGER_DISPLAY_ORDER: TriggerType[] = [
  'dog', 'person', 'bike',
  'car', 'skateboard', 'loud_noise',
  'child', 'jogger', 'other',
];

/**
 * Trigger configuration mapping for display
 * Maps trigger types to their emoji and display names
 */
export const TRIGGER_CONFIG: Record<
  TriggerType,
  { emoji: string; label: string }
> = {
  dog: { emoji: '🐕', label: 'Dog' },
  person: { emoji: '🧑', label: 'Person' },
  bike: { emoji: '🚴', label: 'Bike' },
  car: { emoji: '🚗', label: 'Car' },
  skateboard: { emoji: '🛹', label: 'Skateboard' },
  loud_noise: { emoji: '🔊', label: 'Noise' },
  child: { emoji: '👶', label: 'Child' },
  jogger: { emoji: '🏃', label: 'Jogger' },
  other: { emoji: '•••', label: 'Other' },
}
