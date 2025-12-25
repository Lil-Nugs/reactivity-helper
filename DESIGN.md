# Reactivity Helper - PWA Design Document

## Overview
A mobile-first PWA for logging dog anxiety and reactivity incidents in real-time with minimal friction, while capturing full context and providing meaningful analytics.

---

## Core Philosophy
**"Balanced logging"** - Smart defaults enable 2-3 tap logging for common scenarios, with easy expansion for full context when needed.

---

## Data Model

### Incident
```typescript
interface Incident {
  id: string;
  timestamp: Date;

  // Core (required)
  trigger: TriggerType;
  intensity: 1 | 2 | 3 | 4 | 5;  // 1=mild alert, 5=full reaction

  // Context (optional with smart defaults)
  location?: {
    lat: number;
    lng: number;
    name?: string;  // "Home", "Park", etc.
  };
  duration?: 'brief' | 'moderate' | 'prolonged';  // <10s, 10-60s, >60s

  // Behaviors (multi-select)
  dogBehaviors: DogBehavior[];

  // Handler response
  handlerResponse?: HandlerResponse;

  // Freeform
  notes?: string;

  // Metadata
  weather?: WeatherCondition;
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

## User Interface

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
Visual trends and insights.

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
│   ├── QuickLog/
│   │   ├── TriggerGrid.tsx
│   │   ├── IntensitySlider.tsx
│   │   └── DetailsExpander.tsx
│   ├── History/
│   │   ├── IncidentList.tsx
│   │   └── IncidentCard.tsx
│   ├── Analytics/
│   │   ├── TrendChart.tsx
│   │   ├── TriggerPieChart.tsx
│   │   └── StatsSummary.tsx
│   └── common/
│       ├── BottomNav.tsx
│       └── Header.tsx
├── hooks/
│   ├── useIncidents.ts      # CRUD operations
│   ├── useLocation.ts       # Geolocation
│   └── useAnalytics.ts      # Computed stats
├── db/
│   └── index.ts             # Dexie setup
├── types/
│   └── index.ts             # TypeScript interfaces
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

### Phase 1: Core Logging (MVP)
- [ ] Project setup (Vite, React, TypeScript, Tailwind, PWA)
- [ ] Database setup (Dexie.js)
- [ ] Quick Log screen with trigger grid + intensity
- [ ] Basic history list
- [ ] Bottom navigation
- [ ] PWA manifest + service worker

### Phase 2: Full Context
- [ ] Details expander (behaviors, response, notes)
- [ ] Location capture (GPS + named locations)
- [ ] History filters
- [ ] Edit/delete incidents

### Phase 3: Analytics
- [ ] Stats summary (counts, averages)
- [ ] Intensity trend chart
- [ ] Trigger breakdown pie chart
- [ ] Time-range selector
- [ ] Progress comparison

### Phase 4: Polish
- [ ] Settings screen
- [ ] Data export (JSON/CSV)
- [ ] Dark mode
- [ ] Haptic feedback
- [ ] App icon + splash screen

---

## Key UX Decisions

1. **Trigger-first flow** - The trigger buttons are primary because identifying "what" is the fastest mental decision in the moment.

2. **Intensity as numbers, not words** - "3" is faster to process than "moderate" when you're managing a reactive dog.

3. **Expandable details** - Don't force full context every time. Quick logs when hands are full, detailed logs when you have time.

4. **Auto-timestamp + location** - Reduce manual entry; these can be captured automatically.

5. **No account required** - All local storage. Lower friction, better privacy.

---

## Questions Resolved
- Stack: React + TypeScript + Vite
- Logging approach: Balanced (quick with expandable details)
- Data: Full context available, minimal required
- Analytics: Important feature, included in scope

---

## Next Steps
1. Approve this design
2. Scaffold project with Vite
3. Implement Phase 1 (MVP)
4. Test on mobile device
5. Iterate based on real usage
