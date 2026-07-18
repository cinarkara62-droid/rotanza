"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { cities, getCity } from "@/lib/mock-data/cities";
import { getRestaurantsForCity } from "@/lib/mock-data/restaurants";
import { PageHeader } from "@/components/PageHeader";
import { CitySearchInput, type CustomCity } from "@/components/CitySearchInput";
import { RestaurantsPageBackground } from "@/components/RestaurantsPageBackground";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

interface LivePlace {
  osmId: number;
  name: string;
  lat: number;
  lon: number;
  address?: string;
  cuisineTr: string;
  cuisineEn: string;
  emoji: string;
}

export function RestaurantsClient({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const isTr = locale === "tr";

  const [cityId, setCityId] = useState<string | null>(cities[0].id);
  const [customCity, setCustomCity] = useState<CustomCity | null>(null);
  const [cuisine, setCuisine] = useState<string>("all");
  const [liveResults, setLiveResults] = useState<LivePlace[] | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState(false);

  useEffect(() => {
    if (!customCity) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicking off a network fetch triggered by prop change, not a render loop
    setLiveLoading(true);
    setLiveError(false);
    fetchWithTimeout(`/api/places?lat=${customCity.lat}&lon=${customCity.lon}&kind=restaurant`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setLiveResults(data.results ?? []);
      })
      .catch(() => {
        if (!cancelled) setLiveError(true);
      })
      .finally(() => {
        if (!cancelled) setLiveLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [customCity]);

  const city = cityId ? getCity(cityId) : null;
  const cityRestaurants = cityId ? getRestaurantsForCity(cityId) : [];

  const activeList: Array<{
    id: string;
    name: string;
    cuisineTr: string;
    cuisineEn: string;
    address?: string;
    emoji: string;
    lat: number;
    lon: number;
    osmId: number;
  }> = customCity
    ? (liveResults ?? []).map((p) => ({ id: `live-${p.osmId}`, ...p }))
    : cityRestaurants;

  const cuisines = useMemo(() => {
    const set = new Set(activeList.map((r) => (isTr ? r.cuisineTr : r.cuisineEn)));
    return Array.from(set).sort();
  }, [activeList, isTr]);

  const filtered =
    cuisine === "all" ? activeList : activeList.filter((r) => (isTr ? r.cuisineTr : r.cuisineEn) === cuisine);

  return (
    <div className="relative z-10 mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <RestaurantsPageBackground />
      <PageHeader eyebrow={dict.restaurants.eyebrow} title={dict.restaurants.title} subtitle={dict.restaurants.subtitle} />

      <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-end">
        <CitySearchInput
          locale={locale}
          label={dict.restaurants.selectCity}
          curatedLabel={isTr ? "Öne çıkan şehirler" : "Featured cities"}
          otherLabel={isTr ? "Diğer şehirler" : "Other cities"}
          noResultsLabel={isTr ? "Sonuç bulunamadı" : "No results found"}
          onSelectCurated={(id) => {
            setCityId(id);
            setCustomCity(null);
            setLiveResults(null);
            setCuisine("all");
          }}
          onSelectCustom={(c) => {
            setCustomCity(c);
            setCityId(null);
            setCuisine("all");
          }}
        />

        <label className="flex flex-1 flex-col gap-2 text-sm font-medium text-foreground">
          {dict.restaurants.filterCuisine}
          <select
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            className="rounded-xl border border-white/15 bg-sand-100 px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand-400"
          >
            <option value="all">{dict.restaurants.filterAll}</option>
            {cuisines.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      {customCity && (
        <p className="mx-auto mt-4 max-w-3xl text-center text-xs text-foreground/40">
          {isTr
            ? `"${customCity.name}" için OpenStreetMap üzerinden canlı sonuçlar gösteriliyor.`
            : `Showing live OpenStreetMap results for "${customCity.name}".`}
        </p>
      )}
      {!customCity && city && (
        <p className="mx-auto mt-4 max-w-3xl text-center text-xs text-foreground/40">
          {isTr
            ? `${city.cityTr} için OpenStreetMap'ten alınan gerçek işletme verileri.`
            : `Real business data for ${city.cityEn}, sourced from OpenStreetMap.`}
        </p>
      )}

      <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
        {liveLoading && (
          <p className="col-span-2 text-center text-sm text-foreground/50">
            {isTr ? "Yükleniyor… küçük şehirlerde biraz uzun sürebilir." : "Loading… this can take a bit longer for smaller cities."}
          </p>
        )}
        {liveError && (
          <p className="col-span-2 text-center text-sm text-foreground/50">
            {isTr
              ? "Canlı veri şu anda alınamadı, lütfen daha sonra tekrar deneyin."
              : "Couldn't fetch live data right now — please try again shortly."}
          </p>
        )}
        {!liveLoading &&
          filtered.map((r) => (
            <div key={r.id} className="rounded-2xl border border-white/10 bg-sand-100 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl">
                    {r.emoji}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{r.name}</div>
                    <div className="text-xs text-foreground/50">{isTr ? r.cuisineTr : r.cuisineEn}</div>
                  </div>
                </div>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${r.lat}&mlon=${r.lon}#map=18/${r.lat}/${r.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 hover:bg-brand-100"
                >
                  {isTr ? "Haritada gör" : "View on map"}
                </a>
              </div>
              {r.address && <p className="mt-3 text-sm leading-relaxed text-foreground/60">{r.address}</p>}
            </div>
          ))}
        {!liveLoading && !liveError && filtered.length === 0 && (
          <p className="col-span-2 text-center text-sm text-foreground/50">{dict.restaurants.noResults}</p>
        )}
      </div>
    </div>
  );
}
