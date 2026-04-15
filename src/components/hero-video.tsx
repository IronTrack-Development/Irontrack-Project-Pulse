export default function HeroVideo() {
  return (
    <div className="w-full bg-[#0B0B0D]">
      <video
        autoPlay
        muted
        playsInline
        className="w-full h-auto block max-h-[40vh] md:max-h-[calc(100vh-65px)] object-contain md:object-cover"
      >
        <source src="/hero-pulse.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
