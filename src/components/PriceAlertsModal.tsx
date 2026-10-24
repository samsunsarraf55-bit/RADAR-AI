import React, { useState, useEffect } from 'react';
import { PriceAlert, SourcesMap } from '../types/market';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Bell, X, Trash2, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { CurrencyFlag } from './CurrencyFlag';
import { isFxItem, getCleanCurrencyCode, getStandardizedProductName } from '../utils/productUtils';

interface PriceAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: SourcesMap;
  user: User | null;
  onLogin: () => void;
}

const ALERTABLE_ASSETS = [
  { code: 'ALTIN_HAS', name: 'HAS' },
  { code: 'ALTIN_24', name: '24 AYAR' },
  { code: 'ALTIN_22', name: '22 AYAR' },
  { code: 'CEYREK_YENI', name: 'ÇEYREK' },
  { code: 'YARIM_YENI', name: 'YARIM' },
  { code: 'TAM_YENI', name: 'TAM' },
  { code: 'ATA_YENI', name: 'ATA LİRA' },
  { code: 'GUMUS', name: 'GÜMÜŞ' },
  { code: 'USDTRY', name: 'USD' },
  { code: 'EURTRY', name: 'EUR' },
  { code: 'GBPTRY', name: 'GBP' },
];

export const PriceAlertsModal: React.FC<PriceAlertsModalProps> = ({
  isOpen,
  onClose,
  sources,
  user,
  onLogin,
}) => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [assetCode, setAssetCode] = useState('ALTIN_HAS');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [targetPrice, setTargetPrice] = useState<number>(3150);

  useEffect(() => {
    if (!user) {
      // Local alerts for guest
      setAlerts([
        {
          id: 'local-1',
          userId: 'guest',
          assetCode: 'ALTIN_HAS',
          condition: 'above',
          targetPrice: 3200,
          active: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      return;
    }

    const path = `users/${user.uid}/alerts`;
    const unsubscribe = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list: PriceAlert[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        setAlerts(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, path);
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (!isOpen) return null;

  const handleAddAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrice || targetPrice <= 0) return;

    const newAlert: Omit<PriceAlert, 'id'> = {
      userId: user ? user.uid : 'guest',
      assetCode,
      condition,
      targetPrice,
      active: true,
      createdAt: new Date().toISOString(),
    };

    if (user) {
      const id = `alert_${Date.now()}`;
      const path = `users/${user.uid}/alerts/${id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'alerts', id), newAlert);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    } else {
      setAlerts((prev) => [...prev, { id: `local_${Date.now()}`, ...newAlert }]);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (user) {
      const path = `users/${user.uid}/alerts/${alertId}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'alerts', alertId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    } else {
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    }
  };

  const getLivePrice = (code: string) => {
    let best = 0;
    Object.values(sources).forEach((s) => {
      const match = s.data?.find((d) => d.code === code);
      if (match && match.buy > best) best = match.buy;
    });
    return best;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl space-y-5">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Fiyat Alarmları</h3>
              <p className="text-xs text-slate-400">Hedef fiyata ulaşıldığında anlık bildirim alın</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!user && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-slate-300 flex items-center justify-between gap-2">
            <span>Alarmların kalıcı saklanması için giriş yapabilirsiniz.</span>
            <button
              onClick={onLogin}
              className="text-amber-400 font-bold hover:underline shrink-0"
            >
              Giriş Yap
            </button>
          </div>
        )}

        {/* Add Form */}
        <form onSubmit={handleAddAlert} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="text-xs font-bold text-slate-300">Yeni Alarm Kur</div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Varlık</label>
              <select
                value={assetCode}
                onChange={(e) => {
                  setAssetCode(e.target.value);
                  const p = getLivePrice(e.target.value);
                  if (p) setTargetPrice(Number((p * 1.02).toFixed(2)));
                }}
                className="w-full bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-white"
              >
                {ALERTABLE_ASSETS.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Koşul</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-white"
              >
                <option value="above">Fiyat Üzerine Çıkarsa (≥)</option>
                <option value="below">Fiyat Altına İnerse (≤)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Hedef Fiyat (₺)</label>
              <input
                type="number"
                step="0.01"
                value={targetPrice || ''}
                onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-white font-mono"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center justify-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Alarmı Kur</span>
          </button>
        </form>

        {/* Existing Alerts List */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-400">Aktif Alarmlar ({alerts.length})</div>

          {alerts.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">
              Henüz kurulmuş bir alarm bulunmuyor.
            </div>
          ) : (
            alerts.map((al) => {
              const live = getLivePrice(al.assetCode);
              const isTriggered =
                al.condition === 'above' ? live >= al.targetPrice : live <= al.targetPrice;
              const def = ALERTABLE_ASSETS.find((a) => a.code === al.assetCode);

              return (
                <div
                  key={al.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition ${
                    isTriggered
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-xs text-white flex items-center space-x-1.5">
                      {isFxItem(al.assetCode) && (
                        <CurrencyFlag
                          code={getCleanCurrencyCode(al.assetCode)}
                          size={15}
                          className="w-[15px] h-[15px] rounded-full shrink-0"
                        />
                      )}
                      <span>{getStandardizedProductName(al.assetCode, def?.name || al.assetCode)}</span>
                      {isTriggered && (
                        <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full uppercase">
                          Hedefte!
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Koşul: {al.condition === 'above' ? '≥' : '≤'} {al.targetPrice} ₺ | Güncel:{' '}
                      <span className="text-emerald-400 font-bold">{live.toFixed(2)} ₺</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteAlert(al.id)}
                    className="text-slate-500 hover:text-rose-400 p-1.5 transition"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
