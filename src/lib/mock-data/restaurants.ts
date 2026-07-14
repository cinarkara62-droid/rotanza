import { Restaurant } from "@/lib/types";
import { emojiForCuisine, labelCuisine } from "@/lib/mock-data/cuisine-map";
import rawRestaurants from "@/lib/mock-data/generated/restaurants.json";

type RawPlace = {
  osmId: number;
  name: string;
  cuisine: string | null;
  lat: number;
  lon: number;
  street: string | null;
  housenumber: string | null;
  website: string | null;
};

function buildAddress(place: RawPlace): string | undefined {
  if (place.street && place.housenumber) return `${place.street} ${place.housenumber}`;
  if (place.street) return place.street;
  return undefined;
}

export const restaurants: Restaurant[] = Object.entries(rawRestaurants as Record<string, RawPlace[]>).flatMap(
  ([cityId, places]) =>
    places.map((place) => {
      const cuisine = labelCuisine(place.cuisine);
      return {
        id: `r-${cityId}-${place.osmId}`,
        cityId,
        osmId: place.osmId,
        name: place.name,
        cuisineTr: cuisine.tr,
        cuisineEn: cuisine.en,
        address: buildAddress(place),
        lat: place.lat,
        lon: place.lon,
        emoji: emojiForCuisine(place.cuisine),
      };
    })
);

export function getRestaurantsForCity(cityId: string) {
  return restaurants.filter((r) => r.cityId === cityId);
}
