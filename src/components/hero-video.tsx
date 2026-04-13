export default function HeroVideo() {
  return (
    <div className="w-full bg-[#0B0B0D]" style={{ height: 'calc(100vh - 65px)' }}>
      <video
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover block"
        style={{ objectPosition: 'center 40%' }}
      >
        <source src="/hero-pulse.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
