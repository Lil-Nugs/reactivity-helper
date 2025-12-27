# Refactoring Roadmap

## Overview

This document outlines recommended refactoring opportunities and technical improvements for the Reactivity Helper app, organized by priority and timing relative to implementation phases.

---

## Refactoring Opportunities

### 1. Data Layer Abstraction (Before Phase 7)

**Current State:** Hooks directly use Dexie
**Recommended:** Abstract data layer for easier backend swapping

```typescript
// Current (tightly coupled)
export function useIncidents(dogId: string) {
  const incidents = useLiveQuery(
    () => db.incidents.where('dogId').equals(dogId).toArray()
  );
  // ...
}

// Refactored (abstracted)
export function useIncidents(dogId: string) {
  const dataProvider = useDataProvider(); // Dexie, Supabase, or both
  const incidents = useLiveQuery(
    () => dataProvider.incidents.getByDogId(dogId)
  );
  // ...
}
```

**When:** After Phase 4, before Phase 7 (Supabase)
**Effort:** 2-3 days
**Benefit:** Makes cloud sync integration much cleaner

---

### 2. State Management Upgrade (Optional)

**Current State:** React Context + useReducer
**Options:**

| Option | Pros | Cons |
|--------|------|------|
| Keep current | Simple, no deps | Manual optimization needed |
| Zustand | Tiny, simple API | Another dependency |
| Jotai | Atomic, great for derived state | Learning curve |
| TanStack Query | Caching, sync, devtools | Overkill for local-only |

**Recommendation:** Keep current for local-only. Consider **TanStack Query** when adding Supabase (handles caching, refetching, optimistic updates).

**When:** Phase 7a (Cloud Backup)
**Effort:** 3-4 days
**Benefit:** Better sync state management, loading states, error handling

---

### 3. Form Handling (During Phase 2-4)

**Current State:** Manual form state
**Recommended:** React Hook Form + Zod

```typescript
// Schema-based validation (already have types, just add Zod)
const incidentSchema = z.object({
  trigger: z.enum(['dog', 'person', 'bike', ...]),
  intensity: z.number().min(1).max(5),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

// In component
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(incidentSchema),
});
```

**When:** During Phase 2 (first complex form)
**Effort:** 1-2 days setup, then faster form development
**Benefit:** Validation, better UX, type safety, less boilerplate

---

### 4. Component Architecture (Ongoing)

**Current patterns to maintain:**

```
src/components/
├── [Module]/
│   ├── [Feature]/
│   │   ├── index.tsx        # Main component
│   │   ├── [SubComponent].tsx
│   │   └── hooks.ts         # Feature-specific hooks
│   └── index.ts             # Module exports
└── common/
    └── [SharedComponent].tsx
```

**Recommended additions:**

```
src/components/
├── ui/                      # Primitive UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Chip.tsx
│   └── BottomSheet.tsx
└── patterns/                # Reusable patterns
    ├── FilterableList.tsx
    ├── TimeRangeSelector.tsx
    └── DetailsExpander.tsx
```

**When:** Start in Phase 2, refine throughout
**Benefit:** Consistency, faster feature development

---

### 5. Testing Infrastructure (Before Phase 5)

**Current State:** No testing setup
**Recommended Stack:**

| Tool | Purpose |
|------|---------|
| Vitest | Unit + integration tests |
| Testing Library | Component testing |
| MSW | API mocking (for Supabase) |
| Playwright | E2E (optional, for critical flows) |

**Priority test areas:**
1. Data hooks (CRUD operations)
2. Analytics calculations
3. Form validation
4. Sync logic (Phase 7)

**When:** Set up during Phase 4, write tests during Phase 5
**Effort:** 2 days setup, then ongoing
**Benefit:** Confidence in analytics accuracy, regression prevention

---

### 6. Error Handling & Monitoring (Phase 6)

**Current State:** Console errors only
**Recommended:**

```typescript
// Global error boundary
<ErrorBoundary
  fallback={<ErrorScreen />}
  onError={(error) => {
    // Log to Sentry/LogRocket (future)
    console.error('App error:', error);
  }}
>
  <App />
</ErrorBoundary>

// Per-feature error states
const { data, error, isLoading } = useIncidents(dogId);

if (error) {
  return <ErrorCard message="Couldn't load incidents" retry={refetch} />;
}
```

**When:** Phase 6 (Polish)
**Effort:** 1-2 days
**Benefit:** Better UX, debugging visibility

---

