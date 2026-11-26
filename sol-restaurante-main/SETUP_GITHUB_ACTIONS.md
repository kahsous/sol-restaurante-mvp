# 🚀 Guia: Configuração Final do GitHub Actions

## Passo 1: Obter o Token de Acesso do Supabase

### 1.1 Acesse o Dashboard do Supabase
- Vá para [supabase.com](https://supabase.com)
- Faça login na sua conta
- Clique no seu projeto **Sol Restaurante**

### 1.2 Gere um Token de Acesso
1. Clique em **Settings** (engrenagem)
2. Vá para **API Tokens** 
3. Clique em **Generate New Token**
4. Nome: `GitHub Actions`
5. Selecione as permissões:
   - ✓ database
   - ✓ migrations
6. Copie o token gerado (você vai usar em breve)

## Passo 2: Adicionar Secret no GitHub

### 2.1 Navegue até Settings do Repositório
1. Abra [github.com/kahsous/sol-restaurante](https://github.com/kahsous/sol-restaurante)
2. Clique em **Settings**
3. Na sidebar esquerda, vá para **Secrets and variables → Actions**

### 2.2 Criar o Secret
1. Clique em **New repository secret**
2. Preenchimento:
   - **Name:** `SUPABASE_ACCESS_TOKEN`
   - **Secret:** Cole o token que você copiou do Supabase
3. Clique em **Add secret**

✅ Você verá a mensagem: "Repository secret added"

## Passo 3: Criar o GitHub Actions Workflow

### 3.1 Crie o arquivo de workflow
1. No seu computador, crie a pasta se não existir:
   ```bash
   mkdir -p .github/workflows
   ```

2. Crie o arquivo `migrations.yml`:
   ```bash
   touch .github/workflows/migrations.yml
   ```

### 3.2 Adicione o conteúdo

```yaml
name: Sync Supabase Migrations

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/migrations/**'
  workflow_dispatch:

jobs:
  sync-migrations:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Supabase CLI
        run: npm install -g supabase@latest

      - name: Link to Supabase project
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        run: |
          supabase link --project-ref oyeovumtsepnngljxayd

      - name: Push migrations to remote
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        run: supabase db push

      - name: Verify migrations synced
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        run: supabase status
```

### 3.3 Commit e Push
```bash
git add .github/workflows/migrations.yml
git commit -m "ci: add GitHub Actions workflow for migration sync"
git push origin main
```

## Passo 4: Sincronizar Localmente

### 4.1 Execute o script de sincronização
```bash
chmod +x scripts/sync-migrations.sh
./scripts/sync-migrations.sh
```

Siga as instruções:
1. Quando perguntado se deseja resetar o banco local, responda `s` (sim)
2. O script fará push das migrações para o Supabase

## Passo 5: Verificar se Funcionou

### 5.1 No GitHub
1. Vá para [github.com/kahsous/sol-restaurante/actions](https://github.com/kahsous/sol-restaurante/actions)
2. Você deve ver o workflow "Sync Supabase Migrations" rodando
3. Espere completar (deve aparecer ✅ verde)

### 5.2 No Supabase
1. Acesse o [Dashboard do Supabase](https://supabase.com)
2. Vá para **SQL Editor**
3. Execute a query para verificar as migrações:
   ```sql
   SELECT version, inserted_at FROM supabase_migrations.schema_migrations ORDER BY version;
   ```

Você deve ver estas 5 migrações:
- `20260202163336_...`
- `20260205164227_...`
- `20260206013658_...`
- `20260308173218_...`
- `20260309033724_...`

## 🎉 Pronto!

Agora sempre que você fazer push de um arquivo em `supabase/migrations/`, o GitHub Actions:
1. ✅ Detecta a mudança
2. ✅ Instala o Supabase CLI
3. ✅ Faz link com seu projeto
4. ✅ Sincroniza as migrações
5. ✅ Verifica se tudo passou

## 📋 Checklist Final

- [ ] Token de acesso do Supabase criado
- [ ] Secret `SUPABASE_ACCESS_TOKEN` adicionado no GitHub
- [ ] Arquivo `.github/workflows/migrations.yml` criado
- [ ] Script `scripts/sync-migrations.sh` executado localmente
- [ ] Migrações verificadas no Supabase
- [ ] Check da prévia do Supabase passando ✅

## 🆘 Se Algo Deu Errado

### Erro: "Unauthorized" 
- Verifique se o token foi copiado corretamente
- Regenere o token no Supabase

### Erro: "Project not found"
- Confirme que o `project_ref` está correto: `oyeovumtsepnngljxayd`
- Verifique em `supabase/config.toml`

### Erro: "Remote migration versions not found"
- Execute `supabase db reset` localmente
- Depois execute `supabase db push`

Para mais ajuda, veja [MIGRATIONS.md](./MIGRATIONS.md)
