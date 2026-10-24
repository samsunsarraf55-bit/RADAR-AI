import React from 'react';

interface CurrencyFlagProps {
  code: string;
  className?: string;
  size?: number;
}

export const CurrencyFlag: React.FC<CurrencyFlagProps> = ({ code, className = 'w-4 h-4', size = 16 }) => {
  const c = String(code || '').toUpperCase().trim();

  // Dual EU / USA Flag for EUR/USD Parite
  if (c === 'EURUSD' || c === 'EUR_USD' || c === 'EUR/USD') {
    return (
      <svg
        className={`${className} rounded-full overflow-hidden shrink-0 shadow-xs ring-1 ring-slate-700/50`}
        viewBox="0 0 32 32"
        width={size}
        height={size}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <defs>
          <clipPath id="leftHalf">
            <rect x="0" y="0" width="16" height="32" />
          </clipPath>
          <clipPath id="rightHalf">
            <rect x="16" y="0" width="16" height="32" />
          </clipPath>
        </defs>
        {/* Left Half: EU */}
        <g clipPath="url(#leftHalf)">
          <rect width="32" height="32" fill="#003399" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const x = 16 + 8 * Math.sin(rad);
            const y = 16 - 8 * Math.cos(rad);
            return <circle key={i} cx={x} cy={y} r="1" fill="#FFCC00" />;
          })}
        </g>
        {/* Right Half: USA */}
        <g clipPath="url(#rightHalf)">
          <rect width="32" height="32" fill="#b22234" />
          <path d="M16,5h16M16,10h16M16,15h16M16,20h16M16,25h16M16,30h16" stroke="#ffffff" strokeWidth="2.5" />
          <rect x="16" y="0" width="8" height="15" fill="#3c3b6e" />
          <circle cx="20" cy="5" r="0.9" fill="#ffffff" />
          <circle cx="20" cy="10" r="0.9" fill="#ffffff" />
        </g>
        <line x1="16" y1="0" x2="16" y2="32" stroke="#ffffff" strokeWidth="1" />
      </svg>
    );
  }

  // USA Flag
  if (c.includes('USD')) {
    return (
      <svg
        className={`${className} rounded-full overflow-hidden shrink-0 shadow-xs ring-1 ring-slate-700/50`}
        viewBox="0 0 32 32"
        width={size}
        height={size}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <rect width="32" height="32" fill="#b22234" />
        <path d="M0,4.92h32M0,9.85h32M0,14.77h32M0,19.69h32M0,24.62h32M0,29.54h32" stroke="#ffffff" strokeWidth="2.46" />
        <rect width="15" height="17.23" fill="#3c3b6e" />
        <circle cx="3" cy="3" r="0.85" fill="#ffffff" />
        <circle cx="7" cy="3" r="0.85" fill="#ffffff" />
        <circle cx="11" cy="3" r="0.85" fill="#ffffff" />
        <circle cx="5" cy="6" r="0.85" fill="#ffffff" />
        <circle cx="9" cy="6" r="0.85" fill="#ffffff" />
        <circle cx="3" cy="9" r="0.85" fill="#ffffff" />
        <circle cx="7" cy="9" r="0.85" fill="#ffffff" />
        <circle cx="11" cy="9" r="0.85" fill="#ffffff" />
        <circle cx="5" cy="12" r="0.85" fill="#ffffff" />
        <circle cx="9" cy="12" r="0.85" fill="#ffffff" />
        <circle cx="3" cy="15" r="0.85" fill="#ffffff" />
        <circle cx="7" cy="15" r="0.85" fill="#ffffff" />
        <circle cx="11" cy="15" r="0.85" fill="#ffffff" />
      </svg>
    );
  }

  // European Union Flag
  if (c.includes('EUR')) {
    return (
      <svg
        className={`${className} rounded-full overflow-hidden shrink-0 shadow-xs ring-1 ring-slate-700/50`}
        viewBox="0 0 32 32"
        width={size}
        height={size}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <rect width="32" height="32" fill="#003399" />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const x = 16 + 9 * Math.sin(rad);
          const y = 16 - 9 * Math.cos(rad);
          return (
            <polygon
              key={i}
              points={`${x},${y - 1.2} ${x + 0.8},${y + 1.1} ${x - 1.1},${y - 0.3} ${x + 1.1},${y - 0.3} ${x - 0.8},${y + 1.1}`}
              fill="#FFCC00"
            />
          );
        })}
      </svg>
    );
  }

  // Great Britain / UK Flag
  if (c.includes('GBP')) {
    return (
      <svg
        className={`${className} rounded-full overflow-hidden shrink-0 shadow-xs ring-1 ring-slate-700/50`}
        viewBox="0 0 32 32"
        width={size}
        height={size}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <rect width="32" height="32" fill="#00247D" />
        <path d="M0,0 L32,32 M32,0 L0,32" stroke="#FFFFFF" strokeWidth="5.5" />
        <path d="M0,0 L32,32 M32,0 L0,32" stroke="#CF142B" strokeWidth="2.8" />
        <path d="M16,0 V32 M0,16 H32" stroke="#FFFFFF" strokeWidth="8.5" />
        <path d="M16,0 V32 M0,16 H32" stroke="#CF142B" strokeWidth="5" />
      </svg>
    );
  }

  // Switzerland Flag
  if (c.includes('CHF')) {
    return (
      <svg
        className={`${className} rounded-full overflow-hidden shrink-0 shadow-xs ring-1 ring-slate-700/50`}
        viewBox="0 0 32 32"
        width={size}
        height={size}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <rect width="32" height="32" fill="#D52B1E" />
        <rect x="13" y="7" width="6" height="18" fill="#FFFFFF" rx="0.5" />
        <rect x="7" y="13" width="18" height="6" fill="#FFFFFF" rx="0.5" />
      </svg>
    );
  }

  // Canada Flag
  if (c.includes('CAD')) {
    return (
      <svg
        className={`${className} rounded-full overflow-hidden shrink-0 shadow-xs ring-1 ring-slate-700/50`}
        viewBox="0 0 32 32"
        width={size}
        height={size}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <rect width="8" height="32" fill="#FF0000" />
        <rect x="8" width="16" height="32" fill="#FFFFFF" />
        <rect x="24" width="8" height="32" fill="#FF0000" />
        <path
          d="M16 8l1.5 3.5 2.5-1-1 3.5 3.5 1-1.5 2 2.5 1.5-3.5 1 0.5 3.5-3-1.5-1 3.5-1-3.5-3 1.5 0.5-3.5-3.5-1 2.5-1.5-1.5-2 3.5-1-1-3.5 2.5 1z"
          fill="#FF0000"
        />
      </svg>
    );
  }

  // Australia Flag
  if (c.includes('AUD')) {
    return (
      <svg
        className={`${className} rounded-full overflow-hidden shrink-0 shadow-xs ring-1 ring-slate-700/50`}
        viewBox="0 0 32 32"
        width={size}
        height={size}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <rect width="32" height="32" fill="#00008B" />
        <g>
          <rect width="16" height="16" fill="#00247D" />
          <path d="M0,0 L16,16 M16,0 L0,16" stroke="#ffffff" strokeWidth="3" />
          <path d="M0,0 L16,16 M16,0 L0,16" stroke="#CF142B" strokeWidth="1.5" />
          <path d="M8,0 V16 M0,8 H16" stroke="#ffffff" strokeWidth="4.5" />
          <path d="M8,0 V16 M0,8 H16" stroke="#CF142B" strokeWidth="2.7" />
        </g>
        <circle cx="8" cy="24" r="2.2" fill="#ffffff" />
        <circle cx="24" cy="8" r="1.1" fill="#ffffff" />
        <circle cx="21" cy="14" r="1.1" fill="#ffffff" />
        <circle cx="27" cy="17" r="1.1" fill="#ffffff" />
        <circle cx="24" cy="22" r="1.3" fill="#ffffff" />
        <circle cx="22.5" cy="18" r="0.7" fill="#ffffff" />
      </svg>
    );
  }

  // Saudi Arabia Flag
  if (c.includes('SAR')) {
    return (
      <svg
        className={`${className} rounded-full overflow-hidden shrink-0 shadow-xs ring-1 ring-slate-700/50`}
        viewBox="0 0 32 32"
        width={size}
        height={size}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <rect width="32" height="32" fill="#006C35" />
        <path d="M7 13h18M9 11h14M11 9h10" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M8 18h16M10 16.5v3M24 18l-2-1.5v3z" stroke="#ffffff" strokeWidth="1.2" fill="#ffffff" strokeLinecap="round" />
      </svg>
    );
  }

  // Japan Flag
  if (c.includes('JPY')) {
    return (
      <svg
        className={`${className} rounded-full overflow-hidden shrink-0 shadow-xs ring-1 ring-slate-700/50 border border-slate-200/40`}
        viewBox="0 0 32 32"
        width={size}
        height={size}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <rect width="32" height="32" fill="#FFFFFF" />
        <circle cx="16" cy="16" r="7.5" fill="#BC002D" />
      </svg>
    );
  }

  // Russia Flag
  if (c.includes('RUB')) {
    return (
      <svg
        className={`${className} rounded-full overflow-hidden shrink-0 shadow-xs ring-1 ring-slate-700/50`}
        viewBox="0 0 32 32"
        width={size}
        height={size}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <rect y="0" width="32" height="10.67" fill="#FFFFFF" />
        <rect y="10.67" width="32" height="10.67" fill="#0039A6" />
        <rect y="21.34" width="32" height="10.67" fill="#D52B1E" />
      </svg>
    );
  }

  // Azerbaijan Flag
  if (c.includes('AZN')) {
    return (
      <svg
        className={`${className} rounded-full overflow-hidden shrink-0 shadow-xs ring-1 ring-slate-700/50`}
        viewBox="0 0 32 32"
        width={size}
        height={size}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <rect y="0" width="32" height="10.67" fill="#00B5E2" />
        <rect y="10.67" width="32" height="10.67" fill="#EF3340" />
        <rect y="21.34" width="32" height="10.67" fill="#509E2F" />
        {/* Crescent and 8-pointed star */}
        <circle cx="15" cy="16" r="3.2" fill="#FFFFFF" />
        <circle cx="16" cy="16" r="2.6" fill="#EF3340" />
        <circle cx="18" cy="16" r="0.9" fill="#FFFFFF" />
      </svg>
    );
  }

  // Georgia Flag
  if (c.includes('GEL')) {
    return (
      <svg
        className={`${className} rounded-full overflow-hidden shrink-0 shadow-xs ring-1 ring-slate-700/50`}
        viewBox="0 0 32 32"
        width={size}
        height={size}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <rect width="32" height="32" fill="#FFFFFF" />
        <rect x="13.5" y="0" width="5" height="32" fill="#FF0000" />
        <rect x="0" y="13.5" width="32" height="5" fill="#FF0000" />
        {/* 4 small crosses */}
        <path d="M6 7v3M4.5 8.5h3M26 7v3M24.5 8.5h3M6 22v3M4.5 23.5h3M26 22v3M24.5 23.5h3" stroke="#FF0000" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  // United Arab Emirates Flag
  if (c.includes('AED')) {
    return (
      <svg
        className={`${className} rounded-full overflow-hidden shrink-0 shadow-xs ring-1 ring-slate-700/50`}
        viewBox="0 0 32 32"
        width={size}
        height={size}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <rect x="8" y="0" width="24" height="10.67" fill="#00732F" />
        <rect x="8" y="10.67" width="24" height="10.67" fill="#FFFFFF" />
        <rect x="8" y="21.34" width="24" height="10.67" fill="#000000" />
        <rect x="0" y="0" width="8" height="32" fill="#FF0000" />
      </svg>
    );
  }

  // Qatar Flag
  if (c.includes('QAR')) {
    return (
      <svg
        className={`${className} rounded-full overflow-hidden shrink-0 shadow-xs ring-1 ring-slate-700/50`}
        viewBox="0 0 32 32"
        width={size}
        height={size}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <rect width="32" height="32" fill="#8D1B3D" />
        <rect width="11" height="32" fill="#FFFFFF" />
        <polygon points="11,0 14,3 11,6 14,9 11,12 14,15 11,18 14,21 11,24 14,27 11,30 14,32 11,32" fill="#FFFFFF" />
      </svg>
    );
  }

  // Kuwait Flag
  if (c.includes('KWD')) {
    return (
      <svg
        className={`${className} rounded-full overflow-hidden shrink-0 shadow-xs ring-1 ring-slate-700/50`}
        viewBox="0 0 32 32"
        width={size}
        height={size}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <rect width="32" height="10.67" fill="#007A3D" />
        <rect y="10.67" width="32" height="10.67" fill="#FFFFFF" />
        <rect y="21.34" width="32" height="10.67" fill="#CE1126" />
        <polygon points="0,0 10,10.67 10,21.34 0,32" fill="#000000" />
      </svg>
    );
  }

  // Norway Flag
  if (c.includes('NOK')) {
    return (
      <svg
        className={`${className} rounded-full overflow-hidden shrink-0 shadow-xs ring-1 ring-slate-700/50`}
        viewBox="0 0 32 32"
        width={size}
        height={size}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <rect width="32" height="32" fill="#BA0C2F" />
        <path d="M10 0v32M0 16h32" stroke="#ffffff" strokeWidth="6" />
        <path d="M10 0v32M0 16h32" stroke="#00205B" strokeWidth="3" />
      </svg>
    );
  }

  // Sweden Flag
  if (c.includes('SEK')) {
    return (
      <svg
        className={`${className} rounded-full overflow-hidden shrink-0 shadow-xs ring-1 ring-slate-700/50`}
        viewBox="0 0 32 32"
        width={size}
        height={size}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <rect width="32" height="32" fill="#006AA7" />
        <path d="M11 0v32M0 16h32" stroke="#FECC00" strokeWidth="4.5" />
      </svg>
    );
  }

  // Denmark Flag
  if (c.includes('DKK')) {
    return (
      <svg
        className={`${className} rounded-full overflow-hidden shrink-0 shadow-xs ring-1 ring-slate-700/50`}
        viewBox="0 0 32 32"
        width={size}
        height={size}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <rect width="32" height="32" fill="#C60C30" />
        <path d="M11 0v32M0 16h32" stroke="#ffffff" strokeWidth="4.5" />
      </svg>
    );
  }

  // Turkey Flag (if ever needed for TRY)
  if (c === 'TRY' || c === 'TL') {
    return (
      <svg
        className={`${className} rounded-full overflow-hidden shrink-0 shadow-xs ring-1 ring-slate-700/50`}
        viewBox="0 0 32 32"
        width={size}
        height={size}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <rect width="32" height="32" fill="#E30A17" />
        <circle cx="14" cy="16" r="6" fill="#FFFFFF" />
        <circle cx="15.5" cy="16" r="4.8" fill="#E30A17" />
        <polygon points="19.5,16 22,14.5 21,17.5 23.5,16.5 20.5,18.5" fill="#FFFFFF" />
      </svg>
    );
  }

  // Generic circular currency badge fallback
  return (
    <div
      className={`${className} rounded-full bg-gradient-to-br from-indigo-500 to-sky-600 flex items-center justify-center font-bold text-white text-[9px] shadow-xs ring-1 ring-slate-700/50 shrink-0`}
      style={{ width: size, height: size, display: 'inline-flex', verticalAlign: 'middle' }}
    >
      {c.slice(0, 3)}
    </div>
  );
};
