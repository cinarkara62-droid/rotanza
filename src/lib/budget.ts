export type AccommodationLevel = "budget" | "midrange" | "luxury";
export type MealsLevel = "budget" | "midrange" | "luxury";
export type TransportLevel = "budget" | "midrange" | "luxury";
export type ActivitiesLevel = "light" | "moderate" | "packed";

const ACCOMMODATION_RATE: Record<AccommodationLevel, number> = { budget: 25, midrange: 70, luxury: 180 };
const MEALS_RATE: Record<MealsLevel, number> = { budget: 15, midrange: 35, luxury: 80 };
const TRANSPORT_RATE: Record<TransportLevel, number> = { budget: 5, midrange: 15, luxury: 40 };
const ACTIVITIES_RATE: Record<ActivitiesLevel, number> = { light: 10, moderate: 25, packed: 50 };

export interface BudgetInput {
  dailyCostIndex: number;
  travelers: number;
  days: number;
  accommodation: AccommodationLevel;
  meals: MealsLevel;
  transportStyle: TransportLevel;
  activities: ActivitiesLevel;
}

export interface BudgetResult {
  accommodation: number;
  food: number;
  transport: number;
  activities: number;
  misc: number;
  total: number;
  perDay: number;
}

// Rough, clearly-labeled estimate only — OpenStreetMap has no pricing data.
// Varies deterministically per hotel name so a list doesn't show identical
// numbers; swap for a real quote once a hotel pricing API is connected.
export function estimateNightlyRate(dailyCostIndex: number, seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const variance = 0.8 + (hash % 100) / 250; // 0.8x – 1.2x
  return Math.round(ACCOMMODATION_RATE.midrange * dailyCostIndex * variance);
}

export function calculateBudget(input: BudgetInput): BudgetResult {
  const { dailyCostIndex, travelers, days, accommodation, meals, transportStyle, activities } = input;
  const rooms = Math.max(1, Math.ceil(travelers / 2));

  const accommodationCost = ACCOMMODATION_RATE[accommodation] * dailyCostIndex * rooms * days;
  const foodCost = MEALS_RATE[meals] * dailyCostIndex * travelers * days;
  const transportCost = TRANSPORT_RATE[transportStyle] * dailyCostIndex * travelers * days;
  const activitiesCost = ACTIVITIES_RATE[activities] * dailyCostIndex * travelers * days;

  const subtotal = accommodationCost + foodCost + transportCost + activitiesCost;
  const misc = subtotal * 0.08;
  const total = subtotal + misc;

  return {
    accommodation: Math.round(accommodationCost),
    food: Math.round(foodCost),
    transport: Math.round(transportCost),
    activities: Math.round(activitiesCost),
    misc: Math.round(misc),
    total: Math.round(total),
    perDay: Math.round(total / Math.max(1, days)),
  };
}
