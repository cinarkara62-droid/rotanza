import { AmbientBackground } from "@/components/AmbientBackground";
import { scatterDots } from "@/lib/bg-pattern";

interface Blob {
  x: string;
  y: string;
  size: number;
  delay: string;
  duration: string;
}

// Generic themed ambient background for pages that don't need a fully
// bespoke motif (see TransportHeroBackground / RestaurantsPageBackground /
// ReservationsPageBackground for the bespoke ones). Still page-specific via
// gradient tint, dot color, and blob color/positions passed in per page.
export function PageBackground({
  gradientClassName,
  dotColor,
  dotSeedA,
  dotSeedB,
  blobs,
  blobColorClass,
}: {
  gradientClassName: string;
  dotColor: string;
  dotSeedA: number;
  dotSeedB: number;
  blobs: Blob[];
  blobColorClass: string;
}) {
  const dots = scatterDots(14, 8, dotSeedA, dotSeedB);
  return (
    <AmbientBackground gradientClassName={gradientClassName}>
      <svg
        viewBox="0 0 1000 500"
        className="absolute inset-0 h-full w-full opacity-[0.05]"
        preserveAspectRatio="xMidYMid slice"
      >
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={1.3} fill={dotColor} />
        ))}
      </svg>
      {blobs.map((b, i) => (
        <div
          key={i}
          className={`absolute animate-steam-rise rounded-full bg-gradient-to-br ${blobColorClass} blur-3xl`}
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
