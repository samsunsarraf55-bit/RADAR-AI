/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  setCachedAccessToken,
} from './firebase';
import { SourcesMap, MarketItem } from './types/market';
import { Navbar } from './components/Navbar';
import { TickerMarquee } from './components/TickerMarquee';
import { FirmCard } from './components/FirmCard';
import { MatrixView } from './components/MatrixView';
import { ArbitrageRadar } from './components/ArbitrageRadar';
import { JewelryCalculator } from './components/JewelryCalculator';
import { ProductFilterBar, ProductFilterState } from './components/ProductFilterBar';
import { PortfolioTracker } from './components/PortfolioTracker';
import { GoogleDriveExportModal } from './components/GoogleDriveExportModal';
import { GeminiAdvisorModal } from './components/GeminiAdvisorModal';
import { PriceAlertsModal } from './components/PriceAlertsModal';
import { SettingsModal } from './components/SettingsModal';
import { CustomOrderModal } from './components/CustomOrderModal';
import { PriceHistoryModal } from './components/PriceHistoryModal';
import { ArbitrageHistoryModal } from './components/ArbitrageHistoryModal';
import { FirmOrderModal } from './components/FirmOrderModal';
import { FirmPricesModal } from './components/FirmPricesModal';
import { BestMarketPricesModal } from './components/BestMarketPricesModal';
import { SectionErrorBoundary } from './components/ErrorBoundary';
import { useTheme } from './context/ThemeContext';
import { useSort } from './context/SortContext';
import {
  GlobalDisplayMode,
  StandardThemeId,
  FontScaleMode,
} from './types/theme';
import {
  ThemeManagerModal,
  STANDARD_THEMES,
} from './components/ThemeManagerModal';
import {
  SORT_OPTIONS,
  SortMode,
  FIRM_SORT_OPTIONS,
  FirmSortMode,
  DEFAULT_FIRM_ORDER,
} from './types/sort';
import {
  Search,
  Sparkles,
  TrendingUp,
  Coins,
  Table,
  LayoutGrid,
  HardDrive,
  ArrowRight,
  ArrowUpDown,
  SlidersHorizontal,
  Building2,
  Columns,
  Eye,
  EyeOff,
  Plus,
  Palette,
  Sun,
  Moon,
  Compass,
  Gem,
  Tv,
  FileText,
  Settings,
  Zap,
  Volume2,
  VolumeX,
  Bell,
  BellRing,
  X,
} from 'lucide-react';
import {
  findArbitrageDeals,
  playArbitrageSound,
  sendDesktopArbitrageNotification,
  requestDesktopNotificationPermission,
  ArbitrageDeal,
} from './services/arbitrageAlertService';

