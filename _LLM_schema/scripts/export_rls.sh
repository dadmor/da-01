#!/bin/bash

# Wczytaj zmienne z .env
if [ -f ./.env ]; then
    set -a
    source .env
    set +a
fi

# Sprawdź wymagane zmienne
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "❌ Brakuje zmiennych VITE_SUPABASE_URL lub SUPABASE_DB_PASSWORD"
    exit 1
fi

# Wyciągnij ref z URL
SUPABASE_REF=$(echo "$VITE_SUPABASE_URL" | cut -d'.' -f1 | cut -d'/' -f3)

# Connection string
CONNECTION_STRING="postgresql://postgres.$SUPABASE_REF:$SUPABASE_DB_PASSWORD@aws-0-eu-north-1.pooler.supabase.com:5432/postgres"
OUTPUT_FILE="${1:-rls_policies.md}"

echo "🔗 Łączenie z bazą..."

# Zapytanie dla polityk RLS
psql "$CONNECTION_STRING" -t -A > "$OUTPUT_FILE" << 'EOF'
WITH table_rls_status AS (
  SELECT 
    c.relname as table_name,
    c.relrowsecurity as rls_enabled,
    c.relforcerowsecurity as rls_forced,
    CASE 
      WHEN c.relrowsecurity THEN '✅ ENABLED'
      ELSE '❌ DISABLED'
    END as rls_status,
    CASE 
      WHEN c.relforcerowsecurity THEN ' (FORCED)'
      ELSE ''
    END as force_status
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
  ORDER BY c.relname
),
policies AS (
  SELECT 
    pol.polname as policy_name,
    c.relname as table_name,
    CASE pol.polcmd
      WHEN 'r' THEN 'SELECT'
      WHEN 'a' THEN 'INSERT'
      WHEN 'w' THEN 'UPDATE'
      WHEN 'd' THEN 'DELETE'
      WHEN '*' THEN 'ALL'
    END as command,
    CASE 
      WHEN pol.polpermissive THEN 'PERMISSIVE'
      ELSE 'RESTRICTIVE'
    END as type,
    CASE
      WHEN pol.polroles = '{0}' THEN 'PUBLIC'
      ELSE (
        SELECT STRING_AGG(r.rolname, ', ' ORDER BY r.rolname)
        FROM pg_roles r
        WHERE r.oid = ANY(pol.polroles)
      )
    END as roles,
    CASE 
      WHEN pol.polqual IS NOT NULL THEN pg_get_expr(pol.polqual, pol.polrelid, true)
      ELSE 'true'
    END as using_expression,
    CASE 
      WHEN pol.polwithcheck IS NOT NULL THEN pg_get_expr(pol.polwithcheck, pol.polrelid, true)
      ELSE NULL
    END as check_expression,
    pol.polcmd
  FROM pg_policy pol
  JOIN pg_class c ON c.oid = pol.polrelid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
  ORDER BY c.relname, pol.polcmd, pol.polname
),
policy_definitions AS (
  SELECT 
    table_name,
    STRING_AGG(
      '### Policy: `' || policy_name || '`' || E'\n' ||
      '- **Command**: ' || command || E'\n' ||
      '- **Type**: ' || type || E'\n' ||
      '- **Roles**: ' || roles || E'\n' ||
      '- **USING**: ' || E'\n```sql\n' || using_expression || E'\n```\n' ||
      CASE 
        WHEN check_expression IS NOT NULL 
        THEN '- **WITH CHECK**: ' || E'\n```sql\n' || check_expression || E'\n```\n'
        ELSE ''
      END ||
      E'\n**Full Definition**:' || E'\n```sql\n' ||
      'CREATE POLICY "' || policy_name || '"' || E'\n' ||
      'ON public.' || table_name || E'\n' ||
      'AS ' || type || E'\n' ||
      'FOR ' || command || E'\n' ||
      'TO ' || roles || E'\n' ||
      'USING (' || using_expression || ')' ||
      CASE 
        WHEN check_expression IS NOT NULL 
        THEN E'\nWITH CHECK (' || check_expression || ')'
        ELSE ''
      END || ';' || E'\n```',
      E'\n\n'
      ORDER BY 
        CASE polcmd 
          WHEN 'r' THEN 1  -- SELECT
          WHEN 'a' THEN 2  -- INSERT
          WHEN 'w' THEN 3  -- UPDATE
          WHEN 'd' THEN 4  -- DELETE
          WHEN '*' THEN 5  -- ALL
        END,
        policy_name
    ) as policies
  FROM policies
  GROUP BY table_name
),
table_summary AS (
  SELECT 
    table_name,
    COUNT(*) as policy_count,
    STRING_AGG(DISTINCT command, ', ' ORDER BY command) as commands_covered
  FROM policies
  GROUP BY table_name
)
SELECT 
  '# ROW LEVEL SECURITY (RLS) POLICIES' || E'\n' ||
  'Generated: ' || NOW()::text || E'\n\n' ||
  
  '## 📊 RLS STATUS BY TABLE' || E'\n\n' ||
  '| Table | RLS Status | Policies | Commands Covered |' || E'\n' ||
  '|-------|------------|----------|------------------|' || E'\n' ||
  (
    SELECT STRING_AGG(
      '| ' || rls.table_name || 
      ' | ' || rls.rls_status || rls.force_status || 
      ' | ' || COALESCE(ts.policy_count::text, '0') || 
      ' | ' || COALESCE(ts.commands_covered, 'None') || ' |',
      E'\n'
      ORDER BY rls.table_name
    )
    FROM table_rls_status rls
    LEFT JOIN table_summary ts ON rls.table_name = ts.table_name
  ) || E'\n\n' ||
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM policies) 
    THEN '## 🔐 POLICIES BY TABLE' || E'\n\n' || 
      (
        SELECT STRING_AGG(
          '## Table: `' || pd.table_name || '`' || E'\n' ||
          '**RLS Status**: ' || rls.rls_status || rls.force_status || E'\n\n' ||
          pd.policies,
          E'\n\n'
          ORDER BY pd.table_name
        )
        FROM policy_definitions pd
        JOIN table_rls_status rls ON pd.table_name = rls.table_name
      )
    ELSE '## 🔐 POLICIES BY TABLE\n\n*No policies found in public schema*'
  END || E'\n\n' ||
  
  '## 📝 NOTES' || E'\n\n' ||
  '- **PERMISSIVE**: Policies are combined with OR (at least one must pass)' || E'\n' ||
  '- **RESTRICTIVE**: Policies are combined with AND (all must pass)' || E'\n' ||
  '- **USING**: Determines which rows can be seen/affected' || E'\n' ||
  '- **WITH CHECK**: Additional check for INSERT/UPDATE operations' || E'\n' ||
  '- **FORCED**: RLS applies even to table owner and superusers' || E'\n\n' ||
  
  '## 🚀 QUICK COMMANDS' || E'\n\n' ||
  '```sql' || E'\n' ||
  '-- Enable RLS on a table' || E'\n' ||
  'ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;' || E'\n\n' ||
  
  '-- Force RLS (even for owner)' || E'\n' ||
  'ALTER TABLE table_name FORCE ROW LEVEL SECURITY;' || E'\n\n' ||
  
  '-- Disable RLS' || E'\n' ||
  'ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;' || E'\n\n' ||
  
  '-- Drop all policies on a table' || E'\n' ||
  'DROP POLICY IF EXISTS policy_name ON table_name;' || E'\n' ||
  '```' as export;
