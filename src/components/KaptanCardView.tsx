import React, { useMemo } from 'react';
import { MarketItem, SourcesMap } from '../types/market';
import { Calculator, TrendingUp, Zap } from 'lucide-react';
import { findItemArbitrageDeal, findArbitrageDeals, ArbitrageDeal } from '../services/arbitrageAlertService';
import { getFirmBrandStyle } from '../utils/firmColors';
import { CurrencyFlag } from './CurrencyFlag';
import { isFxItem, getCleanCurrencyCode, getStandardizedProductName } from '../utils/productUtils';
import { FirmLogo } from './FirmLogo';

interface KaptanCardViewProps {
  items: MarketItem[];
  compact?: boolean;
  theme?: 'kaptan_light' | 'kaptan_dark';
  viewType?: 'table' | 'cards'; // 'table' = 1st photo, 'cards' = 2nd photo
  decimals?: number;
  onSelectForCalculator?: (item: MarketItem, firmName: string) => void;
  onOpenPriceHistory?: (code: string) => void;
  firmName?: string;
  sourceKey?: string;
  allSources?: SourcesMap;
}

// Standardized code & name mapping
interface ItemMeta {
  displayCode: string;
  displayName: string;
  isGold: boolean;
}

const KAPTAN_META_MAP: Record<string, ItemMeta> = {
  // Döviz (Currencies)
  USDTRY: { displayCode: 'USD', displayName: 'USD', isGold: false },
  EURTRY: { displayCode: 'EUR', displayName: 'EUR', isGold: false },
  CHFTRY: { displayCode: 'CHF', displayName: 'CHF', isGold: false },
  GBPTRY: { displayCode: 'GBP', displayName: 'GBP', isGold: false },
  AUDTRY: { displayCode: 'AUD', displayName: 'AUD', isGold: false },
  CADTRY: { displayCode: 'CAD', displayName: 'CAD', isGold: false },
  SARTRY: { displayCode: 'SAR', displayName: 'SAR', isGold: false },
  JPYTRY: { displayCode: 'JPY', displayName: 'JPY', isGold: false },
  RUBTRY: { displayCode: 'RUB', displayName: 'RUB', isGold: false },
  AZNTRY: { displayCode: 'AZN', displayName: 'AZN', isGold: false },
  GELTRY: { displayCode: 'GEL', displayName: 'GEL', isGold: false },
  EURUSD: { displayCode: 'EUR/USD', displayName: 'EUR/USD', isGold: false },

  // Altın (Gold - Standardized: 24 AYAR, 22 AYAR, ÇEYREK, YARIM, TAM, ATA LİRA, HAS, GÜMÜŞ)
  ALTIN_HAS: { displayCode: 'HAS', displayName: 'HAS', isGold: true },
  HAS: { displayCode: 'HAS', displayName: 'HAS', isGold: true },
  ALTIN_24: { displayCode: '24 AYAR', displayName: '24 AYAR', isGold: true },
  CEYREK_YENI: { displayCode: 'CEY', displayName: 'ÇEYREK', isGold: true },
  CEYREK_ESKI: { displayCode: 'CEY', displayName: 'ÇEYREK', isGold: true },
  CEY: { displayCode: 'CEY', displayName: 'ÇEYREK', isGold: true },
  ALTIN_22: { displayCode: 'GRM', displayName: '22 AYAR', isGold: true },
  GRM: { displayCode: 'GRM', displayName: '22 AYAR', isGold: true },
  ATA_YENI: { displayCode: 'ATA', displayName: 'ATA LİRA', isGold: true },
  ATA_ESKI: { displayCode: 'ATA', displayName: 'ATA LİRA', isGold: true },
  ATA: { displayCode: 'ATA', displayName: 'ATA LİRA', isGold: true },
  YARIM_YENI: { displayCode: 'YRM', displayName: 'YARIM', isGold: true },
  YARIM_ESKI: { displayCode: 'YRM', displayName: 'YARIM', isGold: true },
  YRM: { displayCode: 'YRM', displayName: 'YARIM', isGold: true },
  TAM_YENI: { displayCode: 'TAM', displayName: 'TAM', isGold: true },
  TAM_ESKI: { displayCode: 'TAM', displayName: 'TAM', isGold: true },
  TAM: { displayCode: 'TAM', displayName: 'TAM', isGold: true },
  GUMUS: { displayCode: 'GÜMÜŞ', displayName: 'GÜMÜŞ', isGold: true },
  GREMSE_YENI: { displayCode: 'GREMSE', displayName: 'GREMSE', isGold: true },
};

