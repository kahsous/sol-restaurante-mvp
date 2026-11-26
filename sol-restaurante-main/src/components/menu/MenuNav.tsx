interface MenuNavProps {
  sections: string[];
  onNavigate: (sectionId: string) => void;
  activeSection: string;
}

const MenuNav: React.FC<MenuNavProps> = ({ sections, onNavigate, activeSection }) => {
  const labels: Record<string, string> = {
    'pratodia': 'Prato do Dia',
    'principais': 'Pratos Principais',
    'panquecas': 'Panquecas & Parmegianas',
    'sobremesas': 'Sobremesas',
    'bebidas': 'Bebidas',
  };

  return (
    <nav className="sticky top-0 z-30 flex overflow-x-auto bg-white border-b border-gray-200 shadow-md scrollbar-hide">
      {sections.map((section) => (
        <button
          key={section}
          onClick={() => onNavigate(section)}
          className={`flex-shrink-0 font-mono text-xs uppercase tracking-wider px-4.5 py-4 border-b-3 transition-colors whitespace-nowrap ${
            activeSection === section
              ? 'text-red-700 border-red-700'
              : 'text-gray-400 border-transparent hover:text-gray-800'
          }`}
        >
          {labels[section]}
        </button>
      ))}
    </nav>
  );
};

export default MenuNav;
