import React, { useState } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowUpToLine,
  RotateCcw,
  Check,
  X,
  Building2,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  SlidersHorizontal,
  Coins,
  DollarSign,
} from 'lucide-react';
import { SourcesMap } from '../types/market';
import { DEFAULT_FIRM_ORDER } from '../types/sort';
import { FirmLogo } from './FirmLogo';

interface FirmOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: SourcesMap;
  firmOrder: string[];
  setFirmOrder: (order: string[]) => void;
  onResetOrder: () => void;
  hiddenFirmKeys: string[];
  onToggleHideFirm: (key: string) => void;
  onShowAllFirms: () => void;
}

export const FirmOrderModal: React.FC<FirmOrderModalProps> = ({
  isOpen,
  onClose,
  sources,
  firmOrder,
  setFirmOrder,
  onResetOrder,
  hiddenFirmKeys,
  onToggleHideFirm,
  onShowAllFirms,
}) => {
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const showSaveNotification = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleMove = (key: string, direction: 'up' | 'down') => {
    const idx = firmOrder.indexOf(key);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= firmOrder.length) return;

    const next = [...firmOrder];
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;

    setFirmOrder(next);
    showSaveNotification();
  };

  const handleMoveToTop = (key: string) => {
    const next = [key, ...firmOrder.filter((k) => k !== key)];
    setFirmOrder(next);
    showSaveNotification();
  };

  const handleApplyPreset = (preset: 'all' | 'verified_only' | 'kuyumcu_only' | 'doviz_only' | 'az') => {
    if (preset === 'all') {
      onShowAllFirms();
      showSaveNotification();
      return;
    }

    if (preset === 'verified_only') {
      const verified = ['gunes_kuyumculuk', 'kaptan_doviz', 'solis_doviz', 'sar_doviz', 'altinkose', 'ilkay_doviz', 'vizyon_altin'];
      firmOrder.forEach((k) => {
        const isVer = verified.includes(k);
        const isHidden = hiddenFirmKeys.includes(k);
        if (!isVer && !isHidden) {
          onToggleHideFirm(k);
        } else if (isVer && isHidden) {
          onToggleHideFirm(k);
        }
      });
      showSaveNotification();
      return;
    }

    if (preset === 'kuyumcu_only') {
      firmOrder.forEach((k) => {
        const isKuyumcu = sources[k]?.category === 'kuyumcu';
        const isHidden = hiddenFirmKeys.includes(k);
        if (!isKuyumcu && !isHidden) {
          onToggleHideFirm(k);
        } else if (isKuyumcu && isHidden) {
          onToggleHideFirm(k);
        }
      });
      showSaveNotification();
      return;
    }

    if (preset === 'doviz_only') {
      firmOrder.forEach((k) => {
        const isDoviz = sources[k]?.category === 'doviz';
        const isHidden = hiddenFirmKeys.includes(k);
        if (!isDoviz && !isHidden) {
          onToggleHideFirm(k);
        } else if (isDoviz && isHidden) {
          onToggleHideFirm(k);
        }
      });
      showSaveNotification();
      return;
    }

    if (preset === 'az') {
      const sorted = [...firmOrder].sort((a, b) => {
        const nameA = sources[a]?.sourceName || a;
        const nameB = sources[b]?.sourceName || b;
        return nameA.localeCompare(nameB, 'tr-TR');
      });
      setFirmOrder(sorted);
      showSaveNotification();
    }
  };

  const totalCount = firmOrder.length;
  const hiddenCount = hiddenFirmKeys.length;
  const visibleCount = totalCount - hiddenCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <span>Firmaları Yönet</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                  {visibleCount}/{totalCount} Aktif
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Ana sayfada görünmesini istediğiniz firmaları ekleyin, kaldırın veya sıralayın
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

        {/* Status & Quick Action Toolbar */}
        <div className="p-3 bg-slate-950/70 border-b border-slate-800 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Hızlı Seçim:</span>
            </span>

            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => handleApplyPreset('all')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition flex items-center space-x-1"
                title="Tüm firmaları ekle ve göster"
              >
                <Eye className="w-3 h-3 text-emerald-400" />
                <span>Tümünü Göster</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('kuyumcu_only')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-medium transition flex items-center space-x-1"
                title="Yalnızca altın ve kuyumcuları ekle"
              >
                <Coins className="w-3 h-3" />
                <span>Yalnız Kuyumcular</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('doviz_only')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-medium transition flex items-center space-x-1"
                title="Yalnızca döviz bürolarını ekle"
              >
                <DollarSign className="w-3 h-3" />
                <span>Yalnız Döviz</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('verified_only')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-medium transition flex items-center space-x-1"
                title="Yalnızca öncelikli firmaları göster"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Öncelikliler</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('az')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition"
              >
                A-Z Sırala
              </button>
            </div>
          </div>

          {hiddenCount > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs text-amber-300">
              <span className="flex items-center space-x-1.5">
                <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                <span><strong>{hiddenCount} firma</strong> şu anda ana sayfadan gizlendi/kaldırıldı.</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  onShowAllFirms();
                  showSaveNotification();
                }}
                className="text-amber-400 hover:text-amber-200 underline font-semibold ml-2"
              >
                Hepsini Geri Getir
              </button>
            </div>
          )}
        </div>

        {/* Firm List with Visibility Toggle & Move Controls */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {firmOrder.map((key, index) => {
            const firm = sources[key];
            const name = firm?.sourceName || key;
            const isHidden = hiddenFirmKeys.includes(key);
            const isVerified =
              key === 'gunes_kuyumculuk' ||
              key === 'kaptan_doviz' ||
              key === 'solis_doviz' ||
              key === 'sar_doviz' ||
              key === 'altinkose' ||
              key === 'ilkay_doviz' ||
              key === 'vizyon_altin';

            return (
              <div
                key={key}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isHidden
                    ? 'bg-slate-950/40 border-slate-900 opacity-60'
                    : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Left: Checkbox / Eye toggle & Info */}
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  {/* Toggle Visibility Button */}
                  <button
                    type="button"
                    onClick={() => {
                      onToggleHideFirm(key);
                      showSaveNotification();
                    }}
                    className={`p-2 rounded-xl border transition shrink-0 ${
                      isHidden
                        ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/40'
                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-rose-500/15 hover:border-rose-500/30 hover:text-rose-400'
                    }`}
                    title={isHidden ? 'Ana Sayfaya Ekle / Göster' : 'Ana Sayfadan Kaldır / Gizle'}
                  >
                    {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <FirmLogo firmKey={key} firmName={name} size="sm" />
                      <span
                        className={`font-bold text-sm truncate ${
                          isHidden ? 'text-slate-400 line-through decoration-slate-600' : 'text-white'
                        }`}
                      >
                        {name}
                      </span>
                      {isHidden ? (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium shrink-0">
                          Gizlendi
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-medium shrink-0">
                          Aktif
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {firm?.category === 'doviz'
                        ? 'Döviz Bürosu'
                        : firm?.category === 'kuyumcu'
                        ? 'Kuyumculuk & Sarrafiye'
                        : 'Serbest Piyasa'}
                      {firm?.data && ` · ${firm.data.length} kur aktif`}
                    </div>
                  </div>
                </div>

                {/* Right: Quick Action & Move Controls */}
                <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                  {/* Direct Add/Remove Pill */}
                  <button
                    type="button"
                    onClick={() => {
                      onToggleHideFirm(key);
                      showSaveNotification();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
                      isHidden
                        ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800'
                    }`}
                  >
                    {isHidden ? (
                      <>
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                        <span>Ekle</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" />
                        <span>Kaldır</span>
                      </>
                    )}
                  </button>

                  {/* Ordering Buttons */}
                  <div className="flex items-center space-x-0.5 pl-1 border-l border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleMoveToTop(key)}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-20 text-slate-300 hover:text-amber-400 transition"
                      title="En Başa Taşı (1. Sıra)"
                    >
                      <ArrowUpToLine className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMove(key, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-20 text-slate-300 hover:text-amber-400 transition"
                      title="Yukarı Taşı"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMove(key, 'down')}
                      disabled={index === firmOrder.length - 1}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-20 text-slate-300 hover:text-amber-400 transition"
                      title="Aşağı Taşı"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                onResetOrder();
                onShowAllFirms();
                showSaveNotification();
              }}
              className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition"
              title="Varsayılan firma listesine ve sıralamasına dön"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Varsayılana Sıfırla</span>
            </button>
            {savedNotice && (
              <span className="text-xs text-emerald-400 flex items-center space-x-1 font-semibold animate-in fade-in">
                <Check className="w-3 h-3 stroke-[2.5]" />
                <span>Kaydedildi</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs transition shadow-md shadow-amber-500/20"
          >
            Tamam
          </button>
        </div>

      </div>
    </div>
  );
};
