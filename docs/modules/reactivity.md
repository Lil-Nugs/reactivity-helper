# Reactivity Module - Deep Dive Documentation

> For AI agents working on the Reactivity module of Reactivity Helper.

## Module Overview

The Reactivity module enables dog owners to quickly log reactive incidents (triggers, intensity) during walks or outings. It prioritizes **speed** - a complete log can be done in 3 taps - while allowing optional expansion for full context.

**Primary use case**: User is managing a reactive dog during a walk and needs to log an incident with minimal friction.

**Key files**:
- Components: `/src/components/Reactivity/`
- Hook: `/src/hooks/useIncidents.ts`
- Types: `/src/types/reactivity.ts`
- Constants: `/src/constants/triggers.ts`
- Database: `/src/db/index.ts` (incidents table)

---

## Component Hierarchy

```
src/components/Reactivity/
├── QuickLog/
│   ├── index.ts              # Barrel exports
│   ├── QuickLogScreen.tsx    # Main container (tabs: Log, History, Stats)
│   ├── TriggerGrid.tsx       # 3x3 grid of trigger buttons
│   └── IntensitySlider.tsx   # 1-5 numbered button row
└── History/
    ├── index.ts              # Barrel exports
    ├── IncidentList.tsx      # Scrollable list with date grouping + infinite scroll
    └── IncidentCard.tsx      # Single incident display card
```

### Component Relationships

```
QuickLogScreen
├── Header (from common/)
├── [activeTab === 'log']
│   ├── TriggerGrid
│   ├── IntensitySlider
│   ├── "+ Add More Details" button (disabled - TODO Phase 2)
│   └── "LOG IT" button
├── [activeTab === 'history']
│   └── IncidentList
│       └── IncidentCard (repeated, with onIncidentClick prop)
├── [activeTab === 'stats']
│   └── Placeholder (TODO Phase 5)
└── BottomNav (from common/, exports TabType)
```

> **Wired but Not Implemented - onIncidentClick**: The `onIncidentClick` callback prop exists in both `IncidentList` and `IncidentCard` components. `IncidentList` accepts the prop and passes it through to each `IncidentCard`, which has click/keyboard handlers wired up. However, the callback is currently passed as `undefined` from the parent - the editing functionality is planned for Phase 2. The infrastructure is in place and ready for the edit feature implementation.

### Component Dependencies

| Component | Hooks | Context | Types |
|-----------|-------|---------|-------|
| QuickLogScreen | - | `useDog()` | `TriggerType`, `Incident`, `TabType` |
| IncidentList | `useIncidents`, `useNamedLocations` | - | `Incident` |
| IncidentCard | - | - | `Incident`, `TRIGGER_CONFIG` |
| TriggerGrid | - | - | `TriggerType` |
| IntensitySlider | - | - | - |

**Import patterns**:
```typescript
// Context (barrel export)
import { useDog } from '../../../context'

// Types from BottomNav
import { BottomNav, type TabType } from '../../common/BottomNav'
```

---

## Data Flow

### Logging Flow (Write Path)

```
User taps trigger → setSelectedTrigger(type)
User taps intensity → setSelectedIntensity(level)
User taps "LOG IT" → handleLogIncident()
    ├── Create Incident object with nanoid()
    ├── Attempt geolocation (optional, fails gracefully)
    ├── db.incidents.add(incident)
    ├── Show success feedback (1.5s)
    └── Reset form state
```

### Reading Flow (Read Path)

```
IncidentList mounts
├── useIncidents(dogId) hook
│   └── useLiveQuery() from Dexie
│       └── db.incidents.where('dogId').equals(dogId).reverse().sortBy('timestamp')
│           └── Returns Incident[] (reactive - auto-updates on DB changes)
└── useNamedLocations(dogId) hook
    └── useLiveQuery() from Dexie
        └── db.namedLocations.where('dogId').equals(dogId)
            └── Returns NamedLocation[] (used to resolve location names in cards)
```

> **Unusual Pattern - Sort Order**: The query chain `.reverse().sortBy('timestamp')` achieves "newest first" ordering, but the pattern is non-intuitive. Dexie's `.sortBy()` returns results in ascending order, so the preceding `.reverse()` is effectively overridden by the subsequent sort. The current result is ascending order by timestamp (oldest first), not newest first as might be expected.
>
> **Recommended refactor**: Change to `.sortBy('timestamp')` followed by `.reverse()` on the result array, or use Dexie's `.orderBy('timestamp').reverse()` for descending order.

