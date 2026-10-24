export interface FirmBrandStyle {
  label: string;
  badge: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  accentHex: string;
  glowColor: string;
}

export const FIRM_CELL_STYLES: Record<string, FirmBrandStyle> = {
  gunes_kuyumculuk: {
    label: 'Güneş Kuyumculuk',
    badge: 'GÜNEŞ',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    accentHex: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.25)',
  },
  kaptan_doviz: {
    label: 'Kaptan Altın & Döviz',
    badge: 'KAPTAN',
    textColor: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    accentHex: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.25)',
  },
  ilkay_doviz: {
    label: 'İlkay Döviz',
    badge: 'İLKAY',
    textColor: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    accentHex: '#818cf8',
    glowColor: 'rgba(129, 140, 248, 0.25)',
  },
  solis_doviz: {
    label: 'Solis Döviz',
    badge: 'SOLİS',
    textColor: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    accentHex: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.25)',
  },
  sar_doviz: {
    label: 'SAR Döviz',
    badge: 'SAR DÖVİZ',
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    accentHex: '#34d399',
    glowColor: 'rgba(52, 211, 153, 0.25)',
  },
  altinkose: {
    label: 'Altınköşe Kuyumculuk',
    badge: 'ALTINKÖŞE',
    textColor: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    accentHex: '#facc15',
    glowColor: 'rgba(250, 204, 21, 0.25)',
  },
  vizyon_altin: {
    label: 'Vizyon Kuyumculuk',
    badge: 'VİZYON',
    textColor: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    accentHex: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.25)',
  },
};

export function getFirmBrandStyle(sourceKey?: string, firmName?: string): FirmBrandStyle {
  if (sourceKey && FIRM_CELL_STYLES[sourceKey]) {
    return FIRM_CELL_STYLES[sourceKey];
  }
  const cleanName = (firmName || '').toLowerCase();
  if (cleanName.includes('güneş') || cleanName.includes('gunes')) return FIRM_CELL_STYLES.gunes_kuyumculuk;
  if (cleanName.includes('kaptan')) return FIRM_CELL_STYLES.kaptan_doviz;
  if (cleanName.includes('solis')) return FIRM_CELL_STYLES.solis_doviz;
  if (cleanName.includes('ilkay')) return FIRM_CELL_STYLES.ilkay_doviz;
  if (cleanName.includes('sar')) return FIRM_CELL_STYLES.sar_doviz;
  if (cleanName.includes('altınköşe') || cleanName.includes('altinkose')) return FIRM_CELL_STYLES.altinkose;
  if (cleanName.includes('vizyon')) return FIRM_CELL_STYLES.vizyon_altin;
  return FIRM_CELL_STYLES.gunes_kuyumculuk;
}
