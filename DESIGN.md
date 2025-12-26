# Reactivity Helper - PWA Design Document

## Overview
A mobile-first PWA for logging dog anxiety and reactivity incidents in real-time with minimal friction, while capturing full context and providing meaningful analytics.

The app includes three distinct modules:
1. **Reactivity Tracking** - For logging reactive incidents during walks/outings
2. **Separation Anxiety Training** - For logging departures and tracking progress toward duration goals
3. **Medication Tracking** - For logging daily medications, analyzable against both modules

---

## Core Philosophy
**"Balanced logging"** - Smart defaults enable 2-3 tap logging for common scenarios, with easy expansion for full context when needed.

---

## Data Model

### Dog
```typescript
interface Dog {
  id: string;
  name: string;
}

// v1: Single dog only. On first run, prompt for dog name and create.
// Future: Add dog selector in header for multi-dog support.
```

### User Settings
```typescript
interface UserSettings {
  activeDogId: string;        // The current dog (v1: always the single dog)
  recentTags: string[];       // Last 10 used tags for quick-add suggestions
  darkMode: boolean;
}
```

### Named Location
```typescript
interface NamedLocation {
  id: string;
  dogId: string;          // References Dog
  name: string;           // "Home", "Central Park", "Vet", etc.
  lat: number;
  lng: number;
  radiusMeters: number;   // Default 50m for auto-matching
}

// On incident log: capture GPS, auto-match against NamedLocations within radius.
// If multiple match, use smallest radius. If no match, offer "Save this location?" chip.
```

### Incident
```typescript
interface Incident {
  id: string;
  dogId: string;          // References Dog
  timestamp: string;      // ISO 8601 (e.g., "2024-12-25T14:30:00.000Z")

  // Core (required)
  trigger: TriggerType;
  intensity: 1 | 2 | 3 | 4 | 5;  // 1=mild alert, 5=full reaction

  // Context (optional with smart defaults)
  location?: {
    lat: number;
    lng: number;
    namedLocationId?: string;  // References NamedLocation.id if auto-matched
  };
  duration?: 'brief' | 'moderate' | 'prolonged';  // <10s, 10-60s, >60s

  // Behaviors (multi-select, optional)
  dogBehaviors?: DogBehavior[];

  // Handler response
  handlerResponse?: HandlerResponse;

  // Freeform
  notes?: string;         // Max 1000 chars
  tags?: string[];        // User-defined tags, max 10 tags, each 1-30 chars

  // Metadata
  distance?: 'far' | 'medium' | 'close';  // Distance to trigger
}

type TriggerType =
  | 'dog' | 'person' | 'bike' | 'car' | 'skateboard'
  | 'loud_noise' | 'child' | 'jogger' | 'other';

type DogBehavior =
  | 'barking' | 'lunging' | 'growling' | 'whining'
  | 'freezing' | 'hackling' | 'pulling' | 'hiding';

type HandlerResponse =
  | 'redirected' | 'treated' | 'removed' | 'waited_out'
  | 'counter_conditioned' | 'other';
```

---

## Separation Anxiety Module

### Weekly Target
```typescript
interface WeeklyTarget {
  id: string;
  dogId: string;            // References Dog
  weekStart: string;        // ISO 8601 date of Monday (e.g., "2024-12-23")
  targetDuration: number;   // Target duration in minutes (0-480)
  notes?: string;
}

// Weeks start Monday (ISO 8601). All calculations use local timezone.
```

