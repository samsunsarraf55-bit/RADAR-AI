import { SourcesMap } from '../types/market';

export interface ArbitrageDeal {
  code: string;
  name: string;
  buyFirmKey: string;
  buyFirmName: string;
  buyPrice: number; // The lowest sell price in market (buy here)
  sellFirmKey: string;
  sellFirmName: string;
  sellPrice: number; // The highest buy price in market (sell here)
  profit: number; // sellPrice - buyPrice
  profitPercent: number; // (profit / buyPrice) * 100
  isDirectOpportunityForFirm?: 'buy_here' | 'sell_here';
}

// Find all arbitrage deals across available market sources
export function findArbitrageDeals(sources: SourcesMap): ArbitrageDeal[] {
  const deals: ArbitrageDeal[] = [];
  if (!sources || typeof sources !== 'object') return deals;

  const productCodes = new Set<string>();
  Object.values(sources).forEach((source) => {
    source?.data?.forEach((item) => {
      if (item?.code && item.code !== 'ONS') {
        productCodes.add(item.code);
      }
    });
  });

  productCodes.forEach((code) => {
    let maxBuyPrice = 0;
    let maxBuyFirmKey = '';
    let maxBuyFirmName = '';

    let minSellPrice = Infinity;
    let minSellFirmKey = '';
    let minSellFirmName = '';

    let productName = '';

    Object.entries(sources).forEach(([firmKey, source]) => {
      const item = source?.data?.find((d) => d && d.code === code);
      if (!item) return;

      if (!productName && item.name) {
        productName = item.name;
      }

      // Check buy price (firm's buy = where we can sell our asset)
      if (typeof item.buy === 'number' && item.buy > maxBuyPrice) {
        maxBuyPrice = item.buy;
        maxBuyFirmKey = firmKey;
        maxBuyFirmName = source.sourceName || firmKey;
      }

      // Check sell price (firm's sell = where we can purchase asset)
      if (typeof item.sell === 'number' && item.sell > 0 && item.sell < minSellPrice) {
        minSellPrice = item.sell;
        minSellFirmKey = firmKey;
        minSellFirmName = source.sourceName || firmKey;
      }
    });

    // Real arbitrage exists if highest buy is strictly greater than lowest sell across different firms
    if (
      maxBuyPrice > 0 &&
      minSellPrice < Infinity &&
      maxBuyPrice > minSellPrice &&
      maxBuyFirmKey !== minSellFirmKey
    ) {
      const profit = maxBuyPrice - minSellPrice;
      const profitPercent = (profit / minSellPrice) * 100;

      deals.push({
        code,
        name: productName || code,
        buyFirmKey: minSellFirmKey,
        buyFirmName: minSellFirmName,
        buyPrice: minSellPrice,
        sellFirmKey: maxBuyFirmKey,
        sellFirmName: maxBuyFirmName,
        sellPrice: maxBuyPrice,
        profit,
        profitPercent,
      });
    }
  });

  // Sort descending by highest profit
  return deals.sort((a, b) => b.profit - a.profit);
}

// Find arbitrage deal specifically for a single product code and optional firm perspective
export function findItemArbitrageDeal(
  code: string,
  sources: SourcesMap,
  currentFirmKey?: string
): ArbitrageDeal | null {
  if (!sources || !code) return null;

  let maxBuyPrice = 0;
  let maxBuyFirmKey = '';
  let maxBuyFirmName = '';

  let minSellPrice = Infinity;
  let minSellFirmKey = '';
  let minSellFirmName = '';

  let productName = '';

  Object.entries(sources).forEach(([firmKey, source]) => {
    const item = source?.data?.find((d) => {
      if (!d || !d.code) return false;
      if (d.code === code) return true;
      if (code.endsWith('TRY') && d.code === code.slice(0, -3)) return true;
      if (d.code.endsWith('TRY') && d.code.slice(0, -3) === code) return true;
      return false;
    });
    if (!item) return;

    if (!productName && item.name) {
      productName = item.name;
    }

    if (typeof item.buy === 'number' && item.buy > maxBuyPrice) {
      maxBuyPrice = item.buy;
      maxBuyFirmKey = firmKey;
      maxBuyFirmName = source.sourceName || firmKey;
    }

    if (typeof item.sell === 'number' && item.sell > 0 && item.sell < minSellPrice) {
      minSellPrice = item.sell;
      minSellFirmKey = firmKey;
      minSellFirmName = source.sourceName || firmKey;
    }
  });

  if (
    maxBuyPrice > 0 &&
    minSellPrice < Infinity &&
    maxBuyPrice > minSellPrice &&
    maxBuyFirmKey !== minSellFirmKey
  ) {
    const profit = maxBuyPrice - minSellPrice;
    const profitPercent = (profit / minSellPrice) * 100;

    let isDirectOpportunityForFirm: 'buy_here' | 'sell_here' | undefined = undefined;
    if (currentFirmKey) {
      if (currentFirmKey === minSellFirmKey) {
        isDirectOpportunityForFirm = 'buy_here';
      } else if (currentFirmKey === maxBuyFirmKey) {
        isDirectOpportunityForFirm = 'sell_here';
      } else {
        // If currentFirmKey is provided and this firm is neither the buy nor sell firm,
        // it is NOT an opportunity for this firm. Do not show arbitrage inside this firm's price list!
        return null;
      }
    }

    return {
      code,
      name: productName || code,
      buyFirmKey: minSellFirmKey,
      buyFirmName: minSellFirmName,
      buyPrice: minSellPrice,
      sellFirmKey: maxBuyFirmKey,
      sellFirmName: maxBuyFirmName,
      sellPrice: maxBuyPrice,
      profit,
      profitPercent,
      isDirectOpportunityForFirm,
    };
  }

  return null;
}

