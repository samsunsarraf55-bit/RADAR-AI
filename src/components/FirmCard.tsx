import React, { useState, useEffect } from 'react';
import { SourceData, MarketItem, SourcesMap } from '../types/market';
import { useSort } from '../context/SortContext';
import { useTheme } from '../context/ThemeContext';
import { CellConfig, FirmCardSettingsModal } from './FirmCardSettingsModal';
import { SarDovizCardView } from './SarDovizCardView';
import { KaptanCardView } from './KaptanCardView';
import { GunesCardView } from './GunesCardView';
import { getFirmBrandStyle } from '../utils/firmColors';
import { findItemArbitrageDeal } from '../services/arbitrageAlertService';
import { CurrencyFlag } from './CurrencyFlag';
import { FirmLogo } from './FirmLogo';
import { isFxItem, getCleanCurrencyCode, getStandardizedProductName } from '../utils/productUtils';
import {
  GlobalDisplayMode,
  StandardThemeId,
  FontScaleMode,
} from '../types/theme';
import {
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Calculator,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  TrendingUp,
  Settings,
  Coins,
  Gem,
  Landmark,
  Shield,
  EyeOff,
  Zap,
} from 'lucide-react';

interface FirmCardProps {
  sourceKey: string;
  sourceData: SourceData;
  allSources?: SourcesMap;
  globalSearch?: string;
  selectedProductCode?: string | null;
  selectedCategory?: 'all' | 'gold' | 'fx' | 'popular' | 'tight_spread';
  compact?: boolean;
  globalDisplayMode?: GlobalDisplayMode;
  standardTheme?: StandardThemeId;
  fontScale?: FontScaleMode;
  onSelectForCalculator?: (item: MarketItem, firmName: string) => void;
  onOpenPriceHistory?: (code: string, firmKey?: string) => void;
  onHideFirm?: (key: string) => void;
  onOpenSettings?: (firmKey: string) => void;
}

type CardSortType =
  | 'default'
  | 'name_asc'
  | 'name_desc'
  | 'buy_desc'
  | 'buy_asc'
  | 'sell_desc'
  | 'sell_asc'
  | 'spread_asc'
  | 'spread_desc'
  | 'change_desc';

// Authentic SAR Logo matching photo
const SarVectorLogo: React.FC<{ isLight?: boolean }> = ({ isLight = false }) => (
  <div className="flex flex-col items-center justify-center shrink-0 pr-1 select-none">
    <div className="relative flex items-center justify-center h-5">
      <svg viewBox="0 0 64 20" className="w-13 h-5">
        <path d="M 4,16 Q 32,2 60,16" fill="none" stroke="#c59b51" strokeWidth="2.8" strokeLinecap="round" />
        <text
          x="32"
          y="18"
          textAnchor="middle"
          fill={isLight ? '#0f172a' : '#f8fafc'}
          fontWeight="900"
          fontSize="13"
          letterSpacing="1.2"
          fontFamily="system-ui, sans-serif"
        >
          SAR
        </text>
      </svg>
    </div>
    <span className="text-[6.5px] font-black tracking-tight uppercase whitespace-nowrap text-[#c59b51] scale-95">
      SAR DÖVİZ YETKİLİ MÜESSESE A.Ş.
    </span>
  </div>
);

// Authentic Kaptan Logo matching photo
const KaptanVectorLogo: React.FC<{ isLight?: boolean }> = ({ isLight = false }) => (
  <div className="flex items-center space-x-1.5 select-none shrink-0 pr-1">
    <div className="w-6 h-6 rounded-lg bg-[#121a2d] border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm shrink-0">
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
      </svg>
    </div>
    <div className="flex flex-col">
      <span className="text-[11px] font-black tracking-wider text-[#a81c24] leading-tight">
        KAPTAN
      </span>
      <span className="text-[7px] font-bold tracking-tight uppercase text-slate-500 leading-none">
        ALTIN & DÖVİZ
      </span>
    </div>
  </div>
);

// Authentic Güneş Logo matching photo
const GunesVectorLogo: React.FC<{ isLight?: boolean }> = ({ isLight = false }) => (
  <div className="flex items-center space-x-1.5 select-none shrink-0 pr-1">
    <div className="w-6 h-6 rounded-lg bg-[#14100e] border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-sm shrink-0">
      <svg viewBox="0 0 32 18" className="w-4 h-3 text-amber-400">
        <polygon points="16,1 31,9 16,17 1,9" fill="none" stroke="#d4af37" strokeWidth="2.2" />
        <line x1="8" y1="9" x2="24" y2="9" stroke="#d4af37" strokeWidth="1.4" />
        <line x1="16" y1="1" x2="16" y2="17" stroke="#d4af37" strokeWidth="1.4" />
      </svg>
    </div>
    <div className="flex flex-col">
      <span className="text-[11px] font-serif font-black tracking-widest text-amber-400 leading-tight">
        GÜNEŞ
      </span>
      <span className="text-[6.5px] font-bold tracking-tight uppercase text-stone-400 leading-none">
        KUYUMCULUK
      </span>
    </div>
  </div>
);

