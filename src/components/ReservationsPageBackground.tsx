"use client";

import { AmbientBackground } from "@/components/AmbientBackground";
import { scatterDots } from "@/lib/bg-pattern";
import { useTheme } from "@/components/ThemeProvider";

// Teal-themed ambient background for the reservations page — a scattered
// "ticket stub" line-art motif (rounded rect + dashed perforation + a
// small circle notch) instead of the transport/restaurants motifs, so each
// page reads distinctly while sharing the same visual language.
const DOTS = scatterDots(14, 8, 19, 41);

const TICKETS = [
  { x: 110, y: 90, r: -8 },
  { x: 430, y: 300, r: 6 },
  { x: 780, y: 110, r: -5 },
  { x: 250, y: 420, r: 10 },
  { x: 880, y: 350, r: -7 },
  { x: 560, y: 60, r: 4 },
];

function TicketStub({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`} stroke={color} strokeWidth={1.3} fill="none">
      <rect x={-24} y={-14} width={48} height={28} rx={4} />
      <circle cx={0} cy={-14} r={2.4} fill={color} stroke="none" />
      <circle cx={0} cy={14} r={2.4} fill={color} stroke="none" />
      <line x1={0} y1={-9} x2={0} y2={9} strokeDasharray="2 3" />
    </g>
  );
}

const GLOW_BLOBS = [
  { x: "10%", y: "12%", size: 260, delay: "0s", duration: "16s" },
  { x: "82%", y: "16%", size: 220, delay: "2s", duration: "18s" },
  { x: "88%", y: "68%", size: 240, delay: "1.5s", duration: "15s" },
  { x: "8%", y: "72%", size: 200, delay: "3.5s", duration: "17s" },
];

export function ReservationsPageBackground() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const gradient = isDark
    ? "bg-gradient-to-br from-[#0a1a2e] via-[#0d2136] to-[#0a1830]"
    : "bg-gradient-to-br from-[#e9f6f1] via-[#f4f8f6] to-[#eaf1f5]";
  const lineColor = isDark ? "#34acf7" : "#0a6f5d";

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
        className="absolute inset-0 h-full w-full opacity-[0.08]"
        preserveAspectRatio="xMidYMid slice"
      >
        {TICKETS.map((t, i) => (
          <TicketStub key={i} {...t} color={lineColor} />
        ))}
      </svg>

      {GLOW_BLOBS.map((b, i) => (
        <div
          key={i}
          className="absolute animate-steam-rise rounded-full bg-gradient-to-br from-brand-300/25 via-brand-300/5 to-white/0 blur-3xl"
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
