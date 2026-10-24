import React, { useState, useEffect } from 'react';
import { SourcesMap, PortfolioAsset } from '../types/market';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import {
  Briefcase,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Coins,
  ShieldAlert,
} from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';
import { CurrencyFlag } from './CurrencyFlag';
import { isFxItem, getCleanCurrencyCode, getStandardizedProductName } from '../utils/productUtils';

interface PortfolioTrackerProps {
  sources: SourcesMap;
  user: User | null;
  onLogin: () => void;
}

const ASSET_TYPES = [
  { code: 'ALTIN_HAS', label: 'HAS', unit: 'Gram' },
  { code: 'ALTIN_24', label: '24 AYAR', unit: 'Gram' },
  { code: 'ALTIN_22', label: '22 AYAR', unit: 'Gram' },
  { code: 'CEYREK_YENI', label: 'ÇEYREK', unit: 'Adet' },
  { code: 'YARIM_YENI', label: 'YARIM', unit: 'Adet' },
  { code: 'TAM_YENI', label: 'TAM', unit: 'Adet' },
  { code: 'ATA_YENI', label: 'ATA LİRA', unit: 'Adet' },
  { code: 'GUMUS', label: 'GÜMÜŞ', unit: 'Gram' },
  { code: 'USDTRY', label: 'USD', unit: 'USD' },
  { code: 'EURTRY', label: 'EUR', unit: 'EUR' },
];

