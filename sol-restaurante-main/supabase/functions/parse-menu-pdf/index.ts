import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2';

interface ExtractedItem {
  name: string;
  description?: string;
  category?: string;
  price_pequena?: number;
  price_media?: number;
  price_grande?: number;
}

const SYSTEM = `Você extrai o cardápio de um restaurante brasileiro a partir do texto/PDF enviado.
Retorne SOMENTE JSON no formato { "items": [ { name, description, category, price_pequena, price_media, price_grande } ] }.
Regras:
- Preços em número (ex: 32.20). Se só houver um preço, use price_media e repita em price_grande.
- price_pequena = 0 quando não houver tamanho P.
- category deve ser uma string curta como "Frango", "Suíno", "Bovino", "Peixe", "Almôndegas", "Panquecas & Parmegianas", "Marmitex", "Pratos do Dia", "Sobremesas", "Águas e Energéticos", "Cervejas", "Refrigerantes", "Sucos".
- Descreva o prato em 1 frase objetiva.
- Ignore títulos, seções, observações gerais.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Require authentication + admin/estoque role
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!;
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: roles } = await authClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id);
    const userRoles = (roles ?? []).map((r: { role: string }) => r.role);
    if (!userRoles.includes('admin') && !userRoles.includes('estoque')) {
      return new Response(JSON.stringify({ error: 'Sem permissão' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { pdfBase64, filename } = await req.json();
    if (!pdfBase64) {
      return new Response(JSON.stringify({ error: 'pdfBase64 obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY ausente' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extraia o cardápio deste PDF e retorne JSON conforme o schema.' },
              {
                type: 'file',
                file: {
                  filename: filename || 'cardapio.pdf',
                  file_data: `data:application/pdf;base64,${pdfBase64}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return new Response(JSON.stringify({ error: 'AI falhou', detail: text }), {
        status: resp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content ?? '{}';
    let parsed: { items: ExtractedItem[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      return new Response(JSON.stringify({ error: 'JSON inválido do modelo', raw: content }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ items: parsed.items || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
