import { useEffect, useState } from 'react';

const MenuHero = () => {
  const [sunPosition, setSunPosition] = useState({ cx: 170, cy: 30, r: 7 });

  useEffect(() => {
    const updateSunPosition = () => {
      const hora = new Date().getHours() + new Date().getMinutes() / 60;
      const inicio = 6, fim = 20;
      const t = Math.min(1, Math.max(0, (hora - inicio) / (fim - inicio)));
      const angle = Math.PI * (1 - t);
      const cx = 170 + 150 * Math.cos(angle);
      const cy = 150 - 150 * Math.sin(angle);
      setSunPosition({ cx, cy: Math.max(cy, 20), r: 7 });
    };
    updateSunPosition();
    const interval = setInterval(updateSunPosition, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="relative bg-gradient-to-b from-[#1B3A4B] via-[#123040] to-[#FDF8ED] px-6 py-14 text-center overflow-hidden">
      <svg className="absolute left-1/2 top-9 w-80 h-40 -translate-x-1/2 pointer-events-none" viewBox="0 0 340 170" aria-hidden>
        <path
          d="M20,150 A150,150 0 0 1 320,150"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />
        <circle
          cx={sunPosition.cx}
          cy={sunPosition.cy}
          r={sunPosition.r}
          fill="#F2B705"
          style={{
            filter: 'drop-shadow(0 0 22px rgba(242,183,5,0.55))',
            transition: 'cx 1s ease, cy 1s ease'
          }}
        />
      </svg>
      <div className="relative z-10">
        <p className="font-mono text-xs uppercase tracking-widest text-amber-400 mb-3.5">Comida caseira · Todo dia tem prato novo</p>
        <h1 className="font-serif font-semibold text-5xl text-white mb-3.5 -tracking-wide">Sol Restaurante</h1>
        <p className="mx-auto max-w-md text-white/72 text-sm italic">Prato feito de verdade, com arroz, salada e o carinho de sempre.</p>
        <div className="mx-auto mt-5 max-w-xl bg-white/8 border border-white/18 rounded-xl p-3 text-xs text-white/85 leading-relaxed">
          Todos os pratos principais acompanham <b>arroz e salada</b> — exceto as almôndegas, que vêm com <b>salada e macarrão</b>.
        </div>
      </div>
    </header>
  );
};

export default MenuHero;