export const PortfolioTracker: React.FC<PortfolioTrackerProps> = ({
  sources,
  user,
  onLogin,
}) => {
  const [items, setItems] = useState<PortfolioAsset[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PortfolioAsset | null>(null);

  // Form state
  const [assetType, setAssetType] = useState('ALTIN_HAS');
  const [quantity, setQuantity] = useState<number>(10);
  const [purchasePrice, setPurchasePrice] = useState<number>(3000);
  const [title, setTitle] = useState('');

  // Firestore sync listener
  useEffect(() => {
    if (!user) {
      // Default sample items for guest
      setItems([
        {
          id: 'demo-1',
          userId: 'guest',
          assetType: 'ALTIN_HAS',
          title: 'Ziraat Kasa Gram Altın',
          quantity: 25,
          purchasePrice: 2950,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'demo-2',
          userId: 'guest',
          assetType: 'CEYREK_YENI',
          title: 'Yatırımlık Çeyrek',
          quantity: 4,
          purchasePrice: 4800,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'demo-3',
          userId: 'guest',
          assetType: 'USDTRY',
          title: 'Nakit Döviz Rezervi',
          quantity: 1500,
          purchasePrice: 34.2,
          createdAt: new Date().toISOString(),
        },
      ]);
      return;
    }

    const path = `users/${user.uid}/portfolio`;
    const unsubscribe = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list: PortfolioAsset[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        setItems(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Helper to find best live buy price (cash-out value)
  const getLiveBuyPrice = (code: string) => {
    let best = 0;
    Object.values(sources).forEach((s) => {
      const match = s.data?.find((d) => d.code === code);
      if (match && match.buy > best) {
        best = match.buy;
      }
    });
    return best;
  };

  // Add Item to Firestore
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || quantity <= 0) return;

    const selectedDef = ASSET_TYPES.find((a) => a.code === assetType);
    const itemTitle = title || selectedDef?.label || assetType;

    const newItem: Omit<PortfolioAsset, 'id'> = {
      userId: user ? user.uid : 'guest',
      assetType,
      title: itemTitle,
      quantity,
      purchasePrice: purchasePrice || 0,
      createdAt: new Date().toISOString(),
    };

    if (user) {
      const newId = `asset_${Date.now()}`;
      const path = `users/${user.uid}/portfolio`;
      try {
        await setDoc(doc(db, path, newId), newItem);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `${path}/${newId}`);
      }
    } else {
      setItems((prev) => [...prev, { id: `local_${Date.now()}`, ...newItem }]);
    }

    setShowAddModal(false);
    setTitle('');
  };

  // Delete Item
  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    if (user) {
      const path = `users/${user.uid}/portfolio/${itemToDelete.id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'portfolio', itemToDelete.id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    } else {
      setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
    }

    setItemToDelete(null);
  };

  // Calculations
  let totalCost = 0;
  let totalCurrentValue = 0;

  items.forEach((item) => {
    const livePrice = getLiveBuyPrice(item.assetType);
    totalCost += item.quantity * item.purchasePrice;
    totalCurrentValue += item.quantity * livePrice;
  });

  const totalProfitLoss = totalCurrentValue - totalCost;
  const profitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      
      {/* Auth Banner if Guest */}
      {!user && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-200">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-amber-400 block">Misafir Modundasınız</span>
              Portföyünüzün Firebase veritabanında kalıcı saklanması için Google hesabınızla giriş yapın.
            </div>
          </div>
          <button
            onClick={onLogin}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shrink-0"
          >
            Google ile Giriş Yap & Kaydet
          </button>
        </div>
      )}

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Güncel Değer */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <span className="text-xs text-slate-400 font-medium">Toplam Güncel Değer</span>
          <div className="text-2xl font-black font-mono text-white mt-1">
            {formatMoney(totalCurrentValue)} <span className="text-sm font-normal text-slate-400">TRY</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            6 firma içindeki en yüksek alış fiyatına göre
          </span>
        </div>

        {/* Toplam Maliyet */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <span className="text-xs text-slate-400 font-medium">Toplam Alış Maliyeti</span>
          <div className="text-2xl font-black font-mono text-slate-300 mt-1">
            {formatMoney(totalCost)} <span className="text-sm font-normal text-slate-400">TRY</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            Girdiğiniz alış fiyatları toplamı
          </span>
        </div>

        {/* Net Kâr / Zarar */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <span className="text-xs text-slate-400 font-medium">Net Kâr / Zarar Durumu</span>
          <div
            className={`text-2xl font-black font-mono mt-1 flex items-center space-x-2 ${
              totalProfitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {totalProfitLoss >= 0 ? (
              <TrendingUp className="w-6 h-6 inline" />
            ) : (
              <TrendingDown className="w-6 h-6 inline" />
            )}
            <span>{formatMoney(totalProfitLoss)} TRY</span>
          </div>
          <span
            className={`text-xs font-bold font-mono ${
              totalProfitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {totalProfitLoss >= 0 ? `+${profitLossPercent.toFixed(2)}%` : `${profitLossPercent.toFixed(2)}%`}
          </span>
        </div>

      </div>

      {/* Holdings List Header & Add Button */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/30">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Varlıklarım & Fiziki Altınlarım</h3>
              <p className="text-xs text-slate-400">Kaydettiğiniz tüm altın ve döviz yatırımları</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Varlık Ekle</span>
          </button>
        </div>

        {/* Table of Assets */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[11px] text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Varlık / Tanım</th>
                <th className="py-3 px-3 text-right">Miktar</th>
                <th className="py-3 px-3 text-right">Alış Fiyatı</th>
                <th className="py-3 px-3 text-right text-amber-400">Güncel Birim Fiyat</th>
                <th className="py-3 px-3 text-right">Güncel Toplam</th>
                <th className="py-3 px-3 text-right">Kâr / Zarar</th>
                <th className="py-3 px-3 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {items.map((item) => {
                const livePrice = getLiveBuyPrice(item.assetType);
                const cost = item.quantity * item.purchasePrice;
                const value = item.quantity * livePrice;
                const pl = value - cost;
                const plPct = cost > 0 ? (pl / cost) * 100 : 0;
                const def = ASSET_TYPES.find((a) => a.code === item.assetType);

                return (
                  <tr key={item.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2">
                        {isFxItem(item.assetType) && (
                          <CurrencyFlag
                            code={getCleanCurrencyCode(item.assetType)}
                            size={18}
                            className="w-[18px] h-[18px] rounded-full shrink-0"
                          />
                        )}
                        <span className="font-semibold text-white text-sm">
                          {getStandardizedProductName(item.assetType, item.title || def?.label)}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                      {item.quantity} <span className="text-[10px] text-slate-500">{def?.unit}</span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-400">
                      {formatMoney(item.purchasePrice)} ₺
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-amber-400 font-semibold">
                      {formatMoney(livePrice)} ₺
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      {formatMoney(value)} ₺
                    </td>

                    <td
                      className={`py-3 px-3 text-right font-mono font-semibold ${
                        pl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      <div>{formatMoney(pl)} ₺</div>
                      <div className="text-[10px]">
                        {pl >= 0 ? `+${plPct.toFixed(2)}%` : `${plPct.toFixed(2)}%`}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setItemToDelete(item)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Yeni Varlık / Altın Ekle</h3>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Varlık Türü
                </label>
                <select
                  value={assetType}
                  onChange={(e) => {
                    setAssetType(e.target.value);
                    const live = getLiveBuyPrice(e.target.value);
                    setPurchasePrice(live || 3000);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {ASSET_TYPES.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Özel İsim / Not (Opsiyonel)
                </label>
                <input
                  type="text"
                  placeholder="Örn: 22 Ayar Burma Bilezik"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Miktar (Adet / Gram)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={quantity || ''}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Alış Fiyatı (TRY)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={purchasePrice || ''}
                    onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700 transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-amber-400 transition"
                >
                  Portföye Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(itemToDelete)}
        title="Varlığı Sil"
        message={`"${itemToDelete?.title}" portföyünüzden silinecektir. Bu işlemi onaylıyor musunuz?`}
        confirmLabel="Evet, Sil"
        cancelLabel="Vazgeç"
        isDestructive={true}
        onConfirm={handleDeleteItem}
        onCancel={() => setItemToDelete(null)}
      />

    </div>
  );
};
