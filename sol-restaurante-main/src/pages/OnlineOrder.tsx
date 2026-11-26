import React, { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useMenu } from "@/hooks/useMenu";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { MenuItem } from "@/components/menu/MenuItem";
import { ShoppingCart, Send } from "lucide-react";

export function OnlineOrder() {
  const { items, addItem, removeItem, clearCart, totalPrice } = useCart();
  const { menuItems, categories, loading } = useMenu();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmitOrder = async () => {
    if (!customerName || !customerPhone) {
      toast({ title: "Preencha nome e telefone", variant: "destructive" });
      return;
    }

    if (items.length === 0) {
      toast({ title: "Carrinho vazio", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-online-order", {
        body: {
          items,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          notes,
        },
      });

      if (error) throw error;

      toast({
        title: "Pedido enviado com sucesso! 🎉",
        description: `Seu pedido #${data.order.id} foi recebido. Entraremos em contato em breve!`,
      });

      clearCart();
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setNotes("");
    } catch (err: any) {
      toast({ title: "Erro ao enviar pedido", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-10">Carregando cardápio...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-amber-900 mb-2">🍽️ Seu Pedido Online</h1>
          <p className="text-amber-700">Escolha seus pratos favoritos e retire na loja</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu */}
          <div className="lg:col-span-2 space-y-6">
            {categories.map((cat) => {
              const catItems = menuItems.filter((m) => m.category === cat.id);
              if (catItems.length === 0) return null;
              return (
                <div key={cat.id}>
                  <h2 className="text-2xl font-bold text-amber-900 mb-4">🍗 {cat.name}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {catItems.map((item) => (
                      <MenuItem key={item.id} item={item} onAdd={addItem} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumo do Pedido */}
          <div className="space-y-4">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Seu Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Itens */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Carrinho vazio</p>
                  ) : (
                    items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm border-b pb-2">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {item.quantity}x {item.size} - R$ {(item.unitPrice * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id, item.size, item.selectedOptions)}
                        >
                          ✕
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {/* Total */}
                <div className="border-t pt-3">
                  <p className="text-lg font-bold text-amber-900">
                    Total: R$ {totalPrice.toFixed(2)}
                  </p>
                </div>

                {/* Dados do Cliente */}
                <div className="space-y-3 border-t pt-3">
                  <Input
                    placeholder="Seu nome"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                  <Input
                    placeholder="Seu telefone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                  <Input
                    placeholder="Seu email (opcional)"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                  <Textarea
                    placeholder="Observações (ex: sem cebola, alergia...)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="resize-none"
                  />
                </div>

                {/* Botão Enviar */}
                <Button
                  onClick={handleSubmitOrder}
                  disabled={submitting || items.length === 0}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitting ? "Enviando..." : "Enviar Pedido"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
