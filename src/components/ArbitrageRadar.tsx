import React, { useState, useMemo } from 'react';
import { SourcesMap, ArbitrageOpportunity, MarketItem } from '../types/market';
import { DEFAULT_FIRM_ORDER } from '../types/sort';
import { useTheme } from '../context/ThemeContext';
import {
  Compass,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
  ShieldCheck,
  Percent,
  Search,
  X,
  Coins,
  DollarSign,
  ArrowUpDown,
  Calculator,
  Zap,
  TrendingUp,
  Building2,
  CheckCircle2,
  Filter,
  RotateCcw,
  Layers,
  Volume2,
  BellRing,
  Bell,
  History,
} from 'lucide-react';
import {
  playArbitrageSound,
  sendDesktopArbitrageNotification,
  requestDesktopNotificationPermission,
  ArbitrageDeal,
} from '../services/arbitrageAlertService';
import { CurrencyFlag } from './CurrencyFlag';
import { isFxItem, getCleanCurrencyCode, getStandardizedProductName } from '../utils/productUtils';
import { ArbitrageHistoryModal } from './ArbitrageHistoryModal';
import { FirmLogo } from './FirmLogo';

interface ArbitrageRadarProps {
  sources: SourcesMap;
  onOpenAdvisorWithTopic?: (topic: string) => void;
  onSelectForCalculator?: (item: MarketItem, firmName: string) => void;
  onTestAlert?: () => void;
}

export type RadarCategoryFilter = 'all' | 'gold' | 'fx';

export type RadarOpportunityFilter =
  | 'all'
  | 'arbitrage_only'
  | 'tight_spread'
  | 'medium_spread'
  | 'wide_spread';

const FIRM_BRAND_STYLES: Record<string, { label: string; badge: string; color: string; border: string; bg: string }> = {
  gunes_kuyumculuk: {
    label: 'Güneş',
    badge: 'GÜNEŞ',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
  },
  kaptan_doviz: {
    label: 'Kaptan',
    badge: 'KAPTAN',
    color: 'text-sky-400',
    border: 'border-sky-500/30',
    bg: 'bg-sky-500/10',
  },
  solis_doviz: {
    label: 'Solis',
    badge: 'SOLİS',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
  },
  sar_doviz: {
    label: 'SAR Döviz',
    badge: 'SAR DÖVİZ',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
  },
  altinkose: {
    label: 'Altınköşe',
    badge: 'ALTINKÖŞE',
    color: 'text-yellow-400',
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/10',
  },
  ilkay_doviz: {
    label: 'İlkay',
    badge: 'İLKAY',
    color: 'text-indigo-400',
    border: 'border-indigo-500/30',
    bg: 'bg-indigo-500/10',
  },
  vizyon_altin: {
    label: 'Vizyon',
    badge: 'VİZYON',
    color: 'text-purple-400',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
  },
};

// Check asset classification
function classifyRadarProduct(code: string): {
  subCategory: 'gold_has' | 'gold_sarrafiye' | 'fx';
  badge: string;
  badgeStyle: string;
  isParite: boolean;
  isFx: boolean;
  unit: string;
} {
  const upper = String(code || '').toUpperCase();

  // EUR/USD Parite
  if (upper === 'EURUSD' || upper === 'EUR_USD') {
    return {
      subCategory: 'fx',
      badge: 'PARİTE',
      badgeStyle: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      isParite: true,
      isFx: true,
      unit: '',
    };
  }

  // Pure gold sarrafiye & ziynet (Çeyrek, Yarım, Tam, Ata, 22 Ayar vb.)
  if (
    upper.includes('CEYREK') ||
    upper.includes('YARIM') ||
    upper.includes('TAM') ||
    upper.includes('ATA') ||
    upper.includes('GREMSE') ||
    upper.includes('22') ||
    upper.includes('14') ||
    upper.includes('BILEZIK')
  ) {
    return {
      subCategory: 'gold_sarrafiye',
      badge: 'SARRAFİYE',
      badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      isParite: false,
      isFx: false,
      unit: '₺',
    };
  }

  // Has Altın / Külçe / Ons / Gümüş
  if (
    upper.includes('HAS') ||
    upper.includes('ONS') ||
    upper.includes('GUMUS') ||
    upper.startsWith('ALTIN')
  ) {
    return {
      subCategory: 'gold_has',
      badge: upper.includes('ONS') ? 'ONS ($)' : upper.includes('GUMUS') ? 'GÜMÜŞ' : '24K HAS',
      badgeStyle: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      isParite: false,
      isFx: false,
      unit: upper.includes('ONS') ? '$' : '₺',
    };
  }

  // All foreign currencies: USD/TRY, EUR/TRY, GBP/TRY, CHF/TRY, CAD/TRY, AUD/TRY, SAR/TRY, JPY/TRY etc.
  return {
    subCategory: 'fx',
    badge: 'DÖVİZ',
    badgeStyle: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    isParite: false,
    isFx: true,
    unit: '₺',
  };
}