### Departure Log
```typescript
interface Departure {
  id: string;
  dogId: string;              // References Dog
  timestamp: string;          // ISO 8601 (e.g., "2024-12-25T14:30:00.000Z")

  // Core (required for quick log)
  duration: number;           // Actual duration in minutes (0-480)
  exitType: ExitType;
  outcome: 'calm' | 'okay' | 'rough';

  // Pre-departure context (optional - details expander)
  preDepartureState?: DogState;
  exerciseBeforehand?: ExerciseType;
  timeSinceLastMeal?: number;  // Minutes

  // Departure details (optional - details expander)
  departureCues?: DepartureCue[];
  confinementSetup?: ConfinementType;
  companionsRemaining?: Companion[];
  externalFactors?: string[];  // Construction, weather, delivery, etc.

  // Enrichment (optional - details expander)
  enrichment?: Enrichment[];

  // Behavior during departure (optional - from camera observation)
  behaviorLog?: BehaviorEntry[];

  // Return (optional - details expander)
  returnBehavior?: ReturnBehavior;
  distressEvidence?: DistressEvidence[];

  // Freeform
  notes?: string;             // Max 1000 chars
  tags?: string[];            // User-defined tags, max 10 tags, each 1-30 chars
}

type DogState =
  | 'calm' | 'relaxed' | 'tired' | 'anxious'
  | 'hyper' | 'alert' | 'neutral';

type ExerciseType =
  | 'walk' | 'run' | 'play_session' | 'training'
  | 'sniff_walk' | 'fetch' | 'none';

type DepartureCue =
  | 'grabbed_jacket' | 'grabbed_keys' | 'grabbed_backpack'
  | 'grabbed_purse' | 'showered' | 'got_dressed'
  | 'put_on_shoes' | 'turned_on_white_noise'
  | 'gave_chew' | 'gave_enrichment' | 'said_goodbye'
  | 'used_cue_word' | 'other';

type ExitType =
  | 'front_door' | 'garage_door' | 'back_door'
  | 'no_exit';  // Practice session without leaving

type ConfinementType =
  | 'crate' | 'gated_room' | 'closed_room' | 'free_roam'
  | 'penned_area';

type Companion =
  | 'alone' | 'other_dog' | 'other_pet' | 'person';

interface Enrichment {
  type: EnrichmentType;
  engagementLevel?: 'ignored' | 'engaged' | 'finished' | 'partial';
}

type EnrichmentType =
  | 'frozen_kong' | 'kong' | 'puzzle_feeder' | 'bully_stick'
  | 'snuffle_mat' | 'lick_mat' | 'chew' | 'toppl'
  | 'other';

// BehaviorEntry: Logged manually during or after camera observation
interface BehaviorEntry {
  minuteMark: number;  // Minutes from start of departure when behavior occurred
  behavior: DepartureBehavior;
  intensity?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

type DepartureBehavior =
  | 'calm' | 'resting' | 'sleeping' | 'playing'
  | 'pacing' | 'whining' | 'barking' | 'howling'
  | 'scratching_door' | 'destructive' | 'drooling'
  | 'panting' | 'escape_attempt' | 'elimination';

type ReturnBehavior =
  | 'calm' | 'normal_greeting' | 'excited'
  | 'over_excited' | 'frantic' | 'clingy';

type DistressEvidence =
  | 'none' | 'destruction' | 'elimination' | 'drooling'
  | 'self_harm' | 'escape_damage' | 'moved_objects';
```

### Derived Departure Analytics
```typescript
// Computed from departure data + weekly targets:
// - Target attempt: departure >= 75% of weekly target duration
// - Warmup: departure < 75% of weekly target duration
interface DepartureAnalytics {
  // Target tracking
  weeklyTargetHitRate: number;  // % of departures >= target duration
  targetAttempts: Departure[];  // Departures >= 75% of target duration
  warmupDepartures: Departure[];  // Departures < 75% of target

  // Progression (derived by comparing weekly averages)
  progressionStatus: 'advancing' | 'maintaining' | 'regressing';
  averageDurationThisWeek: number;
  averageDurationLastWeek: number;
  longestSuccessfulDeparture: number;

  // Patterns
  bestTimeOfDay: string;
  bestPreDepartureState: DogState;
  mostEffectiveEnrichment: EnrichmentType;
  cuesThatIncreaseAnxiety: DepartureCue[];
}

// Analytics Algorithm Definitions:
// - progressionStatus:
//   - 'advancing': this week's avg duration >= last week's + 10%
//   - 'regressing': this week's avg duration <= last week's - 10%
//   - 'maintaining': within ±10%
// - cuesThatIncreaseAnxiety: cues appearing in ≥50% of 'rough' departures
//   AND <25% of 'calm' departures (requires min 5 departures)
// - mostEffectiveEnrichment: enrichment type with highest 'calm' rate
//   (requires min 3 uses; tie-breaker: highest engagement rate)
// - bestTimeOfDay: 2-hour window with highest 'calm' rate (min 3 departures)
```

---

## Medication Module

### Medication Configuration
```typescript
interface MedicationConfig {
  id: string;
  dogId: string;          // References Dog
  name: string;           // 1-50 chars
  doses: DoseSchedule[];  // Each scheduled dose per day
  notes?: string;
}

interface DoseSchedule {
  id: string;
  label: string;          // "Morning", "Evening", "Daily", etc.
  targetTime: string;     // 24-hour format: "08:00", "20:00"
  defaultDose: number;    // in mg (0.1-1000, 1 decimal place)
}

// Example configurations:
// Gabapentin: [
//   { label: "Morning", targetTime: "08:00", defaultDose: 100 },
//   { label: "Evening", targetTime: "20:00", defaultDose: 100 }
// ]
// Fluoxetine: [
//   { label: "Daily", targetTime: "09:00", defaultDose: 20 }
// ]
```

