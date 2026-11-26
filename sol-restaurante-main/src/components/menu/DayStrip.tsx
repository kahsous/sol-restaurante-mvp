import { getRestaurantWeekdayIndex } from "@/lib/restaurantDate";

interface DayStripProps {
  days: string[];
  currentDay: string;
  pratoDoDia: any;
  onSelectDay: (day: string) => void;
}

const DayStrip: React.FC<DayStripProps> = ({ days, currentDay, pratoDoDia, onSelectDay }) => {
  const todayIndex = getRestaurantWeekdayIndex();
  const todayDay = todayIndex === 0 ? "domingo" : ["segunda", "terça", "quarta", "quinta", "sexta", "sábado"][todayIndex - 1];

  return (
    <div className="flex gap-2 overflow-x-auto mb-6 pb-1 scrollbar-hide">
      {days.map((day) => {
        const dayData = pratoDoDia[day];
        const isToday = day.toLowerCase() === todayDay;
        return (
          <button
            key={day}
            onClick={() => onSelectDay(day)}
            style={{
              borderColor: currentDay === day ? dayData.cor : 'rgba(36,31,26,0.13)',
              borderBottomColor: currentDay === day ? dayData.cor : 'rgba(36,31,26,0.13)',
            }}
            className={`flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-2xl border-2 bg-white flex-shrink-0 min-w-max transition-all ${
              currentDay === day ? 'shadow-lg' : ''
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dayData.cor }} />
            <span className="font-mono text-xs uppercase tracking-wider">{dayData.label.split('-')[0]}</span>
            {isToday && <span className="font-mono text-xs uppercase tracking-wider text-red-700">hoje</span>}
          </button>
        );
      })}
    </div>
  );
};

export default DayStrip;
