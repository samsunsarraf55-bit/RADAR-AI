export interface MarketItem {
  code: string;
  name: string;
  buy: number;
  sell: number;
  previousBuy?: number;
  previousSell?: number;
  direction?: 'up' | 'down' | 'neutral';
  changeRate?: number;
  updatedAt?: string;
}

export interface SourceData {
  sourceName: string;
  category?: 'doviz' | 'kuyumcu' | 'karma';
  status: 'connected' | 'active' | 'initializing' | 'disconnected' | 'error';
  updatedAt: string | null;
  location?: string;
  phone?: string;
  data: MarketItem[];
}

export type SourcesMap = Record<string, SourceData>;

export interface ArbitrageOpportunity {
  code: string;
  name: string;
  bestBuySource: { sourceKey: string; sourceName: string; price: number };
  bestSellSource: { sourceKey: string; sourceName: string; price: number };
  spread: number;
  spreadPercent: number;
  arbitrageProfit: number; // buy at bestSell, sell at bestBuy
  hasArbitrage: boolean;
}

export interface ArbitrageHistoryRecord {
  id: string;
  timestamp: string;
  ts: number;
  dateLabel: string;
  timeLabel: string;
  code: string;
  name: string;
  category: 'gold' | 'fx';
  buyFirmKey: string;
  buyFirmName: string;
  buyPrice: number;
  sellFirmKey: string;
  sellFirmName: string;
  sellPrice: number;
  profit: number;
  profitPercent: number;
  durationSeconds?: number;
  lastSeen?: string;
  status: 'active' | 'closed';
}

export interface PortfolioAsset {
  id: string;
  userId: string;
  assetType: string;
  title: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PriceAlert {
  id: string;
  userId: string;
  assetCode: string;
  condition: 'above' | 'below';
  targetPrice: number;
  source?: string;
  active: boolean;
  createdAt: string;
}

export interface DriveReportFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  webViewLink?: string;
  size?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}