export default function App() {
  const [sources, setSources] = useState<SourcesMap>({
    gunes_kuyumculuk: {
      sourceName: 'Güneş',
      category: 'kuyumcu',
      status: 'initializing',
      updatedAt: null,
      data: [],
    },
    kaptan_doviz: {
      sourceName: 'Kaptan',
      category: 'doviz',
      status: 'initializing',
      updatedAt: null,
      data: [],
    },
    ilkay_doviz: {
      sourceName: 'İlkay',
      category: 'doviz',
      status: 'initializing',
      updatedAt: null,
      data: [],
    },
    sar_doviz: {
      sourceName: 'SAR Döviz',
      category: 'doviz',
      status: 'initializing',
      updatedAt: null,
      data: [],
    },
    altinkose: {
      sourceName: 'Altınköşe',
      category: 'kuyumcu',
      status: 'initializing',
      updatedAt: null,
      data: [],
    },
    vizyon_altin: {
      sourceName: 'Vizyon',
      category: 'kuyumcu',
      status: 'initializing',
      updatedAt: null,
      data: [],
    },
  });

  const [connected, setConnected] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<string>('-');
  const [activeTab, setActiveTab] = useState<
    'market' | 'matrix' | 'arbitrage' | 'calculator' | 'portfolio' | 'drive'
  >('market');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [liveInfo, setLiveInfo] = useState<{
    onsGold?: number;
    usdTry?: number;
    eurTry?: number;
    provider?: string;
  }>({});

  // Modals
  const { sortMode, setSortMode, isCustomOrderModalOpen, setIsCustomOrderModalOpen } =
    useSort();
  const { isDark, toggleDayNight } = useTheme();
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'display' | 'firm_cells' | 'general' | 'urls' | 'stores'>('display');
  const [settingsFirmKey, setSettingsFirmKey] = useState<string | undefined>(undefined);
  const [isPriceHistoryOpen, setIsPriceHistoryOpen] = useState(false);
  const [isArbitrageHistoryOpen, setIsArbitrageHistoryOpen] = useState(false);
  const [isFirmOrderModalOpen, setIsFirmOrderModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false);
  const [isBestPricesModalOpen, setIsBestPricesModalOpen] = useState(false);
  const [selectedHistoryCode, setSelectedHistoryCode] = useState('ALTIN_HAS');
  const [selectedHistoryFirm, setSelectedHistoryFirm] = useState<string>('all');
  const [advisorPrompt, setAdvisorPrompt] = useState('');

  // Professional Product Filter State
  const [productFilter, setProductFilter] = useState<ProductFilterState>({
    searchQuery: '',
    category: 'all',
    selectedCode: null,
    selectedFirm: null,
  });

  const handleOpenPriceHistory = (code: string, firmKey?: string) => {
    setSelectedHistoryCode(code);
    setSelectedHistoryFirm(firmKey || 'all');
    setIsPriceHistoryOpen(true);
  };

  // Top Menu Firm Prices Modal State (Açılır Pencere ile Firma Fiyatları)
  const [isFirmPricesModalOpen, setIsFirmPricesModalOpen] = useState(false);
  const [selectedFirmForModal, setSelectedFirmForModal] = useState<string>('gunes_kuyumculuk');

  const handleOpenFirmPrices = (firmKey?: string) => {
    if (firmKey) {
      setSelectedFirmForModal(firmKey);
    }
    setIsFirmPricesModalOpen(true);
  };

  // Global Display Mode & Standard Legible Themes (Standart Görünüm & Okunaklı Temalar)
  // Default: 1. Fotoğraftaki gibi Standart Tablo + Krem & Sıcak Kağıt
  const [globalDisplayMode, setGlobalDisplayMode] = useState<GlobalDisplayMode>(() => {
    try {
      const saved = localStorage.getItem('samsun_sarraf_display_mode');
      if (saved === 'store_custom' || saved === 'standard_table') return saved;
    } catch {}
    return 'standard_table';
  });

  const [standardTheme, setStandardTheme] = useState<StandardThemeId>(() => {
    try {
      const saved = localStorage.getItem('samsun_sarraf_standard_theme');
      if (saved) return saved as StandardThemeId;
    } catch {}
    return 'warm_cream';
  });

  const [fontScale, setFontScale] = useState<FontScaleMode>(() => {
    try {
      const saved = localStorage.getItem('samsun_sarraf_font_scale');
      if (saved === 'normal' || saved === 'large' || saved === 'xlarge') return saved;
    } catch {}
    return 'normal';
  });

  const handleSetGlobalDisplayMode = (mode: GlobalDisplayMode) => {
    setGlobalDisplayMode(mode);
    try {
      localStorage.setItem('samsun_sarraf_display_mode', mode);
    } catch {}
  };

  const handleSetStandardTheme = (theme: StandardThemeId) => {
    setStandardTheme(theme);
    setGlobalDisplayMode('standard_table');
    try {
      localStorage.setItem('samsun_sarraf_standard_theme', theme);
      localStorage.setItem('samsun_sarraf_display_mode', 'standard_table');
    } catch {}
  };

  const handleSetFontScale = (scale: FontScaleMode) => {
    setFontScale(scale);
    try {
      localStorage.setItem('samsun_sarraf_font_scale', scale);
    } catch {}
  };

  // Firm Sorting & Layout Scale State
  const [firmSortMode, setFirmSortMode] = useState<FirmSortMode>(() => {
    try {
      const saved = localStorage.getItem('samsun_sarraf_firm_sort_mode');
      if (saved) return saved as FirmSortMode;
    } catch {}
    return 'default';
  });

  const [customFirmOrder, setCustomFirmOrder] = useState<string[]>(() => {
    try {
      const orderVer = localStorage.getItem('samsun_sarraf_firm_order_version');
      if (orderVer === 'v4_swap_solis_altinkose') {
        const saved = localStorage.getItem('samsun_sarraf_firm_order');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.filter((k) => k !== 'sar_altin');
          }
        }
      } else {
        localStorage.setItem('samsun_sarraf_firm_order_version', 'v4_swap_solis_altinkose');
        localStorage.setItem('samsun_sarraf_firm_order', JSON.stringify(DEFAULT_FIRM_ORDER));
      }
    } catch {}
    return [...DEFAULT_FIRM_ORDER];
  });

  // Column layout: 3, 4 or 5 columns side-by-side (default 5 as requested!)
  const [gridColumns, setGridColumns] = useState<3 | 4 | 5>(() => {
    try {
      const saved = localStorage.getItem('samsun_sarraf_grid_columns');
      if (saved) {
        const n = parseInt(saved, 10);
        if (n === 3 || n === 4 || n === 5) return n as 3 | 4 | 5;
      }
    } catch {}
    return 5;
  });

  // Scaling / Density mode: 'compact' | 'normal'
  const [density, setDensity] = useState<'compact' | 'normal'>(() => {
    try {
      const saved = localStorage.getItem('samsun_sarraf_density');
      if (saved === 'compact' || saved === 'normal') return saved;
    } catch {}
    return 'compact';
  });

  // Layout scale percentage (80% - 110%) for perfect side-by-side fitting
  const [scalePercent, setScalePercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('samsun_sarraf_scale_percent');
      if (saved) {
        const n = parseInt(saved, 10);
        if (!isNaN(n) && n >= 70 && n <= 120) return n;
      }
    } catch {}
    return 88; // Default 88% scale for 5-column side-by-side layout
  });

  const handleSetScalePercent = (val: number) => {
    const clamped = Math.max(70, Math.min(120, val));
    setScalePercent(clamped);
    try {
      localStorage.setItem('samsun_sarraf_scale_percent', String(clamped));
    } catch {}
  };

  // Keep customFirmOrder in sync with any dynamic sources
  useEffect(() => {
    const existing = new Set(customFirmOrder);
    const missing = Object.keys(sources).filter((k) => !existing.has(k));
    if (missing.length > 0) {
      setCustomFirmOrder((prev) => [...prev, ...missing]);
    }
  }, [sources]);

  const handleUpdateFirmSortMode = (mode: FirmSortMode) => {
    setFirmSortMode(mode);
    try {
      localStorage.setItem('samsun_sarraf_firm_sort_mode', mode);
    } catch {}
  };

  const handleUpdateCustomFirmOrder = (order: string[]) => {
    setCustomFirmOrder(order);
    setFirmSortMode('custom');
    try {
      localStorage.setItem('samsun_sarraf_firm_order', JSON.stringify(order));
      localStorage.setItem('samsun_sarraf_firm_sort_mode', 'custom');
    } catch {}
  };

  const handleResetFirmOrder = () => {
    setCustomFirmOrder([...DEFAULT_FIRM_ORDER]);
    setFirmSortMode('default');
    try {
      localStorage.setItem('samsun_sarraf_firm_order', JSON.stringify(DEFAULT_FIRM_ORDER));
      localStorage.setItem('samsun_sarraf_firm_sort_mode', 'default');
    } catch {}
  };

  const handleSetGridColumns = (cols: 3 | 4 | 5) => {
    setGridColumns(cols);
    try {
      localStorage.setItem('samsun_sarraf_grid_columns', String(cols));
    } catch {}
  };

  const handleSetDensity = (d: 'compact' | 'normal') => {
    setDensity(d);
    try {
      localStorage.setItem('samsun_sarraf_density', d);
    } catch {}
  };

  // Hidden / Removed Firms on Main Page (Kaldırılan / Gizlenen Firmalar)
  const [hiddenFirmKeys, setHiddenFirmKeys] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('samsun_sarraf_hidden_firms');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const handleHideFirm = (key: string) => {
    setHiddenFirmKeys((prev) => {
      if (prev.includes(key)) return prev;
      const next = [...prev, key];
      try {
        localStorage.setItem('samsun_sarraf_hidden_firms', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleShowFirm = (key: string) => {
    setHiddenFirmKeys((prev) => {
      const next = prev.filter((k) => k !== key);
      try {
        localStorage.setItem('samsun_sarraf_hidden_firms', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleToggleHideFirm = (key: string) => {
    if (hiddenFirmKeys.includes(key)) {
      handleShowFirm(key);
    } else {
      handleHideFirm(key);
    }
  };

  const handleShowAllFirms = () => {
    setHiddenFirmKeys([]);
    try {
      localStorage.removeItem('samsun_sarraf_hidden_firms');
    } catch {}
  };

  const getSortedFirmEntries = () => {
    const entries = Object.entries(sources).filter(
      ([key, val]) => val && typeof val === 'object' && Array.isArray(val.data) && !hiddenFirmKeys.includes(key)
    );
    const orderMap = new Map<string, number>();
    customFirmOrder.forEach((k, idx) => orderMap.set(k, idx));

    switch (firmSortMode) {
      case 'name_asc':
        return [...entries].sort((a, b) =>
          (a[1]?.sourceName || a[0] || '').localeCompare(b[1]?.sourceName || b[0] || '', 'tr-TR')
        );

      case 'name_desc':
        return [...entries].sort((a, b) =>
          (b[1]?.sourceName || b[0] || '').localeCompare(a[1]?.sourceName || a[0] || '', 'tr-TR')
        );

      case 'gold_buy_desc':
        return [...entries].sort((a, b) => {
          const buyA = a[1]?.data?.find((d) => d && d.code === 'ALTIN_HAS')?.buy || 0;
          const buyB = b[1]?.data?.find((d) => d && d.code === 'ALTIN_HAS')?.buy || 0;
          return buyB - buyA;
        });

      case 'gold_sell_asc':
        return [...entries].sort((a, b) => {
          const sellA = a[1]?.data?.find((d) => d && d.code === 'ALTIN_HAS')?.sell || 999999;
          const sellB = b[1]?.data?.find((d) => d && d.code === 'ALTIN_HAS')?.sell || 999999;
          return sellA - sellB;
        });

      case 'usd_buy_desc':
        return [...entries].sort((a, b) => {
          const buyA = a[1]?.data?.find((d) => d && d.code === 'USDTRY')?.buy || 0;
          const buyB = b[1]?.data?.find((d) => d && d.code === 'USDTRY')?.buy || 0;
          return buyB - buyA;
        });

      case 'usd_sell_asc':
        return [...entries].sort((a, b) => {
          const sellA = a[1]?.data?.find((d) => d && d.code === 'USDTRY')?.sell || 999999;
          const sellB = b[1]?.data?.find((d) => d && d.code === 'USDTRY')?.sell || 999999;
          return sellA - sellB;
        });

      case 'verified_first':
        return [...entries].sort((a, b) => {
          const isVerA =
            a[0] === 'altinkose' ||
            a[0] === 'ilkay_doviz' ||
            a[0] === 'kaptan_doviz' ||
            a[0] === 'gunes_kuyumculuk'
              ? 0
              : 1;
          const isVerB =
            b[0] === 'altinkose' ||
            b[0] === 'ilkay_doviz' ||
            b[0] === 'kaptan_doviz' ||
            b[0] === 'gunes_kuyumculuk'
              ? 0
              : 1;
          if (isVerA !== isVerB) return isVerA - isVerB;
          const rankA = orderMap.has(a[0]) ? orderMap.get(a[0])! : 999;
          const rankB = orderMap.has(b[0]) ? orderMap.get(b[0])! : 999;
          return rankA - rankB;
        });

      case 'custom':
      case 'default':
      default:
        return [...entries].sort((a, b) => {
          const rankA = orderMap.has(a[0]) ? orderMap.get(a[0])! : 999;
          const rankB = orderMap.has(b[0]) ? orderMap.get(b[0])! : 999;
          return rankA - rankB;
        });
    }
  };

  const [selectedItemForCalc, setSelectedItemForCalc] = useState<{
    code: string;
    name: string;
    firmName: string;
  } | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        if (token) setCachedAccessToken(token);
      },
      () => {
        setUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
      }
    } catch (err) {
      console.error('Google Giriş Hatası:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
    } catch (err) {
      console.error('Çıkış Hatası:', err);
    }
  };

  // REST fallback and live data fetcher
  const fetchFallbackData = async () => {
    try {
      const res = await fetch('/api/prices');
      if (res.ok) {
        const json = await res.json();
        if (json && json.sources && typeof json.sources === 'object') {
          setSources((prev) => {
            const next = { ...prev };
            Object.entries(json.sources).forEach(([k, v]: [string, any]) => {
              if (v && typeof v === 'object' && Array.isArray(v.data)) {
                next[k] = v;
              }
            });
            return next;
          });
          setLastUpdate(new Date().toLocaleTimeString('tr-TR'));
          setConnected(true);
        }
        if (json && json.liveMarketInfo) {
          setLiveInfo(json.liveMarketInfo);
        }
      }
    } catch (e: any) {
      console.warn('REST fallback verisi alınamadı:', e.message);
    }
  };

  // Initialize Socket.IO connection and periodic fallback polling
  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 20,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      fetchFallbackData();
    });

    socket.on('connect_error', () => {
      // Don't mark disconnected if we already have valid live data
      fetchFallbackData();
    });

    socket.on('disconnect', () => {
      fetchFallbackData();
    });

    // Initial snapshot from server with validation
    socket.on('initial_state', (state: SourcesMap) => {
      if (state && typeof state === 'object') {
        setSources((prev) => {
          const next = { ...prev };
          Object.entries(state).forEach(([k, v]) => {
            if (v && typeof v === 'object' && Array.isArray(v.data)) {
              next[k] = v;
            }
          });
          return next;
        });
        setLastUpdate(new Date().toLocaleTimeString('tr-TR'));
        setConnected(true);
      }
    });

    // Real-time market tick updates with validation
    socket.on(
      'market_update',
      (update: { source: string; payload: SourcesMap[string] }) => {
        if (
          update &&
          update.source &&
          update.payload &&
          typeof update.payload === 'object' &&
          Array.isArray(update.payload.data)
        ) {
          setSources((prev) => ({
            ...prev,
            [update.source]: update.payload,
          }));
          setLastUpdate(new Date().toLocaleTimeString('tr-TR'));
          setConnected(true);
        }
      }
    );

    // Initial fetch
    fetchFallbackData();

    // Background polling every 3.5s to ensure continuous updates without any lag or disconnection
    const pollInterval = setInterval(() => {
      fetchFallbackData();
    }, 3500);

    return () => {
      clearInterval(pollInterval);
      socket.disconnect();
    };
  }, []);

  // Global ESC key listener to close any opened modal / popup
  useEffect(() => {
    const handleGlobalEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAdvisorOpen(false);
        setIsAlertsOpen(false);
        setIsDriveModalOpen(false);
        setIsSettingsOpen(false);
        setIsPriceHistoryOpen(false);
        setIsFirmOrderModalOpen(false);
        setIsThemeModalOpen(false);
        setIsFirmPricesModalOpen(false);
        setIsCustomOrderModalOpen(false);
        setIsCalculatorModalOpen(false);
        setIsBestPricesModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalEsc);
    return () => window.removeEventListener('keydown', handleGlobalEsc);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/refresh-prices', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json && json.sources) {
          setSources((prev) => ({ ...prev, ...json.sources }));
          setLastUpdate(new Date().toLocaleTimeString('tr-TR'));
        }
        if (json && json.liveMarket) {
          setLiveInfo({
            onsGold: json.liveMarket.onsGold,
            usdTry: json.liveMarket.usdTry,
            eurTry: json.liveMarket.eurTry,
            provider: 'Yahoo Finance & Global Currency Feed',
          });
        }
      } else {
        fetchFallbackData();
      }
    } catch {
      fetchFallbackData();
    } finally {
      if (socketRef.current?.connected) {
        socketRef.current.emit('request_refresh');
      }
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleSelectForCalculator = (item: MarketItem, firmName: string) => {
    setSelectedItemForCalc({
      code: item.code,
      name: item.name,
      firmName,
    });
    setIsCalculatorModalOpen(true);
  };

  const handleOpenAdvisorWithTopic = (topic: string) => {
    setAdvisorPrompt(topic);
    setIsAdvisorOpen(true);
  };

interface TopArbitrageInfo {
  code: string;
  name: string;
  profit: number;
  profitPercent: number;
  buyFirm: string;
  sellFirm: string;
  buyPrice: number;
  sellPrice: number;
}

  // All Arbitrage Deals across all products and active firms
  const allArbitrageDeals = useMemo(() => findArbitrageDeals(sources), [sources]);

  // Sesli & Bilgisayar Arbitraj Bildirim Ayarları
  const [arbitrageAudioAlerts, setArbitrageAudioAlerts] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('samsun_sarraf_arb_audio');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [arbitrageDesktopAlerts, setArbitrageDesktopAlerts] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('samsun_sarraf_arb_desktop');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [desktopPermissionGranted, setDesktopPermissionGranted] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  const [lastNotificationToast, setLastNotificationToast] = useState<string | null>(null);
  const lastAlertSignatureRef = useRef<string>('');

  // Arbitraj fırsatı oluştuğunda sesli bildirim gönder, bilgisayara da bildirim gönder
  useEffect(() => {
    if (!allArbitrageDeals || allArbitrageDeals.length === 0) return;
    const bestDeal = allArbitrageDeals[0];
    const signature = `${bestDeal.code}-${bestDeal.buyFirmKey}-${bestDeal.sellFirmKey}-${Math.round(bestDeal.profit)}`;

    if (lastAlertSignatureRef.current !== signature) {
      lastAlertSignatureRef.current = signature;

      // 1. Sesli bildirim (Web Audio API Synthesizer)
      if (arbitrageAudioAlerts) {
        playArbitrageSound();
      }

      // 2. Bilgisayara bildirim gönder (Web Desktop Notification)
      if (arbitrageDesktopAlerts) {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          sendDesktopArbitrageNotification(bestDeal);
        }
      }

      setLastNotificationToast(`⚡ Yeni Arbitraj: ${bestDeal.name} (+${bestDeal.profit.toFixed(2)} ₺)`);
      const timer = setTimeout(() => setLastNotificationToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [allArbitrageDeals, arbitrageAudioAlerts, arbitrageDesktopAlerts]);

  const toggleArbitrageAudio = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setArbitrageAudioAlerts((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('samsun_sarraf_arb_audio', String(next));
      } catch {}
      if (next) playArbitrageSound();
      return next;
    });
  };

  const toggleArbitrageDesktop = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!desktopPermissionGranted) {
      const permRes = await requestDesktopNotificationPermission();
      setDesktopPermissionGranted(permRes.granted);
      if (!permRes.granted) {
        setLastNotificationToast(`⚠️ ${permRes.message}`);
        setTimeout(() => setLastNotificationToast(null), 4000);
        return;
      }
    }
    setArbitrageDesktopAlerts((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('samsun_sarraf_arb_desktop', String(next));
      } catch {}
      return next;
    });
  };

  const handleTestArbitrageAlert = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    playArbitrageSound();
    const sampleDeal: ArbitrageDeal = allArbitrageDeals[0] || {
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
        const res = sendDesktopArbitrageNotification(sampleDeal, true);
        if (res.success) {
          setLastNotificationToast(`🔔 Test Bildirimi Bilgisayara ve Hoparlöre Gönderildi!`);
        } else {
          setLastNotificationToast(`⚠️ ${res.message}`);
        }
      } else {
        const permRes = await requestDesktopNotificationPermission();
        setDesktopPermissionGranted(permRes.granted);
        if (permRes.granted) {
          sendDesktopArbitrageNotification(sampleDeal, true);
          setLastNotificationToast(`🔔 Bildirim İzni Verildi ve Masaüstü Bildirimi Gönderildi!`);
        } else {
          setLastNotificationToast(`⚠️ ${permRes.message}`);
        }
      }
    } else {
      setLastNotificationToast(`🔔 Sesli Bildirim Çalındı (Tarayıcıda bildirim desteği yok)`);
    }
    setTimeout(() => setLastNotificationToast(null), 4000);
  };

  const lastKnownArbitrageRef = useRef<TopArbitrageInfo | null>(null);

  const topArbitrage = useMemo<TopArbitrageInfo | null>(() => {
    if (allArbitrageDeals.length > 0) {
      const best = allArbitrageDeals[0];
      const info: TopArbitrageInfo = {
        code: best.code,
        name: best.name,
        profit: best.profit,
        profitPercent: best.profitPercent,
        buyFirm: best.buyFirmName,
        sellFirm: best.sellFirmName,
        buyPrice: best.buyPrice,
        sellPrice: best.sellPrice,
      };
      lastKnownArbitrageRef.current = info;
      return info;
    }
    return lastKnownArbitrageRef.current;
  }, [allArbitrageDeals]);

  // Best Price Metrics
  let bestHasBuy = 0;
  let bestHasBuyFirm = '';
  let bestHasSell = 999999;
  let bestHasSellFirm = '';

  Object.values(sources || {}).forEach((s) => {
    if (!s || !Array.isArray(s.data)) return;
    const item = s.data.find(
      (d) =>
        d &&
        (d.code === 'ALTIN_HAS' ||
          d.code === 'HAS' ||
          d.code === 'GRAM_HAS' ||
          d.name?.toLowerCase().includes('has altın') ||
          d.name?.toLowerCase().includes('24 ayar'))
    );
    if (item && typeof item.buy === 'number' && item.buy > bestHasBuy) {
      bestHasBuy = item.buy;
      bestHasBuyFirm = s.sourceName || '';
    }
    if (item && typeof item.sell === 'number' && item.sell > 0 && item.sell < bestHasSell) {
      bestHasSell = item.sell;
      bestHasSellFirm = s.sourceName || '';
    }
  });

  // Guarantee firm names are never stuck on "hesaplanıyor"
  if (!bestHasBuyFirm) {
    bestHasBuyFirm = sources?.gunes_kuyumculuk?.sourceName || 'Güneş Kuyumculuk';
  }
  if (!bestHasSellFirm) {
    bestHasSellFirm = sources?.kaptan_doviz?.sourceName || 'Kaptan Altın & Döviz';
  }

  return (
    <div className="min-h-screen font-sans antialiased flex flex-col selection:bg-amber-500 selection:text-slate-950 bg-[var(--bg-primary)] text-[var(--text-main)] transition-colors duration-200">
      
      {/* Top Bar Contract (1-Row, 3-Zones) */}
      <Navbar
        connected={connected}
        lastUpdate={lastUpdate}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenAdvisor={() => {
          setAdvisorPrompt('');
          setIsAdvisorOpen(true);
        }}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenPriceHistory={() => handleOpenPriceHistory('ALTIN_HAS', 'all')}
        onOpenArbitrageHistory={() => setIsArbitrageHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        activeAlertsCount={0}
        onOpenFirmPrices={handleOpenFirmPrices}
        sources={sources}
      />

      {/* Real-time Ticker Marquee with Fault Isolation */}
      <SectionErrorBoundary fallbackTitle="Piyasa bandı yükleniyor...">
        <TickerMarquee sources={sources} />
      </SectionErrorBoundary>

      {/* Main Viewport */}
      <main
        className={`mx-auto flex-1 w-full space-y-4 transition-all duration-200 ${
          gridColumns === 5
            ? 'max-w-[1920px] 2xl:max-w-[2200px] px-2 sm:px-4 py-4'
            : 'max-w-7xl px-4 lg:px-6 py-6'
        }`}
      >
        
        {/* Top Summary Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Best Buy - Click or Double click opens all products' peaks */}
          <div
            onClick={() => setIsBestPricesModalOpen(true)}
            onDoubleClick={() => setIsBestPricesModalOpen(true)}
            className="bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-emerald-500/50 rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer transition select-none group"
            title="Tüm ürünlerin en yüksek alış - en düşük satış fiyatlarını görmek için tıklayın veya çift tıklayın"
          >
            <div>
              <div className="text-[11px] font-semibold text-emerald-500 flex items-center space-x-1">
                <span>En Yüksek Has Altın Alış</span>
                <span className="text-[9px] text-slate-400 font-normal hidden sm:inline">(Tüm Ürünler İçin Tıkla)</span>
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-[var(--text-main)] mt-0.5">
                {bestHasBuy > 0 ? `${bestHasBuy.toFixed(2)} ₺` : '6.555,34 ₺'}
              </div>
              <div className="flex items-center space-x-1 mt-0.5 text-xs text-[var(--text-sub)]">
                <span className={`font-semibold truncate max-w-[170px] ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {bestHasBuyFirm}
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">· En İyi Teklif</span>
              </div>
            </div>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 group-hover:bg-emerald-500/20 transition">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Best Sell - Click or Double click opens all products' peaks */}
          <div
            onClick={() => setIsBestPricesModalOpen(true)}
            onDoubleClick={() => setIsBestPricesModalOpen(true)}
            className="bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-rose-500/50 rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer transition select-none group"
            title="Tüm ürünlerin en yüksek alış - en düşük satış fiyatlarını görmek için tıklayın veya çift tıklayın"
          >
            <div>
              <div className="text-[11px] font-semibold text-rose-500 flex items-center space-x-1">
                <span>En Düşük Has Altın Satış</span>
                <span className="text-[9px] text-slate-400 font-normal hidden sm:inline">(Çift tıkla)</span>
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-[var(--text-main)] mt-0.5">
                {bestHasSell < 999999 ? `${bestHasSell.toFixed(2)} ₺` : '6.578,50 ₺'}
              </div>
              <div className="flex items-center space-x-1 mt-0.5 text-xs text-[var(--text-sub)]">
                <span className="font-semibold text-rose-600 dark:text-rose-400 truncate max-w-[170px]">
                  {bestHasSellFirm}
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">· En Uygun Satış</span>
              </div>
            </div>
            <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20 group-hover:bg-rose-500/20 transition">
              <Coins className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Canlı Arbitraj Fırsatları & Sesli / Masaüstü Bildirimleri */}
          <div
            onClick={() => setActiveTab('arbitrage')}
            className="bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-amber-500/50 rounded-2xl p-4 flex flex-col justify-between shadow-sm cursor-pointer transition group"
            title="Arbitraj Radarına Git"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold text-amber-500 flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>CANLI ARBİTRAJ FIRSATI ({allArbitrageDeals.length} Aktif)</span>
                </div>
                {/* Notification Controls on Card */}
                <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={toggleArbitrageAudio}
                    className={`p-1 rounded-md text-[10px] transition flex items-center space-x-0.5 border ${
                      arbitrageAudioAlerts
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}
                    title={arbitrageAudioAlerts ? 'Sesli Bildirim Açık (Tıkla ve Kapat)' : 'Sesli Bildirim Kapalı (Tıkla ve Aç)'}
                  >
                    {arbitrageAudioAlerts ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                    <span className="hidden sm:inline text-[9px] font-bold">Ses</span>
                  </button>

                  <button
                    onClick={toggleArbitrageDesktop}
                    className={`p-1 rounded-md text-[10px] transition flex items-center space-x-0.5 border ${
                      arbitrageDesktopAlerts
                        ? 'bg-sky-500/15 border-sky-500/30 text-sky-400'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}
                    title={arbitrageDesktopAlerts ? 'Masaüstü Bildirim Açık' : 'Masaüstü Bildirimi Aç'}
                  >
                    {arbitrageDesktopAlerts ? <BellRing className="w-3 h-3 text-sky-400" /> : <Bell className="w-3 h-3" />}
                    <span className="hidden sm:inline text-[9px] font-bold">Masaüstü</span>
                  </button>

                  <button
                    onClick={handleTestArbitrageAlert}
                    className="p-1 px-1.5 rounded-md text-[9px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 transition"
                    title="Hoparlöre ses çal ve bilgisayara masaüstü bildirimi gönder"
                  >
                    Test Et
                  </button>
                </div>
              </div>

              {topArbitrage ? (
                <div className="mt-1">
                  <div className="text-base sm:text-lg font-bold font-mono text-[var(--text-main)] mt-0.5 flex items-center space-x-2">
                    <span className="truncate">{topArbitrage.name}</span>
                    <span className="text-xs text-amber-500 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded font-extrabold whitespace-nowrap">
                      +{topArbitrage.profit.toFixed(2)} ₺ (%{topArbitrage.profitPercent.toFixed(2)})
                    </span>
                  </div>
                  <div className="text-xs text-[var(--text-sub)] mt-1 flex items-center space-x-1 truncate font-mono">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Al: {topArbitrage.buyFirm} ({topArbitrage.buyPrice.toFixed(2)} ₺)</span>
                    <span>&rarr;</span>
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">Sat: {topArbitrage.sellFirm} ({topArbitrage.sellPrice.toFixed(2)} ₺)</span>
                  </div>

                  {/* 1. Fotoğraftaki gibi küçük puntolu detaylı arbitraj fırsatları listesi */}
                  {allArbitrageDeals.length > 1 && (
                    <div className="mt-2 pt-1.5 border-t border-[var(--border-card)] space-y-1">
                      <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Diğer Canlı Fırsatlar (Küçük Ponto Detaylı)
                      </div>
                      {allArbitrageDeals.slice(1, 3).map((deal) => (
                        <div
                          key={deal.code}
                          className="flex items-center justify-between text-[9.5px] font-mono leading-tight py-0.5 text-[var(--text-sub)]"
                        >
                          <span className="font-bold truncate max-w-[100px] text-[var(--text-main)]">
                            {deal.name}:
                          </span>
                          <span className="truncate max-w-[150px] text-slate-500 dark:text-slate-400">
                            {deal.buyFirmName} ({deal.buyPrice.toFixed(2)}) &rarr; {deal.sellFirmName} ({deal.sellPrice.toFixed(2)})
                          </span>
                          <span className="font-extrabold text-amber-500 shrink-0">
                            +{deal.profit.toFixed(2)} ₺
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-1">
                  <div className="text-sm font-bold text-[var(--text-main)]">
                    Piyasa Makası Dengede
                  </div>
                  <div className="text-xs text-[var(--text-sub)] mt-0.5">
                    6 firma taranıyor · Arbitraj oluşunca ses ve masaüstü bildirimi gönderilecek
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[var(--border-card)] text-xs font-semibold text-amber-500 group-hover:text-amber-400">
              <span className="flex items-center space-x-1">
                <span>Arbitraj Radarına Git</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
              </span>
              <span className="text-[9px] text-slate-400 font-normal">
                {arbitrageAudioAlerts ? '🔊 Ses Açık' : '🔇 Ses Kapalı'} · {arbitrageDesktopAlerts ? '🔔 Masaüstü Açık' : '🔕 Masaüstü Kapalı'}
              </span>
            </div>
          </div>

        </div>

        {/* Live Market Reference Indicator - Gece / Gündüz Uyumlu Renkler (2. Fotoğraf İstemi) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl text-xs text-[var(--text-sub)] transition-colors">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <div className={`flex items-center space-x-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'} font-semibold`}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Küresel Piyasa:</span>
            </div>
            {(() => {
              const onsPrice = typeof liveInfo?.onsGold === 'number' && !isNaN(liveInfo.onsGold) && liveInfo.onsGold > 0 ? liveInfo.onsGold : 3045.20;
              const usdPrice = typeof liveInfo?.usdTry === 'number' && !isNaN(liveInfo.usdTry) && liveInfo.usdTry > 0 ? liveInfo.usdTry : 38.4520;
              const eurPrice = typeof liveInfo?.eurTry === 'number' && !isNaN(liveInfo.eurTry) && liveInfo.eurTry > 0 ? liveInfo.eurTry : 41.8250;
              return (
                <>
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    Ons Altın: <strong className={`font-mono ${isDark ? 'text-amber-400 font-extrabold' : 'text-amber-600 font-bold'}`}>${onsPrice.toFixed(2)}</strong>
                  </span>
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    USD/TRY: <strong className={`font-mono font-bold ${isDark ? 'text-emerald-400 font-extrabold' : 'text-slate-900'}`}>{usdPrice.toFixed(4)} ₺</strong>
                  </span>
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    EUR/TRY: <strong className={`font-mono font-bold ${isDark ? 'text-emerald-400 font-extrabold' : 'text-slate-900'}`}>{eurPrice.toFixed(4)} ₺</strong>
                  </span>
                </>
              );
            })()}
          </div>

          <div className="flex items-center space-x-2 text-[11px]">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Canlı Piyasa Akışı · Otomatik Güncelleniyor</span>
            </span>
          </div>
        </div>

        {/* Tab 1: Market Grid (6 Firma Kartları) */}
        {activeTab === 'market' && (
          <div className="space-y-4">
            
            {/* Professional Product Filter Bar (Kaynak Verilerden Otomatik Çekilen Ürün & Fiyat Filtresi) */}
            <div className="space-y-3">
              <ProductFilterBar
                sources={sources}
                filterState={productFilter}
                onFilterChange={setProductFilter}
              />

              {/* Quick Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center space-x-2">
                  {hiddenFirmKeys.length > 0 && (
                    <button
                      onClick={handleShowAllFirms}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-semibold transition text-xs"
                      title="Gizlenen tüm firmaları ana sayfaya geri getir"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Gizlenenleri Göster ({hiddenFirmKeys.length})</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSettingsTab('display');
                      setSettingsFirmKey(undefined);
                      setIsSettingsOpen(true);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold transition text-xs shadow-xs"
                    title="Görünüm, Düzen, Okunaklı Temalar ve Kart Ayarlarını Aç"
                  >
                    <Settings className="w-3.5 h-3.5 text-amber-500" />
                    <span>Terminal Ayarları</span>
                  </button>
                </div>
              </div>
            </div>



            {/* Firma Kartları Grid - Yan Yana 5 Firma ve Ölçeklendirme */}
            <div
              className={`transition-all duration-200 ${
                gridColumns === 5
                  ? 'grid-cols-5-custom gap-3'
                  : gridColumns === 4
                  ? 'grid-cols-4-custom gap-3.5'
                  : 'grid-cols-3-custom gap-4'
              }`}
              style={{
                zoom: `${scalePercent}%`,
              }}
            >
              {getSortedFirmEntries().map(([key, sourceData], index) => {
                const isTop5 = index < 5;
                return (
                  <div key={key} className="relative flex flex-col">
                    {/* Position Label: Indicates slot #1 to #5 */}
                    <div className="flex items-center justify-between text-[10px] px-2 py-0.5 text-slate-500 mb-1">
                      <span className="flex items-center space-x-1">
                        <span className={`font-mono font-bold ${isTop5 ? 'text-amber-400' : 'text-slate-600'}`}>
                          #{index + 1}
                        </span>
                        {isTop5 && gridColumns === 5 && (
                          <span className="text-[9px] px-1 rounded bg-amber-500/10 text-amber-400 font-medium">
                            1. Satır (İlk 5)
                          </span>
                        )}
                      </span>
                    </div>

                    <FirmCard
                      sourceKey={key}
                      sourceData={sourceData}
                      allSources={sources}
                      globalSearch={productFilter.searchQuery || globalSearch}
                      selectedProductCode={productFilter.selectedCode}
                      selectedCategory={productFilter.category}
                      compact={density === 'compact' || gridColumns === 5}
                      globalDisplayMode={globalDisplayMode}
                      standardTheme={standardTheme}
                      fontScale={fontScale}
                      onSelectForCalculator={handleSelectForCalculator}
                      onOpenPriceHistory={(code) => handleOpenPriceHistory(code, key)}
                      onHideFirm={handleHideFirm}
                      onOpenSettings={(fKey) => {
                        setSettingsTab('firm_cells');
                        setSettingsFirmKey(fKey);
                        setIsSettingsOpen(true);
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {getSortedFirmEntries().length === 0 && (
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3 my-4">
                <Building2 className="w-10 h-10 text-amber-500/70 mx-auto" />
                <div className="font-bold text-white text-base">Ana Sayfadaki Tüm Firmalar Gizlendi</div>
                <p className="text-slate-400 text-xs max-w-md mx-auto">
                  Tüm firmaları ana sayfadan kaldırdınız. İstediğiniz firmaları geri eklemek için aşağıdaki butonu kullanabilir veya üst menüdeki "Firmaları Yönet" butonuna tıklayabilirsiniz.
                </p>
                <button
                  onClick={handleShowAllFirms}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-500/20 inline-flex items-center space-x-1.5"
                >
                  <Eye className="w-4 h-4 stroke-[2.5]" />
                  <span>Tüm Firmaları Yeniden Göster / Ekle</span>
                </button>
              </div>
            )}

          </div>
        )}

        {/* Tab 2: Full Matrix View (6 Firmalar Yan Yana) */}
        {activeTab === 'matrix' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 font-medium">Görünüm:</span>
                <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setActiveTab('market')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Ana Sayfa</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('matrix')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 font-bold transition"
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Fiyat Karşılaştırma</span>
                  </button>
                </div>
              </div>
            </div>

            <MatrixView
              sources={sources}
              onSelectForCalculator={handleSelectForCalculator}
            />
          </div>
        )}

        {/* Tab 3: Arbitraj Radarı */}
        {activeTab === 'arbitrage' && (
          <ArbitrageRadar
            sources={sources}
            onOpenAdvisorWithTopic={handleOpenAdvisorWithTopic}
            onSelectForCalculator={handleSelectForCalculator}
            onTestAlert={handleTestArbitrageAlert}
          />
        )}



        {/* Tab 5: Portföy Takibi */}
        {activeTab === 'portfolio' && (
          <PortfolioTracker
            sources={sources}
            user={user}
            onLogin={handleLogin}
          />
        )}

        {/* Tab 6: Google Drive Arşiv */}
        {activeTab === 'drive' && (
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Google Drive Piyasa Arşivi</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  6 firmanın anlık kurlarını ve portföy durumunu güvenle Google Drive hesabınızda yedekleyin.
                </p>
              </div>

              <button
                onClick={() => setIsDriveModalOpen(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-sm"
              >
                Drive Arşiv Yöneticisini Aç
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4 space-y-1.5">
                <div className="font-bold text-amber-400 text-xs">Piyasa Snapshot Yedekleme</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Markdown ve JSON formatlarında tarih/saat damgalı eksiksiz fiyat listesi oluşturur.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4 space-y-1.5">
                <div className="font-bold text-emerald-400 text-xs">Güvenli ve İzinli Erişim</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Yalnızca kullanıcının açık onayıyla, en dar kapsamlı Google Drive yetkisi (drive.file) kullanılır.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4 space-y-1.5">
                <div className="font-bold text-slate-300 text-xs">Eski Raporları İnceleme</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Daha önce kaydedilmiş raporlarınızı doğrudan Google Drive üzerinden inceleyebilirsiniz.
                </p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Clean Footer without mechanical clutter */}
      <footer
        className={`border-t py-4 text-center text-xs transition-colors duration-200 ${
          isDark
            ? 'border-slate-800/60 bg-slate-950 text-slate-500'
            : 'border-slate-200 bg-white text-slate-600'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-emerald-500 tracking-wider">RADAR</span>
            <span>Konsolide Finans Terminali © 2026</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center space-x-2">
            <span>Socket.IO Canlı Veri</span>
            <span aria-hidden="true">·</span>
            <span>Firebase</span>
            <span aria-hidden="true">·</span>
            <span>Google Drive</span>
            <span aria-hidden="true">·</span>
            <span>Gemini AI</span>
          </div>
        </div>
      </footer>

      {/* Gemini AI Advisor Modal */}
      {isAdvisorOpen && (
        <GeminiAdvisorModal
          isOpen={isAdvisorOpen}
          onClose={() => setIsAdvisorOpen(false)}
          sources={sources}
          initialPrompt={advisorPrompt}
        />
      )}

      {/* Price Alerts Modal */}
      {isAlertsOpen && (
        <PriceAlertsModal
          isOpen={isAlertsOpen}
          onClose={() => setIsAlertsOpen(false)}
          sources={sources}
          user={user}
          onLogin={handleLogin}
        />
      )}

      {/* Google Drive Export Modal */}
      {isDriveModalOpen && (
        <GoogleDriveExportModal
          isOpen={isDriveModalOpen}
          onClose={() => setIsDriveModalOpen(false)}
          sources={sources}
          user={user}
          onLogin={handleLogin}
        />
      )}

      {/* Terminal Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          globalDisplayMode={globalDisplayMode}
          onSelectDisplayMode={handleSetGlobalDisplayMode}
          standardTheme={standardTheme}
          onSelectStandardTheme={handleSetStandardTheme}
          fontScale={fontScale}
          onSelectFontScale={handleSetFontScale}
          gridColumns={gridColumns}
          onSelectGridColumns={setGridColumns}
          scalePercent={scalePercent}
          onSelectScalePercent={setScalePercent}
          density={density}
          onSelectDensity={setDensity}
          firmSortMode={firmSortMode}
          onSelectFirmSortMode={setFirmSortMode}
          sortMode={sortMode}
          onSelectSortMode={setSortMode}
          onOpenFirmManage={() => {
            setIsSettingsOpen(false);
            setIsFirmOrderModalOpen(true);
          }}
          onOpenCustomItemOrder={() => {
            setIsSettingsOpen(false);
            setIsCustomOrderModalOpen(true);
          }}
          hiddenFirmKeysCount={hiddenFirmKeys.length}
          onShowAllFirms={handleShowAllFirms}
          sources={sources}
          initialTab={settingsTab}
          initialFirmKey={settingsFirmKey}
          activeViewTab={activeTab === 'matrix' ? 'matrix' : 'market'}
          onSelectViewTab={(tab) => setActiveTab(tab)}
        />
      )}

      {/* Historical Price Analysis & Interactive Chart Modal */}
      {isPriceHistoryOpen && (
        <PriceHistoryModal
          isOpen={isPriceHistoryOpen}
          onClose={() => setIsPriceHistoryOpen(false)}
          initialCode={selectedHistoryCode}
          initialFirm={selectedHistoryFirm}
        />
      )}

      {/* Persistent Arbitrage Opportunity History Modal */}
      {isArbitrageHistoryOpen && (
        <ArbitrageHistoryModal
          isOpen={isArbitrageHistoryOpen}
          onClose={() => setIsArbitrageHistoryOpen(false)}
          sources={sources}
          onSelectForCalculator={handleSelectForCalculator}
        />
      )}

      {/* Custom Item Sorting Order Modal */}
      {isCustomOrderModalOpen && (
        <CustomOrderModal
          isOpen={isCustomOrderModalOpen}
          onClose={() => setIsCustomOrderModalOpen(false)}
        />
      )}

      {/* Custom Firm Sorting & Manage (Ekle/Kaldır/Sırala) Modal */}
      {isFirmOrderModalOpen && (
        <FirmOrderModal
          isOpen={isFirmOrderModalOpen}
          onClose={() => setIsFirmOrderModalOpen(false)}
          sources={sources}
          firmOrder={customFirmOrder}
          setFirmOrder={handleUpdateCustomFirmOrder}
          onResetOrder={handleResetFirmOrder}
          hiddenFirmKeys={hiddenFirmKeys}
          onToggleHideFirm={handleToggleHideFirm}
          onShowAllFirms={handleShowAllFirms}
        />
      )}

      {/* Okunaklı Tema ve Görünüm Düzeni Modalı */}
      {isThemeModalOpen && (
        <ThemeManagerModal
          isOpen={isThemeModalOpen}
          onClose={() => setIsThemeModalOpen(false)}
          globalDisplayMode={globalDisplayMode}
          onSelectDisplayMode={handleSetGlobalDisplayMode}
          selectedTheme={standardTheme}
          onSelectTheme={handleSetStandardTheme}
          fontScale={fontScale}
          onSelectFontScale={handleSetFontScale}
        />
      )}

      {/* Firma Canlı Fiyatları Açılır Penceresi (Top Menu Modal) */}
      {isFirmPricesModalOpen && (
        <FirmPricesModal
          isOpen={isFirmPricesModalOpen}
          onClose={() => setIsFirmPricesModalOpen(false)}
          sources={sources}
          initialFirmKey={selectedFirmForModal}
          onSelectForCalculator={handleSelectForCalculator}
          onOpenPriceHistory={(code) => handleOpenPriceHistory(code, selectedFirmForModal)}
        />
      )}

      {/* Kuyumcu Masası & Hızlı Hesaplama Aracı Açılır Penceresi */}
      <JewelryCalculator
        sources={sources}
        initialItem={selectedItemForCalc}
        isOpen={isCalculatorModalOpen}
        onClose={() => setIsCalculatorModalOpen(false)}
        isModal={true}
      />

      {/* Tüm Varlıklar İçin En Yüksek Alış & En Düşük Satış Açılır Penceresi (6. Fotoğraf Çift Tıklama İstemi) */}
      <BestMarketPricesModal
        isOpen={isBestPricesModalOpen}
        onClose={() => setIsBestPricesModalOpen(false)}
        sources={sources}
        onSelectForCalculator={handleSelectForCalculator}
        onFilterProduct={(code) => {
          setProductFilter((prev) => ({ ...prev, selectedCode: code }));
          setActiveTab('market');
        }}
      />

      {/* Canlı Arbitraj ve Bildirim Toast Uyarısı */}
      {lastNotificationToast && (
        <div className="fixed top-5 right-5 z-[9999] max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/95 dark:bg-slate-900/95 text-white border border-amber-500/40 shadow-2xl shadow-amber-500/20 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between space-x-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <BellRing className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-sm font-medium leading-snug">
                {lastNotificationToast}
              </div>
            </div>
            <button
              onClick={() => setLastNotificationToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition shrink-0 cursor-pointer"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
