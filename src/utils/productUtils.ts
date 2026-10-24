/**
 * Standardized Product Names & Currency Helpers
 * 
 * Rules:
 * - Currencies (Döviz): Clean code without "TRY" (USD, EUR, GBP, CHF, CAD, AUD, SAR, JPY, RUB, AZN, GEL, etc.),
 *   preceded by a circular country flag filling the circle, rendered on a single line with no description underneath.
 * - Gold / Precious Metals: 24 AYAR, 22 AYAR, ÇEYREK, YARIM, TAM, ATA LİRA, HAS, GÜMÜŞ.
 *   Rendered on a single line with no subtitle/description underneath.
 */

export function isFxItem(code: string): boolean {
  if (!code) return false;
  const upper = String(code).toUpperCase().trim();

  // Exclude precious metals
  if (
    upper.startsWith('ALTIN') ||
    upper.startsWith('CEYREK') ||
    upper.startsWith('YARIM') ||
    upper.startsWith('TAM') ||
    upper.startsWith('TEK') ||
    upper.startsWith('ATA') ||
    upper.startsWith('GREMSE') ||
    upper.startsWith('GUMUS') ||
    upper === 'HAS' ||
    upper === 'ONS' ||
    upper === 'RESAT_LIRA' ||
    upper === 'XAU' ||
    upper === 'XAG'
  ) {
    return false;
  }

  // Recognized FX currencies and pairs
  if (
    upper.includes('TRY') ||
    upper === 'USD' ||
    upper === 'EUR' ||
    upper === 'GBP' ||
    upper === 'CHF' ||
    upper === 'CAD' ||
    upper === 'AUD' ||
    upper === 'SAR' ||
    upper === 'JPY' ||
    upper === 'RUB' ||
    upper === 'AZN' ||
    upper === 'GEL' ||
    upper === 'AED' ||
    upper === 'QAR' ||
    upper === 'KWD' ||
    upper === 'NOK' ||
    upper === 'SEK' ||
    upper === 'DKK' ||
    upper === 'EURUSD' ||
    upper === 'EUR_USD'
  ) {
    return true;
  }

  return false;
}

export function getCleanCurrencyCode(code: string): string {
  if (!code) return '';
  const upper = String(code).toUpperCase().trim();

  if (upper === 'EURUSD' || upper === 'EUR_USD') {
    return 'EUR/USD';
  }

  // Strip TRY from end (e.g. USDTRY -> USD, EURTRY -> EUR, SARTRY -> SAR)
  if (upper.endsWith('TRY') && upper.length > 3) {
    return upper.slice(0, -3);
  }

  // Strip _TRY or /TRY
  if (upper.endsWith('_TRY')) {
    return upper.slice(0, -4);
  }
  if (upper.endsWith('/TRY')) {
    return upper.slice(0, -4);
  }

  return upper;
}

export function getStandardizedProductName(code: string, rawName?: string): string {
  const c = String(code || '').toUpperCase().trim();
  const n = String(rawName || '').toLowerCase().trim();

  // 1. Currency units
  if (isFxItem(c)) {
    return getCleanCurrencyCode(c);
  }

  // 2. Gold & Precious metals (Exact rules from user prompt: 24 AYAR, 22 AYAR, ÇEYREK, YARIM, TAM, ATA LİRA, HAS, GÜMÜŞ)
  if (c === 'ALTIN_24' || (c === 'ALTIN_HAS' && (n.includes('24 ayar') || n.includes('ayar 24') || n.includes('gram altın')) && !n.includes('has altın'))) {
    return '24 AYAR';
  }

  if (c === 'ALTIN_HAS' || c === 'HAS' || n.includes('has altın') || n.includes('has 24') || n.includes('külçe has') || n.includes('kulce')) {
    return 'HAS';
  }

  if (c === 'ALTIN_22' || c === 'AYAR22' || c === 'GRM' || n.includes('22 ayar') || n.includes('bilezik')) {
    return '22 AYAR';
  }

  if (c.startsWith('CEYREK') || c === 'CEY' || n.includes('çeyrek') || n.includes('ceyrek')) {
    return 'ÇEYREK';
  }

  if (c.startsWith('YARIM') || c === 'YRM' || n.includes('yarım') || n.includes('yarim')) {
    return 'YARIM';
  }

  if (c.startsWith('TAM') || c.startsWith('TEK') || c === 'ZIYNET' || n.includes('tam') || n.includes('ziynet')) {
    return 'TAM';
  }

  if (c.startsWith('ATA') || n.includes('ata') || n.includes('cumhuriyet')) {
    return 'ATA LİRA';
  }

  if (c === 'GUMUS' || c === 'GUMUSTRY' || c === 'XAG' || n.includes('gümüş') || n.includes('gumus')) {
    return 'GÜMÜŞ';
  }

  if (c.startsWith('GREMSE') || n.includes('gremse')) {
    return 'GREMSE';
  }

  if (c === 'ALTIN_14' || c === 'AYAR14' || n.includes('14 ayar')) {
    return '14 AYAR';
  }

  if (c === 'RESAT_LIRA' || n.includes('reşat') || n.includes('resat')) {
    return 'REŞAT LİRA';
  }

  if (c === 'ONS') {
    return 'ONS ($)';
  }

  // Fallback: clean up rawName if it had TRY or parentheses
  if (rawName) {
    let cleaned = rawName
      .replace(/\s*\/\s*TRY/gi, '')
      .replace(/\s*\(TRY\)/gi, '')
      .replace(/\s*\(Dolar\)/gi, '')
      .replace(/\s*\(Euro\)/gi, '')
      .replace(/\s*\(Sterlin\)/gi, '')
      .replace(/\s*\(Frank\)/gi, '')
      .replace(/\s*\(Riyal\)/gi, '')
      .trim();
    if (cleaned.endsWith('TRY')) {
      cleaned = cleaned.slice(0, -3).trim();
    }
    return cleaned;
  }

  return c;
}