### Medication Log Entry
```typescript
interface MedicationEntry {
  id: string;
  dogId: string;          // References Dog
  date: string;           // ISO 8601 date (e.g., "2024-12-25") - the calendar day
  medicationId: string;   // References MedicationConfig
  doseScheduleId: string; // References which scheduled dose (morning/evening/etc)
  targetTime: string;     // 24-hour format: "08:00" (copied from schedule)
  actualTime: string;     // 24-hour format: "08:23" (when actually given)
  dose: number;           // in mg (allows override of default)
  notes?: string;         // Max 1000 chars
  tags?: string[];        // User-defined tags, max 10 tags, each 1-30 chars
}

// Derived: timeDelta = actualTime - targetTime (positive = late, negative = early)
```

### Medication Analytics
```typescript
// Cross-module analysis capabilities:
// - A dose is considered "missed" if not logged by end of day
// - "Late" = logged but >30 min after target time
// - "On-time" = logged within ±30 min of target time
//
// Cross-module correlation rules:
// - A dose affects incidents/departures on the SAME calendar day (local time)
// - Morning dose lateness affects all same-day entries
// - Evening dose lateness only affects entries after its target time
interface MedicationAnalytics {
  // Adherence
  adherenceByMedication: Record<string, number>;  // % of expected doses logged
  missedDoses: { date: Date; medication: string; doseLabel: string }[];  // Not logged by end of day

  // Timing accuracy
  avgTimeDeltaByDose: Record<string, number>;  // Avg minutes early/late per dose schedule
  onTimeRate: number;  // % of doses within ±30 min of target
  timingTrend: { date: Date; avgDelta: number }[];

  // Correlation with Reactivity
  avgIncidentIntensityByMedTiming: {
    onTime: number;    // Incidents when meds given within window
    late: number;      // Incidents when meds >30 min late
    missed: number;    // Incidents when meds missed
  };
  incidentCountByMedTiming: {
    onTime: number;
    late: number;
    missed: number;
  };

  // Correlation with Separation Anxiety
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

  // Trends
  dailyAdherenceTrend: { date: Date; adherence: number }[];
}
```

---

## User Interface

### Module Selection (Home)
```
┌─────────────────────────────┐
│  🐕 Reactivity Helper       │
├─────────────────────────────┤
│                             │
│  ┌─────────────────────────┐│
│  │  🚶 Reactivity          ││
│  │  Log reactive incidents ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │  🏠 Separation Anxiety  ││
│  │  Log departures         ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │  💊 Medications         ││
│  │  Log doses              ││
│  └─────────────────────────┘│
│                             │
└─────────────────────────────┘
```

---

## Reactivity Module UI

### Screen 1: Quick Log (Home)
The primary interface - optimized for speed.