### 7. Performance Optimizations (Phase 5-6)

**Areas to address:**

| Issue | Solution | When |
|-------|----------|------|
| Large lists | Virtualization (react-window) | Phase 5 if history > 100 items |
| Chart rendering | Memoization, lazy loading | Phase 5 |
| Bundle size | Code splitting by module | Phase 6 |
| Images | None in v1 (text only) | N/A |

**Bundle splitting strategy:**

```typescript
// Lazy load modules
const ReactivityModule = lazy(() => import('./components/Reactivity'));
const SAModule = lazy(() => import('./components/SeparationAnxiety'));
const MedicationsModule = lazy(() => import('./components/Medications'));
```

**When:** Phase 6 (Polish)
**Effort:** 1-2 days
**Benefit:** Faster initial load, better mobile performance

---

### 8. Accessibility Improvements (Phase 6)

**Checklist:**

- [ ] All interactive elements have focus states
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Screen reader labels on icon buttons
- [ ] Keyboard navigation works
- [ ] Motion reduced when `prefers-reduced-motion`
- [ ] Touch targets ≥ 44px (already in design)

**When:** Phase 6 (Polish)
**Effort:** 2-3 days
**Benefit:** Usable by more people, better overall UX

---

### 9. Internationalization Prep (Future)

**Not needed for v1**, but consider:

```typescript
// Easy to add later with this pattern
const labels = {
  triggers: {
    dog: 'Dog',
    person: 'Person',
    // ...
  },
  intensity: {
    1: 'Mild alert',
    5: 'Full reaction',
  },
};

// Component usage
<Button>{labels.triggers[incident.trigger]}</Button>
```

**When:** Post-v1, if user demand exists
**Effort:** 1 week to internationalize
**Benefit:** Global reach

---

### 10. Documentation (Ongoing)

**Current:** DESIGN.md, CLAUDE.md
**Recommended additions:**

```
docs/
├── SUPABASE_MIGRATION.md   # ← Created
├── REFACTORING_ROADMAP.md  # ← This file
├── API.md                  # Hook APIs, data shapes
├── COMPONENTS.md           # Component library docs
└── DEPLOYMENT.md           # Build, deploy, environment setup
```

**When:** As features are built
**Benefit:** Onboarding, maintenance, AI assistance

---

## Refactoring Priority Matrix

| Refactoring | Impact | Effort | Priority | When |
|-------------|--------|--------|----------|------|
| Data layer abstraction | High | Medium | **High** | Before Phase 7 |
| Form handling (Zod) | Medium | Low | **High** | Phase 2 |
| UI component library | Medium | Medium | Medium | Ongoing |
| Testing infrastructure | High | Medium | Medium | Phase 4-5 |
| Error handling | Medium | Low | Medium | Phase 6 |
| Performance (virtualization) | Low | Low | Low | If needed |
| State management upgrade | Medium | High | Low | Phase 7 |
| Accessibility | Medium | Medium | Medium | Phase 6 |

---

## Technical Debt to Avoid

### Anti-patterns to watch for:

1. **Prop drilling** → Use context or composition
2. **Duplicate validation** → Single source (Zod schemas)
3. **Inline styles** → Tailwind classes only
4. **Magic strings** → Constants/enums
5. **Callback hell in sync** → Async/await, proper error handling
6. **Premature optimization** → Profile first, optimize when needed

### Code quality gates:

```bash
# Add to CI/pre-commit
- TypeScript strict mode (already enabled)
- ESLint with React + a11y plugins
- Prettier for formatting
- No `any` types (use `unknown` if needed)
```

---

## Migration Checklist (Phase 7 Prep)

Before starting Supabase migration, ensure:

- [ ] All Phase 1-6 features complete and tested
- [ ] Data export working (fallback option)
- [ ] No console errors in production build
- [ ] PWA offline mode thoroughly tested
- [ ] Performance acceptable on older devices
- [ ] Data layer hooks abstracted (refactoring #1)

---

## Summary

| Phase | Recommended Refactoring |
|-------|-------------------------|
| Phase 2 | Form handling (Zod + RHF), UI components |
| Phase 4 | Testing infrastructure setup |
| Phase 5 | Test analytics calculations |
| Phase 6 | Error handling, a11y, performance, bundle splitting |
| Pre-Phase 7 | Data layer abstraction |
| Phase 7 | TanStack Query for sync state |

**Total pre-Phase 7 refactoring effort:** ~1-2 weeks (can be done incrementally)
