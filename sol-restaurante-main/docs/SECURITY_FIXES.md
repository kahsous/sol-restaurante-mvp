# 🔒 Correções de Segurança - Sol Restaurante

Este documento reúne todas as vulnerabilidades identificadas, suas soluções e exemplos práticos de implementação.

---

## 1. Chave PIX exposta
- **Problema**: A tabela `restaurant_settings` expunha a chave PIX publicamente.
- **Correção**: Criada tabela `financial_settings` com RLS restrito a administradores. A chave PIX foi removida da tabela pública.

### Exemplo SQL
```sql
create table financial_settings (
  id uuid primary key default gen_random_uuid(),
  pix_key text not null,
  created_at timestamp default now()
);

create policy "Admins only" on financial_settings
for select using (is_admin(auth.uid()));
create policy "Restrict uploads to PDV users"
on storage.objects
for insert
using (is_pdv_user(auth.uid()));
create policy "Guests can only see their own orders"
on orders
for select
using (user_id is null and guest_phone = current_setting('app.guest_phone'));
function escapeHTML(str: string) {
  return str.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

// Uso em printUtils.ts
document.write(escapeHTML(guest_name));
import { verifyJWT } from "@/lib/auth";

export async function createPixPayment(req) {
  const user = verifyJWT(req.headers.authorization);
  if (!user) throw new Error("Unauthorized");
  // lógica de pagamento...
}
create policy "Restrict realtime by role"
on realtime.messages
for select
using (has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'pdv_user'));
create policy "Restrict realtime by role"
on realtime.messages
for select
using (has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'pdv_user'));
