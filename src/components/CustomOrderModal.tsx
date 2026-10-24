import React, { useState } from 'react';
import { useSort } from '../context/SortContext';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowUpToLine,
  RotateCcw,
  Check,
  X,
  Coins,
  DollarSign,
  Star,
} from 'lucide-react';
import { DEFAULT_PRODUCT_ORDER } from '../types/sort';
import { CurrencyFlag } from './CurrencyFlag';
import { isFxItem, getCleanCurrencyCode, getStandardizedProductName } from '../utils/productUtils';

interface CustomOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ITEM_NAMES: Record<string, { name: string; type: 'gold' | 'fx' }> = {
  ALTIN_HAS: { name: 'HAS', type: 'gold' },
  ALTIN_24: { name: '24 AYAR', type: 'gold' },
  ALTIN_22: { name: '22 AYAR', type: 'gold' },
  CEYREK_YENI: { name: 'ÇEYREK', type: 'gold' },
  YARIM_YENI: { name: 'YARIM', type: 'gold' },
  TAM_YENI: { name: 'TAM', type: 'gold' },
  ATA_YENI: { name: 'ATA LİRA', type: 'gold' },
  GREMSE_YENI: { name: 'GREMSE', type: 'gold' },
  ALTIN_14: { name: '14 AYAR', type: 'gold' },
  ONS: { name: 'ONS', type: 'gold' },
  GUMUS: { name: 'GÜMÜŞ', type: 'gold' },
  USDTRY: { name: 'USD', type: 'fx' },
  EURTRY: { name: 'EUR', type: 'fx' },
  GBPTRY: { name: 'GBP', type: 'fx' },
  CHFTRY: { name: 'CHF', type: 'fx' },
  CADTRY: { name: 'CAD', type: 'fx' },
  AUDTRY: { name: 'AUD', type: 'fx' },
  SARTRY: { name: 'SAR', type: 'fx' },
  JPYTRY: { name: 'JPY', type: 'fx' },
  RUBTRY: { name: 'RUB', type: 'fx' },
  AZNTRY: { name: 'AZN', type: 'fx' },
  GELTRY: { name: 'GEL', type: 'fx' },
  EURUSD: { name: 'EUR/USD', type: 'fx' },
};

export const CustomOrderModal: React.FC<CustomOrderModalProps> = ({ isOpen, onClose }) => {
  const { customOrder, moveItem, moveItemToTop, setCustomOrder, resetOrder, setSortMode } =
    useSort();

  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: 'gold_first' | 'fx_first' | 'popular_first') => {
    let newOrder: string[] = [];
    if (preset === 'gold_first') {
      const golds = DEFAULT_PRODUCT_ORDER.filter((c) => ITEM_NAMES[c]?.type === 'gold');
      const fxs = DEFAULT_PRODUCT_ORDER.filter((c) => ITEM_NAMES[c]?.type === 'fx');
      newOrder = [...golds, ...fxs];
    } else if (preset === 'fx_first') {
      const fxs = DEFAULT_PRODUCT_ORDER.filter((c) => ITEM_NAMES[c]?.type === 'fx');
      const golds = DEFAULT_PRODUCT_ORDER.filter((c) => ITEM_NAMES[c]?.type === 'gold');
      newOrder = [...fxs, ...golds];
    } else if (preset === 'popular_first') {
      const popular = ['ALTIN_HAS', 'CEYREK_YENI', 'USDTRY', 'EURTRY', 'ALTIN_22', 'ATA_YENI'];
      const remaining = DEFAULT_PRODUCT_ORDER.filter((c) => !popular.includes(c));
      newOrder = [...popular, ...remaining];
    }

    setCustomOrder(newOrder);
    setSortMode('custom');
    showSaveNotification();
  };

  const showSaveNotification = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <ArrowUpDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Fiyat Sıralamasını Düzenle</h3>
              <p className="text-xs text-slate-400">
                Kurları dilediğiniz sıraya taşıyın, otomatik hafızaya kaydedilir
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1">Hızlı Düzen:</span>
          <button
            onClick={() => handleApplyPreset('popular_first')}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 transition text-[11px]"
          >
            <Star className="w-3 h-3 text-amber-400" />
            <span>En Popülerler İlk</span>
          </button>
          <button
            onClick={() => handleApplyPreset('gold_first')}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 transition text-[11px]"
          >
            <Coins className="w-3 h-3 text-amber-400" />
            <span>Önce Altınlar</span>
          </button>
          <button
            onClick={() => handleApplyPreset('fx_first')}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 transition text-[11px]"
          >
            <DollarSign className="w-3 h-3 text-emerald-400" />
            <span>Önce Dövizler</span>
          </button>
        </div>

        {/* Reorder List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {customOrder.map((code, index) => {
            const meta = ITEM_NAMES[code] || { name: code, type: 'gold' };
            const isFirst = index === 0;
            const isLast = index === customOrder.length - 1;

            return (
              <div
                key={code}
                className="flex items-center justify-between p-2.5 bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 rounded-xl transition group"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center font-mono text-xs font-semibold shrink-0">
                    {index + 1}
                  </div>
                  {isFxItem(code) && (
                    <CurrencyFlag
                      code={getCleanCurrencyCode(code)}
                      size={18}
                      className="w-[18px] h-[18px] rounded-full shrink-0"
                    />
                  )}
                  <span className="text-xs font-semibold text-white group-hover:text-amber-300 transition truncate">
                    {getStandardizedProductName(code, meta.name)}
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  {!isFirst && (
                    <button
                      onClick={() => {
                        moveItemToTop(code);
                        setSortMode('custom');
                        showSaveNotification();
                      }}
                      title="En Başa Taşı"
                      className="p-1 rounded text-slate-500 hover:text-amber-400 hover:bg-slate-800 transition"
                    >
                      <ArrowUpToLine className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      moveItem(code, 'up');
                      setSortMode('custom');
                      showSaveNotification();
                    }}
                    disabled={isFirst}
                    title="Yukarı Taşı"
                    className={`p-1 rounded transition ${
                      isFirst
                        ? 'text-slate-700 cursor-not-allowed'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      moveItem(code, 'down');
                      setSortMode('custom');
                      showSaveNotification();
                    }}
                    disabled={isLast}
                    title="Aşağı Taşı"
                    className={`p-1 rounded transition ${
                      isLast
                        ? 'text-slate-700 cursor-not-allowed'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                resetOrder();
                showSaveNotification();
              }}
              className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Sıfırla</span>
            </button>
            {savedNotice && (
              <span className="text-[11px] text-emerald-400 flex items-center space-x-1 animate-in fade-in">
                <Check className="w-3 h-3" />
                <span>Hafızaya kaydedildi</span>
              </span>
            )}
          </div>

          <button
            onClick={() => {
              setSortMode('custom');
              onClose();
            }}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-md shadow-amber-500/20"
          >
            Kaydet & Uygula
          </button>
        </div>

      </div>
    </div>
  );
};
