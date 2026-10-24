import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTheme, THEMES } from '../context/ThemeContext';
import {
  GlobalDisplayMode,
  StandardThemeId,
  FontScaleMode,
} from '../types/theme';
import { STANDARD_THEMES } from './ThemeManagerModal';
import {
  FIRM_SORT_OPTIONS,
  FirmSortMode,
  SORT_OPTIONS,
  SortMode,
  DEFAULT_FIRM_ORDER,
} from '../types/sort';
import { SourcesMap, MarketItem } from '../types/market';
import { CellConfig } from './FirmCardSettingsModal';
import { CurrencyFlag } from './CurrencyFlag';
import { isFxItem, getCleanCurrencyCode, getStandardizedProductName } from '../utils/productUtils';
import { FirmLogo } from './FirmLogo';
import {
  Settings,
  X,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Zap,
  Sliders,
  Check,
  RotateCcw,
  Globe,
  Copy,
  ExternalLink,
  Store,
  Plus,
  Trash2,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Share2,
  Table,
  LayoutGrid,
  Columns,
  Type,
  Palette,
  Sparkles,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Gem,
  FileText,
  Compass,
  Tv,
  Coins,
  Shield,
  Landmark,
  CheckSquare,
  Square,
  Search,
  Image as ImageIcon,
  Hash,
} from 'lucide-react';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Fotoğraftaki ayarlar (Düzen, Tema, Ölçek, Sıralama):
  globalDisplayMode?: GlobalDisplayMode;
  onSelectDisplayMode?: (mode: GlobalDisplayMode) => void;
  standardTheme?: StandardThemeId;
  onSelectStandardTheme?: (theme: StandardThemeId) => void;
  fontScale?: FontScaleMode;
  onSelectFontScale?: (scale: FontScaleMode) => void;
  gridColumns?: 3 | 4 | 5;
  onSelectGridColumns?: (cols: 3 | 4 | 5) => void;
  scalePercent?: number;
  onSelectScalePercent?: (scale: number) => void;
  density?: 'compact' | 'normal';
  onSelectDensity?: (d: 'compact' | 'normal') => void;
  firmSortMode?: FirmSortMode;
  onSelectFirmSortMode?: (mode: FirmSortMode) => void;
  sortMode?: SortMode;
  onSelectSortMode?: (mode: SortMode) => void;
  onOpenFirmManage?: () => void;
  onOpenCustomItemOrder?: () => void;
  hiddenFirmKeysCount?: number;
  onShowAllFirms?: () => void;
  sources?: SourcesMap;
  initialTab?: 'display' | 'firm_cells' | 'general' | 'urls' | 'stores';
  initialFirmKey?: string;
  activeViewTab?: 'market' | 'matrix';
  onSelectViewTab?: (tab: 'market' | 'matrix') => void;
}

