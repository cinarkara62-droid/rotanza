"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { cities, getCity } from "@/lib/mock-data/cities";
import { getTransportForCity } from "@/lib/mock-data/transport";
import { MetroLine } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { MetroSchematic } from "@/components/MetroSchematic";
import { CitySearchInput, type CustomCity } from "@/components/CitySearchInput";
import { AffiliateWidget } from "@/components/AffiliateWidget";
import { TransportCompareCard } from "@/components/TransportCompareCard";
import { TransportHeroBackground } from "@/components/TransportHeroBackground";
import { estimateTransportOptions, type TransportComparisonEstimate } from "@/lib/transport-estimate";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

const KIWITAXI_SRC =
  "https://tpscr.com/content?currency=USD&trs=551629&shmarker=752331&locale=en&powered_by=true&transfer_options_limit=10&transfer_options=MCR&disable_currency_selector=true&hide_form_extras=true&hide_external_links=true&campaign_id=1&promo_id=3879";

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function TransportClient({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const isTr = locale === "tr";

  const [cityId, setCityId] = useState<string | null>(cities[0].id);
  const [customCity, setCustomCity] = useState<CustomCity | null>(null);
  const [liveLines, setLiveLines] = useState<MetroLine[] | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveNotFound, setLiveNotFound] = useState(false);

  const [routeFrom, setRouteFrom] = useState("");
  const [routeTo, setRouteTo] = useState("");
  const [estimate, setEstimate] = useState<TransportComparisonEstimate | null>(null);
  const [showKiwiWidget, setShowKiwiWidget] = useState(false);

  const transport = cityId ? getTransportForCity(cityId) : null;
  const city = cityId ? getCity(cityId) : null;

  useEffect(() => {
    if (!customCity) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicking off a network fetch triggered by prop change, not a render loop
    setLiveLoading(true);
    setLiveNotFound(false);
    fetchWithTimeout(`/api/transit?lat=${customCity.lat}&lon=${customCity.lon}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const lines: MetroLine[] = (data.lines ?? []).map(
          (l: { ref: string; name: string; color: string | null; stations: { name: string; lat: number; lon: number }[] }) => ({
            ref: l.ref,
            name: l.name,
            color: l.color ?? "",
            stations: l.stations,
          })
        );
        setLiveLines(lines);
        setLiveNotFound(lines.length === 0);
      })
      .catch(() => {
        if (!cancelled) {
          setLiveLines([]);
          setLiveNotFound(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLiveLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [customCity]);

  function handleRouteSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!routeFrom.trim() || !routeTo.trim()) return;
    setEstimate(estimateTransportOptions(routeFrom, routeTo));

    // Nice-to-have cohesion: if "To" matches one of our curated cities,
    // drive the existing metro map/list selection from it too.
    const q = routeTo.trim().toLowerCase();
    const matched = cities.find((c) => c.cityTr.toLowerCase() === q || c.cityEn.toLowerCase() === q);
    if (matched) {
      setCityId(matched.id);
      setCustomCity(null);
      setLiveLines(null);
    }
  }

  const activeLines = customCity ? liveLines : transport?.lines ?? null;
  const systemLabel = customCity
    ? customCity.name
    : transport
      ? transport.systemName
      : "";

  return (
    <div className="relative z-10 mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <TransportHeroBackground />

      <PageHeader eyebrow={dict.transport.eyebrow} title={dict.transport.title} subtitle={dict.transport.subtitle} />

      <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-2xl border border-black/5 bg-gradient-to-br from-white via-white to-brand-50/60 p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-lg">
            🧭
          </div>
          <h3 className="text-sm font-semibold text-brand-950">{isTr ? "Rota ara" : "Search a route"}</h3>
        </div>
        <form onSubmit={handleRouteSearch} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-brand-950">
            {isTr ? "Nereden" : "From"}
            <input
              value={routeFrom}
              onChange={(e) => setRouteFrom(e.target.value)}
              placeholder={isTr ? "ör. Havalimanı" : "e.g. Airport"}
              required
              className="rounded-xl border border-black/10 bg-sand-50 px-3 py-2.5 text-sm text-brand-950 outline-none focus:border-brand-400"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-brand-950">
            {isTr ? "Nereye" : "To"}
            <input
              value={routeTo}
              onChange={(e) => setRouteTo(e.target.value)}
              placeholder={isTr ? "ör. Şehir Merkezi" : "e.g. City Center"}
              required
              className="rounded-xl border border-black/10 bg-sand-50 px-3 py-2.5 text-sm text-brand-950 outline-none focus:border-brand-400"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-transform hover:scale-[1.01] sm:col-span-2"
          >
            {isTr ? "Rotayı Ara" : "Search Route"}
          </button>
        </form>

        <div
          id="kiwitaxi-section"
          className="mt-5 flex flex-col items-start justify-between gap-3 rounded-2xl border-l-4 border-coral-400 bg-sand-50/70 p-4 sm:flex-row sm:items-center"
        >
          <div>
            <div className="text-sm font-semibold text-brand-950">
              🚖 {isTr ? "Özel transfere mi ihtiyacın var?" : "Need a private transfer?"}
            </div>
            <p className="mt-0.5 text-xs text-brand-950/50">
              {isTr
                ? "KiwiTaxi ile güvenilir havalimanı transferi ayırt."
                : "Book a reliable airport transfer with KiwiTaxi."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowKiwiWidget((v) => !v)}
            className="shrink-0 rounded-full border border-black/10 bg-white px-5 py-2 text-sm font-semibold text-brand-950 transition-colors hover:border-brand-300"
          >
            {isTr ? "KiwiTaxi ile Ayırt" : "Book with KiwiTaxi"}
          </button>
        </div>

        {showKiwiWidget && (
          <div className="mt-4">
            <AffiliateWidget src={KIWITAXI_SRC} />
          </div>
        )}
      </div>

      {estimate && (
        <div className="mx-auto mt-14 max-w-5xl">
          <h2 className="text-center text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">
            {isTr ? "Oraya Ulaşmanın En İyi Yolları" : "Best Ways to Get There"}
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <TransportCompareCard
              emoji="🚇"
              title={isTr ? "Metro" : "Metro"}
              durationLabel={isTr ? "Süre" : "Duration"}
              durationValue={`${estimate.metro.durationMinutes} ${isTr ? "dk" : "min"}`}
              costLabel={isTr ? "Tahmini ücret" : "Estimated cost"}
              costValue={`$${estimate.metro.costUsd}`}
              badge={isTr ? "En Ucuz" : "Cheapest"}
              badgeTone="brand"
              cta={isTr ? "Rotayı Gör" : "View Route"}
              onClick={() => scrollToId("metro-map-section")}
            />
            <TransportCompareCard
              emoji="🚌"
              title={isTr ? "Havalimanı Otobüsü" : "Airport Bus"}
              durationLabel={isTr ? "Süre" : "Duration"}
              durationValue={`${estimate.bus.durationMinutes} ${isTr ? "dk" : "min"}`}
              costLabel={isTr ? "Tahmini ücret" : "Estimated cost"}
              costValue={`$${estimate.bus.costUsd}`}
              badge={isTr ? "Bagaj İçin En İyi" : "Best for Luggage"}
              badgeTone="brand"
              cta={isTr ? "Rotayı Gör" : "View Route"}
              onClick={() => scrollToId("metro-map-section")}
            />
            <TransportCompareCard
              emoji="🚖"
              title={isTr ? "Taksi" : "Taxi"}
              durationLabel={isTr ? "Süre" : "Duration"}
              durationValue={`${estimate.taxi.durationMinutes} ${isTr ? "dk" : "min"}`}
              costLabel={isTr ? "Tahmini ücret" : "Estimated cost"}
              costValue={`$${estimate.taxi.costUsd}`}
              badge={isTr ? "En Hızlı" : "Fastest"}
              badgeTone="coral"
              cta={isTr ? "KiwiTaxi ile Ayırt" : "Book with KiwiTaxi"}
              onClick={() => {
                setShowKiwiWidget(true);
                scrollToId("kiwitaxi-section");
              }}
            />
          </div>
          <p className="mt-6 text-center text-[11px] text-brand-950/35">
            {isTr
              ? "Süre ve fiyatlar genel tahminlerdir, gerçek zamanlı veri değildir."
              : "Durations and prices are general estimates, not real-time data."}
          </p>
        </div>
      )}

      <div className="mx-auto mt-14 max-w-sm">
        <CitySearchInput
          locale={locale}
          label={dict.transport.selectCity}
          curatedLabel={isTr ? "Öne çıkan şehirler" : "Featured cities"}
          otherLabel={isTr ? "Diğer şehirler" : "Other cities"}
          noResultsLabel={isTr ? "Sonuç bulunamadı" : "No results found"}
          onSelectCurated={(id) => {
            setCityId(id);
            setCustomCity(null);
            setLiveLines(null);
          }}
          onSelectCustom={(c) => {
            setCustomCity(c);
            setCityId(null);
          }}
        />
      </div>

      {liveLoading && (
        <p className="mt-8 text-center text-sm text-brand-950/50">
          {isTr ? "Hat verisi aranıyor… bu biraz sürebilir." : "Looking up transit lines… this can take a moment."}
        </p>
      )}

      {liveNotFound && !liveLoading && (
        <p className="mt-8 text-center text-sm text-brand-950/50">
          {isTr
            ? "Bu şehir için OpenStreetMap'te metro/hafif raylı hat verisi bulunamadı (ya sistem yok ya da haritalanmamış)."
            : "No metro/light-rail line data was found for this city in OpenStreetMap (either it doesn't have one, or it isn't mapped)."}
        </p>
      )}

      {activeLines && activeLines.length > 0 && (
        <div className="mt-10 space-y-8">
          <div
            id="metro-map-section"
            className="overflow-hidden rounded-2xl border border-black/5 border-t-4 border-t-brand-500 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-lg">
                🚇
              </div>
              <h2 className="text-base font-semibold text-brand-950">{systemLabel}</h2>
            </div>
            <p className="mt-1 text-xs text-brand-950/40">
              {city ? `${city.emoji} ${isTr ? city.cityTr : city.cityEn}` : ""}
              {city ? " · " : ""}
              {isTr ? `${activeLines.length} hat gösteriliyor` : `${activeLines.length} lines shown`}
            </p>
            <div className="mt-5 overflow-x-auto">
              <MetroSchematic lines={activeLines} locale={locale} />
            </div>
            <p className="mt-4 text-[11px] text-brand-950/35">
              {isTr
                ? "Bu, hatların gerçek isim, durak ve konum bilgileriyle çizilmiş özgün bir şemadır — resmi ulaşım haritası değildir. Güncel sefer bilgisi için resmi ulaşım uygulamasını kullanın."
                : "This is an original schematic drawn from each line's real name, stations, and coordinates — not an official transit map. Check the official transit app for live schedules."}
            </p>
          </div>

          {transport && !customCity && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-brand-950">{dict.transport.tipsTitle}</h3>
                <ul className="mt-3 space-y-2.5">
                  {(isTr ? transport.tipsTr : transport.tipsEn).map((tip) => (
                    <li key={tip} className="flex gap-2 text-sm leading-relaxed text-brand-950/60">
                      <span className="text-brand-500">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-brand-950">{dict.transport.ticketTitle}</h3>
                <p className="mt-3 text-sm leading-relaxed text-brand-950/60">
                  {isTr ? transport.ticketTr : transport.ticketEn}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