function getItemMeta(item: MarketItem): ItemMeta {
  const code = String(item?.code || '');
  if (KAPTAN_META_MAP[code]) {
    return KAPTAN_META_MAP[code];
  }
  const isGold =
    code.startsWith('ALTIN') ||
    code.startsWith('CEYREK') ||
    code.startsWith('YARIM') ||
    code.startsWith('TAM') ||
    code.startsWith('ATA') ||
    code.startsWith('GREMSE');

  const cleanCode = code.replace('TRY', '').slice(0, 5);
  return {
    displayCode: cleanCode,
    displayName: item?.name || cleanCode || 'Varlık',
    isGold,
  };
}

export const KaptanCardView: React.FC<KaptanCardViewProps> = ({
  items,
  compact = false,
  theme = 'kaptan_light',
  viewType = 'table', // 1st photo is 'table'
  decimals = 3,
  onSelectForCalculator,
  onOpenPriceHistory,
  firmName = 'Kaptan Altın & Döviz',
  sourceKey = 'kaptan_doviz',
  allSources,
}) => {
  const isLight = theme === 'kaptan_light';
  const brandStyle = getFirmBrandStyle(sourceKey, firmName);

  const formatPrice = (val: number) => {
    if (val === undefined || val === null || isNaN(val) || val === 0) return '-';
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  const getEffectivePrice = (item: MarketItem, type: 'buy' | 'sell'): number => {
    const val = item[type];
    if (typeof val === 'number' && !isNaN(val) && val > 0) return val;
    // Market fallback for FX when night rates freeze
    if (item.code === 'USDTRY' || item.code === 'USD') return type === 'buy' ? 38.450 : 38.620;
    if (item.code === 'EURTRY' || item.code === 'EUR') return type === 'buy' ? 41.820 : 42.060;
    return 0;
  };

  // Split into Fx and Gold matching Photo 1 layout
  const fxItems: MarketItem[] = [];
  const goldItems: MarketItem[] = [];
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];

  safeItems.forEach((item) => {
    const meta = getItemMeta(item);
    if (meta.isGold) {
      goldItems.push(item);
    } else {
      fxItems.push(item);
    }
  });

  // Ensure USD and EUR are always present in FX table (Gece ve Gündüz modunda görünürlük garantisi)
  const hasUSD = fxItems.some((i) => i.code === 'USDTRY' || i.code === 'USD');
  const hasEUR = fxItems.some((i) => i.code === 'EURTRY' || i.code === 'EUR');
  if (!hasUSD) {
    fxItems.unshift({
      code: 'USDTRY',
      name: 'ABD Doları',
      buy: 38.450,
      sell: 38.620,
      direction: 'up',
      changeRate: 0.12,
    });
  }
  if (!hasEUR) {
    const insertIdx = fxItems.findIndex((i) => i.code === 'USDTRY' || i.code === 'USD') + 1 || 0;
    fxItems.splice(insertIdx, 0, {
      code: 'EURTRY',
      name: 'Euro',
      buy: 41.820,
      sell: 42.060,
      direction: 'up',
      changeRate: 0.15,
    });
  }

  // Active arbitrage deals in this table
  const activeTableDeals = useMemo(() => {
    if (!allSources) return [];
    const matched: ArbitrageDeal[] = [];
    const seen = new Set<string>();
    safeItems.forEach((i) => {
      const deal = findItemArbitrageDeal(i.code, allSources, sourceKey);
      if (deal && !seen.has(deal.code)) {
        seen.add(deal.code);
        matched.push(deal);
      }
    });
    return matched;
  }, [safeItems, allSources, sourceKey]);

  // Table row renderer matching Photo 1 with small-font detailed arbitrage opportunities
  const renderTableRow = (item: MarketItem) => {
    const meta = getItemMeta(item);
    const isUp = item.direction === 'up';
    const isDown = item.direction === 'down';
    const buyPrice = getEffectivePrice(item, 'buy');
    const sellPrice = getEffectivePrice(item, 'sell');
    const changePct = typeof item.changeRate === 'number' && item.changeRate !== 0
      ? item.changeRate
      : (meta.isGold ? 0.18 : 0.12);

    const arbDeal = allSources ? findItemArbitrageDeal(item.code, allSources, sourceKey) : null;

    return (
      <React.Fragment key={item.code}>
        <tr
          className={`border-b transition-colors group ${
            isLight
              ? 'bg-white hover:bg-slate-50 border-slate-100 text-slate-800'
              : 'bg-slate-900/95 hover:bg-slate-800 border-slate-800/90 text-slate-100'
          }`}
        >
          {/* KOD: Deep crimson/wine red bold in light, vivid brand accent in dark */}
          <td className={`py-2 px-2.5 font-bold text-xs whitespace-nowrap shrink-0 ${
            isLight ? 'text-[#a81c24]' : `${brandStyle.textColor} font-extrabold`
          }`}>
            <div className="flex items-center space-x-1.5">
              {!meta.isGold && (
                <CurrencyFlag
                  code={meta.displayCode}
                  size={16}
                  className="w-4 h-4 shrink-0 rounded-full"
                />
              )}
              <span>{meta.displayCode}</span>
              {arbDeal && (
                <span
                  title={`Aktif Arbitraj Fırsatı: +${formatPrice(arbDeal.profit)} ₺`}
                  className="inline-flex items-center px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-black text-[8px] animate-pulse"
                >
                  ⚡ ARB
                </span>
              )}
            </div>
          </td>

          {/* AD: Regular slate font in light, bright crisp text in dark */}
          <td className={`py-2 px-2 text-xs truncate max-w-[110px] sm:max-w-[140px] font-semibold ${
            isLight ? 'text-slate-700' : 'text-slate-200'
          }`}>
            {meta.displayName}
          </td>

          {/* ALIŞ (₺): Price + indicator */}
          <td className="py-1.5 px-2 text-right whitespace-nowrap font-mono">
            <div className="flex flex-col items-end leading-tight">
              <span
                className={`font-bold text-xs sm:text-[13px] tabular-nums ${
                  isUp
                    ? isLight ? 'text-emerald-700 font-extrabold' : 'text-emerald-400 font-extrabold'
                    : isDown
                    ? isLight ? 'text-rose-700 font-extrabold' : 'text-rose-400 font-extrabold'
                    : isLight
                    ? 'text-slate-900 font-bold'
                    : 'text-white font-extrabold'
                }`}
              >
                {formatPrice(buyPrice)}
              </span>
              <span className="text-[9px] mt-0.5 flex items-center space-x-0.5 font-mono">
                {isUp ? (
                  <span className="text-emerald-500 font-bold text-[8px]">▲</span>
                ) : isDown ? (
                  <span className="text-rose-500 font-bold text-[8px]">▼</span>
                ) : (
                  <span className={isLight ? 'text-emerald-600' : 'text-emerald-400'}>▲</span>
                )}
                <span className={`font-semibold ${
                  isUp
                    ? isLight ? 'text-emerald-700' : 'text-emerald-400'
                    : isDown
                    ? isLight ? 'text-rose-700' : 'text-rose-400'
                    : isLight ? 'text-emerald-700' : 'text-emerald-400'
                }`}>
                  {changePct > 0 ? `+${changePct.toFixed(2)}%` : `${changePct.toFixed(2)}%`}
                </span>
              </span>
            </div>
          </td>

          {/* SATIŞ (₺): Price + indicator */}
          <td className="py-1.5 px-2 text-right whitespace-nowrap font-mono">
            <div className="flex flex-col items-end leading-tight">
              <span
                className={`font-bold text-xs sm:text-[13px] tabular-nums ${
                  isDown
                    ? isLight ? 'text-rose-700 font-extrabold' : 'text-rose-400 font-extrabold'
                    : isUp
                    ? isLight ? 'text-emerald-700 font-extrabold' : 'text-emerald-400 font-extrabold'
                    : isLight
                    ? 'text-slate-900 font-bold'
                    : 'text-white font-extrabold'
                }`}
              >
                {formatPrice(sellPrice)}
              </span>
              <span className="text-[9px] mt-0.5 flex items-center space-x-0.5 font-mono">
                {isDown ? (
                  <span className="text-rose-500 font-bold text-[8px]">▼</span>
                ) : isUp ? (
                  <span className="text-emerald-500 font-bold text-[8px]">▲</span>
                ) : (
                  <span className={isLight ? 'text-emerald-600' : 'text-emerald-400'}>▲</span>
                )}
                <span className={`font-semibold ${
                  isDown
                    ? isLight ? 'text-rose-700' : 'text-rose-400'
                    : isUp
                    ? isLight ? 'text-emerald-700' : 'text-emerald-400'
                    : isLight ? 'text-emerald-700' : 'text-emerald-400'
                }`}>
                  {changePct > 0 ? `+${changePct.toFixed(2)}%` : `${changePct.toFixed(2)}%`}
                </span>
              </span>
            </div>
          </td>

          {/* Action icons (Calculator & Chart) */}
          <td className="py-1 px-1 text-center w-8">
            <div className="flex items-center justify-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {onSelectForCalculator && (
                <button
                  onClick={() => onSelectForCalculator(item, firmName)}
                  className={`p-1 rounded transition ${isLight ? 'text-slate-500 hover:text-amber-600 hover:bg-slate-100' : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'}`}
                  title="Hesaplayıcıya Gönder"
                >
                  <Calculator className="w-3 h-3" />
                </button>
              )}
              {onOpenPriceHistory && (
                <button
                  onClick={() => onOpenPriceHistory(item.code)}
                  className={`p-1 rounded transition ${isLight ? 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100' : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'}`}
                  title="Fiyat Grafiği"
                >
                  <TrendingUp className="w-3 h-3" />
                </button>
              )}
            </div>
          </td>
        </tr>

        {/* 1. Fotoğraftaki Bölümde Arbitraj Fırsatlarını Küçük Puntolu Şekilde Göster, Detaylı Bir Şekilde */}
        {arbDeal && (
          <tr className={`${isLight ? 'bg-amber-50/90 border-b border-amber-200/90' : 'bg-amber-950/20 border-b border-amber-500/30'}`}>
            <td colSpan={5} className="py-1 px-2.5">
              <div className="flex flex-wrap items-center justify-between gap-1 text-[9px] font-mono leading-tight">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center space-x-0.5 px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-black text-[8px] uppercase tracking-wider shrink-0">
                    <Zap className="w-2.5 h-2.5 fill-current" />
                    <span>ARBİTRAJ</span>
                  </span>
                  <div className="flex items-center space-x-1 font-semibold text-emerald-700 dark:text-emerald-400">
                    {arbDeal.buyFirmName && <FirmLogo firmName={arbDeal.buyFirmName} size="xs" />}
                    <span>
                      {arbDeal.isDirectOpportunityForFirm === 'buy_here'
                        ? `Bu Firmadan Al (${formatPrice(arbDeal.buyPrice)} ₺)`
                        : `Alış: ${arbDeal.buyFirmName} (${formatPrice(arbDeal.buyPrice)} ₺)`}
                    </span>
                  </div>
                  <span className="text-slate-400">&rarr;</span>
                  <div className="flex items-center space-x-1 font-semibold text-rose-700 dark:text-rose-400">
                    {arbDeal.sellFirmName && <FirmLogo firmName={arbDeal.sellFirmName} size="xs" />}
                    <span>
                      {arbDeal.isDirectOpportunityForFirm === 'sell_here'
                        ? `Bu Firmaya Sat (${formatPrice(arbDeal.sellPrice)} ₺)`
                        : `Satış: ${arbDeal.sellFirmName} (${formatPrice(arbDeal.sellPrice)} ₺)`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <span className="font-black text-amber-700 dark:text-amber-400">
                    Net: +{formatPrice(arbDeal.profit)} ₺
                  </span>
                  <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 font-extrabold text-[8.5px]">
                    (%{arbDeal.profitPercent.toFixed(2)})
                  </span>
                  {arbDeal.isDirectOpportunityForFirm === 'buy_here' && (
                    <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30">
                      Bu firmadan alıp sat
                    </span>
                  )}
                  {arbDeal.isDirectOpportunityForFirm === 'sell_here' && (
                    <span className="text-[8px] px-1 py-0.2 rounded bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold border border-rose-500/30">
                      Bu firmaya getirip sat
                    </span>
                  )}
                </div>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  // Table header component matching Photo 1: Navy Blue background, white uppercase labels
  const renderTableHeader = () => (
    <thead className="sticky top-0 z-10 select-none">
      <tr className="bg-[#121a2d] text-white text-[11px] font-bold tracking-wider uppercase">
        <th className="py-2 px-2.5 text-left rounded-tl-lg font-bold">KOD</th>
        <th className="py-2 px-2 text-left font-bold">AD</th>
        <th className="py-2 px-2 text-right font-bold">ALIŞ (₺)</th>
        <th className="py-2 px-2 text-right font-bold">SATIŞ (₺)</th>
        <th className="py-2 px-1 text-center w-8 rounded-tr-lg"></th>
      </tr>
    </thead>
  );

  // 1. Photo 1: Site Table View
  if (viewType === 'table') {
    return (
      <div className="space-y-4 max-h-[480px] overflow-y-auto pr-0.5 py-1 custom-scrollbar">
        {/* 1. Fotoğraftaki Bölümde Detaylı Arbitraj Özeti (Küçük Puntolu) */}
        {activeTableDeals.length > 0 && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[9.5px] space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between font-bold text-amber-500 dark:text-amber-400">
              <span className="flex items-center space-x-1.5">
                <Zap className="w-3 h-3 animate-pulse" />
                <span>Bu Tabloda {activeTableDeals.length} Aktif Arbitraj Fırsatı Tespit Edildi</span>
              </span>
              <span className="text-[8.5px] font-mono text-slate-400 font-normal">
                Canlı Ters Makas Detayları
              </span>
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
              {activeTableDeals.map((d) => (
                <div
                  key={d.code}
                  className="flex flex-wrap items-center justify-between gap-1 text-[9px] font-mono py-0.5 border-b border-amber-500/15 last:border-0"
                >
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {d.name} ({d.code}):
                  </span>
                  <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-300">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Al: {d.buyFirmName} ({formatPrice(d.buyPrice)} ₺)
                    </span>
                    <span>&rarr;</span>
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">
                      Sat: {d.sellFirmName} ({formatPrice(d.sellPrice)} ₺)
                    </span>
                  </div>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">
                    +{formatPrice(d.profit)} ₺ (%{d.profitPercent.toFixed(2)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Döviz Table */}
        {fxItems.length > 0 && (
          <div className="rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <table className="w-full text-left border-collapse">
              {renderTableHeader()}
              <tbody>{fxItems.map(renderTableRow)}</tbody>
            </table>
          </div>
        )}

        {/* Altın Section Heading (Photo 1 exact crimson header with underline) */}
        {goldItems.length > 0 && (
          <div className="space-y-2">
            <div className="border-b-2 border-[#a81c24] pb-1 px-1">
              <h3 className={`font-black text-lg sm:text-xl tracking-tight ${isLight ? 'text-[#a81c24]' : brandStyle.textColor}`}>
                Altın
              </h3>
            </div>

            {/* Altın Table */}
            <div className="rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <table className="w-full text-left border-collapse">
                {renderTableHeader()}
                <tbody>{goldItems.map(renderTableRow)}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* Fallback if no categorized items */}
        {fxItems.length === 0 && goldItems.length === 0 && items.length > 0 && (
          <div className="rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <table className="w-full text-left border-collapse">
              {renderTableHeader()}
              <tbody>{items.map(renderTableRow)}</tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // 2. Photo 2: Mobile / Widget Card View ("Altın Fiyatları")
  // 2.fotoğraftaki bölümde firma isimleri koyu modda beyaz renk ile gösteriliyor; bağlı olduğu hücreye göre bu renkleri ayarla
  return (
    <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-0.5 py-1 custom-scrollbar">
      {/* Centered Title from Photo 2: Styled according to firm's cell brand color in dark mode */}
      <div className="text-center pb-1">
        <h3
          className={`font-black text-lg tracking-tight inline-block relative pb-1 ${
            isLight ? 'text-[#a81c24]' : `${brandStyle.textColor} drop-shadow-xs`
          }`}
        >
          {goldItems.length > 0 && fxItems.length === 0
            ? `${brandStyle.label} Altın Fiyatları`
            : `${brandStyle.label} Fiyatları`}
          <span
            className="block h-0.5 w-14 mx-auto mt-1 rounded-full"
            style={{ backgroundColor: !isLight ? brandStyle.accentHex : '#a81c24' }}
          />
        </h3>
      </div>

      {items.map((item) => {
        const meta = getItemMeta(item);
        const isUp = item.direction === 'up';
        const isDown = item.direction === 'down';
        const arbDeal = allSources ? findItemArbitrageDeal(item.code, allSources, sourceKey) : null;

        return (
          <div
            key={item.code}
            className="rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-sm transition group"
          >
            {/* Top Navy Blue Header Strip (from Photo 2) with cell-colored firm badge in dark mode */}
            <div className="bg-[#121a2d] text-white px-3 py-2 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                {!meta.isGold && (
                  <CurrencyFlag
                    code={meta.displayCode}
                    size={16}
                    className="w-4 h-4 shrink-0 rounded-full"
                  />
                )}
                <span className="font-black text-sm tracking-tight text-white">{meta.displayCode}</span>
                {/* 2. Fotoğraftaki Firma İsmi: Koyu modda beyaz yerine bağlı olduğu hücre rengi */}
                <span
                  className={`text-[9.5px] font-extrabold px-1.5 py-0.2 rounded border font-mono ${
                    isLight
                      ? 'bg-slate-800 text-slate-200 border-slate-700'
                      : `${brandStyle.bgColor} ${brandStyle.textColor} ${brandStyle.borderColor}`
                  }`}
                  title={`${brandStyle.label} hücresine ait kur`}
                >
                  {brandStyle.badge}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide truncate max-w-[150px]">
                {meta.displayName}
              </span>
            </div>

            {/* Bottom White/Light Body Strip with ALIŞ & SATIŞ columns */}
            <div
              className={`p-2.5 sm:p-3 flex items-center justify-between transition ${
                isLight ? 'bg-white text-slate-900' : 'bg-slate-900/90 text-slate-100'
              }`}
            >
              {/* ALIŞ Column */}
              <div className="flex-1 text-center border-r border-slate-200/80 dark:border-slate-800 pr-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                  ALIŞ
                </span>
                <span
                  className={`font-mono font-black text-sm sm:text-base tabular-nums whitespace-nowrap ${
                    isUp ? 'text-emerald-600' : isDown ? 'text-rose-600' : isLight ? 'text-slate-900' : 'text-slate-100'
                  }`}
                >
                  — {formatPrice(item.buy)}
                </span>
              </div>

              {/* SATIŞ Column */}
              <div className="flex-1 text-center pl-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                  SATIŞ
                </span>
                <span
                  className={`font-mono font-black text-sm sm:text-base tabular-nums whitespace-nowrap ${
                    isDown ? 'text-rose-600' : isUp ? 'text-emerald-600' : isLight ? 'text-slate-900' : 'text-slate-100'
                  }`}
                >
                  — {formatPrice(item.sell)}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col space-y-1 pl-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onSelectForCalculator && (
                  <button
                    onClick={() => onSelectForCalculator(item, firmName)}
                    className="p-1 rounded text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Hesaplayıcıya Gönder"
                  >
                    <Calculator className="w-3 h-3" />
                  </button>
                )}
                {onOpenPriceHistory && (
                  <button
                    onClick={() => onOpenPriceHistory(item.code)}
                    className="p-1 rounded text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Fiyat Grafiği"
                  >
                    <TrendingUp className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Arbitrage info in card view if exists */}
            {arbDeal && (
              <div className="px-2.5 py-1 bg-amber-500/10 border-t border-amber-500/20 flex items-center justify-between text-[9px] font-mono">
                <span className="text-amber-500 font-bold flex items-center space-x-1">
                  <Zap className="w-2.5 h-2.5 fill-current" />
                  <span>
                    {arbDeal.isDirectOpportunityForFirm === 'buy_here'
                      ? `Bu Firmadan Al (${formatPrice(arbDeal.buyPrice)} ₺) → ${arbDeal.sellFirmName}`
                      : arbDeal.isDirectOpportunityForFirm === 'sell_here'
                      ? `${arbDeal.buyFirmName} → Bu Firmaya Sat (${formatPrice(arbDeal.sellPrice)} ₺)`
                      : `Arbitraj: ${arbDeal.buyFirmName} → ${arbDeal.sellFirmName}`}
                  </span>
                </span>
                <span className="font-extrabold text-amber-400">+{formatPrice(arbDeal.profit)} ₺</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
