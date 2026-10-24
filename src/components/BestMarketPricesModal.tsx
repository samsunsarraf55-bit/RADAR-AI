import React, { useState, useMemo, useEffect } from 'react';
import { SourcesMap, MarketItem } from '../types/market';
import {
  X,
  Search,
  TrendingUp,
  Coins,
  DollarSign,
  Calculator,
  ArrowRight,
  Sparkles,
  Zap,
  Check,
  Building2,
  Filter,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { CurrencyFlag } from './CurrencyFlag';
import { isFxItem, getCleanCurrencyCode, getStandardizedProductName } from '../utils/productUtils';
import { FirmLogo } from './FirmLogo';

interface BestMarketPricesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: SourcesMap;
  onSelectForCalculator?: (item: MarketItem, firmName: string) => void;
  onFilterProduct?: (code: string) => void;
}

interface ProductPeakInfo {
  code: string;
  name: string;
  category: 'gold' | 'fx';
  bestBuy: number;
  bestBuyFirm: string;
  bestBuyItem?: MarketItem;
  bestSell: number;
  bestSellFirm: string;
  bestSellItem?: MarketItem;
  spread: number;
  spreadPercent: number;
  hasArbitrage: boolean;
  arbitrageProfit: number;
  isFx: boolean;
}

export const BestMarketPricesModal: React.FC<BestMarketPricesModalProps> = ({
  isOpen,
  onClose,
  sources,
  onSelectForCalculator,
  onFilterProduct,
}) => {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'gold' | 'fx'>('all');

  // ESC key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const peakProducts = useMemo<ProductPeakInfo[]>(() => {
    const map = new Map<
      string,
      {
        name: string;
        isFx: boolean;
        category: 'gold' | 'fx';
        buys: { price: number; firm: string; item: MarketItem }[];
        sells: { price: number; firm: string; item: MarketItem }[];
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
            isFx,
            category,
            buys: [],
            sells: [],
          });
        }

        const entry = map.get(code)!;
        if (buy > 0) entry.buys.push({ price: buy, firm: firmName, item });
        if (sell > 0) entry.sells.push({ price: sell, firm: firmName, item });
      });
    });

    const result: ProductPeakInfo[] = [];

    map.forEach((val, code) => {
      let bestBuy = 0;
      let bestBuyFirm = '';
      let bestBuyItem: MarketItem | undefined;

      val.buys.forEach((b) => {
        if (b.price > bestBuy) {
          bestBuy = b.price;
          bestBuyFirm = b.firm;
          bestBuyItem = b.item;
        }
      });

      let bestSell = 9999999;
      let bestSellFirm = '';
      let bestSellItem: MarketItem | undefined;

      val.sells.forEach((s) => {
        if (s.price > 0 && s.price < bestSell) {
          bestSell = s.price;
          bestSellFirm = s.firm;
          bestSellItem = s.item;
        }
      });

      if (bestSell === 9999999) bestSell = 0;

      const spread = bestSell > 0 && bestBuy > 0 ? bestSell - bestBuy : 0;
      const spreadPercent = bestBuy > 0 && spread > 0 ? (spread / bestBuy) * 100 : 0;
      const hasArbitrage = bestBuy > 0 && bestSell > 0 && bestBuy > bestSell && bestBuyFirm !== '' && bestSellFirm !== '' && bestBuyFirm !== bestSellFirm;
      const arbitrageProfit = hasArbitrage ? bestBuy - bestSell : 0;

      result.push({
        code,
        name: val.name,
        category: val.category,
        bestBuy,
        bestBuyFirm,
        bestBuyItem,
        bestSell,
        bestSellFirm,
        bestSellItem,
        spread,
        spreadPercent,
        hasArbitrage,
        arbitrageProfit,
        isFx: val.isFx,
      });
    });

    // Custom order priority
    const priority = ['ALTIN_HAS', 'ALTIN_22', 'CEYREK_YENI', 'TAM_YENI', 'ATA_YENI', 'USDTRY', 'EURTRY', 'GBPTRY'];
    return result.sort((a, b) => {
      const idxA = priority.indexOf(a.code);
      const idxB = priority.indexOf(b.code);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      if (a.hasArbitrage && !b.hasArbitrage) return -1;
      if (!a.hasArbitrage && b.hasArbitrage) return 1;
      return a.name.localeCompare(b.name, 'tr-TR');
    });
  }, [sources]);

  const filtered = useMemo(() => {
    return peakProducts.filter((p) => {
      if (activeTab === 'gold' && p.category !== 'gold') return false;
      if (activeTab === 'fx' && p.category !== 'fx') return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.bestBuyFirm.toLowerCase().includes(q) ||
          p.bestSellFirm.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [peakProducts, activeTab, search]);

  if (!isOpen) return null;

  const formatPrice = (val: number, isFx: boolean) => {
    if (!val || val === 0) return '—';
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: isFx ? 4 : 2,
      maximumFractionDigits: isFx ? 4 : 2,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl transition-all duration-200 ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 sm:p-5 border-b shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold">
                  Piyasa Zirveleri: En Yüksek Alış & En Düşük Satış
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  6 Firma Kıyaslaması
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Tüm ürünler için en iyi bozdurma (en yüksek alış) ve en avantajlı satın alma (en düşük satış) fiyatları ve ilgili firmalar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Kapat (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Category Filters & Search */}
        <div
          className={`p-3 sm:p-4 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="flex items-center space-x-1.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl border transition ${
                activeTab === 'all'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                  : isDark
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
              }`}
            >
              TÜMÜ ({peakProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('gold')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition ${
                activeTab === 'gold'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                  : isDark
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>ALTIN ({peakProducts.filter((p) => p.category === 'gold').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('fx')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition ${
                activeTab === 'fx'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                  : isDark
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>DÖVİZ ({peakProducts.filter((p) => p.category === 'fx').length})</span>
            </button>
          </div>

          <div className="relative min-w-[200px] sm:min-w-[260px]">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Ürün adı veya firma ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full rounded-xl pl-9 pr-7 py-1.5 text-xs font-medium border transition focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                isDark
                  ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
              }`}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Product Peaks List Table */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="space-y-2.5">
            {filtered.map((item) => (
              <div
                key={item.code}
                className={`p-3.5 rounded-xl border transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  item.hasArbitrage
                    ? isDark
                      ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
                      : 'bg-amber-50 border-amber-300 ring-1 ring-amber-400/30'
                    : isDark
                    ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left: Product Name, Circular Flag & Category (Single line, no subtitle) */}
                <div className="flex items-center space-x-3 min-w-[200px]">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      item.category === 'gold'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-sky-500/10 border border-sky-500/20'
                    }`}
                  >
                    {item.category === 'gold' ? (
                      <Coins className="w-4 h-4 text-amber-400" />
                    ) : (
                      <CurrencyFlag
                        code={getCleanCurrencyCode(item.code)}
                        size={22}
                        className="w-[22px] h-[22px] rounded-full"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm truncate">{item.name}</span>
                      {item.hasArbitrage && (
                        <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500 text-slate-950 shrink-0">
                          <Zap className="w-2.5 h-2.5 fill-current" />
                          <span>ARB</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Center: Best Buy and Best Sell Columns */}
                <div className="grid grid-cols-2 gap-3 sm:gap-6 flex-1 max-w-lg">
                  {/* Best Buy */}
                  <div
                    className={`p-2.5 rounded-lg border ${
                      isDark ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-emerald-50 border-emerald-200'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center justify-between">
                      <span>En Yüksek Alış</span>
                      <span className="text-[9px] opacity-80 font-normal">Bozdurma</span>
                    </div>
                    <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatPrice(item.bestBuy, item.isFx)} ₺
                    </div>
                    <div className="flex items-center space-x-1.5 text-xs mt-0.5">
                      <FirmLogo firmName={item.bestBuyFirm} size="xs" />
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300 truncate">
                        {item.bestBuyFirm || '—'}
                      </span>
                    </div>
                  </div>

                  {/* Best Sell */}
                  <div
                    className={`p-2.5 rounded-lg border ${
                      isDark ? 'bg-rose-950/20 border-rose-900/40' : 'bg-rose-50 border-rose-200'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider flex items-center justify-between">
                      <span>En Düşük Satış</span>
                      <span className="text-[9px] opacity-80 font-normal">Satın Alma</span>
                    </div>
                    <div className="text-base font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                      {formatPrice(item.bestSell, item.isFx)} ₺
                    </div>
                    <div className="flex items-center space-x-1.5 text-xs mt-0.5">
                      <FirmLogo firmName={item.bestSellFirm} size="xs" />
                      <span className="font-semibold text-rose-700 dark:text-rose-300 truncate">
                        {item.bestSellFirm || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Spread & Quick Calculator Trigger */}
                <div className="flex items-center justify-between md:justify-end space-x-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/40">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Piyasa Makası</div>
                    <div className="text-xs font-mono font-bold text-slate-300">
                      {item.hasArbitrage ? (
                        <span className="text-amber-400">
                          +{formatPrice(item.arbitrageProfit, item.isFx)} ₺ Kazanç
                        </span>
                      ) : (
                        <span>
                          {formatPrice(item.spread, item.isFx)} ₺ (%{item.spreadPercent.toFixed(2)})
                        </span>
                      )}
                    </div>
                  </div>

                  {onSelectForCalculator && item.bestBuyItem && (
                    <button
                      onClick={() => {
                        onSelectForCalculator(item.bestBuyItem!, item.bestBuyFirm);
                        onClose();
                      }}
                      className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 transition"
                      title="Kuyumcu Masası / Hesaplayıcıya Aktar"
                    >
                      <Calculator className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-xs">
                Aramanıza uygun ürün bulunamadı.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-3 px-5 border-t flex items-center justify-between text-xs shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-950/80 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Canlı Fiyat Verilerinden Otomatik Hesaplanmaktadır</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition"
          >
            Tamam (ESC)
          </button>
        </div>
      </div>
    </div>
  );
};
