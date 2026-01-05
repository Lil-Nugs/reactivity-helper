# Separation Anxiety Module - Deep Dive

Documentation for AI agents implementing the Separation Anxiety (SA) training module.

---

## Quick Reference

| Item | Value |
|------|-------|
| **Route** | `/separation` |
| **Components** | `src/components/SeparationAnxiety/` |
| **Types** | `import from 'src/types/separationAnxiety.ts'` or `'src/types'` |
| **Database** | `import { db } from '../db'` |
| **Hook Pattern** | Follow `src/hooks/useIncidents.ts` |
| **Context** | `import { useDog } from '../context'` for active dog |
| **Status** | Placeholder only (Coming Soon screen) |

---

## Module Overview

### Purpose

The Separation Anxiety module helps dog owners track and analyze departure training sessions. Separation anxiety in dogs manifests as distress behaviors when the dog is left alone. Training involves gradually increasing the duration of absences while maintaining the dog's calm state.

### Core Functionality

1. **Departure Logging** - Quick capture of training sessions with outcome tracking
2. **Weekly Target Management** - Set progressive duration goals for structured training
3. **Progress Analytics** - Visualize trends, identify patterns, and track target hit rates
4. **Behavioral Observation** - Optional detailed logging of behaviors observed during departures (from camera footage or memory)

### User Flow

```
User returns from departure
       |
       v
Quick Log: Duration + Exit Type + Outcome (3-4 taps)
       |
       v
[Optional] Expand for full context
       |
       v
Log saved -> visible in history & analytics
```

---

## Component Hierarchy

### Current State (Placeholder)

```
src/components/SeparationAnxiety/
├── index.ts                    # Exports: export { SeparationAnxietyScreen } from './SeparationAnxietyScreen'
├── .gitkeep
└── SeparationAnxietyScreen.tsx # Placeholder "Coming Soon" screen
```

### Target Structure (Per DESIGN.md)

```
src/components/SeparationAnxiety/
├── index.ts
├── DepartureLog/
│   ├── DepartureLogScreen.tsx       # Main quick log screen
│   ├── DurationInput.tsx            # Duration slider with [-5] [+5] buttons
│   ├── ExitTypeSelector.tsx         # Exit type chip selection
│   ├── OutcomeSelector.tsx          # Calm/Okay/Rough emotion selector
│   └── DetailsExpander.tsx          # Optional details accordion
├── WeeklyTarget/
│   ├── WeeklyTargetScreen.tsx       # Target setter screen
│   └── TargetSetter.tsx             # Duration slider with last week stats
├── History/
│   ├── DepartureHistoryScreen.tsx   # History list screen with filters
│   ├── DepartureList.tsx            # Infinite-scroll departure list
│   ├── DepartureCard.tsx            # Individual departure card
│   └── DepartureFilters.tsx         # Filter bottom sheet
├── Analytics/
│   ├── SAAnalyticsScreen.tsx        # Analytics dashboard
│   ├── DurationChart.tsx            # Line chart with target overlay
│   ├── TargetHitRate.tsx            # Weekly hit rate display
│   └── InsightsPanel.tsx            # "What's Working" / "Watch Out For"
└── shared/
    ├── BehaviorLogEntry.tsx         # Behavior log mini-form
    ├── EnrichmentSelector.tsx       # Enrichment type + engagement picker
    └── DepartureCueChips.tsx        # Multi-select departure cue chips
```

---

## Data Flow

### Database Tables

Dexie tables supporting this module (defined in `src/db/index.ts`):

| Table | Primary Key | Indexes | Purpose |
|-------|-------------|---------|---------|
| `departures` | `id` | `dogId`, `timestamp`, `[dogId+timestamp]`, `exitType`, `outcome` | Store departure logs |
| `weeklyTargets` | `id` | `dogId`, `weekStart`, `[dogId+weekStart]` | Store weekly duration targets |

### Existing Database Functions

From `src/db/index.ts`:

```typescript
// Get departures for a dog in a date range
getDeparturesInRange(dogId: string, startDate: string, endDate: string): Promise<Departure[]>

// Get weekly target for a specific week
getWeeklyTarget(dogId: string, weekStart: string): Promise<WeeklyTarget | undefined>
```

### Required Hooks (To Be Implemented)

Per DESIGN.md, these hooks are needed in `src/hooks/`. Follow the pattern established in `useIncidents.ts`:

- Use `useLiveQuery` from `dexie-react-hooks` for reactive queries (not plain `useState`)
- Return `isLoading: boolean` (not `error` state)
- Use `nanoid()` for ID generation
- Support pagination via `limit`/`offset` options