// -------------------------------------------------------------
// Sesli Bildirim (Web Audio API Synthesizer - Melodic Rising Chime)
// -------------------------------------------------------------
let sharedAudioCtx: AudioContext | null = null;

// Auto-unlock AudioContext on user interaction to bypass browser autoplay blocks
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });
}

export function playArbitrageSound(): void {
  try {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return;

    if (!sharedAudioCtx || sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx = new AudioCtxClass();
      if (sharedAudioCtx.state === 'suspended') {
        sharedAudioCtx.resume().catch(() => {});
      }
    }

    const ctx = sharedAudioCtx;
    const now = ctx.currentTime;

    // Harmonic ascending 4-tone chime: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.50Hz)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const noteDuration = 0.08;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * noteDuration);

      gain.gain.setValueAtTime(0, now + idx * noteDuration);
      gain.gain.linearRampToValueAtTime(0.14, now + idx * noteDuration + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * noteDuration + noteDuration + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * noteDuration);
      osc.stop(now + idx * noteDuration + noteDuration + 0.15);
    });
  } catch (err) {
    console.warn('Arbitraj ses bildirimi çalınamadı:', err);
  }
}

// -------------------------------------------------------------
// Bilgisayara / Masaüstüne Bildirim Gönderme (Web Notification API)
// -------------------------------------------------------------

// Self-contained Gold Lightning Bell SVG icon in Base64 (universally supported, no URL decoding issues)
const ARBITRAGE_NOTIFICATION_ICON =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0Ij48cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHJ4PSIxMiIgZmlsbD0iIzBmMTcyYSIvPjxjaXJjbGUgY3g9IjI0IiBjeT0iMjQiIHI9IjIwIiBmaWxsPSIjZjU5ZTBiIiBvcGFjaXR5PSIwLjE1Ii8+PHBhdGggZD0iTTI2IDhMMTIgMjZoMTFsLTMgMTQgMTYtMTlIMjRsNS0xM3oiIGZpbGw9IiNmNTllMGIiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=';

export interface NotificationResult {
  success: boolean;
  status: 'sent' | 'rate_limited' | 'permission_denied' | 'unsupported' | 'error';
  message: string;
}

export async function requestDesktopNotificationPermission(): Promise<{
  granted: boolean;
  permission: NotificationPermission | 'unsupported';
  message: string;
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      granted: false,
      permission: 'unsupported',
      message: 'Tarayıcınız veya bu pencere masaüstü bildirim özelliğini desteklemiyor.',
    };
  }

  if (Notification.permission === 'granted') {
    return {
      granted: true,
      permission: 'granted',
      message: 'Masaüstü bildirim izni zaten verilmiş durumda.',
    };
  }

  if (Notification.permission === 'denied') {
    return {
      granted: false,
      permission: 'denied',
      message: 'Bildirimler tarayıcınızda engellenmiş. Adres çubuğundaki kilit/site ayarları simgesinden "İzin Ver" yapın.',
    };
  }

  try {
    let perm: NotificationPermission = 'default';

    // Cross-browser: handles both modern Promise and Safari/older callback APIs
    const req = Notification.requestPermission((p) => {
      perm = p;
    });

    if (req && typeof (req as Promise<NotificationPermission>).then === 'function') {
      perm = await req;
    }

    const currentPerm = Notification.permission as NotificationPermission;
    const isGranted = perm === 'granted' || currentPerm === 'granted';

    return {
      granted: isGranted,
      permission: Notification.permission,
      message: isGranted
        ? 'Masaüstü bildirim izni başarıyla verildi!'
        : 'Bildirim izni onaylanmadı veya reddedildi.',
    };
  } catch (err: any) {
    console.warn('Bildirim izni isteği hatası:', err);
    const currentPerm = Notification.permission as NotificationPermission;
    return {
      granted: currentPerm === 'granted',
      permission: Notification.permission,
      message: 'Bildirim izni isteği başarısız: ' + (err?.message || 'Bilinmeyen hata'),
    };
  }
}

