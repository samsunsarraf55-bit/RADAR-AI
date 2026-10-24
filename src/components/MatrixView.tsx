import React, { useState, useMemo } from 'react';
import { SourcesMap, MarketItem } from '../types/market';
import { useSort } from '../context/SortContext';
import { SORT_OPTIONS, SortMode, DEFAULT_FIRM_ORDER } from '../types/sort';
import {
  Search,
  Sparkles,
  ArrowUpDown,
  Coins,
  DollarSign,
  Percent,
  Calculator,
  X,
  Layers,
  Crown,
  Filter,
  Building2,
  RotateCcw,
  Zap,
  Compass,
  Sun,
  Eye,
  TrendingUp,
} from 'lucide-react';
import { CurrencyFlag } from './CurrencyFlag';
import { FirmLogo } from './FirmLogo';
import { isFxItem, getCleanCurrencyCode, getStandardizedProductName } from '../utils/productUtils';

interface MatrixViewProps {
  sources: SourcesMap;
  onSelectForCalculator?: (item: MarketItem, firmName: string) => void;
}

export type MatrixCategoryFilter =
  | 'all'
  | 'fx'
  | 'gold_has'
  | 'gold_sarrafiye';

export type MatrixConditionFilter = 'all' | 'arbitrage' | 'tight_spread' | 'has_quote';

interface ProductDef {
  code: string;
  name: string;
  category: 'gold' | 'parite' | 'fx';
  subCategory: 'gold_has' | 'gold_sarrafiye' | 'eurusd' | 'fx';
  badge: string;
}

const BASE_PRODUCTS: ProductDef[] = [
  { code: 'USDTRY', name: 'USD / TRY (Dolar)', category: 'fx', subCategory: 'fx', badge: 'DÖVİZ' },
  { code: 'EURTRY', name: 'EUR / TRY (Euro)', category: 'fx', subCategory: 'fx', badge: 'DÖVİZ' },
  { code: 'GBPTRY', name: 'GBP / TRY (Sterlin)', category: 'fx', subCategory: 'fx', badge: 'DÖVİZ' },
  { code: 'CHFTRY', name: 'CHF / TRY (Frank)', category: 'fx', subCategory: 'fx', badge: 'DÖVİZ' },
  { code: 'AUDTRY', name: 'AUD / TRY (Avustralya $)', category: 'fx', subCategory: 'fx', badge: 'DÖVİZ' },
  { code: 'CADTRY', name: 'CAD / TRY (Kanada $)', category: 'fx', subCategory: 'fx', badge: 'DÖVİZ' },
  { code: 'SARTRY', name: 'SAR / TRY (Riyal)', category: 'fx', subCategory: 'fx', badge: 'DÖVİZ' },
  { code: 'ALTIN_HAS', name: 'Has Altın (Gram 24K)', category: 'gold', subCategory: 'gold_has', badge: '24K HAS' },
  { code: 'ALTIN_22', name: '22 Ayar Bilezik', category: 'gold', subCategory: 'gold_sarrafiye', badge: '22 AYAR' },
  { code: 'CEYREK_YENI', name: 'Çeyrek Altın', category: 'gold', subCategory: 'gold_sarrafiye', badge: 'SARRAFİYE' },
  { code: 'YARIM_YENI', name: 'Yarım Altın', category: 'gold', subCategory: 'gold_sarrafiye', badge: 'SARRAFİYE' },
  { code: 'TAM_YENI', name: 'Tam Ziynet Altın', category: 'gold', subCategory: 'gold_sarrafiye', badge: 'SARRAFİYE' },
  { code: 'ATA_YENI', name: 'Ata (Cumhuriyet)', category: 'gold', subCategory: 'gold_sarrafiye', badge: 'CUMHURİYET' },
  { code: 'GREMSE_YENI', name: 'Gremse Altın (2.5)', category: 'gold', subCategory: 'gold_sarrafiye', badge: 'SARRAFİYE' },
  { code: 'ALTIN_14', name: '14 Ayar Altın', category: 'gold', subCategory: 'gold_sarrafiye', badge: '14 AYAR' },
  { code: 'GUMUS', name: 'Gümüş Gram (TRY)', category: 'gold', subCategory: 'gold_has', badge: 'GÜMÜŞ' },
  { code: 'EURUSD', name: 'EUR / USD Parite', category: 'parite', subCategory: 'eurusd', badge: 'PARİTE' },
  { code: 'JPYTRY', name: 'JPY / TRY (Japon Yeni)', category: 'fx', subCategory: 'fx', badge: 'DÖVİZ' },
  { code: 'RUBTRY', name: 'RUB / TRY (Rus Rublesi)', category: 'fx', subCategory: 'fx', badge: 'DÖVİZ' },
  { code: 'AZNTRY', name: 'AZN / TRY (Azerbaycan Manatı)', category: 'fx', subCategory: 'fx', badge: 'DÖVİZ' },
  { code: 'GELTRY', name: 'GEL / TRY (Gürcistan Larisi)', category: 'fx', subCategory: 'fx', badge: 'DÖVİZ' },
];

