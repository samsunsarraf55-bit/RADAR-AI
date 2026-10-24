export type SortMode =
  | 'default'
  | 'custom'
  | 'buy_desc'
  | 'buy_asc'
  | 'sell_asc'
  | 'sell_desc'
  | 'change_desc'
  | 'name_asc';

export interface SortOption {
  id: SortMode;
  label: string;
  shortLabel: string;
  icon?: string;
}

export const SORT_OPTIONS: SortOption[] = [
  { id: 'default', label: 'Varsayılan Sarraf Sıralaması', shortLabel: 'Sarraf Sırası' },
  { id: 'custom', label: 'Özel Kendi Sıralamam', shortLabel: 'Özel Sıram' },
  { id: 'buy_desc', label: 'Alış Fiyatına Göre (En Yüksek İlk)', shortLabel: 'Alış (Yüksek)' },
  { id: 'buy_asc', label: 'Alış Fiyatına Göre (En Düşük İlk)', shortLabel: 'Alış (Düşük)' },
  { id: 'sell_asc', label: 'Satış Fiyatına Göre (En Uygun İlk)', shortLabel: 'Satış (En Uygun)' },
  { id: 'sell_desc', label: 'Satış Fiyatına Göre (En Yüksek İlk)', shortLabel: 'Satış (Yüksek)' },
  { id: 'change_desc', label: 'Günün En Çok Değişenleri (%)', shortLabel: 'Değişim (%)' },
  { id: 'name_asc', label: 'İsme Göre (A - Z)', shortLabel: 'Alfabetik' },
];

export const DEFAULT_PRODUCT_ORDER: string[] = [
  'ALTIN_HAS',
  'ALTIN_22',
  'CEYREK_YENI',
  'YARIM_YENI',
  'TAM_YENI',
  'ATA_YENI',
  'GREMSE_YENI',
  'ALTIN_14',
  'GUMUS',
  'USDTRY',
  'EURTRY',
  'GBPTRY',
  'CHFTRY',
  'CADTRY',
  'AUDTRY',
  'SARTRY',
  'JPYTRY',
  'RUBTRY',
  'AZNTRY',
  'GELTRY',
  'EURUSD',
];

export type FirmSortMode =
  | 'default'
  | 'custom'
  | 'verified_first'
  | 'gold_buy_desc'
  | 'gold_sell_asc'
  | 'usd_buy_desc'
  | 'usd_sell_asc'
  | 'name_asc'
  | 'name_desc';

export interface FirmSortOption {
  id: FirmSortMode;
  label: string;
  shortLabel: string;
}

export const FIRM_SORT_OPTIONS: FirmSortOption[] = [
  { id: 'default', label: 'Varsayılan Sıralama', shortLabel: 'Varsayılan' },
  { id: 'custom', label: 'Özel Firma Sıralamam', shortLabel: 'Özel Sıra' },
  { id: 'verified_first', label: 'Öncelikli Firmalar En Başta', shortLabel: 'Öncelikli' },
  { id: 'gold_buy_desc', label: 'Has Altın Alış (En Yüksek Veren İlk)', shortLabel: 'Has Alış (En Çok)' },
  { id: 'gold_sell_asc', label: 'Has Altın Satış (En Uygun Satan İlk)', shortLabel: 'Has Satış (En Ucuz)' },
  { id: 'usd_buy_desc', label: 'Dolar Alış (En Yüksek İlk)', shortLabel: 'Dolar Alış (Yüksek)' },
  { id: 'usd_sell_asc', label: 'Dolar Satış (En Uygun İlk)', shortLabel: 'Dolar Satış (Ucuz)' },
  { id: 'name_asc', label: 'Firma Adı (A - Z)', shortLabel: 'Firma A - Z' },
  { id: 'name_desc', label: 'Firma Adı (Z - A)', shortLabel: 'Firma Z - A' },
];

export const DEFAULT_FIRM_ORDER: string[] = [
  'gunes_kuyumculuk',
  'kaptan_doviz',
  'solis_doviz',
  'sar_doviz',
  'altinkose',
  'ilkay_doviz',
  'vizyon_altin',
];

