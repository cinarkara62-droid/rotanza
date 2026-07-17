// Rough, clearly-labeled estimates only — there is no real transit/taxi
// pricing or timing API wired up. Deterministic per from/to pair (same
// hashing approach as estimateNightlyRate in budget.ts) so a given route
// always shows the same numbers instead of reshuffling on every render,
// and biased so metro < bus on cost and taxi < metro on duration —
// matching the fixed "Cheapest" / "Best for Luggage" / "Fastest" badges.
function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

export interface TransportOptionEstimate {
  durationMinutes: number;
  costUsd: number;
}

export interface TransportComparisonEstimate {
  metro: TransportOptionEstimate;
  bus: TransportOptionEstimate;
  taxi: TransportOptionEstimate;
}

export function estimateTransportOptions(from: string, to: string): TransportComparisonEstimate {
  const h = hash(`${from.trim().toLowerCase()}|${to.trim().toLowerCase()}`);

  const metroDuration = 20 + (h % 15); // 20-34 min
  const metroCost = 2 + (h % 3); // $2-4

  const busDuration = metroDuration + 15 + (h % 10); // slower than metro
  const busCost = Math.max(1, metroCost - 1); // slightly cheaper

  const taxiDuration = Math.max(8, metroDuration - 10 - (h % 8)); // fastest
  const taxiCost = 15 + (h % 25); // priciest

  return {
    metro: { durationMinutes: metroDuration, costUsd: metroCost },
    bus: { durationMinutes: busDuration, costUsd: busCost },
    taxi: { durationMinutes: taxiDuration, costUsd: taxiCost },
  };
}