export const ArbitrageRadar: React.FC<ArbitrageRadarProps> = ({
  sources,
  onOpenAdvisorWithTopic,
  onSelectForCalculator,
  onTestAlert,
}) => {
  const { isDark } = useTheme();
  const [testFeedback, setTestFeedback] = useState<string | null>(null);
  // All 6 firms strictly ordered
  const allFirmKeys = useMemo(() => {
    return Object.keys(sources)
      .filter((k) => k !== 'sar_altin')
      .sort((a, b) => {
        const idxA = DEFAULT_FIRM_ORDER.indexOf(a);
        const idxB = DEFAULT_FIRM_ORDER.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
      });
  }, [sources]);

  // Filtering States
  const [filterCategory, setFilterCategory] = useState<RadarCategoryFilter>('all');
  const [opportunityFilter, setOpportunityFilter] = useState<RadarOpportunityFilter>('all');
  const [selectedFirmKeys, setSelectedFirmKeys] = useState<string[]>(allFirmKeys);
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState<'profit_desc' | 'spread_asc' | 'buy_desc' | 'sell_asc' | 'name_asc'>('profit_desc');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Sync selectedFirmKeys
  React.useEffect(() => {
    if (selectedFirmKeys.length === 0 && allFirmKeys.length > 0) {
      setSelectedFirmKeys(allFirmKeys);
    }
  }, [allFirmKeys]);

  const toggleFirmFilter = (key: string) => {
    if (selectedFirmKeys.includes(key)) {
      if (selectedFirmKeys.length <= 2) return; // Keep at least 2 firms for arbitrage comparison
      setSelectedFirmKeys(selectedFirmKeys.filter((k) => k !== key));
    } else {
      setSelectedFirmKeys([...selectedFirmKeys, key]);
    }
  };

  const selectAllFirms = () => setSelectedFirmKeys(allFirmKeys);

  const hasActiveFilters =
    filterCategory !== 'all' ||
    opportunityFilter !== 'all' ||
    selectedFirmKeys.length !== allFirmKeys.length ||
    search.trim() !== '';

  const resetAllFilters = () => {
    setFilterCategory('all');
    setOpportunityFilter('all');
    setSelectedFirmKeys(allFirmKeys);
    setSearch('');
  };

  const formatPrice = (val: number, isFx: boolean) => {
    if (!val) return '—';
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: isFx ? 4 : 2,
      maximumFractionDigits: isFx ? 4 : 2,
    }).format(val);
  };

  // Compile list of unique products for Arbitrage Radar:
  // INCLUDES All Has Altın, Sarrafiye, AND All Foreign Currency Units (USD, EUR, GBP, CHF, CAD, AUD, SAR, Parite)
  const productCodes = useMemo(() => {
    const set = new Set<string>();
    Object.entries(sources || {}).forEach(([key, source]) => {
      if (key === 'sar_altin' || !source || !Array.isArray(source.data)) return;
      source.data.forEach((item) => {
        if (item?.code && item.code !== 'ONS') set.add(item.code);
      });
    });
    return Array.from(set);
  }, [sources]);

  interface ExtendedOpportunity extends ArbitrageOpportunity {
    subCategory: 'gold_has' | 'gold_sarrafiye' | 'fx';
    badge: string;
    badgeStyle: string;
    isParite: boolean;
    isFx: boolean;
    unit: string;
    bestBuyItem?: MarketItem;
    bestSellItem?: MarketItem;
    allBuys: { sourceKey: string; sourceName: string; price: number }[];
    allSells: { sourceKey: string; sourceName: string; price: number }[];
  }

  // Calculate opportunities across selected firms
  const opportunities = useMemo(() => {
    const list: ExtendedOpportunity[] = [];

    productCodes.forEach((code) => {
      let bestBuySource: { sourceKey: string; sourceName: string; price: number } | null = null;
      let bestSellSource: { sourceKey: string; sourceName: string; price: number } | null = null;
      let bestBuyItem: MarketItem | undefined;
      let bestSellItem: MarketItem | undefined;
      let productName = '';
      const allBuys: { sourceKey: string; sourceName: string; price: number }[] = [];
      const allSells: { sourceKey: string; sourceName: string; price: number }[] = [];

      selectedFirmKeys.forEach((key) => {
        const source = sources?.[key];
        if (!source || !Array.isArray(source.data)) return;
        const item = source.data.find((d) => d && d.code === code);
        if (item) {
          if (!productName && item.name) productName = item.name;
          const b = typeof item.buy === 'number' && !isNaN(item.buy) ? item.buy : 0;
          const s = typeof item.sell === 'number' && !isNaN(item.sell) ? item.sell : 0;

          if (b > 0) {
            allBuys.push({ sourceKey: key, sourceName: source.sourceName || key, price: b });
            if (!bestBuySource || b > bestBuySource.price) {
              bestBuySource = {
                sourceKey: key,
                sourceName: source.sourceName || key,
                price: b,
              };
              bestBuyItem = item;
            }
          }

          if (s > 0) {
            allSells.push({ sourceKey: key, sourceName: source.sourceName || key, price: s });
            if (!bestSellSource || s < bestSellSource.price) {
              bestSellSource = {
                sourceKey: key,
                sourceName: source.sourceName || key,
                price: s,
              };
              bestSellItem = item;
            }
          }
        }
      });

      if (bestBuySource && bestSellSource && (bestBuySource as any).price > 0 && (bestSellSource as any).price > 0) {
        const spread = (bestSellSource as any).price - (bestBuySource as any).price;
        const spreadPercent = ((spread / (bestBuySource as any).price) * 100);
        const arbitrageProfit = (bestBuySource as any).price - (bestSellSource as any).price;

        const classification = classifyRadarProduct(code);

        list.push({
          code,
          name: getStandardizedProductName(code, productName || code),
          subCategory: classification.subCategory,
          badge: classification.badge,
          badgeStyle: classification.badgeStyle,
          isParite: classification.isParite,
          isFx: classification.isFx,
          unit: classification.unit,
          bestBuySource,
          bestSellSource,
          bestBuyItem,
          bestSellItem,
          spread,
          spreadPercent,
          arbitrageProfit,
          hasArbitrage: arbitrageProfit > 0 && (bestBuySource as any).sourceKey !== (bestSellSource as any).sourceKey,
          allBuys,
          allSells,
        });
      }
    });

    return list;
  }, [productCodes, selectedFirmKeys, sources]);

  // Overall Statistics for KPI cards
  const totalArbitrageCount = useMemo(() => {
    return opportunities.filter((o) => o.hasArbitrage).length;
  }, [opportunities]);

  const tightestSpreadItem = useMemo(() => {
    const positiveSpreads = opportunities.filter((o) => o.spreadPercent > 0);
    if (positiveSpreads.length > 0) {
      return [...positiveSpreads].sort((a, b) => a.spreadPercent - b.spreadPercent)[0];
    }
    return opportunities[0] || null;
  }, [opportunities]);

  // Category Counts
  const categoryCounts = useMemo(() => {
    return {
      all: opportunities.length,
      gold: opportunities.filter((o) => o.subCategory === 'gold_has' || o.subCategory === 'gold_sarrafiye').length,
      fx: opportunities.filter((o) => o.subCategory === 'fx').length,
    };
  }, [opportunities]);

  // Filter opportunities
  const filtered = useMemo(() => {
    return opportunities.filter((op) => {
      // 1. Category Filter: TÜMÜ, ALTIN, DÖVİZ
      if (filterCategory === 'gold' && op.subCategory !== 'gold_has' && op.subCategory !== 'gold_sarrafiye') return false;
      if (filterCategory === 'fx' && op.subCategory !== 'fx') return false;

      // 2. Opportunity / Spread Filter
      if (opportunityFilter === 'arbitrage_only' && !op.hasArbitrage) return false;
      if (opportunityFilter === 'tight_spread' && (op.hasArbitrage || op.spreadPercent > 0.4)) return false;
      if (opportunityFilter === 'medium_spread' && (op.spreadPercent <= 0.4 || op.spreadPercent > 1.0)) return false;
      if (opportunityFilter === 'wide_spread' && op.spreadPercent <= 1.0) return false;

      // 3. Search Filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = String(op?.name || '').toLowerCase().includes(q);
        const matchesCode = String(op?.code || '').toLowerCase().includes(q);
        const matchesBuyFirm = String(op?.bestBuySource?.sourceName || '').toLowerCase().includes(q);
        const matchesSellFirm = String(op?.bestSellSource?.sourceName || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesBuyFirm && !matchesSellFirm) return false;
      }

      return true;
    });
  }, [opportunities, filterCategory, opportunityFilter, search]);

  // Sort filtered opportunities
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortOption === 'profit_desc') {
        // First items with positive arbitrage, highest profit first
        if (a.hasArbitrage && !b.hasArbitrage) return -1;
        if (!a.hasArbitrage && b.hasArbitrage) return 1;
        return b.arbitrageProfit - a.arbitrageProfit;
      }
      if (sortOption === 'spread_asc') {
        return a.spreadPercent - b.spreadPercent;
      }
      if (sortOption === 'buy_desc') {
        return (b.bestBuySource as any).price - (a.bestBuySource as any).price;
      }
      if (sortOption === 'sell_asc') {
        return (a.bestSellSource as any).price - (b.bestSellSource as any).price;
      }
      if (sortOption === 'name_asc') {
        return a.name.localeCompare(b.name, 'tr-TR');
      }
      return b.arbitrageProfit - a.arbitrageProfit;
    });
  }, [filtered, sortOption]);

  return (
    <div className="space-y-4">
      {/* 4 Summary KPI Cards (Hero banner removed per request) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`border rounded-xl p-3 transition ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="text-[10px] text-slate-400 font-semibold flex items-center space-x-1">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>Aktif Arbitraj Fırsatı</span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold font-mono mt-1">
            {totalArbitrageCount > 0 ? (
              <span className="text-amber-500 font-bold">{totalArbitrageCount} Aktif Fırsat</span>
            ) : (
              <span className={isDark ? 'text-slate-300 text-sm' : 'text-slate-600 text-sm'}>Dar Makas Dengesi</span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Firmalar arası ters makas
          </div>
        </div>

        <div className={`border rounded-xl p-3 transition ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="text-[10px] text-slate-400 font-semibold flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>En Dar Makas (Likit)</span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-emerald-500 font-mono mt-1 truncate">
            {tightestSpreadItem && isFinite(tightestSpreadItem.spreadPercent)
              ? `%${Math.abs(tightestSpreadItem.spreadPercent).toFixed(2)}`
              : '%0.15'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            {tightestSpreadItem?.name || 'Tüm Kurlar'}
          </div>
        </div>

        <div className={`border rounded-xl p-3 transition ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="text-[10px] text-slate-400 font-semibold flex items-center space-x-1">
            <TrendingUp className="w-3 h-3 text-sky-500" />
            <span>Taranan Varlıklar</span>
          </div>
          <div className={`text-lg sm:text-xl font-extrabold font-mono mt-1 ${isDark ? 'text-sky-300' : 'text-sky-600'}`}>
            {opportunities.length} Varlık
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Altın, Sarrafiye & Tüm Dövizler
          </div>
        </div>

        <div className={`border rounded-xl p-3 transition ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="text-[10px] text-slate-400 font-semibold flex items-center space-x-1">
            <Building2 className="w-3 h-3 text-amber-500" />
            <span>Takip Edilen Firmalar</span>
          </div>
          <div className={`text-lg sm:text-xl font-extrabold font-mono mt-1 ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
            {selectedFirmKeys.length} / {allFirmKeys.length} Firma
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            Güneş · Kaptan · İlkay · SAR · Altınköşe · Vizyon
          </div>
        </div>
      </div>

      {/* Arbitraj Sesli ve Bilgisayar Bildirimi Barı */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
            <BellRing className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-amber-400 flex items-center space-x-1.5">
              <span>Canlı Arbitraj Bildirim Sistemi Aktif</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="text-[10px] text-slate-300">
              Piyasada ters makas veya arbitraj fırsatı doğduğunda anında melodik ses ve bilgisayarınıza masaüstü bildirimi gönderilir.
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {testFeedback && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-amber-400 border border-amber-500/30 animate-pulse">
              {testFeedback}
            </span>
          )}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 font-bold transition flex items-center space-x-1.5 shadow-md text-xs cursor-pointer"
            title="Arbitraj geçmiş kayıtlarını ve arşivini aç"
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>Arbitraj Geçmiş Kayıtları</span>
          </button>
          <button
            onClick={async () => {
              if (onTestAlert) {
                onTestAlert();
                setTestFeedback('🔔 Test Bildirimi Tetiklendi!');
                setTimeout(() => setTestFeedback(null), 4000);
                return;
              }
              playArbitrageSound();
              const sample: ArbitrageDeal = {
                code: 'ALTIN_HAS',
                name: 'Has 24 Ayar Gram Altın',
                buyFirmKey: 'kaptan_doviz',
                buyFirmName: 'Kaptan Altın & Döviz',
                buyPrice: 6511.2,
                sellFirmKey: 'gunes_kuyumculuk',
                sellFirmName: 'Güneş Kuyumculuk',
                sellPrice: 6551.5,
                profit: 40.3,
                profitPercent: 0.62,
              };
              if ('Notification' in window) {
                if (Notification.permission === 'granted') {
                  const res = sendDesktopArbitrageNotification(sample, true);
                  setTestFeedback(res.success ? '🔔 Masaüstü Bildirimi Gönderildi!' : `⚠️ ${res.message}`);
                } else {
                  const g = await requestDesktopNotificationPermission();
                  if (g && g.granted) {
                    const res = sendDesktopArbitrageNotification(sample, true);
                    setTestFeedback(res.success ? '🔔 İzin Verildi ve Bildirim Gönderildi!' : `⚠️ ${res.message}`);
                  } else {
                    setTestFeedback(`⚠️ ${g.message}`);
                  }
                }
              } else {
                setTestFeedback('🔔 Ses Çalındı (Tarayıcıda masaüstü bildirim desteği yok)');
              }
              setTimeout(() => setTestFeedback(null), 4000);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center space-x-1.5 shadow-md text-xs cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Bildirimi Test Et (Ses + Masaüstü)</span>
          </button>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-4">
        
        {/* Row 1: Category Filter Buttons */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Categories Menu: Tümü, 24K Has Altın, Ziynet & Sarrafiye, Tüm Döviz Birimleri */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Menü:</span>
            </span>

            {/* TÜMÜ */}
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                filterCategory === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                  : isDark
                  ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              TÜMÜ
            </button>

            {/* ALTIN */}
            <button
              onClick={() => setFilterCategory('gold')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm ${
                filterCategory === 'gold'
                  ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                  : isDark
                  ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>ALTIN</span>
            </button>

            {/* DÖVİZ */}
            <button
              onClick={() => setFilterCategory('fx')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm ${
                filterCategory === 'fx'
                  ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                  : isDark
                  ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>DÖVİZ</span>
            </button>
          </div>

          {/* Right Controls: Filters Toggle, Sort & Search */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Filter Panel Toggle */}
            <button
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center space-x-1.5 ${
                isFilterPanelOpen || (selectedFirmKeys.length !== allFirmKeys.length || opportunityFilter !== 'all')
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Firma seçimi ve fırsat filtrelerini aç/kapat"
            >
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>Filtreler</span>
              {(selectedFirmKeys.length !== allFirmKeys.length || opportunityFilter !== 'all') && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              )}
            </button>

            {/* Sort Menu */}
            <div className="flex items-center space-x-1.5 bg-slate-950/90 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer text-xs"
              >
                <option value="profit_desc" className="bg-slate-900 text-slate-100">
                  En Yüksek Arbitraj Getirisi
                </option>
                <option value="spread_asc" className="bg-slate-900 text-slate-100">
                  En Dar Makas % (Likit)
                </option>
                <option value="buy_desc" className="bg-slate-900 text-slate-100">
                  En Yüksek Alış (Bozdurma)
                </option>
                <option value="sell_asc" className="bg-slate-900 text-slate-100">
                  En Düşük Satış (Satın Alma)
                </option>
                <option value="name_asc" className="bg-slate-900 text-slate-100">
                  Varlık Adı (A - Z)
                </option>
              </select>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-44 lg:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Varlık, sarrafiye veya döviz ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl pl-9 pr-7 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Row 2: Secondary Expandable Filter Panel (Firma Seçimi & Fırsat Tipi) */}
        {isFilterPanelOpen && (
          <div className="pt-3 border-t border-slate-800/80 space-y-3 animate-fadeIn">
            
            {/* Firm Selection */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/70">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5 mr-1">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kıyaslanan Firmalar:</span>
                </span>

                {allFirmKeys.map((key) => {
                  const s = sources[key];
                  const isSelected = selectedFirmKeys.includes(key);
                  const style = FIRM_BRAND_STYLES[key] || {
                    label: s?.sourceName || key,
                    badge: key.toUpperCase(),
                    color: 'text-amber-400',
                    border: 'border-slate-700',
                    bg: 'bg-slate-800/50',
                  };

                  return (
                    <button
                      key={key}
                      onClick={() => toggleFirmFilter(key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition flex items-center space-x-1.5 ${
                        isSelected
                          ? `${style.bg} ${style.border} ${style.color} ring-1 ring-amber-500/20`
                          : 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60 hover:opacity-100'
                      }`}
                      title={isSelected ? `${style.label} gizle` : `${style.label} dahil et`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isSelected ? 'bg-emerald-400' : 'bg-slate-600'
                        }`}
                      ></span>
                      <FirmLogo firmKey={key} firmName={style.label} size="xs" />
                      <span>{style.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={selectAllFirms}
                  className="text-[11px] text-amber-400 hover:text-amber-300 underline font-semibold transition"
                >
                  Tüm Firmaları Seç ({allFirmKeys.length})
                </button>
              </div>
            </div>

            {/* Opportunity Filter Chips */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold mr-1">Fırsat Türü:</span>
                
                <button
                  onClick={() => setOpportunityFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    opportunityFilter === 'all'
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tüm Varlıklar
                </button>

                <button
                  onClick={() => setOpportunityFilter('arbitrage_only')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                    opportunityFilter === 'arbitrage_only'
                      ? 'bg-amber-500/25 text-amber-300 font-bold border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Sadece Arbitraj Fırsatları (Ters Makas)</span>
                </button>

                <button
                  onClick={() => setOpportunityFilter('tight_spread')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                    opportunityFilter === 'tight_spread'
                      ? 'bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dar Makas (&le; %0.4)</span>
                </button>

                <button
                  onClick={() => setOpportunityFilter('medium_spread')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    opportunityFilter === 'medium_spread'
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Normal Makas (%0.4 - %1.0)
                </button>
              </div>

              {/* Reset Filters */}
              {hasActiveFilters && (
                <button
                  onClick={resetAllFilters}
                  className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300 font-semibold transition py-1 px-2 rounded-lg hover:bg-rose-950/30"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Filtreleri Sıfırla</span>
                </button>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            
            <thead className="bg-slate-900/95 sticky top-0 z-20 backdrop-blur-md border-b-2 border-slate-800 text-slate-300 font-bold uppercase text-[11px]">
              <tr>
                <th className="py-3.5 px-4 min-w-[200px]">Ürün / Varlık</th>
                
                <th className="py-3.5 px-4 min-w-[210px] text-emerald-400">
                  <div className="flex items-center space-x-1.5">
                    <ArrowUpRight className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                    <span>En Yüksek Alış (Bozdurma Yeri)</span>
                  </div>
                </th>

                <th className="py-3.5 px-4 min-w-[210px] text-rose-400">
                  <div className="flex items-center space-x-1.5">
                    <TrendingDown className="w-4 h-4 text-rose-400 stroke-[2.5]" />
                    <span>En Düşük Satış (Satın Alma Yeri)</span>
                  </div>
                </th>

                <th className="py-3.5 px-4 text-right min-w-[150px] text-slate-200">
                  Piyasa İçi Net Makas
                </th>

                <th className="py-3.5 px-4 text-center min-w-[180px] text-amber-400">
                  Fırsat / Likidite Durumu
                </th>

                <th className="py-3.5 px-3 text-center min-w-[80px]">
                  İşlem
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/50">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Filter className="w-8 h-8 text-slate-600" />
                      <span className="text-sm font-semibold text-slate-300">
                        Seçilen filtrelere uygun arbitraj fırsatı veya varlık bulunamadı.
                      </span>
                      <p className="text-xs text-slate-500 max-w-sm">
                        Filtre tercihlerinizi genişleterek veya arama terimini temizleyerek sarrafiye, altın ve döviz fırsatlarını görüntüleyebilirsiniz.
                      </p>
                      <button
                        onClick={resetAllFilters}
                        className="mt-2 px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition"
                      >
                        Tüm Filtreleri Temizle
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                sorted.map((op, rowIdx) => {
                  const isEven = rowIdx % 2 === 0;

                  const buyStyle = FIRM_BRAND_STYLES[op.bestBuySource.sourceKey] || {
                    label: op.bestBuySource.sourceName,
                    badge: op.bestBuySource.sourceName.toUpperCase(),
                    color: 'text-emerald-400',
                    border: 'border-emerald-500/30',
                    bg: 'bg-emerald-500/10',
                  };

                  const sellStyle = FIRM_BRAND_STYLES[op.bestSellSource.sourceKey] || {
                    label: op.bestSellSource.sourceName,
                    badge: op.bestSellSource.sourceName.toUpperCase(),
                    color: 'text-rose-400',
                    border: 'border-rose-500/30',
                    bg: 'bg-rose-500/10',
                  };

                  return (
                    <tr
                      key={op.code}
                      className={`transition-colors group ${
                        isEven ? 'bg-slate-950' : 'bg-slate-900/30'
                      } hover:bg-slate-900/80`}
                    >
                      
                      {/* Ürün Adı & Kategori Rozeti */}
                      {/* Ürün Adı, Bayrak & Kategori Rozeti */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 min-w-0">
                          {isFxItem(op.code) && (
                            <CurrencyFlag
                              code={getCleanCurrencyCode(op.code)}
                              size={18}
                              className="w-[18px] h-[18px]"
                            />
                          )}
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase shrink-0 ${op.badgeStyle}`}
                          >
                            {op.badge}
                          </span>
                          <span className="font-extrabold text-white text-xs sm:text-sm group-hover:text-amber-300 transition-colors">
                            {op.name}
                          </span>
                        </div>
                      </td>

                      {/* En Yüksek Alış (Nerede Bozdurmalı?) */}
                      <td className="py-3.5 px-4">
                        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5 max-w-xs transition-all hover:border-emerald-500/60">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${buyStyle.bg} ${buyStyle.border} ${buyStyle.color} inline-flex items-center space-x-1`}
                            >
                              <FirmLogo firmKey={op.bestBuySource.sourceKey} firmName={op.bestBuySource.sourceName} size="xs" />
                              <span>{op.bestBuySource.sourceName}</span>
                            </span>
                            <span className="text-[10px] text-emerald-400 font-bold">
                              En Yüksek Alış
                            </span>
                          </div>

                          <div className="text-base sm:text-lg font-extrabold font-mono text-emerald-300 tabular-nums">
                            {formatPrice(op.bestBuySource.price, op.isFx)}{' '}
                            {op.unit && <span className="text-xs font-normal text-emerald-400/80">{op.unit}</span>}
                          </div>

                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 inline shrink-0" />
                            <span>Bu firmaya bozdurun</span>
                          </div>
                        </div>
                      </td>

                      {/* En Düşük Satış (Nereden Satın Almalı?) */}
                      <td className="py-3.5 px-4">
                        <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-2.5 max-w-xs transition-all hover:border-rose-500/60">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${sellStyle.bg} ${sellStyle.border} ${sellStyle.color} inline-flex items-center space-x-1`}
                            >
                              <FirmLogo firmKey={op.bestSellSource.sourceKey} firmName={op.bestSellSource.sourceName} size="xs" />
                              <span>{op.bestSellSource.sourceName}</span>
                            </span>
                            <span className="text-[10px] text-rose-400 font-bold">
                              En Uygun Satış
                            </span>
                          </div>

                          <div className="text-base sm:text-lg font-extrabold font-mono text-rose-300 tabular-nums">
                            {formatPrice(op.bestSellSource.price, op.isFx)}{' '}
                            {op.unit && <span className="text-xs font-normal text-rose-400/80">{op.unit}</span>}
                          </div>

                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-rose-400 inline shrink-0" />
                            <span>Bu firmadan satın alın</span>
                          </div>
                        </div>
                      </td>

                      {/* Piyasa İçi Net Makas */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="flex flex-col items-end justify-center space-y-1">
                          <span className="font-extrabold text-slate-100 text-sm sm:text-base tabular-nums">
                            {formatPrice(op.spread, op.isFx)} {op.unit}
                          </span>

                          <span
                            className={`text-xs px-2 py-0.5 rounded-md font-bold flex items-center space-x-0.5 ${
                              op.hasArbitrage
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : op.spreadPercent < 0.5
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            <Percent className="w-3 h-3 inline" />
                            <span>%{isFinite(op.spreadPercent) ? Math.abs(op.spreadPercent).toFixed(2) : '0.00'}</span>
                          </span>
                        </div>
                      </td>

                      {/* Arbitraj & Likidite Durumu */}
                      <td className="py-3.5 px-4 text-center">
                        {op.hasArbitrage ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500/30 to-amber-600/30 text-amber-300 border border-amber-500/60 shadow-lg shadow-amber-500/20 animate-pulse">
                              <Zap className="w-3.5 h-3.5 text-amber-400" />
                              <span>ARBİTRAJ FIRSATI!</span>
                            </span>
                            <span className="text-[10px] text-amber-400 font-mono font-bold mt-1">
                              +{formatPrice(op.arbitrageProfit, op.isFx)} {op.unit} Net Kar
                            </span>
                          </div>
                        ) : op.spreadPercent < 0.5 ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Yüksek Likidite (Dar Makas)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-slate-800/80 text-slate-400">
                            <span>Standart Piyasa</span>
                          </span>
                        )}
                      </td>

                      {/* İşlem: Hesaplayıcı */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {onSelectForCalculator && op.bestBuyItem && (
                            <button
                              onClick={() => onSelectForCalculator(op.bestBuyItem!, op.bestBuySource.sourceName)}
                              className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 transition text-xs"
                              title="Bu kuru Kuyumcu Hesaplayıcısına aktar"
                            >
                              <Calculator className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Persistent Arbitrage History Modal */}
      {isHistoryModalOpen && (
        <ArbitrageHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          sources={sources}
          onSelectForCalculator={onSelectForCalculator}
        />
      )}

    </div>
  );
};
