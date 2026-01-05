# Medications Module Documentation

> Deep-dive documentation for AI agents implementing the Medications module.

---

## Quick Reference

### File Locations

| Purpose | Path | Status |
|---------|------|--------|
| Types | `src/types/medications.ts` | Exists |
| Types barrel export | `src/types/index.ts` | Exports via `export * from './medications'` |
| Database | `src/db/index.ts` | Tables defined, helpers exist |
| Components | `src/components/Medications/` | Placeholder only |
| Hook (to create) | `src/hooks/useMedications.ts` | NOT YET CREATED |

### What Exists vs What Needs Building

| Item | Status |
|------|--------|
| `MedicationConfig`, `MedicationEntry`, `DoseSchedule` types | Exists |
| `medicationConfigs`, `medicationEntries` database tables | Exists |
| `getMedicationEntriesInRange()`, `getMedicationEntriesByMedication()` | Exists |
| `MedicationsScreen.tsx` placeholder | Exists |
| `useMedications` hook | NOT EXISTS |
| `TodaysDoses`, `DoseCheckbox`, `DoseForm`, etc. | NOT EXISTS |

### Reference Implementation

Follow the pattern in `src/hooks/useIncidents.ts` for the `useMedications` hook.

### Cross-References

- **STATUS.md** - Phase 3 status, overall implementation progress
- **ARCHITECTURE.md** - Hook patterns (Section 3), database schema (Section 4), UI patterns (Section 6)
- **DESIGN.md** - Full specifications, wireframes, analytics definitions

---

## Module Overview

The Medications module enables dog owners to track daily medication doses with precision timing. It's designed for dogs on behavioral medications (e.g., Gabapentin, Fluoxetine) where consistent dosing schedules are critical for effectiveness.

### Primary Use Cases
1. **Quick dose logging** - One-tap to confirm a scheduled dose was given
2. **Timing adherence tracking** - Monitor on-time vs late vs missed doses
3. **Cross-module correlation** - Analyze medication timing against reactivity incidents and separation anxiety outcomes

### Key Requirements
- Support multiple medications per dog
- Support multiple doses per medication per day (e.g., morning/evening)
- Track target time vs actual time with delta calculation
- Calculate adherence metrics (on-time, late, missed)
- Fully offline via IndexedDB/Dexie

---

## Component Hierarchy

### Current State (Placeholder)
```
src/components/Medications/
  index.ts                 # Barrel export: export { MedicationsScreen } from './MedicationsScreen'
  MedicationsScreen.tsx    # Placeholder "Coming Soon" screen (uses Header, useNavigate)
  .gitkeep
```

### Target Component Structure (from DESIGN.md)
```
src/components/Medications/
  index.ts
  MedicationsScreen.tsx        # Main container with bottom nav
  QuickLog/
    TodaysDoses.tsx            # Main quick log view showing all scheduled doses
    DoseCheckbox.tsx           # Individual dose checkbox with timing display
  LogDose/
    DoseForm.tsx               # Full form for logging/editing a dose
  History/
    MedHistory.tsx             # Chronological list of logged doses with filters
  Analytics/
    AdherenceChart.tsx         # Progress bars showing adherence per medication
    ImpactAnalysis.tsx         # Cross-module correlation display
  Manage/
    MedicationConfig.tsx       # Add/edit/delete medication configurations
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| `MedicationsScreen` | Module container, routing between tabs (Log/History/Stats), bottom nav |
| `TodaysDoses` | Display today's scheduled doses grouped by medication, indicate logged vs pending |
| `DoseCheckbox` | Single dose entry: tap to log current time, show timing delta, status color |
| `DoseForm` | Full dose entry form: medication select, dose amount, actual time picker, notes |
| `MedHistory` | Paginated history list with filters (medication, timing status, date range) |
| `AdherenceChart` | Horizontal bar charts showing adherence percentage per medication |
| `ImpactAnalysis` | Display medication timing correlation with reactivity/SA outcomes |
| `MedicationConfig` | List configured meds, add new meds with dose schedules |

---

## Data Flow

### Data Layer Architecture
```
                            +----------------+
                            |   Components   |
                            +-------+--------+
                                    |
                                    v
                            +----------------+
                            | useMedications | <-- TO BE CREATED
                            +-------+--------+
                                    |
                                    v
                            +----------------+
                            |   Dexie/db     |
                            +-------+--------+
                                    |
                                    v
                            +----------------+
                            |   IndexedDB    |
                            +----------------+
