import { PointOfInterest, InterestTag } from "@/lib/types";
import rawAttractions from "@/lib/mock-data/generated/attractions.json";
import { restaurants } from "@/lib/mock-data/restaurants";

interface RawAttraction {
  osmId: number;
  name: string;
  lat: number;
  lon: number;
  categories: InterestTag[];
  emoji: string;
}

const attractionsByCity = rawAttractions as Record<string, RawAttraction[]>;

const CATEGORY_LABEL_TR: Record<InterestTag, string> = {
  history: "Tarih",
  food: "Yemek",
  nature: "Doğa",
  nightlife: "Gece hayatı",
  shopping: "Alışveriş",
  art: "Sanat",
};
const CATEGORY_LABEL_EN: Record<InterestTag, string> = {
  history: "History",
  food: "Food",
  nature: "Nature",
  nightlife: "Nightlife",
  shopping: "Shopping",
  art: "Art",
};

function slotFor(categories: InterestTag[], index: number): "morning" | "afternoon" | "evening" {
  if (categories.includes("nightlife")) return "evening";
  return (["morning", "afternoon", "evening"] as const)[index % 3];
}

function buildCityPois(cityId: string): PointOfInterest[] {
  const attractions = (attractionsByCity[cityId] ?? []).map((a, i) => ({
    id: `poi-${cityId}-${a.osmId}`,
    cityId,
    nameTr: a.name,
    nameEn: a.name,
    descTr: a.categories.map((c) => CATEGORY_LABEL_TR[c]).join(" · "),
    descEn: a.categories.map((c) => CATEGORY_LABEL_EN[c]).join(" · "),
    tags: a.categories,
    slot: slotFor(a.categories, i),
    emoji: a.emoji,
  }));

  const cityRestaurants = restaurants.filter((r) => r.cityId === cityId).slice(0, 20);
  const foodPois = cityRestaurants.map((r, i) => ({
    id: `poi-food-${cityId}-${r.osmId}`,
    cityId,
    nameTr: r.name,
    nameEn: r.name,
    descTr: r.cuisineTr,
    descEn: r.cuisineEn,
    tags: ["food"] as InterestTag[],
    slot: (i % 2 === 0 ? "evening" : "afternoon") as "morning" | "afternoon" | "evening",
    emoji: r.emoji,
  }));

  return [...attractions, ...foodPois];
}

const CITY_IDS = [
  "istanbul", "paris", "rome", "tokyo", "barcelona", "london", "newyork", "amsterdam",
];

export const pois: PointOfInterest[] = CITY_IDS.flatMap(buildCityPois);

export function getPoisForCity(cityId: string) {
  return pois.filter((p) => p.cityId === cityId);
}
