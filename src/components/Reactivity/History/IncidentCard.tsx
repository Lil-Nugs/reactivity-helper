import type { Incident } from '../../../types/reactivity'
import { TRIGGER_CONFIG } from '../../../constants/triggers'

interface IncidentCardProps {
  incident: Incident
  locationName?: string
  onClick?: () => void
}

/**
 * IncidentCard - Single incident display card for history list
 * Shows trigger, intensity, time, location, and behaviors
 * Mobile-first with proper touch targets (min-h-11)
 */
export function IncidentCard({
  incident,
  locationName,
  onClick,
}: IncidentCardProps) {
  // Format timestamp to display time (e.g., "10:23 AM")
  const formatTime = (isoString: string): string => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const triggerConfig = TRIGGER_CONFIG[incident.trigger]

  return (
    <div
      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 min-h-11 active:bg-indigo-50 active:ring-2 active:ring-indigo-300 transition-colors cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.()
        }
      }}
    >
      {/* Header row: Trigger + Intensity + Time */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* Trigger emoji + label */}
          <span className="text-2xl" aria-label={triggerConfig.label}>
            {triggerConfig.emoji}
          </span>
          <span className="font-medium text-gray-900">
            {triggerConfig.label}
          </span>

          {/* Intensity indicator (numbered circle 1-5) */}
          <div
            className={`
              flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold
              ${incident.intensity === 1 ? 'bg-green-100 text-green-800' : ''}
              ${incident.intensity === 2 ? 'bg-yellow-100 text-yellow-800' : ''}
              ${incident.intensity === 3 ? 'bg-orange-100 text-orange-800' : ''}
              ${incident.intensity === 4 ? 'bg-red-100 text-red-800' : ''}
              ${incident.intensity === 5 ? 'bg-red-200 text-red-900' : ''}
            `}
            aria-label={`Intensity ${incident.intensity} out of 5`}
          >
            {incident.intensity}
          </div>
        </div>

        {/* Time */}
        <time className="text-sm text-gray-600" dateTime={incident.timestamp}>
          {formatTime(incident.timestamp)}
        </time>
      </div>

      {/* Behaviors list (if present) */}
      {incident.dogBehaviors && incident.dogBehaviors.length > 0 && (
        <div className="text-sm text-gray-600 mb-1">
          {incident.dogBehaviors
            .map(
              (behavior) =>
                behavior.charAt(0).toUpperCase() + behavior.slice(1)
            )
            .join(', ')}
        </div>
      )}

      {/* Location (if available) */}
      {locationName && (
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <span aria-label="Location">📍</span>
          <span>{locationName}</span>
        </div>
      )}
    </div>
  )
}