**Note**: Additional database helpers for weekly target history and outcome-based departure queries are not yet implemented. See Implementation Status section below.

```typescript
// src/hooks/useDepartures.ts
interface UseDeparturesReturn {
  departures: Departure[];
  isLoading: boolean;
  createDeparture: (departure: Omit<Departure, 'id'>) => Promise<string>;
  updateDeparture: (id: string, changes: Partial<Departure>) => Promise<void>;
  deleteDeparture: (id: string) => Promise<void>;
}

// src/hooks/useWeeklyTargets.ts
interface UseWeeklyTargetsReturn {
  currentTarget: WeeklyTarget | null;
  isLoading: boolean;
  setWeeklyTarget: (weekStart: string, targetDuration: number, notes?: string) => Promise<void>;
  getTargetForWeek: (weekStart: string) => Promise<WeeklyTarget | undefined>;
  getTargetHistory: (weeks: number) => Promise<WeeklyTarget[]>;
}
```

### Data Flow Diagram

```
User Input
    |
    v
DepartureLogScreen
    |
    v
useDepartures hook
    |
    v
db.departures.add()
    |
    v
IndexedDB (Dexie)
    |
    v
useLiveQuery() reactivity
    |
    v
History/Analytics re-render
```

---

## Departure Data Model

### Departure Interface

```typescript
interface Departure {
  // Identity
  id: string;                          // nanoid(), e.g., "V1StGXR8_Z5jdHi6B-myT"
  dogId: string;                       // References Dog.id
  timestamp: string;                   // ISO 8601, e.g., "2024-12-25T14:30:00-08:00"

  // Core (REQUIRED for quick log)
  duration: number;                    // Minutes, range 0-480 (8 hours max)
  exitType: ExitType;                  // How/where you left
  outcome: 'calm' | 'okay' | 'rough';  // Overall session result

  // Pre-departure context (optional)
  preDepartureState?: DogState;        // Dog's state before you left
  exerciseBeforehand?: ExerciseType;   // Any exercise done before
  timeSinceLastMeal?: number;          // Minutes since last meal

  // Departure setup (optional)
  departureCues?: DepartureCue[];      // Cues performed before leaving
  confinementSetup?: ConfinementType;  // Where dog was contained
  companionsRemaining?: Companion[];   // Who/what stayed with dog
  externalFactors?: string[];          // Free-form: "construction", "storm"

  // Enrichment (optional)
  enrichment?: Enrichment[];           // Items given + engagement level

  // Behavior observation (optional)
  behaviorLog?: BehaviorEntry[];       // Timeline of behaviors observed

  // Return context (optional)
  returnBehavior?: ReturnBehavior;     // Dog's behavior when you returned
  distressEvidence?: DistressEvidence[];// Physical evidence found

  // Freeform (optional)
  notes?: string;                      // Max 1000 chars
  tags?: string[];                     // Max 10 tags, each 1-30 chars
}
```

### WeeklyTarget Interface

```typescript
interface WeeklyTarget {
  id: string;                    // nanoid()
  dogId: string;                 // References Dog.id
  weekStart: string;             // ISO date string (YYYY-MM-DD) of Monday, e.g., "2024-12-23"
  targetDuration: number;        // Target duration in minutes (0-480)
  notes?: string;                // Optional notes about the week's goal
}
```

### Enrichment Sub-Interface

```typescript
interface Enrichment {
  type: EnrichmentType;
  engagementLevel?: 'ignored' | 'engaged' | 'finished' | 'partial';
}
```

### BehaviorEntry Sub-Interface

```typescript
interface BehaviorEntry {
  minuteMark: number;                  // Minutes from start when behavior occurred
  behavior: DepartureBehavior;         // What behavior was observed
  intensity?: 1 | 2 | 3 | 4 | 5;       // Optional severity scale
  notes?: string;                      // Optional notes about this entry
}
```

---

## Exit Types and Outcomes

### ExitType

| Value | Description | Use Case |
|-------|-------------|----------|
| `front_door` | Left through front door | Most common departure route |
| `garage_door` | Left through garage | Alternative exit, different cues |
| `back_door` | Left through back door | May be less triggering for some dogs |
| `no_exit` | Practice session without leaving | Pre-departure cue desensitization |

**Implementation Note**: `no_exit` is for sessions where you practice departure cues (grabbing keys, putting on shoes) without actually leaving. These help desensitize dogs to pre-departure anxiety triggers.

### Outcome

