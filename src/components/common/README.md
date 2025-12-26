# Common Components

Reusable UI components used across all modules.

## Components

### Header

App header with title, optional back button, and settings icon. Handles iOS safe area insets for devices with notches.

**Props:**
- `title` (string, required): Header title text
- `onBack` (function, optional): Callback when back button is clicked
- `onSettings` (function, optional): Callback when settings button is clicked
- `showBackButton` (boolean, optional): Show back arrow button (default: false)
- `showSettingsButton` (boolean, optional): Show settings gear icon (default: true)

**Example:**
```tsx
import { Header } from '@/components/common';

<Header
  title="Reactivity"
  showBackButton={true}
  onBack={() => navigate('/home')}
  showSettingsButton={true}
  onSettings={() => navigate('/settings')}
/>
```

**Features:**
- Sticky positioning (stays at top during scroll)
- 44x44px minimum touch targets for buttons
- iOS safe area support (notch/Dynamic Island)
- Indigo accent color for back button
- Proper ARIA labels for accessibility

---

### BottomNav

Bottom navigation bar for module switching between Log, History, and Stats tabs. Handles iOS safe area insets for devices with home indicators.

**Props:**
- `activeTab` (TabType, required): Currently active tab ('log' | 'history' | 'stats')
- `onTabChange` (function, required): Callback when tab is clicked, receives TabType

**Example:**
```tsx
import { useState } from 'react';
import { BottomNav, type TabType } from '@/components/common';

const [activeTab, setActiveTab] = useState<TabType>('log');

<BottomNav
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>
```

**Features:**
- Fixed positioning at bottom of viewport
- 64px minimum height (16 tailwind units) for comfortable touch
- Active tab highlighting (indigo accent)
- Icon + label for each tab
- iOS safe area support (home indicator)
- Proper ARIA labels and `aria-current` for accessibility

**Tabs:**
1. **Log** - PenSquare icon - Primary logging interface
2. **History** - ClipboardList icon - Past entries with filters
3. **Stats** - BarChart3 icon - Analytics and insights

---

## Layout Pattern

Typical module screen structure:

```tsx
import { useState } from 'react';
import { Header, BottomNav, type TabType } from '@/components/common';

export function ModuleScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('log');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header
        title="Module Name"
        showBackButton={true}
        onBack={() => {/* navigate to home */}}
      />

      <main className="flex-1 p-4 pb-20 overflow-y-auto">
        {/* Module content here */}
        {/* pb-20 provides space for BottomNav */}
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
```

**Key points:**
- Use `flex flex-col` on container with `min-h-screen`
- Main content has `flex-1` to fill available space
- Add `pb-20` (80px) to main content for BottomNav clearance
- `overflow-y-auto` on main enables scrolling when content overflows
- Both components handle their own safe area insets

---

## Mobile-First Considerations

### Touch Targets
All interactive elements meet the minimum 44x44px touch target size (iOS Human Interface Guidelines):
- Back button: `min-h-11 min-w-11` (44px)
- Settings button: `min-h-11 min-w-11` (44px)
- Bottom nav tabs: `min-h-16` (64px) for comfortable thumb reach

### Safe Areas
Both components use CSS `env()` for safe area insets:
- Header: `padding-top: env(safe-area-inset-top)`
- BottomNav: `padding-bottom: env(safe-area-inset-bottom)`

This ensures content is not obscured by:
- iPhone notch / Dynamic Island
- Home indicator bar
- Rounded screen corners

### iOS Standalone Mode
When installed as PWA (Add to Home Screen), these components adapt:
- No browser chrome (Safari UI is hidden)
- Safe area insets apply automatically
- Full-screen app-like experience

---

## Styling

All components use:
- **Tailwind CSS only** (no external CSS files)
- **Mobile-first** responsive design
- **Indigo-600** (#4F46E5) as primary accent color
- **Gray scale** for neutral elements
- **Active states** with `active:` pseudo-class (better for touch than hover)

---

## Icons

Uses `lucide-react` for icon library:
- **ArrowLeft** - Back navigation
- **Settings** - Settings/configuration
- **PenSquare** - Logging/writing
- **ClipboardList** - History/list view
- **BarChart3** - Analytics/statistics

All icons are 24x24px (w-6 h-6) for optimal visual weight at mobile scale.
