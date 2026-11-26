# Auditoria Técnica e Segurança (Ponta a Ponta)

Data: 2026-05-08

## Escopo revisado
- Fluxo iFood (auth, polling, status updates)
- Fluxo PDV de preços/tamanhos
- Filtros de canal (Site/TV vs PDV)
- Exposição de endpoints Edge

## Correções já aplicadas
1. **Autorização em Edge Functions sensíveis**
   - `ifood-polling` exige usuário autenticado e role `admin`/`operator`.
   - `ifood-status-update` exige usuário autenticado e role `admin`/`operator`.

2. **Resiliência de integração iFood**
   - Deduplicação por `external_id` em polling.
   - Sincronização de status por eventos iFood.
   - Validação de ACK (`events/acknowledgment`) com erro explícito quando falha.

3. **Validação de ação e token em status update**
   - Bloqueio de ações inválidas via allowlist.
   - Verificação de expiração de token antes de chamar iFood.

4. **Consistência de preços/tamanhos no PDV**
   - `pequena` corrigido em carrinho e exibição de pedidos.

## Riscos ainda abertos (próximos passos)
- Validar RLS/Policies de todas as tabelas críticas (`orders`, `ifood_config`, `ifood_event_log`, `user_roles`).
- Consolidar logs de auditoria com correlação `event_id` -> `order_id` -> `action`.
- Revisar e padronizar tratamento de erros para evitar exposição excessiva de detalhes internos em produção.
- Executar SAST/Dependency audit em ambiente com acesso ao registro npm (audit bloqueado aqui por 403).

## Evidências de execução local
- `npx tsc --noEmit` executado com sucesso.
- `npm audit --omit=dev --json` falhou por restrição de acesso externo (HTTP 403).
- `npm run test` indisponível neste ambiente (`vitest` ausente no PATH/deps).
