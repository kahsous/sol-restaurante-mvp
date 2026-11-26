// Create Online Order — Cria pedido a partir do site
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "jsr:@supabase/supabase-js/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { items, customer_name, customer_phone, customer_email, notes } = body;

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Items obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!
    );

    // Calcular subtotal
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + (item.unitPrice * item.quantity),
      0
    );

    // Criar pedido
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        source: "online",
        customer_name,
        customer_phone,
        customer_email,
        status: "pending",
        items: items,
        subtotal,
        notes,
        external_data: { order_source: "website" },
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ ok: true, order }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("create-online-order error:", err);
    return new Response(
      JSON.stringify({ error: err.message || String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
