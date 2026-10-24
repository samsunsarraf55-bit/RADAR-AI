import React from 'react';
import {
  GlobalDisplayMode,
  StandardThemeId,
  FontScaleMode,
  StandardThemeDefinition,
} from '../types/theme';
import {
  X,
  Sparkles,
  Sun,
  Moon,
  Compass,
  Tv,
  Check,
  LayoutGrid,
  Table,
  Type,
  Eye,
  Gem,
  FileText,
} from 'lucide-react';

export const STANDARD_THEMES: StandardThemeDefinition[] = [
  {
    id: 'light_clarity',
    name: 'Aydınlık Finans (Ultra Net Beyaz)',
    category: 'light',
    badge: 'Gündüz & Net',
    description: 'Yüksek kontrast saf beyaz zemin, koyu siyah kalın rakamlar. Gün ışığında bile anında okunur.',
    bgPreview: '#ffffff',
    textPreview: '#09090b',
    accentPreview: '#059669',
  },
  {
    id: 'dark_gold',
    name: 'Koyu Sarraf & Altın (Kapalıçarşı Terminal)',
    category: 'dark',
    badge: 'Sarraf Altın',
    description: 'Koyu antrasit zemin, sarrafiye altın sarısı başlık ve yüksek kontrastlı yeşil/kırmızı fiyatlar.',
    bgPreview: '#090d16',
    textPreview: '#ffffff',
    accentPreview: '#f59e0b',
  },
  {
    id: 'midnight_navy',
    name: 'Gece Laciverti (Kurumsal Banka Pro)',
    category: 'dark',
    badge: 'Banka Pro',
    description: 'Gece mavisi zemin, buz mavisi detaylar ve kristal beyaz rakamlar. Göz yormayan kurumsal arayüz.',
    bgPreview: '#0b1326',
    textPreview: '#f8fafc',
    accentPreview: '#38bdf8',
  },
  {
    id: 'emerald_sarraf',
    name: 'Zümrüt Yeşil (Geleneksel Sarrafiye)',
    category: 'dark',
    badge: 'Zümrüt Sarraf',
    description: 'Derin zümrüt zemin, altın yaldızlı başlıklar ve nane yeşili alış / yakut kırmızı satış.',
    bgPreview: '#04160f',
    textPreview: '#f0fdf4',
    accentPreview: '#10b981',
  },
  {
    id: 'digital_led',
    name: 'Dijital LED Pano (Uzaktan Okunabilir)',
    category: 'dark',
    badge: 'LED Ekran',
    description: 'Saf mat siyah zemin, fosforlu kehribar ve yeşil/kırmızı LED rakamlar. Vitrinden ve uzaktan anında okunur.',
    bgPreview: '#020202',
    textPreview: '#fbbf24',
    accentPreview: '#34d399',
  },
  {
    id: 'warm_cream',
    name: 'Krem & Sıcak Kağıt (Göz Yormayan Açık)',
    category: 'light',
    badge: 'Sıcak Kağıt',
    description: 'Sıcak krem kağıt zemin, koyu espresso kontrast yazılar. Mavi ışığı kırar, uzun saatler gözü yormaz.',
    bgPreview: '#fcf9f2',
    textPreview: '#1c1917',
    accentPreview: '#b45309',
  },
];

interface ThemeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  globalDisplayMode: GlobalDisplayMode;
  onSelectDisplayMode: (mode: GlobalDisplayMode) => void;
  selectedTheme: StandardThemeId;
  onSelectTheme: (theme: StandardThemeId) => void;
  fontScale: FontScaleMode;
  onSelectFontScale: (scale: FontScaleMode) => void;
}

