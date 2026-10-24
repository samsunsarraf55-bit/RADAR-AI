import React, { useState, useEffect } from 'react';
import { SourcesMap } from '../types/market';
import {
  Calculator,
  Coins,
  DollarSign,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  X,
  Building2,
  Layers,
  Scale,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { CurrencyFlag } from './CurrencyFlag';
import { FirmLogo } from './FirmLogo';

export interface JewelryCalculatorProps {
  sources: SourcesMap;
  initialItem?: { code: string; name: string; firmName: string } | null;
  isOpen?: boolean;
  onClose?: () => void;
  isModal?: boolean;
}

export const JewelryCalculator: React.FC<JewelryCalculatorProps> = ({
  sources,
  initialItem,
  isOpen = true,
  onClose,
  isModal = true,
}) => {
  const { isDark } = useTheme();
  const [calcMode, setCalcMode] = useState<'gram' | 'pieces' | 'fx'>('gram');
  const [actionType, setActionType] = useState<'sell' | 'buy'>('sell'); // sell: bozdurma (buy price), buy: satin alma (sell price)
  const [selectedFirmKey, setSelectedFirmKey] = useState<string>('best');

  // Gram state
  const [karat, setKarat] = useState<'24' | '22' | '18' | '14' | 'gumus'>('24');
  const [grams, setGrams] = useState<number>(10);

  // Piece counts
  const [pieces, setPieces] = useState({
    ceyrek: 2,
    yarim: 0,
    tam: 0,
    ata: 1,
    gremse: 0,
  });

  // FX state
  const [fxCurrency, setFxCurrency] = useState<'USDTRY' | 'EURTRY' | 'GBPTRY' | 'SARTRY'>('USDTRY');
  const [fxAmount, setFxAmount] = useState<number>(1000);

  // Synchronize mode when initialItem is passed
  useEffect(() => {
    if (!initialItem) return;
    const c = initialItem.code.toUpperCase();
    if (c.includes('USD') || c.includes('EUR') || c.includes('GBP') || c.includes('SAR') || c.includes('TRY')) {
      setCalcMode('fx');
      if (c === 'EURTRY' || c === 'GBPTRY' || c === 'SARTRY') {
        setFxCurrency(c as any);
      } else {
        setFxCurrency('USDTRY');
      }
    } else if (
      c.startsWith('CEYREK') ||
      c.startsWith('YARIM') ||
      c.startsWith('TAM') ||
      c.startsWith('ATA') ||
      c.startsWith('GREMSE') ||
      c.startsWith('RESAT')
    ) {
      setCalcMode('pieces');
    } else {
      setCalcMode('gram');
      if (c.includes('22')) setKarat('22');
      else if (c.includes('14')) setKarat('14');
      else if (c.includes('GUMUS')) setKarat('gumus');
      else setKarat('24');
    }

    // Try to find firm key if firmName is given
    if (initialItem.firmName) {
      const match = Object.entries(sources).find(
        ([_, s]) => s.sourceName?.toLowerCase() === initialItem.firmName?.toLowerCase()
      );
      if (match) {
        setSelectedFirmKey(match[0]);
      }
    }
  }, [initialItem, sources]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen || !onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (isModal && !isOpen) return null;

  // Helper to get prices
  const getPrice = (code: string, type: 'buy' | 'sell') => {
    if (selectedFirmKey !== 'best') {
      const firm = sources[selectedFirmKey];
      const item = firm?.data?.find((d) => d.code === code);
      if (item) return type === 'buy' ? item.buy : item.sell;
    }

    // Best price across all firms
    let best = 0;
    Object.values(sources).forEach((source) => {
      const item = source.data?.find((d) => d.code === code);
      if (item) {
        if (type === 'buy') {
          // User selling to firm -> highest buy price is best
          if (item.buy > best) best = item.buy;
        } else {
          // User buying from firm -> lowest sell price is best
          if (best === 0 || item.sell < best) best = item.sell;
        }
      }
    });

    return best;
  };

  // Calculations
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Gram calculation
  const hasGramPrice = getPrice('ALTIN_HAS', actionType === 'sell' ? 'buy' : 'sell');
  const bilezik22Price = getPrice('ALTIN_22', actionType === 'sell' ? 'buy' : 'sell');
  const ayar14Price = getPrice('ALTIN_14', actionType === 'sell' ? 'buy' : 'sell');
  const gumusPrice = getPrice('GUMUS', actionType === 'sell' ? 'buy' : 'sell');

  let unitPrice = hasGramPrice;
  if (karat === '22') unitPrice = bilezik22Price;
  else if (karat === '18') unitPrice = hasGramPrice * 0.75;
  else if (karat === '14') unitPrice = ayar14Price;
  else if (karat === 'gumus') unitPrice = gumusPrice;

  const totalGramValue = grams * unitPrice;

  // Pieces calculation
  const ceyrekP = getPrice('CEYREK_YENI', actionType === 'sell' ? 'buy' : 'sell');
  const yarimP = getPrice('YARIM_YENI', actionType === 'sell' ? 'buy' : 'sell');
  const tamP = getPrice('TAM_YENI', actionType === 'sell' ? 'buy' : 'sell');
  const ataP = getPrice('ATA_YENI', actionType === 'sell' ? 'buy' : 'sell');
  const gremseP = getPrice('GREMSE_YENI', actionType === 'sell' ? 'buy' : 'sell');

  const totalPiecesValue =
    pieces.ceyrek * ceyrekP +
    pieces.yarim * yarimP +
    pieces.tam * tamP +
    pieces.ata * ataP +
    pieces.gremse * gremseP;

  // FX calculation
  const fxUnitPrice = getPrice(fxCurrency, actionType === 'sell' ? 'buy' : 'sell');
  const totalFxValue = fxAmount * fxUnitPrice;

  const content = (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Cols: Calculator Controls */}
      <div className="lg:col-span-2 space-y-5">
        <div
          className={`border rounded-2xl p-5 sm:p-6 shadow-xl space-y-5 ${
            isDark
              ? 'bg-slate-950/90 border-slate-800'
              : 'bg-white border-slate-200'
          }`}
        >
          {/* Action Type & Firm Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 border-slate-700/40">
            {/* Bozdurma vs Satın Alma */}
            <div className="flex items-center space-x-1 p-1 bg-slate-900/40 dark:bg-slate-900 rounded-xl border border-slate-700/40">
              <button
                type="button"
                onClick={() => setActionType('sell')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  actionType === 'sell'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Müşteri Bozdurma (Alış Fiyatı)
              </button>
              <button
                type="button"
                onClick={() => setActionType('buy')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  actionType === 'buy'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Müşteri Satın Alma (Satış Fiyatı)
              </button>
            </div>

            {/* Firma Seçici */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">Firma:</span>
              <select
                value={selectedFirmKey}
                onChange={(e) => setSelectedFirmKey(e.target.value)}
                className={`text-xs rounded-xl px-3 py-1.5 border font-semibold focus:outline-none focus:border-amber-500 ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-slate-100 border-slate-300 text-slate-900'
                }`}
              >
                <option value="best">👑 En Avantajlı Piyasa Teklifi</option>
                {Object.entries(sources).map(([k, s]) => (
                  <option key={k} value={k}>
                    {s.sourceName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setCalcMode('gram')}
              className={`p-3 rounded-xl border flex flex-col items-center text-center transition ${
                calcMode === 'gram'
                  ? 'bg-amber-500/15 border-amber-500/60 text-amber-400 shadow-md'
                  : isDark
                  ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Coins className="w-5 h-5 mb-1 text-amber-400" />
              <span className="text-xs font-bold">Gram & Bilezik</span>
              <span className="text-[10px] opacity-75">Has, 22K, 18K, 14K</span>
            </button>

            <button
              type="button"
              onClick={() => setCalcMode('pieces')}
              className={`p-3 rounded-xl border flex flex-col items-center text-center transition ${
                calcMode === 'pieces'
                  ? 'bg-amber-500/15 border-amber-500/60 text-amber-400 shadow-md'
                  : isDark
                  ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scale className="w-5 h-5 mb-1 text-amber-400" />
              <span className="text-xs font-bold">Sarrafiye Adet</span>
              <span className="text-[10px] opacity-75">Çeyrek, Yarım, Ata...</span>
            </button>

            <button
              type="button"
              onClick={() => setCalcMode('fx')}
              className={`p-3 rounded-xl border flex flex-col items-center text-center transition ${
                calcMode === 'fx'
                  ? 'bg-amber-500/15 border-amber-500/60 text-amber-400 shadow-md'
                  : isDark
                  ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-5 h-5 mb-1 text-amber-400" />
              <span className="text-xs font-bold">Döviz Çevirici</span>
              <span className="text-[10px] opacity-75">USD, EUR, GBP, SAR</span>
            </button>
          </div>

          {/* Mode 1: Gram Inputs */}
          {calcMode === 'gram' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-2 font-medium">Ayar Seçimi:</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: '24', label: '24 AYAR' },
                    { id: '22', label: '22 AYAR' },
                    { id: '18', label: '18 AYAR' },
                    { id: '14', label: '14 AYAR' },
                    { id: 'gumus', label: 'GÜMÜŞ' },
                  ].map((k) => (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => setKarat(k.id as any)}
                      className={`p-2 rounded-xl text-xs font-bold border transition text-center ${
                        karat === k.id
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : isDark
                          ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                          : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {k.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-slate-400 font-medium">Gram Miktarı:</label>
                  <span className="text-sm font-bold font-mono text-amber-400">{grams} gr</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={grams}
                    onChange={(e) => setGrams(Math.max(0, parseFloat(e.target.value) || 0))}
                    className={`flex-1 rounded-xl px-4 py-2.5 text-base font-mono font-bold border focus:outline-none focus:border-amber-500 ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <div className="flex items-center space-x-1">
                    {[1, 5, 10, 50, 100].map((quick) => (
                      <button
                        key={quick}
                        type="button"
                        onClick={() => setGrams(quick)}
                        className={`px-2.5 py-2 rounded-lg text-xs font-semibold border transition ${
                          isDark
                            ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                            : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                        }`}
                      >
                        +{quick}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Pieces Inputs */}
          {calcMode === 'pieces' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { key: 'ceyrek', label: 'ÇEYREK', price: ceyrekP },
                { key: 'yarim', label: 'YARIM', price: yarimP },
                { key: 'tam', label: 'TAM', price: tamP },
                { key: 'ata', label: 'ATA LİRA', price: ataP },
                { key: 'gremse', label: 'GREMSE', price: gremseP },
              ].map((p) => (
                <div
                  key={p.key}
                  className={`p-3 rounded-xl border ${
                    isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <span className="font-bold text-slate-200">{p.label}</span>
                    <span className="font-mono text-[11px] text-amber-400">{formatMoney(p.price)} ₺</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPieces((prev) => ({
                          ...prev,
                          [p.key]: Math.max(0, (prev as any)[p.key] - 1),
                        }))
                      }
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm border ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-200 border-slate-300 text-slate-800'
                      }`}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={(pieces as any)[p.key]}
                      onChange={(e) =>
                        setPieces((prev) => ({
                          ...prev,
                          [p.key]: Math.max(0, parseInt(e.target.value) || 0),
                        }))
                      }
                      className={`flex-1 text-center font-mono font-bold text-sm py-1 rounded-lg border focus:outline-none focus:border-amber-500 ${
                        isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPieces((prev) => ({
                          ...prev,
                          [p.key]: (prev as any)[p.key] + 1,
                        }))
                      }
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm border ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-200 border-slate-300 text-slate-800'
                      }`}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mode 3: FX Inputs */}
          {calcMode === 'fx' && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'USDTRY', label: 'USD' },
                  { id: 'EURTRY', label: 'EUR' },
                  { id: 'GBPTRY', label: 'GBP' },
                  { id: 'SARTRY', label: 'SAR' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFxCurrency(c.id as any)}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center space-x-1.5 ${
                      fxCurrency === c.id
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                        : isDark
                        ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <CurrencyFlag code={c.label} size={16} className="w-4 h-4 shrink-0 rounded-full" />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-slate-400 font-medium">Döviz Tutarı:</label>
                  <span className="text-sm font-bold font-mono text-amber-400">
                    {fxAmount.toLocaleString('tr-TR')} {fxCurrency.replace('TRY', '')}
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  step="100"
                  value={fxAmount}
                  onChange={(e) => setFxAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className={`w-full rounded-xl px-4 py-2.5 text-base font-mono font-bold border focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right 1 Col: Payout Summary Card */}
      <div className="space-y-4">
        <div
          className={`border rounded-2xl p-6 shadow-2xl space-y-5 ${
            isDark
              ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-amber-500/30'
              : 'bg-gradient-to-b from-white to-amber-50/40 border-amber-500/40 shadow-amber-500/5'
          }`}
        >
          <div className="flex items-center space-x-2 text-amber-500">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-xs uppercase font-mono font-bold tracking-wider">
              Hesap Özeti & Net Tutar
            </span>
          </div>

          <div className={`space-y-3 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">İşlem Türü:</span>
              <span
                className={`font-semibold ${
                  actionType === 'sell' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {actionType === 'sell' ? 'Müşteri Bozdurma (Alış Fiyatı)' : 'Müşteri Satın Alma (Satış Fiyatı)'}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Uygulanan Fiyat:</span>
              <span className={`font-medium flex items-center space-x-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {selectedFirmKey !== 'best' && <FirmLogo firmKey={selectedFirmKey} size="xs" />}
                <span>{selectedFirmKey === 'best' ? 'En İyi Piyasa Teklifi' : sources[selectedFirmKey]?.sourceName}</span>
              </span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Birim Fiyat:</span>
              <span className={`font-mono font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {formatMoney(
                  calcMode === 'gram'
                    ? unitPrice
                    : calcMode === 'fx'
                    ? fxUnitPrice
                    : ceyrekP
                )}{' '}
                ₺
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Hesaplanan Toplam Tutar</span>
            <div className="text-3xl font-extrabold font-mono text-amber-500 tracking-tight">
              {formatMoney(
                calcMode === 'gram'
                  ? totalGramValue
                  : calcMode === 'pieces'
                  ? totalPiecesValue
                  : totalFxValue
              )}{' '}
              <span className="text-lg font-normal text-slate-400">TRY</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              * Fiyatlar 7 firmanın anlık canlı kurlarından otomatik hesaplanmaktadır.
            </p>
          </div>

          <div
            className={`border rounded-xl p-3 text-xs space-y-1.5 ${
              isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-amber-100/40 border-amber-200 text-slate-700'
            }`}
          >
            <div className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sarraf Tavsiyesi:</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              İşçilikli altın bozdururken darphane damgasını kontrol edin. Yatırımlık altın alırken Has Altın veya Ata
              tercih etmek alış-satış makasını minimumda tutar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isModal) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-4xl border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
          isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/15 text-amber-400 rounded-xl border border-amber-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Kuyumcu Masası & Hızlı Hesaplama Aracı
                </h3>
                {initialItem && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 inline-flex items-center space-x-1.5">
                    <FirmLogo firmName={initialItem.firmName} size="xs" />
                    <span>{initialItem.name} ({initialItem.firmName})</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Canlı altın ve döviz fiyatlarıyla anında bozdurma ve satın alma hesabı yapın
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-300 dark:border-slate-700">
              ESC ile Kapat
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">{content}</div>
      </div>
    </div>
  );
};
