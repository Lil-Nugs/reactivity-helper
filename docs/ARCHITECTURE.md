# Architecture Reference (v1)

Technical architecture for the Reactivity Helper PWA (v1 single-dog). Designed for AI agents working on the codebase.

> **Related Documentation**:
> - [STATUS.md](./STATUS.md) - Implementation status, what's built vs planned
> - [docs/modules/reactivity.md](./modules/reactivity.md) - Reactivity module deep-dive
> - [docs/modules/separation-anxiety.md](./modules/separation-anxiety.md) - Separation Anxiety module
> - [docs/modules/medications.md](./modules/medications.md) - Medications module

---

## 1. File Structure

```
src/
├── main.tsx                    # React entry point (StrictMode, createRoot)
├── App.tsx                     # Router setup (uses BASE_URL), DogProvider wrapper
├── index.css                   # Tailwind import, iOS safe area handling
│
├── types/                      # TypeScript type definitions
│   ├── index.ts                # Re-exports all types (barrel file)
│   ├── common.ts               # Dog, UserSettings, NamedLocation
│   ├── reactivity.ts           # Incident, TriggerType, DogBehavior, etc.
│   ├── separationAnxiety.ts    # Departure, WeeklyTarget, DogState, etc.
│   └── medications.ts          # MedicationConfig, MedicationEntry, DoseSchedule
│
├── db/
│   └── index.ts                # Dexie database class, singleton, helper functions
│
├── context/
│   ├── index.ts                # Re-exports DogProvider, useDog (barrel file)
│   └── DogContext.tsx          # DogProvider component, useDog context hook
│
├── hooks/                      # NO barrel file - import hooks directly
│   ├── useDog.ts               # Dog CRUD (standalone, not context-based)
│   ├── useIncidents.ts         # Incident CRUD with pagination
│   └── useNamedLocations.ts    # Named location CRUD with geo-matching
│
├── constants/
│   ├── index.ts                # Re-exports all constants (barrel file)
│   └── triggers.ts             # TRIGGER_CONFIG (emoji + label mapping)
│
├── components/
│   ├── common/                 # Shared UI components
│   │   ├── Header.tsx          # App header with back/settings buttons
│   │   ├── BottomNav.tsx       # Tab navigation (Log, History, Stats), exports TabType
│   │   ├── Example.tsx         # Prototype component (not used in production)
│   │   └── index.ts            # Re-exports Header, BottomNav, TabType
│   │
│   ├── Home/
│   │   ├── ModuleSelector.tsx  # Home screen, first-run dog creation flow, module cards
│   │   └── index.ts
│   │
│   ├── Reactivity/
│   │   ├── QuickLog/
│   │   │   ├── QuickLogScreen.tsx  # Main reactivity screen with tabs
│   │   │   ├── TriggerGrid.tsx     # 3-column grid, 6 triggers (subset of 9 TriggerTypes)
│   │   │   ├── IntensitySlider.tsx # 1-5 intensity selector
│   │   │   └── index.ts
│   │   └── History/
│   │       ├── IncidentList.tsx    # Date-grouped infinite scroll list
│   │       ├── IncidentCard.tsx    # Single incident display with intensity colors
│   │       └── index.ts
│   │
│   ├── SeparationAnxiety/
│   │   ├── SeparationAnxietyScreen.tsx  # Placeholder screen
│   │   └── index.ts
│   │
│   └── Medications/
│       ├── MedicationsScreen.tsx  # Placeholder screen
│       └── index.ts
│
└── assets/
    └── react.svg               # Default Vite asset
```

**Barrel Export Pattern**: Most directories have an `index.ts` that re-exports all public members. Exception: `hooks/` intentionally has no barrel file to avoid circular dependencies - import hooks directly from their files.

---

## 2. State Management

### Architecture Pattern

```
React Context (App-wide state)
       │
       ▼
   DogProvider
       │
       ▼
  useLiveQuery (Dexie reactive queries)
       │
       ▼
   IndexedDB (Dexie)
```

### DogContext (Global State)

**Location**: `src/context/DogContext.tsx`

Provides the active dog to all components. Uses `useLiveQuery` for automatic reactivity when database changes.

```typescript
interface DogContextType {
  activeDog: Dog | null;
  isLoading: boolean;
  error: string | null;
}
```

**Usage**:
```typescript
import { useDog } from '../context';

function MyComponent() {
  const { activeDog, isLoading } = useDog();

  if (isLoading) return <Loading />;
  if (!activeDog) return <FirstRunFlow />;

  return <Content dog={activeDog} />;
}
```

### The Two useDog Hooks

There are two hooks named `useDog` with different purposes:

