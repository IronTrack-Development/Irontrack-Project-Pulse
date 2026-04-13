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
      {/* Dashboard video — loops forever, revealed after intro */}
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

      {/* Intro video — plays once, then fades out */}
      <video
        ref={introRef}
        autoPlay
        muted
        playsInline
        onEnded={handleIntroEnded}
        className={`absolute inset-0 w-full h-full object-contain block transition-opacity duration-[1500ms] ${
          introEnded ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{ zIndex: 10 }}
      >
        <source src="/hero-pulse.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