**Write vs. Read pattern**: QuickLogScreen uses direct `db.incidents.add()` for the write path (speed), while IncidentList uses the `useIncidents` hook for the read path (reactivity). This is intentional - writes are fire-and-forget, reads need live updates.

### State Management

| State | Location | Purpose |
|-------|----------|---------|
| `selectedTrigger` | QuickLogScreen | Current trigger selection |
| `selectedIntensity` | QuickLogScreen | Current intensity selection |
| `isLogging` | QuickLogScreen | Prevents double-submission |
| `showSuccess` | QuickLogScreen | Controls success feedback display |
| `activeTab` | QuickLogScreen | Current tab (`TabType`: 'log', 'history', 'stats') |
| `visibleCount` | IncidentList | Pagination cursor for infinite scroll (initial: 20) |
| `activeDog` | `useDog()` hook | Global active dog selection (via `import { useDog } from '../context'`) |

**Context pattern**: The `useDog()` hook is exported from `/src/context/index.ts` (barrel export) and internally uses `useLiveQuery` for reactive database updates.

> **Provider Requirement**: The `useDog()` context hook **must** be used within a `<DogProvider>` wrapper. The implementation in `src/context/DogContext.tsx` throws an error if used outside the provider. Ensure your app root is wrapped: `<DogProvider><App /></DogProvider>`.

> **Tech Debt - Dual useDog implementations**: There are currently two `useDog` implementations:
> - **Context version** (`src/context/DogContext.tsx`): Returns `{ activeDog, isLoading, error }`. Used by components via the barrel export from `src/context/index.ts`. Requires DogProvider wrapper.
> - **Standalone hook** (`src/hooks/useDog.ts`): Returns `{ dog, isLoading, createDog, updateDog }`. Directly queries the database, hardcoded to fetch the first dog ("v1: single dog only").
>
> These should be consolidated in a future refactor. The context version is the primary implementation used throughout the Reactivity module.

---

## Database Operations

### Table: `incidents`

**Indexes** (from `/src/db/index.ts`):
```typescript
incidents: 'id, dogId, timestamp, [dogId+timestamp], trigger, intensity'
```

### CRUD Operations

| Operation | Location | Method |
|-----------|----------|--------|
| Create | `QuickLogScreen.handleLogIncident()` | `db.incidents.add(incident)` (direct) |
| Read (list) | `useIncidents` hook | `useLiveQuery` with `db.incidents.where('dogId')` |
| Read (range) | `/src/db/index.ts` | `getIncidentsInRange(dogId, start, end)` |
| Update | `useIncidents` hook | `updateIncident(id, updates)` (returned function) |
| Delete | `useIncidents` hook | `deleteIncident(id)` (returned function) |

**Note**: The hook returns `incidents || []` to provide a default empty array during the loading state (when `useLiveQuery` returns `undefined`).

### Helper Functions

From `/src/db/index.ts`:

```typescript
// Get incidents in date range (uses compound index)
getIncidentsInRange(dogId: string, startDate: string, endDate: string): Promise<Incident[]>

// Find nearest named location to GPS coordinates (for auto-matching)
findNearestLocation(dogId: string, lat: number, lng: number): Promise<NamedLocation | undefined>
```

---

## Available Triggers

### Full Type Definition

From `/src/types/reactivity.ts`:

```typescript
type TriggerType =
  | 'dog'
  | 'person'
  | 'bike'
  | 'car'
  | 'skateboard'
  | 'loud_noise'
  | 'child'
  | 'jogger'
  | 'other'
```

### Display Configuration

**`TRIGGER_CONFIG`** from `/src/constants/triggers.ts` (used by `IncidentCard` for display):

| Type | Emoji | Label |
|------|-------|-------|
| `dog` | `🐕` | Dog |
| `person` | `🧑` | Person |
| `bike` | `🚴` | Bike |
| `car` | `🚗` | Car |
| `skateboard` | `🛹` | Skateboard |
| `loud_noise` | `🔊` | Noise |
| `child` | `👶` | Child |
| `jogger` | `🏃` | Jogger |
| `other` | `•••` | Other |

