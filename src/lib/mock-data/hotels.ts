import { Hotel } from "@/lib/types";
import rawHotels from "@/lib/mock-data/generated/hotels.json";

type RawHotel = {
  osmId: number;
  name: string;
  stars: string | null;
  lat: number;
  lon: number;
  street: string | null;
  housenumber: string | null;
  website: string | null;
};

function buildAddress(place: RawHotel): string | undefined {
  if (place.street && place.housenumber) return `${place.street} ${place.housenumber}`;
  if (place.street) return place.street;
  return undefined;
}

export const hotels: Hotel[] = Object.entries(rawHotels as Record<string, RawHotel[]>).flatMap(
  ([cityId, places]) =>
    places.map((place) => ({
      id: `h-${cityId}-${place.osmId}`,
      cityId,
      osmId: place.osmId,
      name: place.name,
      stars: place.stars ? Number(place.stars) : undefined,
      address: buildAddress(place),
      lat: place.lat,
      lon: place.lon,
      emoji: "🏨",
    }))
);

export function getHotelsForCity(cityId: string) {
  return hotels.filter((h) => h.cityId === cityId);
}

export function searchHotelsByName(query: string, limit = 8): Hotel[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return hotels.filter((h) => h.name.toLowerCase().includes(q)).slice(0, limit);
}
