import React, { useState } from 'react';
import { Building2, Sun, Compass, Sparkles, Coins, Crown, Eye } from 'lucide-react';

export interface FirmLogoProps {
  firmKey?: string;
  firmName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
  showBackground?: boolean;
}

export function normalizeFirmKey(firmKey?: string, firmName?: string): string {
  if (firmKey) {
    const k = firmKey.toLowerCase();
    if (k.includes('gunes') || k.includes('güneş')) return 'gunes_kuyumculuk';
    if (k.includes('kaptan')) return 'kaptan_doviz';
    if (k.includes('solis')) return 'solis_doviz';
    if (k.includes('sar')) return 'sar_doviz';
    if (k.includes('altinkose') || k.includes('altınköşe')) return 'altinkose';
    if (k.includes('ilkay')) return 'ilkay_doviz';
    if (k.includes('vizyon')) return 'vizyon_altin';
    return k;
  }
  if (firmName) {
    const n = firmName.toLowerCase();
    if (n.includes('güneş') || n.includes('gunes')) return 'gunes_kuyumculuk';
    if (n.includes('kaptan')) return 'kaptan_doviz';
    if (n.includes('solis')) return 'solis_doviz';
    if (n.includes('sar')) return 'sar_doviz';
    if (n.includes('altınköşe') || n.includes('altinkose')) return 'altinkose';
    if (n.includes('ilkay')) return 'ilkay_doviz';
    if (n.includes('vizyon')) return 'vizyon_altin';
  }
  return '';
}

export const FIRM_LOGO_SRC: Record<string, string> = {
  gunes_kuyumculuk: '/assets/logos/gunes.png',
  kaptan_doviz: '/assets/logos/kaptan.png',
  solis_doviz: '/assets/logos/solis.png',
  sar_doviz: '/assets/logos/sar.png',
  altinkose: '/assets/logos/altinkose.png',
  ilkay_doviz: '/assets/logos/ilkay.png',
  vizyon_altin: '/assets/logos/vizyon.png',
};

const SIZE_MAP = {
  xs: { box: 'w-4 h-4', img: 'max-w-3.5 max-h-3.5', icon: 12 },
  sm: { box: 'w-5 h-5', img: 'max-w-4 max-h-4', icon: 14 },
  md: { box: 'w-7 h-7', img: 'max-w-6 max-h-6', icon: 18 },
  lg: { box: 'w-9 h-9', img: 'max-w-8 max-h-8', icon: 22 },
  xl: { box: 'w-12 h-12', img: 'max-w-10 max-h-10', icon: 28 },
};

export const FirmLogo: React.FC<FirmLogoProps> = ({
  firmKey,
  firmName,
  size = 'sm',
  className = '',
  rounded = 'md',
  showBackground = true,
}) => {
  const [hasError, setHasError] = useState(false);
  const normalizedKey = normalizeFirmKey(firmKey, firmName);
  const logoSrc = FIRM_LOGO_SRC[normalizedKey];

  const sizeConfig = typeof size === 'number'
    ? { box: `w-[${size}px] h-[${size}px]`, img: `max-w-[${size - 4}px] max-h-[${size - 4}px]`, icon: size - 4 }
    : SIZE_MAP[size] || SIZE_MAP.sm;

  const roundedClass =
    rounded === 'full'
      ? 'rounded-full'
      : rounded === 'lg'
      ? 'rounded-xl'
      : rounded === 'sm'
      ? 'rounded'
      : 'rounded-md';

  const renderFallbackIcon = () => {
    switch (normalizedKey) {
      case 'gunes_kuyumculuk':
        return <Sun size={sizeConfig.icon} className="text-amber-500 shrink-0" />;
      case 'kaptan_doviz':
        return <Compass size={sizeConfig.icon} className="text-sky-500 shrink-0" />;
      case 'solis_doviz':
        return <Sparkles size={sizeConfig.icon} className="text-amber-500 shrink-0" />;
      case 'sar_doviz':
        return <Coins size={sizeConfig.icon} className="text-emerald-500 shrink-0" />;
      case 'altinkose':
        return <Crown size={sizeConfig.icon} className="text-yellow-500 shrink-0" />;
      case 'ilkay_doviz':
        return <Building2 size={sizeConfig.icon} className="text-indigo-500 shrink-0" />;
      case 'vizyon_altin':
        return <Eye size={sizeConfig.icon} className="text-purple-500 shrink-0" />;
      default:
        return <Building2 size={sizeConfig.icon} className="text-slate-400 shrink-0" />;
    }
  };

  if (!logoSrc || hasError) {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 ${sizeConfig.box} ${roundedClass} ${
          showBackground ? 'bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80' : ''
        } ${className}`}
        title={firmName || firmKey}
      >
        {renderFallbackIcon()}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden ${sizeConfig.box} ${roundedClass} ${
        showBackground
          ? 'bg-white shadow-2xs border border-slate-200/90 dark:border-slate-700 p-0.5'
          : ''
      } ${className}`}
      title={firmName || firmKey}
    >
      <img
        src={logoSrc}
        alt={firmName || normalizedKey}
        onError={() => setHasError(true)}
        className={`${sizeConfig.img} object-contain shrink-0`}
        loading="lazy"
      />
    </div>
  );
};
