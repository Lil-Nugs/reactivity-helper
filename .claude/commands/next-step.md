# Project Next Step Analysis

Analyze this project to determine the single most logical next step to implement. Do NOT implement anything - only analyze and recommend.

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
List 2-4 candidate next steps. For each, evaluate:
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
Provide:
- **Recommendation**: One specific next step (not a phase, a concrete task)
- **Reasoning**: Why this over alternatives
- **Prerequisites**: Anything that must be true/done first
- **Success criteria**: How to know when it's done
- **Suggested beads issues**: What to create before starting