```
┌─────────────────────────────┐
│  🐕 Reactivity Helper       │
├─────────────────────────────┤
│                             │
│  What triggered it?         │
│  ┌─────┐ ┌─────┐ ┌─────┐   │
│  │ 🐕  │ │ 🧑  │ │ 🚴  │   │
│  │ Dog │ │Person│ │Bike │   │
│  └─────┘ └─────┘ └─────┘   │
│  ┌─────┐ ┌─────┐ ┌─────┐   │
│  │ 🚗  │ │ 🔊  │ │ ••• │   │
│  │ Car │ │Noise│ │Other│   │
│  └─────┘ └─────┘ └─────┘   │
│                             │
│  Intensity:                 │
│  ① ② ③ ④ ⑤                 │
│  mild ────────── reactive   │
│                             │
│  ┌─────────────────────────┐│
│  │   + Add More Details    ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │        LOG IT ✓         ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

**Flow:**
1. Tap trigger (required) - 1 tap
2. Tap intensity (required) - 1 tap
3. Tap "LOG IT" - 1 tap
4. **Done in 3 taps!**

**Optional expansion ("+ Add More Details"):**
- Behaviors (multi-select chips)
- Handler response (single-select)
- Distance to trigger
- Duration
- Tags (chip input with recent suggestions)
- Notes

### Screen 2: History
Chronological list of incidents with filters.

```
┌─────────────────────────────┐
│  📋 History        [Filter] │
├─────────────────────────────┤
│  Today                      │
│  ┌─────────────────────────┐│
│  │ 🐕 Dog  ④  10:23 AM     ││
│  │ Barking, Lunging        ││
│  │ 📍 Central Park         ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ 🧑 Person  ②  9:45 AM   ││
│  │ Alerting                ││
│  │ 📍 Home                 ││
│  └─────────────────────────┘│
│  Yesterday                  │
│  ...                        │
└─────────────────────────────┘
```

### Screen 3: Analytics
Visual trends and insights. Time range selector: 7d, 30d, 90d, All.

```
┌─────────────────────────────┐
│  📊 Analytics    [7d ▼]     │
├─────────────────────────────┤
│  Incidents This Week: 12    │
│  Avg Intensity: 2.8         │
│  ┌─────────────────────────┐│
│  │  📈 Intensity Over Time ││
│  │  [line chart]           ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │  🥧 Triggers Breakdown  ││
│  │  [pie chart]            ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │  📍 Location Hotspots   ││
│  │  [simple list/map]      ││
│  └─────────────────────────┘│
│  Progress: ↓15% vs last wk  │
└─────────────────────────────┘
```

### Screen 4: Settings
Configuration and data management.

- Named locations (Home, Park, Vet, etc.)
- Default behaviors to pre-select
- Export data (JSON/CSV)
- Dark mode

---

## Separation Anxiety Module UI

### Screen 1: Quick Departure Log
Optimized for logging departures with sensible defaults.

```
┌─────────────────────────────┐
│  🏠 Departure Log           │
├─────────────────────────────┤
│                             │
│  Weekly Target: 45 min  [✏️]│
│                             │
│  Duration (minutes):        │
│  ┌─────────────────────────┐│
│  │         32              ││
│  │   [-5] [━━━━] [+5]      ││
│  └─────────────────────────┘│
│                             │
│  Exit type:                 │
│  ┌──────┐ ┌──────┐ ┌──────┐│
│  │Front │ │Garage│ │ None ││
│  └──────┘ └──────┘ └──────┘│
│                             │
│  How was he?                │
│  ┌──────┐ ┌──────┐ ┌──────┐│
│  │ 😌  │ │ 😐   │ │ 😰   ││
│  │Calm │ │Okay  │ │Rough ││
│  └──────┘ └──────┘ └──────┘│
│                             │
│  ┌─────────────────────────┐│
│  │   + Add More Details    ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │      LOG DEPARTURE ✓    ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

**Quick flow (4 taps):**
1. Adjust duration (or accept default)
2. Tap exit type
3. Tap overall outcome
4. LOG DEPARTURE

**Optional expansion ("+ Add More Details"):**
- Pre-departure state (calm, anxious, tired, etc.)
- Exercise beforehand
- Time since last meal
- Departure cues performed (multi-select chips)
- Confinement setup
- Companions remaining
- External factors
- Enrichment given + engagement level
- Behavior timeline entries
- Return behavior
- Distress evidence
- Tags (chip input with recent suggestions)
- Notes

### Screen 2: Set Weekly Target
```
┌─────────────────────────────┐
│  🎯 Weekly Target           │
├─────────────────────────────┤
│                             │
│  Week of Dec 23, 2024       │
│                             │
│  Target Duration:           │
│  ┌─────────────────────────┐│
│  │    45 minutes           ││
│  │  [-5] [━━━━━━] [+5]     ││
│  └─────────────────────────┘│
│                             │
│  Last week's target: 35 min │
│  Last week hit rate: 73%    │
│                             │
│  ┌─────────────────────────┐│
│  │       SAVE TARGET ✓     ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

### Screen 3: Departure History
```
┌─────────────────────────────┐
│  📋 Departures     [Filter] │
├─────────────────────────────┤
│  Today         Target: 45m  │
│  ┌─────────────────────────┐│
│  │ 🚪 Front  45m  2:30 PM  ││
│  │ ✅ Target hit! Calm     ││
│  │ Kong, White noise       ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ 🚗 Garage 20m  11:00 AM ││
│  │ ⬇️ Warmup - Calm        ││
│  │ Lick mat                ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ 🚪 Front  15m  9:30 AM  ││
│  │ ⬇️ Warmup - Calm        ││
│  └─────────────────────────┘│
│  Yesterday                  │
│  ...                        │
└─────────────────────────────┘
```

### Screen 4: Departure Analytics
```
┌─────────────────────────────┐
│  📊 SA Analytics   [7d ▼]   │
├─────────────────────────────┤
│  This Week                  │
│  Target: 45 min             │
│  Hit Rate: 4/6 (67%)        │
│  Avg Duration: 38 min       │
│  Longest: 52 min            │
│                             │
│  ┌─────────────────────────┐│
│  │  📈 Duration Over Time  ││
│  │  [line chart with       ││
│  │   target line overlay]  ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │  🔑 What's Working      ││
│  │  • Best time: 2-4 PM    ││
│  │  • Best state: tired    ││
│  │  • Best enrichment: Kong││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │  ⚠️ Watch Out For       ││
│  │  • Cues: grabbed keys   ││
│  └─────────────────────────┘│
│  Progress: ↑29% vs last wk  │
└─────────────────────────────┘
```

---

## Medication Module UI

### Screen 1: Quick Med Log
One-tap logging for routine doses.

```
┌─────────────────────────────┐
│  💊 Medications             │
├─────────────────────────────┤
│                             │
│  Today's Doses              │
│                             │
│  Gabapentin (100mg)         │
│  ┌───────────┐ ┌───────────┐│
│  │ ✅ Morning│ │ ⬜ Evening││
│  │ target 8a │ │ target 8p ││
│  │ actual 8:23a│ │   --    ││
│  │ +23 min   │ │           ││
│  └───────────┘ └───────────┘│
│                             │
│  Fluoxetine (20mg)          │
│  ┌─────────────────────────┐│
│  │ ✅ Daily    target 9a   ││
│  │ actual 9:05a   +5 min   ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │   + Log Dose Now        ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │   ⚙️ Manage Medications ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

