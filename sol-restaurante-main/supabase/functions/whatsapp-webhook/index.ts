// WhatsApp Webhook — Recebe pedidos via WhatsApp Business API
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "jsr:@supabase/supabase-js/cors";

const WHATSAPP_VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "sol_restaurante_token";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Verificação inicial do WhatsApp
    if (req.method === "GET") {
      const url = new URL(req.url);
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 });
      }
      return new Response("Forbidden", { status: 403 });
    }

    // Recebe mensagens do WhatsApp
    if (req.method === "POST") {
      const body = await req.json();
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Log de evento
      await supabase.from("whatsapp_events").insert({
        event_type: "message_received",
        payload: body,
        processed: false,
      });

      // Processa mensagens de pedidos
      if (body.entry?.[0]?.changes?.[0]?.value?.messages) {
        const messages = body.entry[0].changes[0].value.messages;
        const contacts = body.entry[0].changes[0].value.contacts || [];
        const from = messages[0]?.from;
        const text = messages[0]?.text?.body || "";

        if (from && text) {
          const contact = contacts.find((c: any) => c.wa_id === from);
          const customerName = contact?.profile?.name || from;

          // Criar novo pedido via WhatsApp
          const { data: order, error } = await supabase.from("orders").insert({
            source: "whatsapp",
            customer_phone: from,
            customer_name: customerName,
            status: "pending",
            notes: text,
            external_data: { whatsapp_message: text },
          }).select().single();

          if (!error && order) {
            // Enviar confirmação automática
            await sendWhatsAppMessage(
              from,
              `Olá ${customerName}! 👋\n\nRecebemos seu pedido! 🎉\n\nEm breve nossos operadores entrarão em contato para confirmar os detalhes.\n\nPedido ID: ${order.id}`
            );
          }
        }
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    console.error("whatsapp-webhook error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function sendWhatsAppMessage(to: string, message: string) {
  const token = Deno.env.get("WHATSAPP_API_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

  if (!token || !phoneNumberId) return;

  try {
    await fetch(
      `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: message },
        }),
      }
    );
  } catch (err) {
    console.error("Failed to send WhatsApp message:", err);
  }
}
