// Amadeus for Developers (free self-service tier) client for flight/hotel
// price search. Inactive until AMADEUS_API_KEY / AMADEUS_API_SECRET are set —
// callers should catch the thrown error and fall back gracefully.
let cachedToken: { value: string; expires: number } | null = null;

async function getAccessToken(): Promise<string> {
  const key = process.env.AMADEUS_API_KEY;
  const secret = process.env.AMADEUS_API_SECRET;
  if (!key || !secret) {
    throw new Error(
      "AMADEUS_API_KEY / AMADEUS_API_SECRET are not set. Sign up free at developers.amadeus.com and add them to .env."
    );
  }
  if (cachedToken && cachedToken.expires > Date.now()) return cachedToken.value;

  const res = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: key,
      client_secret: secret,
    }),
  });
  if (!res.ok) throw new Error(`Amadeus auth failed: ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.value;
}

export interface FlightOffer {
  id: string;
  price: number;
  currency: string;
  originIata: string;
  destinationIata: string;
  departureAt: string;
  airline: string;
}

export async function searchFlightOffers(params: {
  origin: string;
  destination: string;
  departureDate: string;
  adults?: number;
}): Promise<FlightOffer[]> {
  const token = await getAccessToken();
  const url = new URL("https://test.api.amadeus.com/v2/shopping/flight-offers");
  url.searchParams.set("originLocationCode", params.origin);
  url.searchParams.set("destinationLocationCode", params.destination);
  url.searchParams.set("departureDate", params.departureDate);
  url.searchParams.set("adults", String(params.adults ?? 1));
  url.searchParams.set("max", "10");

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Amadeus flight search failed: ${res.status}`);
  const data = (await res.json()) as {
    data: Array<{
      id: string;
      price: { total: string; currency: string };
      itineraries: Array<{ segments: Array<{ departure: { iataCode: string; at: string }; arrival: { iataCode: string }; carrierCode: string }> }>;
    }>;
  };

  return data.data.map((offer) => {
    const firstSegment = offer.itineraries[0].segments[0];
    const lastSegment = offer.itineraries[0].segments[offer.itineraries[0].segments.length - 1];
    return {
      id: offer.id,
      price: parseFloat(offer.price.total),
      currency: offer.price.currency,
      originIata: firstSegment.departure.iataCode,
      destinationIata: lastSegment.arrival.iataCode,
      departureAt: firstSegment.departure.at,
      airline: firstSegment.carrierCode,
    };
  });
}

export interface HotelOffer {
  hotelId: string;
  hotelName: string;
  price: number;
  currency: string;
}

// Amadeus's hotel pricing is two calls: first resolve which hotels exist in
// a city (by IATA city code), then ask for actual offers on a batch of
// them. The by-city list can run to hundreds of hotels for a big city, so
// this caps the batch — cheap-enough hotels to matter for a price alert are
// almost always among the first page anyway, and Amadeus's hotel-offers
// endpoint rejects overly large hotelIds batches.
export async function searchHotelOffers(params: {
  cityIata: string;
  checkInDate: string;
  checkOutDate: string;
  adults?: number;
}): Promise<HotelOffer[]> {
  const token = await getAccessToken();

  const listUrl = new URL("https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city");
  listUrl.searchParams.set("cityCode", params.cityIata);
  const listRes = await fetch(listUrl, { headers: { Authorization: `Bearer ${token}` } });
  if (!listRes.ok) throw new Error(`Amadeus hotel list failed: ${listRes.status}`);
  const listData = (await listRes.json()) as { data: Array<{ hotelId: string; name: string }> };
  if (listData.data.length === 0) return [];

  const hotelIds = listData.data.slice(0, 60).map((h) => h.hotelId);
  const nameById = new Map(listData.data.map((h) => [h.hotelId, h.name]));

  const offersUrl = new URL("https://test.api.amadeus.com/v3/shopping/hotel-offers");
  offersUrl.searchParams.set("hotelIds", hotelIds.join(","));
  offersUrl.searchParams.set("checkInDate", params.checkInDate);
  offersUrl.searchParams.set("checkOutDate", params.checkOutDate);
  offersUrl.searchParams.set("adults", String(params.adults ?? 1));
  offersUrl.searchParams.set("bestRateOnly", "true");

  const offersRes = await fetch(offersUrl, { headers: { Authorization: `Bearer ${token}` } });
  if (!offersRes.ok) throw new Error(`Amadeus hotel offers failed: ${offersRes.status}`);
  const offersData = (await offersRes.json()) as {
    data: Array<{ hotel: { hotelId: string; name?: string }; offers: Array<{ price: { total: string; currency: string } }> }>;
  };

  return offersData.data
    .filter((entry) => entry.offers.length > 0)
    .map((entry) => ({
      hotelId: entry.hotel.hotelId,
      hotelName: entry.hotel.name ?? nameById.get(entry.hotel.hotelId) ?? entry.hotel.hotelId,
      price: Math.min(...entry.offers.map((o) => parseFloat(o.price.total))),
      currency: entry.offers[0].price.currency,
    }));
}