export const ThemeManagerModal: React.FC<ThemeManagerModalProps> = ({
  isOpen,
  onClose,
  globalDisplayMode,
  onSelectDisplayMode,
  selectedTheme,
  onSelectTheme,
  fontScale,
  onSelectFontScale,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base leading-tight">
                Görünüm Düzeni & Okunaklı Finans Temaları
              </h2>
              <p className="text-xs text-slate-400">
                Tüm firmaları tek tip standart tabloda toplayın veya ultra okunaklı temalar seçin
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

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-6 custom-scrollbar text-slate-200">

          {/* 1. Bölüm: Tüm Firmaların Görünüm Formatı */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>1. Tüm Firmaların Görünüm Formatı</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Orijinal Mağaza Görünümleri */}
              <button
                type="button"
                onClick={() => onSelectDisplayMode('store_custom')}
                className={`p-3.5 rounded-xl border text-left transition flex items-start space-x-3 ${
                  globalDisplayMode === 'store_custom'
                    ? 'bg-amber-500/15 border-amber-400 text-white shadow-md'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                  <LayoutGrid className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Özgün Mağaza Tasarımları</span>
                    {globalDisplayMode === 'store_custom' && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                    SAR Döviz kartları, Kaptan lacivert tablosu ve Güneş LED terminali gibi her firmanın orijinal vitrin tasarımı korunur.
                  </p>
                </div>
              </button>

              {/* Tek Tip Standart Tablo */}
              <button
                type="button"
                onClick={() => onSelectDisplayMode('standard_table')}
                className={`p-3.5 rounded-xl border text-left transition flex items-start space-x-3 ${
                  globalDisplayMode === 'standard_table'
                    ? 'bg-amber-500/15 border-amber-400 text-white shadow-md'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                  <Table className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Tek Tip Standart Tablo</span>
                    {globalDisplayMode === 'standard_table' && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                    Tüm firmalar birebir aynı sütun yapısına, net çizgilere ve seçtiğiniz okunaklı temaya sahip eşit borsa tablosunda gösterilir.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Bölüm: Ultra Okunaklı Finans Temaları */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>2. Okunaklı Finans Temaları (4 Seçenek)</span>
              </label>
              <span className="text-[11px] text-slate-500">Yüksek kontrast & net rakamlar</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STANDARD_THEMES.map((th) => {
                const isSelected = selectedTheme === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => onSelectTheme(th.id)}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between relative overflow-hidden group ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/20 bg-slate-950 shadow-lg'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Top Row: Icon + Badge + Selection */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {th.id === 'light_clarity' && <Sun className="w-4 h-4 text-amber-400" />}
                          {th.id === 'dark_gold' && <Moon className="w-4 h-4 text-amber-400" />}
                          {th.id === 'midnight_navy' && <Compass className="w-4 h-4 text-cyan-400" />}
                          {th.id === 'emerald_sarraf' && <Gem className="w-4 h-4 text-emerald-400" />}
                          {th.id === 'digital_led' && <Tv className="w-4 h-4 text-emerald-400" />}
                          {th.id === 'warm_cream' && <FileText className="w-4 h-4 text-amber-500" />}
                          <span className="font-bold text-xs text-white">{th.name}</span>
                        </div>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {th.badge}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 mb-3 leading-normal">
                        {th.description}
                      </p>
                    </div>

                    {/* Live Visual Mini Preview Strip */}
                    <div
                      className="p-2 rounded-lg border border-slate-700/60 flex items-center justify-between text-[11px] font-mono font-bold"
                      style={{ backgroundColor: th.bgPreview, color: th.textPreview }}
                    >
                      <span className="truncate pr-1">HAS ALTIN</span>
                      <div className="flex items-center space-x-2 text-[10px] shrink-0">
                        <span className="text-emerald-500 font-extrabold">6.548 ₺</span>
                        <span className="text-rose-500 font-extrabold">6.631 ₺</span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Bölüm: Rakam Boyutu & Okunabilirlik Seviyesi */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Type className="w-3.5 h-3.5 text-amber-400" />
              <span>3. Yazı Boyutu & Okunabilirlik Ölçeği</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onSelectFontScale('normal')}
                className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                  fontScale === 'normal'
                    ? 'bg-amber-500/15 border-amber-400 text-white font-bold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-xs font-bold">Standart</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Dengeli</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectFontScale('large')}
                className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                  fontScale === 'large'
                    ? 'bg-amber-500/15 border-amber-400 text-white font-bold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-xs font-bold text-amber-400">Rahat Okuma (+15%)</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Daha İri Rakamlar</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectFontScale('xlarge')}
                className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                  fontScale === 'xlarge'
                    ? 'bg-amber-500/15 border-amber-400 text-white font-bold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-xs font-bold text-amber-300">Vitrin / Uzaktan (+30%)</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Büyük LED Punto</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Seçimleriniz otomatik kaydedilir ve tüm cihazlarınızda korunur.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20"
          >
            Tamam, Uygula
          </button>
        </div>
      </div>
    </div>
  );
};
