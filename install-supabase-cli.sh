#!/bin/bash
# Supabase CLI Binary Kurulum Scripti (Linux x86_64)

ARCH="amd64"
INSTALL_DIR="$HOME/.local/bin"

echo "📦 Supabase CLI indiriliyor (Linux $ARCH)..."

# En son sürümü indir
wget -q https://github.com/supabase/cli/releases/latest/download/supabase_linux_${ARCH}.tar.gz -O /tmp/supabase.tar.gz

if [ $? -ne 0 ]; then
    echo "❌ İndirme başarısız!"
    exit 1
fi

echo "📂 Arşiv açılıyor..."
tar -xzf /tmp/supabase.tar.gz -C /tmp

echo "📁 Binary kuruluyor..."
mkdir -p "$INSTALL_DIR"
mv /tmp/supabase "$INSTALL_DIR/supabase"
chmod +x "$INSTALL_DIR/supabase"

# PATH kontrolü
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo ""
    echo "⚠️  PATH'e ekleniyor..."
    if [ -f ~/.bashrc ]; then
        echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> ~/.bashrc
        echo "✅ ~/.bashrc'ye eklendi"
    fi
    if [ -f ~/.zshrc ]; then
        echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> ~/.zshrc
        echo "✅ ~/.zshrc'ye eklendi"
    fi
    export PATH="$HOME/.local/bin:$PATH"
fi

# Temizlik
rm /tmp/supabase.tar.gz

echo ""
echo "✅ Supabase CLI kuruldu!"
echo ""
echo "Kontrol için:"
echo "  $HOME/.local/bin/supabase --version"
echo ""
echo "Eğer 'command not found' hatası alırsanız:"
echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
echo "  veya terminali yeniden başlatın"


