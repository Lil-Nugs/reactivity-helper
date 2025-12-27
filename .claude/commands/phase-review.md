# Phase Review

Run a comprehensive review of the current phase before moving to the next one. Launches 8 review agents in parallel and creates beads issues for findings.

## Arguments
- `$ARGUMENTS` - Optional: The phase name/number being reviewed (e.g., "Phase 1", "Phase 2"). Defaults to "Current Phase".

## Step 1: Launch All Review Agents in Parallel

Use the Task tool to launch ALL of these agents simultaneously in a single message with multiple tool calls:

### Core Reviewers (always run)

1. **mobile-ux-reviewer**: Check all UI components for:
   - Touch targets (minimum 44px / min-h-11)
   - iOS safe areas (env(safe-area-inset-*))
   - Tap feedback (active: states)
   - Scroll behavior and padding
   - Form usability on mobile keyboards

2. **pwa-auditor**: Audit PWA implementation for:
   - Service worker configuration
   - Offline data persistence with Dexie
   - Network dependencies (should be zero)
   - Manifest correctness
   - Cache strategies

3. **docs-sync-validator**: Compare DESIGN.md against implementation:
   - Phase checklist accuracy ([ ] vs [x])
   - Data model matches src/types/
   - Project structure matches reality
   - Screen descriptions match actual code

### Domain-Specific Reviewers

4. **accessibility-reviewer**: Comprehensive a11y audit:
   - ARIA labels and roles on all interactive elements
   - Keyboard navigation (tab order, escape handling)
   - Screen reader announcements for state changes
   - Color contrast (WCAG AA minimum)
   - Focus visible indicators
   - Semantic HTML usage

5. **dexie-schema-reviewer**: Database consistency check:
   - Index definitions match actual query patterns
   - Compound indices used correctly
   - Foreign key integrity (dogId references)
   - Query performance (no table scans)
   - Migration safety

6. **react-patterns-reviewer**: React best practices:
   - useEffect/useCallback dependency arrays complete
   - useLiveQuery dependencies correct
   - Unnecessary re-renders from stale closures
   - Effect cleanup functions present
   - Context value memoization

7. **data-validation-reviewer**: Data integrity:
   - Form validation rules consistent with types
   - Input sanitization before storage
   - Timestamps are ISO 8601 formatted
   - Timezone handling consistency
   - Enum values validated

8. **cross-platform-reviewer**: iOS/Android parity:
   - Safe area handling on both platforms
   - Virtual keyboard behavior with inputs
   - Status bar color consistency
   - Home screen icon rendering
   - Platform-specific CSS issues

For each agent, include this in the prompt:
- Reference DESIGN.md for specifications
- Check src/components/, src/hooks/, src/db/
- Do NOT write any code - just identify issues
- Return findings with file paths and line numbers
- Categorize by severity: Critical / High / Medium / Low

## Step 2: Wait for All Results

Use TaskOutput to collect results from all 8 agents. Present a summary table:

```
| Agent | Issues | Critical | High | Medium | Low |
|-------|--------|----------|------|--------|-----|
| mobile-ux-reviewer | X | ... | ... | ... | ... |
| pwa-auditor | X | ... | ... | ... | ... |
| ... | ... | ... | ... | ... | ... |
```

## Step 3: Create Review Epic

```bash
bd create --title="$ARGUMENTS Review Fixes" --type=epic --priority=1 --description="Issues identified during $ARGUMENTS completion review by 8 parallel review agents. Address critical/high priority items before starting next phase."
```

Save the epic ID for linking.

## Step 4: Create Individual Issues

For each finding, create a beads issue with appropriate priority:
- Critical issues: P0
- High issues: P1
- Medium issues: P2
- Low issues: P3

```bash
bd create --title="<issue title>" --type=bug --priority=<0-3> --description="<description>

File: <file path>:<line number>
Fix: <suggested fix>

Identified by: <agent name>"
```

Then link to the review epic:
```bash
bd dep add <issue-id> <epic-id> --type parent-child
```

Group similar issues when possible (e.g., "Add ARIA labels to 5 components" instead of 5 separate issues).

## Step 5: Present Results

Show the user:
1. Total issues found by severity
2. The epic ID
3. All created issue IDs grouped by priority
4. Recommended order to address them

Ask:
- "Ready to start fixing critical/high issues?"
- "Any additional issues you've noticed to add?"

## Step 6: Offer Documentation Updates

If docs-sync-validator found checklist issues:
1. Show which items need updating
2. Offer to mark completed items as `[x]` in DESIGN.md
3. Offer to update project structure section
4. Only proceed with user approval

## Step 7: Sync

Always run at the end:
```bash
bd sync
```

## Notes

- **Critical issues**: Must fix before next phase
- **High issues**: Should fix before next phase
- **Medium issues**: Can fix in parallel with next phase work
- **Low issues**: Can defer to polish phase
- Run this command after completing any phase, not just at the end
- Can also run mid-phase to catch issues early
