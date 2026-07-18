"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { PageHeader } from "@/components/PageHeader";
import { PageBackground } from "@/components/PageBackground";

interface Alert {
  id: string;
  type: "hotel" | "flight";
  name: string;
  location: string;
  entityId: string | null;
  currentPrice: number;
  previousPrice: number;
  targetPrice: number;
  lowestPrice: number;
  priceHistory: number[];
}

const TYPE_EMOJI: Record<Alert["type"], string> = { hotel: "🏨", flight: "✈️" };

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

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [originIata, setOriginIata] = useState("");
  const [destinationIata, setDestinationIata] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [targetPrice, setTargetPrice] = useState("");

  useEffect(() => {
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((data) => setAlerts(data.alerts ?? []))
      .finally(() => setLoading(false));
  }, []);

  function resetForm() {
    setOriginIata("");
    setDestinationIata("");
    setDepartureDate("");
    setTargetPrice("");
    setFormError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(targetPrice) || 0;
    if (!price || !originIata || !destinationIata || !departureDate) return;

    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originIata, destinationIata, departureDate, targetPrice: price }),
      });
      if (res.status === 403) {
        alert(isTr ? "Plan limitine ulaştınız. Daha fazla alarm için Pro veya Max'e yükseltin." : "You've reached your plan limit. Upgrade to Pro or Max for more alerts.");
        return;
      }
      if (res.status === 404) {
        setFormError(isTr ? "Bu tarih için uçuş bulunamadı." : "No flights found for that date.");
        return;
      }
      if (res.status === 503) {
        setFormError(
          isTr
            ? "Uçuş fiyat servisi şu an bağlı değil (Amadeus API anahtarı gerekiyor)."
            : "Flight pricing service isn't connected yet (needs an Amadeus API key)."
        );
        return;
      }
      if (!res.ok) {
        setFormError(isTr ? "Bir şeyler ters gitti, tekrar deneyin." : "Something went wrong, please try again.");
        return;
      }
      const data = await res.json();
      setAlerts((prev) => [data.alert, ...prev]);
      resetForm();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    await fetch(`/api/alerts/${id}`, { method: "DELETE" });
  }

  return (
    <div className="relative z-10 mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <PageBackground
        gradientClassName={{
          light: "bg-gradient-to-br from-[#fdf3ee] via-[#f6f8f7] to-[#eaf6f2]",
          dark: "bg-gradient-to-br from-[#171018] via-[#0d1f33] to-[#0a1a2e]",
        }}
        dotColor={{ light: "#f2632f", dark: "#ff8a5c" }}
        dotSeedA={17}
        dotSeedB={53}
        blobs={[
          { x: "12%", y: "12%", size: 240, delay: "0s", duration: "16s" },
          { x: "82%", y: "10%", size: 220, delay: "2.2s", duration: "18s" },
          { x: "78%", y: "68%", size: 220, delay: "1.2s", duration: "15s" },
          { x: "10%", y: "70%", size: 200, delay: "3.2s", duration: "17s" },
        ]}
        blobColorClass="from-coral-400/20 via-brand-300/10 to-white/0"
      />
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
        <p className="text-xs text-brand-50/40">{dict.alerts.limitNote}</p>
      </div>

      {showForm && (
        <form
          onSubmit={handleSave}
          className="mx-auto mt-6 grid max-w-xl grid-cols-1 gap-4 rounded-3xl border border-white/10 bg-sand-100 p-6 shadow-sm sm:grid-cols-2 sm:p-8"
        >
          <p className="text-xs leading-relaxed text-brand-50/50 sm:col-span-2">
            {isTr
              ? "✈️ Şu an sadece uçuş fiyat alarmı oluşturabilirsiniz — Amadeus üzerinden gerçek fiyatlarla. Otel fiyat takibi, gerçek bir fiyat kaynağı bağlanana kadar kapalı."
              : "✈️ Only flight price alerts can be created right now — backed by real Amadeus pricing. Hotel price tracking is disabled until a real pricing source is connected."}
          </p>

          <label className="flex flex-col gap-2 text-sm font-medium text-brand-50">
            {isTr ? "Kalkış (havalimanı kodu)" : "Origin (airport code)"}
            <input
              value={originIata}
              onChange={(e) => setOriginIata(e.target.value.toUpperCase())}
              placeholder="IST"
              maxLength={3}
              required
              className="rounded-xl border border-white/15 bg-sand-50 px-3 py-2.5 text-sm uppercase text-brand-50 outline-none focus:border-brand-400"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-brand-50">
            {isTr ? "Varış (havalimanı kodu)" : "Destination (airport code)"}
            <input
              value={destinationIata}
              onChange={(e) => setDestinationIata(e.target.value.toUpperCase())}
              placeholder="CDG"
              maxLength={3}
              required
              className="rounded-xl border border-white/15 bg-sand-50 px-3 py-2.5 text-sm uppercase text-brand-50 outline-none focus:border-brand-400"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-brand-50">
            {isTr ? "Kalkış tarihi" : "Departure date"}
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              required
              className="rounded-xl border border-white/15 bg-sand-50 px-3 py-2.5 text-sm text-brand-50 outline-none focus:border-brand-400"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-brand-50">
            {dict.alerts.form.targetPrice}
            <input
              type="number"
              min={1}
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              required
              className="rounded-xl border border-white/15 bg-sand-50 px-3 py-2.5 text-sm text-brand-50 outline-none focus:border-brand-400"
            />
          </label>

          {formError && <p className="text-xs font-medium text-coral-600 sm:col-span-2">{formError}</p>}

          <div className="flex gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (isTr ? "Aranıyor…" : "Searching…") : dict.alerts.form.save}
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="rounded-full border border-white/15 px-6 py-2.5 text-sm font-semibold text-brand-50/70"
            >
              {dict.alerts.form.cancel}
            </button>
          </div>
        </form>
      )}

      {loading && <p className="mt-10 text-center text-sm text-brand-50/50">{isTr ? "Yükleniyor…" : "Loading…"}</p>}

      {!loading && (
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {alerts.map((a) => {
            const dropped = a.currentPrice < a.previousPrice;
            const pct = dropped ? Math.round((1 - a.currentPrice / a.previousPrice) * 100) : 0;
            return (
              <div
                key={a.id}
                className="animate-card-in rounded-2xl border border-white/10 bg-sand-100 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl">
                      {TYPE_EMOJI[a.type]}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-brand-50">{a.name}</div>
                      <div className="text-xs text-brand-50/50">{a.location}</div>
                    </div>
                  </div>
                  {dropped ? (
                    <span className="shrink-0 rounded-full bg-brand-500/15 px-2.5 py-1 text-xs font-bold text-brand-300">
                      ↓ {pct}%
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-brand-50/40">
                      {dict.alerts.noChange}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      {dropped && (
                        <span className="text-sm text-brand-50/40 line-through">
                          ${a.previousPrice.toLocaleString()}
                        </span>
                      )}
                      <span className="text-xl font-bold text-brand-50">${a.currentPrice.toLocaleString()}</span>
                    </div>
                    {dropped && (
                      <div className="text-xs font-medium text-brand-400">
                        {dict.alerts.savings}: ${(a.previousPrice - a.currentPrice).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <Sparkline history={a.priceHistory} />
                </div>

                <button
                  onClick={() => handleDelete(a.id)}
                  className="mt-3 text-xs font-semibold text-coral-600 hover:underline"
                >
                  {dict.reservations.delete}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!loading && alerts.length === 0 && (
        <p className="mt-10 text-center text-sm text-brand-50/50">{dict.alerts.empty}</p>
      )}
    </div>
  );
}
