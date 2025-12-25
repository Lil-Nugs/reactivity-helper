# Design Review - Ambiguities & Issues

Questions and issues identified that need resolution before agent implementation.

---

## Data Model Issues

### 1. Multi-dog UX is undefined
- `dogId` field exists but no wireframes show a dog selector
- How do you switch between dogs? Per-module or global?
- What's the first-run experience when no dog exists?

### 2. Time/Date format inconsistency
- `Incident.timestamp: Date` vs `MedicationEntry.date: Date` + `actualTime: string`
- What format is `actualTime`? "08:00"? "8:00 AM"? ISO?
- How are `Date` objects serialized for IndexedDB?

### 3. Required vs optional fields mismatch
```typescript
// Departure has these marked as REQUIRED (no ?):
behaviorLog: BehaviorEntry[];
distressEvidence: DistressEvidence[];
departureCues: DepartureCue[];
enrichment: Enrichment[];
```
But the UI shows these in "Add More Details" implying they're optional.

### 4. Location relationship unclear
- `Incident.location` has inline `name?: string`
- `NamedLocation` is a separate entity with `radiusMeters`
- How are these linked? Does `location.name` reference `NamedLocation.id` or just a string?

### 5. WeeklyTarget week calculation
- "Monday of the target week" - but what about Sunday-start locales?
- What timezone are weeks calculated in?

---

## Analytics Underspecified

### 6. Complex analytics have no algorithm
```typescript
cuesThatIncreaseAnxiety: DepartureCue[];  // How is this calculated?
progressionStatus: 'advancing' | 'maintaining' | 'regressing';  // What thresholds?
mostEffectiveEnrichment: EnrichmentType;  // Statistical significance?
```
These need concrete definitions or an agent will make arbitrary decisions.

### 7. Cross-module correlation rules missing
- If morning dose is 2 hours late, which incidents does it "affect"?
- Time window for "on-time" correlation with incidents?

---

## Missing UI Specifications

### 8. No empty/error states
- First-run with no data
- Geolocation permission denied
- No incidents this week for charts

### 9. Edit/delete flows undocumented
- "Tap card to edit" but no edit modal wireframe
- Delete confirmation UX?
- Cascade behavior when deleting a Dog?

### 10. Named location management
- Settings mentions it but no create/edit UI
- Do they auto-create from incident logs?
- What happens when GPS matches multiple overlapping locations?

### 11. Departure duration input
- Manual entry shown, but is this logged post-hoc or is there a timer option?
- What if you're logging while still away?

---

## Technical Gaps

### 12. ID generation strategy
Not specified (UUID? nanoid? auto-increment?)

### 13. Validation rules missing
- Max note length?
- Duration min/max?
- Intensity out-of-range handling?

### 14. History pagination
How many items loaded? Infinite scroll or pages?

### 15. Export schema
"JSON/CSV" but no field specification for export format

---

## Navigation Ambiguity

### 16. Tab structure unclear
- Home has module cards
- Each module has bottom nav (Log/History/Analytics)
- Does Home disappear or become another tab?
- How do you get back to Home from a module?

---

## Recommended Priority Fixes

1. Multi-dog flow + dog selector placement
2. Required/optional field corrections in types
3. Time format standardization
4. Analytics algorithm specifications
5. Empty state wireframes
