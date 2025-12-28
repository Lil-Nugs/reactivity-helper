import { useState, useEffect, useRef } from 'react'
import type { Incident } from '../../../types/reactivity'
import { IncidentCard } from './IncidentCard'
import { useIncidents } from '../../../hooks/useIncidents'
import { useNamedLocations } from '../../../hooks/useNamedLocations'

interface IncidentListProps {
  dogId: string
  onIncidentClick?: (incident: Incident) => void
}

/**
 * IncidentList - Scrollable list with date grouping and infinite scroll
 * Groups incidents by date (Today, Yesterday, Dec 23, etc.)
 * Loads 20 items initially, then 20 more on scroll
 *
 * Uses Dexie hooks (useIncidents, useNamedLocations) for reactive data
 */
export function IncidentList({ dogId, onIncidentClick }: IncidentListProps) {
  // Pagination state
  const [visibleCount, setVisibleCount] = useState(20)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Fetch incidents and locations using Dexie hooks
  const { incidents: allIncidents, isLoading: isLoadingIncidents } = useIncidents(dogId)
  const { locations } = useNamedLocations(dogId)

  // Slice for pagination (incidents are already sorted by timestamp desc from hook)
  const visibleIncidents = allIncidents.slice(0, visibleCount)

  // Group incidents by date
  const groupedIncidents = groupIncidentsByDate(visibleIncidents)

  // Infinite scroll handler
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 100

      if (scrolledToBottom && !isLoadingMore && visibleCount < allIncidents.length) {
        setIsLoadingMore(true)
        // Simulate loading delay for smooth UX
        setTimeout(() => {
          setVisibleCount((prev) => prev + 20)
          setIsLoadingMore(false)
        }, 300)
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [isLoadingMore, visibleCount, allIncidents.length])

  // Get location name for an incident
  const getLocationName = (incident: Incident): string | undefined => {
    if (!incident.location?.namedLocationId) return undefined
    const location = locations.find(
      (loc) => loc.id === incident.location?.namedLocationId
    )
    return location?.name
  }

  // Loading state (initial load)
  if (isLoadingIncidents) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="text-sm text-gray-500">Loading incidents...</div>
      </div>
    )
  }

  // Empty state
  if (allIncidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No incidents logged yet
        </h3>
        <p className="text-sm text-gray-600 max-w-sm">
          Tap a trigger on the Quick Log screen to record your first incident.
        </p>
      </div>
    )
  }

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto px-4 pb-32"
    >
      {/* Date-grouped incident list */}
      {Object.entries(groupedIncidents).map(([dateLabel, incidents]) => (
        <div key={dateLabel} className="mb-6">
          {/* Date header */}
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 sticky top-0 bg-white border-b border-gray-200 py-2 z-10">
            {dateLabel}
          </h3>

          {/* Incident cards for this date */}
          <div className="space-y-3">
            {incidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                locationName={getLocationName(incident)}
                onClick={() => onIncidentClick?.(incident)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Loading indicator */}
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <div className="text-sm text-gray-500">Loading more...</div>
        </div>
      )}

      {/* End of list indicator */}
      {!isLoadingMore && visibleCount >= allIncidents.length && allIncidents.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="text-sm text-gray-400">No more incidents</div>
        </div>
      )}
    </div>
  )
}

/**
 * Group incidents by date with human-readable labels
 * Returns an object with date labels as keys and incident arrays as values
 */
function groupIncidentsByDate(
  incidents: Incident[]
): Record<string, Incident[]> {
  const grouped: Record<string, Incident[]> = {}

  incidents.forEach((incident) => {
    const date = new Date(incident.timestamp)
    const label = formatDateLabel(date)

    if (!grouped[label]) {
      grouped[label] = []
    }
    grouped[label].push(incident)
  })

  return grouped
}

/**
 * Format date to human-readable label
 * "Today", "Yesterday", or "Dec 23, 2024"
 */
function formatDateLabel(date: Date): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Reset time for comparison
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const yesterdayOnly = new Date(
    yesterday.getFullYear(),
    yesterday.getMonth(),
    yesterday.getDate()
  )

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return 'Today'
  }

  if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return 'Yesterday'
  }

  // Format as "Dec 23, 2024"
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
