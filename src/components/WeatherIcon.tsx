import React from 'react';
import {
  Sun,
  SunMedium,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudLightning,
  Snowflake,
  Wind,
} from 'lucide-react';

interface WeatherIconProps {
  code?: number;
  condition?: string;
  className?: string;
  size?: number;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  code,
  condition,
  className = 'w-5 h-5',
  size,
}) => {
  // Determine weather category from code or condition text
  if (code !== undefined) {
    if (code === 0) {
      return <Sun className={`${className} text-amber-500`} size={size} strokeWidth={2} />;
    }
    if (code === 1 || code === 2) {
      return <CloudSun className={`${className} text-amber-500`} size={size} strokeWidth={2} />;
    }
    if (code === 3) {
      return <Cloud className={`${className} text-slate-400`} size={size} strokeWidth={2} />;
    }
    if (code === 45 || code === 48) {
      return <CloudFog className={`${className} text-teal-500`} size={size} strokeWidth={2} />;
    }
    if (code === 51 || code === 53 || code === 55) {
      return <CloudDrizzle className={`${className} text-cyan-500`} size={size} strokeWidth={2} />;
    }
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
      return <CloudRain className={`${className} text-sky-500`} size={size} strokeWidth={2} />;
    }
    if (code >= 71 && code <= 77) {
      return <Snowflake className={`${className} text-sky-300`} size={size} strokeWidth={2} />;
    }
    if (code >= 95 && code <= 99) {
      return <CloudLightning className={`${className} text-amber-400`} size={size} strokeWidth={2} />;
    }
  }

  // Fallback by condition string if code not available
  const cond = (condition || '').toLowerCase();
  if (cond.includes('clear') || cond.includes('sunny')) {
    return <Sun className={`${className} text-amber-500`} size={size} strokeWidth={2} />;
  }
  if (cond.includes('partly') || cond.includes('mainly')) {
    return <CloudSun className={`${className} text-amber-500`} size={size} strokeWidth={2} />;
  }
  if (cond.includes('fog') || cond.includes('mist')) {
    return <CloudFog className={`${className} text-teal-500`} size={size} strokeWidth={2} />;
  }
  if (cond.includes('rain') || cond.includes('shower')) {
    return <CloudRain className={`${className} text-sky-500`} size={size} strokeWidth={2} />;
  }
  if (cond.includes('drizzle')) {
    return <CloudDrizzle className={`${className} text-cyan-500`} size={size} strokeWidth={2} />;
  }
  if (cond.includes('thunder') || cond.includes('storm')) {
    return <CloudLightning className={`${className} text-amber-400`} size={size} strokeWidth={2} />;
  }
  if (cond.includes('snow')) {
    return <Snowflake className={`${className} text-sky-300`} size={size} strokeWidth={2} />;
  }
  if (cond.includes('cloud') || cond.includes('overcast')) {
    return <Cloud className={`${className} text-slate-400`} size={size} strokeWidth={2} />;
  }

  // Default clean fair weather icon
  return <SunMedium className={`${className} text-teal-500`} size={size} strokeWidth={2} />;
};
