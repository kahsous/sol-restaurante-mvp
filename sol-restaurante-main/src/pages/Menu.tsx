import { useEffect, useState, useCallback } from 'react';
import MenuHero from '@/components/menu/MenuHero';
import MenuNav from '@/components/menu/MenuNav';
import MenuCart from '@/components/menu/MenuCart';
import MenuSection from '@/components/menu/MenuSection';
import DayStrip from '@/components/menu/DayStrip';
import ProteinPills from '@/components/menu/ProteinPills';
import { getRestaurantWeekdayIndex } from '@/lib/restaurantDate';
import {
  pratosPrincipais,
  panquecas,
  parmegianas,
  pratoDoDia,
  sobremesas,
  bebidas,
} from '@/data/menu';

interface CartItem {
  price: number;
  qty: number;
}

const Menu = () => {
  const [cartItems, setCartItems] = useState<Record<string, CartItem>>({});
  const [activeSection, setActiveSection] = useState('pratodia');
  const [currentDay, setCurrentDay] = useState(() => {
    const jsDayIndex = getRestaurantWeekdayIndex();
    const dayOrder = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    return jsDayIndex === 0 ? 'seg' : dayOrder[jsDayIndex - 1];
  });
  const [currentProtein, setCurrentProtein] = useState('Frango');

  useEffect(() => {
    document.title = 'Cardápio público · Restaurante Sol';
    const description = 'Cardápio público do Restaurante Sol com pratos por categoria, preços e pedido pelo WhatsApp.';
    const meta = document.querySelector('meta[name="description"]') || document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', description);
    document.head.appendChild(meta);
  }, []);

  const handleAddItem = useCallback((name: string, size: string, price: number) => {
    const key = size === 'Un.' ? name : `${name} (${size})`;
    setCartItems((prev) => ({
      ...prev,
      [key]: {
        price,
        qty: (prev[key]?.qty || 0) + 1,
      },
    }));

  }, []);

  const handleRemoveItem = useCallback((key: string) => {
    setCartItems((prev) => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const handleClearCart = useCallback(() => {
    setCartItems({});
  }, []);

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const dayOrder = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  const panquecasItem = {
    name: `Panquecas (${panquecas.sabores})`,
    desc: panquecas.desc,
    sizes: panquecas.sizes,
  };
  const parmegianaItem = {
    name: 'Parmegianas',
    desc: parmegianas.desc,
    rangeText: parmegianas.rangeText,
    note: parmegianas.note,
  };

  return (
    <div className="bg-yellow-50 min-h-screen pb-28">
      <MenuHero />
      <MenuNav
        sections={['pratodia', 'principais', 'panquecas', 'sobremesas', 'bebidas']}
        onNavigate={handleNavigate}
        activeSection={activeSection}
      />
      <main className="max-w-2xl mx-auto px-4.5 py-9">
        {/* Prato do Dia */}
        <section id="pratodia" className="mb-14 scroll-mt-16">
          <h2 className="font-serif font-semibold text-2xl text-gray-900 mb-1">Prato do Dia</h2>
          <p className="text-sm text-gray-500 mb-5">Cardápio rotativo — escolha o dia da semana.</p>
          <DayStrip days={dayOrder} currentDay={currentDay} pratoDoDia={pratoDoDia} onSelectDay={setCurrentDay} />
          <MenuItemCard
            name={pratoDoDia[currentDay].label}
            desc={`Confira nosso prato de hoje: ${pratoDoDia[currentDay].itens.map((i) => i.name).join(', ')}`}
            onAddItem={() => {}}
          />
          {pratoDoDia[currentDay].itens.map((item, idx) => (
            <MenuItemCard key={idx} {...item} onAddItem={handleAddItem} />
          ))}
        </section>

        {/* Pratos Principais */}
        <section id="principais" className="mb-14 scroll-mt-16">
          <h2 className="font-serif font-semibold text-2xl text-gray-900 mb-1">Pratos Principais</h2>
          <p className="text-sm text-gray-500 mb-5">Escolha a proteína.</p>
          <ProteinPills
            proteins={Object.keys(pratosPrincipais)}
            currentProtein={currentProtein}
            onSelectProtein={setCurrentProtein}
          />
          {pratosPrincipais[currentProtein as keyof typeof pratosPrincipais]?.map((item, idx) => (
            <MenuItemCard key={idx} {...item} onAddItem={handleAddItem} />
          ))}
        </section>

        {/* Panquecas & Parmegianas */}
        <MenuSection
          id="panquecas"
          title="Panquecas & Parmegianas"
          subtitle="Massa leve ou empanado crocante — sempre com molho."
          items={[panquecasItem, parmegianaItem]}
          onAddItem={handleAddItem}
        />

        {/* Sobremesas */}
        <MenuSection
          id="sobremesas"
          title="Sobremesas"
          subtitle="Pra fechar com chave de ouro."
          items={sobremesas}
          onAddItem={handleAddItem}
        />

        {/* Bebidas */}
        <section id="bebidas" className="mb-14 scroll-mt-16">
          <h2 className="font-serif font-semibold text-2xl text-gray-900 mb-1">Bebidas</h2>
          <p className="text-sm text-gray-500 mb-5">Geladinhas, na medida certa.</p>
          {Object.entries(bebidas).map(([grupo, items]) => (
            <div key={grupo} className="mb-5">
              <h3 className="font-serif text-base font-semibold text-green-700 mb-2.5">{grupo}</h3>
              {items.map((item, idx) => (
                <MenuItemCard key={idx} {...item} onAddItem={handleAddItem} />
              ))}
            </div>
          ))}
        </section>

        <footer className="text-center py-7.5 text-xs text-gray-400 font-mono tracking-wider">
          Sol Restaurante · Cardápio sujeito a alterações sem aviso prévio
        </footer>
      </main>
      <MenuCart
        items={cartItems}
        onRemoveItem={handleRemoveItem}
        onClear={handleClearCart}
      />
    </div>
  );
};

export default Menu;