**Flow:**
- Tap empty checkbox → logs current time with default dose
- Tap logged entry → edit actual time/dose
- Shows delta (green if early/on-time, yellow if <30 min late, red if >30 min late)
- "+ Log Dose Now" → manual entry with time picker

### Screen 2: Log Dose
```
┌─────────────────────────────┐
│  💊 Log Dose                │
├─────────────────────────────┤
│                             │
│  Medication:                │
│  ○ Gabapentin - Morning     │
│  ○ Gabapentin - Evening     │
│  ● Fluoxetine - Daily       │
│                             │
│  Target time: 9:00 AM       │
│                             │
│  Dose:                      │
│  ┌─────────────────────────┐│
│  │      20 mg              ││
│  └─────────────────────────┘│
│                             │
│  Actual time:               │
│  ┌─────────────────────────┐│
│  │      9:05 AM            ││
│  └─────────────────────────┘│
│  +5 min from target         │
│                             │
│  Notes (optional):          │
│  ┌─────────────────────────┐│
│  │                         ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │        LOG DOSE ✓       ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

### Screen 3: Medication History
```
┌─────────────────────────────┐
│  📋 Med History    [Filter] │
├─────────────────────────────┤
│  Today                      │
│  ┌─────────────────────────┐│
│  │ 💊 Fluoxetine Daily 20mg││
│  │    target 9a → 9:05a    ││
│  │    +5 min ✓             ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ 💊 Gabapentin AM  100mg ││
│  │    target 8a → 8:23a    ││
│  │    +23 min ✓            ││
│  └─────────────────────────┘│
│  Yesterday                  │
│  ┌─────────────────────────┐│
│  │ 💊 Gabapentin PM  100mg ││
│  │    target 8p → 9:15p    ││
│  │    +75 min ⚠️            ││
│  └─────────────────────────┘│
│  ...                        │
└─────────────────────────────┘
```

### Screen 4: Medication Analytics
```
┌─────────────────────────────┐
│  📊 Med Analytics  [30d ▼]  │
├─────────────────────────────┤
│  Adherence This Month       │
│                             │
│  Gabapentin (2x/day)        │
│  ████████████░░ 87%         │
│  Missed: 4 doses            │
│  Avg timing: +18 min        │
│                             │
│  Fluoxetine (1x/day)        │
│  ██████████████ 100%        │
│  Avg timing: +8 min         │
│                             │
│  On-time rate: 82%          │
│  (within ±30 min of target) │
│                             │
│  ┌─────────────────────────┐│
│  │  📈 Timing Trend        ││
│  │  [line chart: avg delta ││
│  │   over time]            ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │  🔗 Med Impact          ││
│  │  On-time days:          ││
│  │  • Reactivity: 2.1 avg  ││
│  │  • SA success: 78%      ││
│  │  Late (>30 min):        ││
│  │  • Reactivity: 2.8 avg  ││
│  │  • SA success: 61%      ││
│  │  Missed:                ││
│  │  • Reactivity: 3.4 avg  ││
│  │  • SA success: 52%      ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

