"use client";

export default function HeroVideo() {
  return (
    <div className="w-full max-w-5xl mx-auto px-6 pt-8 md:pt-12">
      <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-[#F97316]/10 border border-[#1F1F25]">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-auto block"
        >
          <source src="/hero-pulse.mp4" type="video/mp4" />
        </video>
        {/* Subtle bottom fade into page background */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0B0B0D] to-transparent" />
      </div>
    </div>
  );
}
