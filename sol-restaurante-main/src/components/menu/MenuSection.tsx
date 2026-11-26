import MenuItemCard from './MenuItemCard';

interface MenuSectionProps {
  id: string;
  title: string;
  subtitle: string;
  items: any[];
  onAddItem: (name: string, size: string, price: number) => void;
}

const MenuSection: React.FC<MenuSectionProps> = ({ id, title, subtitle, items, onAddItem }) => {
  return (
    <section id={id} className="mb-14 scroll-mt-16">
      <div className="mb-1">
        <h2 className="font-serif font-semibold text-2xl text-gray-900 mb-1">{title}</h2>
        <p className="text-sm text-gray-500 mb-5">{subtitle}</p>
      </div>
      <div>
        {items.map((item, idx) => (
          <MenuItemCard
            key={idx}
            {...item}
            onAddItem={onAddItem}
          />
        ))}
      </div>
    </section>
  );
};

export default MenuSection;
