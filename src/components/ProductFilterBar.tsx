import React, { useMemo } from 'react';
import { SourcesMap, MarketItem } from '../types/market';
import {
  Search,
  Filter,
  X,
  Coins,
  DollarSign,
  Sparkles,
  TrendingUp,
  Percent,
  Check,
  Building2,
  Layers,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { CurrencyFlag } from './CurrencyFlag';
import { isFxItem, getCleanCurrencyCode, getStandardizedProductName } from '../utils/productUtils';

export interface ProductFilterState {
  searchQuery: string;
  category: 'all' | 'gold' | 'fx' | 'popular' | 'tight_spread';
  selectedCode: string | null;
  selectedFirm: string | null;
}

interface ProductFilterBarProps {
  sources: SourcesMap;
  filterState: ProductFilterState;
  onFilterChange: (next: ProductFilterState) => void;
  className?: string;
}

interface AggregatedProduct {
  code: string;
  name: string;
  category: 'gold' | 'fx';
  bestBuy: number;
  bestSell: number;
  bestBuyFirm: string;
  bestSellFirm: string;
  spread: number;
  spreadPercent: number;
  firmCount: number;
  isPopular: boolean;
}

// Popular commodity codes
const POPULAR_CODES = new Set([
  'ALTIN_HAS',
  'ALTIN_22',
  'CEYREK_YENI',
  'TAM_YENI',
  'ATA_YENI',
  'USDTRY',
  'EURTRY',
  'GBPTRY',
]);

export const ProductFilterBar: React.FC<ProductFilterBarProps> = ({
  sources,
  filterState,
  onFilterChange,
  className = '',
}) => {
  const { isDark } = useTheme();

  // Aggregate all unique products and real live prices across active firms
  const aggregatedProducts = useMemo<AggregatedProduct[]>(() => {
    const map = new Map<
      string,
      {
        name: string;
        category: 'gold' | 'fx';
        buys: { price: number; firm: string }[];
        sells: { price: number; firm: string }[];
      }
    >();

    Object.entries(sources || {}).forEach(([fKey, s]) => {
      if (!s || !Array.isArray(s.data)) return;
      const firmName = s.sourceName || fKey;

      s.data.forEach((item) => {
        if (!item || !item.code || item.code === 'ONS') return;
        const code = item.code.toUpperCase();
        const buy = typeof item.buy === 'number' && !isNaN(item.buy) ? item.buy : 0;
        const sell = typeof item.sell === 'number' && !isNaN(item.sell) ? item.sell : 0;

        const isFx = isFxItem(code);
        const category: 'gold' | 'fx' = isFx ? 'fx' : 'gold';

        if (!map.has(code)) {
          map.set(code, {
            name: getStandardizedProductName(code, item.name || code),
            category,
            buys: [],
            sells: [],
          });
        }

        const entry = map.get(code)!;
        if (buy > 0) entry.buys.push({ price: buy, firm: firmName });
        if (sell > 0) entry.sells.push({ price: sell, firm: firmName });
      });
    });

    const result: AggregatedProduct[] = [];
    map.forEach((data, code) => {
      let bestBuy = 0;
      let bestBuyFirm = '';
      data.buys.forEach((b) => {
        if (b.price > bestBuy) {
          bestBuy = b.price;
          bestBuyFirm = b.firm;
        }
      });

      let bestSell = 9999999;
      let bestSellFirm = '';
      data.sells.forEach((s) => {
        if (s.price > 0 && s.price < bestSell) {
          bestSell = s.price;
          bestSellFirm = s.firm;
        }
      });
      if (bestSell === 9999999) bestSell = 0;

      const spread = bestSell > 0 && bestBuy > 0 ? Math.max(0, bestSell - bestBuy) : 0;
      const spreadPercent =
        bestBuy > 0 && spread > 0 ? (spread / bestBuy) * 100 : 0;

      const firmCount = Math.max(data.buys.length, data.sells.length);

      result.push({
        code,
        name: data.name,
        category: data.category,
        bestBuy,
        bestSell,
        bestBuyFirm,
        bestSellFirm,
        spread,
        spreadPercent,
        firmCount,
        isPopular: POPULAR_CODES.has(code),
      });
    });

    // Sort: popular first, then by firmCount desc, then by name
    return result.sort((a, b) => {
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      return b.firmCount - a.firmCount;
    });
  }, [sources]);

  // Counts for tabs
  const counts = useMemo(() => {
    let goldCount = 0;
    let fxCount = 0;
    let popularCount = 0;
    let tightSpreadCount = 0;

    aggregatedProducts.forEach((p) => {
      if (p.category === 'gold') goldCount++;
      if (p.category === 'fx') fxCount++;
      if (p.isPopular) popularCount++;
      if (p.spreadPercent > 0 && p.spreadPercent <= 1.2) tightSpreadCount++;
    });

    return {
      all: aggregatedProducts.length,
      gold: goldCount,
      fx: fxCount,
      popular: popularCount,
      tightSpread: tightSpreadCount,
    };
  }, [aggregatedProducts]);

  // Products filtered by current category to show as quick-chips
  const visibleProductsForChips = useMemo(() => {
    return aggregatedProducts.filter((p) => {
      if (filterState.category === 'gold') return p.category === 'gold';
      if (filterState.category === 'fx') return p.category === 'fx';
      if (filterState.category === 'popular') return p.isPopular;
      if (filterState.category === 'tight_spread') return p.spreadPercent > 0 && p.spreadPercent <= 1.2;
      return true;
    });
  }, [aggregatedProducts, filterState.category]);

  const hasActiveFilter =
    filterState.searchQuery.trim() !== '' ||
    filterState.category !== 'all' ||
    filterState.selectedCode !== null ||
    filterState.selectedFirm !== null;

  const handleResetFilters = () => {
    onFilterChange({
      searchQuery: '',
      category: 'all',
      selectedCode: null,
      selectedFirm: null,
    });
  };

  const formatPrice = (val: number, code: string) => {
    if (!val || val === 0) return '-';
    const isFx = code.includes('TRY') && !code.startsWith('ALTIN') && !code.startsWith('CEYREK');
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: isFx ? 4 : 2,
      maximumFractionDigits: isFx ? 4 : 2,
    }).format(val);
  };

  return (
    <div
      className={`rounded-2xl border p-4 space-y-3.5 transition-colors duration-200 shadow-sm ${
        isDark
          ? 'bg-slate-950/80 border-slate-800'
          : 'bg-white border-slate-200 shadow-slate-100'
      } ${className}`}
    >
      {/* Row 1: Search Input & Category Pills & Clear Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search
            className={`w-4 h-4 absolute left-3.5 top-2.5 transition-colors ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          />
          <input
            type="text"
            placeholder="Ürün adı, kur kodu veya firma ara (örn: Has, Çeyrek, USD)..."
            value={filterState.searchQuery}
            onChange={(e) =>
              onFilterChange({
                ...filterState,
                searchQuery: e.target.value,
              })
            }
            className={`w-full rounded-xl pl-10 pr-9 py-2 text-xs font-medium border transition focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus:border-amber-500/60'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500'
            }`}
          />
          {filterState.searchQuery && (
            <button
              type="button"
              onClick={() =>
                onFilterChange({
                  ...filterState,
                  searchQuery: '',
                })
              }
              className="absolute right-2.5 top-2.5 p-0.5 rounded-md text-slate-400 hover:text-slate-200 transition"
              title="Aramayı Temizle"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Center / Right: Category Filter Pills */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs font-semibold">
          {[
            {
              id: 'all',
              label: 'TÜMÜ',
              count: counts.all,
              icon: null,
            },
            {
              id: 'gold',
              label: 'ALTIN',
              count: counts.gold,
              icon: <Coins className="w-3.5 h-3.5 text-amber-500" />,
            },
            {
              id: 'fx',
              label: 'DÖVİZ',
              count: counts.fx,
              icon: <DollarSign className="w-3.5 h-3.5 text-sky-500" />,
            },
            {
              id: 'popular',
              label: 'Sık Takip Edilenler',
              count: counts.popular,
              icon: <Sparkles className="w-3.5 h-3.5 text-emerald-500" />,
            },
            {
              id: 'tight_spread',
              label: 'En Dar Makas',
              count: counts.tightSpread,
              icon: <Percent className="w-3.5 h-3.5 text-indigo-500" />,
            },
          ].map((cat) => {
            const isActive = filterState.category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  onFilterChange({
                    ...filterState,
                    category: cat.id as any,
                    selectedCode: null, // Reset specific code when category flips
                  })
                }
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition text-xs ${
                  isActive
                    ? isDark
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-amber-100 text-amber-900 border-amber-400 shadow-sm font-bold'
                    : isDark
                    ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    isActive
                      ? isDark
                        ? 'bg-amber-500/30 text-amber-200'
                        : 'bg-amber-200/80 text-amber-900'
                      : isDark
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}

          {/* Reset Filters Action */}
          {hasActiveFilter && (
            <button
              type="button"
              onClick={handleResetFilters}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
                isDark
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
              title="Tüm Filtreleri Temizle"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Temizle</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Live Product Chips with Best Prices */}
      <div className="pt-2 border-t border-slate-800/40 dark:border-slate-800/60 flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center space-x-1">
          <Filter className="w-3 h-3 text-amber-500" />
          <span>Hızlı Ürün Seçimi:</span>
        </span>

        {/* All / Clear Chip */}
        <button
          type="button"
          onClick={() =>
            onFilterChange({
              ...filterState,
              selectedCode: null,
            })
          }
          className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
            filterState.selectedCode === null
              ? isDark
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-amber-200/90 text-amber-950 border-amber-400 font-bold'
              : isDark
              ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
        >
          Hepsi ({visibleProductsForChips.length})
        </button>

        {visibleProductsForChips.map((prod) => {
          const isSelected = filterState.selectedCode === prod.code;
          return (
            <button
              key={prod.code}
              type="button"
              onClick={() =>
                onFilterChange({
                  ...filterState,
                  selectedCode: isSelected ? null : prod.code,
                })
              }
              className={`shrink-0 flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                isSelected
                  ? isDark
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                    : 'bg-amber-500 text-white border-amber-600 font-bold shadow-sm'
                  : isDark
                  ? 'bg-slate-900/90 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-white'
              }`}
            >
              {isFxItem(prod.code) && (
                <CurrencyFlag
                  code={getCleanCurrencyCode(prod.code)}
                  size={15}
                  className="w-[15px] h-[15px] shrink-0"
                />
              )}
              <span>{prod.name}</span>
              {prod.bestBuy > 0 && (
                <span
                  className={`font-mono text-[10px] px-1 rounded ${
                    isSelected
                      ? 'bg-slate-950/20 text-white font-bold'
                      : isDark
                      ? 'bg-slate-950 text-emerald-400'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {formatPrice(prod.bestBuy, prod.code)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
