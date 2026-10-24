import React, { createContext, useContext, useState, useEffect } from 'react';
import { SortMode, DEFAULT_PRODUCT_ORDER } from '../types/sort';
import { MarketItem } from '../types/market';

interface SortContextType {
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
  customOrder: string[];
  setCustomOrder: (order: string[]) => void;
  moveItem: (code: string, direction: 'up' | 'down') => void;
  moveItemToTop: (code: string) => void;
  resetOrder: () => void;
  sortMarketItems: (items: MarketItem[]) => MarketItem[];
  isCustomOrderModalOpen: boolean;
  setIsCustomOrderModalOpen: (open: boolean) => void;
}

const SortContext = createContext<SortContextType | undefined>(undefined);

const STORAGE_KEY_SORT_MODE = 'samsun_sarraf_sort_mode';
const STORAGE_KEY_CUSTOM_ORDER = 'samsun_sarraf_custom_order';

export const SortProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sortMode, setSortModeState] = useState<SortMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SORT_MODE);
      if (saved) return saved as SortMode;
    } catch {}
    return 'default';
  });

  const [customOrder, setCustomOrderState] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_ORDER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with any newly added codes to ensure completeness
          const existingSet = new Set(parsed);
          const complete = [...parsed];
          DEFAULT_PRODUCT_ORDER.forEach((c) => {
            if (!existingSet.has(c)) complete.push(c);
          });
          return complete;
        }
      }
    } catch {}
    return [...DEFAULT_PRODUCT_ORDER];
  });

  const [isCustomOrderModalOpen, setIsCustomOrderModalOpen] = useState(false);

  const setSortMode = (mode: SortMode) => {
    setSortModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY_SORT_MODE, mode);
    } catch {}
  };

  const setCustomOrder = (newOrder: string[]) => {
    setCustomOrderState(newOrder);
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_ORDER, JSON.stringify(newOrder));
    } catch {}
  };

  const moveItem = (code: string, direction: 'up' | 'down') => {
    setCustomOrderState((prev) => {
      const idx = prev.indexOf(code);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;

      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;

      try {
        localStorage.setItem(STORAGE_KEY_CUSTOM_ORDER, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const moveItemToTop = (code: string) => {
    setCustomOrderState((prev) => {
      const next = [code, ...prev.filter((c) => c !== code)];
      try {
        localStorage.setItem(STORAGE_KEY_CUSTOM_ORDER, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const resetOrder = () => {
    setCustomOrderState([...DEFAULT_PRODUCT_ORDER]);
    setSortModeState('default');
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_ORDER, JSON.stringify(DEFAULT_PRODUCT_ORDER));
      localStorage.setItem(STORAGE_KEY_SORT_MODE, 'default');
    } catch {}
  };

  // High-performance sorting function
  const sortMarketItems = (items: MarketItem[]): MarketItem[] => {
    if (!items || items.length === 0) return [];
    const list = [...items];

    switch (sortMode) {
      case 'buy_desc':
        return list.sort((a, b) => (b.buy || 0) - (a.buy || 0));

      case 'buy_asc':
        return list.sort((a, b) => (a.buy || 0) - (b.buy || 0));

      case 'sell_asc':
        return list.sort((a, b) => (a.sell || 0) - (b.sell || 0));

      case 'sell_desc':
        return list.sort((a, b) => (b.sell || 0) - (a.sell || 0));

      case 'change_desc':
        return list.sort((a, b) => Math.abs(b.changeRate || 0) - Math.abs(a.changeRate || 0));

      case 'name_asc':
        return list.sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));

      case 'custom': {
        const orderMap = new Map<string, number>();
        customOrder.forEach((code, index) => {
          orderMap.set(code, index);
        });
        return list.sort((a, b) => {
          const rankA = orderMap.has(a.code) ? orderMap.get(a.code)! : 999;
          const rankB = orderMap.has(b.code) ? orderMap.get(b.code)! : 999;
          return rankA - rankB;
        });
      }

      case 'default':
      default: {
        const orderMap = new Map<string, number>();
        DEFAULT_PRODUCT_ORDER.forEach((code, index) => {
          orderMap.set(code, index);
        });
        return list.sort((a, b) => {
          const rankA = orderMap.has(a.code) ? orderMap.get(a.code)! : 999;
          const rankB = orderMap.has(b.code) ? orderMap.get(b.code)! : 999;
          return rankA - rankB;
        });
      }
    }
  };

  return (
    <SortContext.Provider
      value={{
        sortMode,
        setSortMode,
        customOrder,
        setCustomOrder,
        moveItem,
        moveItemToTop,
        resetOrder,
        sortMarketItems,
        isCustomOrderModalOpen,
        setIsCustomOrderModalOpen,
      }}
    >
      {children}
    </SortContext.Provider>
  );
};

export const useSort = () => {
  const context = useContext(SortContext);
  if (!context) {
    throw new Error('useSort must be used within a SortProvider');
  }
  return context;
};
