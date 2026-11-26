# 🔧 Guia de Correção: Erro de Migrações Supabase

## Problema
`Remote migration versions not found in local migrations directory`

## ✅ Solução Rápida

### Opção 1: Executar o Script Automaticamente (Recomendado)

```bash
chmod +x scripts/sync-migrations.sh
./scripts/sync-migrations.sh
```

### Opção 2: Passos Manuais

#### 1. Verificar Migrações Locais
```bash
# Liste os arquivos de migração locais
ls -la supabase/migrations/

# Você deve ver estes arquivos:
# - 20260202163336_f401d1a1-8b35-4ca9-a2dd-ba8c1b392bb9.sql
# - 20260205164227_fa418452-6383-439f-bb26-271deb4cfaae.sql
# - 20260206013658_dee6bc66-ca71-4309-8f12-292af1bbf712.sql
# - 20260308173218_79ed7b9f-4412-4f3d-aa0f-258cf71124e9.sql
# - 20260309033724_6f589f83-617b-4e3e-ac81-8e095abbee43.sql
```

#### 2. Verificar Status no Supabase
```bash
# Veja o status atual
supabase status

# Isso vai mostrar quais migrações estão pendentes
```

#### 3. Sincronizar Migrações
```bash
# Resetar o banco local (CUIDADO: deleta dados locais!)
supabase db reset

# Fazer push para o Supabase remoto
supabase db push
```

#### 4. Confirmar que Funcionou
```bash
# Verifique se não há mais erros
supabase status
```

## 🔍 Entendendo o Erro

O erro ocorre quando:
- ❌ Você clona um repositório sem todos os arquivos de migração
- ❌ Migrações foram deletadas ou renomeadas
- ❌ O banco remoto tem versões que não existem localmente
- ✅ Solução: sincronizar local com remoto

## 📋 Estrutura de Migrações

```
supabase/
├── migrations/
│   ├── 20260202163336_*.sql    (user_roles)
│   ├── 20260205164227_*.sql    (first_admin)
│   ├── 20260206013658_*.sql    (update_pdv_roles)
│   ├── 20260308173218_*.sql    (stock_reduction)
│   └── 20260309033724_*.sql    (cancel_guest_order)
├── config.toml
└── .env.local
```

## ⚠️ Importante

- **Nunca delete ou renomeie** arquivos em `supabase/migrations/`
- **Sempre commit** novos arquivos de migração
- **Sincronize** antes de fazer push para produção
- **Teste localmente** com `supabase db reset` primeiro

## 🆘 Se Ainda Não Funcionar

1. Verifique credenciais do Supabase:
```bash
supabase projects list
supabase projects list --linked
```

2. Verifique se `.env.local` está configurado:
```bash
cat supabase/.env.local
# Deve conter SUPABASE_URL e SUPABASE_KEY
```

3. Reinstale o CLI:
```bash
npm uninstall -g supabase
npm install -g supabase@latest
```

4. Conecte ao projeto novamente:
```bash
supabase link --project-ref oyeovumtsepnngljxayd
```

## 📚 Referências
- [Supabase Migrations Docs](https://supabase.com/docs/guides/database/migrations)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
