# Reactivity Helper - Claude Instructions

## Project Overview

Mobile-first PWA for tracking dog behavioral issues (reactivity, separation anxiety, medications). See DESIGN.md for full specifications.

## Agent Usage Requirements

You MUST use the appropriate agent at these trigger points:

### Before Writing Code

| Trigger | Agent | Why |
|---------|-------|-----|
| Starting a new implementation phase | `phase-breakdown` | Creates beads issues with dependencies |
| Creating new React components | `component-scaffolder` | Ensures mobile-first Tailwind patterns |
| Any database/Dexie work | `dexie-helper` | Handles IndexedDB correctly |
| Building charts or analytics | `analytics-builder` | Proper Recharts patterns |

### After Writing Code

| Trigger | Agent | Why |
|---------|-------|-----|
| Finished implementing UI | `mobile-ux-reviewer` | Catches touch target and iOS issues |
| Completed a phase | `pwa-auditor` | Validates offline functionality |
| Changed any feature | `docs-sync-validator` | Keeps DESIGN.md accurate |

## Workflow Reminders

- Use `bd` (beads) for issue tracking, not just TodoWrite
- Run `bd ready` to find available work
- Run `bd sync && git push` before ending any session
- This app must work fully offline - no network dependencies

## Code Patterns

- **IDs**: Use `nanoid()` for all entity IDs
- **Dates**: ISO 8601 strings (`2024-01-15T14:30:00-08:00`)
- **Styling**: Tailwind only, mobile-first (`min-h-11` for touch targets)
- **State**: React Context + useReducer, Dexie for persistence
- **Charts**: Recharts with ResponsiveContainer
