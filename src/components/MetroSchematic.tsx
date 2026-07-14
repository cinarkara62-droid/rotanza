import { MetroLine } from "@/lib/types";
import { projectLines } from "@/lib/geo-projection";

const FALLBACK_PALETTE = [
  "#14ab89", "#e3051c", "#0064b0", "#ff9500", "#8e1d8c",
  "#00933c", "#b933ad", "#996633", "#a7a9ac", "#fccc0a",
];

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

interface LabelCandidate {
  key: string;
  name: string;
  x: number;
  y: number;
  bold: boolean;
}

interface PlacedLabel extends LabelCandidate {
  anchor: "start" | "middle" | "end";
  lx: number;
  ly: number;
}

// Simple greedy collision avoidance: try a few positions around each dot
// (top, bottom, right, left) and skip the label entirely — keeping only the
// dot — if none of them fit without overlapping an already-placed label.
// Dense interchange clusters would otherwise pile labels on top of each other.
function placeLabels(candidates: LabelCandidate[]): PlacedLabel[] {
  const charWidth = 4.7;
  const placed: PlacedLabel[] = [];
  const boxes: Box[] = [];

  const sorted = [...candidates].sort((a, b) => (b.bold ? 1 : 0) - (a.bold ? 1 : 0));

  for (const c of sorted) {
    const textW = c.name.length * charWidth;
    const textH = 10;
    const options: Array<{ anchor: PlacedLabel["anchor"]; lx: number; ly: number; box: Box }> = [
      { anchor: "middle", lx: c.x, ly: c.y - 9, box: { x: c.x - textW / 2, y: c.y - 9 - textH, w: textW, h: textH } },
      { anchor: "middle", lx: c.x, ly: c.y + 16, box: { x: c.x - textW / 2, y: c.y + 16 - textH, w: textW, h: textH } },
      { anchor: "start", lx: c.x + 8, ly: c.y + 3, box: { x: c.x + 8, y: c.y + 3 - textH, w: textW, h: textH } },
      { anchor: "end", lx: c.x - 8, ly: c.y + 3, box: { x: c.x - 8 - textW, y: c.y + 3 - textH, w: textW, h: textH } },
    ];

    const fit = options.find((opt) => !boxes.some((b) => overlaps(b, opt.box)));
    if (!fit) continue;
    boxes.push(fit.box);
    placed.push({ ...c, anchor: fit.anchor, lx: fit.lx, ly: fit.ly });
  }

  return placed;
}

// Real station coordinates projected onto a shared map, so lines cross and
// branch exactly where they really do — this is our own rendering of real
// OSM data, not a copy of any official transit map's artwork.
export function MetroSchematic({ lines, locale }: { lines: MetroLine[]; locale: string }) {
  const isTr = locale === "tr";
  const { lines: projected, width, height, interchanges } = projectLines(lines, 900, 1000, 56);

  if (projected.length === 0) {
    return (
      <p className="text-sm text-brand-950/50">
        {isTr ? "Bu hatlar için konum verisi bulunamadı." : "No coordinate data found for these lines."}
      </p>
    );
  }

  const labelCandidates = new Map<string, LabelCandidate>();
  for (const line of projected) {
    line.stations.forEach((s, si) => {
      const isTerminus = si === 0 || si === line.stations.length - 1;
      const isInterchange = interchanges.has(s.name);
      if (!isTerminus && !isInterchange) return;
      if (!labelCandidates.has(s.name)) {
        labelCandidates.set(s.name, { key: s.name, name: s.name, x: s.x, y: s.y, bold: isInterchange });
      }
    });
  }
  const placedLabels = placeLabels([...labelCandidates.values()]);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={isTr ? "Metro hat şeması" : "Metro line schematic"}>
        {projected.map((line, i) => {
          const color = line.color || FALLBACK_PALETTE[i % FALLBACK_PALETTE.length];
          const pathD = line.stations.map((s, si) => `${si === 0 ? "M" : "L"} ${s.x.toFixed(1)} ${s.y.toFixed(1)}`).join(" ");
          return (
            <g key={line.ref + i}>
              <path d={pathD} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
              {line.stations.map((s, si) => {
                const isInterchange = interchanges.has(s.name);
                if (!isInterchange) return <circle key={s.name + si} cx={s.x} cy={s.y} r={2.2} fill={color} />;
                return (
                  <circle
                    key={s.name + si}
                    cx={s.x}
                    cy={s.y}
                    r={6}
                    fill="white"
                    stroke="#10201c"
                    strokeWidth={2.5}
                  />
                );
              })}
            </g>
          );
        })}

        {placedLabels.map((l) => (
          <text
            key={l.key}
            x={l.lx}
            y={l.ly}
            fontSize="9"
            textAnchor={l.anchor}
            className="fill-brand-950/70 font-sans"
            fontWeight={l.bold ? 700 : 400}
          >
            {l.name}
          </text>
        ))}
      </svg>

      <div className="mt-4 space-y-3">
        {lines.map((line, i) => {
          const color = line.color || FALLBACK_PALETTE[i % FALLBACK_PALETTE.length];
          return (
            <div key={line.ref + i} className="flex items-start gap-2.5">
              <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-brand-950">
                  {line.ref}
                  {line.name && line.name !== line.ref ? ` — ${line.name}` : ""}
                  <span className="ms-2 text-xs font-normal text-brand-950/40">
                    {line.stations.length} {isTr ? "istasyon" : "stations"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-brand-950/50">
                  {line.stations.map((s) => s.name).join(" · ")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
