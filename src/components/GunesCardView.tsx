import React, { useState } from 'react';
import { MarketItem } from '../types/market';
import { Calculator, TrendingUp } from 'lucide-react';
import { CurrencyFlag } from './CurrencyFlag';
import { isFxItem, getCleanCurrencyCode, getStandardizedProductName } from '../utils/productUtils';

interface GunesCardViewProps {
  items: MarketItem[];
  compact?: boolean;
  decimals?: number;
  onSelectForCalculator?: (item: MarketItem, firmName: string) => void;
  onOpenPriceHistory?: (code: string) => void;
  firmName?: string;
}

// Standardized code to label mapping
const GUNES_LABEL_MAP: Record<string, { label: string; priority: number }> = {
  ALTIN_HAS: { label: 'HAS', priority: 1 },
  HAS: { label: 'HAS', priority: 1 },
  ALTIN_24: { label: '24 AYAR', priority: 1 },
  KULCE: { label: '24 AYAR', priority: 1 },
  ALTIN_22: { label: '22 AYAR', priority: 2 },
  GRM: { label: '22 AYAR', priority: 2 },
  CEYREK_YENI: { label: 'ÇEYREK', priority: 3 },
  CEY: { label: 'ÇEYREK', priority: 3 },
  CEYREK_ESKI: { label: 'ÇEYREK', priority: 4 },
  YARIM_YENI: { label: 'YARIM', priority: 5 },
  YRM: { label: 'YARIM', priority: 5 },
  YARIM_ESKI: { label: 'YARIM', priority: 6 },
  TAM_YENI: { label: 'TAM', priority: 7 },
  TAM: { label: 'TAM', priority: 7 },
  TAM_ESKI: { label: 'TAM', priority: 8 },
  ATA_YENI: { label: 'ATA LİRA', priority: 9 },
  ATA: { label: 'ATA LİRA', priority: 9 },
  ATA_ESKI: { label: 'ATA LİRA', priority: 10 },
  GUMUS: { label: 'GÜMÜŞ', priority: 11 },
  ONS: { label: 'ONS', priority: 12 },
  AU: { label: 'ONS', priority: 12 },
  ALTIN_ONS: { label: 'ONS', priority: 12 },
  ALTIN_14: { label: '14 AYAR', priority: 13 },
  GREMSE_YENI: { label: 'GREMSE', priority: 14 },
  // FX support (Clean Currency codes, no TRY suffix, no descriptions)
  USDTRY: { label: 'USD', priority: 20 },
  EURTRY: { label: 'EUR', priority: 21 },
  GBPTRY: { label: 'GBP', priority: 22 },
  CHFTRY: { label: 'CHF', priority: 23 },
  AUDTRY: { label: 'AUD', priority: 24 },
  CADTRY: { label: 'CAD', priority: 25 },
  SARTRY: { label: 'SAR', priority: 26 },
  JPYTRY: { label: 'JPY', priority: 27 },
  RUBTRY: { label: 'RUB', priority: 28 },
  GELTRY: { label: 'GEL', priority: 29 },
  EURUSD: { label: 'EUR/USD', priority: 30 },
};

// Real branches of Güneş Kuyumculuk in Samsun
const GUNES_BRANCHES = [
  { id: 'meydan', name: 'Meydan', location: 'Saathane Meydanı & Mecidiye' },
  { id: 'carsi_avm', name: 'Çarşı AVM', location: 'Mecidiye Çarşı AVM Giriş Kat' },
  { id: 'turkis', name: 'Türkiş Şube', location: 'Atakum / Türkiş Bulvarı' },
  { id: 'citymall', name: 'Citymall AVM Şube', location: 'Atakum / Citymall AVM Zemin Kat' },
];

