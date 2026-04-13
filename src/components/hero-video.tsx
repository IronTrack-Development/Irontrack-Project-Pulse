"use client";

import { useState, useRef } from "react";

export default function HeroVideo() {
  const [introEnded, setIntroEnded] = useState(false);
  const introRef = useRef<HTMLVideoElement>(null);

  const handleIntroEnded = () => {
    if (introRef.current) {
      introRef.current.pause();
    }
    setIntroEnded(true);
  };

  return (
    <div className="w-full bg-[#0B0B0D] relative" style={{ height: 'calc(100vh - 65px)' }}>
      {/* Layer 1: Dashboard video — loops forever underneath */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-contain block transition-opacity duration-1000 ${
          introEnded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <source src="/hero-dashboard.mp4" type="video/mp4" />
      </video>

      {/* Layer 2: Clean text overlays on top of dashboard video */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
          introEnded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* HUD Callout: 2 Days Behind */}
        <div
          className="absolute"
          style={{ top: '45%', left: '8%' }}
        >
          <div className="bg-black/50 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2.5 text-center">
            <div className="text-white text-sm font-medium tracking-wide" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
              2 Days Behind
            </div>
          </div>
        </div>

        {/* HUD Callout: 60% Complete */}
        <div
          className="absolute"
          style={{ top: '32%', left: '41%' }}
        >
          <div className="bg-black/50 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2.5 text-center relative">
            <div className="text-white text-sm font-medium tracking-wide" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
              <span className="font-bold">60%</span> Complete
            </div>
            {/* Chevron */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-white/30" />
          </div>
        </div>

        {/* HUD Callout: Inspection Tomorrow */}
        <div
          className="absolute"
          style={{ top: '35%', left: '66%' }}
        >
          <div className="bg-black/50 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2.5 text-center relative">
            <div className="text-white text-sm font-medium tracking-wide" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
              Inspection Tomorrow
            </div>
            {/* Chevron */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-white/30" />
          </div>
        </div>

        {/* IRONTRACK title */}
        <div
          className="absolute left-1/2 -translate-x-1/2 text-center"
          style={{ bottom: '14%' }}
        >
          <h2
            className="text-white font-black tracking-[0.15em] uppercase"
            style={{
              fontSize: 'clamp(2rem, 5vw, 4.5rem)',
              textShadow: '0 0 20px rgba(249,115,22,0.4), 0 2px 8px rgba(0,0,0,0.9)',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            IRONTRACK
          </h2>
        </div>

        {/* Animated pulse line */}
        <div
          className="absolute left-0 right-0 overflow-hidden h-8"
          style={{ bottom: '11.5%' }}
        >
          <svg
            className="w-[300%] h-full"
            viewBox="0 0 3000 32"
            preserveAspectRatio="none"
            style={{ animation: 'pulseScroll 3s linear infinite' }}
          >
            <defs>
              <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F97316" stopOpacity="0" />
                <stop offset="25%" stopColor="#F97316" stopOpacity="0.7" />
                <stop offset="45%" stopColor="#FBBF24" stopOpacity="1" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="55%" stopColor="#FBBF24" stopOpacity="1" />
                <stop offset="75%" stopColor="#F97316" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
              </linearGradient>
              <filter id="pg2">
                <feGaussianBlur stdDeviation="1.5" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {/* Flat base line */}
            <line x1="0" y1="16" x2="3000" y2="16" stroke="#F97316" strokeWidth="1.5" strokeOpacity="0.3" />
            {/* Pulse heartbeat */}
            <polyline
              points="0,16 200,16 300,16 340,16 355,10 365,20 375,4 385,26 395,2 405,22 415,10 430,16 530,16 630,16 730,16 770,16 785,10 795,20 805,4 815,26 825,2 835,22 845,10 860,16 960,16 1060,16 1160,16 1200,16 1215,10 1225,20 1235,4 1245,26 1255,2 1265,22 1275,10 1290,16 1390,16 1490,16 1590,16 1630,16 1645,10 1655,20 1665,4 1675,26 1685,2 1695,22 1705,10 1720,16 1820,16 1920,16 2020,16 2060,16 2075,10 2085,20 2095,4 2105,26 2115,2 2125,22 2135,10 2150,16 2250,16 2350,16 2450,16 2490,16 2505,10 2515,20 2525,4 2535,26 2545,2 2555,22 2565,10 2580,16 2680,16 2780,16 3000,16"
              fill="none"
              stroke="url(#pg)"
              strokeWidth="2"
              filter="url(#pg2)"
            />
          </svg>
        </div>

        {/* FEEL THE PULSE OF YOUR PROJECT */}
        <div
          className="absolute left-1/2 -translate-x-1/2 text-center"
          style={{ bottom: '7%' }}
        >
          <p
            className="text-white/90 font-bold tracking-[0.25em] uppercase"
            style={{
              fontSize: 'clamp(0.6rem, 1.5vw, 1.1rem)',
              textShadow: '0 1px 6px rgba(0,0,0,0.9)',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            FEEL THE PULSE OF YOUR PROJECT
          </p>
        </div>
      </div>

      {/* Layer 3: Intro video — plays once on top of everything, then fades out */}
      <video
        ref={introRef}
        autoPlay
        muted
        playsInline
        onEnded={handleIntroEnded}
        className={`absolute inset-0 w-full h-full object-contain block transition-opacity duration-1500 ${
          introEnded ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ zIndex: 10 }}
      >
        <source src="/hero-pulse.mp4" type="video/mp4" />
      </video>

      <style>{`
        @keyframes pulseScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
      `}</style>
    </div>
  );
}
