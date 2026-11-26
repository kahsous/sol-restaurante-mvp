interface ProteinPillsProps {
  proteins: string[];
  currentProtein: string;
  onSelectProtein: (protein: string) => void;
}

const ProteinPills: React.FC<ProteinPillsProps> = ({ proteins, currentProtein, onSelectProtein }) => {
  return (
    <div className="flex gap-2 overflow-x-auto mb-5.5 pb-1 scrollbar-hide">
      {proteins.map((protein) => (
        <button
          key={protein}
          onClick={() => onSelectProtein(protein)}
          className={`flex-shrink-0 font-mono text-xs uppercase tracking-wider px-4 py-2 rounded-full border transition-all ${
            currentProtein === protein
              ? 'bg-gray-900 border-gray-900 text-white'
              : 'bg-white border-gray-200 text-gray-900 hover:text-gray-900'
          }`}
        >
          {protein}
        </button>
      ))}
    </div>
  );
};

export default ProteinPills;