| Value | Description | Analytics Interpretation |
|-------|-------------|-------------------------|
| `calm` | Dog stayed relaxed throughout | Success - consider increasing duration |
| `okay` | Some mild stress but manageable | Acceptable - maintain current duration |
| `rough` | Significant distress observed | Setback - consider reducing duration |

---

## All Enum Types

All types below are defined in `src/types/separationAnxiety.ts`. Import from there rather than redefining:

```typescript
import type { DogState, ExitType, Departure, WeeklyTarget } from '../types/separationAnxiety';
// or
import type { DogState, ExitType, Departure, WeeklyTarget } from '../types';
```

### DogState

```typescript
type DogState = 'calm' | 'relaxed' | 'tired' | 'anxious' | 'hyper' | 'alert' | 'neutral'
```

Use: Pre-departure state assessment. `tired` and `calm` often correlate with better outcomes.

### ExerciseType

```typescript
type ExerciseType = 'walk' | 'run' | 'play_session' | 'training' | 'sniff_walk' | 'fetch' | 'none'
```

Use: Track whether exercise before departure affects outcomes.

### DepartureCue

```typescript
type DepartureCue =
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
```

Use: Identify which pre-departure cues trigger anxiety vs. which are neutral.

### ConfinementType

```typescript
type ConfinementType = 'crate' | 'gated_room' | 'closed_room' | 'free_roam' | 'penned_area'
```

Use: Track which confinement setups work best for the dog.

### Companion

```typescript
type Companion = 'alone' | 'other_dog' | 'other_pet' | 'person'
```

Use: Differentiate true "alone" sessions from sessions where another presence remained.

### EnrichmentType

```typescript
type EnrichmentType =
  | 'frozen_kong'
  | 'kong'
  | 'puzzle_feeder'
  | 'bully_stick'
  | 'snuffle_mat'
  | 'lick_mat'
  | 'chew'
  | 'toppl'
  | 'other'
```

Use: Identify most effective enrichment for calm departures.

### DepartureBehavior

```typescript
type DepartureBehavior =
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
```

Use: Detailed behavior timeline from camera observation.

### ReturnBehavior

```typescript
type ReturnBehavior = 'calm' | 'normal_greeting' | 'excited' | 'over_excited' | 'frantic' | 'clingy'
```

Use: Return behavior can indicate overall stress level during absence.

### DistressEvidence

```typescript
type DistressEvidence =
  | 'none'
  | 'destruction'
  | 'elimination'
  | 'drooling'
  | 'self_harm'
  | 'escape_damage'
  | 'moved_objects'
```

Use: Physical evidence found upon return, even if not observed on camera.

---

## Weekly Targets Concept

### Purpose

Weekly targets provide structure for progressive SA training. Rather than daily goals, weekly targets allow for:
- Multiple warmup departures per day
- Natural variance in session timing
- "Bad days" without feeling like failure

### Target vs. Warmup Classification

```typescript
// From DESIGN.md analytics spec
const isTargetAttempt = (departure: Departure, weeklyTarget: number) =>
  departure.duration >= weeklyTarget * 0.75;

const isWarmup = (departure: Departure, weeklyTarget: number) =>
  departure.duration < weeklyTarget * 0.75;
```

**Example**: If weekly target is 40 minutes:
- 30+ minutes = Target attempt (>= 75%)
- < 30 minutes = Warmup

### Week Calculation

Weeks start on Monday (ISO 8601 standard):

```typescript
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0]; // "2024-12-23"
}
```

**Timezone Consideration**: The above example uses `.toISOString()` which converts to UTC, potentially shifting the date. For local date handling, use native `date.toLocaleDateString('en-CA')` for YYYY-MM-DD format (no external date library is currently a project dependency).

### Target Hit Rate Analytics

```typescript
interface DepartureAnalytics {
  // Target tracking
  weeklyTargetHitRate: number;      // % of departures >= target duration
  targetAttempts: Departure[];       // Departures >= 75% of target
  warmupDepartures: Departure[];     // Departures < 75% of target

  // Progression
  progressionStatus: 'advancing' | 'maintaining' | 'regressing';
  averageDurationThisWeek: number;
  averageDurationLastWeek: number;
  longestSuccessfulDeparture: number;

  // Insights
  bestTimeOfDay: string;
  bestPreDepartureState: DogState;
  mostEffectiveEnrichment: EnrichmentType;
  cuesThatIncreaseAnxiety: DepartureCue[];
}
```

**Progression Status Rules**:
- `advancing`: This week's avg >= last week's + 10%
- `regressing`: This week's avg <= last week's - 10%
- `maintaining`: Within +/-10%

