import React from 'react';
import { RiskLevel } from '@/types/database';
import { ShieldCheck, AlertTriangle, Flame, AlertOctagon, Siren, Info } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, showIcon = true, size = 'md' }) => {
  const getBadgeStyle = (lvl: RiskLevel) => {
    switch (lvl) {
      case 'Safe':
        return {
          bg: 'bg-emerald-50/90 text-emerald-800 border-emerald-300/80 shadow-subtle',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />,
          dot: 'bg-emerald-500',
        };
      case 'Low':
        return {
          bg: 'bg-green-50/90 text-green-800 border-green-300/80 shadow-subtle',
          icon: <Info className="w-3.5 h-3.5 text-green-700" />,
          dot: 'bg-green-500',
        };
      case 'Moderate':
        return {
          bg: 'bg-amber-50/90 text-amber-900 border-amber-300/80 shadow-subtle',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />,
          dot: 'bg-amber-500',
        };
      case 'High':
        return {
          bg: 'bg-orange-50/90 text-orange-900 border-orange-300/80 shadow-subtle',
          icon: <Flame className="w-3.5 h-3.5 text-orange-700" />,
          dot: 'bg-orange-500',
        };
      case 'Extreme':
        return {
          bg: 'bg-rose-50/90 text-rose-900 border-rose-300/80 shadow-subtle',
          icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-700" />,
          dot: 'bg-rose-600',
        };
      case 'Emergency':
        return {
          bg: 'bg-red-950 text-rose-100 border-red-800 shadow-md ring-1 ring-red-600/40',
          icon: <Siren className="w-3.5 h-3.5 text-rose-300 animate-pulse" />,
          dot: 'bg-rose-400 animate-ping',
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300 shadow-subtle',
          icon: <Info className="w-3.5 h-3.5 text-slate-600" />,
          dot: 'bg-slate-400',
        };
    }
  };

  const style = getBadgeStyle(level);
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] font-semibold tracking-wider',
    md: 'px-2.5 py-1 text-xs font-bold tracking-wider',
    lg: 'px-3.5 py-1.5 text-xs md:text-sm font-bold tracking-wide',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border transition-colors ${style.bg} ${sizeClasses}`}
    >
      {showIcon && style.icon}
      <span>{level.toUpperCase()}</span>
    </span>
  );
};

