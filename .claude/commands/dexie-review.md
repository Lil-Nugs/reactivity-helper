# Dexie Database Review

You are reviewing a Dexie.js database implementation for correctness, performance, and best practices.

## Step 1: Gather Context

Read these files to understand the implementation:

1. **Database schema**: `src/db/index.ts` (or `src/db/*.ts`)
2. **Type definitions**: `src/types/` - all entity interfaces
3. **DESIGN.md**: Field requirements, validation rules, and data model specs
4. **Existing hooks**: `src/hooks/use*.ts` - any CRUD hooks using the database

## Step 2: Schema Review Checklist

For each table, verify:

### Type Alignment
- [ ] Table fields match the TypeScript interface exactly
- [ ] Primary key type is correct (string for nanoid)
- [ ] Optional fields in schema match optional (?) in types
- [ ] No extra/missing fields between schema and types

### Index Configuration
- [ ] Primary key is indexed (first field in schema string)
- [ ] Foreign keys are indexed (e.g., `dogId`)
- [ ] Compound indexes exist for common query patterns: `[dogId+timestamp]`
- [ ] No over-indexing (indexes have storage/write cost)

### Dexie Best Practices
- [ ] Version number is set for migration support
- [ ] Table names are consistent (camelCase or snake_case, pick one)
- [ ] Using `Table<T, string>` generic typing for type safety
- [ ] Database is exported as singleton instance

## Step 3: Hook Review (if applicable)

For each CRUD hook using the database:

- [ ] Uses `useLiveQuery` for reactive data binding
- [ ] Handles undefined (loading) state properly
- [ ] Uses `nanoid()` for ID generation on create
- [ ] Query uses indexes (not full table scans)
- [ ] Dependencies array in useLiveQuery is correct

## Step 4: Common Issues to Check

### Performance
- Queries without indexes (will scan entire table)
- Missing compound indexes for filtered + sorted queries
- Fetching all records when only a subset is needed

### Correctness
- Schema version not incremented after changes
- Missing migration logic for schema changes
- Incorrect compound index syntax (`[a+b]` not `[a, b]`)

### Type Safety
- Using `any` instead of proper Dexie generics
- Missing null checks on useLiveQuery results
- ID type mismatches (string vs number)

## Step 5: Output Report

Provide a structured report:

```markdown
## Dexie Review Summary

### Tables Reviewed
- table1: OK / Issues found
- table2: OK / Issues found

### Issues Found
1. **[Severity: High/Medium/Low]** Description
   - Location: `file:line`
   - Fix: Suggested solution

### Recommendations
- Performance improvements
- Missing indexes to add
- Type safety enhancements

### Verdict
[ ] Ready for use
[ ] Needs fixes before proceeding
```

## Optional Arguments

If the user provides arguments, adjust the review:

- `--table=<name>`: Focus review on a specific table
- `--hooks-only`: Only review CRUD hooks, not schema
- `--verbose`: Include code snippets in the report
