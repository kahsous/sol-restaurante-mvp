# Implementação: WhatsApp + Pedidos Online + PDV Otimizado

## ✅ Arquivos Criados

### 1. **WhatsApp Webhook** (`supabase/functions/whatsapp-webhook/index.ts`)
- Recebe eventos do WhatsApp Business API
- Cria automaticamente pedidos a partir de mensagens
- Envia confirmação automática ao cliente
- Log de todos os eventos para auditoria

**Variáveis de ambiente necessárias:**
```bash
WHATSAPP_VERIFY_TOKEN=sol_restaurante_token
WHATSAPP_API_TOKEN=seu_token_aqui
WHATSAPP_PHONE_NUMBER_ID=seu_phone_id_aqui
```

**URL do Webhook:**
```
https://oyeovumtsepnngljxayd.supabase.co/functions/v1/whatsapp-webhook
```

### 2. **Pedidos Online** (`supabase/functions/create-online-order/index.ts`)
- Edge function para criar pedidos do site
- Valida itens e dados do cliente
- Retorna confirmação com ID do pedido

### 3. **Página Online** (`src/pages/OnlineOrder.tsx`)
- Interface pública para clientes pedirem online
- Cardápio completo com categorias
- Carrinho visual
- Formulário com dados do cliente
- Envia pedido via API

### 4. **PDV Caixa** (`src/pages/PDVCashier.tsx`)
- Interface escura (melhor para caixa)
- Grade grande de produtos por categoria
- Adicionar/remover itens rapidamente
- Quantidade com +/- botões
- Total em tempo real
- Botão de finalizar venda

### 5. **Migration** (`supabase/migrations/20260802000000_add_order_sources.sql`)
- Tabela `whatsapp_events` para log de eventos
- Coluna `source` na tabela `orders` (pdv, ifood, online, whatsapp)
- Índices para performance
- RLS policies

---

## 🔧 Configuração Necessária

### WhatsApp Business API
1. Acesse: https://business.facebook.com
2. Crie/configure número WhatsApp Business
3. Gere Access Token
4. Configure o webhook:
   - **URL Callback:** `https://oyeovumtsepnngljxayd.supabase.co/functions/v1/whatsapp-webhook`
   - **Verify Token:** `sol_restaurante_token`
   - **Subscribe to:** `messages`, `message_status`

### Deploy das Edge Functions
```bash
npx supabase login
npx supabase functions deploy whatsapp-webhook
npx supabase functions deploy create-online-order
```

### Adicione as rotas no seu App
```tsx
// src/App.tsx
import { OnlineOrder } from "./pages/OnlineOrder";
import { PDVCashier } from "./pages/PDVCashier";

// Rotas públicas
<Route path="/pedido-online" element={<OnlineOrder />} />

// Rotas protegidas
<ProtectedRoute path="/pdv/caixa" element={<PDVCashier />} />
```

---

## 📊 Fluxo de Dados

### Pedido Online
```
Cliente preenche formulário
        ↓
[OnlineOrder.tsx] POST /functions/v1/create-online-order
        ↓
[create-online-order] Valida e insere em "orders"
        ↓
[orders table] status="pending" source="online"
        ↓
[PDV] Operador vê novo pedido online
```

### Pedido WhatsApp
```
Cliente envia mensagem no WhatsApp
        ↓
[WhatsApp Business API] Webhook POST
        ↓
[whatsapp-webhook] Log em whatsapp_events
        ↓
[whatsapp-webhook] Cria order com source="whatsapp"
        ↓
[whatsapp-webhook] Envia confirmação automática
        ↓
[PDV] Operador vê novo pedido WhatsApp
```

### Pedido PDV Caixa
```
Operador seleciona produtos
        ↓
[PDVCashier.tsx] Adiciona ao carrinho
        ↓
Operador clica "Finalizar Venda"
        ↓
[PDVCashier.tsx] POST /functions/v1/create-online-order
        ↓
[orders table] status="preparing" source="pdv"
        ↓
[Cozinha] Recebe pedido para preparar
```

---

## 🧪 Teste Local

### WhatsApp Webhook
```bash
# Verificar webhook
curl -X GET "https://localhost:54321/functions/v1/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=sol_restaurante_token&hub.challenge=test123"

# Enviar evento de teste
curl -X POST "https://localhost:54321/functions/v1/whatsapp-webhook" \
  -H "Content-Type: application/json" \
  -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"5585999999999","text":{"body":"Gostaria de 2 isca + 1 filé grelhado"}}],"contacts":[{"wa_id":"5585999999999","profile":{"name":"João"}}]}}]}]}}'
```

### Pedido Online
```bash
curl -X POST "https://localhost:54321/functions/v1/create-online-order" \
  -H "Content-Type: application/json" \
  -d '{
    "items":[{"id":"1","name":"Isca de Frango","unitPrice":32.20,"quantity":2,"size":"media"}],
    "customer_name":"Maria Silva",
    "customer_phone":"85999999999",
    "customer_email":"maria@example.com"
  }'
```

---

## 📱 Interface do Usuário

### OnlineOrder.tsx
- Header com descrição
- Categorias em coluna esquerda
- Produtos em grid
- Carrinho sticky à direita
- Formulário de dados do cliente
- Botão de envio

### PDVCashier.tsx
- Tema escuro (menos cansar os olhos)
- Abas de categorias no topo
- Grade grande de produtos
- Carrinho na direita com controles de quantidade
- Botão verde "Finalizar Venda" grande

---

## 🔐 Segurança

✅ **Implementado:**
- RLS policies na tabela `whatsapp_events`
- Autenticação em edge functions
- Validação de dados de entrada
- Log completo de eventos

**Próximos passos:**
- Rate limiting no WhatsApp webhook
- HMAC signature validation
- Audit trail de todas as ações

---

## 🚀 Próximas Features (Fase 2)

- [ ] Notificações em tempo real de novos pedidos
- [ ] Impressão automática de pedidos na cozinha
- [ ] Histórico de pedidos por cliente (WhatsApp)
- [ ] Menu contextual no PDV (produtos relacionados)
- [ ] Integração com sistema de pagamento
- [ ] Rastreamento de entrega
- [ ] Avaliações de clientes

---

**Status:** ✅ Pronto para Deploy
**Última atualização:** 2026-08-02