```

### Required Hooks

**`useMedications.ts`** (NOT YET IMPLEMENTED)

Follow the pattern established in `src/hooks/useIncidents.ts`. The existing hooks return CRUD operations directly (not nested), use `useLiveQuery` for reactive data, and `nanoid()` for ID generation.

**Recommended pattern (based on useIncidents):**

```typescript
// src/hooks/useMedications.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import { db } from '../db';
import type { MedicationConfig, MedicationEntry } from '../types';

interface UseMedicationConfigsOptions {
  // No pagination needed for configs (small dataset per dog)
}

/**
 * Hook for MedicationConfig CRUD operations
 */
export function useMedicationConfigs(dogId: string) {
  const configs = useLiveQuery(
    async () => {
      return db.medicationConfigs
        .where('dogId')
        .equals(dogId)
        .toArray();
    },
    [dogId]
  );

  const isLoading = configs === undefined;

  const createMedication = async (config: Omit<MedicationConfig, 'id'>): Promise<string> => {
    const id = nanoid();
    await db.medicationConfigs.add({ ...config, id });
    return id;
  };

  const updateMedication = async (id: string, updates: Partial<MedicationConfig>): Promise<void> => {
    await db.medicationConfigs.update(id, updates);
  };

  const deleteMedication = async (id: string): Promise<void> => {
    await db.medicationConfigs.delete(id);
  };

  return {
    configs: configs || [],
    isLoading,
    createMedication,
    updateMedication,
    deleteMedication,
  };
}

interface UseMedicationEntriesOptions {
  date?: string;  // Filter to specific date (e.g., "2024-12-25")
  medicationId?: string;  // Filter to specific medication
}

/**
 * Hook for MedicationEntry CRUD operations
 */
export function useMedicationEntries(dogId: string, options?: UseMedicationEntriesOptions) {
  const { date, medicationId } = options || {};

  const entries = useLiveQuery(
    async () => {
      if (date) {
        return db.medicationEntries
          .where('[dogId+date]')
          .equals([dogId, date])
          .toArray();
      }
      if (medicationId) {
        return db.medicationEntries
          .where('[dogId+medicationId]')
          .equals([dogId, medicationId])
          .toArray();
      }
      return db.medicationEntries
        .where('dogId')
        .equals(dogId)
        .toArray();
    },
    [dogId, date, medicationId]
  );

  const isLoading = entries === undefined;

  const logDose = async (entry: Omit<MedicationEntry, 'id'>): Promise<string> => {
    const id = nanoid();
    await db.medicationEntries.add({ ...entry, id });
    return id;
  };

  const updateEntry = async (id: string, updates: Partial<MedicationEntry>): Promise<void> => {
    await db.medicationEntries.update(id, updates);
  };

  const deleteEntry = async (id: string): Promise<void> => {
    await db.medicationEntries.delete(id);
  };

  return {
    entries: entries || [],
    isLoading,
    logDose,
    updateEntry,
    deleteEntry,
  };
}
```

**TodaysDoseStatus helper type (recommended pattern for UI logic - NOT YET IN CODEBASE):**

```typescript
// This is a suggested type pattern for UI components, not an existing export
interface TodaysDoseStatus {
  medication: MedicationConfig;
  doseSchedule: DoseSchedule;
  entry?: MedicationEntry;  // undefined if not yet logged
  status: 'pending' | 'on-time' | 'late' | 'missed';  // Matches adherence terminology
  timeDelta?: number;  // minutes from target, if logged
}
```

**Note**: Unlike the original proposed interface, this pattern creates TWO separate hooks (`useMedicationConfigs` and `useMedicationEntries`) following the single-responsibility approach used in the codebase.

### Database Tables (Already Defined)

From `/home/mattc/projects/reactivity-helper/src/db/index.ts`:

```typescript
// Medication configs - queryable by dogId
medicationConfigs: 'id, dogId, name'