### Currently Displayed in UI

The `TriggerGrid` component displays all 9 triggers in a 3x3 grid layout, using `TRIGGER_DISPLAY_ORDER` from `/src/constants/triggers.ts` for explicit ordering:
- Row 1: `dog`, `person`, `bike`
- Row 2: `car`, `skateboard`, `loud_noise`
- Row 3: `child`, `jogger`, `other`

**Note**: The display order is explicitly defined in `TRIGGER_DISPLAY_ORDER` to ensure "Other" is always last and ordering is consistent regardless of `TRIGGER_CONFIG` key order. TypeScript will error if a trigger type is missing from the order array.

---

## Incident Data Model

### Interface Quick Reference

```typescript
interface Incident {
  // Required
  id: string               // nanoid() generated
  dogId: string            // References Dog.id
  timestamp: string        // ISO 8601 (e.g., "2024-12-25T14:30:00.000Z")
  trigger: TriggerType     // One of the 9 trigger types
  intensity: 1 | 2 | 3 | 4 | 5  // 1=mild, 5=full reaction

  // Optional context
  location?: {
    lat: number
    lng: number
    namedLocationId?: string  // References NamedLocation.id
  }
  duration?: 'brief' | 'moderate' | 'prolonged'  // <10s, 10-60s, >60s
  dogBehaviors?: DogBehavior[]
  handlerResponse?: HandlerResponse
  notes?: string           // Max 1000 chars
  tags?: string[]          // Max 10 tags, each 1-30 chars
  distance?: 'far' | 'medium' | 'close'
}
```

### Related Types

```typescript
type DogBehavior =
  | 'barking' | 'lunging' | 'growling' | 'whining'
  | 'freezing' | 'hackling' | 'pulling' | 'hiding'

type HandlerResponse =
  | 'redirected' | 'treated' | 'removed' | 'waited_out'
  | 'counter_conditioned' | 'other'
```

---

## UI States

### Log Tab

| State | Condition | UI |
|-------|-----------|-----|
| Ready to log | `selectedTrigger && selectedIntensity && activeDogId` | "LOG IT" button enabled (indigo-600) |
| Incomplete | Missing trigger or intensity | "LOG IT" button disabled (gray-300) |
| Logging | `isLogging === true` | Button shows "Logging..." |
| Success | `showSuccess === true` | Button shows green "Logged!" for 1.5s |
| Error | Catch block in handleLogIncident | Alert (TODO: replace with toast) |

### History Tab

| State | Condition | UI |
|-------|-----------|-----|
| Loading | `isLoading === true` (from useIncidents) | "Loading incidents..." text |
| Empty | `allIncidents.length === 0` | Emoji + "No incidents logged yet" message |
| Has data | `allIncidents.length > 0` | Date-grouped list of IncidentCards |
| Loading more | `isLoadingMore === true` | "Loading more..." at bottom |
| End of list | `visibleCount >= allIncidents.length` | "No more incidents" at bottom |

### Stats Tab

| State | Condition | UI |
|-------|-----------|-----|
| Placeholder | Always (Phase 5 TODO) | Emoji + "Stats Coming Soon" message |

---

## Implementation Status

### Built (Phase 1)

- [x] QuickLogScreen container with tab navigation
- [x] TriggerGrid component (6 triggers displayed)
- [x] IntensitySlider component (1-5 scale)
- [x] "LOG IT" button with submission flow
- [x] Geolocation capture (optional, fails gracefully)
- [x] useIncidents hook with CRUD operations
- [x] IncidentList with date grouping
- [x] IncidentCard display component
- [x] Infinite scroll pagination (20 items per page)
- [x] Bottom navigation (Log/History/Stats tabs)
- [x] Loading and empty states

### TODO (Phase 2)

- [ ] Details expander (behaviors, handler response, notes, tags)
- [ ] Distance selection
- [ ] Duration selection
- [ ] Auto-match GPS to named locations
- [ ] "Save this location?" chip when no match
- [ ] History filters (by trigger, intensity, location, date, tags)
- [ ] Edit incident (tap card to edit)
- [ ] Delete incident (swipe to delete)

### TODO (Phase 5)

