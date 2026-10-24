import React, { useState } from 'react';
import {
  Settings,
  X,
  Check,
  Search,
  CheckSquare,
  Square,
  RotateCcw,
  Coins,
  DollarSign,
  Image as ImageIcon,
  LayoutGrid,
  Table,
  Sun,
  Moon,
  Hash,
  Sparkles,
  Landmark,
  Shield,
  Gem,
} from 'lucide-react';
import { MarketItem } from '../types/market';
import { CurrencyFlag } from './CurrencyFlag';
import { isFxItem, getCleanCurrencyCode, getStandardizedProductName } from '../utils/productUtils';
import { FirmLogo } from './FirmLogo';

export interface CellConfig {
  customTitle: string;
  customTagline: string;
  emblemType: 'gunes' | 'kaptan' | 'sar' | 'gold_coin' | 'diamond' | 'bank' | 'vault' | 'custom' | 'none';
  customLogoUrl: string;
  viewMode: 'gunes_terminal' | 'kaptan_table' | 'kaptan_cards' | 'sar_cards' | 'standard_table';
  cardTheme: 'photo_light' | 'dark_gold';
  decimals: number;
  visibleCodes: string[];
}

interface FirmCardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  firmName: string;
  sourceKey: string;
  allItems: MarketItem[];
  config: CellConfig;
  onSaveConfig: (newConfig: CellConfig) => void;
  onResetToDefault: () => void;
}