// Medication entries - compound index for date-based queries
medicationEntries: 'id, dogId, date, medicationId, [dogId+date], [dogId+medicationId]'
```

Existing query helpers:
- `getMedicationEntriesInRange(dogId, startDate, endDate)`
- `getMedicationEntriesByMedication(dogId, medicationId)`

**Note**: These are standalone async functions, not React hooks. For reactive data in components, use the `useMedicationConfigs` and `useMedicationEntries` hooks instead.

---

## Data Models

### MedicationConfig
Defines a medication and its dosing schedule.

```typescript
interface MedicationConfig {
  id: string;           // nanoid() generated
  dogId: string;        // References Dog
  name: string;         // 1-50 chars, e.g., "Gabapentin", "Fluoxetine"
  doses: DoseSchedule[]; // Multiple daily doses
  notes?: string;       // Optional notes about the medication
}
```

**Example:**
```typescript
{
  id: "med_abc123",
  dogId: "dog_xyz789",
  name: "Gabapentin",
  doses: [
    { id: "dose_1", label: "Morning", targetTime: "08:00", defaultDose: 100 },
    { id: "dose_2", label: "Evening", targetTime: "20:00", defaultDose: 100 }
  ],
  notes: "For anxiety - give with food"
}
```

### DoseSchedule
Defines a single scheduled dose within a medication.

```typescript
interface DoseSchedule {
  id: string;           // nanoid() generated
  label: string;        // "Morning", "Evening", "Daily", "Noon", etc.
  targetTime: string;   // 24-hour format string: "08:00", "14:30", "20:00"
  defaultDose: number;  // in mg (0.1-1000, 1 decimal place precision)
}
```

### MedicationEntry
A single logged dose.

```typescript
interface MedicationEntry {
  id: string;           // nanoid() generated
  dogId: string;        // References Dog
  date: string;         // ISO 8601 date: "2024-12-25" (calendar day)
  medicationId: string; // References MedicationConfig.id
  doseScheduleId: string; // References which DoseSchedule (morning/evening/etc)
  targetTime: string;   // 24-hour format, copied from schedule at log time
  actualTime: string;   // 24-hour format, when actually given
  dose: number;         // in mg, allows override of default
  notes?: string;       // Max 1000 chars
  tags?: string[];      // Max 10 tags, each 1-30 chars
}
```

**Example:**
```typescript
{
  id: "entry_abc123",
  dogId: "dog_xyz789",
  date: "2024-12-25",
  medicationId: "med_abc123",
  doseScheduleId: "dose_1",
  targetTime: "08:00",
  actualTime: "08:23",
  dose: 100,
  notes: "Gave with breakfast"
}
```

---

## Dose Scheduling

### Multiple Daily Doses

The system supports multiple doses per day through the `doses` array in `MedicationConfig`. Common patterns:

| Pattern | doses Array |
|---------|-------------|
| Once daily | `[{ label: "Daily", targetTime: "09:00", defaultDose: 20 }]` |
| Twice daily | `[{ label: "Morning", targetTime: "08:00", ... }, { label: "Evening", targetTime: "20:00", ... }]` |
| Three times daily | Morning, Noon, Evening schedules |

### Target Time Semantics

- `targetTime` on `DoseSchedule` is the ideal time to give the dose
- `targetTime` on `MedicationEntry` is copied from the schedule at log time (preserves history if schedule changes)
- Times are 24-hour format strings: "08:00", "14:30", "20:00"

### Generating Today's Expected Doses

To show "Today's Doses" UI:

```typescript
async function getTodaysDoses(dogId: string): Promise<TodaysDoseStatus[]> {
  // Note: No formatDateISO helper exists in codebase; use native JS
  const today = new Date().toISOString().split('T')[0]; // "2024-12-25"
  const medications = await db.medicationConfigs.where('dogId').equals(dogId).toArray();
  const todaysEntries = await db.medicationEntries.where('[dogId+date]').equals([dogId, today]).toArray();

  const doses: TodaysDoseStatus[] = [];

  for (const med of medications) {
    for (const schedule of med.doses) {
      const entry = todaysEntries.find(
        e => e.medicationId === med.id && e.doseScheduleId === schedule.id
      );

      doses.push({
        medication: med,
        doseSchedule: schedule,
        entry,
        status: calculateStatus(schedule, entry),  // Returns 'pending' | 'on-time' | 'late' | 'missed'
        timeDelta: entry ? calculateTimeDelta(schedule.targetTime, entry.actualTime) : undefined
      });
    }
  }

  return doses;
}
```

---

## Adherence Tracking

### Timing Categories

From DESIGN.md specifications:

| Category | Definition | UI Color |
|----------|------------|----------|
| **On-time** | Logged within +/-30 minutes of target | Green |
| **Late** | Logged >30 minutes after target | Yellow (warning) if <60min, Red if >60min |
| **Missed** | Not logged by end of calendar day | Red |

### Time Delta Calculation

```typescript
/**
 * Calculate time difference in minutes between target and actual
 * Positive = late, Negative = early
 *
 * NOTE: This is a simplified example for same-day doses. For doses spanning
 * midnight (e.g., 23:00 target logged at 00:15), you need additional logic
 * to handle day boundary - see "Doses spanning midnight" in Edge Cases section.
 */