export const FIRM_SHORT_LABELS: Record<string, string> = {
  gunes_kuyumculuk: 'Güneş',
  kaptan_doviz: 'Kaptan',
  solis_doviz: 'Solis',
  sar_doviz: 'SAR',
  altinkose: 'Altınköşe',
  ilkay_doviz: 'İlkay',
  vizyon_altin: 'Vizyon',
};

const FIRM_BRAND_STYLES: Record<string, { label: string; badge: string; color: string; border: string; bg: string }> = {
  gunes_kuyumculuk: {
    label: 'Güneş',
    badge: 'GÜNEŞ',
    color: 'text-amber-500',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
  },
  kaptan_doviz: {
    label: 'Kaptan',
    badge: 'KAPTAN',
    color: 'text-sky-500',
    border: 'border-sky-500/30',
    bg: 'bg-sky-500/10',
  },
  solis_doviz: {
    label: 'Solis',
    badge: 'SOLİS',
    color: 'text-amber-500',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
  },
  sar_doviz: {
    label: 'SAR',
    badge: 'SAR',
    color: 'text-emerald-500',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
  },
  altinkose: {
    label: 'Altınköşe',
    badge: 'ALTINKÖŞE',
    color: 'text-yellow-500',
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/10',
  },
  ilkay_doviz: {
    label: 'İlkay',
    badge: 'İLKAY',
    color: 'text-indigo-500',
    border: 'border-indigo-500/30',
    bg: 'bg-indigo-500/10',
  },
  vizyon_altin: {
    label: 'Vizyon',
    badge: 'VİZYON',
    color: 'text-purple-500',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
  },
};

function getFirmIcon(firmKey: string) {
  switch (firmKey) {
    case 'gunes_kuyumculuk':
      return <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    case 'kaptan_doviz':
      return <Compass className="w-3.5 h-3.5 text-sky-500 shrink-0" />;
    case 'solis_doviz':
      return <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    case 'sar_doviz':
      return <Coins className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
    case 'altinkose':
      return <Crown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />;
    case 'ilkay_doviz':
      return <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
    case 'vizyon_altin':
      return <Eye className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
    default:
      return <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  }
}

