import { AmbientBackground } from "@/components/AmbientBackground";

// Purely decorative, full-page ambient background for the transport page.
// Dot positions are deterministic (no Math.random at render) so
// server/client markup match.
function continentDots(): { x: number; y: number }[] {
  const regions: Array<{ x0: number; x1: number; y0: number; y1: number; count: number }> = [
    { x0: 90, x1: 260, y0: 90, y1: 210, count: 26 }, // North America
    { x0: 190, x1: 260, y0: 230, y1: 380, count: 16 }, // South America
    { x0: 440, x1: 520, y0: 70, y1: 150, count: 14 }, // Europe
    { x0: 430, x1: 540, y0: 150, y1: 320, count: 18 }, // Africa
    { x0: 560, x1: 830, y0: 60, y1: 260, count: 34 }, // Asia
    { x0: 780, x1: 880, y0: 300, y1: 360, count: 10 }, // Australia
  ];
  const dots: { x: number; y: number }[] = [];
  regions.forEach((r, ri) => {
    for (let i = 0; i < r.count; i++) {
      const jitterX = ((i * 37 + ri * 11) % 17) - 8;
      const jitterY = ((i * 23 + ri * 7) % 13) - 6;
      const t = i / r.count;
      dots.push({
        x: r.x0 + t * (r.x1 - r.x0) + jitterX,
        y: r.y0 + ((i * 53) % (r.y1 - r.y0)) + jitterY * 0.4,
      });
    }
  });
  return dots;
}

const CITIES = [
  { name: "New York", lon: -74, lat: 40.7 },
  { name: "Paris", lon: 2.35, lat: 48.85 },
  { name: "London", lon: -0.13, lat: 51.5 },
  { name: "Istanbul", lon: 28.98, lat: 41.0 },
  { name: "Tokyo", lon: 139.7, lat: 35.7 },
  { name: "Singapore", lon: 103.8, lat: 1.35 },
  { name: "Sydney", lon: 151.2, lat: -33.87 },
];

function project(lon: number, lat: number) {
  return { x: ((lon + 180) / 360) * 1000, y: ((90 - lat) / 180) * 500 };
}

const ROUTES: [string, string][] = [
  ["New York", "London"],
  ["London", "Paris"],
  ["Paris", "Istanbul"],
  ["Istanbul", "Tokyo"],
  ["Tokyo", "Singapore"],
  ["Singapore", "Sydney"],
  ["New York", "Paris"],
];

function arcPath(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2;
  const lift = Math.min(70, Math.abs(b.x - a.x) * 0.18 + 20);
  const my = (a.y + b.y) / 2 - lift;
  return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
}

const DOTS = continentDots();
const POINTS = Object.fromEntries(CITIES.map((c) => [c.name, project(c.lon, c.lat)]));

export function TransportHeroBackground() {
  return (
    <AmbientBackground gradientClassName="bg-gradient-to-br from-[#0a1a2e] via-[#0d2136] to-[#0a1830]">
      <div className="absolute left-1/2 top-16 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-300/30 via-white/0 to-white/0 blur-3xl" />

      <svg
        viewBox="0 0 1000 500"
        className="absolute inset-0 h-full w-full opacity-[0.07]"
        preserveAspectRatio="xMidYMid slice"
      >
        {DOTS.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={1.3} fill="#34acf7" />
        ))}
      </svg>

      <svg viewBox="0 0 1000 500" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="transport-hero-glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="1.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {ROUTES.map(([a, b], i) => {
          const d = arcPath(POINTS[a], POINTS[b]);
          return (
            <g key={`${a}-${b}`}>
              <path d={d} stroke="#34acf7" strokeWidth={0.6} fill="none" opacity={0.18} />
              <circle r={2.1} fill="#34acf7" opacity={0.75} filter="url(#transport-hero-glow)">
                <animateMotion dur={`${9 + i * 1.7}s`} repeatCount="indefinite" path={d} />
              </circle>
            </g>
          );
        })}

        {CITIES.map((c) => {
          const p = POINTS[c.name];
          return (
            <circle
              key={c.name}
              cx={p.x}
              cy={p.y}
              r={2}
              fill="#12a0ef"
              opacity={0.45}
              filter="url(#transport-hero-glow)"
            />
          );
        })}
      </svg>
    </AmbientBackground>
  );
}
