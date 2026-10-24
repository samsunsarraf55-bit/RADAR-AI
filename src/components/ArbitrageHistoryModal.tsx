import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Zap,
  X,
  Calendar,
  Download,
  Search,
  Filter,
  RefreshCw,
  Building2,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  Calculator,
  CheckCircle2,
  Trash2,
  Coins,
  DollarSign,
  ChevronDown,
  Layers,
  ArrowUpDown,
  FileSpreadsheet,
  FileJson,
  AlertCircle,
} from 'lucide-react';
import { ArbitrageHistoryRecord, SourcesMap, MarketItem } from '../types/market';
import { useTheme } from '../context/ThemeContext';
import { FirmLogo } from './FirmLogo';

interface ArbitrageHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources?: SourcesMap;
  onSelectForCalculator?: (item: MarketItem, firmName: string) => void;
}

export type HistoryDateRange = 'today' | '24h' | '7d' | 'all';
export type HistoryCategory = 'all' | 'gold' | 'fx';
export type HistoryStatus = 'all' | 'active' | 'closed';
export type HistorySort = 'newest' | 'oldest' | 'highest_profit' | 'highest_percent' | 'longest_duration';

export const ArbitrageHistoryModal: React.FC<ArbitrageHistoryModalProps> = ({
  isOpen,
  onClose,
  sources,
  onSelectForCalculator,
}) => {
  const { isDark } = useTheme();

  const [records, setRecords] = useState<ArbitrageHistoryRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<HistoryCategory>('all');
  const [status, setStatus] = useState<HistoryStatus>('all');
  const [dateRange, setDateRange] = useState<HistoryDateRange>('all');
  const [selectedFirm, setSelectedFirm] = useState<string>('all');
  const [sortBy, setSortBy] = useState<HistorySort>('newest');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Available firm options
  const firmOptions = useMemo(() => {
    const list: { key: string; name: string }[] = [];
    if (sources) {
      Object.entries(sources).forEach(([key, s]) => {
        if (s && s.sourceName) {
          list.push({ key, name: s.sourceName });
        }
      });
    }
    return list;
  }, [sources]);

  // Fetch history records from server
  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/arbitrage-history?limit=1000');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json && Array.isArray(json.data)) {
        setRecords(json.data);
        setStats(json.stats || null);
      }
    } catch (err: any) {
      console.warn('Arbitraj geçmişi yüklenemedi:', err);
      setError('Geçmiş kayıtlar yüklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
      const interval = setInterval(fetchHistory, 15000);
      return () => clearInterval(interval);
    }
  }, [isOpen, fetchHistory]);

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered and Sorted records
  const filteredRecords = useMemo(() => {
    let result = [...records];
    const now = Date.now();

    // Date range filter
    if (dateRange === 'today') {
      const todayStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      result = result.filter((r) => r.dateLabel === todayStr);
    } else if (dateRange === '24h') {
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      result = result.filter((r) => new Date(r.timestamp).getTime() >= oneDayAgo);
    } else if (dateRange === '7d') {
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      result = result.filter((r) => new Date(r.timestamp).getTime() >= sevenDaysAgo);
    }

    // Category filter
    if (category !== 'all') {
      result = result.filter((r) => r.category === category);
    }

    // Status filter
    if (status !== 'all') {
      result = result.filter((r) => r.status === status);
    }

    // Firm filter
    if (selectedFirm !== 'all') {
      result = result.filter(
        (r) => r.buyFirmKey === selectedFirm || r.sellFirmKey === selectedFirm
      );
    }

    // Search query
    if (search.trim() !== '') {
      const s = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.code.toLowerCase().includes(s) ||
          r.name.toLowerCase().includes(s) ||
          r.buyFirmName.toLowerCase().includes(s) ||
          r.sellFirmName.toLowerCase().includes(s) ||
          r.dateLabel.includes(s) ||
          r.timeLabel.includes(s)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') return (b.ts || 0) - (a.ts || 0);
      if (sortBy === 'oldest') return (a.ts || 0) - (b.ts || 0);
      if (sortBy === 'highest_profit') return b.profit - a.profit;
      if (sortBy === 'highest_percent') return b.profitPercent - a.profitPercent;
      if (sortBy === 'longest_duration') return (b.durationSeconds || 0) - (a.durationSeconds || 0);
      return 0;
    });

    return result;
  }, [records, dateRange, category, status, selectedFirm, search, sortBy]);

  // Clear all history handler
  const handleClearHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/arbitrage-history/clear', { method: 'POST' });
      if (res.ok) {
        setRecords([]);
        setStats(null);
        setShowClearConfirm(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    window.open('/api/arbitrage-history/export', '_blank');
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `arbitraj_gecmisi_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const formatPrice = (val: number, isFx: boolean) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: isFx ? 4 : 2,
      maximumFractionDigits: isFx ? 4 : 2,
    }).format(val);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all duration-200 ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Header */}
        <div
          className={`px-5 py-4 flex items-center justify-between border-b shrink-0 ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-tight">Arbitraj Geçmiş Kayıtları</h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  Veri Arşivi
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Piyasada tespit edilen tüm ters makas ve arbitraj fırsatlarının kalıcı zaman damgalı veri geçmişi
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchHistory}
              disabled={loading}
              title="Yenile"
              className={`p-2 rounded-xl border transition ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleExportCSV}
              title="Excel / CSV Olarak İndir"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel / CSV İndir</span>
            </button>

            <button
              onClick={handleExportJSON}
              title="JSON Verisi İndir"
              className={`px-3 py-1.5 rounded-xl border font-bold text-xs hidden md:flex items-center space-x-1.5 transition ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              }`}
            >
              <FileJson className="w-4 h-4" />
              <span>JSON</span>
            </button>

            <button
              onClick={onClose}
              title="Kapat (ESC)"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* KPI Summary Cards Bar */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 border-b shrink-0 ${
            isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-100/60 border-slate-200'
          }`}
        >
          {/* Card 1: Total Records */}
          <div
            className={`p-3 rounded-2xl border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold">Toplam Fırsat</span>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-400">
              {stats?.totalRecordedDeals || records.length}
              <span className="text-xs font-normal text-slate-400 ml-1">kayıt</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Toplam Kâr Potansiyeli: +{stats?.totalProfitSum || 0} ₺
            </div>
          </div>

          {/* Card 2: Highest Profit */}
          <div
            className={`p-3 rounded-2xl border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold">En Yüksek Kâr</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400">
              +{stats?.maxProfit ? stats.maxProfit : 0} ₺
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              {stats?.maxProfitCode || '—'} (%{stats?.maxProfitPercent || 0})
            </div>
          </div>

          {/* Card 3: Active Opportunities */}
          <div
            className={`p-3 rounded-2xl border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold">Şu Anda Aktif</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-xl font-black text-emerald-500">
              {stats?.activeCount || records.filter((r) => r.status === 'active').length}
              <span className="text-xs font-normal text-slate-400 ml-1">aktif</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Canlı piyasada geçerli fırsatlar
            </div>
          </div>

          {/* Card 4: Most frequent pair */}
          <div
            className={`p-3 rounded-2xl border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold">En Çok Arbitraj Çifti</span>
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xs font-bold text-indigo-300 truncate" title={stats?.topPair?.pair || '—'}>
              {stats?.topPair?.pair || '—'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {stats?.topPair ? `${stats.topPair.count} kez tespit edildi` : 'Analiz ediliyor...'}
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div
          className={`p-3.5 border-b space-y-3 shrink-0 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ürün, firma veya fiyat ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-9 pr-7 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500/50 ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                }`}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
                >
                  ×
                </button>
              )}
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {/* Category Pills */}
              <div className="flex p-0.5 rounded-xl border border-slate-800 bg-slate-950/60">
                <button
                  onClick={() => setCategory('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    category === 'all'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tümü
                </button>
                <button
                  onClick={() => setCategory('gold')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center space-x-1 ${
                    category === 'gold'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Coins className="w-3 h-3" />
                  <span>Altın</span>
                </button>
                <button
                  onClick={() => setCategory('fx')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center space-x-1 ${
                    category === 'fx'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <DollarSign className="w-3 h-3" />
                  <span>Döviz</span>
                </button>
              </div>

              {/* Date Range Selector */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as HistoryDateRange)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-300'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <option value="today">Bugün</option>
                <option value="24h">Son 24 Saat</option>
                <option value="7d">Son 7 Gün</option>
                <option value="all">Tüm Geçmiş</option>
              </select>

              {/* Status Selector */}
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as HistoryStatus)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-300'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <option value="all">Tüm Durumlar</option>
                <option value="active">Sadece Aktifler</option>
                <option value="closed">Kapananlar</option>
              </select>

              {/* Firm Selector */}
              <select
                value={selectedFirm}
                onChange={(e) => setSelectedFirm(e.target.value)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-300'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <option value="all">Tüm Firmalar</option>
                {firmOptions.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.name}
                  </option>
                ))}
              </select>

              {/* Sort Selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as HistorySort)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-300'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <option value="newest">Sıralama: En Yeni</option>
                <option value="highest_profit">Sıralama: En Yüksek Kâr</option>
                <option value="highest_percent">Sıralama: En Yüksek Yüzde</option>
                <option value="longest_duration">Sıralama: En Uzun Süre</option>
                <option value="oldest">Sıralama: En Eski</option>
              </select>

              {/* Reset History Button */}
              {records.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  title="Geçmiş Kayıtları Sıfırla"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Clear Confirmation Banner */}
        {showClearConfirm && (
          <div className="px-5 py-2.5 bg-rose-500/15 border-b border-rose-500/30 flex items-center justify-between text-xs animate-in slide-in-from-top-1">
            <div className="flex items-center space-x-2 text-rose-300 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Tüm geçmiş arbitraj kayıtları kalıcı olarak silinecek. Emin misiniz?</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleClearHistory}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Evet, Sıfırla
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
              >
                Vazgeç
              </button>
            </div>
          </div>
        )}

        {/* Records Table */}
        <div className="flex-1 overflow-y-auto">
          {loading && records.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
              <span className="text-sm">Arbitraj geçmiş kayıtları yükleniyor...</span>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Zap className="w-12 h-12 text-slate-600" />
              <span className="text-sm font-semibold">Seçili kriterlerde arbitraj kaydı bulunamadı.</span>
              <span className="text-xs text-slate-500">
                Piyasada yeni bir ters makas veya arbitraj tespit edildiğinde otomatik olarak buraya kaydedilecektir.
              </span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead
                className={`sticky top-0 z-10 text-[11px] font-black uppercase tracking-wider border-b ${
                  isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <tr>
                  <th className="py-3 px-3">Tarih & Saat</th>
                  <th className="py-3 px-3">Durum</th>
                  <th className="py-3 px-3">Varlık / Ürün</th>
                  <th className="py-3 px-3 text-emerald-500">Alınacak Firma (En Düşük Satış)</th>
                  <th className="py-3 px-3 text-rose-500">Satılacak Firma (En Yüksek Alış)</th>
                  <th className="py-3 px-3 text-right">Net Kâr (₺)</th>
                  <th className="py-3 px-3 text-right">Oran (%)</th>
                  <th className="py-3 px-2 text-center">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredRecords.map((r, index) => {
                  const isFx = r.category === 'fx';
                  const isActive = r.status === 'active';

                  return (
                    <tr
                      key={r.id || index}
                      className={`transition-colors group ${
                        isActive
                          ? isDark
                            ? 'bg-amber-500/5 hover:bg-amber-500/10'
                            : 'bg-amber-50/50 hover:bg-amber-50'
                          : isDark
                          ? 'hover:bg-slate-800/50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* 1. Date & Time */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-200">{r.dateLabel}</span>
                          <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                            <Clock className="w-2.5 h-2.5 inline" />
                            <span>{r.timeLabel}</span>
                          </span>
                        </div>
                      </td>

                      {/* 2. Status Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isActive ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[10px] border border-emerald-500/40 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>AKTİF</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium text-[10px] border border-slate-700">
                            <span>KAPANDI</span>
                            {r.durationSeconds && r.durationSeconds > 1 && (
                              <span className="text-slate-500 font-mono">({r.durationSeconds}sn)</span>
                            )}
                          </span>
                        )}
                      </td>

                      {/* 3. Product Code & Name */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-black text-slate-100">{r.code}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase border ${
                                r.category === 'gold'
                                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                  : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                              }`}
                            >
                              {r.category === 'gold' ? 'Altın' : 'Döviz'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 truncate max-w-[170px]" title={r.name}>
                            {r.name}
                          </span>
                        </div>
                      </td>

                      {/* 4. Buy Firm & Price */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-1.5">
                            <FirmLogo firmName={r.buyFirmName} size="xs" />
                            <span className="font-bold text-emerald-400">{r.buyFirmName}</span>
                          </div>
                          <span className="font-mono text-xs text-slate-300">
                            {formatPrice(r.buyPrice, isFx)} ₺
                          </span>
                        </div>
                      </td>

                      {/* 5. Sell Firm & Price */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-1.5">
                            <FirmLogo firmName={r.sellFirmName} size="xs" />
                            <span className="font-bold text-rose-400">{r.sellFirmName}</span>
                          </div>
                          <span className="font-mono text-xs text-slate-300">
                            {formatPrice(r.sellPrice, isFx)} ₺
                          </span>
                        </div>
                      </td>

                      {/* 6. Net Profit (₺) */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span className="font-mono font-black text-sm text-amber-400">
                          +{formatPrice(r.profit, isFx)} ₺
                        </span>
                      </td>

                      {/* 7. Profit Percentage (%) */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span className="inline-block px-1.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-black text-xs border border-emerald-500/20">
                          %{r.profitPercent.toFixed(2)}
                        </span>
                      </td>

                      {/* 8. Action (Calculator) */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        {onSelectForCalculator && (
                          <button
                            onClick={() => {
                              onSelectForCalculator(
                                {
                                  code: r.code,
                                  name: r.name,
                                  buy: r.buyPrice,
                                  sell: r.sellPrice,
                                },
                                r.buyFirmName
                              );
                              onClose();
                            }}
                            title="Bu arbitrajı hesaplayıcıda hesapla"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-400 transition"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info bar */}
        <div
          className={`px-5 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 shrink-0 ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              Gösterilen:{' '}
              <strong className="text-slate-200 font-bold">{filteredRecords.length}</strong> / Toplam:{' '}
              <strong className="text-slate-200 font-bold">{records.length}</strong> fırsat kaydı
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px]">
            <span>Arbitraj kayıtları 5 saniyelik motor ile otomatik olarak arşivlenir.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
