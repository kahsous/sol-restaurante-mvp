# Remoção de Integração iFood

**Data:** 2026-08-02
**Motivo:** Impossibilidade de integração com plataforma iFood

## Arquivos Removidos

### Edge Functions
- ❌ `supabase/functions/ifood-auth/`
- ❌ `supabase/functions/ifood-polling/`
- ❌ `supabase/functions/ifood-status-update/`
- ❌ `supabase/functions/ifood-shipping/`
- ❌ `supabase/functions/ifood-virtual-bag/`
- ❌ `supabase/functions/webhooks-ifood-order/`
- ❌ `supabase/functions/webhooks-ifood-shipping/`
- ❌ `supabase/functions/webhooks-ifood-events/`
- ❌ `supabase/functions/_shared/ifood-shipping.ts`

### Documentação
- ❌ `IFOOD_SETUP.md`
- ❌ `IFOOD_SETUP_SIMPLIFICADO.md`
- ❌ `HOMOLOGACAO_IFOOD.md`
- ❌ `HOMOLOGACAO_WEBHOOKS.md`
- ❌ `SECURITY_AUDIT.md`

### Migrations
- ❌ `supabase/migrations/20260601090000_ifood_shipping_homologation.sql`

### Componentes React
- ❌ `src/components/pdv/CancelOrderDialog.tsx` (específico para iFood)

### Tabelas de Banco
- ❌ `ifood_config`
- ❌ `ifood_event_log`
- ❌ `ifood_polling_acks`
- ❌ `deliveries`
- ❌ `shipping_events`
- ❌ `cancellation_reasons`

### Colunas Removidas de `orders`
- ❌ `external_id`
- ❌ `ifood_event_type`
- ❌ `ifood_pickup_code`
- ❌ `ifood_cancel_request`
- ❌ `ifood_address_change_request`
- ❌ `ifood_pickup_code_required`
- ❌ `external_data`

## O que Permanece

✅ **Canais de Pedido Funcionais:**
- **Online** - Pedidos via site
- **WhatsApp** - Pedidos via mensagens
- **PDV** - Pedidos no caixa/balcão

✅ **Tabela `orders` Simplificada:**
```sql
source: 'pdv' | 'online' | 'whatsapp'
customer_name, customer_phone, customer_email
status: 'pending' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled'
items, subtotal, total, notes
```

## Próximas Integrações Possíveis

Com o código mais limpo, futuras integrações ficarão mais fáceis:
- [ ] Ifood (se mudarem os termos)
- [ ] Rappi
- [ ] Uber Eats
- [ ] Própria API de delivery

---

**Status:** Limpeza concluída ✅
