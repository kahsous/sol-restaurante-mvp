#!/bin/bash

# Script para sincronizar migrações do Supabase
# Este script reconnecta as migrações locais com o banco remoto

set -e

echo "🔧 Iniciando sincronização de migrações Supabase..."

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não instalado. Instale com: npm install -g supabase"
    exit 1
fi

# Status atual
echo "📊 Verificando status das migrações locais..."
supabase status

# Resetar banco local (AVISO: deleta dados)
read -p "⚠️  Deseja resetar o banco local? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "🔄 Resetando banco local..."
    supabase db reset
fi

# Push das migrações para remoto
echo "📤 Fazendo push das migrações para Supabase..."
supabase db push

echo "✅ Migrações sincronizadas com sucesso!"
echo "🎉 A prévia do Supabase agora deve funcionar corretamente."
