"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { cities } from "@/lib/mock-data/cities";
import {
  AccommodationLevel,
  ActivitiesLevel,
  calculateBudget,
  MealsLevel,
  TransportLevel,
} from "@/lib/budget";
import { PageHeader } from "@/components/PageHeader";
import { CitySearchInput, type CustomCity } from "@/components/CitySearchInput";

const ACCOMMODATION_OPTIONS: AccommodationLevel[] = ["budget", "midrange", "luxury"];
const MEALS_OPTIONS: MealsLevel[] = ["budget", "midrange", "luxury"];
const TRANSPORT_OPTIONS: TransportLevel[] = ["budget", "midrange", "luxury"];
const ACTIVITIES_OPTIONS: ActivitiesLevel[] = ["light", "moderate", "packed"];

function PillGroup<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labels: Record<T, string>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          type="button"
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
            value === opt
              ? "border-brand-500 bg-brand-500 text-white"
              : "border-black/10 bg-white text-brand-950/70 hover:border-brand-300"
          }`}
        >
          {labels[opt]}
        </button>
      ))}
    </div>
  );
}

export function BudgetClient({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const isTr = locale === "tr";

  const [cityId, setCityId] = useState<string | null>(cities[0].id);
  const [customCity, setCustomCity] = useState<CustomCity | null>(null);
  const [travelers, setTravelers] = useState(2);
  const [days, setDays] = useState(5);
  const [accommodation, setAccommodation] = useState<AccommodationLevel>("midrange");
  const [meals, setMeals] = useState<MealsLevel>("midrange");
  const [transportStyle, setTransportStyle] = useState<TransportLevel>("budget");
  const [activities, setActivities] = useState<ActivitiesLevel>("moderate");

  const city = cityId ? cities.find((c) => c.id === cityId) : null;
  const dailyCostIndex = city ? city.dailyCostIndex : 1;

  const result = useMemo(
    () =>
      calculateBudget({
        dailyCostIndex,
        travelers,
        days,
        accommodation,
        meals,
        transportStyle,
        activities,
      }),
    [dailyCostIndex, travelers, days, accommodation, meals, transportStyle, activities]
  );

  const breakdown = [
    { key: "accommodation", label: dict.budget.results.accommodation, value: result.accommodation, color: "bg-brand-500" },
    { key: "food", label: dict.budget.results.food, value: result.food, color: "bg-coral-500" },
    { key: "transport", label: dict.budget.results.transport, value: result.transport, color: "bg-brand-700" },
    { key: "activities", label: dict.budget.results.activities, value: result.activities, color: "bg-brand-300" },
    { key: "misc", label: dict.budget.results.misc, value: result.misc, color: "bg-sand-300" },
  ];
  const maxValue = Math.max(...breakdown.map((b) => b.value), 1);

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <PageHeader eyebrow={dict.budget.eyebrow} title={dict.budget.title} subtitle={dict.budget.subtitle} />

      <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="space-y-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm lg:col-span-3 sm:p-8">
          <CitySearchInput
            locale={locale}
            label={dict.budget.form.city}
            curatedLabel={isTr ? "Öne çıkan şehirler" : "Featured cities"}
            otherLabel={isTr ? "Diğer şehirler" : "Other cities"}
            noResultsLabel={isTr ? "Sonuç bulunamadı" : "No results found"}
            onSelectCurated={(id) => {
              setCityId(id);
              setCustomCity(null);
            }}
            onSelectCustom={(c) => {
              setCustomCity(c);
              setCityId(null);
            }}
          />
          {customCity && (
            <p className="-mt-3 text-xs text-brand-950/40">
              {isTr
                ? "Bu şehir için ortalama bir maliyet endeksi kullanılıyor (tahmini)."
                : "Using an average cost index for this city (estimated)."}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-brand-950">
              {dict.budget.form.travelers}
              <input
                type="number"
                min={1}
                max={12}
                value={travelers}
                onChange={(e) => setTravelers(Math.min(12, Math.max(1, Number(e.target.value) || 1)))}
                className="rounded-xl border border-black/10 bg-sand-50 px-3 py-2.5 text-sm text-brand-950 outline-none focus:border-brand-400"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-brand-950">
              {dict.budget.form.days}
              <input
                type="number"
                min={1}
                max={30}
                value={days}
                onChange={(e) => setDays(Math.min(30, Math.max(1, Number(e.target.value) || 1)))}
                className="rounded-xl border border-black/10 bg-sand-50 px-3 py-2.5 text-sm text-brand-950 outline-none focus:border-brand-400"
              />
            </label>
          </div>

          <div>
            <div className="mb-2 text-sm font-medium text-brand-950">{dict.budget.form.accommodation}</div>
            <PillGroup options={ACCOMMODATION_OPTIONS} value={accommodation} onChange={setAccommodation} labels={dict.budget.accommodationLabels} />
          </div>
          <div>
            <div className="mb-2 text-sm font-medium text-brand-950">{dict.budget.form.meals}</div>
            <PillGroup options={MEALS_OPTIONS} value={meals} onChange={setMeals} labels={dict.budget.mealsLabels} />
          </div>
          <div>
            <div className="mb-2 text-sm font-medium text-brand-950">{dict.budget.form.transportStyle}</div>
            <PillGroup options={TRANSPORT_OPTIONS} value={transportStyle} onChange={setTransportStyle} labels={dict.budget.transportLabels} />
          </div>
          <div>
            <div className="mb-2 text-sm font-medium text-brand-950">{dict.budget.form.activities}</div>
            <PillGroup options={ACTIVITIES_OPTIONS} value={activities} onChange={setActivities} labels={dict.budget.activitiesLabels} />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-3xl bg-brand-950 p-6 text-white sm:p-8">
            <div className="text-xs font-semibold uppercase tracking-wide text-white/50">
              {dict.budget.results.title}
            </div>
            <div className="mt-2 text-4xl font-extrabold tracking-tight">${result.total.toLocaleString()}</div>
            <div className="text-sm text-white/50">
              ${result.perDay.toLocaleString()} {dict.budget.results.perDay}
            </div>

            <div className="mt-6 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-white/50">
                {dict.budget.results.breakdown}
              </div>
              {breakdown.map((b) => (
                <div key={b.key}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-white/70">{b.label}</span>
                    <span className="font-semibold">${b.value.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full ${b.color}`}
                      style={{ width: `${Math.max(4, (b.value / maxValue) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
