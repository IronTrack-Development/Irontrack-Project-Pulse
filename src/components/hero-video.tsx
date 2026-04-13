"use client";

import { useState, useRef } from "react";

export default function HeroVideo() {
  const [introEnded, setIntroEnded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleEnded = () => {
    // Pause on last frame — don't restart
    if (videoRef.current) {
      videoRef.current.pause();
    }
    // Fade in the pulse overlay
    setIntroEnded(true);
  };

  return (
    <div className="w-full bg-[#0B0B0D] relative" style={{ height: 'calc(100vh - 65px)' }}>
      {/* Main video — plays once, pauses on last frame */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
        className="w-full h-full object-contain block"
      >
        <source src="/hero-pulse.mp4" type="video/mp4" />
      </video>

      {/* Animated pulse overlay — appears after video ends */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none transition-opacity duration-1000"
        style={{
          opacity: introEnded ? 1 : 0,
          height: '18%',
        }}
      >
        <svg
          className="absolute bottom-[38%] left-0 w-[300%] h-12"
          viewBox="0 0 3000 48"
          preserveAspectRatio="none"
          style={{ animation: 'pulseScroll 3s linear infinite' }}
        >
          <defs>
            <linearGradient id="pulseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0" />
              <stop offset="20%" stopColor="#F97316" stopOpacity="0.6" />
              <stop offset="35%" stopColor="#FBBF24" stopOpacity="1" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="65%" stopColor="#FBBF24" stopOpacity="1" />
              <stop offset="80%" stopColor="#F97316" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
            </linearGradient>
            <filter id="pulseGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <polyline
            points="0,24 100,24 200,24 250,24 270,18 285,28 300,10 315,36 330,6 345,30 360,16 380,24 450,24 550,24 650,24 700,24 720,18 735,28 750,10 765,36 780,6 795,30 810,16 830,24 900,24 1000,24 1100,24 1150,24 1170,18 1185,28 1200,10 1215,36 1230,6 1245,30 1260,16 1280,24 1350,24 1450,24 1550,24 1600,24 1620,18 1635,28 1650,10 1665,36 1680,6 1695,30 1710,16 1730,24 1800,24 1900,24 2000,24 2050,24 2070,18 2085,28 2100,10 2115,36 2130,6 2145,30 2160,16 2180,24 2250,24 2350,24 2450,24 2500,24 2520,18 2535,28 2550,10 2565,36 2580,6 2595,30 2610,16 2630,24 2700,24 2800,24 3000,24"
            fill="none"
            stroke="url(#pulseGrad)"
            strokeWidth="2.5"
            filter="url(#pulseGlow)"
          />
        </svg>
      </div>

      <style>{`
        @keyframes pulseScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
      `}</style>
    </div>
  );
}
