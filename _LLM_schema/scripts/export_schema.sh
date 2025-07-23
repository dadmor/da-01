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
OUTPUT_FILE="${1:-schema.md}"

echo "🔗 Łączenie z bazą..."

# Zapytanie dla czytelnego formatu z indeksami, kaskadami i enumami
psql "$CONNECTION_STRING" -t -A -c "
WITH table_columns AS (
  SELECT 
    c.table_name,
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
      CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
      CASE 
        WHEN c.column_default IS NOT NULL THEN 
          ' DEFAULT ' || 
          CASE 
            WHEN c.column_default LIKE 'nextval%' THEN 'auto_increment'
            WHEN c.column_default LIKE '%now()%' OR c.column_default LIKE '%CURRENT_TIMESTAMP%' THEN 'now()'
            ELSE c.column_default
          END
        ELSE ''
      END ||
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM information_schema.table_constraints tc
          JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
          WHERE tc.constraint_type = 'PRIMARY KEY' 
          AND tc.table_name = c.table_name 
          AND ccu.column_name = c.column_name
        ) THEN ' PK'
        ELSE ''
      END,
      E'\n'
      ORDER BY 
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = 'PRIMARY KEY' 
            AND tc.table_name = c.table_name 
            AND ccu.column_name = c.column_name
          ) THEN 0
          ELSE 1
        END,
        c.ordinal_position
    ) as columns
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' 
    AND c.table_name IN (
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    )
  GROUP BY c.table_name
),
foreign_keys AS (
  SELECT 
    tc.table_name,
    STRING_AGG(
      kcu.column_name || ' → ' || ccu.table_name || '.' || ccu.column_name ||
      CASE 
        WHEN rc.delete_rule != 'NO ACTION' THEN ' ON DELETE ' || rc.delete_rule
        ELSE ''
      END ||
      CASE 
        WHEN rc.update_rule != 'NO ACTION' THEN ' ON UPDATE ' || rc.update_rule
        ELSE ''
      END,
      E'\n'
      ORDER BY kcu.column_name
    ) as fk_list
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
  JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
  GROUP BY tc.table_name
),
indexes AS (
  SELECT 
    tablename,
    STRING_AGG(
      'IDX: ' || indexname || ' (' || REPLACE(REPLACE(REPLACE(indexdef, 'CREATE INDEX ' || indexname || ' ON public.' || tablename || ' USING ', ''), 'CREATE UNIQUE INDEX ' || indexname || ' ON public.' || tablename || ' USING ', '[UNIQUE] '), '()', '') || ')',
      E'\n'
      ORDER BY indexname
    ) as idx_list
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname NOT LIKE '%_pkey'
    AND indexname NOT LIKE 'pg_%'
    AND indexname NOT IN (
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE constraint_type = 'UNIQUE' 
      AND table_schema = 'public'
    )
  GROUP BY tablename
),
unique_constraints AS (
  SELECT 
    table_name,
    STRING_AGG(
      'UNQ: ' || constraint_name || ' (' || column_list || ')',
      E'\n'
      ORDER BY constraint_name
    ) as unq_list
  FROM (
    SELECT 
      tc.table_name,
      tc.constraint_name,
      STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as column_list
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'UNIQUE'
      AND tc.table_schema = 'public'
    GROUP BY tc.table_name, tc.constraint_name
  ) sub
  GROUP BY table_name
),
check_constraints AS (
  SELECT 
    tc.table_name,
    STRING_AGG(
      'CHK: ' || tc.constraint_name || ' (' || cc.check_clause || ')',
      E'\n'
      ORDER BY tc.constraint_name
    ) as chk_list
  FROM information_schema.table_constraints tc
  JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
  WHERE tc.constraint_type = 'CHECK'
    AND tc.table_schema = 'public'
    AND tc.constraint_name NOT LIKE '%_not_null'
    AND tc.constraint_name !~ '^[0-9]+_[0-9]+_[0-9]+_not_null\$'
  GROUP BY tc.table_name
),
enum_types AS (
  SELECT 
    t.typname as enum_name,
    STRING_AGG(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
  FROM pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
  WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  GROUP BY t.typname
),
tables_output AS (
  SELECT STRING_AGG(
    '# ' || t.table_name || E'\n' || 
    t.columns ||
    CASE 
      WHEN f.fk_list IS NOT NULL 
      THEN E'\n---\n' || f.fk_list 
      ELSE '' 
    END ||
    CASE 
      WHEN i.idx_list IS NOT NULL OR u.unq_list IS NOT NULL OR ch.chk_list IS NOT NULL
      THEN E'\n---'
      ELSE ''
    END ||
    CASE 
      WHEN i.idx_list IS NOT NULL 
      THEN E'\n' || i.idx_list 
      ELSE '' 
    END ||
    CASE 
      WHEN u.unq_list IS NOT NULL 
      THEN E'\n' || u.unq_list 
      ELSE '' 
    END ||
    CASE 
      WHEN ch.chk_list IS NOT NULL 
      THEN E'\n' || ch.chk_list 
      ELSE '' 
    END,
    E'\n\n'
    ORDER BY t.table_name
  ) as schema
  FROM table_columns t
  LEFT JOIN foreign_keys f ON t.table_name = f.table_name
  LEFT JOIN indexes i ON t.table_name = i.tablename
  LEFT JOIN unique_constraints u ON t.table_name = u.table_name
  LEFT JOIN check_constraints ch ON t.table_name = ch.table_name
)
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM enum_types) 
    THEN '# ENUM TYPES' || E'\n' || 
      (SELECT STRING_AGG(
        enum_name || ': (' || enum_values || ')',
        E'\n'
        ORDER BY enum_name
      ) FROM enum_types) || E'\n\n'
    ELSE ''
  END ||
  COALESCE(tables_output.schema, '') as full_schema
FROM tables_output;" > "$OUTPUT_FILE"

# Sprawdź czy zapytanie się powiodło
if [ $? -eq 0 ]; then
    echo "✅ Schema zapisany do: $OUTPUT_FILE"
    echo ""
    echo "📊 Legenda:"
    echo "  PK         - Primary Key"
    echo "  →          - Foreign Key"
    echo "  IDX        - Index"
    echo "  UNQ        - Unique Constraint"
    echo "  CHK        - Check Constraint"
    echo "  DEFAULT    - Default Value"
    echo "  ON DELETE  - Cascade rule for delete"
    echo "  ON UPDATE  - Cascade rule for update"
    echo ""
    echo "🔍 Nowe funkcje:"
    echo "  - Typy ENUM z wartościami"
    echo "  - Reguły kaskadowe (CASCADE/RESTRICT/SET NULL)"
    echo "  - Wartości domyślne kolumn"
else
    echo "❌ Błąd podczas pobierania schematu"
    exit 1
fi