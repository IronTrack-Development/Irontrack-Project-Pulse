"use client";

export default function HeroVideo() {
  return (
    <div className="w-full bg-[#0B0B0D] relative" style={{ height: 'calc(100vh - 65px)' }}>
      {/* Video layer */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover block"
      >
        <source src="/hero-pulse.mp4" type="video/mp4" />
      </video>

      {/* Animated pulse line overlay — bottom of screen */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#F97316]/20" />
        
        {/* SVG pulse line */}
        <svg
          className="absolute bottom-0 left-0 w-[200%] h-24"
          viewBox="0 0 2000 96"
          preserveAspectRatio="none"
          style={{ animation: 'pulseScroll 4s linear infinite' }}
        >
          <defs>
            <linearGradient id="pulseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0" />
              <stop offset="30%" stopColor="#F97316" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#FBBF24" stopOpacity="1" />
              <stop offset="70%" stopColor="#F97316" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
            </linearGradient>
            <filter id="pulseGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <polyline
            points="0,80 80,80 120,80 140,60 160,85 180,40 200,90 220,20 240,80 260,80 300,80 380,80 420,80 440,60 460,85 480,40 500,90 520,20 540,80 560,80 600,80 680,80 720,80 740,60 760,85 780,40 800,90 820,20 840,80 860,80 900,80 980,80 1020,80 1040,60 1060,85 1080,40 1100,90 1120,20 1140,80 1160,80 1200,80 1280,80 1320,80 1340,60 1360,85 1380,40 1400,90 1420,20 1440,80 1460,80 1500,80 1580,80 1620,80 1640,60 1660,85 1680,40 1700,90 1720,20 1740,80 1760,80 2000,80"
            fill="none"
            stroke="url(#pulseGrad)"
            strokeWidth="3"
            filter="url(#pulseGlow)"
          />
        </svg>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes pulseScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
