interface IntensitySliderProps {
  selectedIntensity: 1 | 2 | 3 | 4 | 5 | null;
  onSelect: (intensity: 1 | 2 | 3 | 4 | 5) => void;
}

const intensityLevels: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];

/**
 * Intensity selector with 5 numbered buttons.
 * Visual scale from "mild" (1) to "reactive" (5).
 */
export function IntensitySlider({ selectedIntensity, onSelect }: IntensitySliderProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Intensity:
      </label>

      {/* Intensity buttons */}
      <div className="flex items-center justify-between gap-2">
        {intensityLevels.map((level) => {
          const isSelected = selectedIntensity === level;

          return (
            <button
              key={level}
              onClick={() => onSelect(level)}
              className={`
                flex items-center justify-center
                min-h-11 min-w-11 rounded-full border-2 font-semibold text-base
                transition-all
                ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-md scale-110'
                    : 'border-gray-300 bg-white text-gray-700 active:bg-gray-50'
                }
              `}
              aria-label={`Intensity level ${level}`}
              aria-pressed={isSelected}
            >
              {level}
            </button>
          );
        })}
      </div>

      {/* Scale labels */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-gray-500 font-medium">mild</span>
        <span className="text-xs text-gray-400">───────</span>
        <span className="text-xs text-gray-500 font-medium">reactive</span>
      </div>
    </div>
  );
}
