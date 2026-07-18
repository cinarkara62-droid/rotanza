"use client";

import { AmbientBackground } from "@/components/AmbientBackground";
import { scatterDots } from "@/lib/bg-pattern";
import { useTheme } from "@/components/ThemeProvider";

// Warm, food-appropriate counterpart to TransportHeroBackground — same
// ambient technique (fixed, full-page, pointer-events-none) but themed
// around a scattered fork/plate/cup line-art pattern and softly rising
// "steam" blobs instead of the travel-route motif.
const STEAM_BLOBS = [
  { x: "12%", y: "18%", size: 220, delay: "0s", duration: "14s" },
  { x: "78%", y: "8%", size: 260, delay: "2.5s", duration: "17s" },
  { x: "88%", y: "62%", size: 200, delay: "1s", duration: "15s" },
  { x: "6%", y: "70%", size: 240, delay: "4s", duration: "18s" },
  { x: "45%", y: "38%", size: 180, delay: "3s", duration: "16s" },
];

const DOTS = scatterDots(14, 8, 31, 29);

// Deterministic placements for the three line-art motifs, spread across
// the canvas so no two overlap and the whole thing still reads as a loose
// repeating pattern rather than a cluster.
const FORKS = [
  { x: 90, y: 70, r: -12 },
  { x: 430, y: 260, r: 8 },
  { x: 760, y: 90, r: -6 },
  { x: 220, y: 400, r: 14 },
  { x: 900, y: 340, r: -10 },
];
const PLATES = [
  { x: 300, y: 120, r: 0 },
  { x: 610, y: 380, r: 0 },
  { x: 60, y: 300, r: 0 },
  { x: 860, y: 150, r: 0 },
];
const CUPS = [
  { x: 500, y: 60, r: 0 },
  { x: 150, y: 200, r: 0 },
  { x: 700, y: 430, r: 0 },
  { x: 950, y: 230, r: 0 },
];

function Fork({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`} stroke={color} strokeWidth={1.4} strokeLinecap="round" fill="none">
      <line x1={-5} y1={-14} x2={-5} y2={-4} />
      <line x1={0} y1={-14} x2={0} y2={-4} />
      <line x1={5} y1={-14} x2={5} y2={-4} />
      <path d="M -6 -4 Q 0 2 6 -4 L 0 18 Z" />
    </g>
  );
}

function Plate({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={color} strokeWidth={1.4} fill="none">
      <circle r={14} />
      <circle r={9} />
    </g>
  );
}

function Cup({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={color} strokeWidth={1.4} fill="none" strokeLinecap="round">
      <path d="M -10 -8 L -9 10 Q -9 14 -5 14 L 5 14 Q 9 14 9 10 L 10 -8 Z" />
      <path d="M 10 -4 Q 18 -4 18 3 Q 18 9 10 8" />
    </g>
  );
}

export function RestaurantsPageBackground() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const gradient = isDark
    ? "bg-gradient-to-br from-[#171018] via-[#1c1520] to-[#14101a]"
    : "bg-gradient-to-br from-[#fdf3ee] via-[#faf6f0] to-[#fdf0ec]";
  const lineColor = isDark ? "#ff8a5c" : "#f2632f";

  return (
    <AmbientBackground gradientClassName={gradient}>
      <svg
        viewBox="0 0 1000 500"
        className="absolute inset-0 h-full w-full opacity-[0.05]"
        preserveAspectRatio="xMidYMid slice"
      >
        {DOTS.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={1.3} fill={lineColor} />
        ))}
      </svg>

      <svg
        viewBox="0 0 1000 500"
        className="absolute inset-0 h-full w-full opacity-[0.09]"
        preserveAspectRatio="xMidYMid slice"
      >
        {FORKS.map((f, i) => (
          <Fork key={`fork-${i}`} {...f} color={lineColor} />
        ))}
        {PLATES.map((p, i) => (
          <Plate key={`plate-${i}`} {...p} color={lineColor} />
        ))}
        {CUPS.map((c, i) => (
          <Cup key={`cup-${i}`} {...c} color={lineColor} />
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
