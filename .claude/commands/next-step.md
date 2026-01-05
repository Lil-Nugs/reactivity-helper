# Project Next Step Analysis

Analyze this project to determine the next logical step(s) to implement. Do NOT implement anything - only analyze and recommend.

**Steps requested**: $ARGUMENTS (default: 1)

## Analysis Steps

### 1. Understand Current State
- Read `docs/STATUS.md` for what's built vs planned
- Read `DESIGN.md` for the intended vision
- Run `bd list` to see tracked work and priorities
- Check git status for any uncommitted work

### 2. Evaluate Completion Quality
For each "completed" phase, ask:
- Are there gaps between what STATUS.md claims and what DESIGN.md specifies?
- Are there TODOs, placeholder code, or disabled features?
- Would a user consider this feature "done"?

### 3. Identify Candidates
List potential next steps. For each, evaluate:
- **Value**: Does this unlock other work or provide user value?
- **Dependencies**: What must exist first? Is it ready?
- **Scope**: Can this be completed in one focused session?
- **Risk**: Are there unknowns that need investigation first?

### 4. Apply Decision Criteria
Prefer work that:
1. Closes gaps in "complete" phases over starting new phases
2. Unblocks dependent work over isolated features
3. Is well-defined over ambiguous
4. Provides immediate user value over infrastructure

### 5. Output Format

If **1 step** requested (or no argument):
- **Recommendation**: One specific next step (not a phase, a concrete task)
- **Reasoning**: Why this over alternatives
- **Prerequisites**: Anything that must be true/done first
- **Success criteria**: How to know when it's done
- **Suggested beads issue**: What to create before starting

If **multiple steps** requested:
Provide a prioritized list of N steps. For each step:
- **Step N: [Title]**
  - **Task**: Specific, concrete work to do
  - **Why now**: Why this is the right priority
  - **Dependencies**: What must be done first (including other steps in this list)
  - **Success criteria**: How to know it's done
  - **Suggested beads issue**: Title and type for `bd create`

The steps should be ordered by priority and should include dependency relationships between them where applicable. These become the work queue for upcoming sessions.
