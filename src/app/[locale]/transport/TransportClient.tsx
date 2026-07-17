"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { cities, getCity } from "@/lib/mock-data/cities";
import { getTransportForCity } from "@/lib/mock-data/transport";
import { MetroLine } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { MetroSchematic } from "@/components/MetroSchematic";
import { CitySearchInput, type CustomCity } from "@/components/CitySearchInput";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

export function TransportClient({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const isTr = locale === "tr";

  const [cityId, setCityId] = useState<string | null>(cities[0].id);
  const [customCity, setCustomCity] = useState<CustomCity | null>(null);
  const [liveLines, setLiveLines] = useState<MetroLine[] | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveNotFound, setLiveNotFound] = useState(false);

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

  const activeLines = customCity ? liveLines : transport?.lines ?? null;
  const systemLabel = customCity
    ? customCity.name
    : transport
      ? transport.systemName
      : "";

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <PageHeader eyebrow={dict.transport.eyebrow} title={dict.transport.title} subtitle={dict.transport.subtitle} />

      <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-brand-950">
          {isTr ? "Havalimanı transferi ayırt" : "Book an airport transfer"}
        </h3>
        <p className="mt-1 text-xs text-brand-950/40">
          {isTr ? "Kiwitaxi ile güvenilir transfer rezervasyonu" : "Reliable transfer booking via Kiwitaxi"}
        </p>
        <div className="mt-4">
          <Script
            strategy="afterInteractive"
            src="https://tpscr.com/content?currency=USD&trs=551629&shmarker=752331&locale=en&powered_by=true&transfer_options_limit=10&transfer_options=MCR&disable_currency_selector=true&hide_form_extras=true&hide_external_links=true&campaign_id=1&promo_id=3879"
            charSet="utf-8"
          />
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-sm">
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
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-brand-950">{systemLabel}</h2>
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
