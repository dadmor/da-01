# ROW LEVEL SECURITY (RLS) POLICIES
Generated: 2025-07-23 12:19:33.281356+00

## 📊 RLS STATUS BY TABLE

| Table | RLS Status | Policies | Commands Covered |
|-------|------------|----------|------------------|
| articles | ❌ DISABLED | 0 | None |
| badge_criteria | ❌ DISABLED | 0 | None |
| badges | ❌ DISABLED | 0 | None |
| class_enrollments | ❌ DISABLED | 0 | None |
| class_lessons | ❌ DISABLED | 0 | None |
| classes | ❌ DISABLED | 0 | None |
| incorrect_answers | ❌ DISABLED | 0 | None |
| lessons | ❌ DISABLED | 0 | None |
| progress | ❌ DISABLED | 0 | None |
| tasks | ❌ DISABLED | 0 | None |
| user_badges | ❌ DISABLED | 0 | None |
| users | ❌ DISABLED | 0 | None |

## 🔐 POLICIES BY TABLE\n\n*No policies found in public schema*

## 📝 NOTES

- **PERMISSIVE**: Policies are combined with OR (at least one must pass)
- **RESTRICTIVE**: Policies are combined with AND (all must pass)
- **USING**: Determines which rows can be seen/affected
- **WITH CHECK**: Additional check for INSERT/UPDATE operations
- **FORCED**: RLS applies even to table owner and superusers

## 🚀 QUICK COMMANDS

```sql
-- Enable RLS on a table
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Force RLS (even for owner)
ALTER TABLE table_name FORCE ROW LEVEL SECURITY;

-- Disable RLS
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Drop all policies on a table
DROP POLICY IF EXISTS policy_name ON table_name;
```
