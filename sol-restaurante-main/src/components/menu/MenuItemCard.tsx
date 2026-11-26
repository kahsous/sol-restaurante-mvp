import { Button } from '@/components/ui/button';

interface MenuItemCardProps {
  name: string;
  desc?: string;
  sizes?: Record<string, number>;
  rangeText?: string;
  note?: string;
  onAddItem: (name: string, size: string, price: number) => void;
}

const formatPrice = (price: number) => `R$ ${price.toFixed(2).replace('.', ',')}`;

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  name,
  desc,
  sizes,
  rangeText,
  note,
  onAddItem,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3 hover:shadow-md transition-shadow">
      <span className="block font-semibold text-lg text-gray-900">{name}</span>
      <p className="text-sm text-gray-600 my-3 leading-relaxed">{desc || 'Item do cardápio do Restaurante Sol. Consulte disponibilidade no atendimento.'}</p>
      <div className="flex flex-wrap gap-2">
        {sizes ? (
          Object.entries(sizes).map(([label, price]) => (
            <button
              key={label}
              onClick={() => onAddItem(name, label, price)}
              className="font-mono text-xs bg-yellow-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-900 hover:bg-red-700 hover:border-red-700 hover:text-white transition-all"
            >
              Adicionar ao pedido · {label} <span className="font-semibold">{formatPrice(price)}</span>
            </button>
          ))
        ) : (
          <span className="font-mono text-xs bg-yellow-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 opacity-85">
            {rangeText}
          </span>
        )}
      </div>
      {note && <p className="text-xs text-gray-500 italic mt-2">{note}</p>}
    </div>
  );
};

export default MenuItemCard;
