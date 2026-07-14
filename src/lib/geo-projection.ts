import { MetroLine } from "@/lib/types";

export interface ProjectedStation {
  name: string;
  x: number;
  y: number;
}

export interface ProjectedLine extends Omit<MetroLine, "stations"> {
  stations: ProjectedStation[];
}

export interface ProjectionResult {
  lines: ProjectedLine[];
  width: number;
  height: number;
  interchanges: Map<string, ProjectedStation>;
}

// Equirectangular projection scaled to fit a shared viewBox, with a
// cos(latitude) correction so east–west distances aren't stretched. This is
// what makes real station coordinates naturally produce diagonal, crossing
// lines instead of a hand-drawn parallel-bars diagram.
export function projectLines(lines: MetroLine[], width = 720, height = 720, padding = 48): ProjectionResult {
  const allStations = lines.flatMap((l) => l.stations);
  if (allStations.length === 0) {
    return { lines: [], width, height, interchanges: new Map() };
  }

  const lats = allStations.map((s) => s.lat);
  const lons = allStations.map((s) => s.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const avgLatRad = ((minLat + maxLat) / 2) * (Math.PI / 180);
  const cosLat = Math.max(0.2, Math.cos(avgLatRad));

  const spanX = Math.max((maxLon - minLon) * cosLat, 0.0005);
  const spanY = Math.max(maxLat - minLat, 0.0005);
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const scale = Math.min(innerW / spanX, innerH / spanY);

  const usedW = spanX * scale;
  const usedH = spanY * scale;
  const offsetX = padding + (innerW - usedW) / 2;
  const offsetY = padding + (innerH - usedH) / 2;

  function project(lat: number, lon: number): { x: number; y: number } {
    const x = offsetX + (lon - minLon) * cosLat * scale;
    const y = offsetY + (maxLat - lat) * scale;
    return { x, y };
  }

  const stationCounts = new Map<string, number>();
  for (const line of lines) {
    const seenOnLine = new Set<string>();
    for (const s of line.stations) {
      if (seenOnLine.has(s.name)) continue;
      seenOnLine.add(s.name);
      stationCounts.set(s.name, (stationCounts.get(s.name) ?? 0) + 1);
    }
  }

  const interchanges = new Map<string, ProjectedStation>();
  const projectedLines: ProjectedLine[] = lines.map((line) => {
    const stations = line.stations.map((s) => {
      const { x, y } = project(s.lat, s.lon);
      const projected = { name: s.name, x, y };
      if ((stationCounts.get(s.name) ?? 0) >= 2 && !interchanges.has(s.name)) {
        interchanges.set(s.name, projected);
      }
      return projected;
    });
    return { ...line, stations };
  });

  return { lines: projectedLines, width, height, interchanges };
}
