# Session End

Run this checklist before ending any work session to ensure nothing is lost.

## Step 1: Check Work Status

```bash
bd list --status=in_progress
```

For any in-progress issues:
- If complete: `bd close <id>`
- If blocked: Add a comment explaining the blocker
- If partially done: Leave in_progress with notes

## Step 2: Git Status Check

```bash
git status
```

Review:
- Unstaged changes that should be committed
- Files that shouldn't be committed (secrets, temp files)
- Current branch name

## Step 3: Commit Code Changes

If there are changes to commit:

```bash
git add <relevant files>
git commit -m "<descriptive message>

<emoji> Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## Step 4: Sync Beads

```bash
bd sync
```

This commits any beads changes to the beads-sync branch.

## Step 5: Push to Remote

```bash
git push
```

If on a feature branch, ensure it's pushed to origin.

## Step 6: Generate Handoff Prompt

Create a handoff prompt for the next session with:

1. **What was completed** this session
2. **Current state** (branch, any in-progress work)
3. **Next steps** (what to work on next)
4. **Blockers** (anything blocking progress)
5. **Key files** modified or to review

Format it as a code block the user can copy/paste.

## Step 7: Final Verification

Confirm:
- [ ] All code changes committed
- [ ] Beads synced (`bd sync`)
- [ ] Changes pushed to remote
- [ ] No in-progress issues left unexplained
- [ ] Handoff prompt generated

Say: "Session wrapped up. Ready to close."
