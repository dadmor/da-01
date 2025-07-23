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
OUTPUT_FILE="${1:-views_schema.md}"

echo "🔗 Łączenie z bazą..."

# Zapytanie dla widoków z kolumnami, definicjami i zależnościami
psql "$CONNECTION_STRING" -t -A > "$OUTPUT_FILE" << 'EOF'
WITH view_columns AS (
  SELECT 
    c.table_name as view_name,
    STRING_AGG(
      c.column_name || ' ' ||
      CASE 
        WHEN c.data_type = 'character varying' THEN 'varchar'
        WHEN c.data_type = 'timestamp with time zone' THEN 'timestamp'
        WHEN c.data_type = 'USER-DEFINED' THEN c.udt_name
        WHEN c.data_type = 'integer' THEN 'int'
        WHEN c.data_type = 'smallint' THEN 'int'
        WHEN c.data_type = 'bigint' THEN 'bigint'
        WHEN c.data_type = 'boolean' THEN 'bool'
        WHEN c.data_type = 'double precision' THEN 'float'
        ELSE c.data_type
      END ||
      CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
      E'\n'
      ORDER BY c.ordinal_position
    ) as columns
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' 
    AND c.table_name IN (
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
    )
  GROUP BY c.table_name
),
view_dependencies AS (
  SELECT DISTINCT
    dependent_view.relname as view_name,
    STRING_AGG(
      DISTINCT 
      CASE 
        WHEN source_table.relkind = 'r' THEN 'TABLE: ' || source_table.relname
        WHEN source_table.relkind = 'v' THEN 'VIEW: ' || source_table.relname
        WHEN source_table.relkind = 'm' THEN 'MAT VIEW: ' || source_table.relname
      END,
      E'\n'
      ORDER BY 
        CASE 
          WHEN source_table.relkind = 'r' THEN 'TABLE: ' || source_table.relname
          WHEN source_table.relkind = 'v' THEN 'VIEW: ' || source_table.relname
          WHEN source_table.relkind = 'm' THEN 'MAT VIEW: ' || source_table.relname
        END
    ) as dependencies
  FROM pg_depend
  JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid
  JOIN pg_class as dependent_view ON pg_rewrite.ev_class = dependent_view.oid
  JOIN pg_class as source_table ON pg_depend.refobjid = source_table.oid
  JOIN pg_namespace ON dependent_view.relnamespace = pg_namespace.oid
  WHERE pg_namespace.nspname = 'public'
    AND dependent_view.relkind = 'v'
    AND source_table.relname NOT LIKE 'pg_%'
    AND source_table.relname NOT LIKE 'sql_%'
    AND source_table.relkind IN ('r', 'v', 'm')
  GROUP BY dependent_view.relname
),
view_definitions AS (
  SELECT 
    c.relname as view_name,
    CASE 
      WHEN c.relkind = 'v' THEN 'VIEW'
      WHEN c.relkind = 'm' THEN 'MATERIALIZED VIEW'
    END as view_type,
    pg_get_viewdef(c.oid, true) as definition
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND c.relkind IN ('v', 'm')
),
materialized_view_indexes AS (
  SELECT 
    tablename as view_name,
    STRING_AGG(
      'IDX: ' || indexname || ' (' || 
      REPLACE(REPLACE(indexdef, 'CREATE INDEX ' || indexname || ' ON public.' || tablename || ' USING ', ''), 
              'CREATE UNIQUE INDEX ' || indexname || ' ON public.' || tablename || ' USING ', '[UNIQUE] ') || ')',
      E'\n'
      ORDER BY indexname
    ) as indexes
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN (
      SELECT matviewname FROM pg_matviews WHERE schemaname = 'public'
    )
  GROUP BY tablename
),
triggers_on_views AS (
  SELECT 
    event_object_table as view_name,
    STRING_AGG(
      'TRIGGER: ' || trigger_name || ' (' || 
      event_manipulation || ' - ' || action_timing || ' ' || action_orientation || 
      CASE 
        WHEN action_statement IS NOT NULL THEN ' - ' || action_statement
        ELSE ''
      END || ')',
      E'\n'
      ORDER BY trigger_name
    ) as triggers
  FROM information_schema.triggers
  WHERE event_object_schema = 'public'
    AND event_object_table IN (
      SELECT table_name FROM information_schema.views WHERE table_schema = 'public'
    )
  GROUP BY event_object_table
),
rules_on_views AS (
  SELECT 
    c.relname as view_name,
    STRING_AGG(
      'RULE: ' || r.rulename || 
      CASE 
        WHEN r.ev_type = '1' THEN ' (SELECT)'
        WHEN r.ev_type = '2' THEN ' (UPDATE)'
        WHEN r.ev_type = '3' THEN ' (INSERT)'
        WHEN r.ev_type = '4' THEN ' (DELETE)'
      END ||
      CASE WHEN r.is_instead THEN ' INSTEAD' ELSE '' END,
      E'\n'
      ORDER BY r.rulename
    ) as rules
  FROM pg_rewrite r
  JOIN pg_class c ON r.ev_class = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND c.relkind = 'v'
    AND r.rulename != '_RETURN'
  GROUP BY c.relname
),
view_comments AS (
  SELECT 
    c.relname as view_name,
    d.description as comment
  FROM pg_class c
  LEFT JOIN pg_description d ON c.oid = d.objoid AND d.objsubid = 0
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND c.relkind IN ('v', 'm')
    AND d.description IS NOT NULL
)
SELECT 
  '# DATABASE VIEWS' || E'\n' ||
  'Generated: ' || NOW()::text || E'\n\n' ||
  STRING_AGG(
    '# ' || vd.view_name || ' [' || vd.view_type || ']' || E'\n' ||
    CASE 
      WHEN vc.comment IS NOT NULL 
      THEN '📝 ' || vc.comment || E'\n\n'
      ELSE ''
    END ||
    COALESCE(c.columns, 'No column information available') ||
    CASE 
      WHEN d.dependencies IS NOT NULL 
      THEN E'\n---\n📊 Dependencies:\n' || d.dependencies 
      ELSE '' 
    END ||
    CASE 
      WHEN mvi.indexes IS NOT NULL 
      THEN E'\n---\n🔍 Indexes:\n' || mvi.indexes 
      ELSE '' 
    END ||
    CASE 
      WHEN t.triggers IS NOT NULL 
      THEN E'\n---\n⚡ Triggers:\n' || t.triggers 
      ELSE '' 
    END ||
    CASE 
      WHEN r.rules IS NOT NULL 
      THEN E'\n---\n📋 Rules:\n' || r.rules 
      ELSE '' 
    END ||
    CASE 
      WHEN vd.definition IS NOT NULL AND LENGTH(TRIM(vd.definition)) > 0
      THEN E'\n---\n📄 Definition:\n```sql\n' || vd.definition || E'\n```'
      ELSE ''
    END,
    E'\n\n'
    ORDER BY 
      CASE vd.view_type 
        WHEN 'VIEW' THEN 1 
        WHEN 'MATERIALIZED VIEW' THEN 2 
      END,
      vd.view_name
  ) as full_schema
