export default function HeroVideo() {
  return (
    <div className="w-full bg-[#0B0B0D] flex items-center justify-center overflow-hidden" style={{ height: 'calc(100vh - 65px)' }}>
      <video
        autoPlay
        muted
        playsInline
        className="w-full h-auto block max-h-[calc(100vh-65px)]"
      >
        <source src="/hero-pulse.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