- [ ] Stats/Analytics tab implementation
- [ ] Intensity trend chart (line chart)
- [ ] Trigger breakdown (pie chart)
- [ ] Location hotspots
- [ ] Time range selector (7d, 30d, 90d, All)
- [ ] Cross-module medication correlation

---

## Edge Cases

### Geolocation

**Current behavior** (from `QuickLogScreen.tsx`):
- Location capture is **optional** and fails gracefully
- Uses low-accuracy mode for speed (`enableHighAccuracy: false`)
- 5-second timeout, 30-second max age
- If geolocation fails or is denied, incident logs without location

**TODO**: Auto-match to named locations is commented out:
```typescript
// TODO: Auto-match to named location using db helper
// const namedLocation = await findNearestLocation(...)
```

### Intensity Range

- UI enforces 1-5 range via button selection
- TypeScript enforces `1 | 2 | 3 | 4 | 5` literal type
- Color coding in IncidentCard (Tailwind classes):
  - 1: `bg-green-100 text-green-800` (mild)
  - 2: `bg-yellow-100 text-yellow-800`
  - 3: `bg-orange-100 text-orange-800`
  - 4: `bg-red-100 text-red-800`
  - 5: `bg-red-200 text-red-900` (full reaction - deeper red)

### Date Grouping

`IncidentList.groupIncidentsByDate()` handles:
- "Today" - incidents from current date
- "Yesterday" - incidents from previous date
- Formatted date (e.g., "Dec 23, 2024") - older incidents

Uses local timezone for date comparison.

### No Active Dog

If `activeDog` is null, `activeDogId` defaults to empty string `''`. The form validation (`canSubmit`) checks for truthy `activeDogId`, preventing submission without an active dog.

### Pagination

- Initial load: 20 incidents
- Scroll threshold: 100px from bottom
- Load increment: 20 more per scroll
- Simulated 300ms delay for smooth UX

### Touch Targets

Components follow mobile-first patterns:
- TriggerGrid buttons: `min-h-20` (80px)
- IntensitySlider buttons: `min-h-11 min-w-11` (44px - Apple minimum)
- IncidentCard: `min-h-11` with `p-4` padding (effectively taller), includes tap feedback (`active:bg-indigo-50`)
- LOG IT button: `min-h-14` (56px)

### Accessibility

IncidentCard includes accessibility features:
- `role="button"` and `tabIndex={0}` for keyboard navigation
- `onKeyDown` handler for Enter/Space activation
- `aria-label` attributes on trigger emoji and intensity indicator

---

## Testing Considerations

### Unit Tests

- TriggerGrid: Selection state, callback firing
- IntensitySlider: Selection state, callback firing
- IncidentCard: Intensity color mapping, time formatting
- groupIncidentsByDate: Date label generation

### Integration Tests

- Full logging flow: Select trigger -> Select intensity -> Submit
- History loading: Empty state -> Data state
- Pagination: Initial load -> Scroll -> Load more

### Manual Testing

- [ ] Test with geolocation denied
- [ ] Test with very long list (100+ incidents)
- [ ] Test date grouping across timezone boundaries
- [ ] Test on iOS Safari (standalone mode)
- [ ] Verify touch targets meet 44px minimum

---

## Common Modifications

### Adding a New Trigger Type

1. Add to `TriggerType` in `/src/types/reactivity.ts`
2. Add emoji/label to `TRIGGER_CONFIG` in `/src/constants/triggers.ts`
3. Optionally add to `triggers` array in `TriggerGrid.tsx` (if displaying in UI)

### Changing Intensity Scale

1. Update type in `/src/types/reactivity.ts`: `intensity: 1 | 2 | 3 | 4 | 5`
2. Update `intensityLevels` array in `IntensitySlider.tsx`
3. Update color mapping in `IncidentCard.tsx`

### Adding Optional Fields

1. Add to `Incident` interface in `/src/types/reactivity.ts`
2. Implement in Details expander (Phase 2)
3. Display in `IncidentCard.tsx` if needed

---

## Related Documentation

- `/DESIGN.md` - Full app specifications, wireframes, data models
- `/docs/REFACTORING_ROADMAP.md` - Architecture evolution plans
- `/docs/SUPABASE_MIGRATION.md` - Future cloud sync design
