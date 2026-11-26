# Sol Restaurante 🍽️

Sistema de gerenciamento de pedidos para restaurante com suporte para múltiplos canais.

## 🎯 Funcionalidades

### 📱 Canais de Pedido
- **Pedidos Online** - Clientes fazem pedidos direto no site
- **WhatsApp** - Recebimento de pedidos via WhatsApp Business API
- **PDV Caixa** - Interface escura para operadores venderem no balcão
- **Menu Online** - Cardápio atualizado em tempo real

### 🖥️ Interfaces
- **PDV Admin** - Gerenciamento de usuários, categorias e produtos
- **PDV Caixa** - Venda rápida no balcão (sem comanda)
- **PDV Cozinha** - Exibição de pedidos para preparação
- **PDV Entrega** - Rastreamento de entregas
- **Site Público** - Cardápio e pedidos online

### 💳 Gestão
- Histórico completo de pedidos
- Filtros por origem (online, whatsapp, pdv)
- Relatórios de vendas
- Controle de estoque

## 🚀 Stack Técnico

- **Frontend:** React 19 + TypeScript + TailwindCSS
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Auth:** Supabase Auth (JWT)
- **API:** WhatsApp Business API

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/kahsous/sol-restaurante.git

# Instale as dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local

# Rode localmente
npm run dev
```

## 🔧 Configuração

### WhatsApp Business API

1. Acesse https://business.facebook.com
2. Crie/configure número WhatsApp Business
3. Gere Access Token
4. Configure em `.env.local`:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_PUBLISHABLE_KEY=...
   WHATSAPP_API_TOKEN=...
   WHATSAPP_PHONE_NUMBER_ID=...
   WHATSAPP_VERIFY_TOKEN=sol_restaurante_token
   ```

5. Configure webhook no Facebook:
   - **URL:** `https://seu-projeto.supabase.co/functions/v1/whatsapp-webhook`
   - **Verify Token:** `sol_restaurante_token`

### Deploy das Edge Functions

```bash
npx supabase login
npx supabase functions deploy whatsapp-webhook
npx supabase functions deploy create-online-order
```

## 📋 Estrutura do Projeto

```
sol-restaurante/
├── src/
│   ├── components/     # Componentes React
│   ├── pages/          # Páginas principais
│   ├── hooks/          # Custom hooks
│   ├── types/          # TypeScript types
│   ├── lib/            # Utilitários
│   └── integrations/   # Configurações externas
├── supabase/
│   ├── functions/      # Edge Functions
│   └── migrations/     # Migrations PostgreSQL
└── public/             # Arquivos estáticos
```

## 🔄 Fluxo de Pedidos

### Online
```
Cliente acessa /pedido-online
    ↓
Seleciona produtos
    ↓
Preenche dados
    ↓
Envia pedido
    ↓
PDV vê novo pedido
```

### WhatsApp
```
Cliente envia mensagem
    ↓
Webhook recebe evento
    ↓
Cria pedido automático
    ↓
Envia confirmação ao cliente
    ↓
PDV vê novo pedido
```

### PDV Caixa
```
Operador acessa /pdv/caixa
    ↓
Seleciona produtos
    ↓
Adiciona ao carrinho
    ↓
Clica "Finalizar Venda"
    ↓
Cozinha recebe pedido
```

## 📊 Tabelas Principais

### `orders`
```sql
id, source, customer_name, customer_phone, customer_email,
status, items, subtotal, total, notes,
created_at, updated_at
```

### `products`
```sql
id, category_id, name, description,
price_pequena, price_media, price_grande,
is_active, track_stock, stock_quantity
```

### `whatsapp_events`
```sql
id, event_type, payload, processed, processed_at, created_at
```

## 🧪 Testes

### WhatsApp Webhook
```bash
curl -X POST "http://localhost:54321/functions/v1/whatsapp-webhook" \
  -H "Content-Type: application/json" \
  -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"558599999999","text":{"body":"2 isca + 1 filé"}}],"contacts":[{"wa_id":"558599999999","profile":{"name":"João"}}]}}]}]}'
```

### Pedido Online
```bash
curl -X POST "http://localhost:54321/functions/v1/create-online-order" \
  -H "Content-Type: application/json" \
  -d '{
    "items":[{"id":"1","name":"Isca","unitPrice":32.20,"quantity":2}],
    "customer_name":"Maria",
    "customer_phone":"85999999999"
  }'
```

## 📚 Documentação

- [IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md) - Detalhes da implementação
- [REMOVED_IFOOD.md](./REMOVED_IFOOD.md) - O que foi removido e por quê

## 🤝 Contribuindo

1. Crie uma branch: `git checkout -b feature/minha-feature`
2. Commit: `git commit -m "feat: adicionar minha feature"`
3. Push: `git push origin feature/minha-feature`
4. Abra um Pull Request

## 📝 License

MIT - veja LICENSE.md

---

**Desenvolvido com ❤️ para o Sol Restaurante**