| Hook | Location | Returns | Use Case |
|------|----------|---------|----------|
| Context `useDog` | `src/context/DogContext.tsx` | `{ activeDog, isLoading, error }` | **Most components** - access active dog via context |
| Standalone `useDog` | `src/hooks/useDog.ts` | `{ dog, isLoading, createDog, updateDog }` | First-run flow - creating/updating dogs |

**When to use which**:
- **Context version** (via `import { useDog } from '../context'`): Use in any component that needs to read the active dog. This is the most common case.
- **Standalone version** (via `import { useDog } from '../hooks/useDog'`): Use when you need to create or update dogs (e.g., ModuleSelector first-run flow).

### Local Component State

For UI state (selected items, form values, loading states), use `useState`:

```typescript
const [selectedTrigger, setSelectedTrigger] = useState<TriggerType | null>(null);
const [selectedIntensity, setSelectedIntensity] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
const [isLogging, setIsLogging] = useState(false);
```

### Dexie + useLiveQuery

All hooks use `useLiveQuery` from `dexie-react-hooks` for reactive data:

```typescript
const incidents = useLiveQuery(
  async () => {
    return db.incidents
      .where('dogId')
      .equals(dogId)
      .reverse()
      .sortBy('timestamp');
  },
  [dogId]  // dependencies
);

// useLiveQuery returns undefined while loading
const isLoading = incidents === undefined;
```

**Loading State Convention**: `useLiveQuery` returns `undefined` while loading. Hooks convert this to user-friendly defaults:
- Array data: Return `[]` (e.g., `incidents: incidents || []`)
- Single entity: Return `null` (e.g., `dog: dog || null`)

---

## 3. Available Hooks

### useDog (Context)

**Location**: `src/context/DogContext.tsx`

```typescript
function useDog(): DogContextType

interface DogContextType {
  activeDog: Dog | null;
  isLoading: boolean;
  error: string | null;
}
```

**Note**: Must be used within `DogProvider`. Throws if used outside.

### useDog (Standalone)

**Location**: `src/hooks/useDog.ts`

```typescript
function useDog(): {
  dog: Dog | null;          // Note: 'dog' not 'activeDog'
  isLoading: boolean;
  createDog: (name: string) => Promise<string>;
  updateDog: (id: string, name: string) => Promise<void>;
}
```

**Note**: Returns first dog in database. v1 is single-dog only; multi-dog support planned for future.

### useIncidents

**Location**: `src/hooks/useIncidents.ts`

```typescript
function useIncidents(
  dogId: string,
  options?: { limit?: number; offset?: number }  // Optional pagination for infinite scroll
): {
  incidents: Incident[];    // Always an array (useLiveQuery's undefined converted to [])
  isLoading: boolean;
  createIncident: (incident: Omit<Incident, 'id'>) => Promise<string>;
  updateIncident: (id: string, updates: Partial<Incident>) => Promise<void>;
  deleteIncident: (id: string) => Promise<void>;
}
```

### useNamedLocations

**Location**: `src/hooks/useNamedLocations.ts`

```typescript
function useNamedLocations(dogId: string): {
  locations: NamedLocation[];  // Always an array (useLiveQuery's undefined converted to [])
  isLoading: boolean;
  createLocation: (location: Omit<NamedLocation, 'id'>) => Promise<string>;
  updateLocation: (id: string, updates: Partial<NamedLocation>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  findLocationByCoords: (lat: number, lng: number) => NamedLocation | undefined;
}
```

**Note**: Uses internal `calculateDistance` (Haversine formula) for geo-matching.

---

## 4. Database Schema

**Location**: `src/db/index.ts`

### Database Class

```typescript
class ReactivityHelperDB extends Dexie {
  dogs!: Table<Dog, string>;
  userSettings!: Table<UserSettings, string>;
  namedLocations!: Table<NamedLocation, string>;
  incidents!: Table<Incident, string>;
  departures!: Table<Departure, string>;
  weeklyTargets!: Table<WeeklyTarget, string>;
  medicationConfigs!: Table<MedicationConfig, string>;
  medicationEntries!: Table<MedicationEntry, string>;
}

// Singleton export
export const db = new ReactivityHelperDB();
```

**Design Note**: The `userSettings` table uses `activeDogId` as its primary key (not a nanoid). This is intentional for the v1 single-dog design and allows one settings row per dog.

### Tables and Indexes

| Table | Primary Key | Indexes |
|-------|-------------|---------|
| `dogs` | `id` | `name` |
| `userSettings` | `activeDogId` | (none) |
| `namedLocations` | `id` | `dogId`, `name` |
| `incidents` | `id` | `dogId`, `timestamp`, `[dogId+timestamp]`, `trigger`, `intensity` |
| `departures` | `id` | `dogId`, `timestamp`, `[dogId+timestamp]`, `exitType`, `outcome` |
| `weeklyTargets` | `id` | `dogId`, `weekStart`, `[dogId+weekStart]` |
| `medicationConfigs` | `id` | `dogId`, `name` |
| `medicationEntries` | `id` | `dogId`, `date`, `medicationId`, `[dogId+date]`, `[dogId+medicationId]` |

