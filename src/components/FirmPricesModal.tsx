import React, { useState, useMemo, useEffect } from 'react';
import { SourcesMap, MarketItem } from '../types/market';
import { DEFAULT_FIRM_ORDER } from '../types/sort';
import {
  X,
  Building2,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Calculator,
  TrendingUp,
  Coins,
  DollarSign,
  Percent,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Phone,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { CurrencyFlag } from './CurrencyFlag';
import { isFxItem, getCleanCurrencyCode, getStandardizedProductName } from '../utils/productUtils';
import { FirmLogo } from './FirmLogo';

interface FirmPricesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: SourcesMap;
  initialFirmKey?: string;
  onSelectForCalculator?: (item: MarketItem, firmName: string) => void;
  onOpenPriceHistory?: (code: string, firmKey?: string) => void;
}

const FIRM_METADATA: Record<
  string,
  {
    label: string;
    fullName: string;
    badge: string;
    categoryTitle: string;
    location: string;
    phone: string;
    color: string;
    borderColor: string;
    bgColor: string;
    activeRing: string;
  }
> = {
  gunes_kuyumculuk: {
    label: 'Güneş Kuyumculuk',
    fullName: 'Güneş Kuyumculuk & Sarrafiye',
    badge: 'GÜNEŞ',
    categoryTitle: 'Kuyumculuk & Sarrafiye',
    location: 'Samsun / Saathane Meydanı & Mecidiye',
    phone: '0 (362) 431 10 20',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    bgColor: 'bg-amber-500/10',
    activeRing: 'ring-amber-500/40 bg-amber-500/20 text-amber-300 border-amber-500',
  },
  kaptan_doviz: {
    label: 'Kaptan Altın & Döviz',
    fullName: 'Kaptan Altın & Döviz Tic. A.Ş.',
    badge: 'KAPTAN',
    categoryTitle: 'Altın & Döviz Merkezi',
    location: 'Samsun / Gazi Caddesi No:42',
    phone: '0 (362) 435 66 77',
    color: 'text-sky-400',
    borderColor: 'border-sky-500/40',
    bgColor: 'bg-sky-500/10',
    activeRing: 'ring-sky-500/40 bg-sky-500/20 text-sky-300 border-sky-500',
  },
  solis_doviz: {
    label: 'Solis Döviz',
    fullName: 'Solis Döviz Yetkili Müessese A.Ş.',
    badge: 'SOLİS',
    categoryTitle: 'Yetkili Müessese (Döviz & Kıymetli Madenler)',
    location: 'Samsun / İlkadım - Çiftlik',
    phone: '0 (362) 432 00 55',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    bgColor: 'bg-amber-500/10',
    activeRing: 'ring-amber-500/40 bg-amber-500/20 text-amber-300 border-amber-500',
  },
  ilkay_doviz: {
    label: 'İlkay Döviz',
    fullName: 'İlkay Döviz B Grubu Yetkili Müessese A.Ş.',
    badge: 'İLKAY',
    categoryTitle: 'Yetkili Müessese (Döviz A.Ş.)',
    location: 'Samsun / İlkadım - Gazi Caddesi',
    phone: '0 (362) 431 38 78',
    color: 'text-indigo-400',
    borderColor: 'border-indigo-500/40',
    bgColor: 'bg-indigo-500/10',
    activeRing: 'ring-indigo-500/40 bg-indigo-500/20 text-indigo-300 border-indigo-500',
  },
  sar_doviz: {
    label: 'SAR Döviz',
    fullName: 'SAR Döviz Yetkili Müessese A.Ş.',
    badge: 'SAR DÖVİZ',
    categoryTitle: 'Yetkili Müessese (Döviz A.Ş.)',
    location: 'Samsun / Çiftlik Caddesi',
    phone: '0 (362) 440 88 55',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    bgColor: 'bg-emerald-500/10',
    activeRing: 'ring-emerald-500/40 bg-emerald-500/20 text-emerald-300 border-emerald-500',
  },
  altinkose: {
    label: 'Altınköşe Kuyumculuk',
    fullName: 'Altınköşe Mücevherat & Kuyumculuk',
    badge: 'ALTINKÖŞE',
    categoryTitle: 'Mücevherat & Sarrafiye',
    location: 'Samsun / Saathane Meydanı',
    phone: '0 (362) 444 19 23',
    color: 'text-yellow-400',
    borderColor: 'border-yellow-500/40',
    bgColor: 'bg-yellow-500/10',
    activeRing: 'ring-yellow-500/40 bg-yellow-500/20 text-yellow-300 border-yellow-500',
  },
  vizyon_altin: {
    label: 'Vizyon Kuyumculuk',
    fullName: 'Vizyon Kuyumculuk & Altın',
    badge: 'VİZYON',
    categoryTitle: 'Kuyumculuk & Sarrafiye',
    location: 'Samsun / Bankalar Caddesi',
    phone: '0 (362) 433 10 20',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/40',
    bgColor: 'bg-purple-500/10',
    activeRing: 'ring-purple-500/40 bg-purple-500/20 text-purple-300 border-purple-500',
  },
};

