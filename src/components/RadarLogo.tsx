import React from 'react';

interface RadarLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  isDark?: boolean;
  animated?: boolean;
}

export const RadarLogo: React.FC<RadarLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  subtitle = 'Canlı Finans Terminali',
  isDark = true,
  animated = true,
}) => {
  // Dimension presets
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-sm', sub: 'text-[9px]', ring: 'w-7 h-7' },
    md: { icon: 'w-9 h-9', text: 'text-base', sub: 'text-[10px]', ring: 'w-9 h-9' },
    lg: { icon: 'w-12 h-12', text: 'text-xl', sub: 'text-xs', ring: 'w-12 h-12' },
    xl: { icon: 'w-16 h-16', text: 'text-2xl', sub: 'text-sm', ring: 'w-16 h-16' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center space-x-2.5 select-none ${className}`}>
      {/* Radar Scope Icon */}
      <div
        className={`relative ${currentSize.icon} shrink-0 rounded-xl overflow-hidden p-0.5 flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${
          isDark
            ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/40 border border-emerald-500/30 shadow-emerald-950/50'
            : 'bg-gradient-to-br from-white via-emerald-50 to-slate-100 border border-emerald-500/40 shadow-emerald-500/10'
        }`}
        title="RADAR Finans - Canlı Piyasa Takibi"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Radar scanner sweep gradient */}
            <radialGradient id="radarSweepGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#10b981" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="radarLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.3" />
            </linearGradient>

            <linearGradient id="radarBeam" x1="50%" y1="50%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Dark scope background */}
          <circle
            cx="50"
            cy="50"
            r="46"
            className={isDark ? 'fill-slate-950/80' : 'fill-emerald-50/50'}
          />

          {/* Concentric radar range rings */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#10b981"
            strokeWidth="1.2"
            strokeOpacity={isDark ? '0.35' : '0.4'}
            strokeDasharray="2 2"
          />
          <circle
            cx="50"
            cy="50"
            r="28"
            fill="none"
            stroke="#10b981"
            strokeWidth="1"
            strokeOpacity={isDark ? '0.3' : '0.35'}
          />
          <circle
            cx="50"
            cy="50"
            r="14"
            fill="none"
            stroke="#10b981"
            strokeWidth="0.8"
            strokeOpacity={isDark ? '0.4' : '0.45'}
          />

          {/* Crosshairs: X and Y axis */}
          <line
            x1="50"
            y1="8"
            x2="50"
            y2="92"
            stroke="#10b981"
            strokeWidth="0.8"
            strokeOpacity={isDark ? '0.3' : '0.35'}
          />
          <line
            x1="8"
            y1="50"
            x2="92"
            y2="50"
            stroke="#10b981"
            strokeWidth="0.8"
            strokeOpacity={isDark ? '0.3' : '0.35'}
          />

          {/* 45-degree angle tick marks */}
          <line
            x1="22"
            y1="22"
            x2="28"
            y2="28"
            stroke="#10b981"
            strokeWidth="0.8"
            strokeOpacity="0.4"
          />
          <line
            x1="78"
            y1="22"
            x2="72"
            y2="28"
            stroke="#10b981"
            strokeWidth="0.8"
            strokeOpacity="0.4"
          />
          <line
            x1="22"
            y1="78"
            x2="28"
            y2="72"
            stroke="#10b981"
            strokeWidth="0.8"
            strokeOpacity="0.4"
          />
          <line
            x1="78"
            y1="78"
            x2="72"
            y2="72"
            stroke="#10b981"
            strokeWidth="0.8"
            strokeOpacity="0.4"
          />

          {/* Sweeping Radar Scanner Needle & Sector */}
          <g className={animated ? 'origin-center animate-[spin_4s_linear_infinite]' : ''}>
            {/* Scanner beam pie wedge */}
            <path
              d="M 50 50 L 50 8 A 42 42 0 0 1 80 20 Z"
              fill="url(#radarSweepGlow)"
            />
            {/* Leading scanning ray */}
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="8"
              stroke="#34d399"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </g>

          {/* Live Ping Target Blip (Echo 1: top right) */}
          <circle
            cx="68"
            cy="32"
            r="3"
            fill="#f59e0b"
            className={animated ? 'animate-ping' : ''}
            style={{ animationDuration: '2.5s' }}
          />
          <circle cx="68" cy="32" r="2.2" fill="#fbbf24" />

          {/* Live Ping Target Blip (Echo 2: bottom left) */}
          <circle cx="34" cy="66" r="1.8" fill="#34d399" opacity="0.8" />

          {/* Center radar origin pivot */}
          <circle cx="50" cy="50" r="4.5" fill="#10b981" />
          <circle cx="50" cy="50" r="2" fill="#ffffff" />
        </svg>

        {/* Live pulsing corner indicator */}
        <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </span>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center space-x-1.5 leading-none">
            <span
              className={`font-black tracking-wider uppercase font-sans ${currentSize.text} ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              RADAR
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-widest font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              PRO
            </span>
          </div>
          {subtitle && (
            <span
              className={`font-medium tracking-tight truncate mt-0.5 ${currentSize.sub} ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