**Note**: The 10% threshold is a sensible default for SA training progression. This could be made user-configurable in a future version to accommodate different training methodologies or individual dog needs.

---

## Implementation Status

### Built (Current State)

| Component | Status | Notes |
|-----------|--------|-------|
| `SeparationAnxietyScreen.tsx` | Placeholder | Shows "Coming Soon" message |
| `src/types/separationAnxiety.ts` | Complete | All types defined |
| `db.departures` table | Schema defined | Not yet used |
| `db.weeklyTargets` table | Schema defined | Not yet used |
| `getDeparturesInRange()` | Implemented | In `src/db/index.ts` |
| `getWeeklyTarget()` | Implemented | In `src/db/index.ts` |

### Needs Implementation

| Component/Hook | Priority | Dependencies |
|---------------|----------|--------------|
| `useDepartures` hook | P0 | None |
| `useWeeklyTargets` hook | P0 | None |
| `DepartureLogScreen` | P0 | useDepartures |
| `DurationInput` | P0 | None |
| `ExitTypeSelector` | P0 | None |
| `OutcomeSelector` | P0 | None |
| `TargetSetter` | P1 | useWeeklyTargets |
| `DepartureHistoryScreen` | P1 | useDepartures |
| `DepartureCard` | P1 | None |
| `DetailsExpander` | P2 | Multiple sub-components |
| `BehaviorLogEntry` | P2 | None |
| `SAAnalyticsScreen` | P3 | useDepartures, useWeeklyTargets |
| `DurationChart` | P3 | Recharts |
| `InsightsPanel` | P3 | Analytics calculations |

---

## Domain Considerations

### Duration Limits

- **Minimum**: 0 minutes (for `no_exit` practice sessions)
- **Maximum**: 480 minutes (8 hours)
- **Typical training range**: 1-60 minutes for dogs in active SA training
- **UI consideration**: Slider should have fine granularity at lower durations (1-minute increments below 30 min)

### Pre-Departure Cue Desensitization

The `no_exit` exit type serves a specific training purpose:
- Dogs with SA often show anxiety at pre-departure cues before the owner leaves
- Training involves performing cues (keys, shoes, jacket) without leaving
- These sessions should still be logged to track cue desensitization progress
- Duration for `no_exit` typically represents how long cues were performed

### Warmup Sessions

Multiple short departures before a "real" attempt are common in SA training:
- Helps dog settle before longer absence
- Should not count against target hit rate
- Analytics should distinguish warmups from target attempts

### Behavior Log Timing

The `minuteMark` in `BehaviorEntry` is crucial for behaviorist analysis:
- Allows identification of when anxiety peaks during departure
- "Panic window" is often 10-20 minutes after owner leaves
- Dogs that settle after 15-20 minutes have better prognosis

### Return Behavior Correlation

Return behavior can indicate hidden stress:
- `frantic` or `clingy` upon return suggests high anxiety during absence
- Even if camera showed no obvious distress

### Medication Cross-Module Analysis

Per DESIGN.md, SA success rates are correlated with medication timing:
- Compare departure outcomes on days with on-time vs. late vs. missed doses
- This requires cross-module analytics (`src/hooks/useAnalytics.ts` - planned, not yet implemented)
- **Blocked on**: Medications module implementation (currently placeholder only)

### External Factors

Common external factors that affect SA:
- Construction noise
- Thunderstorms/weather
- Package deliveries (doorbell)
- Neighbor dogs barking
- Unusual household activity before departure

These should be captured as free-form strings in `externalFactors[]`.

---

## Component Integration

### Accessing the Active Dog

The app has two `useDog` exports - use the context version:

```typescript
// CORRECT: Use context accessor for component access
import { useDog } from '../context';

function DepartureLogScreen() {
  const { activeDog, isLoading } = useDog();

  if (isLoading) return <Loading />;
  if (!activeDog) return null; // Should redirect to first-run flow

  // Use activeDog.id for database queries
}
```

**Two useDog exports explained:**
- `src/context/DogContext.tsx` exports `useDog()` - returns `{ activeDog, isLoading, error }`. Use this in components.
- `src/hooks/useDog.ts` exports `useDog()` - returns `{ dog, isLoading, createDog, updateDog }`. Used for first-run flow dog creation.

### Screen Layout Pattern

SA screens should follow the pattern from `QuickLogScreen` (located at `src/components/Reactivity/QuickLog/QuickLogScreen.tsx`):