### Screen 5: Manage Medications
```
┌─────────────────────────────┐
│  ⚙️ Manage Medications      │
├─────────────────────────────┤
│                             │
│  ┌─────────────────────────┐│
│  │ Gabapentin              ││
│  │ ├ Morning: 100mg @ 8 AM ││
│  │ └ Evening: 100mg @ 8 PM ││
│  │                    [✏️] ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ Fluoxetine              ││
│  │ └ Daily: 20mg @ 9 AM    ││
│  │                    [✏️] ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │   + Add Medication      ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

---

## Technical Architecture

### Stack
| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | React 18 + TypeScript | Type safety, ecosystem |
| Build | Vite + vite-plugin-pwa | Fast dev, PWA out of box |
| Storage | Dexie.js (IndexedDB) | Offline-first, reactive queries |
| Styling | Tailwind CSS | Rapid mobile-first UI |
| Charts | Recharts | React-native, lightweight |
| Routing | React Router v6 | Standard, simple |
| State | React Context + useReducer | Simple, no external deps |

### Project Structure
```
src/
├── components/
│   ├── Home/
│   │   └── ModuleSelector.tsx
│   ├── Reactivity/
│   │   ├── QuickLog/
│   │   │   ├── TriggerGrid.tsx
│   │   │   ├── IntensitySlider.tsx
│   │   │   └── DetailsExpander.tsx
│   │   ├── History/
│   │   │   ├── IncidentList.tsx
│   │   │   └── IncidentCard.tsx
│   │   └── Analytics/
│   │       ├── TrendChart.tsx
│   │       ├── TriggerPieChart.tsx
│   │       └── StatsSummary.tsx
│   ├── SeparationAnxiety/
│   │   ├── DepartureLog/
│   │   │   ├── DurationInput.tsx
│   │   │   ├── ExitTypeSelector.tsx
│   │   │   ├── OutcomeSelector.tsx
│   │   │   └── DetailsExpander.tsx
│   │   ├── WeeklyTarget/
│   │   │   └── TargetSetter.tsx
│   │   ├── History/
│   │   │   ├── DepartureList.tsx
│   │   │   └── DepartureCard.tsx
│   │   └── Analytics/
│   │       ├── DurationChart.tsx
│   │       ├── TargetHitRate.tsx
│   │       └── InsightsPanel.tsx
│   ├── Medications/
│   │   ├── QuickLog/
│   │   │   ├── TodaysDoses.tsx
│   │   │   └── DoseCheckbox.tsx
│   │   ├── LogDose/
│   │   │   └── DoseForm.tsx
│   │   ├── History/
│   │   │   └── MedHistory.tsx
│   │   ├── Analytics/
│   │   │   ├── AdherenceChart.tsx
│   │   │   └── ImpactAnalysis.tsx
│   │   └── Manage/
│   │       └── MedicationConfig.tsx
│   └── common/
│       ├── BottomNav.tsx
│       └── Header.tsx
├── hooks/
│   ├── useIncidents.ts       # Reactivity CRUD
│   ├── useDepartures.ts      # SA CRUD
│   ├── useWeeklyTargets.ts   # SA targets
│   ├── useMedications.ts     # Med config + entries
│   ├── useLocation.ts        # Geolocation
│   └── useAnalytics.ts       # Cross-module computed stats
├── db/
│   └── index.ts              # Dexie setup (all tables)
├── types/
│   ├── reactivity.ts
│   ├── separationAnxiety.ts
│   ├── medications.ts
│   └── index.ts
├── App.tsx
└── main.tsx
```

### PWA Configuration
```typescript
// vite.config.ts
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Reactivity Helper',
    short_name: 'ReactHelper',
    theme_color: '#4F46E5',
    icons: [/* ... */],
    display: 'standalone',
    start_url: '/',
  },
  workbox: {
    runtimeCaching: [/* offline strategies */]
  }
})
```

### Offline Strategy
- **All data in IndexedDB** - works completely offline
- **Service worker caches app shell** - instant load
- **No backend required for v1** - pure client-side
- Future: Optional cloud sync via Firebase/Supabase

### Technical Specifications

#### ID Generation
Use nanoid (21 chars, URL-safe, collision-resistant, works offline):
```typescript
import { nanoid } from 'nanoid';
const id = nanoid(); // "V1StGXR8_Z5jdHi6B-myT"
```

#### Date/Time Formats
| Field Type | Format | Example |
|------------|--------|---------|
| Timestamps | ISO 8601 with timezone | `"2024-12-25T14:30:00.000Z"` |
| Dates only | ISO 8601 date | `"2024-12-25"` |
| Times only | 24-hour HH:mm | `"08:00"`, `"14:30"` |

All stored as strings in IndexedDB. Display formatting uses locale at UI layer.

#### Validation Rules
| Field | Rule |
|-------|------|
| `notes` | Max 1000 chars |
| `tags` | Max 10 tags, each 1-30 chars |
| `duration` (SA) | 0-480 min (8 hours) |
| `intensity` | 1-5, enforced by UI |
| `dose` (mg) | 0.1-1000, 1 decimal place |
| `name` (dog, location, med) | 1-50 chars |

#### History Pagination
- Initial load: 20 most recent items
- Infinite scroll: load next 20 on scroll near bottom
- Grouped by date headers (Today, Yesterday, Dec 23, etc.)

#### Export Format
Full data export creates one JSON file per entity:
```
export-2024-12-25/
├── dogs.json
├── incidents.json
├── departures.json
├── weekly-targets.json
├── medications.json
├── medication-entries.json
└── named-locations.json
```
CSV export: flattened versions (arrays become comma-separated strings).

---

## iOS-Specific Considerations

### Storage & Data Persistence
| Issue | Solution |
|-------|----------|
| Safari limits IndexedDB (~50MB, can evict) | Call `navigator.storage.persist()` on first use; data size is small (text only) |
| No cloud backup by default | Add JSON export prominently; consider iCloud-based backup later |
| Data may be cleared if storage pressure | Show "Data is stored locally" reminder; export regularly |

### Installation & UX
| Issue | Solution |
|-------|----------|
| No install prompt on iOS | Show custom "Add to Home Screen" banner with instructions |
| No app store presence | Provide clear PWA installation guide in-app |
| Users may use Safari instead | Detect standalone mode, show banner if not installed |

### Viewport & Safe Areas
```html
<!-- Required meta tags for iOS -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" href="/icon-192.png">
```

```css
/* Safe area handling for notch + home indicator */
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
}
.header {
  padding-top: env(safe-area-inset-top);
}
body {
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

### Geolocation
| Issue | Solution |
|-------|----------|
| No background location | Capture location only when logging (foreground is fine for our use case) |
| Permission prompt | Request on first log attempt, not on app load |
| May be denied | Location is optional; app works without it |

### Service Worker Quirks
| Issue | Solution |
|-------|----------|
| iOS kills service workers aggressively | Use cache-first strategy; register SW on every page load |
| No background sync | Not needed for local-only app |
| iOS 16.4+ has push (limited) | Skip push notifications for v1; not critical for logging app |

### Testing Checklist (iOS-specific)
- [ ] Test on Safari iOS (primary browser engine)
- [ ] Test "Add to Home Screen" flow
- [ ] Verify standalone mode styling (no Safari UI)
- [ ] Check safe area insets on iPhone with notch
- [ ] Test after killing and reopening the app
- [ ] Verify data persists after device restart
- [ ] Test with location permission denied

---

## Implementation Phases

### Phase 1: Foundation + Reactivity MVP
- [ ] Project setup (Vite, React, TypeScript, Tailwind, PWA)
- [ ] Database setup (Dexie.js with all tables)
- [ ] Module selector home screen
- [ ] Reactivity: Quick Log screen with trigger grid + intensity
- [ ] Reactivity: Basic history list
- [ ] Bottom navigation
- [ ] PWA manifest + service worker

### Phase 2: Reactivity Full Context
- [ ] Reactivity: Details expander (behaviors, response, notes)
- [ ] Location capture (GPS + named locations)
- [ ] Reactivity: History filters
- [ ] Reactivity: Edit/delete incidents

### Phase 3: Medication Module
- [ ] Medication configuration (add/edit meds)
- [ ] Quick Med Log with today's dose checkboxes
- [ ] Log Dose form with time picker
- [ ] Medication history list
- [ ] Basic adherence tracking

### Phase 4: Separation Anxiety Module
- [ ] Weekly target setter
- [ ] Quick departure log (duration, exit type, outcome)
- [ ] Departure details expander (full context)
- [ ] Departure history list
- [ ] Edit/delete departures

### Phase 5: Analytics (All Modules)
- [ ] Reactivity: Stats summary, intensity trend, trigger breakdown
- [ ] Separation Anxiety: Duration chart, target hit rate, insights
- [ ] Medications: Adherence chart, calendar heatmap
- [ ] Cross-module: Med impact on reactivity + SA success
- [ ] Time-range selectors

### Phase 6: Polish
- [ ] Settings screen (per-module configurations)
- [ ] Data export (JSON/CSV, all modules)
- [ ] Dark mode
- [ ] Haptic feedback
- [ ] App icon + splash screen

---

## Key UX Decisions

### Reactivity Module
1. **Trigger-first flow** - The trigger buttons are primary because identifying "what" is the fastest mental decision in the moment.

2. **Intensity as numbers, not words** - "3" is faster to process than "moderate" when you're managing a reactive dog.

3. **Expandable details** - Don't force full context every time. Quick logs when hands are full, detailed logs when you have time.

4. **Auto-timestamp + location** - Reduce manual entry; these can be captured automatically.

### Separation Anxiety Module
5. **Duration-first flow** - The primary question after a departure is "how long?" - this is always visible and quick to adjust.

6. **Weekly targets, not daily** - SA training is measured in weekly progress. Daily variance is expected (warmups, intentional shorter sessions).

7. **Derived metrics over manual entry** - Progression status, previous departures today, warmup vs target attempts - all computed from data, not logged manually.

8. **Quick outcome (Calm/Okay/Rough)** - Captures essential success/failure without requiring detailed behavior log for every departure.

### Medication Module
9. **Checkbox-first for routine doses** - One tap to log a dose at current time. Editing is secondary.

10. **Cross-module correlation** - Medication timing is analyzed against both reactivity intensity and SA success rates to surface patterns.

### Global
11. **No account required** - All local storage. Lower friction, better privacy.

12. **Module-first navigation** - Clear separation between reactivity, SA, and meds. Each has its own log/history/analytics flow.

---

## Design Decisions

### Resolved in Initial Design
- Stack: React + TypeScript + Vite
- Logging approach: Balanced (quick with expandable details)
- Data: Full context available, minimal required
- Analytics: Important feature, included in scope

### v1 Scope Decisions
| Decision | Resolution |
|----------|------------|
| Weather tracking | Cut from v1 |
| Multi-dog support | Data model ready (`dogId` on all entities); v1 UI is single-dog only |
| Departure outcome | Added `outcome: 'calm' \| 'okay' \| 'rough'` for quick logging + analysis |
| dogBehaviors | Optional field (defaults to undefined) |
| BehaviorLog (SA) | Manual entry during or after camera observation |
| Edit entries | Tap card in history to edit (same form, pre-filled) |
| Delete entries | Swipe left on card, confirm modal |
| Missed medication | Defined as not given by end of day |
| Warmup threshold | <75% of weekly target = warmup; ≥75% = target attempt |
| Location matching | Both manual selection AND auto-match (~50m GPS radius) |
| Analytics time ranges | 7d, 30d, 90d, All |
| Tags | Optional on all entries; recent tags shown as suggestions |
| Departure duration | Post-hoc manual entry only; no timer in v1 |
| ID generation | nanoid (21 chars, URL-safe) |
| Date storage | ISO 8601 strings throughout |

### Navigation Design
Optimized for quick event logging (app opened during/after an event):
- **Module-first navigation**: Home → select module → module-specific tabs
- **Per-module tabs**: Log (primary), History, Analytics
- **Bottom nav** persists within each module for quick switching between log/history/analytics
- **Back to Home** via back arrow (←) in header or swipe right gesture

```
Navigation Structure:

┌─────────────────────────────┐
│      Home (Module Selector) │
│  ┌───────┐ ┌───────┐ ┌───────┐
│  │React. │ │  SA   │ │ Meds  │
│  └───────┘ └───────┘ └───────┘
└─────────────────────────────┘
         ↓ tap module card
┌─────────────────────────────┐
│ [←] Module Name      [⚙️]   │  ← Header with back + settings
├─────────────────────────────┤
│                             │
│      [Module Content]       │
│                             │
├─────────────────────────────┤
│  [Log]  [History]  [Stats]  │  ← Bottom nav (3 tabs per module)
└─────────────────────────────┘
```

### Edit/Delete Flows
- **Edit**: Tap card in history → opens same form as logging, pre-filled
- **Delete**: Swipe left on card → red delete button appears
- **Confirmation**: "Delete this entry?" modal with Cancel/Delete
- **v1 single dog**: No dog deletion option (would delete all data)

### Empty & Error States
| State | Message |
|-------|---------|
| First run (no dog) | "Welcome! What's your dog's name?" → name input |
| No incidents | "No incidents logged yet. Tap a trigger above to log your first one." |
| No departures | "No departures logged yet. Log your first practice session!" |
| No medications | "No medications set up. Tap 'Add Medication' to get started." |
| Charts with no data | Show chart frame with "Log a few more entries to see trends" |
| Charts with partial data | Show available data with note "Based on X entries" |
| Geolocation denied | Log without location; show subtle "📍 off" indicator |
| Geolocation error | Log without location; no error modal (location is optional) |

### Location Management
- **Settings → Locations**: List saved locations with edit/delete
- **Add location**: "Add Current Location" button uses GPS, or manual lat/lng entry
- **Auto-create prompt**: When logging incident without location match, show "Save this spot?" chip
- **Overlapping locations**: Use smallest radius match; tie-breaker: most recently created

---

## Next Steps
1. Approve this design
2. Scaffold project with Vite
3. Implement Phase 1 (MVP)
4. Test on mobile device
5. Iterate based on real usage
