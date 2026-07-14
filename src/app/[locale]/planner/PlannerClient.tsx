"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { cities, getCity } from "@/lib/mock-data/cities";
import { generateItineraryFromPois, ItineraryDay } from "@/lib/planner";
import { BudgetLevel, InterestTag, PointOfInterest } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { CitySearchInput, type CustomCity } from "@/components/CitySearchInput";
import { getPoisForCity } from "@/lib/mock-data/pois";

const INTEREST_OPTIONS: InterestTag[] = ["history", "food", "nature", "nightlife", "shopping", "art"];
const BUDGET_OPTIONS: BudgetLevel[] = ["economy", "standard", "luxury"];

function slotFor(categories: InterestTag[], index: number): "morning" | "afternoon" | "evening" {
  if (categories.includes("nightlife")) return "evening";
  return (["morning", "afternoon", "evening"] as const)[index % 3];
}

export function PlannerClient({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const isTr = locale === "tr";

  const [cityId, setCityId] = useState<string | null>(cities[0].id);
  const [customCity, setCustomCity] = useState<CustomCity | null>(null);
  const [days, setDays] = useState(3);
  const [interests, setInterests] = useState<InterestTag[]>(["history", "food"]);
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>("standard");
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [destinationLabel, setDestinationLabel] = useState(
    `${cities[0].emoji} ${isTr ? cities[0].cityTr : cities[0].cityEn}`
  );

  const city = cityId ? getCity(cityId) : null;

  function toggleInterest(tag: InterestTag) {
    setInterests((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoadError(false);

    if (cityId) {
      setItinerary(generateItineraryFromPois(getPoisForCity(cityId), days, interests));
      return;
    }

    if (customCity) {
      setLoading(true);
      try {
        const res = await fetch(`/api/attractions?lat=${customCity.lat}&lon=${customCity.lon}`);
        const data = await res.json();
        const livePois: PointOfInterest[] = (data.results ?? []).map(
          (a: { osmId: number; name: string; categories: InterestTag[]; emoji: string }, i: number) => ({
            id: `live-${a.osmId}`,
            cityId: "custom",
            nameTr: a.name,
            nameEn: a.name,
            descTr: a.categories.join(" · "),
            descEn: a.categories.join(" · "),
            tags: a.categories,
            slot: slotFor(a.categories, i),
            emoji: a.emoji,
          })
        );
        if (livePois.length === 0) {
          setLoadError(true);
          setItinerary(null);
        } else {
          setItinerary(generateItineraryFromPois(livePois, days, interests));
        }
      } catch {
        setLoadError(true);
        setItinerary(null);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <PageHeader eyebrow={dict.planner.eyebrow} title={dict.planner.title} subtitle={dict.planner.subtitle} />

      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:grid-cols-2 sm:p-8"
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

        <label className="flex flex-col gap-2 text-sm font-medium text-brand-950">
          {dict.planner.form.days}
          <input
            type="number"
            min={1}
            max={7}
            value={days}
            onChange={(e) => setDays(Math.min(7, Math.max(1, Number(e.target.value) || 1)))}
            className="rounded-xl border border-black/10 bg-sand-50 px-3 py-2.5 text-sm text-brand-950 outline-none focus:border-brand-400"
          />
        </label>

        <div className="sm:col-span-2">
          <div className="mb-2 text-sm font-medium text-brand-950">{dict.planner.form.interests}</div>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => toggleInterest(tag)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  interests.includes(tag)
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-black/10 bg-white text-brand-950/70 hover:border-brand-300"
                }`}
              >
                {dict.planner.interestLabels[tag]}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <div className="mb-2 text-sm font-medium text-brand-950">{dict.planner.form.budgetLevel}</div>
          <div className="flex flex-wrap gap-2">
            {BUDGET_OPTIONS.map((level) => (
              <button
                type="button"
                key={level}
                onClick={() => setBudgetLevel(level)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  budgetLevel === level
                    ? "border-brand-950 bg-brand-950 text-white"
                    : "border-black/10 bg-white text-brand-950/70 hover:border-brand-300"
                }`}
              >
                {dict.planner.budgetLabels[level]}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-brand-500 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-transform hover:scale-[1.01] disabled:opacity-60 sm:w-auto"
          >
            {loading ? (isTr ? "Yükleniyor…" : "Loading…") : itinerary ? dict.planner.form.regenerate : dict.planner.form.submit}
          </button>
          <p className="mt-3 text-xs text-brand-950/40">{dict.planner.limitNote}</p>
        </div>
      </form>

      <div className="mx-auto mt-12 max-w-3xl">
        {!itinerary && !loadError && (
          <p className="text-center text-sm text-brand-950/50">{dict.planner.emptyState}</p>
        )}
        {loadError && (
          <p className="text-center text-sm text-brand-950/50">
            {isTr
              ? "Bu şehir için yeterli gezilecek yer verisi bulunamadı. Farklı bir şehir deneyin."
              : "Not enough points-of-interest data was found for this city. Try a different one."}
          </p>
        )}

        {itinerary && (
          <>
            <h2 className="text-xl font-bold text-brand-950">
              {dict.planner.resultTitle} — {destinationLabel}
            </h2>
            <div className="mt-6 space-y-6">
              {itinerary.map((dayEntry) => (
                <div key={dayEntry.day} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                  <div className="text-sm font-bold uppercase tracking-wide text-brand-500">
                    {dict.planner.dayLabel} {dayEntry.day}
                  </div>
                  <div className="mt-4 space-y-4">
                    {(["morning", "afternoon", "evening"] as const).map((slot) => {
                      const poi = dayEntry[slot];
                      if (!poi) return null;
                      return (
                        <div key={slot} className="flex gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl">
                            {poi.emoji}
                          </div>
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wide text-brand-950/40">
                              {dict.planner.slotLabels[slot]}
                            </div>
                            <div className="text-sm font-semibold text-brand-950">
                              {isTr ? poi.nameTr : poi.nameEn}
                            </div>
                            <p className="mt-0.5 text-sm text-brand-950/60">{isTr ? poi.descTr : poi.descEn}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-brand-950/40">
              {city ? dict.planner.disclaimer : isTr ? "Bu şehir için gerçek zamanlı OpenStreetMap verisiyle oluşturuldu." : "Generated from real-time OpenStreetMap data for this city."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
