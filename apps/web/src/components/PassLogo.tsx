import React from "react";

interface PassLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showSubtitle?: boolean;
  className?: string;
}

export function PassLogo({ size = "md", showSubtitle = true, className = "" }: PassLogoProps) {
  const textSizes = {
    sm: "text-2xl font-black",
    md: "text-4xl font-black",
    lg: "text-6xl font-black",
    xl: "text-7xl md:text-9xl font-black",
  };

  const subtitleSizes = {
    sm: "text-[8px] tracking-[0.25em]",
    md: "text-[10px] tracking-[0.35em]",
    lg: "text-xs tracking-[0.45em]",
    xl: "text-xs md:text-sm tracking-[0.5em]",
  };

  return (
    <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
      <div className="relative inline-flex items-center justify-center py-2 px-6">
        {/* Anel Orbital 3D da Imagem Oficial de Referência */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
          viewBox="0 0 320 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="passOrbitRefGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <filter id="passOrbitalGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Elipse Curvada da Órbita PASS */}
          <ellipse
            cx="160"
            cy="54"
            rx="145"
            ry="28"
            stroke="url(#passOrbitRefGrad)"
            strokeWidth="4.5"
            filter="url(#passOrbitalGlow)"
            transform="rotate(-8 160 54)"
          />

          {/* Esfera Satélite em Destaque no Topo da Órbita */}
          <circle cx="288" cy="36" r="6" fill="#00f0ff" filter="url(#passOrbitalGlow)" />
          <circle cx="288" cy="36" r="3.5" fill="#ffffff" />
        </svg>

        {/* Tipografia Tridimensional PASS */}
        <span
          className={`relative z-10 font-black text-white ${textSizes[size]}`}
          style={{
            fontFamily: "var(--font-outfit), var(--font-inter), system-ui, sans-serif",
            letterSpacing: "-0.04em",
            textShadow: "0 4px 20px rgba(0, 240, 255, 0.35)",
          }}
        >
          PASS
        </span>
      </div>

      {showSubtitle && (
        <span
          className={`text-white font-semibold uppercase opacity-95 mt-0.5 transition-all ${subtitleSizes[size]}`}
          style={{ letterSpacing: "0.45em" }}
        >
          A NOVA ÓRBITA DOS EVENTOS
        </span>
      )}
    </div>
  );
}
