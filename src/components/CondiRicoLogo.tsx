import React from "react";

interface LogoProps {
  className?: string;
  light?: boolean;
  showTagline?: boolean;
}

export const CondiRicoLogo: React.FC<LogoProps> = ({
  className = "h-12 w-auto",
  light = false,
  showTagline = false,
}) => {
  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        viewBox="0 0 460 210"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          {/* Green Gradients */}
          <linearGradient id="cr-green-arch" x1="50" y1="20" x2="350" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="50%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#166534" />
          </linearGradient>

          <linearGradient id="cr-green-letter" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={light ? "#86efac" : "#22c55e"} />
            <stop offset="35%" stopColor={light ? "#4ade80" : "#16a34a"} />
            <stop offset="100%" stopColor={light ? "#22c55e" : "#14532d"} />
          </linearGradient>

          <radialGradient id="cr-green-highlight" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#bbf7d0" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#22c55e" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#15803d" stopOpacity="0" />
          </radialGradient>

          {/* Orange/Red Gradients */}
          <linearGradient id="cr-orange-letter" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="25%" stopColor="#fb923c" />
            <stop offset="70%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#c2410c" />
          </linearGradient>

          <linearGradient id="cr-smile" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          {/* Berry Gradient */}
          <radialGradient id="cr-berry" cx="35%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#fdba74" />
            <stop offset="40%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#9a3412" />
          </radialGradient>

          <filter id="cr-shadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.18" />
          </filter>
        </defs>

        {/* Outer Green Arch */}
        <path
          d="M 100 88 C 120 30, 260 20, 360 88"
          stroke="url(#cr-green-arch)"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />

        {/* Botanical Leaves on Top */}
        <g filter="url(#cr-shadow)">
          {/* Main center upright leaf */}
          <path
            d="M 215 65 C 205 32, 220 12, 245 10 C 248 30, 238 52, 215 65 Z"
            fill="url(#cr-green-arch)"
          />
          {/* Left leaf */}
          <path
            d="M 212 58 C 185 45, 172 25, 185 14 C 202 20, 208 40, 212 58 Z"
            fill="#16a34a"
          />
          {/* Right leaf */}
          <path
            d="M 225 60 C 250 50, 275 35, 270 20 C 252 22, 235 42, 225 60 Z"
            fill="#22c55e"
          />
          {/* Curled leaf stems */}
          <path
            d="M 205 68 C 190 75, 195 85, 210 82 C 218 80, 225 72, 218 63"
            stroke="#16a34a"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* Berry Accents */}
        <circle cx="245" cy="28" r="9" fill="url(#cr-berry)" />
        <circle cx="155" cy="62" r="5" fill="url(#cr-berry)" />
        <circle cx="232" cy="70" r="5.5" fill="url(#cr-berry)" />

        {/* Brand Text: Condi (Lush 3D Green) */}
        <g filter="url(#cr-shadow)">
          <text
            x="24"
            y="138"
            fontFamily="'Manrope', 'Comfortaa', 'Fredoka', 'Quicksand', system-ui, sans-serif"
            fontWeight="900"
            fontSize="78"
            fontStyle="italic"
            letterSpacing="-2px"
            fill="url(#cr-green-letter)"
          >
            Condi
          </text>
          {/* Highlight sheen for Condi */}
          <text
            x="24"
            y="138"
            fontFamily="'Manrope', 'Comfortaa', 'Fredoka', 'Quicksand', system-ui, sans-serif"
            fontWeight="900"
            fontSize="78"
            fontStyle="italic"
            letterSpacing="-2px"
            fill="none"
            stroke="#bbf7d0"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          >
            Condi
          </text>
        </g>

        {/* Brand Text: Rico (Juicy Orange & Tangerine) */}
        <g filter="url(#cr-shadow)">
          <text
            x="245"
            y="138"
            fontFamily="'Manrope', 'Comfortaa', 'Fredoka', 'Quicksand', system-ui, sans-serif"
            fontWeight="900"
            fontSize="78"
            fontStyle="italic"
            letterSpacing="-2px"
            fill="url(#cr-orange-letter)"
          >
            Rico
          </text>
          {/* Highlight sheen for Rico */}
          <text
            x="245"
            y="138"
            fontFamily="'Manrope', 'Comfortaa', 'Fredoka', 'Quicksand', system-ui, sans-serif"
            fontWeight="900"
            fontSize="78"
            fontStyle="italic"
            letterSpacing="-2px"
            fill="none"
            stroke="#fed7aa"
            strokeWidth="1.5"
            strokeOpacity="0.5"
          >
            Rico
          </text>
          {/* Dot on i in Rico or decorative sphere */}
          <circle cx="346" cy="98" r="6" fill="url(#cr-berry)" />
        </g>

        {/* Cheerful Smile Swoosh Underneath */}
        <path
          d="M 125 152 C 185 178, 255 178, 295 150 C 255 168, 185 168, 125 152 Z"
          fill="url(#cr-smile)"
          filter="url(#cr-shadow)"
        />

        {showTagline && (
          <text
            x="215"
            y="196"
            textAnchor="middle"
            fontFamily="'Manrope', system-ui, sans-serif"
            fontWeight="700"
            fontSize="14"
            letterSpacing="2.5px"
            fill={light ? "#bbf7d0" : "#166534"}
            style={{ textTransform: "uppercase" }}
          >
            Tu supermercado, más cerca
          </text>
        )}
      </svg>
    </div>
  );
};

