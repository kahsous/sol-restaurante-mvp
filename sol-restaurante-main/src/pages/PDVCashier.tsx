import React, { useState, useEffect } from "react";
import { useMenu } from "@/hooks/useMenu";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import type { CartItem, MenuItem } from "@/types/menu";
import { Plus, Minus, Trash2, Send, CalendarDays } from "lucide-react";
import { getRestaurantWeekdayPrefix } from "@/lib/restaurantDate";

/**
 * PDV Caixa Otimizado
 * Produtos diretos no caixa sem precisar abrir comanda
 * Funciona como um PDV tradicional
 */

export function PDVCashier() {
  const { menuItems, categories, loading } = useMenu("restaurant");
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  const todayLabel = getRestaurantWeekdayPrefix();
  const todayDisplay = todayLabel === "domingo" || todayLabel === "sábado" ? todayLabel : `${todayLabel}-feira`;
  const categoryItems = menuItems.filter((m) => m.category === selectedCategory);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find(
        (c) => c.id === item.id && c.size === "media"
      );
      if (existing) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          ...item,
          quantity: 1,
          size: "media",
          selectedOptions: [],
          unitPrice: item.priceMedia,
        },
      ];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.id === itemId ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.id !== itemId));
  };

  const finishOrder = async () => {
    if (cart.length === 0) {
      toast({ title: "Carrinho vazio", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

      const { error } = await supabase.from("orders").insert({
        source: "pdv",
        customer_name: "Balcão",
        status: "preparing",
        items: cart,
        subtotal,
        total: subtotal,
      });

      if (error) throw error;

      toast({
        title: "Pedido criado! ✓",
        description: `R$ ${subtotal.toFixed(2)}`,
      });

      setCart([]);
    } catch (err: any) {
      toast({ title: "Erro ao criar pedido", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  if (loading) return <div className="text-center py-10">Carregando cardápio...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-3 sm:p-4 overflow-x-hidden">
      <div className="max-w-7xl mx-auto min-w-0">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">💳 Caixa PDV</h1>
          <p className="text-gray-400">Produtos diretos para venda rápida</p>
          <p className="text-xs text-amber-300 mt-1 flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Prato do Dia filtrado por {todayDisplay} no horário local do restaurante</p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] gap-4 lg:gap-6 min-w-0">
          {/* Categorias e Produtos */}
          <div className="space-y-4 min-w-0">
            {/* Abas de Categorias */}
            <div className="flex gap-2 overflow-x-auto max-w-full pb-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded font-medium whitespace-nowrap transition ${
                    selectedCategory === cat.id
                      ? "bg-amber-500 text-white"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Grade de Produtos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-3 min-w-0">
              {categoryItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="bg-gray-800 hover:bg-gray-700 p-3 rounded border border-gray-600 hover:border-amber-500 transition text-left min-w-0"
                >
                  <p className="font-bold text-sm line-clamp-2">{item.name}</p>
                  <p className="text-amber-400 font-bold text-lg mt-2">
                    R$ {item.priceMedia.toFixed(2)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Carrinho */}
          <div className="bg-gray-800 rounded-lg p-3 sm:p-4 h-fit xl:sticky xl:top-4 min-w-0">
            <h2 className="text-xl font-bold mb-4">🛒 Carrinho</h2>

            <div className="space-y-2 max-h-[50vh] xl:max-h-96 overflow-y-auto overflow-x-hidden mb-4">
              {cart.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Nenhum item</p>
              ) : (
                cart.map((item) => (
                  <Card key={item.id} className="bg-gray-700 border-gray-600">
                    <CardContent className="p-2">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm break-words">{item.name}</p>
                          <p className="text-xs text-gray-300">
                            R$ {(item.unitPrice * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="bg-gray-600 hover:bg-gray-500 p-1 rounded"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="flex-1 text-center font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="bg-gray-600 hover:bg-gray-500 p-1 rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Total */}
            <div className="border-t border-gray-600 pt-3 mb-3">
              <p className="text-2xl font-bold text-amber-400">
                R$ {subtotal.toFixed(2)}
              </p>
            </div>

            {/* Botão Finalizar */}
            <Button
              onClick={finishOrder}
              disabled={submitting || cart.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-bold"
            >
              <Send className="w-5 h-5 mr-2" />
              {submitting ? "Processando..." : "Finalizar Venda"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
