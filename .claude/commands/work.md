# Start Work

You are starting a work session on this project. This skill supports both interactive and autonomous operation.

**Mode**: `$ARGUMENTS`
- Empty or `interactive`: Present options, ask user for decisions
- `auto`: Make autonomous decisions using heuristics below
- `auto <issue-id>`: Work autonomously on specific issue

---

## Phase 0: Find Available Work

Run `bd ready` to see issues with no blockers.

### If `bd ready` returns results:
- **Interactive**: Present options (see Phase 1)
- **Auto**: Select using priority heuristics (see Phase 1)

### If `bd ready` is empty:
1. Run `bd list --status=open` - check for any open issues
2. If open issues exist but all blocked: Run `bd blocked`, report blockers to user
3. If no open issues: Run `/next-step` to identify and create work
4. If `/next-step` finds nothing: Report "No work identified - project may be complete or needs user direction"

---

## Phase 1: Select Issue

### Interactive Mode
Present available issues in a table:
| ID | Title | Type | Priority |
|----|-------|------|----------|

Ask: "Which issue would you like to work on? (I recommend [highest-priority-id] based on priority)"

### Autonomous Mode
Select issue using this priority order:
1. **P0 bugs** - Critical issues first
2. **P1 bugs** - High-priority bugs before features
3. **P1 tasks/features** - High-priority work
4. **P2 issues** - By type: bugs > tasks > features
5. **Oldest issue at same priority** - FIFO within priority level

**Skip issues with vague titles** like "improve X", "fix stuff", "update things" - these need clarification.

If multiple valid candidates at same priority, prefer:
- Issues with clear acceptance criteria in description
- Issues that unblock other work (check `bd show` for "blocks" relationships)
- Smaller-scoped issues over large ones

---

## Phase 2: Claim and Understand

Once issue is selected:

### 2.1 Claim the issue
```bash
bd update <id> --status=in_progress
```

### 2.2 Gather full context
```bash
bd show <id>
```

### 2.3 Read relevant documentation
Based on issue content, read in this order:

1. **Always read**: `docs/STATUS.md` (what's built vs planned)
2. **For module work**: `docs/modules/<module>.md` where module is:
   - `reactivity.md` - incidents, triggers, quick logging
   - `separation-anxiety.md` - departures, SA tracking
   - `medications.md` - medication schedules, doses
3. **For architecture questions**: `docs/ARCHITECTURE.md`
4. **For overall vision**: `DESIGN.md`

### 2.4 Scan existing code
Before implementing, read:
- Existing components in the relevant module directory
- Related hooks in `src/hooks/`
- Type definitions in `src/types/`

### 2.5 Plan the work
- **For phase-level work** (issue mentions "phase" or "implement module"): Invoke `phase-breakdown` agent
- **For single tasks**: Use TodoWrite to track sub-tasks

---

## Phase 3: Implement

### 3.1 Select and invoke appropriate agents

**Agent Selection Matrix** - invoke the FIRST matching agent:

| Issue contains keywords | Agent to invoke |
|------------------------|-----------------|
| "phase", "implement module", "build out" | `phase-breakdown` (then return here) |
| "chart", "analytics", "graph", "metrics", "trend", "visualization" | `analytics-builder` |
| "database", "dexie", "schema", "migration", "index", "hook" (CRUD hooks) | `dexie-helper` |
| "component", "screen", "page", "form", "UI", "button", "modal" | `component-scaffolder` |

**If issue spans multiple types** (e.g., "Add analytics chart component with database aggregation"):
1. Invoke agents in dependency order: `dexie-helper` → `analytics-builder` → `component-scaffolder`
2. Complete each agent's output before moving to next

**If no agent matches**: Implement directly following patterns in `CLAUDE.md` and existing code.

### 3.2 Implementation guidelines
- Follow patterns established in existing codebase
- Use TodoWrite to track progress on sub-tasks
- Mark todos complete as you finish each piece
- If you discover additional work needed:
  - **< 15 minutes and directly related**: Just do it, note in commit
  - **> 15 minutes or separate concern**: Create new issue with `bd create`, optionally add as dependency

### 3.3 Handle blockers
If implementation is blocked:
1. Document the blocker: Consider adding a comment or updating issue description
2. Try an alternative approach if one exists
3. After 3 failed attempts at different approaches:
   - **Interactive**: Ask user for guidance
   - **Auto**: Update issue with findings, move to next issue or stop

---

## Phase 4: Verify

Before marking work complete, run this checklist:

### 4.1 Build verification
```bash
npm run build
```
- If build fails: Fix errors before proceeding
- If TypeScript errors: Fix all type issues

### 4.2 Lint verification
```bash
npm run lint
```
- Fix any linting errors (don't just ignore them)

### 4.3 Invoke verification agents

**After UI work** (components, screens, forms):
- Invoke `mobile-ux-reviewer` agent
- Address any CRITICAL issues before completing
- IMPROVEMENTS can be logged as new issues

**After database work** (schema changes, new hooks):
- Run `/dexie-review` skill
- Verify migrations work correctly

**After phase completion** (finished a major feature area):
- Invoke `pwa-auditor` agent
- Ensure offline functionality still works

**After any implementation**:
- Invoke `docs-sync-validator` agent
- Update any documentation that no longer matches implementation

### 4.4 Completion criteria
Work is "done" when ALL of these are true:
- [ ] Build passes without errors
- [ ] Lint passes without errors
- [ ] Implemented functionality matches issue description
- [ ] Verification agents found no CRITICAL issues
- [ ] Any documentation drift has been corrected

---

## Phase 5: Complete and Commit

### 5.1 Close the issue
```bash
bd close <id>
```

If closing multiple related issues:
```bash
bd close <id1> <id2> <id3>
```

### 5.2 Sync beads
```bash
bd sync
```

### 5.3 Commit code changes
```bash
git add -A
git status  # Review what's being committed
```

**Commit message format**:
```
<type>: <description>

[Optional body explaining what/why]

Closes: <beads-id>
```

Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`

Example:
```bash
git commit -m "feat: add incident quick-log form with trigger grid

Implements the QuickLog component with large touch targets
for one-handed logging while walking the dog.

Closes: beads-042"
```

### 5.4 Final sync and push
```bash
bd sync          # Capture any beads changes from commit
git push         # Push to remote
```

### 5.5 Report completion
Summarize what was done:
- Issue completed
- Files changed
- Any new issues created for discovered work
- Any blockers or notes for future sessions

---

## Error Recovery Reference

| Error | Recovery |
|-------|----------|
| `bd ready` empty | Try `bd list --status=open`, then `/next-step` |
| `bd update` fails | Check issue exists with `bd show <id>` |
| Build fails | Read error, fix code, rebuild |
| Agent produces broken code | Review agent output, fix issues, or try different approach |
| Issue too vague | **Interactive**: Ask user. **Auto**: Skip, note why |
| DESIGN.md doesn't cover this | Check `docs/modules/*.md`, scan existing code for patterns |
| Tests fail | Fix failing tests before completing |
| User clarification needed in auto mode | Stop, report what's needed, wait for input |

---

## Scope Boundaries

### Always ask user (even in auto mode) when:
- Issue description is ambiguous with multiple valid interpretations
- Implementation requires architectural decisions not documented anywhere
- Changes would affect > 10 files
- You've tried 3 different approaches without success
- Security-sensitive changes (auth, data export, permissions)

### Proceed autonomously when:
- Task has clear acceptance criteria
- Implementation follows existing patterns in codebase
- Changes are isolated to expected files
- Similar work exists to reference

### Out of scope for single /work session:
- Multiple unrelated issues (finish one, then start another)
- Major refactoring not in the issue description
- Adding features not requested ("while I'm here...")