function calculateTimeDelta(targetTime: string, actualTime: string): number {
  const [targetHour, targetMin] = targetTime.split(':').map(Number);
  const [actualHour, actualMin] = actualTime.split(':').map(Number);

  const targetMinutes = targetHour * 60 + targetMin;
  const actualMinutes = actualHour * 60 + actualMin;

  let delta = actualMinutes - targetMinutes;

  // Handle midnight crossing: if delta is very negative, assume next day
  // e.g., target 23:00 (1380), actual 00:15 (15) -> -1365 becomes +75
  if (delta < -720) {  // More than 12 hours early = probably next day
    delta += 1440;  // Add 24 hours in minutes
  }

  return delta;
}
```

### Adherence Metrics

```typescript
interface AdherenceMetrics {
  // Per medication
  adherenceByMedication: Record<string, number>;  // % of expected doses logged

  // Timing breakdown
  onTimeRate: number;      // % within +/-30 min
  lateRate: number;        // % >30 min late but logged
  missedRate: number;      // % not logged

  // Over time
  avgTimeDelta: number;    // Average minutes early/late
  timingTrend: { date: string; avgDelta: number }[];
}
```

### Cross-Module Correlation

The medication module provides data for analyzing correlation with other modules:

```typescript
// Derived from DESIGN.md MedicationAnalytics interface
// NOTE: DESIGN.md uses `missedDoses: { date: Date; ... }[]` for tracking individual misses,
// while this interface shows aggregated rates. Use whichever fits your UI needs.
interface MedicationCorrelation {
  // Reactivity impact
  avgIncidentIntensityByMedTiming: {
    onTime: number;   // avg intensity when meds on-time
    late: number;     // avg intensity when meds late
    missed: number;   // avg intensity when meds missed
  };