```typescript
import { Header } from '../common/Header';
import { BottomNav } from '../common/BottomNav';

function DepartureLogScreen() {
  // Use 'log' | 'history' | 'stats' tabs - same as Reactivity module for UX consistency
  const [activeTab, setActiveTab] = useState<'log' | 'history' | 'stats'>('log');

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Separation Anxiety" />

      <main className="flex-1 p-4 pb-24">
        {/* Tab content:
            - 'log': DepartureLogScreen (quick log form)
            - 'history': DepartureHistoryScreen (list with filters)
            - 'stats': SAAnalyticsScreen + WeeklyTargetScreen (analytics and target configuration)
        */}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
```

**Tab Structure Note**: The SA module uses the same `'log' | 'history' | 'stats'` tabs as the Reactivity module for UX consistency across the app. The Weekly Target configuration is integrated into the 'stats' tab rather than being a separate route, allowing users to view analytics and adjust their weekly goals in one place.

### Common Components

Import via barrel file `src/components/common/index.ts`:

| Component | Location | Usage |
|-----------|----------|-------|
| `Header` | `src/components/common/Header.tsx` | Top nav with back/settings buttons |
| `BottomNav` | `src/components/common/BottomNav.tsx` | Tab navigation (Log, History, Stats), also exports `TabType` |

---

## UI Patterns

### Quick Log Flow (Per DESIGN.md)

```
1. User opens SA module after returning home
2. Current weekly target displayed at top (with inline edit or "Stats" tab access)
3. Duration input (slider with +/-5 buttons)
4. Exit type selection (3-4 chips)
5. Outcome selection (3 emoji chips: Calm/Okay/Rough)
6. [Optional] "+ Add More Details" expander
7. "LOG DEPARTURE" button
```

**Note**: Weekly target configuration is accessible via the "Stats" tab within the SA module's tabbed interface, keeping navigation consistent with the Reactivity module. Users can view and edit their weekly target from that tab rather than navigating to a separate screen.

### Mobile-First Requirements

- All touch targets minimum `min-h-11` (44px) per Tailwind mobile patterns (see ARCHITECTURE.md "Mobile-First Touch Targets" section)
- Duration slider must be thumb-friendly
- Chips should be large enough for quick selection
- Details expander uses accordion pattern (not modal)

### History Card Display

Each departure card should show:
- Exit type icon
- Duration
- Time of day
- Target status (hit/warmup badge)
- Outcome emoji
- Optional: enrichment icons if provided

---

## Testing Considerations

### Unit Tests Needed

After implementing the utility functions, add these tests:

```typescript
// Weekly calculations (after implementing getWeekStart)
describe('getWeekStart', () => {
  it('returns Monday for any day of week');
  it('handles year boundaries');
  it('handles timezone edge cases');
});

// Target classification (after implementing isTargetAttempt)
describe('isTargetAttempt', () => {
  it('returns true for 75%+ of target');
  it('returns false for below 75%');
  it('handles zero target gracefully');
});

// Progression status (after implementing calculateProgressionStatus)
describe('calculateProgressionStatus', () => {
  it('returns advancing for 10%+ improvement');
  it('returns regressing for 10%+ decline');
  it('returns maintaining for within 10%');
  it('handles zero/empty data');
});
```

### Integration Tests

- Departure CRUD operations via useDepartures hook
- Weekly target persistence and retrieval
- History list pagination
- Filter combinations

---

## Related Files

| File | Purpose |
|------|---------|
| `DESIGN.md` | Full spec including SA module UI mockups |
| `src/types/separationAnxiety.ts` | All TypeScript types |
| `src/db/index.ts` | Database schema and helper functions |
| `src/hooks/useIncidents.ts` | Reference pattern for hook implementation |
| `src/context/DogContext.tsx` | Active dog context provider |
| `src/components/SeparationAnxiety/` | Component directory |

### See Also

- `docs/STATUS.md` - Implementation status, what's built vs planned
- `docs/ARCHITECTURE.md` - Hook patterns, database access, UI patterns
- `docs/modules/reactivity.md` - Reference for similar quick-log implementation

---

## Implementation Checklist

When implementing this module, verify:

- [ ] All types imported from `src/types/separationAnxiety.ts`
- [ ] IDs generated with `nanoid()`
- [ ] Timestamps in ISO 8601 format
- [ ] Duration validated to 0-480 range
- [ ] Weekly targets keyed by Monday date
- [ ] Offline functionality preserved (no network calls)
- [ ] Touch targets meet 44px minimum
- [ ] `dexie-helper` agent consulted for database operations
- [ ] `mobile-ux-reviewer` agent run after UI implementation
