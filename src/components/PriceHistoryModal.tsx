import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  TrendingUp,
  X,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Clock,
  Download,
  Search,
  Filter,
  RefreshCw,
  Layers,
  ChevronDown,
  Check,
  CalendarRange,
  ArrowUpDown,
  History,
  Activity,
  Zap,
  Sparkles,
  Info,
  ExternalLink,
  Building2,
  Globe,
  Store,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { CurrencyFlag } from './CurrencyFlag';
import { isFxItem, getCleanCurrencyCode, getStandardizedProductName } from '../utils/productUtils';
import { FirmLogo } from './FirmLogo';

interface PriceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  initialFirm?: string;
  sources?: any;
}

interface PricePoint {
  id?: string;
  timestamp: string;
  dateLabel: string;
  timeLabel: string;
  firmKey?: string;
  firmName?: string;
  code?: string;
  name?: string;
  buy: number;
  sell: number;
  spread: number;
  spreadPercent?: number;
  changeFromPrevBuy?: number;
  changeRateFromPrevBuy?: number;
  direction?: 'up' | 'down' | 'neutral';
  source?: string;
}

interface HistoryStats {
  currentBuy: number;
  currentSell: number;
  highBuy: number;
  lowBuy: number;
  openBuy: number;
  changeAmount: number;
  changeRate: number;
  averageSpread: number;
  totalTicks?: number;
  upCount?: number;
  downCount?: number;
  lastUpdated?: string;
}

interface AvailableFirm {
  key: string;
  name: string;
  category: string;
  hasItem?: boolean;
  currentBuy?: number;
  currentSell?: number;
  itemCount?: number;
  updatedAt?: string;
}

// Comprehensive catalog of gold, sarrafiye and fx products (Standardized names)
const ALL_CATALOG_PRODUCTS = [
  { code: 'ALTIN_HAS', name: 'HAS', icon: '🥇', category: 'gold' },
  { code: 'ALTIN_24', name: '24 AYAR', icon: '✨', category: 'gold' },
  { code: 'ALTIN_22', name: '22 AYAR', icon: '💍', category: 'gold' },
  { code: 'CEYREK_YENI', name: 'ÇEYREK', icon: '🪙', category: 'gold' },
  { code: 'CEYREK_ALTIN', name: 'ÇEYREK', icon: '🪙', category: 'gold' },
  { code: 'YARIM_YENI', name: 'YARIM', icon: '🌗', category: 'gold' },
  { code: 'TAM_YENI', name: 'TAM', icon: '🟡', category: 'gold' },
  { code: 'ATA_YENI', name: 'ATA LİRA', icon: '👑', category: 'gold' },
  { code: 'GREMSE_YENI', name: 'GREMSE', icon: '🥇', category: 'gold' },
  { code: 'RESAT_LIRA', name: 'REŞAT LİRA', icon: '⚜️', category: 'gold' },
  { code: 'ALTIN_14', name: '14 AYAR', icon: '⚡', category: 'gold' },
  { code: 'GUMUS', name: 'GÜMÜŞ', icon: '🥈', category: 'gold' },
  { code: 'USDTRY', name: 'USD', icon: '💵', category: 'fx' },
  { code: 'EURTRY', name: 'EUR', icon: '💶', category: 'fx' },
  { code: 'GBPTRY', name: 'GBP', icon: '💷', category: 'fx' },
  { code: 'CHFTRY', name: 'CHF', icon: '🇨🇭', category: 'fx' },
  { code: 'SARTRY', name: 'SAR', icon: '🇸🇦', category: 'fx' },
  { code: 'AEDTRY', name: 'AED', icon: '🇦🇪', category: 'fx' },
  { code: 'CADTRY', name: 'CAD', icon: '🇨🇦', category: 'fx' },
  { code: 'AUDTRY', name: 'AUD', icon: '🇦🇺', category: 'fx' },
  { code: 'JPYTRY', name: 'JPY', icon: '🇯🇵', category: 'fx' },
  { code: 'RUBTRY', name: 'RUB', icon: '🇷🇺', category: 'fx' },
  { code: 'EURUSD', name: 'EUR/USD', icon: '⚖️', category: 'fx' },
];

// Presets for Date Filter Dropdown (2. & 3. Photo standard)
interface DateFilterPreset {
  id: string;
  label: string;
  shortcut: string;
  description: string;
  isPopular?: boolean;
}