FROM view_definitions vd
LEFT JOIN view_columns c ON vd.view_name = c.view_name
LEFT JOIN view_dependencies d ON vd.view_name = d.view_name
LEFT JOIN materialized_view_indexes mvi ON vd.view_name = mvi.view_name
LEFT JOIN triggers_on_views t ON vd.view_name = t.view_name
LEFT JOIN rules_on_views r ON vd.view_name = r.view_name
LEFT JOIN view_comments vc ON vd.view_name = vc.view_name;
EOF

# Sprawdź czy zapytanie się powiodło
if [ $? -eq 0 ]; then
    echo "✅ Schema widoków zapisany do: $OUTPUT_FILE"
    echo ""
    echo "📊 Legenda:"
    echo "  VIEW           - Zwykły widok"
    echo "  MATERIALIZED   - Widok zmaterializowany"
    echo "  Dependencies   - Tabele/widoki używane przez widok"
    echo "  Indexes        - Indeksy (tylko dla widoków zmaterializowanych)"
    echo "  Triggers       - Triggery na widoku"
    echo "  Rules          - Reguły (np. INSTEAD OF dla updatable views)"
    echo "  Definition     - Pełna definicja SQL widoku"
    echo ""
    echo "🔍 Funkcje:"
    echo "  - Kolumny widoku z typami danych"
    echo "  - Zależności od tabel i innych widoków"
    echo "  - Komentarze do widoków (jeśli istnieją)"
    echo "  - Triggery i reguły"
    echo "  - Pełne definicje SQL"
    echo "  - Indeksy dla widoków zmaterializowanych"
    
    # Szybkie podsumowanie
    VIEW_COUNT=$(grep -c "# .* \[VIEW\]" "$OUTPUT_FILE" 2>/dev/null || echo "0")
    MAT_VIEW_COUNT=$(grep -c "# .* \[MATERIALIZED VIEW\]" "$OUTPUT_FILE" 2>/dev/null || echo "0")
    
    echo ""
    echo "📈 Statystyki:"
    echo "  - Widoków: $VIEW_COUNT"
    echo "  - Widoków zmaterializowanych: $MAT_VIEW_COUNT"
else
    echo "❌ Błąd podczas pobierania schematu widoków"
    exit 1
fi