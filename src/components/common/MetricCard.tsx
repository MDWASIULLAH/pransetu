import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: { value: string; positive: boolean };
  color?: 'blue' | 'red' | 'orange' | 'green' | 'yellow' | 'gray';
  pulse?: boolean;
}

export const MetricCard = ({ title, value, icon: Icon, trend, color = 'blue', pulse = false }: MetricCardProps) => {
  const colorMap = {
    blue: 'text-on-surface',
    red: 'text-red-400',
    orange: 'text-orange-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    gray: 'text-on-surface-variant',
  };

  const borderMap = {
    blue: 'border-outline-variant/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]',
    red: 'border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
    orange: 'border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]',
    green: 'border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]',
    yellow: 'border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]',
    gray: 'border-gray-500/30',
  };

  const textColor = colorMap[color];
  const borderColor = borderMap[color];

  return (
    <div className={clsx(
      "glass-panel rounded-xl p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden",
      borderColor,
      pulse && "pulse-critical"
    )}>
      {/* Decorative gradient overlay */}
      <div className={clsx(
        "absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 -mr-10 -mt-10",
        color === 'red' ? "bg-red-500" : 
        color === 'blue' ? "bg-blue-500" : 
        color === 'green' ? "bg-emerald-600" : "bg-gray-500"
      )} />

      <div className="flex justify-between items-start z-10">
        <h3 className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">{title}</h3>
        {Icon && (
          <div className={clsx("p-2 rounded-lg bg-black/30 backdrop-blur-sm border border-white/5", textColor)}>
            <Icon size={18} />
          </div>
        )}
      </div>
      
      <div className="mt-4 flex items-end justify-between z-10">
        <div className="flex items-baseline gap-2">
          <span className={clsx("text-3xl font-bold font-sans tracking-tight", textColor)}>
            {value}
          </span>
        </div>
        {trend && (
          <div className={clsx(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            trend.positive ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
          )}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </div>
        )}
      </div>
    </div>
  );
};