export function getProductDisplayInfo(code: string, originalName?: string) {
  const upper = (code || '').toUpperCase();

  if (upper === 'USDTRY' || upper === 'USD') {
    return { displayCode: 'USD', title: 'USD', subtitle: 'ABD Doları', isFx: true, currencyCode: 'USD' };
  }
  if (upper === 'EURTRY' || upper === 'EUR') {
    return { displayCode: 'EUR', title: 'EUR', subtitle: 'Euro', isFx: true, currencyCode: 'EUR' };
  }
  if (upper === 'GBPTRY' || upper === 'GBP') {
    return { displayCode: 'GBP', title: 'GBP', subtitle: 'Sterlin', isFx: true, currencyCode: 'GBP' };
  }
  if (upper === 'CHFTRY' || upper === 'CHF') {
    return { displayCode: 'CHF', title: 'CHF', subtitle: 'İsviçre Frangı', isFx: true, currencyCode: 'CHF' };
  }
  if (upper === 'AUDTRY' || upper === 'AUD') {
    return { displayCode: 'AUD', title: 'AUD', subtitle: 'Avustralya Doları', isFx: true, currencyCode: 'AUD' };
  }
  if (upper === 'CADTRY' || upper === 'CAD') {
    return { displayCode: 'CAD', title: 'CAD', subtitle: 'Kanada Doları', isFx: true, currencyCode: 'CAD' };
  }
  if (upper === 'SARTRY' || upper === 'SAR') {
    return { displayCode: 'SAR', title: 'SAR', subtitle: 'Suudi Arabistan Riyali', isFx: true, currencyCode: 'SAR' };
  }
  if (upper === 'JPYTRY' || upper === 'JPY') {
    return { displayCode: 'JPY', title: 'JPY', subtitle: 'Japon Yeni', isFx: true, currencyCode: 'JPY' };
  }
  if (upper === 'RUBTRY' || upper === 'RUB') {
    return { displayCode: 'RUB', title: 'RUB', subtitle: 'Rus Rublesi', isFx: true, currencyCode: 'RUB' };
  }
  if (upper === 'AZNTRY' || upper === 'AZN') {
    return { displayCode: 'AZN', title: 'AZN', subtitle: 'Azerbaycan Manatı', isFx: true, currencyCode: 'AZN' };
  }
  if (upper === 'GELTRY' || upper === 'GEL') {
    return { displayCode: 'GEL', title: 'GEL', subtitle: 'Gürcistan Larisi', isFx: true, currencyCode: 'GEL' };
  }
  if (upper === 'EURUSD' || upper === 'EUR_USD') {
    return { displayCode: 'EUR/USD', title: 'EUR/USD', subtitle: 'Parite', isFx: true, currencyCode: 'EURUSD' };
  }
  if (upper === 'ALTIN_HAS' || upper === 'HAS' || upper === '24') {
    return { displayCode: 'HAS', title: 'HAS', subtitle: 'Has Altın (24K)', isFx: false, currencyCode: 'HAS' };
  }
  if (upper === 'ALTIN_22' || upper === '22_AYAR' || upper === '22') {
    return { displayCode: '22 AYAR', title: '22 AYAR', subtitle: '22 Ayar Bilezik', isFx: false, currencyCode: '22' };
  }
  if (upper === 'CEYREK_YENI' || upper === 'CEYREK') {
    return { displayCode: 'ÇEYREK', title: 'ÇEYREK', subtitle: 'Çeyrek Altın', isFx: false, currencyCode: 'CEYREK' };
  }
  if (upper === 'YARIM_YENI' || upper === 'YARIM') {
    return { displayCode: 'YARIM', title: 'YARIM', subtitle: 'Yarım Altın', isFx: false, currencyCode: 'YARIM' };
  }
  if (upper === 'TAM_YENI' || upper === 'TAM' || upper === 'ZIYNET') {
    return { displayCode: 'TAM', title: 'TAM', subtitle: 'Tam Ziynet Altın', isFx: false, currencyCode: 'TAM' };
  }
  if (upper === 'ATA_YENI' || upper === 'ATA' || upper === 'ATA_LIRA') {
    return { displayCode: 'ATA LİRA', title: 'ATA LİRA', subtitle: 'Cumhuriyet Ata Lira', isFx: false, currencyCode: 'ATA' };
  }
  if (upper === 'GREMSE_YENI' || upper === 'GREMSE') {
    return { displayCode: 'GREMSE', title: 'GREMSE', subtitle: 'Gremse Altın (2.5)', isFx: false, currencyCode: 'GREMSE' };
  }
  if (upper === 'ALTIN_14' || upper === '14_AYAR') {
    return { displayCode: '14 AYAR', title: '14 AYAR', subtitle: '14 Ayar Altın', isFx: false, currencyCode: '14' };
  }
  if (upper === 'RESAT_LIRA' || upper === 'RESAT') {
    return { displayCode: 'REŞAT', title: 'REŞAT', subtitle: 'Reşat Lira', isFx: false, currencyCode: 'RESAT' };
  }
  if (upper === 'GUMUS' || upper === 'XAG' || upper === 'AG') {
    return { displayCode: 'GÜMÜŞ', title: 'GÜMÜŞ', subtitle: 'Gram Gümüş (Ag)', isFx: false, currencyCode: 'GUMUS' };
  }

  const stdName = getStandardizedProductName(code, originalName);
  return {
    displayCode: stdName,
    title: stdName,
    subtitle: originalName || code,
    isFx: isFxItem(code),
    currencyCode: getCleanCurrencyCode(code),
  };
}

