# Start Work

You are starting a work session on this project. Follow these steps:

## Step 1: Find Available Work

Run `bd ready` to see issues with no blockers that are ready to implement.

## Step 2: Present Options

Show the user the available issues with:
- Issue ID
- Title
- Type (task/feature/bug)
- Priority

Ask which one they want to work on, or suggest the highest priority one.

## Step 3: Claim and Understand

Once selected:
1. Run `bd update <id> --status=in_progress` to claim it
2. Run `bd show <id>` to get full details
3. Read DESIGN.md to understand context

## Step 4: Start Implementation

Use the appropriate agents based on CLAUDE.md instructions:
- `component-scaffolder` for new React components
- `dexie-helper` for database work
- `analytics-builder` for charts

Begin implementing the selected issue. Use TodoWrite to track sub-tasks as you work.

## Step 5: On Completion

When the work is done:
1. Run `bd close <id>` to mark complete
2. Run `bd sync` to save changes
3. Commit code changes with git
