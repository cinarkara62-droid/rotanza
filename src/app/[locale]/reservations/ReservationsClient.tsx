"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { PageHeader } from "@/components/PageHeader";
import { AffiliateWidget } from "@/components/AffiliateWidget";
import { SmartNotificationsCard } from "@/components/SmartNotificationsCard";
import { ReservationsPageBackground } from "@/components/ReservationsPageBackground";

const AVIASALES_SRC =
  "https://tpscr.com/content?currency=usd&trs=551629&shmarker=752331&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%2332a8dd&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=0&plain=false&promo_id=7879&campaign_id=100";
const KIWITAXI_SRC =
  "https://tpscr.com/content?currency=USD&trs=551629&shmarker=752331&locale=en&powered_by=true&transfer_options_limit=10&transfer_options=MCR&disable_currency_selector=true&hide_form_extras=true&hide_external_links=true&campaign_id=1&promo_id=3879";

type BookingService = "flights" | "hotels" | "transfer" | "car";

interface Reservation {
  id: string;
  type: "flight" | "hotel" | "restaurant" | "activity";
  title: string;
  date: string;
  time: string | null;
  confirmation: string | null;
  notes: string | null;
}

const TYPE_EMOJI: Record<Reservation["type"], string> = {
  flight: "✈️",
  hotel: "🏨",
  restaurant: "🍽️",
  activity: "🎟️",
};
const TYPES: Reservation["type"][] = ["flight", "hotel", "restaurant", "activity"];

