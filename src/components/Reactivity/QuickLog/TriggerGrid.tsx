import type { TriggerType } from '../../../types/reactivity';
import { TRIGGER_CONFIG } from '../../../constants/triggers';

interface TriggerGridProps {
  selectedTrigger: TriggerType | null;
  onSelect: (trigger: TriggerType) => void;
}

// Derive triggers array from TRIGGER_CONFIG to ensure all 9 triggers are shown
const triggers = (Object.entries(TRIGGER_CONFIG) as [TriggerType, { emoji: string; label: string }][]).map(
  ([type, config]) => ({
    type,
    label: config.label,
    emoji: config.emoji,
  })
);

/**
 * Grid of trigger buttons for quick incident logging.
 * 3 rows x 3 columns with large touch targets.
 */
export function TriggerGrid({ selectedTrigger, onSelect }: TriggerGridProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        What triggered it?
      </label>

      <div className="grid grid-cols-3 gap-3">
        {triggers.map((trigger) => {
          const isSelected = selectedTrigger === trigger.type;

          return (
            <button
              key={trigger.type}
              onClick={() => onSelect(trigger.type)}
              className={`
                flex flex-col items-center justify-center gap-2
                min-h-20 p-3 rounded-lg border-2 transition-all
                ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                    : 'border-gray-300 bg-white active:bg-gray-50'
                }
              `}
              aria-pressed={isSelected}
            >
              <span className="text-2xl" aria-hidden="true">
                {trigger.emoji}
              </span>
              <span
                className={`text-sm font-medium ${
                  isSelected ? 'text-indigo-700' : 'text-gray-700'
                }`}
              >
                {trigger.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
