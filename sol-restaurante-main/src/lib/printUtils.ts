import type { CartItem } from "@/types/menu";
import type { PaymentMethodType } from "@/types/cashRegister";
import { supabase } from "@/integrations/supabase/client";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

// Escape user-controlled strings before injecting into print HTML (prevents stored XSS).
function esc(s: unknown): string {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Fetch restaurant name for receipts ─────────────────────────

let _cachedName: string | null = null;

async function getRestaurantName(): Promise<string> {
  if (_cachedName) return _cachedName;
  const { data } = await supabase
    .from("restaurant_settings")
    .select("name")
    .limit(1)
    .single();
  _cachedName = data?.name || "Restaurante";
  return _cachedName;
}

// Reset cache when needed (e.g. after settings update)
export function resetPrintSettingsCache() {
  _cachedName = null;
}

// ─── Anti-duplication ───────────────────────────────────────────

async function hasBeenPrinted(itemKey: string): Promise<boolean> {
  const { data } = await supabase
    .from("print_logs")
    .select("id")
    .eq("item_key", itemKey)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function logPrint(params: {
  referenceType: string;
  referenceId: string;
  itemKey: string;
  printerType: "kitchen" | "cashier";
  tabNumber?: number;
  orderNumber?: string;
}) {
  await supabase.from("print_logs").insert({
    reference_type: params.referenceType,
    reference_id: params.referenceId,
    item_key: params.itemKey,
    printer_type: params.printerType,
    tab_number: params.tabNumber ?? null,
    order_number: params.orderNumber ?? null,
  });
}

// ─── Shared print helper ────────────────────────────────────────

function openPrintWindow(title: string, bodyHtml: string) {
  const win = window.open("", "_blank", "width=300,height=600");
  if (!win) return;
  win.document.write(`
    <html>
    <head><title>${title}</title>
    <style>
      body { font-family: monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; }
      .center { text-align: center; }
      .bold { font-weight: bold; }
      .line { border-top: 2px dashed #000; margin: 8px 0; }
      .line-thin { border-top: 1px dashed #000; margin: 6px 0; }
      .obs { font-size: 13px; font-weight: bold; margin: 2px 0 4px 16px; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 3px 0; vertical-align: top; }
    </style>
    </head>
    <body>${bodyHtml}</body>
    </html>
  `);
  win.document.close();
  win.print();
}

// ─── 1. Kitchen Ticket for Comanda Items ────────────────────────

export async function printKitchenTicket(
  tabNumber: number,
  items: CartItem[],
  customerName?: string | null
) {
  const now = new Date().toLocaleString("pt-BR");
  const printableItems: CartItem[] = [];

  for (const item of items) {
    const key = `tab_item_${tabNumber}_${item.id}_${item.size}_${Date.now()}`;
    printableItems.push(item);
    await logPrint({
      referenceType: "tab_item",
      referenceId: String(tabNumber),
      itemKey: key,
      printerType: "kitchen",
      tabNumber,
    });
  }

  if (printableItems.length === 0) return;

  const itemsHtml = printableItems
    .map((item) => {
      const obs = (item as any).notes || (item as any).observation;
      return `<tr>
        <td class="bold" style="font-size:14px">${item.quantity}x ${esc(item.name)}</td>
        <td style="font-size:12px;text-align:right">${item.size === "media" ? "M" : "G"}</td>
      </tr>
      ${obs ? `<tr><td colspan="2" class="obs">*** ${esc(String(obs).toUpperCase())} ***</td></tr>` : ""}`;
    })
    .join("");

  openPrintWindow(`Cozinha - Comanda ${String(tabNumber).padStart(3, "0")}`, `
    <div class="center" style="border-bottom:2px dashed #000;padding-bottom:8px;margin-bottom:8px">
      <p style="font-size:16px;margin:0;font-weight:bold">TIPO: COMANDA</p>
      <h1 style="margin:4px 0;font-size:28px">COMANDA ${String(tabNumber).padStart(3, "0")}</h1>
      ${customerName ? `<p style="margin:2px 0;font-size:12px">Cliente: ${esc(customerName)}</p>` : ""}
      <p style="margin:2px 0;font-size:11px">${now}</p>
    </div>
    <table>${itemsHtml}</table>
    <div class="line"></div>
    <div class="center"><p style="font-size:11px;margin:0">*** NOVO PEDIDO ***</p></div>
  `);
}

// ─── 2. Kitchen Ticket for Online Order ─────────────────────────

export async function printDeliveryKitchenTicket(order: {
  id: string;
  items: CartItem[];
  notes?: string | null;
  guest_name?: string | null;
}) {
  const orderNum = order.id.slice(0, 8).toUpperCase();
  const itemKey = `order_kitchen_${order.id}`;

  // Anti-duplication
  if (await hasBeenPrinted(itemKey)) return;

  await logPrint({
    referenceType: "order_kitchen",
    referenceId: order.id,
    itemKey,
    printerType: "kitchen",
    orderNumber: orderNum,
  });

  const now = new Date().toLocaleString("pt-BR");

  const itemsHtml = order.items
    .map((item) => {
      const obs = (item as any).notes || (item as any).observation;
      return `<tr>
        <td class="bold" style="font-size:14px">${item.quantity}x ${esc(item.name)}</td>
        <td style="font-size:12px;text-align:right">${item.size === "media" ? "M" : "G"}</td>
      </tr>
      ${obs ? `<tr><td colspan="2" class="obs">*** ${esc(String(obs).toUpperCase())} ***</td></tr>` : ""}`;
    })
    .join("");

  const notesHtml = order.notes
    ? `<div class="line-thin"></div><div class="obs">*** ${esc(String(order.notes).toUpperCase())} ***</div>`
    : "";

  openPrintWindow(`Cozinha - Delivery #${orderNum}`, `
    <div class="center" style="border-bottom:2px dashed #000;padding-bottom:8px;margin-bottom:8px">
      <p style="font-size:16px;margin:0;font-weight:bold">TIPO: DELIVERY</p>
      <h1 style="margin:4px 0;font-size:24px">Pedido #${orderNum}</h1>
      ${order.guest_name ? `<p style="margin:2px 0;font-size:12px">Cliente: ${esc(order.guest_name)}</p>` : ""}
      <p style="margin:2px 0;font-size:11px">${now}</p>
    </div>
    <table>${itemsHtml}</table>
    ${notesHtml}
    <div class="line"></div>
    <div class="center"><p style="font-size:11px;margin:0">*** NOVO PEDIDO ONLINE ***</p></div>
  `);
}

// ─── 3. Cash Receipt for Comanda Payment ────────────────────────

export async function printReceipt(
  tabNumber: number,
  items: CartItem[],
  subtotal: number,
  paymentMethod: string,
  customerName?: string | null
) {
  const restaurantName = await getRestaurantName();
  const itemKey = `tab_receipt_${tabNumber}_${Date.now()}`;

  await logPrint({
    referenceType: "tab_receipt",
    referenceId: String(tabNumber),
    itemKey,
    printerType: "cashier",
    tabNumber,
  });

  const now = new Date().toLocaleString("pt-BR");
  const paymentLabels: Record<string, string> = {
    cash: "Dinheiro",
    credit_card: "Cartão de Crédito",
    debit_card: "Cartão de Débito",
    pix: "PIX",
    voucher: "Vale Refeição",
  };

  const itemsHtml = items
    .map((item) => {
      const price = item.size === "media" ? item.priceMedia : item.priceGrande;
      return `<tr>
        <td style="font-size:12px">${item.quantity}x ${esc(item.name)} (${item.size === "media" ? "M" : "G"})</td>
        <td style="font-size:12px;text-align:right">${formatCurrency(price * item.quantity)}</td>
      </tr>`;
    })
    .join("");

  openPrintWindow(`Recibo - Comanda ${String(tabNumber).padStart(3, "0")}`, `
    <div class="center" style="border-bottom:1px solid #000;padding-bottom:8px;margin-bottom:8px">
      <h2 style="margin:0;font-size:16px">${esc(restaurantName.toUpperCase())}</h2>
      <p style="margin:2px 0;font-size:11px">${now}</p>
    </div>
    <div style="border-bottom:1px dashed #000;padding-bottom:8px;margin-bottom:8px">
      <p style="margin:0;font-size:14px;font-weight:bold">COMANDA ${String(tabNumber).padStart(3, "0")}</p>
      ${customerName ? `<p style="margin:2px 0;font-size:12px">Cliente: ${esc(customerName)}</p>` : ""}
    </div>
    <table>${itemsHtml}</table>
    <div class="line-thin" style="margin-top:8px"></div>
    <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:bold">
      <span>TOTAL</span>
      <span>${formatCurrency(subtotal)}</span>
    </div>
    <p style="margin:4px 0;font-size:12px">Pagamento: ${esc(paymentLabels[paymentMethod] || paymentMethod)}</p>
    <div style="border-top:1px solid #000;margin-top:8px;padding-top:8px;text-align:center">
      <p style="font-size:11px;margin:0">Obrigado pela preferência!</p>
    </div>
  `);
}

// ─── 4. Cash Receipt for Online Order Payment ───────────────────

export async function printOrderReceipt(order: {
  id: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  delivery_fee: number;
  guest_name?: string | null;
}, paymentMethod: string) {
  const restaurantName = await getRestaurantName();
  const orderNum = order.id.slice(0, 8).toUpperCase();
  const itemKey = `order_receipt_${order.id}`;

  if (await hasBeenPrinted(itemKey)) return;

  await logPrint({
    referenceType: "order_receipt",
    referenceId: order.id,
    itemKey,
    printerType: "cashier",
    orderNumber: orderNum,
  });

  const now = new Date().toLocaleString("pt-BR");
  const paymentLabels: Record<string, string> = {
    cash: "Dinheiro",
    credit_card: "Cartão de Crédito",
    debit_card: "Cartão de Débito",
    pix: "PIX",
    voucher: "Vale Refeição",
  };

  const itemsHtml = order.items
    .map((item) => {
      const price = item.size === "media" ? item.priceMedia : item.priceGrande;
      return `<tr>
        <td style="font-size:12px">${item.quantity}x ${esc(item.name)} (${item.size === "media" ? "M" : "G"})</td>
        <td style="font-size:12px;text-align:right">${formatCurrency(price * item.quantity)}</td>
      </tr>`;
    })
    .join("");

  openPrintWindow(`Recibo - Pedido #${orderNum}`, `
    <div class="center" style="border-bottom:1px solid #000;padding-bottom:8px;margin-bottom:8px">
      <h2 style="margin:0;font-size:16px">${esc(restaurantName.toUpperCase())}</h2>
      <p style="margin:2px 0;font-size:11px">${now}</p>
    </div>
    <div style="border-bottom:1px dashed #000;padding-bottom:8px;margin-bottom:8px">
      <p style="margin:0;font-size:14px;font-weight:bold">PEDIDO #${orderNum}</p>
      ${order.guest_name ? `<p style="margin:2px 0;font-size:12px">Cliente: ${esc(order.guest_name)}</p>` : ""}
    </div>
    <table>${itemsHtml}</table>
    <div class="line-thin" style="margin-top:8px"></div>
    <div style="display:flex;justify-content:space-between;font-size:12px">
      <span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span>
    </div>
    ${order.delivery_fee > 0 ? `<div style="display:flex;justify-content:space-between;font-size:12px">
      <span>Taxa de entrega</span><span>${formatCurrency(order.delivery_fee)}</span>
    </div>` : ""}
    <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:bold;margin-top:4px">
      <span>TOTAL</span><span>${formatCurrency(order.total)}</span>
    </div>
    <p style="margin:4px 0;font-size:12px">Pagamento: ${esc(paymentLabels[paymentMethod] || paymentMethod)}</p>
    <div style="border-top:1px solid #000;margin-top:8px;padding-top:8px;text-align:center">
      <p style="font-size:11px;margin:0">Obrigado pela preferência!</p>
    </div>
  `);
}

// ─── 5. Cash Register Close Report ──────────────────────────────

export async function printCashCloseReport(params: {
  operatorEmail: string;
  openingBalance: number;
  closingBalance: number;
  expectedCash: number;
  totals: {
    totalSales: number;
    withdrawals: number;
    deposits: number;
    byMethod: Record<string, number>;
  };
  registerId: string;
}) {
  const restaurantName = await getRestaurantName();
  const itemKey = `cash_close_${params.registerId}`;

  if (await hasBeenPrinted(itemKey)) return;

  await logPrint({
    referenceType: "cash_close",
    referenceId: params.registerId,
    itemKey,
    printerType: "cashier",
  });

  const now = new Date().toLocaleString("pt-BR");
  const difference = params.closingBalance - params.expectedCash;
  const paymentLabels: Record<string, string> = {
    cash: "Dinheiro",
    credit_card: "Crédito",
    debit_card: "Débito",
    pix: "PIX",
    voucher: "Vale Refeição",
  };

  const methodsHtml = Object.entries(params.totals.byMethod)
    .map(([method, value]) => `<tr>
      <td style="font-size:12px">${paymentLabels[method] || method}</td>
      <td style="font-size:12px;text-align:right">${formatCurrency(value)}</td>
    </tr>`)
    .join("");

  openPrintWindow("Fechamento de Caixa", `
    <div class="center" style="border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:8px">
      <h2 style="margin:0;font-size:16px">RELATÓRIO DE FECHAMENTO DE CAIXA</h2>
      <p style="margin:4px 0;font-size:11px">${esc(restaurantName.toUpperCase())}</p>
    </div>
    <div style="margin-bottom:8px">
      <p style="font-size:12px;margin:2px 0">Operador: ${esc(params.operatorEmail)}</p>
      <p style="font-size:12px;margin:2px 0">Data/Hora: ${now}</p>
    </div>
    <div class="line"></div>
    <p class="bold" style="font-size:13px;margin:4px 0">VENDAS POR PAGAMENTO</p>
    <table>${methodsHtml}</table>
    <div class="line-thin"></div>
    <div style="display:flex;justify-content:space-between;font-size:12px;margin:2px 0">
      <span>Saldo Inicial</span><span>${formatCurrency(params.openingBalance)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:12px;margin:2px 0">
      <span>Total Vendas</span><span class="bold">${formatCurrency(params.totals.totalSales)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:12px;margin:2px 0">
      <span>Sangrias</span><span>- ${formatCurrency(params.totals.withdrawals)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:12px;margin:2px 0">
      <span>Suprimentos</span><span>+ ${formatCurrency(params.totals.deposits)}</span>
    </div>
    <div class="line"></div>
    <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:bold;margin:4px 0">
      <span>TOTAL GERAL</span><span>${formatCurrency(params.totals.totalSales)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:12px;margin:2px 0">
      <span>Saldo Esperado (Dinheiro)</span><span>${formatCurrency(params.expectedCash)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:12px;margin:2px 0">
      <span>Saldo Contado</span><span>${formatCurrency(params.closingBalance)}</span>
    </div>
    ${difference !== 0 ? `<div style="display:flex;justify-content:space-between;font-size:13px;font-weight:bold;margin:4px 0;color:${difference > 0 ? 'green' : 'red'}">
      <span>${difference > 0 ? "SOBRA" : "QUEBRA"}</span><span>${formatCurrency(Math.abs(difference))}</span>
    </div>` : `<p class="center bold" style="font-size:12px;color:green;margin:4px 0">✓ CAIXA CONFERIDO</p>`}
    <div class="line"></div>
    <div class="center"><p style="font-size:10px;margin:0">Documento interno - sem valor fiscal</p></div>
  `);
}