export const GunesCardView: React.FC<GunesCardViewProps> = ({
  items,
  compact = false,
  decimals = 2, // Photo uses 2 decimals: e.g. 6.548,65
  onSelectForCalculator,
  onOpenPriceHistory,
  firmName = 'Güneş',
}) => {
  const [selectedBranch, setSelectedBranch] = useState('meydan');

  const formatPrice = (val: number) => {
    if (val === undefined || val === null || val === 0) return '-';
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  const getLabelAndPriority = (item: MarketItem) => {
    const code = String(item?.code || '');
    if (GUNES_LABEL_MAP[code]) {
      return GUNES_LABEL_MAP[code];
    }
    const clean = code.replace('TRY', '').slice(0, 8);
    return { label: item?.name || clean || 'Kur', priority: 99 };
  };

  // Sort items according to Photo order:
  // 24 Ayar -> 22 Ayar -> Çeyrek -> Yarım -> Tam -> Ata Lira -> Au -> others
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  const sortedItems = [...safeItems].sort((a, b) => {
    const metaA = getLabelAndPriority(a);
    const metaB = getLabelAndPriority(b);
    return metaA.priority - metaB.priority;
  });

  return (
    <div className="bg-[#120f0e] rounded-xl border border-[#2b2420] overflow-hidden flex flex-col shadow-2xl text-slate-100 select-none">
      
      {/* 1. Top Brushed Silver Metallic Header Bar (matching Photo) */}
      <div className="bg-gradient-to-b from-[#aba8a5] via-[#989592] to-[#807e7b] text-[#141414] font-black border-b border-[#3b342f] shadow-md">
        <div className="grid grid-cols-[1fr_1.1fr_1fr] items-center text-center py-2 px-1 divide-x divide-black/25">
          {/* ALIŞ / WE BUY (₺) */}
          <div className="flex flex-col items-center justify-center leading-tight">
            <span className="text-[10px] sm:text-[11px] font-extrabold tracking-tight">
              ALIŞ / WE BUY
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-black/75 mt-0.5">
              (₺)
            </span>
          </div>

          {/* KUR */}
          <div className="flex items-center justify-center h-full">
            <span className="text-xs sm:text-[13px] font-black tracking-wider">
              KUR
            </span>
          </div>

          {/* SATIŞ / WE SELL (₺) */}
          <div className="flex flex-col items-center justify-center leading-tight">
            <span className="text-[10px] sm:text-[11px] font-extrabold tracking-tight">
              SATIŞ / WE SELL
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-black/75 mt-0.5">
              (₺)
            </span>
          </div>
        </div>
      </div>

      {/* 2. Price Rows (Deep Black Containers matching Photo) */}
      <div className="p-2 sm:p-2.5 space-y-1.5 max-h-[460px] overflow-y-auto custom-scrollbar">
        {sortedItems.map((item) => {
          const { label } = getLabelAndPriority(item);

          return (
            <div
              key={item.code}
              className="grid grid-cols-[1fr_1.1fr_1fr] gap-1.5 items-center group relative"
            >
              {/* Left Box: ALIŞ Price in Pure Black Capsule */}
              <div
                className="bg-[#040404] hover:bg-[#0a0a0a] border border-white/5 rounded-lg py-2 px-1 text-center shadow-inner transition-colors flex items-center justify-center cursor-pointer"
                onClick={() => onSelectForCalculator?.(item, firmName)}
                title="Hesaplayıcı için tıkla"
              >
                <span className="text-white font-extrabold font-mono text-xs sm:text-[14px] md:text-[15px] tabular-nums tracking-tight">
                  {formatPrice(item.buy)}
                </span>
              </div>

              {/* Center Box: KUR Name & Circular Flag (Tek Satır, Açıklama Yok) */}
              <div
                className="bg-[#080706] border border-white/5 rounded-lg py-2 px-1.5 text-center shadow-inner flex items-center justify-center space-x-1.5 min-w-0"
              >
                {isFxItem(item.code) && (
                  <CurrencyFlag
                    code={getCleanCurrencyCode(item.code)}
                    size={16}
                    className="w-4 h-4 shrink-0 rounded-full"
                  />
                )}
                <span className="text-white font-bold text-xs sm:text-[13px] tracking-tight truncate drop-shadow-sm">
                  {label}
                </span>
              </div>

              {/* Right Box: SATIŞ Price in Pure Black Capsule */}
              <div
                className="bg-[#040404] hover:bg-[#0a0a0a] border border-white/5 rounded-lg py-2 px-1 text-center shadow-inner transition-colors flex items-center justify-center cursor-pointer"
                onClick={() => onSelectForCalculator?.(item, firmName)}
                title="Hesaplayıcı için tıkla"
              >
                <span className="text-white font-extrabold font-mono text-xs sm:text-[14px] md:text-[15px] tabular-nums tracking-tight">
                  {formatPrice(item.sell)}
                </span>
              </div>

              {/* Quick Action Hover Pill for Chart / Calc */}
              <div className="absolute right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-0.5 z-10 bg-black/90 p-0.5 rounded border border-amber-500/40">
                {onSelectForCalculator && (
                  <button
                    onClick={() => onSelectForCalculator(item, firmName)}
                    className="p-0.5 text-amber-400 hover:text-white"
                    title="Hesaplayıcıya Gönder"
                  >
                    <Calculator className="w-2.5 h-2.5" />
                  </button>
                )}
                {onOpenPriceHistory && (
                  <button
                    onClick={() => onOpenPriceHistory(item.code)}
                    className="p-0.5 text-indigo-400 hover:text-white"
                    title="Grafik"
                  >
                    <TrendingUp className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Branch Selectors (matching Photo: Meydan, Çarşı AVM, Türkiş Şube, Citymall AVM) */}
      <div className="px-2 pt-2 pb-1 border-t border-[#261f1a] bg-[#0c0908]">
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {GUNES_BRANCHES.map((b) => {
            const isActive = selectedBranch === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBranch(b.id)}
                className={`px-2 py-1 rounded text-[10px] font-bold transition flex items-center space-x-1 ${
                  isActive
                    ? 'bg-[#221912] border border-amber-500/80 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                    : 'bg-[#080605] border border-white/5 text-stone-400 hover:text-white hover:border-stone-700'
                }`}
                title={b.location}
              >
                <span className="text-[10px] text-amber-400">📍</span>
                <span>{b.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Bottom Signature Brand Logo (Golden Diamond Crest + G Ü N E Ş from Photo) */}
      <div className="py-2.5 bg-[#090706] border-t border-[#1e1814] flex flex-col items-center justify-center">
        {/* Golden Diamond Crest from Photo */}
        <div className="flex items-center justify-center mb-0.5">
          <svg viewBox="0 0 32 18" className="w-6 h-3.5 text-amber-400">
            <polygon
              points="16,1 31,9 16,17 1,9"
              fill="none"
              stroke="#d4af37"
              strokeWidth="2"
            />
            <line x1="8" y1="9" x2="24" y2="9" stroke="#d4af37" strokeWidth="1.2" />
            <line x1="16" y1="1" x2="16" y2="17" stroke="#d4af37" strokeWidth="1.2" />
          </svg>
        </div>

        {/* G Ü N E Ş Serif Wordmark */}
        <div className="text-white font-serif font-black tracking-[0.35em] text-xs sm:text-sm uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          G Ü N E Ş
        </div>
      </div>

    </div>
  );
};