interface CustomStore {
  id: string;
  sourceName: string;
  category: 'kuyumcu' | 'doviz' | 'serbest';
  location?: string;
  phone?: string;
  apiEndpoint?: string;
  buyOffsetPercent?: number;
  sellOffsetPercent?: number;
  createdAt?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  globalDisplayMode = 'store_custom',
  onSelectDisplayMode,
  standardTheme = 'dark_gold',
  onSelectStandardTheme,
  fontScale = 'normal',
  onSelectFontScale,
  gridColumns = 5,
  onSelectGridColumns,
  scalePercent = 88,
  onSelectScalePercent,
  density = 'compact',
  onSelectDensity,
  firmSortMode = 'default',
  onSelectFirmSortMode,
  sortMode = 'default',
  onSelectSortMode,
  onOpenFirmManage,
  onOpenCustomItemOrder,
  hiddenFirmKeysCount = 0,
  onShowAllFirms,
  sources,
  initialTab = 'display',
  initialFirmKey,
  activeViewTab = 'market',
  onSelectViewTab,
}) => {
  const { theme, setTheme, settings, updateSettings, playAlertSound } = useTheme();

  // Tab State: 'display' | 'firm_cells' | 'general' | 'urls' | 'stores'
  const [activeTab, setActiveTab] = useState<'display' | 'firm_cells' | 'general' | 'urls' | 'stores'>(initialTab);

  // Sync tab and firm when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      if (initialFirmKey) {
        setSelectedFirmKey(initialFirmKey);
      }
    }
  }, [isOpen, initialTab, initialFirmKey]);

  // URL Copy state
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Store Management State
  const [stores, setStores] = useState<CustomStore[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] = useState<'kuyumcu' | 'doviz' | 'serbest'>('kuyumcu');
  const [storeLocation, setStoreLocation] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeApiEndpoint, setStoreApiEndpoint] = useState('');
  const [storeBuyOffset, setStoreBuyOffset] = useState('0');
  const [storeSellOffset, setStoreSellOffset] = useState('0');
  const [isSubmittingStore, setIsSubmittingStore] = useState(false);
  const [storeSuccessMsg, setStoreSuccessMsg] = useState<string | null>(null);
  const [storeErrorMsg, setStoreErrorMsg] = useState<string | null>(null);

  // API Testing State
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<{
    ok: boolean;
    status?: number;
    responseTimeMs?: number;
    contentType?: string;
    isJson?: boolean;
    sample?: any;
    error?: string;
  } | null>(null);

  // -------------------------------------------------------------
  // Firma & Hücre Ayarları (1. Fotoğraftaki Ayarlar) State
  // -------------------------------------------------------------
  const firmKeys = sources
    ? Object.keys(sources).sort((a, b) => {
        const idxA = DEFAULT_FIRM_ORDER.indexOf(a);
        const idxB = DEFAULT_FIRM_ORDER.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
      })
    : ['gunes_kuyumculuk', 'kaptan_doviz', 'solis_doviz', 'sar_doviz', 'altinkose', 'ilkay_doviz', 'vizyon_altin'];
  const [selectedFirmKey, setSelectedFirmKey] = useState<string>(firmKeys[0] || 'gunes_kuyumculuk');
  const [cellTitle, setCellTitle] = useState('');
  const [cellTagline, setCellTagline] = useState('');
  const [cellEmblem, setCellEmblem] = useState<CellConfig['emblemType']>('gunes');
  const [cellLogoUrl, setCellLogoUrl] = useState('');
  const [cellViewMode, setCellViewMode] = useState<CellConfig['viewMode']>('gunes_terminal');
  const [cellCardTheme, setCellCardTheme] = useState<CellConfig['cardTheme']>('photo_light');
  const [cellDecimals, setCellDecimals] = useState<number>(3);
  const [cellSelectedCodes, setCellSelectedCodes] = useState<Set<string>>(new Set());
  const [cellSearch, setCellSearch] = useState('');
  const [cellSuccessMsg, setCellSuccessMsg] = useState<string | null>(null);

  const sharedAppUrl =
    'https://ais-pre-25jn3b2kvufaa6d3heguza-942704108154.europe-west2.run.app';
  const devAppUrl =
    'https://ais-dev-25jn3b2kvufaa6d3heguza-942704108154.europe-west2.run.app';

  // Helper to load config for a given firm key
  const loadFirmConfig = (fKey: string) => {
    const isSarDoviz = fKey === 'sar_doviz';
    const isKaptan = fKey === 'kaptan_doviz';
    const isGunes = fKey === 'gunes_kuyumculuk';
    const sData = sources?.[fKey];

    const defaultTitle =
      sData?.sourceName ||
      (isSarDoviz
        ? 'SAR Döviz'
        : isKaptan
        ? 'Kaptan'
        : isGunes
        ? 'Güneş'
        : fKey === 'solis_doviz'
        ? 'Solis'
        : fKey === 'altinkose'
        ? 'Altınköşe'
        : fKey === 'ilkay_doviz'
        ? 'İlkay'
        : fKey === 'vizyon_altin'
        ? 'Vizyon'
        : fKey);
    const defaultTagline = isSarDoviz ? 'A GRUBU YETKİLİ MÜESSESE' : isKaptan ? 'DÖVİZ & ALTIN PİYASASI' : isGunes ? 'MEYDAN · ÇARŞI · TÜRKİŞ · CİTYMALL' : '';
    const defaultEmblem: CellConfig['emblemType'] = isSarDoviz ? 'sar' : isKaptan ? 'kaptan' : isGunes ? 'gunes' : 'none';
    const defaultView: CellConfig['viewMode'] = isSarDoviz ? 'sar_cards' : isKaptan ? 'kaptan_table' : isGunes ? 'gunes_terminal' : 'standard_table';
    const defaultDecimals = isSarDoviz || isKaptan ? 3 : 2;
    const defaultTheme: CellConfig['cardTheme'] = isGunes ? 'dark_gold' : 'photo_light';

    try {
      const raw = localStorage.getItem(`samsun_sarraf_cell_config_${fKey}`);
      if (raw) {
        const parsed = JSON.parse(raw);
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
  };

  // Sources ref & loaded tracking to NEVER wipe user selections on live price ticks
  const sourcesRef = useRef(sources);
  useEffect(() => {
    sourcesRef.current = sources;
  }, [sources]);

  const prevIsOpenRef = useRef(false);
  const loadedFirmKeyRef = useRef<string | null>(null);

  // Populate firm cell state ONLY when selected firm changes or modal opens (NEVER on sources live ticks)
  useEffect(() => {
    if (!isOpen) {
      prevIsOpenRef.current = false;
      loadedFirmKeyRef.current = null;
      return;
    }

    const hasJustOpened = !prevIsOpenRef.current;
    const firmChanged = loadedFirmKeyRef.current !== selectedFirmKey;

    if (hasJustOpened || firmChanged) {
      prevIsOpenRef.current = true;
      loadedFirmKeyRef.current = selectedFirmKey;

      const targetKey = selectedFirmKey || firmKeys[0] || 'kaptan_doviz';
      const cfg = loadFirmConfig(targetKey);
      setCellTitle(cfg.customTitle);
      setCellTagline(cfg.customTagline);
      setCellEmblem(cfg.emblemType);
      setCellLogoUrl(cfg.customLogoUrl);
      setCellViewMode(cfg.viewMode);
      setCellCardTheme(cfg.cardTheme);
      setCellDecimals(cfg.decimals);

      const items = (sourcesRef.current?.[targetKey]?.data || sources?.[targetKey]?.data || [])
        .filter((i) => i && i.code !== 'ONS');

      if (cfg.visibleCodes.length === 0) {
        setCellSelectedCodes(new Set(items.map((i) => i.code)));
      } else {
        setCellSelectedCodes(new Set(cfg.visibleCodes.filter((c: string) => c !== 'ONS')));
      }
      setCellSearch('');
      setCellSuccessMsg(null);
    }
  }, [isOpen, selectedFirmKey]);

  // Load custom stores when tab opens
  useEffect(() => {
    if (isOpen && activeTab === 'stores') {
      fetchCustomStores();
    }
  }, [isOpen, activeTab]);

  const fetchCustomStores = async () => {
    setIsLoadingStores(true);
    try {
      const res = await fetch('/api/custom-stores');
      if (res.ok) {
        const json = await res.json();
        setStores(json.stores || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingStores(false);
    }
  };

  const handleCopy = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(label);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleTestApi = async () => {
    if (!storeApiEndpoint || !storeApiEndpoint.trim().startsWith('http')) {
      setStoreErrorMsg('Lütfen http:// veya https:// ile başlayan geçerli bir API adresi girin.');
      return;
    }

    setIsTestingApi(true);
    setApiTestResult(null);
    setStoreErrorMsg(null);

    try {
      const res = await fetch('/api/test-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: storeApiEndpoint.trim() }),
      });
      const data = await res.json();
      setApiTestResult(data);
    } catch (err: any) {
      setApiTestResult({
        ok: false,
        error: err?.message || 'Bağlantı hatası.',
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      setStoreErrorMsg('Mağaza adı zorunludur.');
      return;
    }

    setIsSubmittingStore(true);
    setStoreErrorMsg(null);
    setStoreSuccessMsg(null);

    try {
      const payload = {
        name: storeName.trim(),
        category: storeCategory,
        location: storeLocation.trim() || undefined,
        phone: storePhone.trim() || undefined,
        apiEndpoint: storeApiEndpoint.trim() || undefined,
        buyOffsetPercent: parseFloat(storeBuyOffset) || 0,
        sellOffsetPercent: parseFloat(storeSellOffset) || 0,
      };

      const res = await fetch('/api/custom-stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Mağaza eklenemedi.');
      }

      setStoreSuccessMsg(`"${storeName}" başarıyla eklendi ve fiyat paneline alındı!`);
      setStoreName('');
      setStoreLocation('');
      setStorePhone('');
      setStoreApiEndpoint('');
      setStoreBuyOffset('0');
      setStoreSellOffset('0');
      setApiTestResult(null);

      // Refresh stores list
      await fetchCustomStores();

      setTimeout(() => setStoreSuccessMsg(null), 4000);
    } catch (err: any) {
      setStoreErrorMsg(err?.message || 'Mağaza eklenirken hata oluştu.');
    } finally {
      setIsSubmittingStore(false);
    }
  };

  const handleDeleteStore = async (id: string) => {
    if (!window.confirm('Bu mağazayı silmek istediğinizden emin misiniz?')) return;

    try {
      const res = await fetch(`/api/custom-stores/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStores((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {
      // ignore
    }
  };

  // Firm Cell Saving & Reset
  const rawCurrentFirmItems = sources?.[selectedFirmKey]?.data || [];
  const currentFirmItems = useMemo(() => {
    return rawCurrentFirmItems.filter((i) => i && i.code !== 'ONS');
  }, [rawCurrentFirmItems]);

  const isGoldItem = (code: string) => {
    return (
      code.startsWith('ALTIN') ||
      code.startsWith('CEYREK') ||
      code.startsWith('YARIM') ||
      code.startsWith('TAM') ||
      code.startsWith('ATA') ||
      code.startsWith('GREMSE') ||
      code === 'GUMUS' ||
      code === 'RESAT_LIRA' ||
      code === 'XAU_KULCE'
    );
  };

  const isFxItem = (code: string) => {
    return (
      code.includes('TRY') &&
      !code.startsWith('ALTIN') &&
      !code.startsWith('CEYREK') &&
      !code.startsWith('YARIM') &&
      !code.startsWith('TAM') &&
      !code.startsWith('ATA') &&
      !code.startsWith('GREMSE')
    );
  };

  const [currencyCategoryFilter, setCurrencyCategoryFilter] = useState<'all' | 'gold' | 'fx'>('all');

  const filteredCurrencies = useMemo(() => {
    return currentFirmItems.filter((item) => {
      if (currencyCategoryFilter === 'gold' && !isGoldItem(item.code)) return false;
      if (currencyCategoryFilter === 'fx' && !isFxItem(item.code)) return false;
      if (!cellSearch.trim()) return true;
      const q = cellSearch.toLowerCase();
      return (
        String(item?.name || '').toLowerCase().includes(q) ||
        String(item?.code || '').toLowerCase().includes(q)
      );
    });
  }, [currentFirmItems, currencyCategoryFilter, cellSearch]);

  // Atomic toggle without any reset risk
  const toggleCurrencyCode = (code: string) => {
    setCellSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const handleSelectAllCurrencies = () => {
    setCellSelectedCodes(new Set(currentFirmItems.map((i) => i.code)));
  };

  const handleDeselectAllCurrencies = () => {
    setCellSelectedCodes(new Set());
  };

  const handleSelectOnlyGoldCurrencies = () => {
    const goldOnly = currentFirmItems.filter((i) => isGoldItem(i.code)).map((i) => i.code);
    setCellSelectedCodes(new Set(goldOnly));
  };

  const handleSelectOnlyFxCurrencies = () => {
    const fxOnly = currentFirmItems.filter((i) => isFxItem(i.code)).map((i) => i.code);
    setCellSelectedCodes(new Set(fxOnly));
  };

  const handleSelectPopularCurrencies = () => {
    const popularCodes = ['ALTIN_HAS', 'CEYREK_YENI', 'ALTIN_22', 'ATA_YENI', 'USDTRY', 'EURTRY', 'GBPTRY'];
    const popular = currentFirmItems.filter((i) => popularCodes.includes(i.code)).map((i) => i.code);
    setCellSelectedCodes(new Set(popular));
  };

  const isFirmCellDirty = useMemo(() => {
    const targetKey = selectedFirmKey || firmKeys[0] || 'kaptan_doviz';
    const saved = loadFirmConfig(targetKey);
    if (cellTitle !== saved.customTitle) return true;
    if (cellTagline !== saved.customTagline) return true;
    if (cellEmblem !== saved.emblemType) return true;
    if (cellLogoUrl !== saved.customLogoUrl) return true;
    if (cellViewMode !== saved.viewMode) return true;
    if (cellCardTheme !== saved.cardTheme) return true;
    if (cellDecimals !== saved.decimals) return true;

    const savedVisible = saved.visibleCodes.length === 0
      ? currentFirmItems.map((i) => i.code)
      : saved.visibleCodes.filter((c: string) => c !== 'ONS');

    if (cellSelectedCodes.size !== savedVisible.length) return true;
    for (const code of savedVisible) {
      if (!cellSelectedCodes.has(code)) return true;
    }
    return false;
  }, [
    selectedFirmKey,
    cellTitle,
    cellTagline,
    cellEmblem,
    cellLogoUrl,
    cellViewMode,
    cellCardTheme,
    cellDecimals,
    cellSelectedCodes,
    currentFirmItems,
  ]);

  const handleSaveFirmCell = () => {
    const visibleCodesToSave =
      cellSelectedCodes.size === currentFirmItems.length ? [] : Array.from(cellSelectedCodes);

    const newCfg: CellConfig = {
      customTitle: cellTitle.trim() || (sources?.[selectedFirmKey]?.sourceName || selectedFirmKey),
      customTagline: cellTagline.trim(),
      emblemType: cellEmblem,
      customLogoUrl: cellLogoUrl.trim(),
      viewMode: cellViewMode,
      cardTheme: cellCardTheme,
      decimals: cellDecimals,
      visibleCodes: visibleCodesToSave,
    };

    localStorage.setItem(`samsun_sarraf_cell_config_${selectedFirmKey}`, JSON.stringify(newCfg));
    window.dispatchEvent(new Event('sarraf_cell_config_updated'));
    setCellSuccessMsg(`"${cellTitle || selectedFirmKey}" kart ayarları başarıyla kaydedildi!`);
    setTimeout(() => setCellSuccessMsg(null), 3500);
  };

  const handleResetFirmCell = () => {
    localStorage.removeItem(`samsun_sarraf_cell_config_${selectedFirmKey}`);
    localStorage.removeItem(`samsun_sarraf_visible_${selectedFirmKey}`);
    window.dispatchEvent(new Event('sarraf_cell_config_updated'));

    const def = loadFirmConfig(selectedFirmKey);
    setCellTitle(def.customTitle);
    setCellTagline(def.customTagline);
    setCellEmblem(def.emblemType);
    setCellLogoUrl(def.customLogoUrl);
    setCellViewMode(def.viewMode);
    setCellCardTheme(def.cardTheme);
    setCellDecimals(def.decimals);
    setCellSelectedCodes(new Set(currentFirmItems.map((i) => i.code)));

    setCellSuccessMsg(`"${selectedFirmKey}" varsayılan ayarlarına geri döndürüldü.`);
    setTimeout(() => setCellSuccessMsg(null), 3500);
  };

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || activeTab !== 'firm_cells') return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveFirmCell();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, cellTitle, cellTagline, cellEmblem, cellLogoUrl, cellViewMode, cellCardTheme, cellDecimals, cellSelectedCodes, selectedFirmKey, currentFirmItems]);

  const selectedThemeDef =
    STANDARD_THEMES.find((t) => t.id === standardTheme) || STANDARD_THEMES[1];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-[#090d16] border border-slate-700/80 rounded-2xl max-w-4xl lg:max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 ring-1 ring-white/5">
        
        {/* Pro Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-950 via-[#0d121f] to-slate-950 border-b border-slate-800/90 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400 border border-amber-500/30 shadow-inner">
              <Settings className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-white text-base tracking-tight truncate">
                  Terminal & Sistem Yapılandırması
                </h3>
                <span className="hidden sm:inline-flex items-center space-x-1.5 text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>CANLI PİYASA SİSTEMİ</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Görünüm düzeni, borsa temaları, kart mimarisi ve terminal ergonomisi
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 shrink-0">
            <span className="hidden md:inline-flex items-center text-[10px] text-slate-400 font-mono bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
              ESC: Kapat
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition border border-transparent hover:border-slate-700"
              title="Kapat (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800/90 bg-slate-950/80 px-3 sm:px-5 text-xs overflow-x-auto custom-scrollbar shrink-0 gap-1 sm:gap-1.5">
          {/* TAB 0: Görünüm, Düzen & Temalar */}
          <button
            onClick={() => setActiveTab('display')}
            className={`py-3 px-3.5 font-bold border-b-2 flex items-center space-x-2 transition whitespace-nowrap text-xs ${
              activeTab === 'display'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-amber-400" />
            <span>Görünüm, Düzen & Temalar</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-amber-400/20 text-amber-200">
              Temel
            </span>
          </button>

          {/* TAB 1: Firma & Kart Ayarları */}
          <button
            onClick={() => setActiveTab('firm_cells')}
            className={`py-3 px-3.5 font-bold border-b-2 flex items-center space-x-2 transition whitespace-nowrap text-xs ${
              activeTab === 'firm_cells'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Firma & Kart Ayarları</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-slate-800 text-slate-300">
              6 Firma
            </span>
          </button>

          {/* TAB 2: Genel Sistem & Ses */}
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 px-3.5 font-bold border-b-2 flex items-center space-x-2 transition whitespace-nowrap text-xs ${
              activeTab === 'general'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Genel Sistem & Ses</span>
          </button>

          {/* TAB 3: Site URL Bilgisi */}
          <button
            onClick={() => setActiveTab('urls')}
            className={`py-3 px-3.5 font-bold border-b-2 flex items-center space-x-2 transition whitespace-nowrap text-xs ${
              activeTab === 'urls'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>Site URL Bilgisi</span>
          </button>

          {/* TAB 4: Mağaza Ekle */}
          <button
            onClick={() => setActiveTab('stores')}
            className={`py-3 px-3.5 font-bold border-b-2 flex items-center space-x-2 transition whitespace-nowrap text-xs ${
              activeTab === 'stores'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mağaza Ekle</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          
          {/* TAB 0: Görünüm, Düzen & Okunaklı Temalar */}
          {activeTab === 'display' && (
            <div className="space-y-6 text-slate-200">

              {/* CANLI ÖNİZLEME MASASI (Interactive Real-Time Preview) */}
              <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-[#0b101c] to-slate-950 p-4 shadow-inner relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
                      Canlı Terminal Önizlemesi
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold">
                      {selectedThemeDef.name}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
                    <span>Format: <strong className="text-white">{globalDisplayMode === 'store_custom' ? 'Özgün Vitrin' : 'Standart Tablo'}</strong></span>
                    <span>•</span>
                    <span>Punto: <strong className="text-white">{fontScale === 'normal' ? 'Normal' : fontScale === 'large' ? '+%15 Rahat' : '+%30 Vitrin/TV'}</strong></span>
                    <span>•</span>
                    <span>Sütun: <strong className="text-white">{gridColumns} Firma</strong></span>
                  </div>
                </div>

                {/* Rendered Live Miniature Card */}
                <div
                  className="rounded-xl p-3 border transition-all duration-300 shadow-md font-mono"
                  style={{
                    backgroundColor: selectedThemeDef.bgPreview,
                    color: selectedThemeDef.textPreview,
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                  }}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10 mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="font-extrabold text-xs tracking-tight">GÜNEŞ KUYUMCULUK</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10 font-sans">Samsun / Saathane</span>
                    </div>
                    <span className="text-[10px] text-emerald-500 font-bold">● CANLI PİYASA</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between p-1.5 rounded bg-black/5 dark:bg-white/5">
                      <span className="font-bold">HAS ALTIN (24K)</span>
                      <div className="space-x-2">
                        <span className="text-emerald-500 font-extrabold">6.575,91 ₺</span>
                        <span className="text-rose-500 font-extrabold">6.662,39 ₺</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-black/5 dark:bg-white/5">
                      <span className="font-bold">22 AYAR BİLEZİK</span>
                      <div className="space-x-2">
                        <span className="text-emerald-500 font-extrabold">6.027,36 ₺</span>
                        <span className="text-rose-500 font-extrabold">6.193,87 ₺</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* BÖLÜM 1: ÇALIŞMA ALANI & VİTRİN FORMATI (Workspace & Display Architecture) */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* 1.1 Ana Görünüm Şekli */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                        <LayoutGrid className="w-4 h-4 text-amber-400" />
                        <span>Ana Çalışma Alanı</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Genel Arayüz Modu</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => onSelectViewTab && onSelectViewTab('market')}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between relative ${
                          activeViewTab === 'market'
                            ? 'bg-amber-500/15 border-amber-400 text-white font-bold ring-1 ring-amber-400/40 shadow-lg'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1.5">
                          <LayoutGrid className={`w-4 h-4 ${activeViewTab === 'market' ? 'text-amber-400' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold text-white">Ana Sayfa (Firma Kartları)</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-normal leading-tight">
                          Yan yana 6 mağaza vitrini ve detaylı sarrafiye kurları.
                        </p>
                        {activeViewTab === 'market' && (
                          <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-400 ring-4 ring-amber-400/20" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectViewTab && onSelectViewTab('matrix')}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between relative ${
                          activeViewTab === 'matrix'
                            ? 'bg-amber-500/15 border-amber-400 text-white font-bold ring-1 ring-amber-400/40 shadow-lg'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1.5">
                          <Table className={`w-4 h-4 ${activeViewTab === 'matrix' ? 'text-emerald-400' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold text-white">Fiyat Karşılaştırma</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-normal leading-tight">
                          Tüm kurların tek satırda çapraz borsa karşılaştırması.
                        </p>
                        {activeViewTab === 'matrix' && (
                          <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 1.2 Kart Formatı (Görünüm Düzeni) */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                        <Table className="w-4 h-4 text-emerald-400" />
                        <span>Vitrin & Kart Mimari Formatı</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Hücre Dizilimi</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => onSelectDisplayMode && onSelectDisplayMode('store_custom')}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between relative ${
                          globalDisplayMode === 'store_custom'
                            ? 'bg-amber-500/15 border-amber-400 text-white font-bold ring-1 ring-amber-400/40 shadow-lg'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-white">Özgün Vitrinler</span>
                          {globalDisplayMode === 'store_custom' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                              Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-normal leading-tight">
                          Kaptan, Güneş ve SAR gibi her firmanın tescilli marka vitrini korunur.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectDisplayMode && onSelectDisplayMode('standard_table')}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between relative ${
                          globalDisplayMode === 'standard_table'
                            ? 'bg-amber-500/15 border-amber-400 text-white font-bold ring-1 ring-amber-400/40 shadow-lg'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-white">Standart Tablo</span>
                          {globalDisplayMode === 'standard_table' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                              Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-normal leading-tight">
                          Tüm firmalar birebir aynı sütun yapısında ve seçilen temada eşit borsa tablosunda gösterilir.
                        </p>
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* 1. Fotoğraftaki Bölüm: Ayarlar Kısmındaki Standart Birörnek Görünüm Bilgilendirme Şeridi */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs shadow-sm">
                <div className="flex items-center space-x-2.5">
                  <Table className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-slate-200">
                    <strong className="text-amber-400">
                      {globalDisplayMode === 'standard_table' ? 'Standart Birörnek Görünüm Aktif:' : 'Özgün Mağaza Tasarımları Aktif:'}
                    </strong>{' '}
                    {globalDisplayMode === 'standard_table' ? (
                      <>
                        Tüm firmalar{' '}
                        <span className="font-bold text-amber-300">
                          {selectedThemeDef.name}
                        </span>{' '}
                        temasında eşit borsa tablosunda listeleniyor.
                      </>
                    ) : (
                      <>
                        Firmalar kendi özgün kurumsal vitrin ve renk tasarımlarında listeleniyor.
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center space-x-2.5 text-[11px]">
                  {globalDisplayMode === 'standard_table' ? (
                    <button
                      type="button"
                      onClick={() => onSelectDisplayMode && onSelectDisplayMode('store_custom')}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-semibold transition"
                    >
                      Özgün Mağaza Tasarımlarına Dön
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectDisplayMode && onSelectDisplayMode('standard_table')}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-sm"
                    >
                      Standart Birörnek Tabloya Geç
                    </button>
                  )}
                </div>
              </div>

              {/* BÖLÜM 2: OKUNAKLI FİNANS TEMALARI (6 SEÇENEK) */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                    <Palette className="w-4 h-4 text-amber-400" />
                    <span>Yüksek Kontrastlı Finans Temaları (6 Seçenek)</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Güneş ışığı, vitrin ekranları ve gece seansı için optimize
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {STANDARD_THEMES.map((th) => {
                    const isSelected = standardTheme === th.id;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => onSelectStandardTheme && onSelectStandardTheme(th.id)}
                        className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between relative overflow-hidden group ${
                          isSelected
                            ? 'border-amber-400 ring-2 ring-amber-400/30 bg-slate-950 shadow-xl'
                            : 'border-slate-800/90 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {th.id === 'light_clarity' && <Sun className="w-4 h-4 text-amber-400 shrink-0" />}
                              {th.id === 'dark_gold' && <Moon className="w-4 h-4 text-amber-400 shrink-0" />}
                              {th.id === 'midnight_navy' && <Compass className="w-4 h-4 text-cyan-400 shrink-0" />}
                              {th.id === 'emerald_sarraf' && <Gem className="w-4 h-4 text-emerald-400 shrink-0" />}
                              {th.id === 'digital_led' && <Tv className="w-4 h-4 text-emerald-400 shrink-0" />}
                              {th.id === 'warm_cream' && <FileText className="w-4 h-4 text-amber-500 shrink-0" />}
                              <span className="font-extrabold text-xs text-white truncate">{th.name}</span>
                            </div>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 shrink-0">
                              {th.badge}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 mb-3 leading-relaxed line-clamp-2">
                            {th.description}
                          </p>
                        </div>

                        {/* Live Color Swatch & Price Strip */}
                        <div
                          className="p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between text-[11px] font-mono font-bold shadow-sm"
                          style={{ backgroundColor: th.bgPreview, color: th.textPreview }}
                        >
                          <div className="flex items-center space-x-1.5 truncate pr-1">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: th.accentPreview }}
                            />
                            <span className="truncate">HAS ALTIN</span>
                          </div>
                          <div className="flex items-center space-x-2 text-[10px] shrink-0 font-extrabold">
                            <span className="text-emerald-500">6.575 ₺</span>
                            <span className="text-rose-500">6.660 ₺</span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* BÖLÜM 3: TİPOGRAFİ, SÜTUN VE YOĞUNLUK KONTROLLERİ (Ergonomics) */}
              <div className="space-y-4 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                    <Type className="w-4 h-4 text-amber-400" />
                    <span>Tipografi, Sütun Sayısı & Ekran Ergonomisi</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">Büyük Ekran & Vitrin LED Ayarı</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                  {/* 3.1 Punto / Font Ölçeği */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                    <span className="text-xs text-slate-300 font-bold block">1. Yazı Boyutu (Punto)</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectFontScale && onSelectFontScale('normal')}
                        className={`p-2 rounded-xl text-center transition flex flex-col items-center justify-center ${
                          fontScale === 'normal'
                            ? 'bg-amber-500/20 border border-amber-400 text-amber-300 font-bold'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-extrabold">Standart</span>
                        <span className="text-[9px] text-slate-400 mt-0.5">Dengeli</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectFontScale && onSelectFontScale('large')}
                        className={`p-2 rounded-xl text-center transition flex flex-col items-center justify-center ${
                          fontScale === 'large'
                            ? 'bg-amber-500/20 border border-amber-400 text-amber-300 font-bold'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-extrabold text-amber-400">+%15</span>
                        <span className="text-[9px] text-slate-400 mt-0.5">Rahat</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectFontScale && onSelectFontScale('xlarge')}
                        className={`p-2 rounded-xl text-center transition flex flex-col items-center justify-center ${
                          fontScale === 'xlarge'
                            ? 'bg-amber-500/20 border border-amber-400 text-amber-300 font-bold'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-extrabold text-amber-300">+%30</span>
                        <span className="text-[9px] text-slate-400 mt-0.5">TV/LED</span>
                      </button>
                    </div>
                  </div>

                  {/* 3.2 Sütun Sayısı */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                    <span className="text-xs text-slate-300 font-bold block">2. Yan Yana Sütun Sayısı</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectGridColumns && onSelectGridColumns(3)}
                        className={`p-2 rounded-xl font-bold text-xs transition text-center ${
                          gridColumns === 3
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        3 Geniş
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectGridColumns && onSelectGridColumns(4)}
                        className={`p-2 rounded-xl font-bold text-xs transition text-center ${
                          gridColumns === 4
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        4 Dengeli
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectGridColumns && onSelectGridColumns(5)}
                        className={`p-2 rounded-xl font-bold text-xs transition text-center ${
                          gridColumns === 5
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        5 Kompakt
                      </button>
                    </div>
                  </div>

                  {/* 3.3 Ölçek ve Sıkılık */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-300 font-bold">3. Sayfa Ölçeği & Sıkılık</span>
                      <span className="text-xs font-mono font-extrabold text-amber-400">%{scalePercent}</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectScalePercent && onSelectScalePercent((scalePercent || 100) - 5)}
                        className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 hover:text-amber-400 font-bold text-xs flex items-center justify-center transition"
                      >
                        -
                      </button>
                      <div className="flex-1 flex justify-between gap-1">
                        {[85, 90, 100].map((sc) => (
                          <button
                            key={sc}
                            type="button"
                            onClick={() => onSelectScalePercent && onSelectScalePercent(sc)}
                            className={`flex-1 py-1 rounded-md text-[11px] font-bold font-mono transition ${
                              scalePercent === sc
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-extrabold'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800/80'
                            }`}
                          >
                            %{sc}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectScalePercent && onSelectScalePercent((scalePercent || 100) + 5)}
                        className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 hover:text-amber-400 font-bold text-xs flex items-center justify-center transition"
                      >
                        +
                      </button>
                    </div>

                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => onSelectDensity && onSelectDensity(density === 'compact' ? 'normal' : 'compact')}
                        className={`w-full py-1.5 rounded-xl border text-[11px] font-bold transition flex items-center justify-center space-x-1.5 ${
                          density === 'compact'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <span>{density === 'compact' ? '⚡ Kompakt Hücre Sıkılığı (Aktif)' : 'Standart Hücre Genişliği'}</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* BÖLÜM 4: SIRALAMA VE YÖNETİM MASASI */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                    <span>Firma & Kur Sıralama Masası</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">Borsa Hizalama Kriterleri</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Firma Sıralama */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <span className="text-xs text-slate-300 font-bold block">Firma Sıralama Ölçütü</span>
                    <select
                      value={firmSortMode}
                      onChange={(e) => onSelectFirmSortMode && onSelectFirmSortMode(e.target.value as FirmSortMode)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {FIRM_SORT_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id} className="bg-slate-900 text-slate-100">
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={onOpenFirmManage}
                        className="flex-1 py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Firmaları Yönet (Ekle/Kaldır/Sırala)</span>
                      </button>

                      {hiddenFirmKeysCount && hiddenFirmKeysCount > 0 ? (
                        <button
                          type="button"
                          onClick={onShowAllFirms}
                          className="py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                          title="Gizlenenleri Geri Getir"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Gizlenenleri Aç ({hiddenFirmKeysCount})</span>
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Kur Sıralama */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <span className="text-xs text-slate-300 font-bold block">Kur / Emtia Sıralama Ölçütü</span>
                    <select
                      value={sortMode}
                      onChange={(e) => onSelectSortMode && onSelectSortMode(e.target.value as SortMode)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id} className="bg-slate-900 text-slate-100">
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={onOpenCustomItemOrder}
                        className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                        <span>Kurların Sıralamasını Özelleştir</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 1: Firma & Kart Ayarları (Fotoğraftaki Ayarlar) */}
          {activeTab === 'firm_cells' && (
            <div className="space-y-6 text-slate-200">
              
              {/* Firma Seçici ve Durum Başlığı */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Firma Kartı Tasarımı & Kur Görünürlük Ayarları</span>
                      </span>
                      {isFirmCellDirty ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1 animate-pulse">
                          <span>●</span>
                          <span>Kaydedilmemiş Değişiklikler Var</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                          <Check className="w-2.5 h-2.5" />
                          <span>Güncel</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Kaptan Orijinal Borsa Tablosu, Güneş Terminali veya SAR kart görünümünü seçin; döviz ve altın kurlarını tek tıkla filtreleyin.
                    </p>
                  </div>

                  {cellSuccessMsg && (
                    <div className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 font-bold shadow-sm shadow-emerald-500/20 animate-in fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{cellSuccessMsg}</span>
                    </div>
                  )}
                </div>

                {/* Firma Seçici Segment Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
                  {firmKeys.map((fKey) => {
                    const sName = sources?.[fKey]?.sourceName || fKey;
                    const isSelected = selectedFirmKey === fKey;
                    const fCount = (sources?.[fKey]?.data || []).filter((i: any) => i && i.code !== 'ONS').length;
                    return (
                      <button
                        key={fKey}
                        type="button"
                        onClick={() => setSelectedFirmKey(fKey)}
                        className={`p-2.5 rounded-xl text-left transition flex flex-col justify-between relative ${
                          isSelected
                            ? 'bg-gradient-to-br from-amber-500/25 to-amber-600/10 border-2 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                            : 'bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <FirmLogo firmKey={fKey} firmName={sName} size="xs" />
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                            isSelected ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {fCount} Kur
                          </span>
                        </div>
                        <span className="text-xs font-bold truncate w-full">{sName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CANLI İNTERAKTİF KART ÖNİZLEMESİ (Institutional Real-Time Preview) */}
              <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-4 shadow-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Canlı Kart Önizlemesi</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                      {sources?.[selectedFirmKey]?.sourceName || selectedFirmKey}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                    <span>Görünüm:</span>
                    <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                      {cellViewMode === 'kaptan_table'
                        ? 'Kaptan Orijinal Tablo'
                        : cellViewMode === 'kaptan_cards'
                        ? 'Kaptan Mobil Kartlar'
                        : cellViewMode === 'gunes_terminal'
                        ? 'Güneş Terminal'
                        : cellViewMode === 'sar_cards'
                        ? 'SAR Kart Görünümü'
                        : 'Standart Borsa Tablosu'}
                    </span>
                    <span className="text-slate-500 font-mono">({cellDecimals} Basamak)</span>
                  </div>
                </div>

                {/* Önizleme Kart Gövdesi */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  cellCardTheme === 'photo_light'
                    ? 'bg-slate-100 text-slate-900 border-slate-300 shadow-md'
                    : 'bg-slate-950 text-slate-100 border-slate-800'
                }`}>
                  {/* Başlık Bölümü */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-300/60 dark:border-slate-800">
                    <div className="flex items-center space-x-2">
                      {cellEmblem === 'kaptan' && (
                        <span className="text-xs font-black text-[#a81c24] tracking-wider px-1.5 py-0.5 bg-rose-100 rounded border border-rose-200">
                          KAPTAN
                        </span>
                      )}
                      {cellEmblem === 'gunes' && (
                        <span className="text-xs font-serif font-black text-amber-600 tracking-wider px-1.5 py-0.5 bg-amber-100 rounded border border-amber-200">
                          GÜNEŞ
                        </span>
                      )}
                      {cellEmblem === 'sar' && (
                        <span className="text-xs font-black text-[#b88c42] tracking-wider px-1.5 py-0.5 bg-amber-50 rounded border border-amber-200">
                          SAR
                        </span>
                      )}
                      {cellEmblem === 'gold_coin' && <Coins className="w-4 h-4 text-amber-500" />}
                      {cellEmblem === 'diamond' && <Gem className="w-4 h-4 text-cyan-500" />}
                      {cellEmblem === 'bank' && <Landmark className="w-4 h-4 text-emerald-500" />}
                      {cellEmblem === 'vault' && <Shield className="w-4 h-4 text-rose-500" />}
                      {cellEmblem === 'custom' && cellLogoUrl && (
                        <img src={cellLogoUrl} alt="Logo" className="w-5 h-5 object-contain rounded" />
                      )}

                      <div>
                        <div className="text-xs font-bold leading-tight">
                          {cellTitle || sources?.[selectedFirmKey]?.sourceName || selectedFirmKey}
                        </div>
                        {cellTagline && (
                          <div className="text-[10px] text-slate-500 font-medium">
                            {cellTagline}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold">
                        {cellSelectedCodes.size} / {currentFirmItems.length} Kur Aktif
                      </span>
                    </div>
                  </div>

                  {/* Örnek Satırlar */}
                  {cellViewMode === 'kaptan_table' ? (
                    <div className="overflow-hidden rounded-lg border border-slate-300 dark:border-slate-800 text-xs">
                      <div className="bg-[#121a2d] text-white px-2.5 py-1.5 grid grid-cols-4 font-bold text-[10px]">
                        <span>DÖVİZ CİNSİ</span>
                        <span className="text-right">ALIŞ</span>
                        <span className="text-right">SATIŞ</span>
                        <span className="text-right">FARK</span>
                      </div>
                      <div className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {currentFirmItems
                          .filter((i) => cellSelectedCodes.has(i.code))
                          .slice(0, 3)
                          .map((item) => (
                            <div key={item.code} className="px-2.5 py-1 grid grid-cols-4 items-center font-mono">
                              <span className="font-bold text-[#a81c24] text-[11px] truncate">{item.name}</span>
                              <span className="text-right text-emerald-700 dark:text-emerald-400 font-bold">
                                {item.buy.toFixed(cellDecimals)}
                              </span>
                              <span className="text-right text-rose-700 dark:text-rose-400 font-bold">
                                {item.sell.toFixed(cellDecimals)}
                              </span>
                              <span className="text-right text-slate-500 text-[10px]">
                                %{(((item.sell - item.buy) / item.buy) * 100).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        {currentFirmItems.filter((i) => cellSelectedCodes.has(i.code)).length === 0 && (
                          <div className="p-3 text-center text-slate-400 text-xs">
                            Görünecek hiç kur seçilmedi. Aşağıdaki listeden kurları seçin.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : cellViewMode === 'kaptan_cards' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {currentFirmItems
                        .filter((i) => cellSelectedCodes.has(i.code))
                        .slice(0, 2)
                        .map((item) => (
                          <div key={item.code} className="p-2 rounded-lg bg-[#121a2d] text-white border border-[#1e2d4d]">
                            <div className="font-bold text-amber-300 text-xs mb-1 truncate">{item.name}</div>
                            <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
                              <div className="p-1 rounded bg-slate-900/60 text-emerald-400">
                                <span className="text-[9px] text-slate-400 block">ALIŞ</span>
                                {item.buy.toFixed(cellDecimals)}
                              </div>
                              <div className="p-1 rounded bg-slate-900/60 text-rose-400">
                                <span className="text-[9px] text-slate-400 block">SATIŞ</span>
                                {item.sell.toFixed(cellDecimals)}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : cellViewMode === 'gunes_terminal' ? (
                    <div className="space-y-1 text-xs">
                      {currentFirmItems
                        .filter((i) => cellSelectedCodes.has(i.code))
                        .slice(0, 3)
                        .map((item) => (
                          <div key={item.code} className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-amber-500/30 text-amber-300 font-mono">
                            <span className="font-bold text-white text-[11px]">{item.name}</span>
                            <div className="space-x-3">
                              <span className="text-emerald-400">A: {item.buy.toFixed(cellDecimals)}</span>
                              <span className="text-rose-400">S: {item.sell.toFixed(cellDecimals)}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="space-y-1 text-xs">
                      {currentFirmItems
                        .filter((i) => cellSelectedCodes.has(i.code))
                        .slice(0, 3)
                        .map((item) => (
                          <div key={item.code} className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800 font-mono">
                            <span className="font-bold text-slate-200">{item.name}</span>
                            <div className="space-x-3 text-xs">
                              <span className="text-emerald-400 font-bold">{item.buy.toFixed(cellDecimals)}</span>
                              <span className="text-rose-400 font-bold">{item.sell.toFixed(cellDecimals)}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span>* Önizlemede ilk seçili kalemler gösterilmektedir.</span>
                    <span className="font-mono text-amber-500 font-semibold">Tüm değişiklikler anında kaydedilebilir.</span>
                  </div>
                </div>
              </div>

              {/* Seçilen Firmanın Form Alanları */}
              <div className="space-y-5">
                
                {/* 1. Görünüm Düzeni */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
                      <span>Hücre Görünüm Düzeni</span>
                    </span>
                    <span className="text-[10px] text-slate-500">Seçilen Firma: {sources?.[selectedFirmKey]?.sourceName || selectedFirmKey}</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Kaptan Kuyumcu Orijinal Tablo (1. Fotoğraftaki) */}
                    <button
                      type="button"
                      onClick={() => setCellViewMode('kaptan_table')}
                      className={`p-3 rounded-xl border text-left transition flex items-start space-x-2.5 ${
                        cellViewMode === 'kaptan_table'
                          ? 'bg-[#121a2d] border-[#a81c24] text-white shadow-md ring-2 ring-[#a81c24]/50'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <Table className="w-5 h-5 text-[#a81c24] mt-0.5 shrink-0" />
                      <div>
                        <div className="font-bold text-xs flex items-center space-x-1.5">
                          <span className="text-[#a81c24]">Kaptan Orijinal Tablo</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-normal">
                            1. Fotoğraftaki
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Lacivert başlık, kırmızı kodlar, beyaz satırlar ve ayrı Altın başlığı
                        </div>
                      </div>
                    </button>

                    {/* Kaptan Mobil Kart Görünümü */}
                    <button
                      type="button"
                      onClick={() => setCellViewMode('kaptan_cards')}
                      className={`p-3 rounded-xl border text-left transition flex items-start space-x-2.5 ${
                        cellViewMode === 'kaptan_cards'
                          ? 'bg-[#121a2d] border-[#a81c24] text-white shadow-md ring-2 ring-amber-400/40'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <LayoutGrid className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-bold text-xs flex items-center space-x-1.5">
                          <span>Kaptan Mobil Kartlar</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-normal">
                            2. Fotoğraftaki
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Başlıklı lacivert hap kartlar, iki sütunlu ALIŞ / SATIŞ blokları
                        </div>
                      </div>
                    </button>

                    {/* Güneş Kuyumculuk Orijinal Terminal */}
                    <button
                      type="button"
                      onClick={() => setCellViewMode('gunes_terminal')}
                      className={`p-3 rounded-xl border text-left transition flex items-start space-x-2.5 ${
                        cellViewMode === 'gunes_terminal'
                          ? 'bg-[#181310] border-amber-500 text-white shadow-md ring-2 ring-amber-500/40'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <Table className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-bold text-xs flex items-center space-x-1.5">
                          <span className="text-amber-400">Güneş Orijinal Terminal</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-normal">
                            Güneş Terminal
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Gümüş metalik başlık, siyah LED kutular ve şube başlıkları
                        </div>
                      </div>
                    </button>

                    {/* SAR Döviz Kart Görünümü */}
                    <button
                      type="button"
                      onClick={() => setCellViewMode('sar_cards')}
                      className={`p-3 rounded-xl border text-left transition flex items-start space-x-2.5 ${
                        cellViewMode === 'sar_cards'
                          ? 'bg-amber-500/15 border-amber-500/50 text-white ring-2 ring-amber-400/40'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <LayoutGrid className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-bold text-xs flex items-center space-x-1.5">
                          <span>SAR Döviz Özel Kart Görünümü</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-normal">
                            SAR Formatı
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Altın bayrak kutusu, ALIŞ/BUY ve SATIŞ/SELL sütunları
                        </div>
                      </div>
                    </button>

                    {/* Standart Finans Tablosu */}
                    <button
                      type="button"
                      onClick={() => setCellViewMode('standard_table')}
                      className={`p-3 rounded-xl border text-left transition flex items-start space-x-2.5 sm:col-span-2 ${
                        cellViewMode === 'standard_table'
                          ? 'bg-amber-500/15 border-amber-500/50 text-white ring-2 ring-amber-400/40'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <Table className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-bold text-xs">Standart Finans Tablosu</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Kompakt borsa tablosu, makas ve grafik kısayolları
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Kart Renk Teması */}
                {cellViewMode !== 'standard_table' && (
                  <div className="space-y-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                      <Palette className="w-3.5 h-3.5 text-amber-400" />
                      <span>Kart Renk Teması</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCellCardTheme('photo_light')}
                        className={`p-2.5 rounded-lg border text-left transition flex items-center space-x-2 ${
                          cellCardTheme === 'photo_light'
                            ? 'bg-amber-500/15 border-amber-400 text-white font-bold ring-1 ring-amber-400/40'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Sun className="w-4 h-4 text-amber-400" />
                        <div className="text-xs">
                          <div>Fotoğraftaki Beyaz/Açık Tema</div>
                          <div className="text-[9px] font-normal text-slate-400">Orijinal sitedeki gibi</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCellCardTheme('dark_gold')}
                        className={`p-2.5 rounded-lg border text-left transition flex items-center space-x-2 ${
                          cellCardTheme === 'dark_gold'
                            ? 'bg-amber-500/15 border-amber-400 text-white font-bold ring-1 ring-amber-400/40'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Moon className="w-4 h-4 text-indigo-400" />
                        <div className="text-xs">
                          <div>Koyu Terminal Teması</div>
                          <div className="text-[9px] font-normal text-slate-400">Antrasit zemin</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Görünecek İsim ve Alt Başlık */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>Hücre Başlığı / Görünecek İsim</span>
                    </label>
                    <input
                      type="text"
                      value={cellTitle}
                      onChange={(e) => setCellTitle(e.target.value)}
                      placeholder={sources?.[selectedFirmKey]?.sourceName || selectedFirmKey}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>Alt Başlık / Yetki Belgesi</span>
                    </label>
                    <input
                      type="text"
                      value={cellTagline}
                      onChange={(e) => setCellTagline(e.target.value)}
                      placeholder="DÖVİZ & ALTIN PİYASASI"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* 4. Ondalık Basamak Sayısı */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                    <Hash className="w-3.5 h-3.5 text-amber-400" />
                    <span>Fiyat Ondalık Basamağı</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[2, 3, 4].map((dec) => (
                      <button
                        key={dec}
                        type="button"
                        onClick={() => setCellDecimals(dec)}
                        className={`py-2 px-3 rounded-xl border text-center transition ${
                          cellDecimals === dec
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold ring-1 ring-amber-400/40'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="text-xs font-mono font-bold">{dec} Basamak</div>
                        <div className="text-[10px] text-slate-500">
                          {dec === 3 ? '49.050 (Fotoğraftaki)' : dec === 2 ? '49.05' : '49.0500'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Logo & Amblem Seçimi */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Logo & Amblem Seçimi</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setCellEmblem('kaptan')}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                        cellEmblem === 'kaptan'
                          ? 'bg-rose-950/40 border-rose-500 text-rose-300 font-bold ring-1 ring-rose-500/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-black text-[#a81c24]">KAPTAN</span>
                      <span className="text-[10px]">Kaptan Logo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCellEmblem('gunes')}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                        cellEmblem === 'gunes'
                          ? 'bg-amber-950/40 border-amber-500 text-amber-300 font-bold ring-1 ring-amber-500/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-serif font-black text-amber-400">GÜNEŞ</span>
                      <span className="text-[10px]">Güneş Logo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCellEmblem('sar')}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                        cellEmblem === 'sar'
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold ring-1 ring-amber-400/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-black text-[#b88c42]">SAR</span>
                      <span className="text-[10px]">SAR Orijinal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCellEmblem('gold_coin')}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                        cellEmblem === 'gold_coin'
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold ring-1 ring-amber-400/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span className="text-[10px]">Altın Para</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCellEmblem('diamond')}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                        cellEmblem === 'diamond'
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold ring-1 ring-amber-400/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Gem className="w-4 h-4 text-cyan-400" />
                      <span className="text-[10px]">Pırlanta</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCellEmblem('bank')}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                        cellEmblem === 'bank'
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold ring-1 ring-amber-400/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Landmark className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px]">Banka</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCellEmblem('vault')}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                        cellEmblem === 'vault'
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold ring-1 ring-amber-400/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Shield className="w-4 h-4 text-rose-400" />
                      <span className="text-[10px]">Kasa / Güven</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCellEmblem('none')}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                        cellEmblem === 'none'
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold ring-1 ring-amber-400/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <X className="w-4 h-4 text-slate-500" />
                      <span className="text-[10px]">Logo Yok</span>
                    </button>
                  </div>
                </div>

                {/* 6. Görünecek Kurlar & Altınlar Filtresi (Stabil & Kalıcı Seçim) */}
                <div className="space-y-3 p-4 bg-slate-950/90 rounded-2xl border border-slate-800 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                          <span>Görünecek Kurlar & Altınlar</span>
                        </span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                          {cellSelectedCodes.size} / {currentFirmItems.length} Seçili
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Karta yansıtılacak para birimlerini işaretleyin. Tıkladığınız seçimler anında korunur.
                      </p>
                    </div>

                    {/* Hızlı Seçim Butonları */}
                    <div className="flex flex-wrap items-center gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={handleSelectAllCurrencies}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:border-slate-600 font-medium transition"
                      >
                        Tümü
                      </button>
                      <button
                        type="button"
                        onClick={handleSelectOnlyGoldCurrencies}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 font-medium transition"
                      >
                        Sadece Altın
                      </button>
                      <button
                        type="button"
                        onClick={handleSelectOnlyFxCurrencies}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 font-medium transition"
                      >
                        Sadece Döviz
                      </button>
                      <button
                        type="button"
                        onClick={handleSelectPopularCurrencies}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 font-medium transition"
                      >
                        Popüler
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAllCurrencies}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 font-medium transition"
                      >
                        Temizle
                      </button>
                    </div>
                  </div>

                  {/* Kategori Sekmeleri & Arama */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs shrink-0">
                      <button
                        type="button"
                        onClick={() => setCurrencyCategoryFilter('all')}
                        className={`px-3 py-1 rounded-lg font-bold transition ${
                          currencyCategoryFilter === 'all'
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Tümü ({currentFirmItems.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrencyCategoryFilter('gold')}
                        className={`px-3 py-1 rounded-lg font-bold transition ${
                          currencyCategoryFilter === 'gold'
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Altın ({currentFirmItems.filter((i) => isGoldItem(i.code)).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrencyCategoryFilter('fx')}
                        className={`px-3 py-1 rounded-lg font-bold transition ${
                          currencyCategoryFilter === 'fx'
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Döviz ({currentFirmItems.filter((i) => isFxItem(i.code)).length})
                      </button>
                    </div>

                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Kur veya altın ara (ör: Dolar, Has, 22, Euro)..."
                        value={cellSearch}
                        onChange={(e) => setCellSearch(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40"
                      />
                      {cellSearch && (
                        <button
                          type="button"
                          onClick={() => setCellSearch('')}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Görsel İlerleme Çubuğu */}
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-300"
                      style={{
                        width: `${currentFirmItems.length > 0 ? (cellSelectedCodes.size / currentFirmItems.length) * 100 : 0}%`,
                      }}
                    />
                  </div>

                  {/* Kurlar Listesi (Stabil Tıklama - Asla sıfırlanmaz) */}
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {filteredCurrencies.map((item) => {
                      const isChecked = cellSelectedCodes.has(item.code);
                      const isGold = isGoldItem(item.code);
                      return (
                        <div
                          key={item.code}
                          onClick={() => toggleCurrencyCode(item.code)}
                          className={`p-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer select-none transition-all ${
                            isChecked
                              ? 'bg-gradient-to-r from-slate-900 to-amber-950/20 border-amber-500/40 text-slate-100 shadow-sm ring-1 ring-amber-500/20'
                              : 'bg-slate-950/50 border-slate-900 text-slate-500 hover:border-slate-800 hover:bg-slate-900/40'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600 shrink-0" />
                            )}

                            {isGold ? (
                              <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                                <Coins className="w-3.5 h-3.5 text-amber-400" />
                              </div>
                            ) : (
                              <CurrencyFlag code={item.code} className="w-6 h-6 shrink-0" size={24} />
                            )}

                            <div className="min-w-0 truncate">
                              <span className={`font-bold block truncate ${isChecked ? 'text-white' : 'text-slate-400'}`}>
                                {getStandardizedProductName(item.code, item.name)}
                              </span>
                            </div>
                          </div>

                          <div className="font-mono text-[11px] space-x-2 text-right shrink-0">
                            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              {item.buy.toFixed(cellDecimals)}
                            </span>
                            <span className="text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">
                              {item.sell.toFixed(cellDecimals)}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {filteredCurrencies.length === 0 && (
                      <div className="p-4 text-center text-slate-500 text-xs">
                        Arama kriterlerine uygun kur bulunamadı.
                      </div>
                    )}
                  </div>
                </div>

                {/* Yapışkan / Belirgin Aksiyon Barı */}
                <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur-md p-3 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-2xl">
                  <div className="flex items-center space-x-2 text-xs">
                    {isFirmCellDirty ? (
                      <span className="text-amber-400 flex items-center space-x-1 font-bold animate-pulse">
                        <span>●</span>
                        <span>Kaydedilmemiş değişiklikler var</span>
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center space-x-1 font-bold">
                        <Check className="w-3.5 h-3.5" />
                        <span>Tüm ayarlar güncel</span>
                      </span>
                    )}
                    <span className="text-slate-500 hidden sm:inline">• Kısayol: Ctrl + S</span>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleResetFirmCell}
                      className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-semibold transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Varsayılana Sıfırla</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveFirmCell}
                      className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-amber-500/25 ring-1 ring-amber-300"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Değişiklikleri Kaydet & Karta Uygula</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: General & Themes */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Section 1: Theme Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-200 flex items-center space-x-1.5 uppercase tracking-wider">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Görsel Tema Tercihi</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {THEMES.find((t) => t.id === theme)?.name}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {THEMES.map((th) => {
                    const isSelected = theme === th.id;
                    const isDay = th.category === 'light';

                    return (
                      <button
                        key={th.id}
                        onClick={() => setTheme(th.id)}
                        className={`p-3 rounded-xl border text-left transition relative overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-500 ring-1 ring-amber-500/60 shadow-md bg-slate-800/80'
                            : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-white flex items-center space-x-1.5">
                              {isDay ? (
                                <Sun className="w-3.5 h-3.5 text-amber-400" />
                              ) : (
                                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                              )}
                              <span>{th.name}</span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {isDay ? 'Gündüz' : 'Gece'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                            {th.description}
                          </p>
                        </div>

                        {/* Swatch Strip */}
                        <div className="flex items-center space-x-1.5 mt-auto pt-2 border-t border-slate-800/60">
                          <span
                            className="w-4 h-4 rounded-full border border-slate-700 shadow-inner"
                            style={{ backgroundColor: th.previewColors.bg }}
                            title="Arka Plan"
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-slate-700"
                            style={{ backgroundColor: th.previewColors.card }}
                            title="Panel Rengi"
                          />
                          <span
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: th.previewColors.accent }}
                            title="Vurgu / Altın"
                          />
                          <span
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: th.previewColors.text }}
                            title="Yazı Rengi"
                          />
                        </div>

                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Audio & System Preferences */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <div className="text-xs font-bold text-slate-200 flex items-center space-x-1.5 uppercase tracking-wider">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sistem ve Bildirim Tercihleri</span>
                </div>

                <div className="space-y-2">
                  {/* Sound Alerts Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 mt-0.5">
                        {settings.soundAlerts ? (
                          <Volume2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <VolumeX className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-white flex items-center space-x-2">
                          <span>Fiyat Değişim Sesleri</span>
                          {settings.soundAlerts && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                              Açık
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Kurlarda artış veya azalış olduğunda hafif sesli geri bildirim çalınır.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => playAlertSound()}
                        disabled={!settings.soundAlerts}
                        className="px-2 py-1 text-[11px] rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition"
                      >
                        Test Et
                      </button>
                      <button
                        onClick={() => updateSettings({ soundAlerts: !settings.soundAlerts })}
                        className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                          settings.soundAlerts ? 'bg-amber-500' : 'bg-slate-800'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                            settings.soundAlerts ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Price Flash Animations Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 mt-0.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-white">
                          Fiyat Parlama (Flash) Efektleri
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Fiyat değiştiğinde hücreler yeşil veya kırmızı renkle anlık yanıp söner.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        updateSettings({ priceFlashAnimations: !settings.priceFlashAnimations })
                      }
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                        settings.priceFlashAnimations ? 'bg-amber-500' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                          settings.priceFlashAnimations ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Site Access URLs */}
          {activeTab === 'urls' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-amber-400" />
                  <span>Uygulama Erişim ve Yayın URL Adresleri</span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Uygulamanıza cep telefonundan, tabletten veya başka bilgisayarlardan kesintisiz ulaşabileceğiniz Cloud Run bağlantı adresleri.
                </p>
              </div>

              {/* Shared / Production URL Card */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      Yayın & Paylaşım URL (Önerilen)
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Aktif
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={sharedAppUrl}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 select-all focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopy(sharedAppUrl, 'shared')}
                    className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition shadow"
                  >
                    {copiedUrl === 'shared' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Kopyalandı</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopyala</span>
                      </>
                    )}
                  </button>
                  <a
                    href={sharedAppUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                    title="Yeni Sekmede Aç"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Bu bağlantı kalıcıdır; müşterilerinizle, personellerinizle paylaşabilir veya cep telefonunuzun ana ekranına kısayol olarak ekleyebilirsiniz.
                </p>
              </div>

              {/* Dev / Test URL Card */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                      Geliştirici & Test URL (Development)
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    Önizleme
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={devAppUrl}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 select-all focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopy(devAppUrl, 'dev')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-xs flex items-center space-x-1.5 transition"
                  >
                    {copiedUrl === 'dev' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Kopyalandı</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopyala</span>
                      </>
                    )}
                  </button>
                  <a
                    href={devAppUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                    title="Yeni Sekmede Aç"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Connected Store & TV Broadcast Links */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      Bağlı Mağaza & TV Yayın Bağlantıları
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Varsayılan Kaynaklar
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* İlkay TV */}
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white flex items-center space-x-1.5">
                        <span className="text-amber-400 font-bold">İlkay</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-[11px] text-slate-300">Mağaza İçi Altın TV Ekranı</span>
                      </div>
                      <div className="text-[11px] font-mono text-cyan-400 mt-0.5">https://ilkaydoviz.sdatam.com/TV</div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleCopy('https://ilkaydoviz.sdatam.com/TV', 'ilkay_tv')}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition"
                        title="URL Kopyala"
                      >
                        {copiedUrl === 'ilkay_tv' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href="https://ilkaydoviz.sdatam.com/TV"
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 rounded-md transition"
                        title="Yeni Sekmede Aç"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Güneş */}
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white flex items-center space-x-1.5">
                        <FirmLogo firmKey="gunes_kuyumculuk" size="xs" />
                        <span className="text-amber-400 font-bold">Güneş</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-[11px] text-slate-300">Meydan Şube Altın Ekranı</span>
                      </div>
                      <div className="text-[11px] font-mono text-amber-400 mt-0.5">https://fiyat.guneskuyumculuk.net/meydan</div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleCopy('https://fiyat.guneskuyumculuk.net/meydan', 'gunes')}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition"
                        title="URL Kopyala"
                      >
                        {copiedUrl === 'gunes' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href="https://fiyat.guneskuyumculuk.net/meydan"
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 rounded-md transition"
                        title="Yeni Sekmede Aç"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Kaptan */}
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white flex items-center space-x-1.5">
                        <FirmLogo firmKey="kaptan_doviz" size="xs" />
                        <span className="text-emerald-400 font-bold">Kaptan</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-[11px] text-slate-300">Piyasa Kurları</span>
                      </div>
                      <div className="text-[11px] font-mono text-emerald-400 mt-0.5">https://www.kaptandoviz.com/kurlar/</div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleCopy('https://www.kaptandoviz.com/kurlar/', 'kaptan')}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition"
                        title="URL Kopyala"
                      >
                        {copiedUrl === 'kaptan' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href="https://www.kaptandoviz.com/kurlar/"
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 rounded-md transition"
                        title="Yeni Sekmede Aç"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Solis Döviz */}
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white flex items-center space-x-1.5">
                        <FirmLogo firmKey="solis_doviz" size="xs" />
                        <span className="text-amber-400 font-bold">Solis Döviz</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-[11px] text-slate-300">Döviz & Kıymetli Madenler</span>
                      </div>
                      <div className="text-[11px] font-mono text-amber-400 mt-0.5">https://solisdoviz.com.tr/</div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleCopy('https://solisdoviz.com.tr/', 'solis_doviz')}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition"
                        title="URL Kopyala"
                      >
                        {copiedUrl === 'solis_doviz' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href="https://solisdoviz.com.tr/"
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 rounded-md transition"
                        title="Yeni Sekmede Aç"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* SAR Döviz */}
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white flex items-center space-x-1.5">
                        <FirmLogo firmKey="sar_doviz" size="xs" />
                        <span className="text-emerald-400 font-bold">SAR Döviz</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-[11px] text-slate-300">Döviz & Altın Kurları</span>
                      </div>
                      <div className="text-[11px] font-mono text-emerald-400 mt-0.5">https://sardoviz.com/?ajax=1</div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleCopy('https://sardoviz.com/?ajax=1', 'sar_doviz')}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition"
                        title="URL Kopyala"
                      >
                        {copiedUrl === 'sar_doviz' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href="https://sardoviz.com/?ajax=1"
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 rounded-md transition"
                        title="Yeni Sekmede Aç"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Altınköşe */}
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white flex items-center space-x-1.5">
                        <FirmLogo firmKey="altinkose" size="xs" />
                        <span className="text-yellow-400 font-bold">Altınköşe</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-[11px] text-slate-300">Altın ve Döviz Ekranı</span>
                      </div>
                      <div className="text-[11px] font-mono text-yellow-400 mt-0.5">https://www.altinkose.com.tr/canli-altin-fiyatlari</div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleCopy('https://www.altinkose.com.tr/canli-altin-fiyatlari', 'altinkose')}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition"
                        title="URL Kopyala"
                      >
                        {copiedUrl === 'altinkose' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href="https://www.altinkose.com.tr/canli-altin-fiyatlari"
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-yellow-400 rounded-md transition"
                        title="Yeni Sekmede Aç"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* İlkay Ekranı */}
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white flex items-center space-x-1.5">
                        <FirmLogo firmKey="ilkay_doviz" size="xs" />
                        <span className="text-cyan-400 font-bold">İlkay</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-[11px] text-slate-300">Döviz Ekranı</span>
                      </div>
                      <div className="text-[11px] font-mono text-cyan-400 mt-0.5">https://ilkaydoviz.sdatam.com/</div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleCopy('https://ilkaydoviz.sdatam.com/', 'ilkay_web')}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition"
                        title="URL Kopyala"
                      >
                        {copiedUrl === 'ilkay_web' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href="https://ilkaydoviz.sdatam.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 rounded-md transition"
                        title="Yeni Sekmede Aç"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Vizyon */}
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white flex items-center space-x-1.5">
                        <FirmLogo firmKey="vizyon_altin" size="xs" />
                        <span className="text-violet-400 font-bold">Vizyon</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-[11px] text-slate-300">Socket.IO Fiyat Yayını</span>
                      </div>
                      <div className="text-[11px] font-mono text-violet-400 mt-0.5">https://vizyonkuyumcu.com.tr/fiyat</div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleCopy('https://vizyonkuyumcu.com.tr/fiyat', 'vizyon')}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition"
                        title="URL Kopyala"
                      >
                        {copiedUrl === 'vizyon' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href="https://vizyonkuyumcu.com.tr/fiyat"
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-violet-400 rounded-md transition"
                        title="Yeni Sekmede Aç"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Useful Quick Tips */}
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
                <div className="text-slate-200 font-semibold flex items-center space-x-1.5">
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Telefonda Mobil Uygulama Gibi Kullanma İpucu:</span>
                </div>
                <p>
                  Safari veya Chrome üzerinden <strong>Yayın URL</strong>'sini açtıktan sonra tarayıcı menüsünden <strong>"Ana Ekrana Ekle" (Add to Home Screen)</strong> seçeneğini seçerek tıpkı yerel bir mobil borsa uygulaması gibi tam ekran kullanabilirsiniz.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: Store & API Management */}
          {activeTab === 'stores' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Store className="w-4 h-4 text-amber-400" />
                  <span>Yeni Mağaza Ekleme</span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Kendi kuyumcu/döviz mağazanızı sisteme ekleyerek fiyat terminalinde anında görüntüleyin.
                </p>
              </div>

              {storeSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{storeSuccessMsg}</span>
                </div>
              )}

              {storeErrorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{storeErrorMsg}</span>
                </div>
              )}

              {/* Add Store Form */}
              <form onSubmit={handleAddStore} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Mağaza / Firma Adı *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Zafer Kuyumculuk"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Faaliyet Kategorisi
                    </label>
                    <select
                      value={storeCategory}
                      onChange={(e) => setStoreCategory(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="kuyumcu">Kuyumculuk & Sarrafiye</option>
                      <option value="doviz">Döviz Bürosu</option>
                      <option value="serbest">Serbest Piyasa & Toptan</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Şube / Konum
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Samsun / Mecidiye Çarşısı"
                      value={storeLocation}
                      onChange={(e) => setStoreLocation(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      İletişim Telefonu
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: 0362 431 XX XX"
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                {/* API Endpoint & Live Test */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-300">
                      Fiyat Veri Uç Noktası (Opsiyonel URL)
                    </label>
                    <span className="text-[10px] text-slate-500">REST JSON / HTTP Feed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://api.magaza.com/kurlar veya https://domain.com/fiyatlar"
                      value={storeApiEndpoint}
                      onChange={(e) => {
                        setStoreApiEndpoint(e.target.value);
                        setApiTestResult(null);
                      }}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleTestApi}
                      disabled={isTestingApi || !storeApiEndpoint.trim()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-amber-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                    >
                      {isTestingApi ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Test Ediliyor...</span>
                        </>
                      ) : (
                        <>
                          <Activity className="w-3 h-3" />
                          <span>Bağlantıyı Test Et</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* API Test Feedback */}
                  {apiTestResult && (
                    <div
                      className={`mt-2 p-2.5 rounded-lg text-[11px] border font-mono ${
                        apiTestResult.ok
                          ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                          : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">
                          {apiTestResult.ok
                            ? `✓ Bağlantı Başarılı (HTTP ${apiTestResult.status})`
                            : '✕ Bağlantı Başarısız'}
                        </span>
                        {apiTestResult.responseTimeMs && (
                          <span className="text-slate-400">{apiTestResult.responseTimeMs} ms</span>
                        )}
                      </div>
                      {apiTestResult.error && <p className="mt-1">{apiTestResult.error}</p>}
                      {apiTestResult.isJson && (
                        <p className="mt-1 text-[10px] text-slate-400">
                          JSON formatı doğrulandı ({apiTestResult.contentType})
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Price Offset Percentages */}
                <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg space-y-2">
                  <div className="text-[11px] font-semibold text-slate-300">
                    Özel Fiyat Marjı / Makas Ayarı (%):
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-emerald-400 font-mono">Alış Farkı (%)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={storeBuyOffset}
                        onChange={(e) => setStoreBuyOffset(e.target.value)}
                        placeholder="0.00"
                        className="w-full mt-0.5 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-400 font-mono">Satış Farkı (%)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={storeSellOffset}
                        onChange={(e) => setStoreSellOffset(e.target.value)}
                        placeholder="0.00"
                        className="w-full mt-0.5 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSubmittingStore}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition shadow"
                  >
                    {isSubmittingStore ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Ekleniyor...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Mağazayı Ekle</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Existing Custom Stores List */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                  <span>Eklenen Özel Mağazalar ({stores.length})</span>
                  {isLoadingStores && <Loader2 className="w-3 h-3 animate-spin text-amber-400" />}
                </div>

                {stores.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center text-xs text-slate-500">
                    Henüz özel mağaza eklenmedi. Yukarıdaki formdan dilediğiniz mağazayı tanımlayabilirsiniz.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stores.map((s) => (
                      <div
                        key={s.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            <span className="text-xs font-bold text-white">{s.sourceName}</span>
                            <span className="text-[10px] text-slate-400">
                              ({s.category === 'doviz' ? 'Döviz' : 'Kuyumcu'})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-2">
                            {s.location && <span>{s.location}</span>}
                            {s.phone && <span>· {s.phone}</span>}
                            {s.apiEndpoint && (
                              <span className="font-mono text-cyan-400">· Veri Kaynağı Bağlı</span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteStore(s.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition"
                          title="Mağazayı Kaldır"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Pro Footer Actions */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-950 via-[#0d121f] to-slate-950 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              updateSettings({
                theme: 'light-sarraf',
                soundAlerts: false,
                priceFlashAnimations: true,
                defaultView: 'market',
              });
              onSelectDisplayMode && onSelectDisplayMode('standard_table');
              onSelectStandardTheme && onSelectStandardTheme('warm_cream');
              onSelectFontScale && onSelectFontScale('normal');
              onSelectGridColumns && onSelectGridColumns(5);
              onSelectScalePercent && onSelectScalePercent(88);
              onSelectDensity && onSelectDensity('compact');
              onSelectFirmSortMode && onSelectFirmSortMode('default');
              onSelectSortMode && onSelectSortMode('default');
            }}
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-amber-400 transition py-1.5 px-3 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="font-semibold">Varsayılanlara Sıfırla</span>
          </button>

          {/* Active Configuration Status Pill */}
          <div className="hidden sm:flex items-center space-x-2 text-[11px] text-slate-400 font-mono bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-amber-400 font-bold">
              {globalDisplayMode === 'store_custom' ? 'Özgün Vitrin' : 'Standart Tablo'}
            </span>
            <span>•</span>
            <span className="text-slate-200">{selectedThemeDef.badge}</span>
            <span>•</span>
            <span>{gridColumns} Sütun</span>
            <span>•</span>
            <span>%{scalePercent}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center space-x-2"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Ayarları Kaydet & Kapat</span>
          </button>
        </div>

      </div>
    </div>
  );
};
