export default function HeroVideo() {
  return (
    <div className="w-full bg-[#0B0B0D] h-[50vh] md:h-[calc(100vh-65px)]">
      <video
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover block"
      >
        <source src="/hero-pulse.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
