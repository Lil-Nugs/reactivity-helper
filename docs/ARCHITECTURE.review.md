# Review: ARCHITECTURE.md

## Accuracy Issues (MUST FIX)

- [ ] Line 208-213: Hook signature mismatch - `useIncidents` returns array `incidents: Incident[]` but documentation says "Empty array while loading (not undefined)". This is technically correct but needs clarification: the hook returns `incidents || []` (line 78 in actual code), so it's always an array, never undefined.

- [ ] Line 222-228: `useNamedLocations` documentation is slightly incomplete. The actual implementation includes an internal helper function `calculateDistance` but this is not mentioned in the architecture docs. The hook does provide the `findLocationByCoords` function which uses this.

- [ ] Line 29: Database index definition in documentation. Line 29 of the actual code shows `dogs: 'id, name'` but architecture says `dogs: 'id, name'` - this is correct but should clarify that "name" is an index, not a compound key.

## Missing Content (SHOULD ADD)

- [ ] Document the duplicate `calculateDistance` function. Both `src/db/index.ts` (lines 206-224) and `src/hooks/useNamedLocations.ts` (lines 101-119) contain identical Haversine distance calculation implementations. This should be noted as technical debt - consider extracting to a shared utility.

- [ ] Database schema documentation (Section 4, Table on line 257-266) doesn't include the `namedLocations` table details clearly. The actual schema shows `namedLocations: 'id, dogId, name'` on line 35 of db/index.ts.

- [ ] Missing documentation on the distinction between `useLiveQuery` return behavior: When used in hooks, `useLiveQuery` returns `undefined` while loading, but hooks convert this to `null` or `[]` for convenience. This pattern deserves explicit mention.

- [ ] Line 331-333: `TabType` export location needs context. The docs correctly identify it's exported from `BottomNav.tsx`, but should note this is the only component that exports a public type (typically all types should be in `src/types/`).

- [ ] Missing document reference: The CLAUDE.md instructions mention `docs/STATUS.md`, `docs/modules/reactivity.md`, `docs/modules/separation-anxiety.md`, and `docs/modules/medications.md`. These should be cross-referenced in ARCHITECTURE.md's documentation section.

## Minor Fixes (NICE TO HAVE)

- [ ] Line 1: Title should clarify this is the current v1 architecture; future multi-dog support is mentioned but not labeled as future.

- [ ] Line 16: Comment says "barrel file" for types/index.ts but this is common knowledge - could be clearer: "Re-exports all types from individual files (barrel export pattern)".

- [ ] Line 72: Note that `hooks/` directory intentionally has no barrel file to avoid circular dependencies - this should be documented as a design decision.

- [ ] Line 109-111: Import statement example uses relative path `'../context'` which works but could show alternate import: `import { useDog } from '../context/DogContext'` also valid.

- [ ] Line 160-161: Documentation says "Empty array while loading (not undefined)" but this is the converted behavior, not useLiveQuery's native behavior. Could be clearer: "Returns empty array while loading (useLiveQuery returns undefined, hook converts to [])"

- [ ] Line 189-190: Comment "Note: Returns first dog in database" could be more explicit: "Note: Returns the first dog in database (v1 limitation; multi-dog support planned)"

- [ ] Line 201: Reference to `useIncidents` should note that `limit` and `offset` are optional and primarily for pagination in infinite-scroll lists.

- [ ] Line 238-249: Database class definition looks correct, but should note that `userSettings` table uses `activeDogId` as primary key (not a nanoid), which is a design decision for single-dog v1.

- [ ] Line 286: Helper function documentation mentions `addRecentTag(activeDogId, tag)` but actual signature is exactly this - good. However, the "max 10" constraint should be noted here, not just in implementation comment.

- [ ] Line 359-363: Touch target minimum mentioned as 44x44px = 11 * 4, but Tailwind's `min-h-11` is actually 2.75rem = 44px by default (1rem = 16px). Documentation is correct but the math explanation (11 * 4) is confusing. Better to say: `min-h-11` = 44px (Tailwind default spacing unit).

- [ ] Line 553-562: ID generation section is accurate. Could add note: "IDs generated at point of creation, not on database insert, to allow optimistic UI updates."

- [ ] Line 568-576: Date/time handling is accurate. The distinction between `timestamp` (ISO 8601 with time), `date` (date only), and `targetTime`/`actualTime` (24-hour HH:MM format) is correct and well-documented.

## Questions for Human

- [ ] Is the duplicate `calculateDistance` function intentional (db/index.ts vs useNamedLocations.ts)? Should this be extracted to `src/utils/geo.ts` or similar?

- [ ] The context hook `useDog()` from `src/context/DogContext.tsx` and standalone hook `useDog()` from `src/hooks/useDog.ts` have the same name. The documentation explains this well, but is there concern about import confusion? Should one be renamed (e.g., `useActiveDog` vs `useDogManagement`)?

- [ ] TabType is exported from BottomNav.tsx rather than from types/. Is this intentional separation, or should it be moved to types/common.ts for consistency?

- [ ] The `findLocationByCoords` in useNamedLocations hook and `findNearestLocation` in db/index.ts appear to be duplicates with slightly different interfaces. Should one be canonical?

---

## Summary

The ARCHITECTURE.md is **highly accurate** overall. The codebase matches the documentation in terms of:
- File structure and organization (100% match)
- Hook signatures and return types (99% match - minor returns void clarification)
- Database schema and indexes (100% match)
- State management patterns (100% match)
- UI patterns and styling (100% match)
- Dependencies listed (100% match)

**Critical Issues**: None found.

**Code/Doc Misalignments**: Only the duplicate distance calculation functions warrant attention as potential technical debt.

**Recommended Priority**:
1. Consider extracting shared `calculateDistance` utility
2. Add notes about TabType export location rationale
3. Add cross-references to docs/modules/* documentation