  // Separation Anxiety impact
  avgDepartureDurationByMedTiming: {
    onTime: number;
    late: number;
    missed: number;
  };
  departureSuccessRateByMedTiming: {
    onTime: number;   // % hitting target
    late: number;
    missed: number;
  };
}
```

**Correlation Rules (from DESIGN.md):**
- A dose affects incidents/departures on the SAME calendar day (local time)
- Morning dose lateness affects all same-day entries
- Evening dose lateness only affects entries after its target time

---

## Implementation Status

> See also: `docs/STATUS.md` (Phase 3 section) for project-wide tracking

### Exists (Ready to Use)

| Item | Location | Notes |
|------|----------|-------|
| TypeScript types | `src/types/medications.ts` | `MedicationConfig`, `MedicationEntry`, `DoseSchedule` |
| Type exports | `src/types/index.ts` | Barrel export via `export * from './medications'` |
| Database tables | `src/db/index.ts` | `medicationConfigs`, `medicationEntries` |
| Database helpers | `src/db/index.ts` | `getMedicationEntriesInRange()`, `getMedicationEntriesByMedication()` |
| Placeholder screen | `src/components/Medications/MedicationsScreen.tsx` | Shows "Coming Soon" |

### NOT YET BUILT

| Item | Notes |
|------|-------|
| `useMedicationConfigs` hook | Follow `useIncidents` pattern |
| `useMedicationEntries` hook | Follow `useIncidents` pattern |
| `TodaysDoses` component | Quick log view |
| `DoseCheckbox` component | Individual dose toggle |
| `DoseForm` component | Full dose entry form |
| `MedHistory` component | History with filters |
| `AdherenceChart` component | Recharts-based |
| `ImpactAnalysis` component | Cross-module correlation |
| `MedicationConfig` component | Manage medications |

**Note**: Time picker can use native HTML5 `<input type="time">` - no custom component required. This provides native mobile pickers on iOS/Android, which is ideal for the PWA context.

### Implementation Priority (from DESIGN.md Phase 3)

1. Medication configuration (add/edit meds)
2. Quick Med Log with today's dose checkboxes
3. Log Dose form with time picker
4. Medication history list
5. Basic adherence tracking

---

## Domain Considerations

### Edge Cases to Handle

#### Time Window Edge Cases
- **Doses spanning midnight**: A dose at 23:00 logged at 00:15 next day is 1hr 15min late, not 23hr 45min early
- **Time zones**: All times stored/compared in local timezone; user travels and logs doses - respect device timezone at log time
- **Schedule changes**: If user changes targetTime on a schedule, existing entries preserve their original targetTime

#### Missed Dose Detection
- A dose is "missed" if not logged by end of calendar day
- Detection should run when:
  - User opens app (check if yesterday has missed doses)
  - Daily at a reasonable cutoff (e.g., 3am next day)
- Missed doses should NOT auto-create entries; just flag in analytics

#### Multiple Dogs
- Data model supports multi-dog (`dogId` on all entities)
- v1 UI is single-dog; ensure hooks filter by `dogId`

#### Dose Overrides
- User can change dose amount when logging (e.g., vet says give half dose)
- UI should show default but allow edit
- Entry stores actual dose given, not defaultDose from schedule

#### Medication Discontinuation
- Deleting a `MedicationConfig` should NOT delete historical entries
- Consider soft-delete or "archived" status for discontinued meds
- Historical entries should still display correctly in history/analytics

### UI Considerations

#### Quick Log Flow
1. User opens Medications tab
2. Sees today's doses grouped by medication
3. Unchecked boxes = pending doses
4. Tap checkbox = log dose at current time with default dose
5. Shows timing delta immediately ("+23 min" in green/yellow/red)

#### Visual Feedback
| State | Visual | Tailwind Classes |
|-------|--------|------------------|
| Pending | Empty checkbox, gray text | `text-gray-500`, `bg-gray-100` |
| On-time (within +/-30min) | Green checkbox, green delta text | `text-green-600`, `bg-green-100` |
| Late (<60min after target) | Yellow checkbox, yellow delta text | `text-yellow-600`, `bg-yellow-100` |
| Late (>60min after target) | Orange/red checkbox, red delta text | `text-red-600`, `bg-red-100` |
| Missed (not logged by EOD) | Red X, red "Missed" text | `text-red-600`, `bg-red-100` |

#### Touch Targets
- Minimum 44px touch targets per DESIGN.md mobile requirements
- Use `min-h-11` Tailwind class (11 * 4px = 44px)

#### Offline Behavior
- All operations must work offline (Dexie handles this)
- No network requests needed
- Data syncs automatically when user opens app

---

## File Locations

| Purpose | Path | Notes |
|---------|------|-------|
| Types | `src/types/medications.ts` | Exported via `src/types/index.ts` |
| Database | `src/db/index.ts` | Tables + helper functions |
| Components | `src/components/Medications/` | Currently placeholder only |
| Hooks (TO CREATE) | `src/hooks/useMedications.ts` | Does not exist yet |
| Full spec | `DESIGN.md` | See "Medication Module" section |

### Related Files

| Purpose | Path | Notes |
|---------|------|-------|
| Reference hook | `src/hooks/useIncidents.ts` | Pattern to follow for useMedications |
| DogContext | `src/context/DogContext.tsx` | Provides `useDog()` for active dog |
| Common components | `src/components/common/` | Header, BottomNav |

### About useDog

There are TWO `useDog` exports in this codebase:

1. **`useDog` from `src/context/DogContext.tsx`** (via `src/context/index.ts`)
   - Returns `{ activeDog, isLoading, error }`
   - Must be used within `DogProvider`
   - Use this for accessing the currently selected dog

2. **`useDog` from `src/hooks/useDog.ts`**
   - Returns `{ dog, isLoading, createDog, updateDog }`
   - Standalone hook for dog CRUD
   - Used primarily in first-run flow

**For Medications module**: Import `useDog` from `'../context'` to get the active dog ID.

---

## Implementation Checklist

When implementing this module, use the following checklist. These are implementation STEPS within the project's Phase 3 (Medication Module).

### Step 1: Core Infrastructure
- [ ] Create `useMedicationConfigs` hook following `useIncidents` pattern
- [ ] Create `useMedicationEntries` hook following `useIncidents` pattern
- [ ] Add `useLiveQuery` for reactive medication configs
- [ ] Add `useLiveQuery` for reactive entries by date
- [ ] Implement CRUD operations with `nanoid()` for IDs

### Step 2: Quick Log UI
- [ ] Build `TodaysDoses` container component
- [ ] Build `DoseCheckbox` with status colors
- [ ] Implement one-tap logging at current time
- [ ] Show timing delta with appropriate colors

### Step 3: Full Dose Form
- [ ] Build `DoseForm` component
- [ ] Implement time picker using HTML5 `<input type="time">` (no custom component needed)
- [ ] Allow dose amount override
- [ ] Support notes and tags

### Step 4: Medication Management
- [ ] Build `MedicationConfig` list view
- [ ] Build add/edit medication form
- [ ] Support multiple dose schedules per medication
- [ ] Handle medication deletion gracefully (soft-delete or archive)

### Step 5: History
- [ ] Build `MedHistory` with infinite scroll
- [ ] Implement filters (medication, timing status, date range)

> **Note**: `AdherenceChart` and `ImpactAnalysis` are deferred to Phase 5 (Analytics). See `docs/STATUS.md` for phase breakdown.

---

## References

| Document | Purpose |
|----------|---------|
| `DESIGN.md` | Full specification: data models, UI wireframes, analytics definitions |
| `docs/STATUS.md` | Implementation status, known issues, technical debt |
| `docs/ARCHITECTURE.md` | Hook patterns, database schema, UI patterns |
| `src/hooks/useIncidents.ts` | Reference implementation for Dexie hooks |
| `CLAUDE.md` | Agent workflow (use `dexie-helper` agent for database work) |

### Dependencies (npm packages available)

- `dexie` + `dexie-react-hooks` - IndexedDB wrapper with reactive queries
- `nanoid` - ID generation
- `react-router-dom` - Navigation
- `recharts` - Charts (for analytics phase)