### Compound Index Queries

```typescript
// Get incidents for a dog in date range
db.incidents
  .where('[dogId+timestamp]')
  .between([dogId, startDate], [dogId, endDate], true, true)
  .reverse()
  .toArray();
```

### Helper Functions

| Function | Description |
|----------|-------------|
| `getUserSettings(activeDogId)` | Get or create default settings |
| `updateUserSettings(activeDogId, changes)` | Partial update settings |
| `addRecentTag(activeDogId, tag)` | Add tag to recent tags (keeps max 10, removes duplicates) |
| `getIncidentsInRange(dogId, start, end)` | Query incidents by date range |
| `getDeparturesInRange(dogId, start, end)` | Query departures by date range |
| `getMedicationEntriesInRange(dogId, start, end)` | Query med entries by date |
| `getMedicationEntriesByMedication(dogId, medId)` | Query by medication |
| `getWeeklyTarget(dogId, weekStart)` | Get target for specific week |
| `getNamedLocations(dogId)` | All locations for a dog |
| `findNearestLocation(dogId, lat, lng)` | Find location within radius |

---

## 5. Constants and Types

### Type Locations

| Category | Location |
|----------|----------|
| Common types | `src/types/common.ts` |
| Reactivity types | `src/types/reactivity.ts` |
| Separation Anxiety types | `src/types/separationAnxiety.ts` |
| Medication types | `src/types/medications.ts` |

### Key Type Definitions

**TriggerType** (reactivity.ts):
```typescript
type TriggerType =
  | 'dog' | 'person' | 'bike' | 'car' | 'skateboard'
  | 'loud_noise' | 'child' | 'jogger' | 'other'
```

**Note**: TriggerGrid.tsx only displays 6 of these 9 triggers: dog, person, bike, car, loud_noise, other. The full set is available for future UI expansion.

**DogBehavior** (reactivity.ts):
```typescript
type DogBehavior =
  | 'barking' | 'lunging' | 'growling' | 'whining'
  | 'freezing' | 'hackling' | 'pulling' | 'hiding'
```

**Intensity**: `1 | 2 | 3 | 4 | 5` (literal union type, not a range)

**Duration**: `'brief' | 'moderate' | 'prolonged'`

**Distance**: `'far' | 'medium' | 'close'`

**TabType** (exported from `src/components/common/BottomNav.tsx`):
```typescript
type TabType = 'log' | 'history' | 'stats'
```

**Note**: TabType is co-located with BottomNav since it's only used by that component and its consumers. If needed elsewhere, consider moving to `src/types/common.ts`.

### Constants

**TRIGGER_CONFIG** (`src/constants/triggers.ts`):
```typescript
const TRIGGER_CONFIG: Record<TriggerType, { emoji: string; label: string }> = {
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
```

---

## 6. UI Patterns

### Mobile-First Touch Targets

All interactive elements must meet 44x44px minimum:

```tsx
// Buttons
className="min-h-11 min-w-11"  // 44px (Tailwind: 1 unit = 0.25rem = 4px at default 16px root)

// Full-width buttons
className="w-full min-h-14"  // 56px height for primary actions
```

### iOS Safe Areas

**Header** (`src/components/common/Header.tsx`):
```tsx
<header style={{ paddingTop: 'env(safe-area-inset-top)' }}>
```

**Bottom Nav** (`src/components/common/BottomNav.tsx`):
```tsx
<nav style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
```