export const CondiRicoMobileLogo: React.FC<{ className?: string; light?: boolean }> = ({
  className = "size-9",
  light = false,
}) => {
  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          <linearGradient id="cr-mob-green" x1="20" y1="20" x2="100" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="40%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>

          <linearGradient id="cr-mob-orange" x1="70" y1="60" x2="135" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="25%" stopColor="#fb923c" />
            <stop offset="70%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#c2410c" />
          </linearGradient>

          <filter id="cr-mob-shadow" x="-10%" y="-10%" width="120%" height="125%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Upper arching leaves */}
        <path
          d="M 38 70 C 42 28, 92 18, 122 62 C 102 42, 70 38, 52 68"
          stroke="url(#cr-mob-green)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        {/* Leaf cluster on top */}
        <path
          d="M 80 48 C 76 25, 92 10, 108 8 C 110 24, 98 42, 80 48 Z"
          fill="#22c55e"
        />
        <path
          d="M 94 45 C 115 38, 128 26, 124 16 C 110 18, 98 32, 94 45 Z"
          fill="#16a34a"
        />

        {/* Letter C (Emerald 3D curve) */}
        <g filter="url(#cr-mob-shadow)">
          <path
            d="M 82 52 C 55 52, 30 70, 30 98 C 30 126, 54 144, 82 140 C 60 134, 46 118, 48 98 C 50 78, 68 64, 88 64 C 98 64, 102 68, 98 78 C 92 84, 82 82, 80 76"
            fill="url(#cr-mob-green)"
          />
        </g>

        {/* Letter R (Juicy Orange 3D tucked in) */}
        <g filter="url(#cr-mob-shadow)">
          <path
            d="M 82 86 C 80 80, 88 74, 102 74 C 118 74, 128 82, 126 94 C 124 104, 114 110, 102 110 L 98 110 L 122 142 C 124 145, 128 145, 134 142 C 122 144, 114 138, 108 128 L 96 112 L 92 112 L 92 140 C 92 144, 86 144, 80 142 L 80 94 C 80 88, 81 86, 82 86 Z M 96 86 L 96 102 L 102 102 C 112 102, 116 98, 116 92 C 116 86, 110 86, 102 86 L 96 86 Z"
            fill="url(#cr-orange-letter)"
          />
        </g>
      </svg>
    </div>
  );
};
