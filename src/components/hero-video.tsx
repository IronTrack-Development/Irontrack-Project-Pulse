"use client";

export default function HeroVideo() {
  return (
    <video
      autoPlay
      muted
      playsInline
      className="hidden md:block absolute inset-0 w-full h-full object-cover opacity-20"
      onEnded={(e) => { 
        e.currentTarget.style.opacity = '0.1';
      }}
    >
      <source src="/crane.mp4" type="video/mp4" />
    </video>
  );
}
