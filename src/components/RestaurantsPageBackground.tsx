import { AmbientBackground } from "@/components/AmbientBackground";

// Warm, food-appropriate counterpart to TransportHeroBackground — same
// ambient technique (fixed, full-page, pointer-events-none) but themed
// around soft rising "steam" blobs and a warm coral tint instead of the
// travel-route motif. Deterministic layout (no Math.random) so
// server/client markup match.
const STEAM_BLOBS = [
  { x: "12%", y: "18%", size: 220, delay: "0s", duration: "14s" },
  { x: "78%", y: "8%", size: 260, delay: "2.5s", duration: "17s" },
  { x: "88%", y: "62%", size: 200, delay: "1s", duration: "15s" },
  { x: "6%", y: "70%", size: 240, delay: "4s", duration: "18s" },
  { x: "45%", y: "38%", size: 180, delay: "3s", duration: "16s" },
];

function scatterDots(): { x: number; y: number }[] {
  const dots: { x: number; y: number }[] = [];
  const cols = 14;
  const rows = 8;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const jitterX = ((row * 31 + col * 17) % 9) - 4;
      const jitterY = ((row * 13 + col * 29) % 9) - 4;
      dots.push({
        x: (col / (cols - 1)) * 1000 + jitterX,
        y: (row / (rows - 1)) * 500 + jitterY,
      });
    }
  }
  return dots;
}

const DOTS = scatterDots();

export function RestaurantsPageBackground() {
  return (
    <AmbientBackground gradientClassName="bg-gradient-to-br from-[#fdf3ee] via-[#faf6f0] to-[#fdf0ec]">
      <svg
        viewBox="0 0 1000 500"
        className="absolute inset-0 h-full w-full opacity-[0.05]"
        preserveAspectRatio="xMidYMid slice"
      >
        {DOTS.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={1.3} fill="#f2632f" />
        ))}
      </svg>

      {STEAM_BLOBS.map((b, i) => (
        <div
          key={i}
          className="absolute animate-steam-rise rounded-full bg-gradient-to-br from-coral-400/20 via-coral-400/5 to-white/0 blur-3xl"
          style={{
            left: b.x,
            top: b.y,
            width: b.size,
            height: b.size,
            animationDelay: b.delay,
            animationDuration: b.duration,
          }}
        />
      ))}
    </AmbientBackground>
  );
}
