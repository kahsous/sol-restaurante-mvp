## Objetivo

Deixar o sistema apenas como PDV interno do restaurante. Sai o iFood, sai o delivery/checkout online e sai o pagamento no site. Pedido de cliente volta a ser por WhatsApp/atendimento, lançado no PDV.

## 1. iFood — remover por completo

Apagar as Edge Functions do iFood/Shipping (13 funções: `ifood-auth`, `ifood-polling`, `ifood-status-update`, `ifood-shipping`, `ifood-order-tracking`, `ifood-virtual-bag`, `ifood-webhook-test`, `shipping-*`, `webhooks-ifood-*`) e o helper `_shared/ifood-shipping.ts` / `_shared/ifood-webhook.ts`. As funções também são removidas do servidor para pararem de responder.

Remover no PDV:
- Aba/telas `IfoodConfig`, `IfoodHomologationChecklist`, `IfoodShippingPanel`
- Hook `useIfoodConfig`
- Blocos de iFood no `OrderCard` e no `CancelOrderDialog` (motivos de cancelamento iFood → cancelamento simples com motivo livre)
- Referências em `PdvDashboard` e nos tipos `src/types/pdv.ts`

Banco: os campos/tabelas de iFood (`ifood_config`, `ifood_event_log`, `ifood_polling_acks`, `deliveries`, `shipping_events`, `cancellation_reasons` e colunas `ifood_*` em `orders`) só serão apagados se você confirmar — por segurança o padrão é deixá-los inertes (sem código usando) e removê-los numa migração seguinte.

Documentação de homologação (`HOMOLOGACAO_*.md`, `IFOOD_SETUP*.md`, `ROTEIRO_GRAVACAO_*.md`) é arquivada/removida.

## 2. Site público de pedidos — desligar

- `/` passa a redirecionar para `/pdv` (nada de vitrine pública com carrinho).
- Remover `src/pages/Index.tsx`, `CartSidebar`, `CheckoutModal`, `DeliveryChecker`, `Hero`, `MenuGrid`, `MenuItemCard`, `CategoryNav`, `ProductDetailsSheet`, `Header`, `Footer` e o hook `useCart`.
- Remover `ShareTarget` (compartilhar comprovante PIX) e a configuração de Share Target do PWA.
- Manter `/comanda/:number` (QR da comanda), `/cozinha`, `/pdv`, `/admin`, `/install`.

## 3. Pagamento online — remover

- Apagar `create-pix-payment`, `create-mp-preference`, `mp-return` e a lógica de PIX do fluxo de cliente (upload de comprovante, validação por IA, aprovação humana).
- Pagamento passa a ser 100% no Caixa do PDV (dinheiro, cartão, PIX manual), como já funciona hoje.
- O segredo `MERCADOPAGO_ACCESS_TOKEN` e `IFOOD_WEBHOOK_SECRET` ficam sem uso; posso apagá-los se você quiser.

## 4. Delivery dentro do PDV

Pedido de delivery deixa de existir como canal externo, mas o PDV continua podendo lançar **pedido para entrega** (bairro + taxa) quando o cliente liga/manda WhatsApp — isso é operação do restaurante, não integração. Bairros/taxas e a sangria do entregador continuam.

## 5. WhatsApp

No PDV, botão para abrir a conversa no WhatsApp do cliente a partir do pedido/comanda (número já vem do CRM), e link do WhatsApp do restaurante nas configurações. Nada de checkout automático.

## Pendências que preciso confirmar

1. Mantenho a página `/cardapio-99food` (card��pio público só de leitura, usado para PDF/impressão e envio a plataformas)? Ela não faz pedido nem pagamento — sugiro manter.
2. Apago as tabelas do iFood/delivery agora ou deixo inertes?

## Detalhes técnicos

- Rotas ajustadas em `src/App.tsx`; `/` com `<Navigate to="/pdv" replace />`.
- `useMenu` permanece (o PDV e o cardápio de leitura usam), sem os campos de disponibilidade por canal de delivery externo.
- `index.html`: título/descrição passam a refletir sistema interno; remover Share Target do manifest.
- Build (`npm run build`) e typecheck verificados no fim; nenhuma função do PDV (comandas, caixa, estoque, cozinha, impressão, CRM) é alterada.
