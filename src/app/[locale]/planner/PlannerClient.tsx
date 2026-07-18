"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { cities, getCity } from "@/lib/mock-data/cities";
import { generateItineraryFromPois, ItineraryDay, ItineraryStop } from "@/lib/planner";
import { BudgetLevel, InterestTag, PointOfInterest } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { CitySearchInput, type CustomCity } from "@/components/CitySearchInput";
import { PlaceDetailPanel } from "@/components/PlaceDetailPanel";
import { BudgetPanel } from "@/components/BudgetPanel";
import { PageBackground } from "@/components/PageBackground";
import { getPoisForCity } from "@/lib/mock-data/pois";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

const RouteMap = dynamic(() => import("@/components/RouteMap").then((m) => m.RouteMap), { ssr: false });

const INTEREST_OPTIONS: InterestTag[] = ["history", "food", "nature", "nightlife", "shopping", "art"];
const BUDGET_OPTIONS: BudgetLevel[] = ["economy", "standard", "luxury"];

function slotFor(categories: InterestTag[], index: number): "morning" | "afternoon" | "evening" {
  if (categories.includes("nightlife")) return "evening";
  return (["morning", "afternoon", "evening"] as const)[index % 3];
}

export function PlannerClient({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const isTr = locale === "tr";
  const searchParams = useSearchParams();

  const initialCity = (() => {
    const fromQuery = searchParams.get("city");
    return (fromQuery && getCity(fromQuery)) ? fromQuery : cities[0].id;
  })();
  const initialDays = (() => {
    const fromQuery = Number(searchParams.get("days"));
    return fromQuery >= 1 && fromQuery <= 7 ? fromQuery : 3;
  })();
  const initialCityObj = getCity(initialCity)!;

  const [cityId, setCityId] = useState<string | null>(initialCity);
  const [customCity, setCustomCity] = useState<CustomCity | null>(null);
  const [days, setDays] = useState(initialDays);
  const [interests, setInterests] = useState<InterestTag[]>(["history", "food"]);
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>("standard");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [selectedStop, setSelectedStop] = useState<ItineraryStop | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [destinationLabel, setDestinationLabel] = useState(
    `${initialCityObj.emoji} ${isTr ? initialCityObj.cityTr : initialCityObj.cityEn}`
  );

  const city = cityId ? getCity(cityId) : null;

  function toggleInterest(tag: InterestTag) {
    setInterests((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function tryAiThenFallback(candidatePois: PointOfInterest[], destination: string) {
    setSelectedStop(null);
    try {
      const res = await fetchWithTimeout("/api/itinerary/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          days,
          interests,
          budgetLevel,
          pois: candidatePois,
          locale,
        }),
      }, 28000);
      if (!res.ok) throw new Error("ai_unavailable");
      const data = await res.json();
      if (!data.itinerary?.length) throw new Error("ai_empty");
      setItinerary(data.itinerary);
    } catch {
      setItinerary(generateItineraryFromPois(candidatePois, days, interests));
    }
  }

  async function runSearch() {
    setLoadError(false);

    if (cityId) {
      setLoading(true);
      try {
        await tryAiThenFallback(getPoisForCity(cityId), destinationLabel);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (customCity) {
      setLoading(true);
      try {
        const res = await fetchWithTimeout(`/api/attractions?lat=${customCity.lat}&lon=${customCity.lon}`, undefined, 29000);
        const data = await res.json();
        const livePois: PointOfInterest[] = (data.results ?? []).map(
          (
            a: {
              osmId: number;
              name: string;
              categories: InterestTag[];
              emoji: string;
              lat: number;
              lon: number;
              openingHours?: string;
              phone?: string;
              website?: string;
              wikidataId?: string;
            },
            i: number
          ) => ({
            id: `live-${a.osmId}`,
            cityId: "custom",
            nameTr: a.name,
            nameEn: a.name,
            descTr: a.categories.join(" · "),
            descEn: a.categories.join(" · "),
            tags: a.categories,
            slot: slotFor(a.categories, i),
            emoji: a.emoji,
            lat: a.lat,
            lon: a.lon,
            openingHours: a.openingHours,
            phone: a.phone,
            website: a.website,
            wikidataId: a.wikidataId,
          })
        );
        if (livePois.length === 0) {
          setLoadError(true);
          setItinerary(null);
        } else {
          await tryAiThenFallback(livePois, destinationLabel);
        }
      } catch {
        setLoadError(true);
        setItinerary(null);
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await runSearch();
  }

  return (
    <div className="relative z-10 mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <PageBackground
        gradientClassName={{
          light: "bg-gradient-to-br from-[#eaf6f2] via-[#f4f7f6] to-[#e9f2f5]",
          dark: "bg-gradient-to-br from-[#0a1a2e] via-[#0d2136] to-[#0a1830]",
        }}
        dotColor={{ light: "#0a6f5d", dark: "#34acf7" }}
        dotSeedA={41}
        dotSeedB={13}
        blobs={[
          { x: "8%", y: "10%", size: 260, delay: "0s", duration: "17s" },
          { x: "85%", y: "14%", size: 220, delay: "2s", duration: "15s" },
          { x: "80%", y: "70%", size: 240, delay: "1.5s", duration: "18s" },
          { x: "10%", y: "68%", size: 200, delay: "3s", duration: "16s" },
        ]}
        blobColorClass="from-brand-300/25 via-brand-300/5 to-white/0"
      />
      <PageHeader eyebrow={dict.planner.eyebrow} title={dict.planner.title} subtitle={dict.planner.subtitle} />

      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-6 rounded-3xl border border-white/10 bg-sand-100 p-6 shadow-sm sm:grid-cols-2 sm:p-8"
      >
        <CitySearchInput
          locale={locale}
          label={dict.planner.form.destination}
          curatedLabel={isTr ? "Öne çıkan şehirler" : "Featured cities"}
          otherLabel={isTr ? "Diğer şehirler" : "Other cities"}
          noResultsLabel={isTr ? "Sonuç bulunamadı" : "No results found"}
          onSelectCurated={(id) => {
            setCityId(id);
            setCustomCity(null);
            const c = getCity(id)!;
            setDestinationLabel(`${c.emoji} ${isTr ? c.cityTr : c.cityEn}`);
          }}
          onSelectCustom={(c) => {
            setCustomCity(c);
            setCityId(null);
            setDestinationLabel(c.name);
          }}
        />

        <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
          {dict.planner.form.days}
          <input
            type="number"
            min={1}
            max={7}
            value={days}
            onChange={(e) => setDays(Math.min(7, Math.max(1, Number(e.target.value) || 1)))}
            className="rounded-xl border border-white/15 bg-sand-50 px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand-400"
          />
        </label>

        <div className="sm:col-span-2">
          <div className="mb-2 text-sm font-medium text-foreground">{dict.planner.form.interests}</div>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => toggleInterest(tag)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  interests.includes(tag)
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-white/15 bg-sand-100 text-foreground/70 hover:border-brand-300"
                }`}
              >
                {dict.planner.interestLabels[tag]}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <div className="mb-2 text-sm font-medium text-foreground">{dict.planner.form.budgetLevel}</div>
          <div className="flex flex-wrap gap-2">
            {BUDGET_OPTIONS.map((level) => (
              <button
                type="button"
                key={level}
                onClick={() => setBudgetLevel(level)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  budgetLevel === level
                    ? "border-brand-950 bg-brand-950 text-white"
                    : "border-white/15 bg-sand-100 text-foreground/70 hover:border-brand-300"
                }`}
              >
                {dict.planner.budgetLabels[level]}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-foreground sm:col-span-2">
          {isTr ? "Toplam bütçeniz (opsiyonel)" : "Your total budget (optional)"}
          <input
            type="number"
            min={0}
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(e.target.value)}
            placeholder={isTr ? "ör. 500" : "e.g. 500"}
            className="rounded-xl border border-white/15 bg-sand-50 px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand-400"
          />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-brand-500 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-transform hover:scale-[1.01] disabled:opacity-60 sm:w-auto"
          >
            {loading ? (isTr ? "Yükleniyor…" : "Loading…") : itinerary ? dict.planner.form.regenerate : dict.planner.form.submit}
          </button>
          <p className="mt-3 text-xs text-foreground/40">
            {loading && customCity
              ? isTr
                ? "Küçük şehirlerde bu biraz uzun sürebilir…"
                : "This can take a bit longer for smaller cities…"
              : dict.planner.limitNote}
          </p>
        </div>
      </form>

      <div className={`mx-auto mt-12 ${itinerary ? "max-w-6xl" : "max-w-3xl"}`}>
        {!itinerary && !loadError && (
          <p className="text-center text-sm text-foreground/50">{dict.planner.emptyState}</p>
        )}
        {loadError && (
          <div className="text-center">
            <p className="text-sm text-foreground/50">
              {isTr
                ? "Bu şehir için gezilecek yer verisi şu an alınamadı — bu genelde ücretsiz harita veri servisinin anlık yoğunluğundan kaynaklanır, şehirle ilgili bir sorun değil. Birazdan tekrar deneyin."
                : "Couldn't fetch points-of-interest for this city right now — this is usually the free map data service being briefly overloaded, not an issue with the city itself. Please try again shortly."}
            </p>
            <button
              type="button"
              onClick={() => runSearch()}
              className="mt-3 rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-foreground/80 hover:bg-sand-50"
            >
              {isTr ? "Tekrar dene" : "Try again"}
            </button>
          </div>
        )}

        {itinerary && (
          <>
            <h2 className="text-xl font-bold text-foreground">
              {dict.planner.resultTitle} — {destinationLabel}
            </h2>

            <div className="mt-6">
              <RouteMap
                itinerary={itinerary}
                selectedStopId={selectedStop?.id ?? null}
                onSelectStop={(stop) => setSelectedStop(stop)}
                destination={destinationLabel}
                locale={locale}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className={`space-y-6 ${selectedStop || budgetAmount ? "lg:col-span-2" : "lg:col-span-3"}`}>
                {itinerary.map((dayEntry) => (
                  <div key={dayEntry.day} className="rounded-2xl border border-white/10 bg-sand-100 p-6 shadow-sm">
                    <div className="text-sm font-bold uppercase tracking-wide text-brand-500">
                      {dict.planner.dayLabel} {dayEntry.day}
                    </div>
                    <div className="mt-4 space-y-4">
                      {(["morning", "afternoon", "evening"] as const).map((slot) => {
                        const poi = dayEntry[slot];
                        if (!poi) return null;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedStop(poi)}
                            className={`flex w-full gap-4 rounded-xl p-1 text-start transition-colors hover:bg-sand-50 ${
                              selectedStop?.id === poi.id ? "bg-sand-50 ring-1 ring-brand-300" : ""
                            }`}
                          >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl">
                              {poi.emoji}
                            </div>
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-wide text-foreground/40">
                                {dict.planner.slotLabels[slot]}
                              </div>
                              <div className="text-sm font-semibold text-foreground">
                                {isTr ? poi.nameTr : poi.nameEn}
                              </div>
                              <p className="mt-0.5 text-sm text-foreground/60">{isTr ? poi.descTr : poi.descEn}</p>
                              {poi.aiTip && (
                                <div className="mt-2 rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-700">
                                  {poi.bestVisitTime && (
                                    <span className="font-semibold">
                                      {isTr ? "En iyi zaman" : "Best time"}: {poi.bestVisitTime} ·{" "}
                                    </span>
                                  )}
                                  {poi.aiTip}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {(selectedStop || budgetAmount) && (
                <div className="space-y-6 lg:col-span-1">
                  {budgetAmount && Number(budgetAmount) > 0 && (
                    <BudgetPanel
                      budgetAmount={Number(budgetAmount)}
                      currency={city?.currency ?? (isTr ? "TRY" : "USD")}
                      days={days}
                      budgetLevel={budgetLevel}
                      dailyCostIndex={city?.dailyCostIndex ?? 1}
                      isTr={isTr}
                    />
                  )}
                  {selectedStop && (
                    <PlaceDetailPanel stop={selectedStop} locale={locale} onClose={() => setSelectedStop(null)} />
                  )}
                </div>
              )}
            </div>

            <p className="mt-6 text-center text-xs text-foreground/40">
              {city ? dict.planner.disclaimer : isTr ? "Bu şehir için gerçek zamanlı OpenStreetMap verisiyle oluşturuldu." : "Generated from real-time OpenStreetMap data for this city."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
