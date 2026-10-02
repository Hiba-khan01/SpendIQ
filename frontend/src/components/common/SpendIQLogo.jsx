import React from 'react';

export const SpendIQIcon = ({ size = 36, className = "" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Receipt sheet gradients */}
        <linearGradient id="receiptBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EFF6FF" />
          <stop offset="100%" stopColor="#DBEAFE" />
        </linearGradient>

        <linearGradient id="receiptCurl" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="60%" stopColor="#00B4D8" />
          <stop offset="100%" stopColor="#0077B6" />
        </linearGradient>

        {/* Bar chart gradients */}
        <linearGradient id="barGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00D2FF" />
          <stop offset="100%" stopColor="#0077E6" />
        </linearGradient>

        <linearGradient id="barGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#0096C7" />
        </linearGradient>

        <linearGradient id="barGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00F5D4" />
          <stop offset="100%" stopColor="#00B4D8" />
        </linearGradient>

        <linearGradient id="barGrad4" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>

        {/* Upward sweeping arrow gradient */}
        <linearGradient id="arrowSwoosh" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00D2FF" />
          <stop offset="50%" stopColor="#00F5D4" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        <filter id="iconGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#00D2FF" floodOpacity="0.25" />
        </filter>
      </defs>

      <g filter="url(#iconGlow)">
        {/* Receipt Main Paper Body with jagged receipt bottom */}
        <path
          d="M 32 30 L 78 30 L 78 84 L 74 80 L 70 84 L 66 80 L 62 84 L 58 80 L 54 84 L 50 80 L 46 84 L 42 80 L 38 84 L 34 80 L 32 82 Z"
          fill="url(#receiptBody)"
          stroke="#BFDBFE"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Receipt Folded / Curled Top */}
        <path
          d="M 28 30 C 28 14, 52 14, 52 30 C 44 30, 36 30, 28 30 Z"
          fill="url(#receiptCurl)"
        />

        {/* Subtle shadow under curled top */}
        <path
          d="M 28 30 C 36 32, 46 32, 52 30 L 52 32 C 44 34, 34 34, 28 32 Z"
          fill="#005B96"
          opacity="0.4"
        />

        {/* Receipt Text Stripes */}
        <rect x="38" y="38" width="22" height="3.5" rx="1.75" fill="#3B82F6" opacity="0.8" />
        <rect x="38" y="45" width="16" height="3.5" rx="1.75" fill="#60A5FA" opacity="0.8" />
        <rect x="38" y="52" width="12" height="3.5" rx="1.75" fill="#93C5FD" opacity="0.8" />

        {/* Rising Bar Chart Bars */}
        <rect x="52" y="60" width="6.5" height="22" rx="3.25" fill="url(#barGrad1)" />
        <rect x="61" y="52" width="6.5" height="30" rx="3.25" fill="url(#barGrad2)" />
        <rect x="70" y="42" width="6.5" height="40" rx="3.25" fill="url(#barGrad3)" />
        <rect x="79" y="32" width="6.5" height="50" rx="3.25" fill="url(#barGrad4)" />

        {/* Dynamic Curved Arrow Swoosh */}
        <path
          d="M 42 82 C 54 80, 72 74, 91 44"
          fill="none"
          stroke="url(#arrowSwoosh)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        {/* Arrowhead */}
        <path
          d="M 83 44 L 92 43 L 91 52"
          fill="none"
          stroke="url(#arrowSwoosh)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};

export const SpendIQLogo = ({
  variant = "full", // "full", "compact", "icon", "wordmark"
  size = "md",      // "sm", "md", "lg", "xl"
  theme = "auto",   // "dark", "light", "auto"
  showTagline = true,
  tagline = "Spend Smarter. Live Better.",
  className = ""
}) => {
  const sizeMap = {
    sm: { icon: 30, text: "text-lg", sub: "text-[8px]" },
    md: { icon: 40, text: "text-xl", sub: "text-[9px]" },
    lg: { icon: 52, text: "text-2xl", sub: "text-[10px]" },
    xl: { icon: 64, text: "text-3xl", sub: "text-xs" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Text color based on theme
  const spendTextColor =
    theme === "dark"
      ? "text-white"
      : theme === "light"
      ? "text-slate-900"
      : "text-slate-900 dark:text-white";

  const subTextColor =
    theme === "dark"
      ? "text-slate-400"
      : theme === "light"
      ? "text-slate-500"
      : "text-slate-500 dark:text-slate-400";

  if (variant === "icon") {
    return <SpendIQIcon size={currentSize.icon} className={className} />;
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {variant !== "wordmark" && (
        <div className="relative shrink-0 flex items-center justify-center">
          <SpendIQIcon size={currentSize.icon} />
        </div>
      )}

      {(variant === "full" || variant === "compact" || variant === "wordmark") && (
        <div className="flex flex-col justify-center leading-tight">
          <span className={`${currentSize.text} font-black tracking-tight flex items-center gap-0.5 ${spendTextColor}`}>
            Spend
            <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
              IQ
            </span>
          </span>
          {showTagline && variant === "full" && (
            <span className={`${currentSize.sub} font-bold tracking-[0.15em] uppercase ${subTextColor} mt-0.5`}>
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SpendIQLogo;