export const FirmCardSettingsModal: React.FC<FirmCardSettingsModalProps> = ({
  isOpen,
  onClose,
  firmName,
  sourceKey,
  allItems,
  config,
  onSaveConfig,
  onResetToDefault,
}) => {
  const [activeTab, setActiveTab] = useState<'design' | 'currencies'>('design');

  // Form states
  const [customTitle, setCustomTitle] = useState(config.customTitle);
  const [customTagline, setCustomTagline] = useState(config.customTagline);
  const [emblemType, setEmblemType] = useState<CellConfig['emblemType']>(config.emblemType);
  const [customLogoUrl, setCustomLogoUrl] = useState(config.customLogoUrl);
  const [viewMode, setViewMode] = useState<CellConfig['viewMode']>(config.viewMode);
  const [cardTheme, setCardTheme] = useState<CellConfig['cardTheme']>(config.cardTheme);
  const [decimals, setDecimals] = useState<number>(config.decimals);

  const validAllItems = React.useMemo(() => {
    return allItems.filter((i) => i && i.code !== 'ONS');
  }, [allItems]);

  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(() => {
    if (config.visibleCodes.length === 0) {
      return new Set(validAllItems.map((i) => i.code));
    }
    return new Set(config.visibleCodes.filter((c) => c !== 'ONS'));
  });

  const [search, setSearch] = useState('');
  const prevOpenRef = React.useRef(false);

  // Initialize form ONLY when modal opens or config prop changes, NEVER on allItems price ticks
  React.useEffect(() => {
    if (!isOpen) {
      prevOpenRef.current = false;
      return;
    }

    if (!prevOpenRef.current) {
      prevOpenRef.current = true;
      setCustomTitle(config.customTitle);
      setCustomTagline(config.customTagline);
      setEmblemType(config.emblemType);
      setCustomLogoUrl(config.customLogoUrl);
      setViewMode(config.viewMode);
      setCardTheme(config.cardTheme);
      setDecimals(config.decimals);
      if (config.visibleCodes.length === 0) {
        setSelectedCodes(new Set(validAllItems.map((i) => i.code)));
      } else {
        setSelectedCodes(new Set(config.visibleCodes.filter((c) => c !== 'ONS')));
      }
      setSearch('');
    }
  }, [isOpen, config, validAllItems]);

  if (!isOpen) return null;

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

  const filteredItems = validAllItems.filter((i) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return String(i?.name || '').toLowerCase().includes(q) || String(i?.code || '').toLowerCase().includes(q);
  });

  const toggleCode = (code: string) => {
    const next = new Set(selectedCodes);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    setSelectedCodes(next);
  };

  const handleSelectAll = () => {
    setSelectedCodes(new Set(validAllItems.map((i) => i.code)));
  };

  const handleDeselectAll = () => {
    setSelectedCodes(new Set());
  };

  const handleSelectOnlyGold = () => {
    const goldOnly = validAllItems.filter((i) => isGoldItem(i.code)).map((i) => i.code);
    setSelectedCodes(new Set(goldOnly));
  };

  const handleSelectOnlyFx = () => {
    const fxOnly = validAllItems.filter((i) => isFxItem(i.code)).map((i) => i.code);
    setSelectedCodes(new Set(fxOnly));
  };

  const handleSelectPopular = () => {
    const popularCodes = ['ALTIN_HAS', 'CEYREK_YENI', 'ALTIN_22', 'ATA_YENI', 'USDTRY', 'EURTRY', 'GBPTRY'];
    const popular = validAllItems.filter((i) => popularCodes.includes(i.code)).map((i) => i.code);
    setSelectedCodes(new Set(popular));
  };

  const handleSave = () => {
    const visibleCodesToSave =
      selectedCodes.size === validAllItems.length ? [] : Array.from(selectedCodes);

    onSaveConfig({
      customTitle: customTitle.trim() || firmName,
      customTagline: customTagline.trim(),
      emblemType,
      customLogoUrl: customLogoUrl.trim(),
      viewMode,
      cardTheme,
      decimals,
      visibleCodes: visibleCodesToSave,
    });
    onClose();
  };

  const handleReset = () => {
    onResetToDefault();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <FirmLogo firmKey={sourceKey} firmName={customTitle || firmName} size="md" />
            <div>
              <h3 className="font-bold text-white text-base truncate max-w-[260px] sm:max-w-md">
                {customTitle || firmName} — Hücre & Görünüm Ayarları
              </h3>
              <p className="text-xs text-slate-400">
                Görünecek isim, logo, kart tasarımı ve kur filtrelerini özelleştirin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 text-xs font-semibold px-4 pt-2">
          <button
            onClick={() => setActiveTab('design')}
            className={`pb-2.5 px-3 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'design'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Genel & Tasarım (Logo, İsim, Tema)</span>
          </button>
          <button
            onClick={() => setActiveTab('currencies')}
            className={`pb-2.5 px-3 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'currencies'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Görünecek Kurlar ({selectedCodes.size}/{allItems.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar">
          {activeTab === 'design' ? (
            <div className="space-y-4">
              {/* Görünecek İsim */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Hücre Başlığı / Görünecek İsim</span>
                  <span className="text-[10px] text-slate-500 font-normal">Varsayılan: {firmName}</span>
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={firmName}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Alt Başlık / Yetki Belgesi */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Alt Başlık / Yetki Belgesi Detayı</span>
                  <span className="text-[10px] text-slate-500 font-normal">Örn: A GRUBU YETKİLİ MÜESSESE</span>
                </label>
                <input
                  type="text"
                  value={customTagline}
                  onChange={(e) => setCustomTagline(e.target.value)}
                  placeholder="A GRUBU YETKİLİ MÜESSESE"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Görünüm Modu Seçimi */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Hücre Görünüm Düzeni</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Güneş Kuyumculuk Orijinal Terminal (Fotoğraftaki) */}
                  <button
                    type="button"
                    onClick={() => setViewMode('gunes_terminal')}
                    className={`p-3 rounded-xl border text-left transition flex items-start space-x-2.5 ${
                      viewMode === 'gunes_terminal'
                        ? 'bg-[#181310] border-amber-500 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <Table className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-xs flex items-center space-x-1.5">
                        <span className="text-amber-400">Güneş Orijinal Terminal</span>
                        {sourceKey === 'gunes_kuyumculuk' && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-normal">
                            Fotoğraftaki
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Gümüş metalik başlık, siyah LED kutular, şubeler ve altın elmas logo (Fotoğraf)
                      </div>
                    </div>
                  </button>

                  {/* Kaptan Kuyumcu Orijinal Tablo (1. Fotoğraftaki) */}
                  <button
                    type="button"
                    onClick={() => setViewMode('kaptan_table')}
                    className={`p-3 rounded-xl border text-left transition flex items-start space-x-2.5 ${
                      viewMode === 'kaptan_table'
                        ? 'bg-[#121a2d] border-[#a81c24] text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <Table className="w-5 h-5 text-[#a81c24] mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-xs flex items-center space-x-1.5">
                        <span className="text-[#a81c24]">Kaptan Orijinal Tablo</span>
                        {sourceKey === 'kaptan_doviz' && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-normal">
                            1. Fotoğraftaki
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Lacivert başlık, kırmızı kodlar, beyaz satırlar ve ayrı Altın başlığı
                      </div>
                    </div>
                  </button>

                  {/* Kaptan Mobil Kart Görünümü (2. Fotoğraftaki) */}
                  <button
                    type="button"
                    onClick={() => setViewMode('kaptan_cards')}
                    className={`p-3 rounded-xl border text-left transition flex items-start space-x-2.5 ${
                      viewMode === 'kaptan_cards'
                        ? 'bg-[#121a2d] border-[#a81c24] text-white shadow-md'
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
                        Başlıklı lacivert hap kartlar, iki sütunlu ALIŞ / SATIŞ blokları (Fotoğraf 2)
                      </div>
                    </div>
                  </button>

                  {/* SAR Döviz Kart Görünümü */}
                  <button
                    type="button"
                    onClick={() => setViewMode('sar_cards')}
                    className={`p-3 rounded-xl border text-left transition flex items-start space-x-2.5 ${
                      viewMode === 'sar_cards'
                        ? 'bg-amber-500/15 border-amber-500/50 text-white'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <LayoutGrid className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-xs flex items-center space-x-1.5">
                        <span>SAR Döviz Özel Kart Görünümü</span>
                        {sourceKey === 'sar_doviz' && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-normal">
                            SAR Formatı
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Altın bayrak kutusu, ALIŞ/BUY ve SATIŞ/SELL sütunları
                      </div>
                    </div>
                  </button>

                  {/* Standart Finans Tablosu */}
                  <button
                    type="button"
                    onClick={() => setViewMode('standard_table')}
                    className={`p-3 rounded-xl border text-left transition flex items-start space-x-2.5 ${
                      viewMode === 'standard_table'
                        ? 'bg-amber-500/15 border-amber-500/50 text-white'
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

              {/* Kart Renk Teması */}
              {viewMode !== 'standard_table' && (
                <div className="space-y-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                    <span>Kart Renk Teması</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCardTheme('photo_light')}
                      className={`p-2.5 rounded-lg border text-left transition flex items-center space-x-2 ${
                        cardTheme === 'photo_light'
                          ? 'bg-amber-500/15 border-amber-400 text-white font-bold'
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
                      onClick={() => setCardTheme('dark_gold')}
                      className={`p-2.5 rounded-lg border text-left transition flex items-center space-x-2 ${
                        cardTheme === 'dark_gold'
                          ? 'bg-amber-500/15 border-amber-400 text-white font-bold'
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

              {/* Logo & Amblem Seçimi */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Logo & Amblem Seçimi</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 text-xs">
                  {/* Güneş Logo */}
                  <button
                    type="button"
                    onClick={() => setEmblemType('gunes')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                      emblemType === 'gunes'
                        ? 'bg-amber-950/40 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-serif font-black text-amber-400">GÜNEŞ</span>
                    <span className="text-[10px]">Güneş Logo</span>
                  </button>

                  {/* Kaptan Logo */}
                  <button
                    type="button"
                    onClick={() => setEmblemType('kaptan')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                      emblemType === 'kaptan'
                        ? 'bg-rose-950/40 border-rose-500 text-rose-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-black text-[#a81c24]">KAPTAN</span>
                    <span className="text-[10px]">Kaptan Logo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmblemType('sar')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                      emblemType === 'sar'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-black text-[#b88c42]">SAR</span>
                    <span className="text-[10px]">SAR Orijinal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmblemType('gold_coin')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                      emblemType === 'gold_coin'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px]">Altın Para</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmblemType('diamond')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                      emblemType === 'diamond'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Gem className="w-4 h-4 text-cyan-400" />
                    <span className="text-[10px]">Pırlanta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmblemType('bank')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                      emblemType === 'bank'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Landmark className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px]">Banka</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmblemType('vault')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                      emblemType === 'vault'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-rose-400" />
                    <span className="text-[10px]">Kasa / Güven</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmblemType('custom')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                      emblemType === 'custom'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px]">Özel Logo URL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmblemType('none')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                      emblemType === 'none'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <X className="w-4 h-4 text-slate-500" />
                    <span className="text-[10px]">Logo Yok</span>
                  </button>
                </div>

                {emblemType === 'custom' && (
                  <div className="pt-2">
                    <input
                      type="url"
                      value={customLogoUrl}
                      onChange={(e) => setCustomLogoUrl(e.target.value)}
                      placeholder="https://site.com/logo.png"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}
              </div>

              {/* Ondalık Basamak Sayısı */}
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
                      onClick={() => setDecimals(dec)}
                      className={`py-2 px-3 rounded-xl border text-center transition ${
                        decimals === dec
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
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
            </div>
          ) : (
            <div className="space-y-3">
              {/* Quick Presets Toolbar */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                  <span className="text-[11px] font-semibold text-slate-400">Hızlı Seçim:</span>
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition flex items-center space-x-1"
                    >
                      <CheckSquare className="w-3 h-3 text-emerald-400" />
                      <span>Tümü</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectOnlyGold}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-medium transition flex items-center space-x-1"
                    >
                      <Coins className="w-3 h-3" />
                      <span>Yalnızca Altın</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectOnlyFx}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-medium transition flex items-center space-x-1"
                    >
                      <DollarSign className="w-3 h-3" />
                      <span>Yalnızca Döviz</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 font-medium transition flex items-center space-x-1"
                    >
                      <Square className="w-3 h-3" />
                      <span>Temizle</span>
                    </button>
                  </div>
                </div>

                {/* Local Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Kur veya altın adı ara..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-2 text-slate-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Items List with Checkboxes */}
              <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredItems.map((item) => {
                  const isChecked = selectedCodes.has(item.code);
                  const isGold = isGoldItem(item.code);

                  return (
                    <div
                      key={item.code}
                      onClick={() => toggleCode(item.code)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isChecked
                          ? 'bg-slate-800/80 border-amber-500/40 text-white'
                          : 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 ${
                            isChecked
                              ? 'bg-amber-500 border-amber-500 text-slate-950 font-bold'
                              : 'border-slate-600 bg-slate-900'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="flex items-center space-x-1.5 min-w-0">
                          {isFxItem(item.code) && (
                            <CurrencyFlag
                              code={getCleanCurrencyCode(item.code)}
                              size={15}
                              className="w-[15px] h-[15px] rounded-full shrink-0"
                            />
                          )}
                          <span className="font-semibold text-xs text-white truncate">
                            {getStandardizedProductName(item.code, item.name)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right text-xs font-mono tabular-nums text-slate-300 shrink-0">
                        <span className="text-emerald-400">{item.buy}</span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span className="text-rose-400">{item.sell}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition flex items-center space-x-1.5"
            title="Tüm ayarları orijinal fabrika varsayılanlarına sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Varsayılana Sıfırla</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Kaydet ve Uygula</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