export const FirmPricesModal: React.FC<FirmPricesModalProps> = ({
  isOpen,
  onClose,
  sources,
  initialFirmKey,
  onSelectForCalculator,
  onOpenPriceHistory,
}) => {
  const [selectedFirmKey, setSelectedFirmKey] = useState<string>('gunes_kuyumculuk');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'gold_has' | 'gold_sarrafiye' | 'fx'>('all');
  const [sortMode, setSortMode] = useState<'default' | 'name_asc' | 'buy_desc' | 'sell_asc' | 'spread_asc'>('default');

  // Sync initial firm key when modal opens
  useEffect(() => {
    if (initialFirmKey && sources[initialFirmKey]) {
      setSelectedFirmKey(initialFirmKey);
    } else if (!sources[selectedFirmKey]) {
      const firstKey = DEFAULT_FIRM_ORDER.find((k) => sources[k]);
      if (firstKey) setSelectedFirmKey(firstKey);
    }
  }, [initialFirmKey, isOpen, sources]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Active firm data
  const currentSource = sources[selectedFirmKey] || {
    sourceName: selectedFirmKey,
    status: 'active',
    updatedAt: new Date().toISOString(),
    data: [],
  };

  const meta = FIRM_METADATA[selectedFirmKey] || {
    label: currentSource.sourceName || selectedFirmKey,
    fullName: currentSource.sourceName || selectedFirmKey,
    badge: (currentSource.sourceName || selectedFirmKey).toUpperCase(),
    categoryTitle: 'Piyasa Sağlayıcısı',
    location: currentSource.location || 'Samsun',
    phone: currentSource.phone || '',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    bgColor: 'bg-amber-500/10',
    activeRing: 'ring-amber-500/40 bg-amber-500/20 text-amber-300 border-amber-500',
  };

  // Helper classification for products
  const classifyItem = (code: string) => {
    const upper = String(code || '').toUpperCase();
    if (upper === 'EURUSD' || upper === 'EUR_USD') {
      return {
        category: 'fx',
        badge: 'PARİTE',
        badgeStyle: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        decimals: 4,
        unit: '',
      };
    }
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
        category: 'gold_sarrafiye',
        badge: 'SARRAFİYE',
        badgeStyle: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        decimals: 2,
        unit: '₺',
      };
    }
    if (
      upper.includes('HAS') ||
      upper.includes('ONS') ||
      upper.includes('GUMUS') ||
      upper.startsWith('ALTIN')
    ) {
      return {
        category: 'gold_has',
        badge: upper.includes('ONS') ? 'ONS ($)' : upper.includes('GUMUS') ? 'GÜMÜŞ' : '24K HAS',
        badgeStyle: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
        decimals: 2,
        unit: upper.includes('ONS') ? '$' : '₺',
      };
    }
    return {
      category: 'fx',
      badge: 'DÖVİZ',
      badgeStyle: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      decimals: 4,
      unit: '₺',
    };
  };

  const rawItems = Array.isArray(currentSource?.data) ? currentSource.data : [];

  // Filtered and sorted items
  const processedItems = useMemo(() => {
    return rawItems
      .filter((item) => {
        if (!item || item.code === 'ONS') return false;
        const cls = classifyItem(item.code);

        // Category filter
        if (categoryFilter !== 'all' && cls.category !== categoryFilter) {
          return false;
        }

        // Search filter
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const matchesName = String(item.name || '').toLowerCase().includes(q);
          const matchesCode = String(item.code || '').toLowerCase().includes(q);
          if (!matchesName && !matchesCode) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const nameA = String(a?.name || '');
        const nameB = String(b?.name || '');
        if (sortMode === 'name_asc') {
          return nameA.localeCompare(nameB, 'tr-TR');
        }
        const buyA = typeof a?.buy === 'number' && !isNaN(a.buy) ? a.buy : 0;
        const buyB = typeof b?.buy === 'number' && !isNaN(b.buy) ? b.buy : 0;
        if (sortMode === 'buy_desc') {
          return buyB - buyA;
        }
        const sellA = typeof a?.sell === 'number' && !isNaN(a.sell) ? a.sell : 0;
        const sellB = typeof b?.sell === 'number' && !isNaN(b.sell) ? b.sell : 0;
        if (sortMode === 'sell_asc') {
          return sellA - sellB;
        }
        if (sortMode === 'spread_asc') {
          const spreadA = buyA > 0 ? (sellA - buyA) / buyA : 999;
          const spreadB = buyB > 0 ? (sellB - buyB) / buyB : 999;
          return spreadA - spreadB;
        }
        return 0; // Default order
      });
  }, [rawItems, categoryFilter, search, sortMode]);

  const categoryCounts = useMemo(() => {
    let gold_has = 0;
    let gold_sarrafiye = 0;
    let fx = 0;
    rawItems.forEach((item) => {
      if (!item) return;
      const cls = classifyItem(item.code);
      if (cls.category === 'gold_has') gold_has++;
      else if (cls.category === 'gold_sarrafiye') gold_sarrafiye++;
      else if (cls.category === 'fx') fx++;
    });
    return { all: rawItems.length, gold_has, gold_sarrafiye, fx };
  }, [rawItems]);

  const formatPrice = (val: number, decimals: number) => {
    if (!val) return '—';
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800/80 shrink-0">
          <div className="flex items-start justify-between gap-3">
            
            <div className="flex items-center space-x-3 min-w-0">
              <FirmLogo firmKey={selectedFirmKey} firmName={meta.label} size="lg" />

              <div className="flex flex-col min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${meta.bgColor} ${meta.borderColor} ${meta.color}`}>
                    {meta.badge}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {meta.categoryTitle}
                  </span>
                  <div className="flex items-center space-x-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Canlı Yayın</span>
                  </div>
                </div>

                <h2 className="text-base sm:text-xl font-extrabold text-white tracking-tight truncate mt-0.5">
                  {meta.fullName}
                </h2>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                  <span className="flex items-center space-x-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{meta.location}</span>
                  </span>
                  {meta.phone && (
                    <span className="hidden sm:flex items-center space-x-1 font-mono text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{meta.phone}</span>
                    </span>
                  )}
                  {currentSource.updatedAt && (
                    <span className="hidden md:flex items-center space-x-1 font-mono text-[11px] text-slate-500">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>
                        Son Güncelleme: {new Date(currentSource.updatedAt).toLocaleTimeString('tr-TR')}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition shrink-0"
              title="Kapat (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Firm Switcher Tabs: 6 Firms strictly ordered */}
          <div className="mt-4 pt-3 border-t border-slate-800/70">
            <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center space-x-1.5">
              <span>Firmayı Değiştir:</span>
              <span className="text-slate-500 font-mono text-[10px]">(Diğer firmaların canlı fiyatlarını anında inceleyin)</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-1">
              {DEFAULT_FIRM_ORDER.map((key) => {
                const fMeta = FIRM_METADATA[key];
                if (!fMeta) return null;
                const isSelected = selectedFirmKey === key;
                const firmDataCount = sources[key]?.data?.length || 0;

                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedFirmKey(key);
                      setSearch('');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 border ${
                      isSelected
                        ? fMeta.activeRing
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSelected ? 'bg-emerald-400' : 'bg-slate-600'
                      }`}
                    ></span>
                    <FirmLogo firmKey={key} firmName={fMeta.label} size="xs" />
                    <span>{fMeta.label}</span>
                    <span className="text-[10px] font-mono opacity-70">
                      ({firmDataCount})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Controls Bar: Categories & Search */}
        <div className="px-4 py-3 bg-slate-900/70 border-b border-slate-800/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-xs font-semibold mr-1 hidden sm:inline flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Filtre:</span>
            </span>

            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                categoryFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              Tümü ({categoryCounts.all})
            </button>

            {categoryCounts.gold_has > 0 && (
              <button
                onClick={() => setCategoryFilter('gold_has')}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                  categoryFilter === 'gold_has'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white'
                }`}
              >
                <Coins className="w-3 h-3" />
                <span>24K Has ({categoryCounts.gold_has})</span>
              </button>
            )}

            {categoryCounts.gold_sarrafiye > 0 && (
              <button
                onClick={() => setCategoryFilter('gold_sarrafiye')}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                  categoryFilter === 'gold_sarrafiye'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white'
                }`}
              >
                <Coins className="w-3 h-3" />
                <span>Sarrafiye ({categoryCounts.gold_sarrafiye})</span>
              </button>
            )}

            {categoryCounts.fx > 0 && (
              <button
                onClick={() => setCategoryFilter('fx')}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                  categoryFilter === 'fx'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white'
                }`}
              >
                <DollarSign className="w-3 h-3" />
                <span>Tüm Dövizler ({categoryCounts.fx})</span>
              </button>
            )}
          </div>

          {/* Search Box & Sort */}
          <div className="flex items-center space-x-2">
            
            {/* Sort Selector */}
            <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-xs">
              <ArrowUpDown className="w-3 h-3 text-amber-400" />
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as any)}
                className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="default" className="bg-slate-900 text-slate-100">
                  Varsayılan Sıra
                </option>
                <option value="buy_desc" className="bg-slate-900 text-slate-100">
                  En Yüksek Alış
                </option>
                <option value="sell_asc" className="bg-slate-900 text-slate-100">
                  En Düşük Satış
                </option>
                <option value="spread_asc" className="bg-slate-900 text-slate-100">
                  En Dar Makas %
                </option>
                <option value="name_asc" className="bg-slate-900 text-slate-100">
                  Varlık Adı (A - Z)
                </option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Bu firmada kur ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60"
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

        {/* Modal Body: Price Table */}
        <div className="overflow-y-auto flex-1 p-3 sm:p-5">
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs border-collapse">
              
              <thead className="bg-slate-900/95 sticky top-0 z-10 border-b border-slate-800 text-slate-300 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4 min-w-[170px]">Varlık / Kur</th>
                  <th className="py-3 px-3 text-right min-w-[140px] text-emerald-400">
                    Alış (Bozdurma)
                  </th>
                  <th className="py-3 px-3 text-right min-w-[140px] text-rose-400">
                    Satış (Satın Alma)
                  </th>
                  <th className="py-3 px-3 text-right min-w-[120px] text-slate-300">
                    Net Makas
                  </th>
                  <th className="py-3 px-3 text-center min-w-[100px] text-slate-400">
                    Günlük Değişim
                  </th>
                  <th className="py-3 px-3 text-center min-w-[80px]">
                    İşlem
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60">
                {processedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Building2 className="w-8 h-8 text-slate-600" />
                        <span className="text-sm font-semibold text-slate-300">
                          Bu firmada arama veya filtre kriterine uygun kur bulunamadı.
                        </span>
                        <p className="text-xs text-slate-500">
                          Filtreleri temizleyerek firmanın tüm yayınladığı fiyatları görüntüleyebilirsiniz.
                        </p>
                        <button
                          onClick={() => {
                            setSearch('');
                            setCategoryFilter('all');
                          }}
                          className="mt-2 px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
                        >
                          Filtreleri Temizle
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  processedItems.map((item, idx) => {
                    const cls = classifyItem(item.code);
                    const isEven = idx % 2 === 0;

                    const spreadTL = item.sell > 0 && item.buy > 0 ? item.sell - item.buy : 0;
                    const spreadPercent = item.buy > 0 ? (spreadTL / item.buy) * 100 : 0;

                    const isUp = item.direction === 'up';
                    const isDown = item.direction === 'down';

                    return (
                      <tr
                        key={item.code}
                        className={`transition-colors hover:bg-slate-900/80 ${
                          isEven ? 'bg-slate-950' : 'bg-slate-900/30'
                        }`}
                      >
                        {/* Ürün Adı, Bayrak & Kategori Rozeti (Tek Satır, Açıklama Yok) */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2 min-w-0">
                            {isFxItem(item.code) && (
                              <CurrencyFlag
                                code={getCleanCurrencyCode(item.code)}
                                size={18}
                                className="w-[18px] h-[18px]"
                              />
                            )}
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border uppercase tracking-wide shrink-0 ${cls.badgeStyle}`}
                            >
                              {cls.badge}
                            </span>
                            <span className="font-bold text-white text-xs sm:text-sm truncate">
                              {getStandardizedProductName(item.code, item.name)}
                            </span>
                          </div>
                        </td>

                        {/* Alış Fiyatı */}
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex flex-col items-end">
                            <div className="flex items-center space-x-1 font-mono font-extrabold text-sm sm:text-base text-emerald-400 tabular-nums">
                              {isUp && <ArrowUp className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />}
                              {isDown && <ArrowDown className="w-3.5 h-3.5 text-rose-400" />}
                              <span>{formatPrice(item.buy, cls.decimals)}</span>
                              {cls.unit && <span className="text-xs font-normal text-emerald-500/80">{cls.unit}</span>}
                            </div>
                            <span className="text-[10px] text-emerald-500/80">
                              Müşteri Bozdurma
                            </span>
                          </div>
                        </td>

                        {/* Satış Fiyatı */}
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex flex-col items-end">
                            <div className="flex items-center space-x-1 font-mono font-extrabold text-sm sm:text-base text-rose-400 tabular-nums">
                              <span>{formatPrice(item.sell, cls.decimals)}</span>
                              {cls.unit && <span className="text-xs font-normal text-rose-500/80">{cls.unit}</span>}
                            </div>
                            <span className="text-[10px] text-rose-500/80">
                              Müşteri Satın Alma
                            </span>
                          </div>
                        </td>

                        {/* Net Makas */}
                        <td className="py-3 px-3 text-right font-mono">
                          <div className="inline-flex flex-col items-end">
                            <span className="font-bold text-slate-200 tabular-nums text-xs">
                              {formatPrice(spreadTL, cls.decimals)} {cls.unit}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.2 rounded mt-0.5 ${
                                spreadPercent < 0.6
                                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              %{isFinite(spreadPercent) ? spreadPercent.toFixed(2) : '0.00'}
                            </span>
                          </div>
                        </td>

                        {/* Günlük Değişim */}
                        <td className="py-3 px-3 text-center font-mono">
                          {typeof item.changeRate === 'number' && !isNaN(item.changeRate) ? (
                            <span
                              className={`inline-flex items-center space-x-0.5 text-xs font-bold px-2 py-0.5 rounded-md ${
                                item.changeRate > 0
                                  ? 'text-emerald-400 bg-emerald-950/40'
                                  : item.changeRate < 0
                                  ? 'text-rose-400 bg-rose-950/40'
                                  : 'text-slate-400 bg-slate-800/40'
                              }`}
                            >
                              {item.changeRate > 0 ? '+' : ''}
                              {item.changeRate.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs font-mono font-semibold">%0.00</span>
                          )}
                        </td>

                        {/* İşlem Butonları */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            {onSelectForCalculator && item.buy > 0 && (
                              <button
                                onClick={() => {
                                  onSelectForCalculator(item, meta.fullName);
                                  onClose();
                                }}
                                className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 transition"
                                title="Kuyumcu Masası / Hesaplayıcıya aktar"
                              >
                                <Calculator className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {onOpenPriceHistory && (
                              <button
                                onClick={() => {
                                  onOpenPriceHistory(item.code, selectedFirmKey);
                                  onClose();
                                }}
                                className="p-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500 text-indigo-300 hover:text-slate-950 transition"
                                title="Fiyat Grafiği & Geçmişi incele"
                              >
                                <TrendingUp className="w-3.5 h-3.5" />
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

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>{meta.fullName}</strong> tarafından yayınlanan anlık canlı veriler listelenmektedir.
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
            >
              Kapat
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