const DATE_PRESETS: DateFilterPreset[] = [
  { id: 'bugun', label: 'Bugün', shortcut: 'T', description: 'Günün açılışından bu yana gerçekleşen fiyat hareketleri', isPopular: true },
  { id: 'dun', label: 'Dün', shortcut: 'D', description: 'Dünün açılış ve kapanış seans saatleri' },
  { id: 'son_3_gun', label: 'Son 3 Gün', shortcut: '3G', description: 'Son 72 saatlik piyasa dalgalanmaları' },
  { id: 'bu_hafta', label: 'Bu Hafta', shortcut: 'BH', description: 'Pazartesi açılışından günümüze haftalık hareketler', isPopular: true },
  { id: 'gecen_hafta', label: 'Geçen Hafta', shortcut: 'GH', description: 'Önceki haftanın tüm seans geçmişi' },
  { id: 'son_7_gun', label: 'Son 7 Gün', shortcut: '7G', description: 'Son 1 haftalık hareketler (7 gün)' },
  { id: 'bu_ay', label: 'Bu Ay', shortcut: 'BA', description: 'İçinde bulunulan ayın ilk gününden itibaren', isPopular: true },
  { id: 'gecen_ay', label: 'Geçen Ay', shortcut: 'GA', description: 'Bir önceki takvim ayının tüm kayıtları' },
  { id: 'son_30_gun', label: 'Son 30 Gün', shortcut: '30G', description: 'Son 1 aylık geriye dönük fiyat aralığı' },
  { id: 'son_3_ay', label: 'Son 3 Ay', shortcut: '3A', description: 'Çeyreklik (90 günlük) geçmiş kayıtlar' },
  { id: 'son_1_yil', label: 'Son 1 Yıl', shortcut: '1Y', description: 'Son 365 günlük yıllık değişimler' },
  { id: 'tamami', label: 'Tamamı', shortcut: 'TT', description: 'Sistemde arşivlenen tüm fiyat değişim kayıtları', isPopular: true },
];

interface PriceTableRowProps {
  pt: PricePoint;
  idx: number;
  isFx: boolean;
  activeFirmName: string;
  formatPrice: (val: number | undefined) => string;
}

