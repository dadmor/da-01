import React from "react";

const KhakiBackgroundSVG = () => {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 1600 1200"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="khakiBase" cx="50%" cy="50%" r="150%">
          <stop offset="0%" stopColor="#d4c4a8" />
          <stop offset="30%" stopColor="#bda98a" />
          <stop offset="60%" stopColor="#a39274" />
          <stop offset="100%" stopColor="#8a7a64" />
        </radialGradient>

        <radialGradient id="khakiHighlight" cx="30%" cy="20%" r="100%">
          <stop offset="0%" stopColor="#d4c4a8" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#c9b89b" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#bda98a" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="khakiGlow" cx="70%" cy="80%" r="100%">
          <stop offset="0%" stopColor="#cdbca0" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#b09d7f" stopOpacity="0" />
        </radialGradient>

        <filter id="premiumMatte">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="4"
            numOctaves="1"
            seed="10"
          />
          <feColorMatrix type="saturate" values="0.2" />
          <feComponentTransfer>
            <feFuncA
              type="discrete"
              tableValues="0 0 0 .05 0 .05 .1 .05 0 .05 .1 .05 0 .05 .1 .15"
            />
          </feComponentTransfer>
          <feBlend mode="multiply" />
        </filter>

        <filter id="silkTexture">
          <feTurbulence
            type="turbulence"
            baseFrequency="8"
            numOctaves="1"
            result="turbulence"
          />
          <feColorMatrix in="turbulence" type="saturate" values="0.1" />
          <feComponentTransfer>
            <feFuncA
              type="discrete"
              tableValues="0 0 0 0 .02 .04 .06 .04 .02 .04 .06 .04 .02 .04 .06 .08"
            />
          </feComponentTransfer>
        </filter>
      </defs>

      <rect width="100%" height="100%" fill="#bda98a" />

      <rect width="100%" height="100%" fill="url(#khakiBase)" />

      <rect width="100%" height="100%" fill="url(#khakiHighlight)" />

      <rect width="100%" height="100%" fill="url(#khakiGlow)" />

      <rect
        width="100%"
        height="100%"
        fill="#b09d7f"
        opacity="0.4"
        filter="url(#premiumMatte)"
      />

      <rect
        width="100%"
        height="100%"
        fill="#c3b091"
        opacity="0.3"
        filter="url(#silkTexture)"
      />

      <rect width="100%" height="100%" fill="#d4c4a8" opacity="0.08" />
    </svg>
  );
};

export default KhakiBackgroundSVG;