**Global CSS** (`src/index.css`):
```css
body {
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

### Page Layout Pattern

```tsx
function ScreenTemplate() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header - sticky top */}
      <Header title="Screen Title" />

      {/* Main content - scrollable, with bottom padding for nav */}
      <main className="flex-1 p-4 pb-24">
        {/* Content */}
      </main>

      {/* Bottom Nav - fixed */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
```

### Button States

```tsx
// Primary action
className={`
  w-full min-h-14 rounded-lg font-semibold
  ${enabled
    ? 'bg-indigo-600 text-white active:bg-indigo-700'
    : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
`}

// Selection button
className={`
  min-h-11 rounded-full border-2
  ${selected
    ? 'border-indigo-600 bg-indigo-600 text-white scale-110'
    : 'border-gray-300 bg-white text-gray-700 active:bg-gray-50'}
`}
```

### Card Pattern

```tsx
<div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
  {/* Content */}
</div>
```

### Active/Touch States

Use `active:` prefix instead of `hover:` for mobile:

```tsx
className="active:bg-gray-50"
className="active:bg-indigo-700"
className="active:ring-2 active:ring-indigo-300"
```

### Intensity Color Scale

Used in IncidentCard for visual intensity indication:

| Intensity | Background Color |
|-----------|------------------|
| 1 | `bg-green-100` |
| 2 | `bg-yellow-100` |
| 3 | `bg-orange-100` |
| 4 | `bg-red-100` |
| 5 | `bg-red-200` |

---

## 7. Error Handling

### Current Approach

**Database Operations**: Try/catch with console.error and alert fallback:

```typescript
try {
  await db.incidents.add(incident);
  setShowSuccess(true);
} catch (error) {
  console.error('Failed to log incident:', error);
  alert('Failed to log incident. Please try again.');
}
```

**Geolocation**: Graceful degradation with console.debug:

```typescript
try {
  const position = await getCurrentPosition();
  incident.location = { lat, lng };
} catch (err) {
  console.debug('Location not available:', err);
  // Continue without location
}
```

**Context Access**: Throws if used outside provider:

```typescript
export function useDog(): DogContextType {
  const context = useContext(DogContext);
  if (!context) {
    throw new Error('useDog must be used within a DogProvider');
  }
  return context;
}
```

### Known Gaps

1. **No Toast System**: Uses `alert()` for errors (TODO: implement toast component)
2. **No Error Boundaries**: React errors crash the app
3. **No Retry Logic**: Failed database operations require manual retry
4. **No Offline Detection**: No UI indicator for offline state
5. **No Data Validation**: Types enforced at compile time only, no runtime validation
6. **No Network Error Handling**: Future Supabase sync will need retry/conflict resolution

### Technical Debt

1. **Duplicate `calculateDistance` implementations**: Both `src/db/index.ts` and `src/hooks/useNamedLocations.ts` contain identical Haversine distance calculation functions. These should be extracted to a shared utility at `src/utils/geo.ts`.

2. **Duplicate location-finding functions**: `findLocationByCoords` (in `useNamedLocations` hook) and `findNearestLocation` (in `src/db/index.ts`) provide similar functionality with different interfaces. These should be consolidated in a future refactor.

3. **Two hooks named `useDog`**: The context hook (`src/context/DogContext.tsx`) and standalone hook (`src/hooks/useDog.ts`) share the same name, which can cause import confusion. **Future refactor**: Rename to `useActiveDog` (context) vs `useDogManagement` (standalone) for clarity.

### Recommended Patterns (Future)

```typescript
// Toast notification system
import { toast } from '../components/Toast';

try {
  await db.incidents.add(incident);
  toast.success('Incident logged');
} catch (error) {
  toast.error('Failed to log incident');
  logger.error('incident_add_failed', { error, incident });
}
```

```typescript
// Error boundary wrapper
<ErrorBoundary fallback={<ErrorScreen />}>
  <App />
</ErrorBoundary>
```

---

## 8. Routes

**Location**: `src/App.tsx`

**Note**: Router uses `basename={import.meta.env.BASE_URL}` for deployment flexibility.

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `ModuleSelector` | Home screen. Handles first-run dog creation flow. Shows module picker after setup. |
| `/reactivity` | `QuickLogScreen` | Log incidents, view history, stats (stats tab is placeholder) |
| `/separation` | `SeparationAnxietyScreen` | Log departures (placeholder screen) |
| `/medications` | `MedicationsScreen` | Log doses (placeholder screen) |

**Note**: No `/settings` route exists yet. Header shows settings button but handler is not connected.

---

## 9. ID Generation

All entity IDs use `nanoid()`:

```typescript
import { nanoid } from 'nanoid';

const incident: Incident = {
  id: nanoid(),  // e.g., "V1StGXR8_Z5jdHi6B-myT"
  // ...
};
```

**Note**: IDs are generated at creation time (not on database insert) to enable optimistic UI updates.

---

## 10. Date/Time Handling

**Timestamps**: ISO 8601 strings with timezone:
```typescript
timestamp: new Date().toISOString()  // "2024-12-25T14:30:00.000Z"
```

**Dates only** (for medications, weekly targets):
```typescript
date: "2024-12-25"  // ISO date without time
```

**Week starts**: Monday of the week:
```typescript
weekStart: "2024-12-23"  // Monday
```

**Time only** (for medication schedules):
```typescript
targetTime: "08:00"  // 24-hour format
actualTime: "08:15"
```

---

## 11. Dependencies

Key npm packages used in this project:

| Package | Purpose |
|---------|---------|
| `react`, `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `dexie` | IndexedDB wrapper for offline storage |
| `dexie-react-hooks` | React hooks for Dexie (`useLiveQuery`) |
| `nanoid` | Unique ID generation |
| `lucide-react` | Icon library (ArrowLeft, Settings, ClipboardList, BarChart3, PenSquare) |
| `tailwindcss` | Utility-first CSS framework |
