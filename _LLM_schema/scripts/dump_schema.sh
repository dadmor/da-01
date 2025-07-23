#!/bin/sh

# URUCHAMIAMY PRZEZ BASH!!!!
# bash dump_schema.sh > schema.sql

# Wczytaj zmienne z .env jeśli plik istnieje
if [ -f .env ]; then
    echo "📁 Wczytywanie zmiennych z .env..."
    set -a
    source .env
    set +a
fi

# Sprawdź wymagane zmienne
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "❌ Brakuje zmiennej VITE_SUPABASE_URL w .env"
    echo "Przykład: VITE_SUPABASE_URL=https://your-project.supabase.co"
    exit 1
fi

# Wyciągnij ref z URL (np. vvkjfzjikfuqdpmomdbx z https://vvkjfzjikfuqdpmomdbx.supabase.co)
SUPABASE_REF=$(echo "$VITE_SUPABASE_URL" | cut -d'.' -f1 | cut -d'/' -f3)

# Sprawdź czy hasło zostało podane
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
  echo "❌ Brakuje zmiennej SUPABASE_DB_PASSWORD w .env"
  echo "Możesz ją znaleźć w Supabase Dashboard → Settings → Database"
  echo ""
  echo "Alternatywnie uruchom:"
  echo "SUPABASE_DB_PASSWORD='twoje_haslo' bash dump_schema.sh"
  exit 1
fi

# Sprawdź czy udało się wyciągnąć ref
if [ -z "$SUPABASE_REF" ]; then
    echo "❌ Nie udało się wyciągnąć ref z URL: $VITE_SUPABASE_URL"
    exit 1
fi

# Zbuduj connection string
CONNECTION_STRING="postgresql://postgres.$SUPABASE_REF:$SUPABASE_DB_PASSWORD@aws-0-eu-north-1.pooler.supabase.com:5432/postgres"
OUTPUT_FILE="schema.sql"

echo "🔗 Łączenie z bazą: postgres.$SUPABASE_REF"
echo "📥 Pobieranie struktury bazy danych..."

# Sprawdź czy psql jest dostępny
if ! command -v psql >/dev/null 2>&1; then
    echo "❌ psql nie jest zainstalowany"
    echo "Na Ubuntu/Debian: sudo apt install postgresql-client"
    echo "Na macOS: brew install postgresql"
    exit 1
fi

psql "$CONNECTION_STRING" -t -c "
SELECT 
  'CREATE TABLE ' || table_name || ' (' || chr(10) ||
  string_agg(
    '  ' || column_name || ' ' || 
    CASE 
      WHEN data_type = 'ARRAY' THEN 'TEXT[]'
      WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMPTZ'
      ELSE UPPER(data_type)
    END ||
    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
    CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
    ',' || chr(10)
    ORDER BY ordinal_position
  ) ||
  chr(10) || ');' as create_statement
FROM information_schema.columns 
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;
" | sed 's/+$//' | sed 's/^ *//' > "$OUTPUT_FILE"



sed -i '/create_statement/d' "$OUTPUT_FILE"
sed -i '/^-\+$/d' "$OUTPUT_FILE"
sed -i '/^([0-9]* row/d' "$OUTPUT_FILE"
sed -i '/^$/d' "$OUTPUT_FILE"

echo "✅ Gotowe! Struktura zapisana w: $OUTPUT_FILE"
echo "📄 Podgląd:"
cat "$OUTPUT_FILE"