EOF

# Sprawdź czy zapytanie się powiodło
if [ $? -eq 0 ]; then
    echo "✅ Polityki RLS zapisane do: $OUTPUT_FILE"
    echo ""
    echo "📊 Wyeksportowano:"
    echo "  - Status RLS dla każdej tabeli"
    echo "  - Szczegóły wszystkich polityk"
    echo "  - Wyrażenia USING i WITH CHECK"
    echo "  - Pełne definicje CREATE POLICY"
    echo ""
    
    # Szybkie podsumowanie
    TABLE_COUNT=$(grep -c "^| [^|]* | ✅ ENABLED" "$OUTPUT_FILE" 2>/dev/null || echo "0")
    POLICY_COUNT=$(grep -c "### Policy:" "$OUTPUT_FILE" 2>/dev/null || echo "0")
    
    echo "📈 Statystyki:"
    echo "  - Tabel z włączonym RLS: $TABLE_COUNT"
    echo "  - Łączna liczba polityk: $POLICY_COUNT"
    
    # Ostrzeżenie o tabelach bez RLS
    DISABLED_COUNT=$(grep -c "^| [^|]* | ❌ DISABLED" "$OUTPUT_FILE" 2>/dev/null || echo "0")
    if [ "$DISABLED_COUNT" -gt 0 ]; then
        echo ""
        echo "⚠️  Uwaga: $DISABLED_COUNT tabel nie ma włączonego RLS!"
    fi
else
    echo "❌ Błąd podczas pobierania polityk RLS"
    exit 1
fi