let lastNotificationTime = 0;
let lastNotifiedDealCode = '';

export function sendDesktopArbitrageNotification(
  deal: ArbitrageDeal,
  force: boolean = false
): NotificationResult {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      success: false,
      status: 'unsupported',
      message: 'Tarayıcınız masaüstü bildirim özelliğini desteklemiyor.',
    };
  }

  if (Notification.permission === 'denied') {
    return {
      success: false,
      status: 'permission_denied',
      message: 'Tarayıcı bildirim izni engellenmiş. Adres çubuğundaki kilit simgesinden izin verin.',
    };
  }

  if (Notification.permission !== 'granted') {
    return {
      success: false,
      status: 'permission_denied',
      message: 'Masaüstü bildirim izni henüz onaylanmadı.',
    };
  }

  const now = Date.now();
  // Avoid spamming the user: at most 1 notification every 15 seconds unless product changes or force is true
  if (!force && deal.code === lastNotifiedDealCode && now - lastNotificationTime < 15000) {
    return {
      success: false,
      status: 'rate_limited',
      message: 'Bildirim bekleme süresi devrede (15 sn).',
    };
  }

  lastNotificationTime = now;
  lastNotifiedDealCode = deal.code;

  try {
    const formattedProfit = deal.profit.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const formattedBuy = deal.buyPrice.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const formattedSell = deal.sellPrice.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const title = `⚡ Canlı Arbitraj Fırsatı: ${deal.name}`;
    const body = `Alış: ${deal.buyFirmName} (${formattedBuy} ₺) ➔ Satış: ${deal.sellFirmName} (${formattedSell} ₺)\nNet Kazanç: +${formattedProfit} ₺ (%${deal.profitPercent.toFixed(2)})`;

    let n: Notification | null = null;
    let sentViaSw = false;

    try {
      n = new Notification(title, {
        body,
        icon: ARBITRAGE_NOTIFICATION_ICON,
        tag: `arbitrage-${deal.code}`,
        requireInteraction: false,
        silent: false,
      });

      n.onclick = () => {
        window.focus();
        n?.close();
      };
    } catch {
      // 1. Fallback: Some OSs/browsers reject SVG data URIs as icons; retry without icon
      try {
        n = new Notification(title, {
          body,
          tag: `arbitrage-${deal.code}`,
          silent: false,
        });

        n.onclick = () => {
          window.focus();
          n?.close();
        };
      } catch (ctorErr) {
        // 2. Fallback for mobile / PWA / contexts requiring ServiceWorker showNotification
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          sentViaSw = true;
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, {
              body,
              tag: `arbitrage-${deal.code}`,
            });
          }).catch((swErr) => {
            console.warn('ServiceWorker bildirim hatası:', swErr);
          });
        } else {
          throw ctorErr;
        }
      }
      if (n) {
        n.onerror = (e) => {
          console.warn('Masaüstü bildirim gösterim olayı hatası:', e);
        };
      }
    }

    return {
      success: true,
      status: 'sent',
      message: sentViaSw
        ? 'Masaüstü bildirimi arka plan servisi ile iletildi.'
        : 'Masaüstü bildirimi başarıyla ekrana gönderildi.',
    };
  } catch (err: any) {
    console.warn('Masaüstü bildirim gönderilemedi:', err);
    const isIframe = typeof window !== 'undefined' && window.self !== window.top;
    const msg = isIframe
      ? 'Önizleme çerçevesi (iframe) tarayıcı güvenlik kısıtlaması nedeniyle masaüstü uyarısını engelledi. Uygulamayı yeni sekmede açarak veya sesli uyarı ile takip edebilirsiniz.'
      : err?.message || 'Masaüstü bildirimi oluşturulamadı.';
    return {
      success: false,
      status: 'error',
      message: msg,
    };
  }
}