export function ReservationsClient({ locale, plan }: { locale: Locale; plan: string }) {
  const dict = getDictionary(locale);
  const isTr = locale === "tr";

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedService, setExpandedService] = useState<BookingService | null>(null);

  const [type, setType] = useState<Reservation["type"]>("flight");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch("/api/reservations")
      .then((r) => r.json())
      .then((data) => setReservations(data.reservations ?? []))
      .finally(() => setLoading(false));
  }, []);

  function resetForm() {
    setType("flight");
    setTitle("");
    setDate("");
    setTime("");
    setConfirmation("");
    setNotes("");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !date) return;

    setSaving(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, date, time, confirmation, notes }),
      });
      if (!res.ok) {
        alert(isTr ? "Bir şeyler ters gitti, tekrar deneyin." : "Something went wrong, please try again.");
        return;
      }
      const data = await res.json();
      setReservations((prev) => [...prev, data.reservation].sort((a, b) => a.date.localeCompare(b.date)));
      resetForm();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setReservations((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/reservations/${id}`, { method: "DELETE" });
  }

  return (
    <div className="relative z-10 mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <ReservationsPageBackground />
      <PageHeader eyebrow={dict.reservations.eyebrow} title={dict.reservations.title} subtitle={dict.reservations.subtitle} />

      <div className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-500">
          {isTr ? "Rezervasyon Yap" : "Book a Service"}
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(
            [
              {
                key: "flights" as const,
                emoji: "✈️",
                titleTr: "Uçuş",
                titleEn: "Flights",
                descTr: "Aviasales ile en uygun uçuşu bul",
                descEn: "Find the best flights via Aviasales",
                available: true,
              },
              {
                key: "hotels" as const,
                emoji: "🏨",
                titleTr: "Otel",
                titleEn: "Hotels",
                descTr: "Çok yakında",
                descEn: "Coming soon",
                available: false,
              },
              {
                key: "transfer" as const,
                emoji: "🚖",
                titleTr: "Havalimanı Transferi",
                titleEn: "Airport Transfer",
                descTr: "KiwiTaxi ile güvenilir transfer",
                descEn: "Reliable transfer via KiwiTaxi",
                available: true,
              },
              {
                key: "car" as const,
                emoji: "🚗",
                titleTr: "Araç Kiralama",
                titleEn: "Car Rental",
                descTr: "Çok yakında",
                descEn: "Coming soon",
                available: false,
              },
            ]
          ).map((service) => (
            <div key={service.key} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl">
                  {service.emoji}
                </div>
                <div>
                  <div className="text-sm font-semibold text-brand-950">
                    {isTr ? service.titleTr : service.titleEn}
                  </div>
                  <div className="text-xs text-brand-950/40">{isTr ? service.descTr : service.descEn}</div>
                </div>
              </div>
              <button
                type="button"
                disabled={!service.available}
                onClick={() => setExpandedService((prev) => (prev === service.key ? null : service.key))}
                className="mt-4 w-full rounded-full border border-black/10 py-2.5 text-sm font-semibold text-brand-950 transition-colors hover:border-brand-300 hover:bg-sand-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {!service.available
                  ? isTr
                    ? "Çok Yakında"
                    : "Coming Soon"
                  : expandedService === service.key
                    ? isTr
                      ? "Gizle"
                      : "Hide"
                    : isTr
                      ? "Ara"
                      : "Search"}
              </button>
            </div>
          ))}
        </div>

        {expandedService === "flights" && (
          <div className="mt-4 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <AffiliateWidget src={AVIASALES_SRC} />
          </div>
        )}
        {expandedService === "transfer" && (
          <div className="mt-4 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <AffiliateWidget src={KIWITAXI_SRC} />
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-transform hover:scale-[1.02]"
          >
            + {dict.reservations.addNew}
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSave}
          className="mx-auto mt-6 grid grid-cols-1 gap-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:grid-cols-2 sm:p-8"
        >
          <label className="flex flex-col gap-2 text-sm font-medium text-brand-950">
            {dict.reservations.form.type}
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Reservation["type"])}
              className="rounded-xl border border-black/10 bg-sand-50 px-3 py-2.5 text-sm text-brand-950 outline-none focus:border-brand-400"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_EMOJI[t]} {dict.reservations.typeLabels[t]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-brand-950">
            {dict.reservations.form.title}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={dict.reservations.form.titlePlaceholder}
              required
              className="rounded-xl border border-black/10 bg-sand-50 px-3 py-2.5 text-sm text-brand-950 outline-none focus:border-brand-400"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-brand-950">
            {dict.reservations.form.date}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="rounded-xl border border-black/10 bg-sand-50 px-3 py-2.5 text-sm text-brand-950 outline-none focus:border-brand-400"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-brand-950">
            {dict.reservations.form.time}
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-xl border border-black/10 bg-sand-50 px-3 py-2.5 text-sm text-brand-950 outline-none focus:border-brand-400"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-brand-950">
            {dict.reservations.form.confirmation}
            <input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="rounded-xl border border-black/10 bg-sand-50 px-3 py-2.5 text-sm text-brand-950 outline-none focus:border-brand-400"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-brand-950 sm:col-span-2">
            {dict.reservations.form.notes}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="rounded-xl border border-black/10 bg-sand-50 px-3 py-2.5 text-sm text-brand-950 outline-none focus:border-brand-400"
            />
          </label>

          <p className="text-xs leading-relaxed text-brand-950/40 sm:col-span-2">
            {isTr
              ? "Rezervasyon tarihi yaklaştığında hesabınızın e-posta adresine otomatik bir hatırlatma gönderilir."
              : "You'll get an automatic email reminder to your account address as the reservation date approaches."}
          </p>

          <div className="flex gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 disabled:opacity-60"
            >
              {saving ? (isTr ? "Kaydediliyor…" : "Saving…") : dict.reservations.form.save}
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="rounded-full border border-black/10 px-6 py-2.5 text-sm font-semibold text-brand-950/70"
            >
              {dict.reservations.form.cancel}
            </button>
          </div>
        </form>
      )}

      {loading && <p className="mt-10 text-center text-sm text-brand-950/50">{isTr ? "Yükleniyor…" : "Loading…"}</p>}

      {!loading && (
        <div className="mt-10 space-y-3">
          {reservations.length === 0 && !showForm && (
            <p className="text-center text-sm text-brand-950/50">{dict.reservations.empty}</p>
          )}
          {reservations.map((r) => (
            <div
              key={r.id}
              className="flex items-start justify-between gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl">
                  {TYPE_EMOJI[r.type]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-brand-500">
                      {dict.reservations.typeLabels[r.type]}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        r.confirmation ? "bg-brand-500/15 text-brand-700" : "bg-black/5 text-brand-950/40"
                      }`}
                    >
                      {r.confirmation
                        ? isTr
                          ? "Onaylandı"
                          : "Confirmed"
                        : isTr
                          ? "Beklemede"
                          : "Pending"}
                    </span>
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-brand-950">{r.title}</div>
                  <div className="mt-0.5 text-xs text-brand-950/50">
                    {new Date(r.date).toLocaleDateString(isTr ? "tr-TR" : "en-US")}
                    {r.time ? ` · ${r.time}` : ""}
                    {r.confirmation ? ` · #${r.confirmation}` : ""}
                  </div>
                  {r.notes && <p className="mt-1 text-xs text-brand-950/50">{r.notes}</p>}
                </div>
              </div>
              <button
                onClick={() => handleDelete(r.id)}
                className="shrink-0 text-xs font-semibold text-coral-600 hover:underline"
              >
                {dict.reservations.delete}
              </button>
            </div>
          ))}
        </div>
      )}

      <SmartNotificationsCard locale={locale} plan={plan} />
    </div>
  );
}
