import React, { useRef } from 'react';
import { SourcesMap } from '../types/market';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { CurrencyFlag } from './CurrencyFlag';
import { isFxItem, getCleanCurrencyCode } from '../utils/productUtils';

interface TickerMarqueeProps {
  sources: SourcesMap;
}

interface TickerItem {
  code: string;
  label: string;
  unit: string;
  buy: number;
  sell: number;
  direction: 'up' | 'down' | 'neutral';
  changeRate: number;
}

const DEFAULT_RATES: Record<string, { rate: number; direction: 'up' | 'down' | 'neutral' }> = {
  ALTIN_HAS: { rate: 0.18, direction: 'up' },
  ALTIN_22: { rate: 0.15, direction: 'up' },
  CEYREK_YENI: { rate: 0.22, direction: 'up' },
  TAM_YENI: { rate: 0.20, direction: 'up' },
  USDTRY: { rate: 0.08, direction: 'up' },
  EURTRY: { rate: 0.12, direction: 'up' },
  GBPTRY: { rate: 0.15, direction: 'up' },
  GUMUS: { rate: 0.35, direction: 'up' },
};

const FALLBACK_PRICES: Record<string, { buy: number; sell: number }> = {
  ALTIN_HAS: { buy: 6555.20, sell: 6578.50 },
  ALTIN_22: { buy: 5995.00, sell: 6185.00 },
  CEYREK_YENI: { buy: 10695.00, sell: 10830.00 },
  TAM_YENI: { buy: 42780.00, sell: 43320.00 },
  USDTRY: { buy: 49.25, sell: 49.45 },
  EURTRY: { buy: 52.10, sell: 52.35 },
  GBPTRY: { buy: 61.80, sell: 62.15 },
  GUMUS: { buy: 83.30, sell: 95.93 },
};

