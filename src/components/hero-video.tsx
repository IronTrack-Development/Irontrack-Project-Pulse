"use client";

export default function HeroVideo() {
  return (
    <video
      autoPlay
      muted
      playsInline
      className="hidden md:block absolute inset-0 w-full h-full object-cover opacity-50"
      onEnded={(e) => { 
        e.currentTarget.style.opacity = '0.3';
      }}
    >
      <source src="/crane.mp4" type="video/mp4" />
    </video>
  );
}
