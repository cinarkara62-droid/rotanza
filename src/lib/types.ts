export type InterestTag =
  | "history"
  | "food"
  | "nature"
  | "nightlife"
  | "shopping"
  | "art";

export type BudgetLevel = "economy" | "standard" | "luxury";

export interface City {
  id: string;
  countryTr: string;
  countryEn: string;
  cityTr: string;
  cityEn: string;
  emoji: string;
  currency: string;
  dailyCostIndex: number; // relative baseline, 1 = medium cost
}

export interface PointOfInterest {
  id: string;
  cityId: string;
  nameTr: string;
  nameEn: string;
  descTr: string;
  descEn: string;
  tags: InterestTag[];
  slot: "morning" | "afternoon" | "evening";
  emoji: string;
}

export interface Restaurant {
  id: string;
  cityId: string;
  osmId: number;
  name: string;
  cuisineTr: string;
  cuisineEn: string;
  address?: string;
  lat: number;
  lon: number;
  emoji: string;
}

export interface Hotel {
  id: string;
  cityId: string;
  osmId: number;
  name: string;
  stars?: number;
  address?: string;
  lat: number;
  lon: number;
  emoji: string;
}

export interface MetroStation {
  name: string;
  lat: number;
  lon: number;
}

export interface MetroLine {
  ref: string;
  name: string;
  color: string;
  stations: MetroStation[];
}

export interface TransportCity {
  cityId: string;
  systemName: string;
  lines: MetroLine[];
  tipsTr: string[];
  tipsEn: string[];
  ticketTr: string;
  ticketEn: string;
}

export interface PriceAlertItem {
  id: string;
  type: "hotel" | "flight";
  titleTr: string;
  titleEn: string;
  routeOrLocationTr: string;
  routeOrLocationEn: string;
  originalPrice: number;
  currentPrice: number;
  currency: string;
  history: number[];
  emoji: string;
  /** Stable source identifier (e.g. "osm:123456") the entity was picked from — never a free-typed string. */
  entityId?: string;
}

export interface Reservation {
  id: string;
  type: "flight" | "hotel" | "restaurant" | "activity";
  title: string;
  date: string;
  time?: string;
  confirmation?: string;
  notes?: string;
}
