"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { PageHeader } from "@/components/PageHeader";
import { CitySearchInput, type CustomCity } from "@/components/CitySearchInput";
import { getCity } from "@/lib/mock-data/cities";
import { COMPARE_CATEGORIES, type DestinationComparison } from "@/lib/compare-categories";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

export function CompareClient({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const isTr = locale === "tr";

  const [labelA, setLabelA] = useState("");
  const [labelB, setLabelB] = useState("");
  const [preferences, setPreferences] = useState("");
  const [comparison, setComparison] = useState<DestinationComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<"none" | "not_configured" | "failed">("none");

  function selectCurated(setLabel: (v: string) => void, cityId: string) {
    const c = getCity(cityId)!;
    setLabel(`${c.emoji} ${isTr ? c.cityTr : c.cityEn}`);
  }

  function selectCustom(setLabel: (v: string) => void, city: CustomCity) {
    setLabel(city.name);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!labelA || !labelB) return;
    setLoading(true);
    setError("none");
    setComparison(null);
    try {
      const res = await fetchWithTimeout(
        "/api/compare-destinations",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ destinationA: labelA, destinationB: labelB, preferences, locale }),
        },
        28000
      );
      if (res.status === 503) {
        setError("not_configured");
        return;
      }
      if (!res.ok) {
        setError("failed");
        return;
      }
      const data = await res.json();
      setComparison(data.comparison);
    } catch {
      setError("failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <PageHeader eyebrow={dict.compare.eyebrow} title={dict.compare.title} subtitle={dict.compare.subtitle} />

      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:grid-cols-2 sm:p-8"
      >
        <CitySearchInput
          locale={locale}
          label={dict.compare.form.destinationA}
          curatedLabel={isTr ? "Öne çıkan şehirler" : "Featured cities"}
          otherLabel={isTr ? "Diğer şehirler" : "Other cities"}
          noResultsLabel={isTr ? "Sonuç bulunamadı" : "No results found"}
          onSelectCurated={(id) => selectCurated(setLabelA, id)}
          onSelectCustom={(c) => selectCustom(setLabelA, c)}
        />
        <CitySearchInput
          locale={locale}
          label={dict.compare.form.destinationB}
          curatedLabel={isTr ? "Öne çıkan şehirler" : "Featured cities"}
          otherLabel={isTr ? "Diğer şehirler" : "Other cities"}
          noResultsLabel={isTr ? "Sonuç bulunamadı" : "No results found"}
          onSelectCurated={(id) => selectCurated(setLabelB, id)}
          onSelectCustom={(c) => selectCustom(setLabelB, c)}
        />

        <label className="flex flex-col gap-2 text-sm font-medium text-brand-950 sm:col-span-2">
          {dict.compare.form.preferences}
          <input
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder={dict.compare.form.preferencesPlaceholder}
            className="rounded-xl border border-black/10 bg-sand-50 px-3 py-2.5 text-sm text-brand-950 outline-none focus:border-brand-400"
          />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={loading || !labelA || !labelB}
            className="w-full rounded-full bg-brand-500 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {loading
              ? isTr
                ? "Karşılaştırılıyor…"
                : "Comparing…"
              : comparison
                ? dict.compare.form.regenerate
                : dict.compare.form.submit}
          </button>
        </div>
      </form>

      <div className="mx-auto mt-12 max-w-3xl">
        {!comparison && error === "none" && (
          <p className="text-center text-sm text-brand-950/50">{dict.compare.emptyState}</p>
        )}
        {error === "not_configured" && (
          <p className="text-center text-sm text-brand-950/50">{dict.compare.aiNotConfigured}</p>
        )}
        {error === "failed" && (
          <p className="text-center text-sm text-brand-950/50">
            {isTr ? "Bir şeyler ters gitti, tekrar deneyin." : "Something went wrong, please try again."}
          </p>
        )}

        {comparison && (
          <>
            <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-black/5 text-start text-xs font-bold uppercase tracking-wide text-brand-950/40">
                    <th className="px-4 py-3 text-start">{isTr ? "Kategori" : "Category"}</th>
                    <th className="px-4 py-3 text-start">{labelA}</th>
                    <th className="px-4 py-3 text-start">{labelB}</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_CATEGORIES.map((cat) => (
                    <tr key={cat} className="border-b border-black/5 last:border-0">
                      <td className="px-4 py-3 font-semibold text-brand-950">{dict.compare.categoryLabels[cat]}</td>
                      <td className="px-4 py-3 text-brand-950/70">{comparison[cat].a}</td>
                      <td className="px-4 py-3 text-brand-950/70">{comparison[cat].b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 rounded-2xl border border-black/5 bg-brand-50 p-6">
              <div className="text-xs font-bold uppercase tracking-wide text-brand-500">
                {dict.compare.recommendationTitle}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-brand-950/80">{comparison.recommendation}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
