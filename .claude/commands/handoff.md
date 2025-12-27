# Generate Handoff Prompt

Create a detailed handoff prompt for continuing work in a new session.

## Arguments
- `$ARGUMENTS` - Optional: Any specific context to include

## Step 1: Gather Current State

Run these commands to understand current state:

```bash
git branch --show-current
git status
git log --oneline -5
bd list --status=open
bd list --status=in_progress
bd ready
```

## Step 2: Read Recent Context

Check:
- DESIGN.md for phase status
- Recent git commits for what was done
- Any open beads issues for pending work

## Step 3: Generate Prompt

Create a handoff prompt in this format:

```
I'm continuing development on Reactivity Helper, a mobile-first PWA for tracking dog behavioral issues.

**CURRENT BRANCH**: <branch name>

**RECENTLY COMPLETED**:
- <list of recent accomplishments from git log and closed beads>

**IN PROGRESS**:
- <any in_progress beads issues>
- <any uncommitted work>

**READY TO WORK** (from `bd ready`):
- <issue-id>: <title> [P<priority>]
- ...

**BLOCKERS** (if any):
- <anything blocking progress>

**NEXT STEPS**:
1. <suggested first action>
2. <suggested second action>
3. ...

**KEY FILES**:
- DESIGN.md - Full specifications
- CLAUDE.md - Agent usage requirements
- <other relevant files based on current work>

**WORKFLOW REMINDERS**:
- Use appropriate agents from CLAUDE.md before/after code changes
- Run `bd sync && git push` before ending session
- Run `/phase-review` after completing any phase

Ready to continue?
```

## Step 4: Present to User

Show the generated prompt in a code block so the user can copy/paste it for their next session.
