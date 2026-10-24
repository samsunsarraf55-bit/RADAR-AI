import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bell,
  LogOut,
  User as UserIcon,
  RefreshCw,
  Table,
  LayoutGrid,
  Settings,
  TrendingUp,
  Palette,
  Building2,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  Zap,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { SourcesMap } from '../types/market';
import { useTheme } from '../context/ThemeContext';
import { RadarLogo } from './RadarLogo';
import { FirmLogo } from './FirmLogo';

interface NavbarProps {
  connected: boolean;
  lastUpdate: string;
  activeTab: 'market' | 'matrix' | 'arbitrage' | 'calculator' | 'portfolio' | 'drive';
  setActiveTab: (tab: 'market' | 'matrix' | 'arbitrage' | 'calculator' | 'portfolio' | 'drive') => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenAdvisor: () => void;
  onOpenAlerts: () => void;
  onOpenPriceHistory: () => void;
  onOpenArbitrageHistory?: () => void;
  onOpenSettings: () => void;
  onOpenThemeModal?: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  activeAlertsCount: number;
  onOpenFirmPrices?: (firmKey?: string) => void;
  sources?: SourcesMap;
}

const FIRMS_NAV_LIST = [
  {
    key: 'gunes_kuyumculuk',
    name: 'Güneş Kuyumculuk',
    fullName: 'Güneş Kuyumculuk & Sarrafiye',
    desc: 'Altın & Sarrafiye',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  {
    key: 'kaptan_doviz',
    name: 'Kaptan Altın & Döviz',
    fullName: 'Kaptan Altın & Döviz Tic. A.Ş.',
    desc: 'Altın & Döviz',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
  },
  {
    key: 'solis_doviz',
    name: 'Solis Döviz',
    fullName: 'Solis Döviz Yetkili Müessese A.Ş.',
    desc: 'Döviz & Kıymetli Madenler',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  {
    key: 'sar_doviz',
    name: 'SAR Döviz',
    fullName: 'SAR Döviz Yetkili Müessese A.Ş.',
    desc: 'Yetkili Müessese (Döviz)',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  {
    key: 'altinkose',
    name: 'Altınköşe Kuyumculuk',
    fullName: 'Altınköşe Mücevherat & Sarrafiye',
    desc: 'Mücevherat & Sarrafiye',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
  },
  {
    key: 'ilkay_doviz',
    name: 'İlkay Döviz',
    fullName: 'İlkay Döviz Yetkili Müessese',
    desc: 'Yetkili Müessese (Döviz)',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
  },
  {
    key: 'vizyon_altin',
    name: 'Vizyon Kuyumculuk',
    fullName: 'Vizyon Kuyumculuk & Altın',
    desc: 'Kuyumculuk & Altın',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
  },
];

export const Navbar: React.FC<NavbarProps> = ({
  connected,
  lastUpdate,
  activeTab,
  setActiveTab,
  user,
  onLogin,
  onLogout,
  onOpenAdvisor,
  onOpenAlerts,
  onOpenPriceHistory,
  onOpenArbitrageHistory,
  onOpenSettings,
  onOpenThemeModal,
  onRefresh,
  isRefreshing = false,
  activeAlertsCount,
  onOpenFirmPrices,
  sources,
}) => {
  const { isDark, toggleDayNight } = useTheme();
  const [timeStr, setTimeStr] = useState<string>('');
  const [isFirmMenuOpen, setIsFirmMenuOpen] = useState(false);
  const firmMenuRef = useRef<HTMLDivElement>(null);
  const firmMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleFirmMenuEnter = () => {
    if (firmMenuTimeoutRef.current) {
      clearTimeout(firmMenuTimeoutRef.current);
      firmMenuTimeoutRef.current = null;
    }
    setIsFirmMenuOpen(true);
  };

  const handleFirmMenuLeave = () => {
    firmMenuTimeoutRef.current = setTimeout(() => {
      setIsFirmMenuOpen(false);
    }, 200);
  };

  // Close firm dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (firmMenuRef.current && !firmMenuRef.current.contains(e.target as Node)) {
        setIsFirmMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFirmMenuOpen(false);
      }
    };
    if (isFirmMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isFirmMenuOpen]);

  useEffect(() => {
    const updateClock = () => {
      setTimeStr(
        new Date().toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className={`border-b sticky top-0 z-40 backdrop-blur-md transition-colors duration-200 ${
        isDark
          ? 'border-slate-800/80 bg-slate-950/95 text-white'
          : 'border-slate-200 bg-white/95 text-slate-900 shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-6 min-h-16 py-1.5 flex items-center justify-between gap-4">
        
        {/* Zone 1: RADAR Brand - Sola Yaslı, Sistem Aktif Logonun Altında (Fotoğraf 2 İstemi) */}
        <div className="flex flex-col items-start justify-center shrink-0">
          <RadarLogo
            size="md"
            showText={true}
            subtitle="Canlı Piyasa Terminali"
            isDark={isDark}
            animated={true}
          />
          {(() => {
            const hasData = Object.values(sources || {}).some(
              (s) => s && Array.isArray(s.data) && s.data.length > 0
            );
            const isLive = connected || hasData;
            return (
              <div className="flex items-center space-x-1.5 text-[10px] sm:text-[11px] font-mono mt-0.5 pl-0.5">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                    isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'
                  }`}
                ></span>
                <span className={isDark ? 'text-slate-400 font-sans' : 'text-slate-500 font-sans'}>
                  {isLive ? 'Sistem Aktif' : 'Bağlantı Kuruluyor...'}
                </span>
                <span aria-hidden="true" className={isDark ? 'text-slate-600' : 'text-slate-400'}>·</span>
                <span className={`font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {lastUpdate || timeStr}
                </span>
              </div>
            );
          })()}
        </div>

        {/* Zone 2: Primary Clean Navigation Links (Single-Line, no pills) */}
        <nav
          className={`hidden lg:flex items-center space-x-5 text-xs font-semibold ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          {/* Ana Sayfa: Üzerine mouse ile gelindiğinde 6 firma listesini açar, tıklandığında Ana Sayfa vitrinine gider */}
          <div
            className="relative"
            ref={firmMenuRef}
            onMouseEnter={handleFirmMenuEnter}
            onMouseLeave={handleFirmMenuLeave}
          >
            <button
              onClick={() => {
                setActiveTab('market');
                setIsFirmMenuOpen(false);
              }}
              className={`flex items-center space-x-1.5 pb-1 border-b-2 transition-colors whitespace-nowrap text-xs font-bold ${
                activeTab === 'market'
                  ? isDark
                    ? 'border-amber-400 text-amber-400'
                    : 'border-amber-600 text-amber-700'
                  : isDark
                    ? 'border-transparent text-slate-300 hover:text-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
              title="Ana Sayfa · Üzerine geldiğinizde 6 firma listesini açar"
            >
              <span>Ana Sayfa</span>
              <span
                className={`text-[9px] font-mono px-1 py-0.2 rounded border ${
                  isDark
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                6 Firma
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isFirmMenuOpen ? 'rotate-180 text-amber-400' : 'text-slate-400'
                }`}
              />
            </button>

            {/* Hover / Click ile Açılan 6 Firma Listesi Dropdown */}
            {isFirmMenuOpen && (
              <div className="absolute left-0 top-full pt-1.5 w-80 z-50 animate-fadeIn">
                <div
                  className={`border rounded-2xl shadow-2xl p-2 backdrop-blur-xl ${
                    isDark
                      ? 'bg-slate-950/98 border-slate-800 text-white shadow-black/80'
                      : 'bg-white/98 border-slate-200 text-slate-900 shadow-xl'
                  }`}
                >
                  <div
                    className={`px-3 py-2 border-b mb-1 flex items-center justify-between ${
                      isDark ? 'border-slate-800/80' : 'border-slate-100'
                    }`}
                  >
                    <div
                      className={`flex items-center space-x-1.5 text-xs font-bold ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5 text-amber-500" />
                      <span>Firma Listesi</span>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('market');
                        setIsFirmMenuOpen(false);
                      }}
                      className="text-[10px] text-amber-400 hover:underline font-semibold"
                    >
                      Tümünü Gör (Vitrin)
                    </button>
                  </div>

                  <div className="space-y-1">
                    {FIRMS_NAV_LIST.map((f) => {
                      const count = sources?.[f.key]?.data?.length || 0;
                      return (
                        <button
                          key={f.key}
                          onClick={() => {
                            setIsFirmMenuOpen(false);
                            if (onOpenFirmPrices) onOpenFirmPrices(f.key);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl transition text-left group border ${
                            isDark
                              ? 'hover:bg-slate-900 border-transparent hover:border-slate-800'
                              : 'hover:bg-slate-50 border-transparent hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <FirmLogo firmKey={f.key} firmName={f.name} size="md" />
                            <div className="flex flex-col min-w-0">
                              <span
                                className={`text-xs font-bold transition truncate ${
                                  isDark
                                    ? 'text-slate-200 group-hover:text-amber-300'
                                    : 'text-slate-800 group-hover:text-amber-700'
                                }`}
                              >
                                {f.fullName}
                              </span>
                              <span className="text-[10px] text-slate-500 truncate">
                                {f.desc}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 shrink-0 ml-2">
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition ${
                                isDark
                                  ? 'bg-slate-900 border-slate-800 text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/30'
                                  : 'bg-slate-100 border-slate-200 text-slate-600 group-hover:text-emerald-700 group-hover:border-emerald-500/40'
                              }`}
                            >
                              {count > 0 ? `${count} Kur` : 'Canlı'}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition" />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div
                    className={`mt-2 pt-2 border-t px-2 py-1 text-[10px] text-center ${
                      isDark ? 'border-slate-800/60 text-slate-400' : 'border-slate-100 text-slate-500'
                    }`}
                  >
                    Firmayı seçtiğinizde açılır pencere ile o firmanın yayınladığı tüm fiyatlar listelenir
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fiyat Karşılaştırma (Eski: Fiyat Matrisi) */}
          <button
            onClick={() => setActiveTab('matrix')}
            className={`transition-colors pb-1 border-b-2 whitespace-nowrap ${
              activeTab === 'matrix'
                ? isDark
                  ? 'border-amber-400 text-amber-400 font-bold'
                  : 'border-amber-600 text-amber-700 font-bold'
                : isDark
                  ? 'border-transparent text-slate-300 hover:text-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Fiyat Karşılaştırma
          </button>

          {/* Arbitraj Radarı */}
          <button
            onClick={() => setActiveTab('arbitrage')}
            className={`transition-colors pb-1 border-b-2 whitespace-nowrap ${
              activeTab === 'arbitrage'
                ? isDark
                  ? 'border-amber-400 text-amber-400 font-bold'
                  : 'border-amber-600 text-amber-700 font-bold'
                : isDark
                  ? 'border-transparent text-slate-300 hover:text-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Arbitraj Radarı
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          
          {/* Clock & Instant Refresh */}
          <div className="flex items-center space-x-1.5 text-xs font-mono text-slate-400 mr-1 sm:mr-2">
            <span className="hidden sm:inline">{timeStr}</span>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Piyasa Verilerini Güncelle"
              className={`flex items-center space-x-1 px-2 py-1 rounded-lg border transition text-[11px] ${
                isDark
                  ? 'border-slate-800 bg-slate-900/80 hover:border-amber-500/40 text-slate-300 hover:text-amber-400'
                  : 'border-slate-300 bg-slate-100 hover:border-amber-500/60 text-slate-700 hover:text-amber-700'
              } ${isRefreshing ? 'opacity-70' : ''}`}
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden md:inline font-sans font-medium">
                {isRefreshing ? 'Çekiliyor...' : 'Güncelle'}
              </span>
            </button>
          </div>

          {/* AI Advisor Trigger (Fotoğraf 3: RADAR AI olarak güncellendi) */}
          <button
            onClick={onOpenAdvisor}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition shadow-xs"
            title="RADAR AI - Yapay Zeka Finans Asistanı"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">RADAR AI</span>
            <span className="sm:hidden">AI</span>
          </button>

          {/* Price History & Charts */}
          <button
            onClick={onOpenPriceHistory}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition"
            title="Detaylı Fiyat Geçmişi & Grafikler"
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Fiyat Geçmişi</span>
          </button>

          {/* Arbitrage History & Past Records */}
          {onOpenArbitrageHistory && (
            <button
              onClick={onOpenArbitrageHistory}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition"
              title="Arbitraj Geçmiş Kayıtları (Veri Arşivi)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
              <span className="hidden md:inline">Arbitraj Kayıtları</span>
            </button>
          )}

          {/* Price Alerts */}
          <button
            onClick={onOpenAlerts}
            className={`relative p-2 rounded-xl border transition ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-900 border-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
            }`}
            title="Fiyat Alarmları"
          >
            <Bell className="w-4 h-4" />
            {activeAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-bold rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {activeAlertsCount}
              </span>
            )}
          </button>

          {/* 1. Fotoğraftaki Tema Değişikliği: Gece / Gündüz Modu Küçük İkonu */}
          <button
            onClick={toggleDayNight}
            className={`p-2 rounded-xl transition-all duration-200 border flex items-center justify-center group relative shadow-sm ${
              isDark
                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border-amber-500/30'
                : 'bg-amber-100/80 hover:bg-amber-200 text-amber-700 hover:text-amber-900 border-amber-300 shadow-amber-500/5'
            }`}
            title={
              isDark
                ? 'Gündüz Moduna Geç (Aydınlık Tema) · 1. Fotoğraftaki Tema İkonu'
                : 'Gece Moduna Geç (Koyu Tema) · 1. Fotoğraftaki Tema İkonu'
            }
            aria-label="Gece/Gündüz Modu Değiştir"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 group-hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-amber-700 transition-transform duration-300 group-hover:-rotate-12" />
            )}
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${
                isDark ? 'bg-amber-400' : 'bg-amber-600'
              }`}
            />
          </button>

          {/* Okunaklı Temalar & Standart Görünüm */}
          {onOpenThemeModal && (
            <button
              onClick={onOpenThemeModal}
              className={`p-2 rounded-xl border transition shadow-sm ${
                isDark
                  ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border-amber-500/30'
                  : 'text-amber-600 hover:text-amber-800 hover:bg-amber-100 border-amber-300'
              }`}
              title="Okunaklı Finans Temaları & Standart Görünüm Düzeni"
            >
              <Palette className="w-4 h-4" />
            </button>
          )}

          {/* Settings & Themes */}
          <button
            onClick={onOpenSettings}
            className={`p-2 rounded-xl border transition ${
              isDark
                ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-900 border-slate-800'
                : 'text-slate-600 hover:text-amber-600 hover:bg-slate-100 border-slate-200'
            }`}
            title="Terminal Ayarları"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Auth */}
          {user ? (
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Kullanıcı'}
                  className="w-6 h-6 rounded-full border border-amber-500/40 object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                  <UserIcon className="w-3 h-3" />
                </div>
              )}
              <span className="text-xs text-slate-200 font-semibold max-w-[85px] truncate hidden md:inline">
                {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
              </span>
              <button
                onClick={onLogout}
                title="Çıkış Yap"
                className="text-slate-400 hover:text-rose-400 p-0.5 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs font-medium transition"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.13z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>Giriş Yap</span>
            </button>
          )}

        </div>
      </div>

      {/* Mobile / Compact Sub-Navigation Tab Bar */}
      <div
        className={`lg:hidden flex items-center space-x-1 px-4 py-2 border-t overflow-x-auto scrollbar-none text-xs transition-colors duration-200 ${
          isDark ? 'bg-slate-950 border-slate-800/60' : 'bg-slate-100 border-slate-200'
        }`}
      >
        <button
          onClick={() => setActiveTab('market')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap transition font-semibold ${
            activeTab === 'market'
              ? isDark
                ? 'bg-amber-500/20 text-amber-400 font-bold'
                : 'bg-amber-200 text-amber-900 font-bold'
              : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Ana Sayfa
        </button>
        {onOpenFirmPrices && (
          <button
            onClick={() => onOpenFirmPrices()}
            className="px-2.5 py-1 rounded-lg whitespace-nowrap transition bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold flex items-center space-x-1 shrink-0"
            title="Açılır Pencerede Firma Fiyat Listesi"
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Firma Listesi</span>
          </button>
        )}
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap transition font-semibold ${
            activeTab === 'matrix'
              ? isDark
                ? 'bg-amber-500/20 text-amber-400 font-bold'
                : 'bg-amber-200 text-amber-900 font-bold'
              : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Fiyat Karşılaştırma
        </button>
        <button
          onClick={() => setActiveTab('arbitrage')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap transition font-semibold ${
            activeTab === 'arbitrage'
              ? isDark
                ? 'bg-amber-500/20 text-amber-400 font-bold'
                : 'bg-amber-200 text-amber-900 font-bold'
              : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Arbitraj
        </button>
        <button
          onClick={onOpenPriceHistory}
          className="px-3 py-1 rounded-lg whitespace-nowrap transition text-indigo-400 hover:text-white flex items-center space-x-1"
        >
          <TrendingUp className="w-3 h-3" />
          <span>Fiyat Geçmişi</span>
        </button>
      </div>
    </header>
  );
};
