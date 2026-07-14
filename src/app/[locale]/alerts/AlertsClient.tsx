"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { PageHeader } from "@/components/PageHeader";
import { sampleAlerts } from "@/lib/mock-data/alerts";
import { PriceAlertItem } from "@/lib/types";
import { HotelAutocomplete, type HotelSelection } from "@/components/HotelAutocomplete";

const STORAGE_KEY = "rotanza:custom-alerts";
const TYPE_EMOJI: Record<PriceAlertItem["type"], string> = { hotel: "🏨", flight: "✈️" };
const TYPES: PriceAlertItem["type"][] = ["hotel", "flight"];

function Sparkline({ history }: { history: number[] }) {
  const max = Math.max(...history);
  const min = Math.min(...history);
  const range = Math.max(1, max - min);
  return (
    <div className="flex h-8 items-end gap-1">
      {history.map((v, i) => (
        <div
          key={i}
          className="w-2 rounded-sm bg-brand-300"
          style={{ height: `${8 + ((v - min) / range) * 24}px` }}
        />
      ))}
    </div>
  );
}

export function AlertsClient({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const isTr = locale === "tr";

  const [customAlerts, setCustomAlerts] = useState<PriceAlertItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [type, setType] = useState<PriceAlertItem["type"]>("hotel");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [hotelSelection, setHotelSelection] = useState<HotelSelection | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage after mount, not a render-loop update
      if (raw) setCustomAlerts(JSON.parse(raw));
    } catch {
      // ignore malformed local data
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(customAlerts));
  }, [customAlerts, loaded]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(targetPrice) || 0;
    if (!price) return;
    if (type === "hotel" && !hotelSelection) return; // must pick from autocomplete, no free text
    if (type === "flight" && !title) return;

    const item: PriceAlertItem = {
      id: crypto.randomUUID(),
      type,
      titleTr: type === "hotel" ? hotelSelection!.name : title,
      titleEn: type === "hotel" ? hotelSelection!.name : title,
      routeOrLocationTr: type === "hotel" ? hotelSelection!.location : location,
      routeOrLocationEn: type === "hotel" ? hotelSelection!.location : location,
      originalPrice: price,
      currentPrice: price,
      currency: "TRY",
      history: [price, price, price, price, price],
      emoji: TYPE_EMOJI[type],
      entityId: type === "hotel" ? hotelSelection!.entityId : undefined,
    };
    setCustomAlerts((prev) => [...prev, item]);
    setTitle("");
    setLocation("");
    setTargetPrice("");
    setHotelSelection(null);
    setShowForm(false);
  }

  function handleDelete(id: string) {
    setCustomAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  const allAlerts = [...sampleAlerts, ...customAlerts];

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <PageHeader eyebrow={dict.alerts.eyebrow} title={dict.alerts.title} subtitle={dict.alerts.subtitle} />

      <div className="mt-8 flex flex-col items-center gap-2">
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-transform hover:scale-[1.02]"
          >
            + {dict.alerts.addNew}
          </button>
        )}
        <p className="text-xs text-brand-950/40">{dict.alerts.limitNote}</p>
      </div>

      {showForm && (
        <form
          onSubmit={handleSave}
          className="mx-auto mt-6 grid max-w-xl grid-cols-1 gap-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:grid-cols-2 sm:p-8"
        >
          <label className="flex flex-col gap-2 text-sm font-medium text-brand-950">
            {dict.alerts.form.type}
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as PriceAlertItem["type"]);
                setTitle("");
                setLocation("");
                setHotelSelection(null);
              }}
              className="rounded-xl border border-black/10 bg-sand-50 px-3 py-2.5 text-sm text-brand-950 outline-none focus:border-brand-400"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_EMOJI[t]} {t === "hotel" ? dict.reservations.typeLabels.hotel : dict.reservations.typeLabels.flight}
                </option>
              ))}
            </select>
          </label>
          {type === "hotel" ? (
            <label className="flex flex-col gap-2 text-sm font-medium text-brand-950 sm:col-span-2">
              {dict.alerts.form.title}
              <HotelAutocomplete
                locale={locale}
                placeholder={dict.alerts.form.titlePlaceholder}
                onSelect={(selection) => setHotelSelection(selection)}
              />
            </label>
          ) : (
            <>
              <label className="flex flex-col gap-2 text-sm font-medium text-brand-950">
                {dict.alerts.form.title}
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={dict.alerts.form.titlePlaceholder}
                  required
                  className="rounded-xl border border-black/10 bg-sand-50 px-3 py-2.5 text-sm text-brand-950 outline-none focus:border-brand-400"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-brand-950">
                {dict.alerts.form.location}
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="rounded-xl border border-black/10 bg-sand-50 px-3 py-2.5 text-sm text-brand-950 outline-none focus:border-brand-400"
                />
              </label>
            </>
          )}
          {type === "hotel" && hotelSelection && (
            <p className="text-xs font-medium text-brand-700 sm:col-span-2">
              {isTr ? "Seçilen otel: " : "Selected hotel: "}
              <span className="font-semibold">{hotelSelection.name}</span> · {hotelSelection.location}{" "}
              <span className="text-brand-950/30">({hotelSelection.entityId})</span>
            </p>
          )}
          <label className="flex flex-col gap-2 text-sm font-medium text-brand-950">
            {dict.alerts.form.targetPrice}
            <input
              type="number"
              min={1}
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              required
              className="rounded-xl border border-black/10 bg-sand-50 px-3 py-2.5 text-sm text-brand-950 outline-none focus:border-brand-400"
            />
          </label>
          <p className="text-xs leading-relaxed text-brand-950/40 sm:col-span-2">
            {isTr
              ? "Otel/rota arama sonuçları OpenStreetMap'ten gelen gerçek işletmelerdir. Fiyat takibi şu an bu tarayıcıda simüle edilir — canlı, gerçek zamanlı fiyatlar için bir uçuş/otel fiyat servisine (ör. Amadeus) bağlanmamız gerekiyor."
              : "Hotel/route search results are real businesses from OpenStreetMap. Price tracking is currently simulated in this browser — live, real-time prices require connecting a flight/hotel pricing service (e.g. Amadeus)."}
          </p>
          <div className="flex gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={type === "hotel" && !hotelSelection}
              className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {dict.alerts.form.save}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setTitle("");
                setLocation("");
                setHotelSelection(null);
              }}
              className="rounded-full border border-black/10 px-6 py-2.5 text-sm font-semibold text-brand-950/70"
            >
              {dict.alerts.form.cancel}
            </button>
          </div>
        </form>
      )}

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {allAlerts.map((a) => {
          const dropped = a.currentPrice < a.originalPrice;
          const pct = dropped ? Math.round((1 - a.currentPrice / a.originalPrice) * 100) : 0;
          return (
            <div key={a.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl">
                    {a.emoji}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-brand-950">
                      {isTr ? a.titleTr : a.titleEn}
                    </div>
                    <div className="text-xs text-brand-950/50">
                      {isTr ? a.routeOrLocationTr : a.routeOrLocationEn}
                    </div>
                  </div>
                </div>
                {dropped ? (
                  <span className="shrink-0 rounded-full bg-brand-500/15 px-2.5 py-1 text-xs font-bold text-brand-700">
                    ↓ {pct}%
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-brand-950/40">
                    {dict.alerts.noChange}
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    {dropped && (
                      <span className="text-sm text-brand-950/40 line-through">
                        {a.originalPrice.toLocaleString()} ₺
                      </span>
                    )}
                    <span className="text-xl font-bold text-brand-950">
                      {a.currentPrice.toLocaleString()} ₺
                    </span>
                  </div>
                  {dropped && (
                    <div className="text-xs font-medium text-brand-600">
                      {dict.alerts.savings}: {(a.originalPrice - a.currentPrice).toLocaleString()} ₺
                    </div>
                  )}
                </div>
                <Sparkline history={a.history} />
              </div>

              {customAlerts.some((c) => c.id === a.id) && (
                <button
                  onClick={() => handleDelete(a.id)}
                  className="mt-3 text-xs font-semibold text-coral-600 hover:underline"
                >
                  {dict.reservations.delete}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {allAlerts.length === 0 && (
        <p className="mt-10 text-center text-sm text-brand-950/50">{dict.alerts.empty}</p>
      )}
    </div>
  );
}
