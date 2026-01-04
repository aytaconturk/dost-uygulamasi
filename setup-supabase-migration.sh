#!/bin/bash
# Supabase Migration Setup Script

echo "🚀 Supabase Migration Setup Başlatılıyor..."

# 1. Supabase CLI kurulumu kontrolü
if ! command -v supabase &> /dev/null; then
    echo "📦 Supabase CLI kuruluyor..."
    npm install -g supabase
else
    echo "✅ Supabase CLI zaten kurulu"
fi

# 2. Supabase klasörü oluştur
if [ ! -d "supabase" ]; then
    echo "📁 supabase klasörü oluşturuluyor..."
    mkdir -p supabase/migrations
else
    echo "✅ supabase klasörü mevcut"
    if [ ! -d "supabase/migrations" ]; then
        mkdir -p supabase/migrations
    fi
fi

# 3. Migration dosyasını kopyala
TIMESTAMP=$(date +%Y%m%d%H%M%S)
MIGRATION_FILE="supabase/migrations/${TIMESTAMP}_add_sessions_and_tracking_tables.sql"

if [ -f "SUPABASE_MIGRATION.sql" ]; then
    echo "📋 Migration dosyası kopyalanıyor..."
    cp SUPABASE_MIGRATION.sql "$MIGRATION_FILE"
    echo "✅ Migration dosyası oluşturuldu: $MIGRATION_FILE"
else
    echo "❌ SUPABASE_MIGRATION.sql dosyası bulunamadı!"
    exit 1
fi

echo ""
echo "✅ Setup tamamlandı!"
echo ""
echo "📝 Sonraki adımlar:"
echo "1. supabase login"
echo "2. supabase link --project-ref uitwmrclbpvhrcrotlcs"
echo "3. supabase db push"
echo ""