export const MatrixView: React.FC<MatrixViewProps> = ({
  sources,
  onSelectForCalculator,
}) => {
  const { sortMode, setSortMode, customOrder, setIsCustomOrderModalOpen } = useSort();

  // All 7 firm keys strictly ordered matching screenshot:
  // Güneş -> Kaptan -> Solis -> SAR -> Altınköşe -> İlkay -> Vizyon
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
  const [filterType, setFilterType] = useState<MatrixCategoryFilter>('all');
  const [conditionFilter, setConditionFilter] = useState<MatrixConditionFilter>('all');
  const [selectedFirmKeys, setSelectedFirmKeys] = useState<string[]>(allFirmKeys);
  const [search, setSearch] = useState('');
  const [showSummaryPills, setShowSummaryPills] = useState<boolean>(true);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);

  // Sync selectedFirmKeys if sources change and keys were empty
  React.useEffect(() => {
    if (selectedFirmKeys.length === 0 && allFirmKeys.length > 0) {
      setSelectedFirmKeys(allFirmKeys);
    }
  }, [allFirmKeys]);

  // Extract all distinct product codes from sources
  const dynamicProducts: ProductDef[] = useMemo(() => {
    const seenCodes = new Set<string>(BASE_PRODUCTS.map((p) => p.code));
    const list: ProductDef[] = [...BASE_PRODUCTS];

    Object.values(sources).forEach((src) => {
      src.data?.forEach((item) => {
        if (!item || item.code === 'ONS') return;
        if (!seenCodes.has(item.code)) {
          seenCodes.add(item.code);
          const upper = item.code.toUpperCase();
          if (upper === 'ONS') return;

          const stdName = getStandardizedProductName(item.code, item.name);

          if (upper === 'EURUSD' || upper === 'EUR_USD') {
            list.push({
              code: item.code,
              name: 'EUR / USD Parite',
              category: 'parite',
              subCategory: 'eurusd',
              badge: 'PARİTE',
            });
            return;
          }

          const isSarrafiye =
            upper.includes('CEYREK') ||
            upper.includes('YARIM') ||
            upper.includes('TAM') ||
            upper.includes('ATA') ||
            upper.includes('GREMSE') ||
            upper.includes('22') ||
            upper.includes('14') ||
            upper.includes('BILEZIK');

          const isHasGold =
            upper.includes('HAS') ||
            upper.includes('ONS') ||
            upper.includes('GUMUS') ||
            upper.startsWith('ALTIN');

          if (isSarrafiye) {
            list.push({
              code: item.code,
              name: stdName,
              category: 'gold',
              subCategory: 'gold_sarrafiye',
              badge: 'SARRAFİYE',
            });
          } else if (isHasGold) {
            list.push({
              code: item.code,
              name: stdName,
              category: 'gold',
              subCategory: 'gold_has',
              badge: upper.includes('GUMUS') ? 'GÜMÜŞ' : 'ALTIN',
            });
          } else {
            // Foreign currency
            list.push({
              code: item.code,
              name: stdName,
              category: 'fx',
              subCategory: 'fx',
              badge: 'DÖVİZ',
            });
          }
        }
      });
    });

    return list;
  }, [sources]);

  const getUnit = (code: string) => {
    const upper = String(code || '').toUpperCase();
    if (upper === 'EURUSD' || upper === 'EUR_USD') return '';
    if (upper.includes('ONS')) return '$';
    return '₺';
  };

  const formatPrice = (val: number | undefined, code: string, firmKey?: string) => {
    if (val === undefined || val === null || isNaN(val) || val === 0) return '—';
    const upper = String(code || '').toUpperCase();

    // Altınköşe gümüş kuralı: virgülden sonra 0,50'nin üzerindeyse yukarı, altındaysa aşağı yuvarla
    if (upper === 'GUMUS' && firmKey === 'altinkose') {
      const floorVal = Math.floor(val);
      const frac = Number((val - floorVal).toFixed(4));
      let rounded: number;
      if (frac > 0.50) {
        rounded = floorVal + 1;
      } else if (frac < 0.50) {
        rounded = floorVal;
      } else {
        rounded = floorVal + 0.50;
      }
      return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(rounded);
    }

    const isParite = upper === 'EURUSD' || upper === 'EUR_USD';
    const isFx =
      upper.includes('TRY') &&
      !upper.startsWith('ALTIN') &&
      !upper.startsWith('CEYREK') &&
      !upper.startsWith('YARIM') &&
      !upper.startsWith('TAM') &&
      !upper.startsWith('ATA') &&
      !upper.startsWith('GREMSE');

    // FX prices in screenshot show 2 decimal places (e.g. 49,65 or 65,70) or 4 if fractional
    const hasMoreDecimals = val * 100 !== Math.floor(val * 100);
    const decimals = isParite ? 4 : isFx ? (hasMoreDecimals ? 4 : 2) : 2;

    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  // Toggle single firm in filter
  const toggleFirmFilter = (key: string) => {
    if (selectedFirmKeys.includes(key)) {
      if (selectedFirmKeys.length === 1) return; // Keep at least one firm
      setSelectedFirmKeys(selectedFirmKeys.filter((k) => k !== key));
    } else {
      setSelectedFirmKeys([...selectedFirmKeys, key]);
    }
  };

  // Select all firms
  const selectAllFirms = () => setSelectedFirmKeys(allFirmKeys);

  // Check if any filter is active
  const hasActiveFilters =
    filterType !== 'all' ||
    conditionFilter !== 'all' ||
    selectedFirmKeys.length !== allFirmKeys.length ||
    search.trim() !== '';

  const resetAllFilters = () => {
    setFilterType('all');
    setConditionFilter('all');
    setSelectedFirmKeys(allFirmKeys);
    setSearch('');
  };

  // Active firms to display as row capsules
  const visibleFirmKeys = allFirmKeys.filter((k) => selectedFirmKeys.includes(k));

  // Category counts for badges
  const categoryCounts = useMemo(() => {
    return {
      all: dynamicProducts.length,
      fx: dynamicProducts.filter((p) => p.category === 'fx' || p.category === 'parite' || p.subCategory === 'fx' || p.subCategory === 'eurusd').length,
      gold_has: dynamicProducts.filter((p) => p.subCategory === 'gold_has').length,
      gold_sarrafiye: dynamicProducts.filter((p) => p.subCategory === 'gold_sarrafiye').length,
    };
  }, [dynamicProducts]);

  // Filter products by category, condition, firm quotes, and search query
  const filteredProducts = useMemo(() => {
    return dynamicProducts.filter((prod) => {
      // 1. Category Filter
      if (filterType === 'gold_has' && prod.subCategory !== 'gold_has') return false;
      if (filterType === 'gold_sarrafiye' && prod.subCategory !== 'gold_sarrafiye') return false;
      if (filterType === 'fx' && prod.category !== 'fx' && prod.category !== 'parite' && prod.subCategory !== 'fx' && prod.subCategory !== 'eurusd') return false;

      // 2. Search Filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const displayInfo = getProductDisplayInfo(prod.code, prod.name);
        const matchesName = String(prod?.name || '').toLowerCase().includes(q);
        const matchesCode = String(prod?.code || '').toLowerCase().includes(q);
        const matchesTitle = displayInfo.title.toLowerCase().includes(q);
        const matchesSub = displayInfo.subtitle.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesTitle && !matchesSub) return false;
      }

      // Calculate best buy / min sell for condition filter
      let maxBuy = 0;
      let minSell = 99999999;
      let quoteCount = 0;

      visibleFirmKeys.forEach((key) => {
        const s = sources[key];
        const item = s?.data?.find((d) => d.code === prod.code);
        if (item && (item.buy > 0 || item.sell > 0)) {
          quoteCount++;
          if (item.buy > maxBuy) maxBuy = item.buy;
          if (item.sell > 0 && item.sell < minSell) minSell = item.sell;
        }
      });

      // 3. Condition Filter
      if (conditionFilter === 'has_quote' && quoteCount === 0) return false;

      const spreadTL = minSell < 99999999 && maxBuy > 0 ? minSell - maxBuy : 0;
      const spreadPercent = maxBuy > 0 && spreadTL !== 0 ? (spreadTL / maxBuy) * 100 : 0;
      const hasArbitrage = spreadTL < 0 && maxBuy > 0;

      if (conditionFilter === 'arbitrage' && !hasArbitrage) return false;
      if (conditionFilter === 'tight_spread' && (hasArbitrage || spreadPercent > 1.0 || quoteCount === 0)) {
        return false;
      }

      return true;
    });
  }, [dynamicProducts, filterType, conditionFilter, search, visibleFirmKeys, sources]);

  // Sort products
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (sortMode === 'name_asc') {
        return a.name.localeCompare(b.name, 'tr-TR');
      }
      if (sortMode === 'custom') {
        const rankA = customOrder.indexOf(a.code);
        const rankB = customOrder.indexOf(b.code);
        return (rankA === -1 ? 999 : rankA) - (rankB === -1 ? 999 : rankB);
      }
      if (sortMode === 'buy_desc' || sortMode === 'buy_asc') {
        let maxBuyA = 0;
        let maxBuyB = 0;
        visibleFirmKeys.forEach((k) => {
          const s = sources[k];
          const itemA = s?.data?.find((d) => d.code === a.code);
          const itemB = s?.data?.find((d) => d.code === b.code);
          if (itemA && itemA.buy > maxBuyA) maxBuyA = itemA.buy;
          if (itemB && itemB.buy > maxBuyB) maxBuyB = itemB.buy;
        });
        return sortMode === 'buy_desc' ? maxBuyB - maxBuyA : maxBuyA - maxBuyB;
      }
      if (sortMode === 'sell_asc' || sortMode === 'sell_desc') {
        let minSellA = 99999999;
        let minSellB = 99999999;
        visibleFirmKeys.forEach((k) => {
          const s = sources[k];
          const itemA = s?.data?.find((d) => d.code === a.code);
          const itemB = s?.data?.find((d) => d.code === b.code);
          if (itemA && itemA.sell > 0 && itemA.sell < minSellA) minSellA = itemA.sell;
          if (itemB && itemB.sell > 0 && itemB.sell < minSellB) minSellB = itemB.sell;
        });
        return sortMode === 'sell_asc' ? minSellA - minSellB : minSellB - minSellA;
      }
      // Default: follow BASE_PRODUCTS order
      const baseIdxA = BASE_PRODUCTS.findIndex((p) => p.code === a.code);
      const baseIdxB = BASE_PRODUCTS.findIndex((p) => p.code === b.code);
      if (baseIdxA !== -1 && baseIdxB !== -1) return baseIdxA - baseIdxB;
      if (baseIdxA !== -1) return -1;
      if (baseIdxB !== -1) return 1;
      return 0;
    });
  }, [filteredProducts, sortMode, customOrder, visibleFirmKeys, sources]);

  return (
    <div className="space-y-4">
      {/* Main Filter & Navigation Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
        {/* Row 1: Primary Category Tabs & Quick Action Controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Category Tabs: Tümü, Döviz Kurları, 24K Has, Ziynet & Sarrafiye */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Kategori:</span>
            </span>

            {/* Tümü */}
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                filterType === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Tümü ({categoryCounts.all})
            </button>

            {/* Döviz Kurları */}
            <button
              onClick={() => setFilterType('fx')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shadow-xs ${
                filterType === 'fx'
                  ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <DollarSign className="w-3 h-3 text-sky-500" />
              <span>Döviz ({categoryCounts.fx})</span>
            </button>

            {/* 24K Has Altın */}
            <button
              onClick={() => setFilterType('gold_has')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shadow-xs ${
                filterType === 'gold_has'
                  ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Coins className="w-3 h-3 text-amber-500" />
              <span>Has Altın ({categoryCounts.gold_has})</span>
            </button>

            {/* Sarrafiye */}
            <button
              onClick={() => setFilterType('gold_sarrafiye')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shadow-xs ${
                filterType === 'gold_sarrafiye'
                  ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Crown className="w-3 h-3 text-amber-500" />
              <span>Sarrafiye ({categoryCounts.gold_sarrafiye})</span>
            </button>
          </div>

          {/* Quick Action Controls: Search, Sort, Filter Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Toggle Button */}
            <button
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center space-x-1.5 ${
                isFilterPanelOpen || hasActiveFilters
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtreler</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              )}
            </button>

            {/* Sorting Dropdown */}
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-500" />
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="bg-transparent text-slate-700 dark:text-slate-200 font-bold focus:outline-none cursor-pointer text-xs"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-44 lg:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Kur ara (USD, HAS...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-7 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Expandable Secondary Filter Bar (Firma Seçimi & Durum Filtreleri) */}
        {isFilterPanelOpen && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-fadeIn">
            {/* Firm Multi-Select Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 mr-1">
                  <Building2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>Firmalar:</span>
                </span>

                {allFirmKeys.map((key) => {
                  const s = sources[key];
                  const isSelected = selectedFirmKeys.includes(key);
                  const shortLabel = FIRM_SHORT_LABELS[key] || s?.sourceName || key;

                  return (
                    <button
                      key={key}
                      onClick={() => toggleFirmFilter(key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition flex items-center space-x-1.5 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300 shadow-2xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60 hover:opacity-100'
                      }`}
                      title={isSelected ? `${shortLabel} gizle` : `${shortLabel} göster`}
                    >
                      <FirmLogo firmKey={key} size="xs" />
                      <span>{shortLabel}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={selectAllFirms}
                  className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-bold transition"
                >
                  Tümünü Göster ({allFirmKeys.length})
                </button>
              </div>
            </div>

            {/* Condition Filters (Arbitraj, Dar Makas, Aktif Fiyat) */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-bold mr-1">Fiyat Durumu:</span>

                <button
                  onClick={() => setConditionFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    conditionFilter === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Tüm Durumlar
                </button>

                <button
                  onClick={() => setConditionFilter('arbitrage')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                    conditionFilter === 'arbitrage'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>Sadece Arbitraj</span>
                </button>

                <button
                  onClick={() => setConditionFilter('tight_spread')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                    conditionFilter === 'tight_spread'
                      ? 'bg-emerald-600 text-white font-black'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Percent className="w-3 h-3 text-emerald-500" />
                  <span>Dar Makas (&le; %1)</span>
                </button>

                <button
                  onClick={() => setConditionFilter('has_quote')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    conditionFilter === 'has_quote'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Aktif Fiyatı Olanlar
                </button>
              </div>

              {/* Reset Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={resetAllFilters}
                  className="flex items-center space-x-1 text-xs text-rose-500 hover:text-rose-600 font-bold transition py-1 px-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Sıfırla</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Row 3: Active Filters Summary & Result Count Strip */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">Görüntülenen:</span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded font-mono font-bold">
              {sortedProducts.length} Varlık
            </span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded font-mono font-bold">
              {visibleFirmKeys.length} Firma Sütunu
            </span>
            {hasActiveFilters && (
              <span className="text-amber-500 font-bold flex items-center space-x-1">
                <span>(Filtreler Aktif)</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 text-[11px]">
            <button
              onClick={() => setShowSummaryPills(!showSummaryPills)}
              className="text-amber-600 dark:text-amber-400 hover:underline font-bold"
            >
              {showSummaryPills ? 'Piyasa Özetini Gizle' : 'Piyasa Özetini Göster'}
            </button>
            <button
              onClick={() => setIsCustomOrderModalOpen(true)}
              className="text-slate-600 dark:text-slate-300 hover:underline font-bold"
            >
              Sırayı Düzenle
            </button>
          </div>
        </div>
      </div>

      {/* The Product List Rows Matching Screenshot 1:1 */}
      <div className="space-y-2.5">
        {sortedProducts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-12 text-center text-slate-500">
            <div className="flex flex-col items-center justify-center space-y-2">
              <Filter className="w-8 h-8 text-slate-400" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Seçilen filtrelere uygun varlık bulunamadı.
              </span>
              <p className="text-xs text-slate-400 max-w-sm">
                Arama teriminizi veya filtre tercihlerinizi değiştirerek daha fazla sonuç görüntüleyebilirsiniz.
              </p>
              <button
                onClick={resetAllFilters}
                className="mt-2 px-3 py-1.5 bg-amber-500 text-slate-950 font-black rounded-xl text-xs transition"
              >
                Tüm Filtreleri Temizle
              </button>
            </div>
          </div>
        ) : (
          sortedProducts.map((prod) => {
            const displayInfo = getProductDisplayInfo(prod.code, prod.name);
            const unit = getUnit(prod.code);

            // Find best buy & best sell across the visible firms
            let maxBuy = 0;
            let minSell = 99999999;
            let maxBuyFirmKey = '';
            let minSellFirmKey = '';
            let maxBuyFirmName = '';
            let minSellFirmName = '';
            let maxBuyItem: MarketItem | undefined;

            visibleFirmKeys.forEach((key) => {
              const s = sources[key];
              const item = s?.data?.find((d) => d.code === prod.code);
              if (item && item.buy > maxBuy) {
                maxBuy = item.buy;
                maxBuyFirmKey = key;
                maxBuyFirmName = FIRM_SHORT_LABELS[key] || s?.sourceName || key;
                maxBuyItem = item;
              }
              if (item && item.sell > 0 && item.sell < minSell) {
                minSell = item.sell;
                minSellFirmKey = key;
                minSellFirmName = FIRM_SHORT_LABELS[key] || s?.sourceName || key;
              }
            });

            const spreadTL = minSell < 99999999 && maxBuy > 0 ? minSell - maxBuy : 0;
            const spreadPercent = maxBuy > 0 && spreadTL !== 0 ? (spreadTL / maxBuy) * 100 : 0;
            const hasArbitrage = spreadTL < 0 && maxBuy > 0 && maxBuyFirmKey !== '' && minSellFirmKey !== '' && maxBuyFirmKey !== minSellFirmKey;

            return (
              <div
                key={prod.code}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow p-2.5 sm:p-3 flex items-center justify-between gap-2.5 sm:gap-3 overflow-x-auto min-w-0"
              >
                {/* 1. Left Asset Column (~140-160px): Flag + Code + Turkish Subtitle */}
                <div className="w-[145px] sm:w-[160px] shrink-0 flex items-center space-x-2.5">
                  {/* Flag or Gold Badge */}
                  {displayInfo.isFx ? (
                    <div className="w-8 h-8 rounded-full overflow-hidden shadow-2xs shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                      <CurrencyFlag
                        code={displayInfo.currencyCode}
                        size={32}
                        className="w-8 h-8 object-cover rounded-full"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full shadow-2xs shrink-0 flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black border border-amber-300">
                      <Coins className="w-4 h-4 text-slate-950" />
                    </div>
                  )}

                  {/* Title & Subtitle */}
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-black text-slate-900 dark:text-white leading-tight truncate">
                      {displayInfo.displayCode}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                      {displayInfo.subtitle}
                    </div>
                  </div>
                </div>

                {/* 2. Center: 7 Firm Cards / Capsules */}
                <div className="flex-1 flex items-center gap-1.5 sm:gap-2 min-w-0">
                  {visibleFirmKeys.map((key) => {
                    const s = sources[key];
                    const item = s?.data?.find((d) => d.code === prod.code);
                    const shortLabel = FIRM_SHORT_LABELS[key] || s?.sourceName || key;

                    const hasPrice = item && (item.buy > 0 || item.sell > 0);
                    const isMaxBuy = item && item.buy > 0 && item.buy === maxBuy;
                    const isMinSell = item && item.sell > 0 && item.sell === minSell && minSell < 99999999;
                    const isBestInFirm = isMaxBuy || isMinSell;

                    return (
                      <div
                        key={key}
                        className={`rounded-xl border p-2 min-w-[102px] sm:min-w-[110px] flex-1 max-w-[130px] flex flex-col justify-between transition-all select-none ${
                          isBestInFirm
                            ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 shadow-2xs'
                            : 'bg-slate-50/90 dark:bg-slate-800/40 border-slate-200/90 dark:border-slate-800'
                        }`}
                      >
                        {/* Capsule Header: Icon + Short Name */}
                        <div className="flex items-center space-x-1.5 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
                          <FirmLogo firmKey={key} size="xs" />
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                            {shortLabel}
                          </span>
                        </div>

                        {/* Capsule Body: A: buy / S: sell */}
                        {hasPrice ? (
                          <div className="pt-1.5 space-y-0.5">
                            {/* Alış Satırı */}
                            <div
                              className={`flex items-center text-[11px] font-bold font-mono tabular-nums ${
                                isMaxBuy
                                  ? 'text-emerald-800 dark:text-emerald-300 font-black'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {isMaxBuy && <span className="text-amber-500 mr-1 text-xs">★</span>}
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans mr-1 font-semibold">
                                A:
                              </span>
                              <span>{formatPrice(item?.buy, prod.code, key)}</span>
                            </div>

                            {/* Satış Satırı */}
                            <div
                              className={`flex items-center text-[11px] font-bold font-mono tabular-nums ${
                                isMinSell
                                  ? 'text-emerald-800 dark:text-emerald-300 font-black'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {isMinSell && <span className="text-amber-500 mr-1 text-xs">★</span>}
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans mr-1 font-semibold">
                                S:
                              </span>
                              <span>{formatPrice(item?.sell, prod.code, key)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-2 text-center text-slate-300 dark:text-slate-600 font-bold text-sm">
                            —
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 3. Right: 3 Stacked Summary Pills (~165-185px) */}
                {showSummaryPills && (
                  <div className="w-[165px] sm:w-[185px] shrink-0 flex flex-col gap-1.5 justify-center">
                      {/* Top Pill (Green): Alış [price] [icon] [firm] */}
                    <div
                      className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300/80 dark:border-emerald-700/60 rounded-xl px-2.5 py-1 flex items-center justify-between text-xs shadow-2xs"
                      title={`Piyasadaki En Yüksek Alış: ${formatPrice(maxBuy, prod.code)} (${maxBuyFirmName})`}
                    >
                      <span className="text-emerald-900 dark:text-emerald-200 font-black font-mono tabular-nums">
                        Alış {formatPrice(maxBuy, prod.code)}
                      </span>
                      <div className="flex items-center space-x-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 truncate max-w-[75px]">
                        {maxBuyFirmKey && <FirmLogo firmKey={maxBuyFirmKey} size="xs" />}
                        <span className="truncate">{maxBuyFirmName || '—'}</span>
                      </div>
                    </div>

                    {/* Middle Pill (Red): Satış [price] [icon] [firm] */}
                    <div
                      className="bg-rose-50 dark:bg-rose-950/50 border border-rose-300/80 dark:border-rose-700/60 rounded-xl px-2.5 py-1 flex items-center justify-between text-xs shadow-2xs"
                      title={`Piyasadaki En Düşük Satış: ${formatPrice(minSell < 99999999 ? minSell : 0, prod.code)} (${minSellFirmName})`}
                    >
                      <span className="text-rose-900 dark:text-rose-200 font-black font-mono tabular-nums">
                        Satış {formatPrice(minSell < 99999999 ? minSell : 0, prod.code)}
                      </span>
                      <div className="flex items-center space-x-1.5 text-[11px] font-bold text-rose-800 dark:text-rose-300 truncate max-w-[75px]">
                        {minSellFirmKey && <FirmLogo firmKey={minSellFirmKey} size="xs" />}
                        <span className="truncate">{minSellFirmName || '—'}</span>
                      </div>
                    </div>

                    {/* Bottom Pill (Slate): Makas [diff] ₺ · %[percent] */}
                    <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 rounded-xl px-2.5 py-1 flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 shadow-2xs">
                      {hasArbitrage ? (
                        <div className="w-full text-center text-amber-600 dark:text-amber-400 font-black flex items-center justify-center space-x-1 animate-pulse">
                          <Zap className="w-3 h-3 text-amber-500 inline" />
                          <span>Arbitraj: %{Math.abs(spreadPercent).toFixed(2)}</span>
                        </div>
                      ) : (
                        <>
                          <span className="font-mono tabular-nums">
                            Makas {formatPrice(Math.abs(spreadTL), prod.code)} {unit}
                          </span>
                          <span className="font-mono text-slate-500 dark:text-slate-400">
                            · %{isFinite(spreadPercent) ? Math.abs(spreadPercent).toFixed(2) : '0.00'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