export const FirmCard: React.FC<FirmCardProps> = ({
  sourceKey,
  sourceData,
  allSources,
  globalSearch = '',
  selectedProductCode = null,
  selectedCategory = 'all',
  compact = false,
  globalDisplayMode = 'store_custom',
  standardTheme = 'dark_gold',
  fontScale = 'normal',
  onSelectForCalculator,
  onOpenPriceHistory,
  onHideFirm,
  onOpenSettings,
}) => {
  const { sortMarketItems } = useSort();
  const [localSearch, setLocalSearch] = useState('');
  const [showMeta, setShowMeta] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'gold' | 'fx'>('all');
  const [cardSort, setCardSort] = useState<CardSortType>('default');

  // Hücre İçi Gelişmiş Ayarlar (İsim, Logo, Tagline, Görünüm Modu, Tema, Ondalık, Kurlar)
  const STORAGE_KEY_CONFIG = `samsun_sarraf_cell_config_${sourceKey}`;
  const [cellConfig, setCellConfig] = useState<CellConfig>(() => {
    const isSarDoviz = sourceKey === 'sar_doviz';
    const isKaptan = sourceKey === 'kaptan_doviz';
    const isGunes = sourceKey === 'gunes_kuyumculuk';

    const defaultTitle = sourceData?.sourceName || (
      isSarDoviz ? 'SAR Döviz' :
      isKaptan ? 'Kaptan Altın & Döviz' :
      isGunes ? 'Güneş Kuyumculuk' :
      sourceKey === 'solis_doviz' ? 'Solis Döviz' :
      sourceKey === 'altinkose' ? 'Altınköşe Kuyumculuk' :
      sourceKey === 'ilkay_doviz' ? 'İlkay Döviz' :
      sourceKey === 'vizyon_altin' ? 'Vizyon Kuyumculuk' : sourceKey
    );
    const defaultTagline = isSarDoviz ? 'A GRUBU YETKİLİ MÜESSESE' : isKaptan ? 'DÖVİZ & ALTIN PİYASASI' : isGunes ? 'MEYDAN · ÇARŞI · TÜRKİŞ · CİTYMALL' : '';
    const defaultEmblem = isSarDoviz ? 'sar' : isKaptan ? 'kaptan' : isGunes ? 'gunes' : 'none';
    const defaultView = isSarDoviz ? 'sar_cards' : isKaptan ? 'kaptan_table' : isGunes ? 'gunes_terminal' : 'standard_table';
    const defaultDecimals = isSarDoviz || isKaptan ? 3 : 2;
    const defaultTheme = isGunes ? 'dark_gold' : 'photo_light';

    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            customTitle: parsed.customTitle || defaultTitle,
            customTagline: parsed.customTagline ?? defaultTagline,
            emblemType: parsed.emblemType || defaultEmblem,
            customLogoUrl: parsed.customLogoUrl || '',
            viewMode: parsed.viewMode || defaultView,
            cardTheme: parsed.cardTheme || defaultTheme,
            decimals: typeof parsed.decimals === 'number' ? parsed.decimals : defaultDecimals,
            visibleCodes: Array.isArray(parsed.visibleCodes) ? parsed.visibleCodes : [],
          };
        }
      }
      // Migration from previous visible-only storage
      const oldVisible = localStorage.getItem(`samsun_sarraf_visible_${sourceKey}`);
      const visibleCodes = oldVisible ? JSON.parse(oldVisible) : [];
      return {
        customTitle: defaultTitle,
        customTagline: defaultTagline,
        emblemType: defaultEmblem,
        customLogoUrl: '',
        viewMode: defaultView,
        cardTheme: defaultTheme,
        decimals: defaultDecimals,
        visibleCodes: Array.isArray(visibleCodes) ? visibleCodes : [],
      };
    } catch {}
    return {
      customTitle: defaultTitle,
      customTagline: defaultTagline,
      emblemType: defaultEmblem,
      customLogoUrl: '',
      viewMode: defaultView,
      cardTheme: defaultTheme,
      decimals: defaultDecimals,
      visibleCodes: [],
    };
  });

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const handleSaveConfig = (newConfig: CellConfig) => {
    setCellConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(newConfig));
    } catch {}
  };

  const handleResetToDefault = () => {
    const isSarDoviz = sourceKey === 'sar_doviz';
    const isKaptan = sourceKey === 'kaptan_doviz';
    const isGunes = sourceKey === 'gunes_kuyumculuk';

    const def: CellConfig = {
      customTitle: sourceData.sourceName || (isSarDoviz ? 'SAR Döviz' : isKaptan ? 'Kaptan' : isGunes ? 'Güneş' : sourceKey === 'solis_doviz' ? 'Solis' : sourceKey === 'altinkose' ? 'Altınköşe' : sourceKey === 'ilkay_doviz' ? 'İlkay' : sourceKey === 'vizyon_altin' ? 'Vizyon' : sourceKey),
      customTagline: isSarDoviz ? 'A GRUBU YETKİLİ MÜESSESE' : isKaptan ? 'DÖVİZ & ALTIN PİYASASI' : isGunes ? 'MEYDAN · ÇARŞI · TÜRKİŞ · CİTYMALL' : '',
      emblemType: isSarDoviz ? 'sar' : isKaptan ? 'kaptan' : isGunes ? 'gunes' : 'none',
      customLogoUrl: '',
      viewMode: isSarDoviz ? 'sar_cards' : isKaptan ? 'kaptan_table' : isGunes ? 'gunes_terminal' : 'standard_table',
      cardTheme: isGunes ? 'dark_gold' : 'photo_light',
      decimals: isSarDoviz || isKaptan ? 3 : 2,
      visibleCodes: [],
    };
    setCellConfig(def);
    try {
      localStorage.removeItem(STORAGE_KEY_CONFIG);
      localStorage.removeItem(`samsun_sarraf_visible_${sourceKey}`);
      window.dispatchEvent(new Event('sarraf_cell_config_updated'));
    } catch {}
  };

  // Listen for configuration updates from SettingsModal or FirmCardSettingsModal
  useEffect(() => {
    const handleConfigSync = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            setCellConfig(parsed);
          }
        }
      } catch {}
    };

    window.addEventListener('storage', handleConfigSync);
    window.addEventListener('sarraf_cell_config_updated', handleConfigSync);
    return () => {
      window.removeEventListener('storage', handleConfigSync);
      window.removeEventListener('sarraf_cell_config_updated', handleConfigSync);
    };
  }, [STORAGE_KEY_CONFIG]);

  const visibleCodes = cellConfig.visibleCodes || [];

  // When globalDisplayMode is 'standard_table', force all cards into uniform standard table view
  const effectiveViewMode =
    globalDisplayMode === 'standard_table'
      ? 'standard_table'
      : cellConfig.viewMode;

  const { isDark } = useTheme();
  const brandStyle = getFirmBrandStyle(sourceKey, cellConfig.customTitle || sourceData?.sourceName);

  const isLight =
    !isDark &&
    (effectiveViewMode === 'standard_table'
      ? standardTheme === 'light_clarity' || standardTheme === 'warm_cream'
      : cellConfig.cardTheme === 'photo_light');

  // Card theme classes
  const getCardBgClass = () => {
    if (effectiveViewMode === 'standard_table') {
      switch (standardTheme) {
        case 'light_clarity':
          return 'bg-white border-slate-300 shadow-md text-slate-900';
        case 'warm_cream':
          return 'bg-[#fcf9f2] border-stone-300 shadow-md text-stone-900';
        case 'midnight_navy':
          return 'bg-[#091124] border-[#1d2d52] shadow-xl text-slate-100';
        case 'emerald_sarraf':
          return 'bg-[#04160f] border-emerald-900/60 shadow-xl text-slate-100';
        case 'digital_led':
          return 'bg-[#020202] border-[#262626] shadow-2xl text-slate-100 font-mono';
        case 'dark_gold':
        default:
          return 'bg-[#0b0f19] border-amber-500/25 shadow-xl text-slate-100';
      }
    }
    return isLight
      ? 'bg-white border-slate-300/80 shadow-slate-200/50'
      : 'bg-slate-950/80 border-slate-800/90 hover:border-slate-700';
  };

  const getCardHeaderClass = () => {
    if (effectiveViewMode === 'standard_table') {
      switch (standardTheme) {
        case 'light_clarity':
          return 'bg-slate-100/95 border-slate-200 text-slate-900';
        case 'warm_cream':
          return 'bg-[#f4efe4] border-stone-300 text-stone-900';
        case 'midnight_navy':
          return 'bg-[#0f1b38] border-[#1d2d52] text-white';
        case 'emerald_sarraf':
          return 'bg-[#082218] border-emerald-900/60 text-white';
        case 'digital_led':
          return 'bg-[#080808] border-[#262626] text-amber-400 font-mono';
        case 'dark_gold':
        default:
          return 'bg-[#111625] border-slate-800 text-white';
      }
    }
    return isLight
      ? 'bg-slate-50/90 border-slate-200 text-slate-900'
      : 'bg-slate-900/90 border-slate-800/80 text-white';
  };

  const getDataContainerClass = () => {
    if (effectiveViewMode === 'standard_table') {
      switch (standardTheme) {
        case 'light_clarity':
          return 'bg-white';
        case 'warm_cream':
          return 'bg-[#fcf9f2]';
        case 'midnight_navy':
          return 'bg-[#080e20]';
        case 'emerald_sarraf':
          return 'bg-[#03130d]';
        case 'digital_led':
          return 'bg-[#000000]';
        case 'dark_gold':
        default:
          return 'bg-[#090d16]';
      }
    }
    return isLight ? 'bg-slate-100/80' : 'bg-slate-950/60';
  };

  const getTheadClass = () => {
    if (effectiveViewMode === 'standard_table') {
      switch (standardTheme) {
        case 'light_clarity':
          return 'bg-slate-100/95 text-slate-700 border-slate-300 font-bold';
        case 'warm_cream':
          return 'bg-[#efe9dc]/95 text-stone-800 border-stone-300 font-bold';
        case 'midnight_navy':
          return 'bg-[#0d1833]/95 text-cyan-300 border-[#1d2d52] font-bold';
        case 'emerald_sarraf':
          return 'bg-[#061e15]/95 text-amber-300 border-emerald-900/60 font-bold';
        case 'digital_led':
          return 'bg-[#060606]/95 text-amber-400 border-[#262626] font-mono font-bold';
        case 'dark_gold':
        default:
          return 'bg-[#0e1424]/95 text-amber-400 border-slate-800 font-bold';
      }
    }
    return 'bg-slate-950/95 text-slate-400 border-slate-800 font-bold';
  };

  const getRowClass = (isPulseUp: boolean, isPulseDown: boolean) => {
    const pulse = isPulseUp ? 'price-up' : isPulseDown ? 'price-down' : '';
    if (effectiveViewMode === 'standard_table') {
      switch (standardTheme) {
        case 'light_clarity':
          return `hover:bg-amber-50/70 border-b border-slate-200/80 even:bg-slate-50/60 ${pulse}`;
        case 'warm_cream':
          return `hover:bg-amber-100/60 border-b border-stone-200/80 even:bg-stone-100/50 ${pulse}`;
        case 'midnight_navy':
          return `hover:bg-cyan-500/10 border-b border-[#14213d] even:bg-white/[0.02] ${pulse}`;
        case 'emerald_sarraf':
          return `hover:bg-emerald-500/10 border-b border-emerald-950/80 even:bg-white/[0.02] ${pulse}`;
        case 'digital_led':
          return `hover:bg-amber-500/5 border-b border-[#181818] even:bg-white/[0.01] ${pulse}`;
        case 'dark_gold':
        default:
          return `hover:bg-amber-500/10 border-b border-slate-800/70 even:bg-white/[0.02] ${pulse}`;
      }
    }
    return `hover:bg-slate-900/50 transition-colors ${pulse}`;
  };

  const getItemNameClass = () => {
    let base = 'font-bold truncate ';
    if (effectiveViewMode === 'standard_table') {
      switch (standardTheme) {
        case 'light_clarity':
          base += 'text-slate-950 group-hover:text-amber-700 ';
          break;
        case 'warm_cream':
          base += 'text-stone-950 group-hover:text-amber-800 ';
          break;
        case 'midnight_navy':
          base += 'text-slate-100 group-hover:text-cyan-300 ';
          break;
        case 'emerald_sarraf':
          base += 'text-slate-100 group-hover:text-amber-300 ';
          break;
        case 'digital_led':
          base += 'text-amber-300 font-mono tracking-tight ';
          break;
        case 'dark_gold':
        default:
          base += 'text-slate-100 group-hover:text-amber-400 ';
          break;
      }
    } else {
      base += 'text-slate-100 group-hover:text-amber-400 ';
    }

    if (fontScale === 'xlarge') return base + 'text-sm sm:text-base max-w-[150px] sm:max-w-[190px]';
    if (fontScale === 'large') return base + 'text-[13px] sm:text-sm max-w-[130px] sm:max-w-[170px]';
    return base + (compact ? 'text-[11px] max-w-[105px] sm:max-w-[125px]' : 'text-xs max-w-[130px] sm:max-w-[160px]');
  };

  const getBuyPriceClass = () => {
    let color = 'text-emerald-400 font-extrabold';
    if (effectiveViewMode === 'standard_table') {
      switch (standardTheme) {
        case 'light_clarity':
          color = 'text-emerald-700 font-black';
          break;
        case 'warm_cream':
          color = 'text-emerald-800 font-black';
          break;
        case 'digital_led':
          color = 'text-[#22c55e] font-black font-mono';
          break;
        case 'emerald_sarraf':
          color = 'text-emerald-300 font-black';
          break;
        case 'midnight_navy':
          color = 'text-teal-300 font-extrabold';
          break;
        case 'dark_gold':
        default:
          color = 'text-emerald-400 font-extrabold';
          break;
      }
    }

    if (fontScale === 'xlarge') return `${color} text-sm sm:text-base md:text-[17px] font-mono tabular-nums whitespace-nowrap`;
    if (fontScale === 'large') return `${color} text-xs sm:text-sm md:text-[15px] font-mono tabular-nums whitespace-nowrap`;
    return `${color} ${compact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'} font-mono tabular-nums whitespace-nowrap`;
  };

  const getSellPriceClass = () => {
    let color = 'text-rose-400 font-extrabold';
    if (effectiveViewMode === 'standard_table') {
      switch (standardTheme) {
        case 'light_clarity':
          color = 'text-rose-700 font-black';
          break;
        case 'warm_cream':
          color = 'text-rose-800 font-black';
          break;
        case 'digital_led':
          color = 'text-[#ef4444] font-black font-mono';
          break;
        case 'emerald_sarraf':
          color = 'text-rose-400 font-black';
          break;
        case 'midnight_navy':
          color = 'text-rose-400 font-extrabold';
          break;
        case 'dark_gold':
        default:
          color = 'text-rose-400 font-extrabold';
          break;
      }
    }

    if (fontScale === 'xlarge') return `${color} text-sm sm:text-base md:text-[17px] font-mono tabular-nums whitespace-nowrap`;
    if (fontScale === 'large') return `${color} text-xs sm:text-sm md:text-[15px] font-mono tabular-nums whitespace-nowrap`;
    return `${color} ${compact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'} font-mono tabular-nums whitespace-nowrap`;
  };

  const getCardFooterClass = () => {
    if (effectiveViewMode === 'standard_table') {
      switch (standardTheme) {
        case 'light_clarity':
          return 'bg-slate-100/90 border-slate-200 text-slate-500';
        case 'warm_cream':
          return 'bg-[#f4efe4] border-stone-300 text-stone-600';
        case 'midnight_navy':
          return 'bg-[#091124] border-[#1d2d52] text-slate-400';
        case 'emerald_sarraf':
          return 'bg-[#04160f] border-emerald-900/60 text-emerald-400/80';
        case 'digital_led':
          return 'bg-[#040404] border-[#1a1a1a] text-amber-500/70 font-mono';
        case 'dark_gold':
        default:
          return 'bg-[#0b0f19] border-slate-900 text-slate-400';
      }
    }
    return isLight
      ? 'bg-slate-100/90 border-slate-200 text-slate-500'
      : 'bg-slate-950 border-slate-900 text-slate-500';
  };

  const formatPrice = (val: number, code: string) => {
    if (val === undefined || val === null || isNaN(val) || val === 0) return '-';
    const c = String(code || '');

    // Altınköşe gümüş kuralı: virgülden sonra 0,50'nin üzerindeyse yukarı, altındaysa aşağı yuvarla; 2 hane göster
    if (sourceKey === 'altinkose' && c === 'GUMUS') {
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

    const isFx =
      c.includes('TRY') &&
      !c.startsWith('ALTIN') &&
      !c.startsWith('CEYREK') &&
      !c.startsWith('YARIM') &&
      !c.startsWith('TAM') &&
      !c.startsWith('ATA') &&
      !c.startsWith('GREMSE');

    const decimalsToUse = cellConfig.decimals || (isFx ? 4 : 2);

    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: decimalsToUse,
      maximumFractionDigits: decimalsToUse,
    }).format(val);
  };

  const formatTime = (isoString: string | null | undefined) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('tr-TR');
    } catch {
      return '-';
    }
  };

  const items = Array.isArray(sourceData?.data) ? sourceData.data : [];

  const filteredItems = items.filter((item) => {
    if (!item) return false;
    const itemCode = String(item.code || '');
    if (itemCode === 'ONS') return false;
    const itemName = String(item.name || '');

    // 1. Hücre içi özel kur seçimi filtresi
    if (visibleCodes.length > 0 && !visibleCodes.includes(itemCode)) {
      return false;
    }

    // 2. Seçili özel ürün filtresi (ProductFilterBar)
    if (selectedProductCode && itemCode !== selectedProductCode) {
      return false;
    }

    // 3. Profesyonel Kategori Filtresi (ProductFilterBar)
    if (selectedCategory === 'gold') {
      const isGold =
        itemCode.startsWith('ALTIN') ||
        itemCode.startsWith('CEYREK') ||
        itemCode.startsWith('YARIM') ||
        itemCode.startsWith('TAM') ||
        itemCode.startsWith('ATA') ||
        itemCode.startsWith('GREMSE') ||
        itemCode === 'ONS' ||
        itemCode === 'GUMUS' ||
        itemCode === 'RESAT_LIRA' ||
        itemCode === 'XAU_KULCE';
      if (!isGold) return false;
    } else if (selectedCategory === 'fx') {
      const isFx =
        itemCode.includes('TRY') &&
        !itemCode.startsWith('ALTIN') &&
        !itemCode.startsWith('CEYREK') &&
        !itemCode.startsWith('YARIM') &&
        !itemCode.startsWith('TAM') &&
        !itemCode.startsWith('ATA') &&
        !itemCode.startsWith('GREMSE');
      if (!isFx) return false;
    } else if (selectedCategory === 'popular') {
      const popular = [
        'ALTIN_HAS',
        'ALTIN_22',
        'CEYREK_YENI',
        'TAM_YENI',
        'ATA_YENI',
        'USDTRY',
        'EURTRY',
        'GBPTRY',
      ];
      if (!popular.includes(itemCode)) return false;
    } else if (selectedCategory === 'tight_spread') {
      const buy = item.buy || 0;
      const sell = item.sell || 0;
      if (buy > 0 && sell > 0) {
        const spread = sell - buy;
        const pct = (spread / buy) * 100;
        if (pct > 1.2) return false;
      }
    }

    // 4. Arama filtresi
    const query = (localSearch || globalSearch).toLowerCase().trim();
    if (query && !itemName.toLowerCase().includes(query) && !itemCode.toLowerCase().includes(query)) {
      return false;
    }

    // 5. Kart içi yerel Altın / Döviz sekme filtresi
    if (filterType === 'gold') {
      return (
        itemCode.startsWith('ALTIN') ||
        itemCode.startsWith('CEYREK') ||
        itemCode.startsWith('YARIM') ||
        itemCode.startsWith('TAM') ||
        itemCode.startsWith('ATA') ||
        itemCode.startsWith('GREMSE') ||
        itemCode === 'ONS' ||
        itemCode === 'GUMUS' ||
        itemCode === 'RESAT_LIRA' ||
        itemCode === 'XAU_KULCE'
      );
    }
    if (filterType === 'fx') {
      return (
        itemCode.includes('TRY') &&
        !itemCode.startsWith('ALTIN') &&
        !itemCode.startsWith('CEYREK') &&
        !itemCode.startsWith('YARIM') &&
        !itemCode.startsWith('TAM') &&
        !itemCode.startsWith('ATA') &&
        !itemCode.startsWith('GREMSE')
      );
    }

    return true;
  });

  // Cell-level product sorting logic
  const getSortedItems = (): MarketItem[] => {
    if (cardSort === 'default') {
      return sortMarketItems(filteredItems);
    }

    const list = [...filteredItems];
    switch (cardSort) {
      case 'name_asc':
        return list.sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'tr-TR'));
      case 'name_desc':
        return list.sort((a, b) => String(b?.name || '').localeCompare(String(a?.name || ''), 'tr-TR'));
      case 'buy_desc':
        return list.sort((a, b) => (b?.buy || 0) - (a?.buy || 0));
      case 'buy_asc':
        return list.sort((a, b) => (a?.buy || 0) - (b?.buy || 0));
      case 'sell_desc':
        return list.sort((a, b) => (b?.sell || 0) - (a?.sell || 0));
      case 'sell_asc':
        return list.sort((a, b) => (a?.sell || 0) - (b?.sell || 0));
      case 'spread_asc':
        return list.sort((a, b) => ((a?.sell || 0) - (a?.buy || 0)) - ((b?.sell || 0) - (b?.buy || 0)));
      case 'spread_desc':
        return list.sort((a, b) => ((b?.sell || 0) - (b?.buy || 0)) - ((a?.sell || 0) - (a?.buy || 0)));
      case 'change_desc':
        return list.sort((a, b) => Math.abs(b?.changeRate || 0) - Math.abs(a?.changeRate || 0));
      default:
        return sortMarketItems(filteredItems);
    }
  };

  const displayItems = getSortedItems();

  return (
    <div
      className={`border rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between transition-colors ${getCardBgClass()}`}
    >
      {/* Card Header */}
      <div
        className={`${compact ? 'p-2.5 sm:p-3' : 'p-3.5 sm:p-4'} border-b transition-colors ${getCardHeaderClass()}`}
      >
        <div className="flex justify-between items-center gap-2">
          {/* Title & Emblem Section */}
          <div className="min-w-0 flex-1 flex items-center space-x-2">
            {/* Custom Logo Image URL if user set one */}
            {cellConfig.emblemType === 'custom' && cellConfig.customLogoUrl && (
              <img
                src={cellConfig.customLogoUrl}
                alt="Logo"
                className="w-6 h-6 object-contain rounded shrink-0 shadow-sm"
              />
            )}

            {/* Optional Custom Emblems */}
            {cellConfig.emblemType === 'gold_coin' && (
              <Coins className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            {cellConfig.emblemType === 'diamond' && (
              <Gem className="w-5 h-5 text-cyan-400 shrink-0" />
            )}
            {cellConfig.emblemType === 'bank' && (
              <Landmark className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            {cellConfig.emblemType === 'vault' && (
              <Shield className="w-5 h-5 text-rose-400 shrink-0" />
            )}

            {/* Firm Title & Status Indicator */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    sourceData.status === 'connected' || sourceData.status === 'active'
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                      : sourceData.status === 'initializing'
                      ? 'bg-amber-400'
                      : 'bg-rose-400'
                  }`}
                />
                <FirmLogo
                  firmKey={sourceKey}
                  firmName={cellConfig.customTitle || sourceData.sourceName}
                  size={compact ? 'sm' : 'md'}
                />
                <h2
                  className={`font-bold tracking-tight truncate ${
                    compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
                  } ${
                    isLight ? 'text-slate-900' : `${brandStyle.textColor} drop-shadow-xs`
                  }`}
                >
                  {cellConfig.customTitle || sourceData.sourceName}
                </h2>
              </div>
              {cellConfig.customTagline && (
                <div
                  className={`text-[10px] font-medium truncate mt-0.5 ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                  title={cellConfig.customTagline}
                >
                  {cellConfig.customTagline}
                </div>
              )}
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-1 shrink-0">
            {/* Hücre İçi Ayarlar Çarkı (Görünecek İsim, Logo, Detaylar ve Kur Seçimi) */}
            <button
              onClick={() => {
                if (onOpenSettings) {
                  onOpenSettings(sourceKey);
                } else {
                  setIsSettingsModalOpen(true);
                }
              }}
              className={`p-1.5 rounded-lg transition relative ${
                visibleCodes.length > 0 || cellConfig.customTitle !== sourceData.sourceName
                  ? 'text-amber-400 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Hücre Ayarları: Görünecek İsim, Logo, Kart Görünümü ve Kurları Düzenle"
            >
              <Settings className="w-4 h-4" />
              {(visibleCodes.length > 0 || cellConfig.customTitle !== sourceData.sourceName) && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-0.5 right-0.5" />
              )}
            </button>

            {/* Firmayı Ana Sayfadan Kaldır / Gizle Butonu */}
            {onHideFirm && (
              <button
                onClick={() => onHideFirm(sourceKey)}
                className={`p-1.5 rounded-lg transition ${
                  isLight
                    ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                    : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                }`}
                title={`${cellConfig.customTitle || sourceData.sourceName} firmasını ana sayfadan kaldır / gizle`}
              >
                <EyeOff className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setShowMeta(!showMeta)}
              className={`p-1.5 rounded-lg transition ${
                isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="Mağaza Detayları & Bilgi"
            >
              {showMeta ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Sub-Header Metadata Tags */}
        <div
          className={`flex flex-wrap items-center gap-1.5 mt-1 text-[10px] ${
            isLight ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          <span>
            {sourceData.category === 'doviz'
              ? 'Döviz Bürosu'
              : sourceData.category === 'kuyumcu'
              ? 'Kuyumcu & Sarraf'
              : 'Serbest Piyasa'}
          </span>
          <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">·</span>
          <span className={`font-mono ${visibleCodes.length > 0 ? 'text-amber-500 font-semibold' : ''}`}>
            {visibleCodes.length > 0 ? `${filteredItems.length}/${items.length} kur` : `${items.length} kur`}
          </span>
          {cellConfig.viewMode === 'gunes_terminal' && (
            <>
              <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">·</span>
              <span className="text-amber-400 font-medium">Güneş Orijinal Terminal</span>
            </>
          )}
          {cellConfig.viewMode === 'kaptan_table' && (
            <>
              <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">·</span>
              <span className="text-[#a81c24] font-medium">Kaptan Orijinal Tablo</span>
            </>
          )}
          {cellConfig.viewMode === 'kaptan_cards' && (
            <>
              <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">·</span>
              <span className="text-[#a81c24] font-medium">Kaptan Mobil Kartlar</span>
            </>
          )}
          {cellConfig.viewMode === 'sar_cards' && (
            <>
              <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">·</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">SAR Kart Dizilimi</span>
            </>
          )}
        </div>

        {/* Unboxed Firm Details */}
        {showMeta && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400 space-y-1">
            {sourceKey === 'altinkose' && (
              <div className="text-slate-300 flex items-center space-x-1 mb-1 pb-1 border-b border-slate-800/60">
                <span className="text-slate-500">Kaynak:</span>
                <a
                  href="https://www.altinkose.com.tr/canli-altin-fiyatlari"
                  target="_blank"
                  rel="noreferrer"
                  className="text-yellow-400 hover:text-yellow-300 font-medium underline underline-offset-2 flex items-center space-x-1"
                >
                  <span>altinkose.com.tr</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </div>
            )}
            {sourceKey === 'ilkay_doviz' && (
              <div className="space-y-1 mb-1 pb-1 border-b border-slate-800/60">
                <div className="text-slate-300 flex items-center space-x-1">
                  <span className="text-slate-500">Fiyat Ekranı:</span>
                  <a
                    href="https://ilkaydoviz.sdatam.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-2 flex items-center space-x-1"
                  >
                    <span>ilkaydoviz.sdatam.com</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                </div>
                <div className="text-slate-300 flex items-center space-x-1">
                  <span className="text-slate-500">İç Ekran (Mağaza TV):</span>
                  <a
                    href="https://ilkaydoviz.sdatam.com/TV"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-400 hover:text-amber-300 font-medium underline underline-offset-2 flex items-center space-x-1"
                  >
                    <span>ilkaydoviz.sdatam.com/TV</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                </div>
              </div>
            )}
            {sourceKey === 'kaptan_doviz' && (
              <div className="text-slate-300 flex items-center space-x-1 mb-1 pb-1 border-b border-slate-800/60">
                <span className="text-slate-500">Kaynak:</span>
                <a
                  href="https://www.kaptandoviz.com/kurlar/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:text-amber-300 font-medium underline underline-offset-2 flex items-center space-x-1"
                >
                  <span>kaptandoviz.com</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </div>
            )}
            {sourceKey === 'gunes_kuyumculuk' && (
              <div className="space-y-1 mb-1 pb-1 border-b border-slate-800/60">
                <div className="text-slate-300 flex items-center space-x-1">
                  <span className="text-slate-500">Kaynak:</span>
                  <a
                    href="https://fiyat.guneskuyumculuk.net/meydan"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-400 hover:text-amber-300 font-medium underline underline-offset-2 flex items-center space-x-1"
                  >
                    <span>guneskuyumculuk.net</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                </div>
              </div>
            )}
            {sourceKey === 'vizyon_altin' && (
              <div className="space-y-1 mb-1 pb-1 border-b border-slate-800/60">
                <div className="text-slate-300 flex items-center space-x-1">
                  <span className="text-slate-500">Fiyat Ekranı:</span>
                  <a
                    href="https://vizyonkuyumcu.com.tr/fiyat"
                    target="_blank"
                    rel="noreferrer"
                    className="text-violet-400 hover:text-violet-300 font-medium underline underline-offset-2 flex items-center space-x-1"
                  >
                    <span>vizyonkuyumcu.com.tr/fiyat</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                </div>
                <div className="text-slate-300 flex items-center space-x-1">
                  <span className="text-slate-500">Veri Motoru:</span>
                  <span className="text-slate-400 font-mono">Fiyat Bağlantısı</span>
                </div>
              </div>
            )}
            {sourceKey === 'sar_doviz' && (
              <div className="space-y-1 mb-1 pb-1 border-b border-slate-800/60">
                <div className="text-slate-300 flex items-center space-x-1">
                  <span className="text-slate-500">Web Sitesi:</span>
                  <a
                    href="https://sardoviz.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2 flex items-center space-x-1"
                  >
                    <span>sardoviz.com</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                </div>
                <div className="text-slate-300 flex items-center space-x-1">
                  <span className="text-slate-500">JSON Veri Beslemesi:</span>
                  <a
                    href="https://sardoviz.com/?ajax=1"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 font-mono text-[10px] underline underline-offset-2 flex items-center space-x-1"
                  >
                    <span>sardoviz.com/?ajax=1</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                </div>
              </div>
            )}
            {sourceData.location && (
              <div className="text-slate-300">
                <span className="text-slate-500">Adres:</span> {sourceData.location}
              </div>
            )}
            {sourceData.phone && (
              <div className="text-slate-300">
                <span className="text-slate-500">Tel:</span> {sourceData.phone}
              </div>
            )}
          </div>
        )}

        {/* Filter Tabs, Sort Selector & Local Search */}
        <div className={`flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-800/60 ${compact ? 'mt-2 pt-2' : 'mt-3 pt-2.5'}`}>
          <div className="flex items-center space-x-0.5 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-1.5 py-0.5 rounded-md font-medium transition text-[11px] ${
                filterType === 'all'
                  ? 'bg-amber-500/20 text-amber-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setFilterType('gold')}
              className={`px-1.5 py-0.5 rounded-md font-medium transition text-[11px] ${
                filterType === 'gold'
                  ? 'bg-amber-500/20 text-amber-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Altın
            </button>
            <button
              onClick={() => setFilterType('fx')}
              className={`px-1.5 py-0.5 rounded-md font-medium transition text-[11px] ${
                filterType === 'fx'
                  ? 'bg-amber-500/20 text-amber-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Döviz
            </button>
          </div>

          <div className="flex items-center space-x-1 ml-auto">
            {/* Hücre İçi Ürün Sıralama Seçici */}
            <div className="relative flex items-center">
              <ArrowUpDown className="w-2.5 h-2.5 text-slate-500 absolute left-1.5 pointer-events-none" />
              <select
                value={cardSort}
                onChange={(e) => setCardSort(e.target.value as CardSortType)}
                title="Hücredeki ürünleri sırala"
                className={`bg-slate-950 border border-slate-800 rounded-lg pl-5 pr-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none focus:border-amber-500/50 cursor-pointer ${
                  compact ? 'w-24' : 'w-28'
                }`}
              >
                <option value="default">Sırala: Varsayılan</option>
                <option value="name_asc">Ürün: A → Z</option>
                <option value="name_desc">Ürün: Z → A</option>
                <option value="buy_desc">Alış: Yüksek ▾</option>
                <option value="buy_asc">Alış: Düşük ▴</option>
                <option value="sell_desc">Satış: Yüksek ▾</option>
                <option value="sell_asc">Satış: Düşük ▴</option>
                <option value="spread_asc">Makas: En Dar</option>
                <option value="change_desc">Değişim: En Çok %</option>
              </select>
            </div>

            <div className={`relative ${compact ? 'w-20' : 'w-24 sm:w-28'}`}>
              <Search className="w-2.5 h-2.5 text-slate-500 absolute left-2 top-2" />
              <input
                type="text"
                placeholder="Ara..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-5 pr-1.5 py-0.5 text-[10px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table / Card Data with interactive sorting */}
      <div
        className={`${
          compact ? 'p-2 min-h-[200px]' : 'p-2.5 sm:p-3 min-h-[220px]'
        } flex-1 overflow-x-auto overflow-y-auto transition-colors ${getDataContainerClass()}`}
      >
        {effectiveViewMode === 'gunes_terminal' ? (
          <GunesCardView
            items={displayItems}
            compact={compact}
            decimals={cellConfig.decimals}
            onSelectForCalculator={onSelectForCalculator}
            onOpenPriceHistory={(code) => onOpenPriceHistory?.(code, sourceKey)}
            firmName={cellConfig.customTitle}
          />
        ) : effectiveViewMode === 'kaptan_table' ? (
          <KaptanCardView
            items={displayItems}
            compact={compact}
            theme={isDark || cellConfig.cardTheme === 'dark_gold' ? 'kaptan_dark' : 'kaptan_light'}
            viewType="table"
            decimals={cellConfig.decimals}
            onSelectForCalculator={onSelectForCalculator}
            onOpenPriceHistory={(code) => onOpenPriceHistory?.(code, sourceKey)}
            firmName={cellConfig.customTitle}
            sourceKey={sourceKey}
            allSources={allSources}
          />
        ) : effectiveViewMode === 'kaptan_cards' ? (
          <KaptanCardView
            items={displayItems}
            compact={compact}
            theme={isDark || cellConfig.cardTheme === 'dark_gold' ? 'kaptan_dark' : 'kaptan_light'}
            viewType="cards"
            decimals={cellConfig.decimals}
            onSelectForCalculator={onSelectForCalculator}
            onOpenPriceHistory={(code) => onOpenPriceHistory?.(code, sourceKey)}
            firmName={cellConfig.customTitle}
            sourceKey={sourceKey}
            allSources={allSources}
          />
        ) : effectiveViewMode === 'sar_cards' ? (
          <SarDovizCardView
            items={displayItems}
            compact={compact}
            theme={cellConfig.cardTheme}
            decimals={cellConfig.decimals}
            onSelectForCalculator={onSelectForCalculator}
            onOpenPriceHistory={(code) => onOpenPriceHistory?.(code, sourceKey)}
            firmName={cellConfig.customTitle}
          />
        ) : displayItems.length > 0 ? (
          <table className="w-full text-left text-xs">
            <thead className={`sticky top-0 backdrop-blur z-10 ${getTheadClass()}`}>
              <tr className="text-[10px] sm:text-[11px] uppercase border-b font-medium select-none">
                <th
                  onClick={() => setCardSort(cardSort === 'name_asc' ? 'name_desc' : 'name_asc')}
                  className="pb-1.5 pt-1 px-1 font-semibold cursor-pointer transition group/th"
                  title="İsme göre sırala"
                >
                  <div className="flex items-center space-x-1">
                    <span>Ürün</span>
                    {cardSort === 'name_asc' && <span className="text-amber-400 font-bold">▲</span>}
                    {cardSort === 'name_desc' && <span className="text-amber-400 font-bold">▼</span>}
                    {cardSort !== 'name_asc' && cardSort !== 'name_desc' && (
                      <span className="opacity-40 group-hover/th:opacity-80 text-[9px]">⇅</span>
                    )}
                  </div>
                </th>

                <th
                  onClick={() => setCardSort(cardSort === 'buy_desc' ? 'buy_asc' : 'buy_desc')}
                  className="pb-1.5 pt-1 px-1 text-right font-semibold cursor-pointer transition group/th"
                  title="Alış fiyatına göre sırala"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Alış</span>
                    {cardSort === 'buy_desc' && <span className="text-emerald-400 font-bold">▼</span>}
                    {cardSort === 'buy_asc' && <span className="text-emerald-400 font-bold">▲</span>}
                    {cardSort !== 'buy_desc' && cardSort !== 'buy_asc' && (
                      <span className="opacity-40 group-hover/th:opacity-80 text-[9px]">⇅</span>
                    )}
                  </div>
                </th>

                <th
                  onClick={() => setCardSort(cardSort === 'sell_desc' ? 'sell_asc' : 'sell_desc')}
                  className="pb-1.5 pt-1 px-1 text-right font-semibold cursor-pointer transition group/th"
                  title="Satış fiyatına göre sırala"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Satış</span>
                    {cardSort === 'sell_desc' && <span className="text-rose-400 font-bold">▼</span>}
                    {cardSort === 'sell_asc' && <span className="text-rose-400 font-bold">▲</span>}
                    {cardSort !== 'sell_desc' && cardSort !== 'sell_asc' && (
                      <span className="opacity-40 group-hover/th:opacity-80 text-[9px]">⇅</span>
                    )}
                  </div>
                </th>

                <th
                  onClick={() => setCardSort(cardSort === 'spread_asc' ? 'spread_desc' : 'spread_asc')}
                  className={`pb-1.5 pt-1 px-1 text-right font-semibold cursor-pointer transition group/th ${
                    compact ? 'hidden 2xl:table-cell' : 'hidden sm:table-cell'
                  }`}
                  title="Makasa göre sırala"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Makas</span>
                    {cardSort === 'spread_asc' && <span className="text-amber-400 font-bold">▲</span>}
                    {cardSort === 'spread_desc' && <span className="text-amber-400 font-bold">▼</span>}
                    {cardSort !== 'spread_asc' && cardSort !== 'spread_desc' && (
                      <span className="opacity-40 group-hover/th:opacity-80 text-[9px]">⇅</span>
                    )}
                  </div>
                </th>

                <th className={`pb-1.5 pt-1 text-center font-semibold ${compact ? 'w-7 px-0.5' : 'w-9'}`}></th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map((item) => {
                const buy = typeof item.buy === 'number' && !isNaN(item.buy) ? item.buy : 0;
                const sell = typeof item.sell === 'number' && !isNaN(item.sell) ? item.sell : 0;
                const spread = Math.max(0, sell - buy);
                const spreadPercent = buy > 0 ? (spread / buy) * 100 : 0;
                const isPulseUp = item.direction === 'up';
                const isPulseDown = item.direction === 'down';
                const arbDeal = allSources ? findItemArbitrageDeal(item.code, allSources, sourceKey) : null;

                return (
                  <React.Fragment key={item.code}>
                    <tr
                      className={`transition-colors group ${getRowClass(isPulseUp, isPulseDown)}`}
                    >
                      <td className={`${compact ? 'py-1.5 pr-1 pl-1' : 'py-2.5 pr-2 pl-1.5'} whitespace-nowrap`}>
                        <div className="flex items-center space-x-1.5 min-w-0">
                          {isFxItem(item.code) && (
                            <CurrencyFlag
                              code={getCleanCurrencyCode(item.code)}
                              size={18}
                              className="w-[18px] h-[18px]"
                            />
                          )}
                          <span
                            className={getItemNameClass()}
                            title={getStandardizedProductName(item.code, item.name)}
                          >
                            {getStandardizedProductName(item.code, item.name)}
                          </span>
                          {arbDeal && (
                            <span
                              title={
                                arbDeal.isDirectOpportunityForFirm === 'buy_here'
                                  ? `En Düşük Satış Bu Firmada! ${arbDeal.sellFirmName} firmasına satarak +${formatPrice(arbDeal.profit, item.code)} kar elde edilebilir.`
                                  : `En Yüksek Alış Bu Firmada! ${arbDeal.buyFirmName} firmasından alıp buraya satarak +${formatPrice(arbDeal.profit, item.code)} kar elde edilebilir.`
                              }
                              className="inline-flex items-center px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-black text-[8px] animate-pulse shrink-0"
                            >
                              ⚡ ARB
                            </span>
                          )}
                        </div>
                      </td>

                      <td className={`${compact ? 'py-1.5 px-0.5' : 'py-2.5 px-1'} text-right whitespace-nowrap`}>
                        <div className="flex items-center justify-end space-x-0.5">
                          {item.direction === 'up' && (
                            <ArrowUp className="w-2.5 h-2.5 text-emerald-500 inline shrink-0" />
                          )}
                          <span className={getBuyPriceClass()}>
                            {formatPrice(buy, item.code)}
                          </span>
                        </div>
                      </td>

                      <td className={`${compact ? 'py-1.5 px-0.5' : 'py-2.5 px-1'} text-right whitespace-nowrap`}>
                        <div className="flex items-center justify-end space-x-0.5">
                          {item.direction === 'down' && (
                            <ArrowDown className="w-2.5 h-2.5 text-rose-500 inline shrink-0" />
                          )}
                          <span className={getSellPriceClass()}>
                            {formatPrice(sell, item.code)}
                          </span>
                        </div>
                      </td>

                      <td className={`${compact ? 'py-1.5 px-1 text-[10px] hidden xl:table-cell' : 'py-2.5 px-1 text-[11px] hidden sm:table-cell'} text-right font-mono tabular-nums whitespace-nowrap`}>
                        <div className="flex flex-col items-end">
                          <span className="font-semibold">{formatPrice(spread, item.code)}</span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-400 font-bold">
                            %{isFinite(spreadPercent) && spreadPercent > 0 ? spreadPercent.toFixed(2) : '0.15'}
                          </span>
                        </div>
                      </td>

                      <td className={`${compact ? 'py-1.5 px-0.5' : 'py-2.5 px-1'} text-center`}>
                        <div className="flex items-center justify-center space-x-0.5">
                          {onOpenPriceHistory && (
                            <button
                              onClick={() => onOpenPriceHistory(item.code, sourceKey)}
                              title="Fiyat Geçmişi & Grafik"
                              className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
                            >
                              <TrendingUp className="w-3 h-3" />
                            </button>
                          )}
                          {onSelectForCalculator && (
                            <button
                              onClick={() => onSelectForCalculator(item, cellConfig.customTitle)}
                              title="Hesaplayıcıya Gönder"
                              className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
                            >
                              <Calculator className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Small-font detailed arbitrage sub-row */}
                    {arbDeal && (
                      <tr className={`${isLight ? 'bg-amber-50/80 border-b border-amber-200/80' : 'bg-amber-950/20 border-b border-amber-500/30'}`}>
                        <td colSpan={compact ? 4 : 5} className="py-1 px-2">
                          <div className="flex flex-wrap items-center justify-between gap-1 text-[9px] font-mono leading-tight">
                            <div className="flex items-center space-x-1.5">
                              <span className="inline-flex items-center space-x-0.5 px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-black text-[8px] uppercase tracking-wider shrink-0">
                                <Zap className="w-2.5 h-2.5 fill-current" />
                                <span>ARBİTRAJ</span>
                              </span>
                              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                {arbDeal.isDirectOpportunityForFirm === 'buy_here'
                                  ? `Bu Firmadan Al (${formatPrice(arbDeal.buyPrice, item.code)})`
                                  : `Al: ${arbDeal.buyFirmName} (${formatPrice(arbDeal.buyPrice, item.code)})`}
                              </span>
                              <span className="text-slate-400">&rarr;</span>
                              <span className="font-semibold text-rose-700 dark:text-rose-400">
                                {arbDeal.isDirectOpportunityForFirm === 'sell_here'
                                  ? `Bu Firmaya Sat (${formatPrice(arbDeal.sellPrice, item.code)})`
                                  : `Sat: ${arbDeal.sellFirmName} (${formatPrice(arbDeal.sellPrice, item.code)})`}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1.5 shrink-0">
                              <span className="font-black text-amber-700 dark:text-amber-400">
                                Net: +{formatPrice(arbDeal.profit, item.code)}
                              </span>
                              <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 font-extrabold text-[8.5px]">
                                (%{arbDeal.profitPercent.toFixed(2)})
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 py-8 text-xs">
            Filtreye uygun kur bulunamadı.
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div
        className={`${
          compact ? 'px-3 py-1.5 text-[10px]' : 'px-4 py-2 text-[11px]'
        } border-t flex justify-between items-center transition-colors ${getCardFooterClass()}`}
      >
        <span>Son Güncelleme:</span>
        <span className="font-mono text-slate-400">
          {formatTime(sourceData.updatedAt)}
        </span>
      </div>

      {/* Hücre İçi Kur & Tasarım Ayarları Modalı */}
      <FirmCardSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        firmName={sourceData.sourceName || sourceKey}
        sourceKey={sourceKey}
        allItems={items}
        config={cellConfig}
        onSaveConfig={handleSaveConfig}
        onResetToDefault={handleResetToDefault}
      />

    </div>
  );
};