const PriceTableRow: React.FC<PriceTableRowProps> = React.memo(({
  pt,
  idx,
  isFx,
  activeFirmName,
  formatPrice,
}) => {
  const isUp = pt.direction === 'up';
  const isDown = pt.direction === 'down';
  const changeVal = pt.changeFromPrevBuy || 0;
  const changePct = pt.changeRateFromPrevBuy || 0;
  const firmDisplayName = pt.source || pt.firmName || activeFirmName;

  return (
    <tr className="hover:bg-slate-900/80 transition group">
      <td className="py-2 px-3 text-center text-slate-600 text-[11px]">
        {idx + 1}
      </td>
      <td className="py-2 px-3 whitespace-nowrap">
        <span className="font-semibold text-indigo-300 flex items-center space-x-1.5">
          <FirmLogo firmName={firmDisplayName} size="xs" />
          <span>{firmDisplayName}</span>
        </span>
      </td>
      <td className="py-2 px-3 text-slate-400 whitespace-nowrap font-medium">
        {pt.dateLabel}
      </td>
      <td className="py-2 px-3 text-white font-bold whitespace-nowrap">
        {pt.timeLabel}
      </td>
      <td className="py-2 px-3 text-right text-emerald-400 font-bold whitespace-nowrap text-sm font-mono">
        {formatPrice(pt.buy)} ₺
      </td>
      <td className="py-2 px-3 text-right text-rose-400 font-bold whitespace-nowrap text-sm font-mono">
        {formatPrice(pt.sell)} ₺
      </td>
      <td className="py-2 px-3 text-right whitespace-nowrap font-mono">
        {changeVal !== 0 ? (
          <span
            className={`inline-flex items-center space-x-1 font-bold ${
              isUp ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isUp ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            <span>
              {changeVal > 0 ? `+${formatPrice(changeVal)}` : formatPrice(changeVal)} ₺
            </span>
            <span className="text-[10px] text-slate-400">
              ({changePct > 0 ? `+${changePct.toFixed(2)}` : changePct.toFixed(2)}%)
            </span>
          </span>
        ) : (
          <span className="text-slate-500 flex items-center justify-end space-x-1">
            <Minus className="w-3 h-3" />
            <span>0,00 ₺</span>
          </span>
        )}
      </td>
      <td className="py-2 px-3 text-right text-slate-300 whitespace-nowrap font-mono">
        <span className="font-semibold">{formatPrice(pt.spread)} ₺</span>
        {pt.spreadPercent !== undefined && (
          <span className="text-[10px] text-slate-500 ml-1">
            (%{pt.spreadPercent.toFixed(2)})
          </span>
        )}
      </td>
      <td className="py-2 px-3 text-center whitespace-nowrap">
        {isUp ? (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span>▲</span>
            <span>Yükseldi</span>
          </span>
        ) : isDown ? (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <span>▼</span>
            <span>Düştü</span>
          </span>
        ) : (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <span>▬</span>
            <span>Sabit</span>
          </span>
        )}
      </td>
    </tr>
  );
});

export const PriceHistoryModal: React.FC<PriceHistoryModalProps> = React.memo(({
  isOpen,
  onClose,
  initialCode = 'ALTIN_HAS',
  initialFirm = 'all',
}) => {
  const [selectedCode, setSelectedCode] = useState<string>(initialCode);
  const [selectedFirm, setSelectedFirm] = useState<string>(initialFirm);
  const [selectedRange, setSelectedRange] = useState<string>('bugun');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Points, Stats & Firm Metadata
  const [points, setPoints] = useState<PricePoint[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [productName, setProductName] = useState<string>('Has Altın (Gram 24K)');
  const [activeFirmName, setActiveFirmName] = useState<string>('Tüm Piyasalar');
  const [availableFirms, setAvailableFirms] = useState<AvailableFirm[]>([]);
  const [isFx, setIsFx] = useState<boolean>(false);

  // Table filtering and search
  const [tableSearch, setTableSearch] = useState<string>('');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'up' | 'down'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Pagination state for 60fps instant UI rendering without stutter
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Firm Selector Dropdown State
  const [isFirmDropdownOpen, setIsFirmDropdownOpen] = useState<boolean>(false);
  const firmDropdownRef = useRef<HTMLDivElement | null>(null);
  const firmButtonRef = useRef<HTMLButtonElement | null>(null);

  // Date Filter Dropdown State
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState<boolean>(false);
  const dateDropdownRef = useRef<HTMLDivElement | null>(null);
  const dateTriggerButtonRef = useRef<HTMLButtonElement | null>(null);

  // Custom Date Range Modal State
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [customStartDate, setCustomStartDate] = useState<string>(todayStr);
  const [customStartTime, setCustomStartTime] = useState<string>('00:00');
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);
  const [customEndTime, setCustomEndTime] = useState<string>('23:59');

  // Applied Custom Label
  const [appliedCustomLabel, setAppliedCustomLabel] = useState<string | null>(null);

  // Toast / notification feedback for user actions
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // Sync initial code and firm when opened
  useEffect(() => {
    if (initialCode) {
      setSelectedCode(initialCode);
    }
    if (initialFirm) {
      setSelectedFirm(initialFirm);
    }
  }, [initialCode, initialFirm]);

  // Reset pagination on filter or view changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCode, selectedFirm, selectedRange, tableSearch, directionFilter, sortOrder]);

  // Fetch history data from API specifically for selected firm and code
  const fetchHistory = useCallback(
    async (
      code: string,
      firm: string,
      range: string,
      customStart?: string,
      customEnd?: string
    ) => {
      setIsLoading(true);
      setErrorMsg(null);

      try {
        let url = `/api/price-history?code=${encodeURIComponent(code)}&firm=${encodeURIComponent(firm)}&range=${encodeURIComponent(range)}`;
        if (range === 'ozel' || range === 'custom') {
          if (customStart) url += `&startDate=${encodeURIComponent(customStart)}`;
          if (customEnd) url += `&endDate=${encodeURIComponent(customEnd)}`;
        }

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error('Fiyat değişim geçmişi verileri alınamadı.');
        }
        const data = await res.json();
        setPoints(data.points || []);
        setStats(data.stats || null);
        setProductName(data.name || code);
        setActiveFirmName(data.firmName || (firm === 'all' ? 'Tüm Piyasalar' : firm));
        if (data.availableFirms && Array.isArray(data.availableFirms)) {
          setAvailableFirms(data.availableFirms);
        }
        setIsFx(!!data.isFx);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Ağ bağlantısı veya sunucu hatası.');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Fetch when modal opens, or code, firm, or non-custom range changes
  useEffect(() => {
    if (isOpen && selectedRange !== 'ozel') {
      fetchHistory(selectedCode, selectedFirm, selectedRange);
    }
  }, [isOpen, selectedCode, selectedFirm, selectedRange, fetchHistory]);

  // Keep references to active filters to avoid socket re-connections on state changes
  const selectedCodeRef = useRef(selectedCode);
  selectedCodeRef.current = selectedCode;
  const selectedFirmRef = useRef(selectedFirm);
  selectedFirmRef.current = selectedFirm;

  // Real-Time Socket Listener: Batched & Throttled to ensure silky smooth 60fps performance
  useEffect(() => {
    if (!isOpen) return;

    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });

    let pendingTicks: PricePoint[] = [];
    let flushTimer: any = null;

    socket.on('firm_price_tick', (data: { firmKey: string; firmName: string; code: string; tick: PricePoint }) => {
      if (!data || !data.tick) return;

      const cCode = selectedCodeRef.current;
      const cFirm = selectedFirmRef.current;

      if (data.code === cCode) {
        if (cFirm === 'all' || cFirm === data.firmKey) {
          pendingTicks.push(data.tick);

          if (!flushTimer) {
            flushTimer = setTimeout(() => {
              flushTimer = null;
              if (pendingTicks.length === 0) return;
              const batch = [...pendingTicks];
              pendingTicks = [];

              setPoints((prev) => {
                const fresh = batch.filter(
                  (b) => !prev.some((p) => p.id === b.id || (p.timeLabel === b.timeLabel && p.dateLabel === b.dateLabel && p.buy === b.buy && p.sell === b.sell))
                );
                if (fresh.length === 0) return prev;
                return [...fresh, ...prev].slice(0, 150);
              });
            }, 1200);
          }
        }
      }
    });

    return () => {
      if (flushTimer) clearTimeout(flushTimer);
      socket.disconnect();
    };
  }, [isOpen]);

  // Handle outside click to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      // Date dropdown
      if (
        isDateDropdownOpen &&
        dateDropdownRef.current &&
        !dateDropdownRef.current.contains(e.target as Node) &&
        dateTriggerButtonRef.current &&
        !dateTriggerButtonRef.current.contains(e.target as Node)
      ) {
        setIsDateDropdownOpen(false);
      }

      // Firm dropdown
      if (
        isFirmDropdownOpen &&
        firmDropdownRef.current &&
        !firmDropdownRef.current.contains(e.target as Node) &&
        firmButtonRef.current &&
        !firmButtonRef.current.contains(e.target as Node)
      ) {
        setIsFirmDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isDateDropdownOpen, isFirmDropdownOpen]);

  // Keyboard shortcut listener: 'T' once opens date dropdown, 'TT' selects 'Tamamı'
  const lastTPressRef = useRef<number>(0);
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === 't') {
        e.preventDefault();
        const now = Date.now();
        const diff = now - lastTPressRef.current;

        if (diff > 0 && diff < 650) {
          // Double 'TT' detected!
          lastTPressRef.current = 0;
          setIsDateDropdownOpen(false);
          setIsCustomModalOpen(false);
          setSelectedRange('tamami');
          setAppliedCustomLabel(null);
          showToast('⚡ [TT] Kısayolu: "Tamamı" (Tüm Geçmiş Veriler) seçildi!');
          fetchHistory(selectedCode, selectedFirm, 'tamami');
        } else {
          // Single 'T' press
          lastTPressRef.current = now;
          setIsDateDropdownOpen((prev) => !prev);
          showToast('📅 [T] Kısayolu: Tarih filtreleri açıldı (Çift "TT" ile Tamamı)');
        }
      } else if (key === 'escape') {
        if (isCustomModalOpen) {
          e.preventDefault();
          setIsCustomModalOpen(false);
        } else if (isDateDropdownOpen) {
          e.preventDefault();
          setIsDateDropdownOpen(false);
        } else if (isFirmDropdownOpen) {
          e.preventDefault();
          setIsFirmDropdownOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDateDropdownOpen, isFirmDropdownOpen, isCustomModalOpen, selectedCode, selectedFirm, fetchHistory, showToast]);

  // Select Preset Range
  const handleSelectPreset = (presetId: string) => {
    setSelectedRange(presetId);
    setAppliedCustomLabel(null);
    setIsDateDropdownOpen(false);

    const preset = DATE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      showToast(`📅 Tarih Filtresi: "${preset.label}" seçildi`);
    }
  };

  // Switch Firm Handler
  const handleSelectFirm = (firmKey: string, firmName: string) => {
    setSelectedFirm(firmKey);
    setActiveFirmName(firmName);
    setIsFirmDropdownOpen(false);
    showToast(`🏢 Firma Değiştirildi: "${firmName}" özel verileri yüklendi`);
  };

  // Open Custom Date Range Modal
  const handleOpenCustomModal = () => {
    setIsDateDropdownOpen(false);
    setIsCustomModalOpen(true);
  };

  // Apply Custom Date Range (Photo 4 style)
  const handleApplyCustomRange = () => {
    const startIso = `${customStartDate}T${customStartTime}:00`;
    const endIso = `${customEndDate}T${customEndTime}:59`;

    if (new Date(startIso).getTime() > new Date(endIso).getTime()) {
      showToast('⚠️ Hata: Bitiş tarihi başlangıç tarihinden önce olamaz!');
      return;
    }

    const startFmt = new Date(startIso).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const endFmt = new Date(endIso).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const label = `${startFmt} ${customStartTime} - ${endFmt} ${customEndTime}`;

    setSelectedRange('ozel');
    setAppliedCustomLabel(label);
    setIsCustomModalOpen(false);

    showToast(`📅 Özel Tarih Filtresi Uygulandı: ${label}`);
    fetchHistory(selectedCode, selectedFirm, 'ozel', startIso, endIso);
  };

  // Quick preset helper inside Custom Modal
  const applyQuickPresetToCustomModal = (type: 'today' | 'yesterday' | '3days' | 'week' | 'month' | '30days' | 'all') => {
    const now = new Date();
    const todayStrVal = now.toISOString().split('T')[0];
    setCustomEndTime('23:59');

    if (type === 'today') {
      setCustomStartDate(todayStrVal);
      setCustomStartTime('00:00');
      setCustomEndDate(todayStrVal);
    } else if (type === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setCustomStartDate(yStr);
      setCustomStartTime('00:00');
      setCustomEndDate(yStr);
    } else if (type === '3days') {
      const d = new Date(now);
      d.setDate(d.getDate() - 2);
      setCustomStartDate(d.toISOString().split('T')[0]);
      setCustomStartTime('00:00');
      setCustomEndDate(todayStrVal);
    } else if (type === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      setCustomStartDate(d.toISOString().split('T')[0]);
      setCustomStartTime('00:00');
      setCustomEndDate(todayStrVal);
    } else if (type === 'month') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      setCustomStartDate(s.toISOString().split('T')[0]);
      setCustomStartTime('00:00');
      setCustomEndDate(todayStrVal);
    } else if (type === '30days') {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      setCustomStartDate(d.toISOString().split('T')[0]);
      setCustomStartTime('00:00');
      setCustomEndDate(todayStrVal);
    } else if (type === 'all') {
      const d = new Date(now);
      d.setDate(d.getDate() - 730);
      setCustomStartDate(d.toISOString().split('T')[0]);
      setCustomStartTime('00:00');
      setCustomEndDate(todayStrVal);
    }
  };

  // Memoized number formatter for ultra-fast price rendering
  const nf = useMemo(() => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: isFx ? 4 : 2,
      maximumFractionDigits: isFx ? 4 : 2,
    });
  }, [isFx]);

  const formatPrice = useCallback(
    (val: number | undefined) => {
      if (val === undefined || val === null || isNaN(val)) return '-';
      return nf.format(val);
    },
    [nf]
  );

  // Filtered and Sorted Table Data
  const filteredPoints = useMemo(() => {
    let result = [...points];

    // Filter by direction
    if (directionFilter === 'up') {
      result = result.filter((p) => p.direction === 'up');
    } else if (directionFilter === 'down') {
      result = result.filter((p) => p.direction === 'down');
    }

    // Filter by search query
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.dateLabel.toLowerCase().includes(q) ||
          p.timeLabel.toLowerCase().includes(q) ||
          p.buy.toString().includes(q) ||
          p.sell.toString().includes(q) ||
          (p.source && p.source.toLowerCase().includes(q)) ||
          p.spread.toString().includes(q)
      );
    }

    // Sort order (desc = newest top, asc = oldest top)
    if (sortOrder === 'asc') {
      result.reverse();
    }

    return result;
  }, [points, directionFilter, tableSearch, sortOrder]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPoints.length / (pageSize === 0 ? filteredPoints.length || 1 : pageSize))
  );

  const paginatedPoints = useMemo(() => {
    if (pageSize === 0 || pageSize >= filteredPoints.length) {
      return filteredPoints;
    }
    const start = (currentPage - 1) * pageSize;
    return filteredPoints.slice(start, start + pageSize);
  }, [filteredPoints, currentPage, pageSize]);

  // Active date filter display label
  const activeDateFilterLabel = useMemo(() => {
    if (selectedRange === 'ozel' && appliedCustomLabel) {
      return appliedCustomLabel;
    }
    const preset = DATE_PRESETS.find((p) => p.id === selectedRange);
    return preset ? preset.label : 'Bugün';
  }, [selectedRange, appliedCustomLabel]);

  // CSV Export handler
  const handleExportCSV = () => {
    if (points.length === 0) return;
    const headers = 'Sıra,Firma,Tarih,Saat,Alış Fiyatı (TL),Satış Fiyatı (TL),Fark (TL),Değişim Oranı (%),Makas (TL),Durum\n';
    const rows = points
      .map((p, idx) => {
        const dirText = p.direction === 'up' ? 'Yükseliş' : p.direction === 'down' ? 'Düşüş' : 'Sabit';
        const firmCol = p.source || activeFirmName;
        return `${idx + 1},"${firmCol}","${p.dateLabel}","${p.timeLabel}",${p.buy.toFixed(isFx ? 4 : 2)},${p.sell.toFixed(
          isFx ? 4 : 2
        )},${(p.changeFromPrevBuy || 0).toFixed(isFx ? 4 : 2)},${(p.changeRateFromPrevBuy || 0).toFixed(2)},${p.spread.toFixed(
          isFx ? 4 : 2
        )},"${dirText}"`;
      })
      .join('\n');

    const blob = new Blob(['\ufeff' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedFirm}_${selectedCode}_fiyat_degisim_gecmisi_${selectedRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-5xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Toast Notification for Shortcuts & Live Saves */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-2 border border-amber-400">
            <Zap className="w-4 h-4 text-slate-950 animate-bounce" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-inner">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="font-extrabold text-white text-base tracking-tight">
                  Fiyat Değişim Geçmişi Defteri
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center space-x-1.5">
                  {isFxItem(selectedCode) && (
                    <CurrencyFlag
                      code={getCleanCurrencyCode(selectedCode)}
                      size={15}
                      className="w-[15px] h-[15px] rounded-full"
                    />
                  )}
                  <span>{getStandardizedProductName(selectedCode, productName)}</span>
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center space-x-1.5">
                  <FirmLogo firmKey={selectedFirm} firmName={activeFirmName} size="xs" />
                  <span>{activeFirmName}</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {selectedCode}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-1.5 flex-wrap">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>Her firmanın kendi özelinde gerçekleşen alış-satış ve tarih-saat değişimleri kaydedilir</span>
                <span className="text-emerald-400 font-semibold flex items-center space-x-1 ml-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block"></span>
                  <span className="text-[11px]">Firma Özelinde Canlı Kayıt Aktif</span>
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (selectedRange === 'ozel') {
                  const startIso = `${customStartDate}T${customStartTime}:00`;
                  const endIso = `${customEndDate}T${customEndTime}:59`;
                  fetchHistory(selectedCode, selectedFirm, 'ozel', startIso, endIso);
                } else {
                  fetchHistory(selectedCode, selectedFirm, selectedRange);
                }
              }}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 transition"
              title="Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar: Product Selector + FIRM SELECTOR + DATE FILTER TRIGGER */}
        <div className="bg-slate-950/90 border-b border-slate-800 px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            
            {/* 1. PRODUCT SELECTOR DROPDOWN */}
            <div className="relative">
              <select
                value={selectedCode}
                onChange={(e) => setSelectedCode(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-500/70 cursor-pointer pr-8 shadow-sm hover:border-slate-600 transition"
              >
                <optgroup label="Altın & Sarrafiye Ürünleri">
                  {ALL_CATALOG_PRODUCTS.filter((p) => p.category === 'gold').map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.icon} {p.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Döviz Kurları & Parite">
                  {ALL_CATALOG_PRODUCTS.filter((p) => p.category === 'fx').map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.icon} {p.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* 2. FIRM SELECTOR DROPDOWN (Her firmanın kendi özelinde takip et) */}
            <div className="relative">
              <button
                ref={firmButtonRef}
                onClick={() => setIsFirmDropdownOpen((prev) => !prev)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition shadow-sm ${
                  selectedFirm !== 'all'
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 hover:bg-indigo-600/30 font-bold'
                    : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-indigo-500/50 hover:bg-slate-850'
                }`}
                title="Fiyat değişimini takip etmek istediğiniz firmayı seçin"
              >
                {selectedFirm !== 'all' ? (
                  <FirmLogo firmKey={selectedFirm} firmName={activeFirmName} size="xs" />
                ) : (
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <span>Firma:</span>
                <span className="font-bold underline decoration-dotted underline-offset-2">
                  {activeFirmName}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isFirmDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Firm Selector Dropdown Menu */}
              {isFirmDropdownOpen && (
                <div
                  ref={firmDropdownRef}
                  className="absolute left-0 top-full mt-1.5 w-76 sm:w-84 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 text-slate-200 backdrop-blur-xl max-h-[380px] overflow-y-auto"
                >
                  <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-400 flex items-center space-x-1.5">
                      <Store className="w-4 h-4" />
                      <span>Firma Özelinde Takip</span>
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Canlı Kayıt
                    </span>
                  </div>

                  <div className="py-1 space-y-0.5">
                    {/* Option: All Firms */}
                    <button
                      onClick={() => handleSelectFirm('all', 'Tüm Firmalar (Piyasa Ortalaması)')}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs transition ${
                        selectedFirm === 'all'
                          ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/40'
                          : 'hover:bg-slate-900 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-emerald-400" />
                        <div>
                          <span className="font-semibold block">Tüm Firmalar / Piyasa Geneli</span>
                          <span className="text-[10px] text-slate-500">Tüm piyasa hareketleri & ortalamalar</span>
                        </div>
                      </div>
                      {selectedFirm === 'all' && <Check className="w-4 h-4 text-indigo-400" />}
                    </button>

                    <div className="border-t border-slate-800/80 my-1"></div>

                    {/* Available Registered Firms */}
                    {availableFirms.map((f) => {
                      const isSelected = selectedFirm === f.key;
                      return (
                        <button
                          key={f.key}
                          onClick={() => handleSelectFirm(f.key, f.name)}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs transition group ${
                            isSelected
                              ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/40'
                              : 'hover:bg-slate-900 text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <FirmLogo firmKey={f.key} firmName={f.name} size="xs" />
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <span className="font-semibold">{f.name}</span>
                                {f.category && (
                                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                    {f.category}
                                  </span>
                                )}
                              </div>
                              {f.currentBuy && f.currentBuy > 0 ? (
                                <span className="text-[10px] text-emerald-400/90 font-mono">
                                  Güncel: {formatPrice(f.currentBuy)} ₺ / {formatPrice(f.currentSell)} ₺
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">Firma verileri anlık kaydediliyor</span>
                              )}
                            </div>
                          </div>

                          {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. DATE FILTER BUTTON (2. & 3. Photo standard: T / TT shortcut) */}
            <div className="relative">
              <button
                ref={dateTriggerButtonRef}
                onClick={() => setIsDateDropdownOpen((prev) => !prev)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition shadow-sm ${
                  isDateDropdownOpen || selectedRange === 'ozel'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                    : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-amber-500/50 hover:bg-slate-850'
                }`}
                title="Tarih Filtresi Aç [T tuşuna basın, 'TT' ile Tamamı]"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Tarih:</span>
                <span className="underline decoration-dotted underline-offset-2 font-bold">
                  {activeDateFilterLabel}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 text-amber-300 border border-slate-700">
                  T
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* DOWNWARD DATE FILTER DROPDOWN */}
              {isDateDropdownOpen && (
                <div
                  ref={dateDropdownRef}
                  className="absolute left-0 top-full mt-1.5 w-80 sm:w-88 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 text-slate-200 backdrop-blur-xl"
                >
                  <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-400 flex items-center space-x-1.5">
                      <CalendarRange className="w-4 h-4" />
                      <span>Tarih Filtresi Seçimi</span>
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      T: Aç / TT: Tamamı
                    </span>
                  </div>

                  <div className="max-h-[360px] overflow-y-auto py-1 space-y-0.5">
                    {DATE_PRESETS.map((preset) => {
                      const isSelected = selectedRange === preset.id;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs transition group ${
                            isSelected
                              ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/40'
                              : 'hover:bg-slate-900 text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold">{preset.label}</span>
                              {preset.isPopular && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                  Popüler
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 group-hover:text-slate-400">
                              {preset.description}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 group-hover:border-slate-700">
                              {preset.shortcut}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                          </div>
                        </button>
                      );
                    })}

                    <div className="border-t border-slate-800/80 my-1.5"></div>

                    {/* Custom Range Option (Photo 4 style) */}
                    <button
                      onClick={handleOpenCustomModal}
                      className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between text-xs transition border ${
                        selectedRange === 'ozel'
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold border-emerald-500/50'
                          : 'bg-slate-900/60 hover:bg-slate-900 text-slate-200 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-emerald-400">Özel Tarih & Saat Aralığı...</span>
                          <span className="text-[10px] text-slate-400">
                            Fotoğraf 4 gibi başlangıç ve bitiş saatini belirleyin
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        Özel
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Button for Double 'TT' Tamamı */}
            <button
              onClick={() => {
                setSelectedRange('tamami');
                setAppliedCustomLabel(null);
                showToast('⚡ [TT] Tüm Geçmiş Veriler yüklendi');
                fetchHistory(selectedCode, selectedFirm, 'tamami');
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                selectedRange === 'tamami'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
              title="Çift T: Tamamı / Tüm Arşiv"
            >
              Tamamı (TT)
            </button>
          </div>

          {/* Right Toolbar: Table Search & CSV Export */}
          <div className="flex items-center space-x-2 ml-auto">
            {/* Search within table */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Firma, fiyat veya saat..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/70 w-36 sm:w-44"
              />
              {tableSearch && (
                <button
                  onClick={() => setTableSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  ×
                </button>
              )}
            </div>

            {/* Direction Filter Pills */}
            <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setDirectionFilter('all')}
                className={`px-2 py-1 rounded-lg transition font-medium ${
                  directionFilter === 'all'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tüm Hareketler"
              >
                Tümü
              </button>
              <button
                onClick={() => setDirectionFilter('up')}
                className={`px-2 py-1 rounded-lg transition font-medium ${
                  directionFilter === 'up'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-emerald-400 hover:text-white'
                }`}
                title="Sadece Yükselişler"
              >
                ▲ Yükselen
              </button>
              <button
                onClick={() => setDirectionFilter('down')}
                className={`px-2 py-1 rounded-lg transition font-medium ${
                  directionFilter === 'down'
                    ? 'bg-rose-500 text-white font-bold'
                    : 'text-rose-400 hover:text-white'
                }`}
                title="Sadece Düşüşler"
              >
                ▼ Düşen
              </button>
            </div>

            {/* Sort Order Toggle */}
            <button
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
              title={sortOrder === 'desc' ? 'Sıralama: En Yeni Üstte' : 'Sıralama: En Eski Üstte'}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>

            {/* CSV Export */}
            <button
              onClick={handleExportCSV}
              disabled={points.length === 0}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-slate-700 text-xs font-semibold transition"
              title="CSV / Excel Olarak İndir"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV İndir</span>
            </button>
          </div>
        </div>

        {/* Content Body: Key Stats + Historical Price Change Table */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          
          {/* Key Statistics Grid */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">
                  {activeFirmName} Alış
                </span>
                <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono block mt-0.5">
                  {formatPrice(stats.currentBuy)} ₺
                </span>
                <span className="text-[9px] text-slate-500">Son Kaydedilen Alış</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">
                  {activeFirmName} Satış
                </span>
                <span className="text-sm sm:text-base font-bold text-rose-400 font-mono block mt-0.5">
                  {formatPrice(stats.currentSell)} ₺
                </span>
                <span className="text-[9px] text-slate-500">Son Kaydedilen Satış</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">
                  Dönem En Yüksek
                </span>
                <span className="text-sm sm:text-base font-bold text-emerald-300 font-mono block mt-0.5">
                  {formatPrice(stats.highBuy)} ₺
                </span>
                <span className="text-[9px] text-slate-500">Tepeden Alış</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">
                  Dönem En Düşük
                </span>
                <span className="text-sm sm:text-base font-bold text-rose-300 font-mono block mt-0.5">
                  {formatPrice(stats.lowBuy)} ₺
                </span>
                <span className="text-[9px] text-slate-500">Tabandan Alış</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">
                  Net Değişim
                </span>
                <div className="flex items-center space-x-1 mt-0.5 font-bold font-mono text-xs sm:text-sm">
                  {stats.changeRate >= 0 ? (
                    <>
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">%{stats.changeRate.toFixed(2)}</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-rose-400">%{stats.changeRate.toFixed(2)}</span>
                    </>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 font-mono">
                  {stats.changeAmount >= 0 ? `+${stats.changeAmount}` : stats.changeAmount} ₺
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">
                  Ortalama Makas
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-200 font-mono block mt-0.5">
                  {formatPrice(stats.averageSpread)} ₺
                </span>
                <span className="text-[9px] text-slate-500">
                  {filteredPoints.length} Fiyat Hareketi Kayıtlı
                </span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs text-center flex items-center justify-center space-x-2">
              <Info className="w-4 h-4 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* HISTORICAL PRICE TABLE: Chronological Log of Price Changes */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white">Fiyat Değişim Çizelgesi</span>
                <span className="text-indigo-400 font-semibold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                  {activeFirmName}
                </span>
                <span className="text-[11px] text-slate-500">
                  ({filteredPoints.length} kayıt listeleniyor)
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                <span>Sıralama: {sortOrder === 'desc' ? 'Yeniden Eskiye' : 'Eskiden Yeniye'}</span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold select-none z-10 shadow-sm">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center text-slate-600">#</th>
                    <th className="py-2.5 px-3">Firma / Kaynak</th>
                    <th className="py-2.5 px-3">Tarih</th>
                    <th className="py-2.5 px-3">Saat</th>
                    <th className="py-2.5 px-3 text-right text-emerald-400">Alış Fiyatı (₺)</th>
                    <th className="py-2.5 px-3 text-right text-rose-400">Satış Fiyatı (₺)</th>
                    <th className="py-2.5 px-3 text-right text-slate-300">Fark (Değişim)</th>
                    <th className="py-2.5 px-3 text-right text-amber-300">Makas (Fark)</th>
                    <th className="py-2.5 px-3 text-center">Yön / Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                        <span>Fiyat geçmişi verileri getiriliyor...</span>
                      </td>
                    </tr>
                  ) : filteredPoints.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-slate-500">
                        Seçilen firma ({activeFirmName}) ve tarih aralığında fiyat hareketi bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    paginatedPoints.map((pt, idx) => (
                      <PriceTableRow
                        key={pt.id || idx}
                        pt={pt}
                        idx={pageSize === 0 ? idx : (currentPage - 1) * pageSize + idx}
                        isFx={isFx}
                        activeFirmName={activeFirmName}
                        formatPrice={formatPrice}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination & View Controls */}
            {filteredPoints.length > 0 && (
              <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs select-none">
                <div className="flex items-center space-x-2 text-slate-400 flex-wrap">
                  <span>Gösterilen:</span>
                  <span className="font-bold text-white font-mono">
                    {pageSize === 0
                      ? `1 - ${filteredPoints.length}`
                      : `${(currentPage - 1) * pageSize + 1} - ${Math.min(
                          currentPage * pageSize,
                          filteredPoints.length
                        )}`}
                  </span>
                  <span className="text-slate-500">/ Toplam {filteredPoints.length} kayıt</span>

                  <div className="flex items-center space-x-1.5 ml-2 border-l border-slate-800 pl-3">
                    <span className="text-[11px] text-slate-500">Sayfa Başına:</span>
                    {[25, 50, 100, 0].map((sz) => (
                      <button
                        key={sz}
                        onClick={() => {
                          setPageSize(sz);
                          setCurrentPage(1);
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                          pageSize === sz
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {sz === 0 ? 'Tümü' : sz}
                      </button>
                    ))}
                  </div>
                </div>

                {pageSize > 0 && totalPages > 1 && (
                  <div className="flex items-center space-x-1.5 ml-auto">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition text-xs font-medium"
                      title="İlk Sayfa"
                    >
                      « İlk
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition text-xs font-medium"
                      title="Önceki Sayfa"
                    >
                      ‹ Önceki
                    </button>
                    <span className="px-2.5 py-0.5 font-mono text-amber-400 font-bold text-xs bg-slate-900 rounded-lg border border-slate-800">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition text-xs font-medium"
                      title="Sonraki Sayfa"
                    >
                      Sonraki ›
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition text-xs font-medium"
                      title="Son Sayfa"
                    >
                      Son »
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Doğrulanmış Canlı Kuyumcu & Borsa Fiyat Değişim Günlüğü</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-500 hidden sm:inline">Kısayollar: <strong>[T]</strong> Tarih Filtresi, <strong>[TT]</strong> Tamamı</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-md shadow-amber-500/20"
          >
            Kapat
          </button>
        </div>

      </div>

      {/* CUSTOM DATE RANGE MODAL (Photo 4 Style) */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-4 sm:p-5 space-y-4 shadow-2xl text-slate-100 animate-in zoom-in-95">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <CalendarRange className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">
                    Özel Tarih & Saat Filtresi
                  </h4>
                  <p className="text-xs text-slate-400">
                    Başlangıç ve bitiş tarih-saat aralığını hassas olarak belirleyin
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets Buttons */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Hızlı Tarih Seçenekleri
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyQuickPresetToCustomModal('today')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition"
                >
                  Bugün
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickPresetToCustomModal('yesterday')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition"
                >
                  Dün
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickPresetToCustomModal('3days')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition"
                >
                  Son 3 Gün
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickPresetToCustomModal('week')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition"
                >
                  Son 7 Gün
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickPresetToCustomModal('month')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition"
                >
                  Bu Ay
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickPresetToCustomModal('30days')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition"
                >
                  Son 30 Gün
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickPresetToCustomModal('all')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition"
                >
                  Tüm Geçmiş
                </button>
              </div>
            </div>

            {/* Date and Time Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              
              {/* Start Date & Time */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-400 block">
                  1. Başlangıç Tarihi ve Saati
                </span>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Tarih</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Saat (HH:MM)</label>
                  <input
                    type="time"
                    value={customStartTime}
                    onChange={(e) => setCustomStartTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* End Date & Time */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-rose-400 block">
                  2. Bitiş Tarihi ve Saati
                </span>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Tarih</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Saat (HH:MM)</label>
                  <input
                    type="time"
                    value={customEndTime}
                    onChange={(e) => setCustomEndTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

            </div>

            {/* Quick Session Presets */}
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-400 text-[11px]">Saat Şablonu:</span>
              <button
                type="button"
                onClick={() => {
                  setCustomStartTime('00:00');
                  setCustomEndTime('23:59');
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
              >
                00:00 - 23:59 (Tam Gün)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomStartTime('08:30');
                  setCustomEndTime('18:00');
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
              >
                08:30 - 18:00 (Piyasa)
              </button>
            </div>

            {/* Range Summary Preview */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block">Uygulanacak Aralık:</span>
                <span className="font-mono font-bold text-amber-300">
                  {customStartDate} {customStartTime} ➜ {customEndDate} {customEndTime}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleApplyCustomRange}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Filtreyi Uygula</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
});