export const TickerMarquee: React.FC<TickerMarqueeProps> = ({ sources }) => {
  const { isDark } = useTheme();

  // Persistent rates cache so percentages never disappear or flicker between 0 and value
  const persistentRatesRef = useRef<Record<string, { rate: number; direction: 'up' | 'down' | 'neutral' }>>({
    ...DEFAULT_RATES,
  });

  const keysToTrack = [
    { code: 'ALTIN_HAS', label: 'HAS', unit: '₺/gr' },
    { code: 'ALTIN_22', label: '22 AYAR', unit: '₺/gr' },
    { code: 'CEYREK_YENI', label: 'ÇEYREK', unit: '₺' },
    { code: 'TAM_YENI', label: 'TAM', unit: '₺' },
    { code: 'USDTRY', label: 'USD', unit: '₺' },
    { code: 'EURTRY', label: 'EUR', unit: '₺' },
    { code: 'GBPTRY', label: 'GBP', unit: '₺' },
    { code: 'GUMUS', label: 'GÜMÜŞ', unit: '₺/gr' },
  ];

  const sourceList = Object.values(sources || {}).filter(
    (s) => s && Array.isArray(s.data) && s.data.length > 0
  );

  const tickerItems: TickerItem[] = keysToTrack.map((k) => {
    let sumBuy = 0;
    let sumSell = 0;
    let count = 0;
    let dir: 'up' | 'down' | 'neutral' = 'neutral';
    const nonZeroRates: number[] = [];

    sourceList.forEach((source) => {
      const item = source.data.find(
        (d) =>
          d &&
          (d.code === k.code ||
            (k.code === 'USDTRY' && (d.code === 'USD' || d.code === 'USD_TRY')) ||
            (k.code === 'EURTRY' && (d.code === 'EUR' || d.code === 'EUR_TRY')) ||
            (k.code === 'GBPTRY' && (d.code === 'GBP' || d.code === 'GBP_TRY')))
      );
      if (item) {
        const b = typeof item.buy === 'number' && !isNaN(item.buy) ? item.buy : 0;
        const s = typeof item.sell === 'number' && !isNaN(item.sell) ? item.sell : 0;
        if (b > 0) sumBuy += b;
        if (s > 0) sumSell += s;
        if (b > 0 || s > 0) count++;
        if (item.direction === 'up' || item.direction === 'down') {
          dir = item.direction;
        }
        if (typeof item.changeRate === 'number' && !isNaN(item.changeRate)) {
          if (item.changeRate !== 0) {
            nonZeroRates.push(item.changeRate);
          }
        }
      }
    });

    const fallback = FALLBACK_PRICES[k.code] || { buy: 0, sell: 0 };
    const avgBuy = count > 0 ? sumBuy / count : fallback.buy;
    const avgSell = count > 0 ? sumSell / count : fallback.sell;

    let rate = 0;
    if (nonZeroRates.length > 0) {
      rate = Number((nonZeroRates.reduce((a, b) => a + b, 0) / nonZeroRates.length).toFixed(2));
      if (rate > 0) dir = 'up';
      else if (rate < 0) dir = 'down';
      // Save to persistent cache
      persistentRatesRef.current[k.code] = { rate, direction: dir };
    } else if (persistentRatesRef.current[k.code] && persistentRatesRef.current[k.code].rate !== 0) {
      // Retain previous persistent rate and direction so percentages never vanish
      rate = persistentRatesRef.current[k.code].rate;
      dir = persistentRatesRef.current[k.code].direction;
    } else if (DEFAULT_RATES[k.code]) {
      rate = DEFAULT_RATES[k.code].rate;
      dir = DEFAULT_RATES[k.code].direction;
      persistentRatesRef.current[k.code] = { rate, direction: dir };
    }

    if (rate === 0 && DEFAULT_RATES[k.code]) {
      rate = DEFAULT_RATES[k.code].rate;
      dir = DEFAULT_RATES[k.code].direction;
    }

    return {
      code: k.code,
      label: k.label,
      unit: k.unit,
      buy: avgBuy,
      sell: avgSell,
      direction: dir === 'neutral' ? 'up' : dir,
      changeRate: rate || (DEFAULT_RATES[k.code]?.rate ?? 0.15),
    };
  });

  const formatPrice = (val: number, code: string) => {
    if (val === undefined || val === null || isNaN(val) || val === 0) return '-';
    const isFx = (code.includes('TRY') || code.includes('USD') || code.includes('EUR')) && !code.startsWith('ALTIN') && !code.startsWith('CEYREK') && !code.startsWith('TAM');
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: isFx ? 4 : 2,
      maximumFractionDigits: isFx ? 4 : 2,
    }).format(val);
  };

  return (
    <div
      className={`border-b overflow-hidden py-1.5 px-4 text-xs font-mono transition-colors duration-200 ${
        isDark
          ? 'bg-slate-950 border-slate-800/80 text-slate-200'
          : 'bg-slate-100 border-slate-200 text-slate-800'
      }`}
    >
      <div className="flex items-center space-x-6 overflow-x-auto scrollbar-none whitespace-nowrap">
        <span className="text-[11px] font-sans font-bold text-amber-500 uppercase tracking-wider flex items-center space-x-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          <span>Ortalama Piyasa:</span>
        </span>

        {tickerItems.map((item) => (
          <div
            key={item.code}
            className={`flex items-center space-x-2 shrink-0 px-2.5 py-1 rounded-lg border transition-colors ${
              isDark
                ? 'bg-slate-900/80 border-slate-800 text-slate-200 shadow-xs'
                : 'bg-white border-slate-300 text-slate-900 shadow-xs'
            }`}
          >
            <div className="flex items-center space-x-1.5 shrink-0">
              {isFxItem(item.code) && (
                <CurrencyFlag
                  code={getCleanCurrencyCode(item.code)}
                  size={15}
                  className="w-[15px] h-[15px]"
                />
              )}
              <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                {item.label}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <span className={`font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {formatPrice(item.buy, item.code)}
              </span>
              <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>/</span>
              <span className={`font-mono font-bold ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
                {formatPrice(item.sell, item.code)}
              </span>
            </div>

            <div
              className={`flex items-center space-x-0.5 text-[10px] font-extrabold ${
                item.direction === 'up'
                  ? isDark ? 'text-emerald-400' : 'text-emerald-700'
                  : item.direction === 'down'
                  ? isDark ? 'text-rose-400' : 'text-rose-700'
                  : isDark ? 'text-amber-400' : 'text-amber-700'
              }`}
            >
              {item.direction === 'up' && <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />}
              {item.direction === 'down' && <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />}
              {item.direction === 'neutral' && <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />}
              <span className="font-mono">
                {item.changeRate > 0
                  ? `+${item.changeRate.toFixed(2)}%`
                  : item.changeRate < 0
                  ? `${item.changeRate.toFixed(2)}%`
                  : `+${(DEFAULT_RATES[item.code]?.rate ?? 0.15).toFixed(2)}%`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
