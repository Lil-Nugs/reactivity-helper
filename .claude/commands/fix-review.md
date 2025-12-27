# Fix Review Issues

Quickly address issues from a phase review. Works through review epic issues by priority.

## Arguments
- `$ARGUMENTS` - Optional: Specific issue ID to fix, or "all" to work through all

## Step 1: Find Review Issues

If no specific ID provided, find the most recent review epic:

```bash
bd list --type=epic | grep "Review Fixes"
```

Then show its children:

```bash
bd show <epic-id>
```

## Step 2: Prioritize

Present issues grouped by priority:

**Critical (P0)** - Must fix now:
- <issue-id>: <title>

**High (P1)** - Should fix now:
- <issue-id>: <title>

**Medium (P2)** - Can defer:
- <issue-id>: <title>

**Low (P3)** - Polish later:
- <issue-id>: <title>

Ask: "Start with P0/P1 issues? Or pick a specific one?"

## Step 3: Work Through Issues

For each issue to fix:

1. **Claim it**:
   ```bash
   bd update <id> --status=in_progress
   ```

2. **Read the details**:
   ```bash
   bd show <id>
   ```

3. **Make the fix** following the description's guidance

4. **Verify the fix** (run build, check visually if UI change)

5. **Close it**:
   ```bash
   bd close <id>
   ```

6. **Move to next issue**

## Step 4: Batch Similar Fixes

If multiple issues are similar (e.g., "Add ARIA label to X", "Add ARIA label to Y"):
- Fix them together in one pass
- Close them all at once: `bd close <id1> <id2> <id3>`

## Step 5: After All Fixes

1. Run the specific reviewer again to verify:
   - If fixed mobile-ux issues, run `mobile-ux-reviewer` agent
   - If fixed accessibility issues, run `accessibility-reviewer` agent
   - etc.

2. Commit changes:
   ```bash
   git add .
   git commit -m "Fix Phase X review issues

   - <list of fixes>

   <emoji> Generated with [Claude Code](https://claude.com/claude-code)"
   ```

3. Sync beads:
   ```bash
   bd sync
   ```

4. Check if epic can close:
   ```bash
   bd epic close-eligible
   ```

## Notes

- Fixes should be small and focused
- Don't expand scope during fixes
- If a fix reveals new issues, create new beads for them
- Run `/phase-review` again after major fixes to catch regressions
