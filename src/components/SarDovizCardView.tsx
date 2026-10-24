import React from 'react';
import { MarketItem } from '../types/market';
import { CurrencyFlag } from './CurrencyFlag';
import { Calculator, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';

interface SarDovizCardViewProps {
  items: MarketItem[];
  compact?: boolean;
  theme?: 'photo_light' | 'dark_gold';
  decimals?: number;
  onSelectForCalculator?: (item: MarketItem, firmName: string) => void;
  onOpenPriceHistory?: (code: string) => void;
  firmName?: string;
}

// Currency Turkish Display Titles according to SAR Döviz official screen
const SAR_TITLES: Record<string, { symbol: string; title: string }> = {
  USDTRY: { symbol: 'USD', title: 'Amerikan Doları' },
  EURTRY: { symbol: 'EUR', title: 'Euro' },
  SARTRY: { symbol: 'SAR', title: 'Suudi Arabistan Riyali' },
  AUDTRY: { symbol: 'AUD', title: 'Avustralya Doları' },
  JPYTRY: { symbol: 'JPY', title: 'Japon Yeni' },
  GBPTRY: { symbol: 'GBP', title: 'İngiliz Sterlini' },
  CHFTRY: { symbol: 'CHF', title: 'İsviçre Frangı' },
  CADTRY: { symbol: 'CAD', title: 'Kanada Doları' },
  EURUSD: { symbol: 'EUR/USD', title: 'Parite' },
};

export const SarDovizCardView: React.FC<SarDovizCardViewProps> = ({
  items,
  compact = false,
  theme = 'photo_light',
  decimals = 3,
  onSelectForCalculator,
  onOpenPriceHistory,
  firmName = 'SAR Döviz',
}) => {
  const isLight = theme === 'photo_light';

  const formatSarPrice = (val: number) => {
    if (val === undefined || val === null || isNaN(val) || val === 0) return '-';
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];

  return (
    <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 py-1 custom-scrollbar">
      {safeItems.map((item) => {
        const code = String(item?.code || '');
        const meta = SAR_TITLES[code] || {
          symbol: code.replace('TRY', ''),
          title: item?.name || code,
        };

        const isUp = item.direction === 'up';
        const isDown = item.direction === 'down';

        return (
          <div
            key={item.code}
            className={`transition-all duration-200 rounded-xl sm:rounded-2xl border p-2 sm:p-2.5 flex items-center justify-between group shadow-sm ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-slate-200/90 shadow-slate-200/40'
                : 'bg-slate-900/95 hover:bg-slate-850 border-slate-800 shadow-black/20'
            }`}
          >
            {/* Left Flag & Symbol Block (Tek Satır, Açıklama Yok) */}
            <div className="flex items-center space-x-2.5 shrink-0">
              <CurrencyFlag code={meta.symbol} size={28} className="w-7 h-7 shrink-0 rounded-full" />
              <div className="flex items-center space-x-1">
                <span
                  className={`font-black tracking-tight text-sm sm:text-base ${
                    isLight ? 'text-slate-900' : 'text-slate-100'
                  }`}
                >
                  {meta.symbol}
                </span>
                {isUp && <ArrowUp className="w-2.5 h-2.5 text-emerald-500 animate-pulse shrink-0" />}
                {isDown && <ArrowDown className="w-2.5 h-2.5 text-rose-500 animate-pulse shrink-0" />}
              </div>
            </div>

            {/* Price Columns: ALIŞ/BUY & SATIŞ/SELL */}
            <div className="flex items-center space-x-2 sm:space-x-4 shrink-0 text-right ml-1">
              {/* ALIŞ / BUY Column */}
              <div className="flex flex-col items-end">
                <span className="text-[8px] sm:text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  ALIŞ/BUY
                </span>
                <span
                  className={`font-mono font-bold tracking-tight text-xs sm:text-sm tabular-nums whitespace-nowrap ${
                    isUp
                      ? 'text-emerald-600 font-extrabold'
                      : isDown
                      ? 'text-rose-600'
                      : isLight
                      ? 'text-slate-900'
                      : 'text-slate-100'
                  }`}
                >
                  {formatSarPrice(item.buy)}
                </span>
              </div>

              {/* SATIŞ / SELL Column */}
              <div className="flex flex-col items-end">
                <span className="text-[8px] sm:text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  SATIŞ/SELL
                </span>
                <span
                  className={`font-mono font-bold tracking-tight text-xs sm:text-sm tabular-nums whitespace-nowrap ${
                    isDown
                      ? 'text-rose-600 font-extrabold'
                      : isUp
                      ? 'text-emerald-600'
                      : isLight
                      ? 'text-slate-900'
                      : 'text-slate-100'
                  }`}
                >
                  {formatSarPrice(item.sell)}
                </span>
              </div>

              {/* Action buttons (Calculator & History) */}
              <div className="flex flex-col space-y-1 sm:opacity-0 group-hover:opacity-100 transition-opacity pl-0.5">
                {onSelectForCalculator && (
                  <button
                    onClick={() => onSelectForCalculator(item, firmName)}
                    className="p-1 rounded text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Hesaplayıcıya Gönder"
                  >
                    <Calculator className="w-3 h-3" />
                  </button>
                )}
                {onOpenPriceHistory && (
                  <button
                    onClick={() => onOpenPriceHistory(item.code)}
                    className="p-1 rounded text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Fiyat Grafiği"
                  >
                    <TrendingUp className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
