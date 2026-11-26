import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X, ShoppingCart, MessageCircle } from 'lucide-react';

interface CartItem {
  price: number;
  qty: number;
}

interface MenuCartProps {
  items: Record<string, CartItem>;
  onRemoveItem: (key: string) => void;
  onClear: () => void;
}

const WHATSAPP_PHONE = import.meta.env.VITE_WHATSAPP_PHONE || '5511999999999';

const formatPrice = (price: number) => `R$ ${price.toFixed(2).replace('.', ',')}`;

const buildWhatsAppMessage = (itemsList: [string, CartItem][], totalPrice: number) => {
  const lines = itemsList.map(([key, item]) => `• ${item.qty}x ${key} — ${formatPrice(item.price * item.qty)}`);
  return [
    'Olá, Restaurante Sol! Gostaria de fazer um pedido:',
    '',
    ...lines,
    '',
    `Total estimado: ${formatPrice(totalPrice)}`,
    '',
    'Por favor, confirmem disponibilidade, entrega/retirada e forma de pagamento.',
  ].join('\n');
};

const MenuCart: React.FC<MenuCartProps> = ({ items, onRemoveItem, onClear }) => {
  const itemsList = Object.entries(items);
  const totalCount = itemsList.reduce((sum, [, item]) => sum + item.qty, 0);
  const totalPrice = itemsList.reduce((sum, [, item]) => sum + item.price * item.qty, 0);
  const isEmpty = itemsList.length === 0;

  const handleSendWhatsApp = () => {
    if (isEmpty) return;
    const message = encodeURIComponent(buildWhatsAppMessage(itemsList, totalPrice));
    const phonePath = WHATSAPP_PHONE ? `/${WHATSAPP_PHONE}` : '';
    window.open(`https://wa.me${phonePath}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900 text-white border-t-4 border-amber-400 shadow-2xl p-4 cursor-pointer hover:bg-gray-800 transition-colors">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingCart size={16} className="font-mono text-xs uppercase tracking-wider" />
              <span className="font-mono text-xs uppercase tracking-wider">Meu pedido</span>
              {!isEmpty && (
                <span className="bg-red-700 text-white rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  {totalCount}
                </span>
              )}
            </div>
            <span className="font-serif font-semibold text-xl text-amber-400">{formatPrice(totalPrice)}</span>
          </div>
        </div>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Meu Pedido</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
          {isEmpty ? (
            <p className="text-sm text-gray-500 italic py-8 text-center">
              Toque em “Adicionar ao pedido” para montar seu pedido.
            </p>
          ) : (
            itemsList.map(([key, item]) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-dashed border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-amber-500 mr-1">{item.qty}×</span>
                  <span className="text-sm">{key}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{formatPrice(item.price * item.qty)}</span>
                  <button
                    type="button"
                    aria-label={`Remover ${key}`}
                    onClick={() => onRemoveItem(key)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        {!isEmpty && (
          <div className="mt-4 space-y-2 border-t pt-4">
            <Button onClick={handleSendWhatsApp} className="w-full bg-green-600 text-white font-mono text-xs uppercase tracking-wider hover:bg-green-700">
              <MessageCircle className="mr-2 h-4 w-4" />
              Enviar pedido pelo WhatsApp
            </Button>
            <Button onClick={onClear} variant="outline" className="w-full font-mono text-xs uppercase tracking-wider">
              Limpar pedido
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default MenuCart;
