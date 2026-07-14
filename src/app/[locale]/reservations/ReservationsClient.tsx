"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { PageHeader } from "@/components/PageHeader";
import { Reservation } from "@/lib/types";

const STORAGE_KEY = "rotanza:reservations";
const TYPE_EMOJI: Record<Reservation["type"], string> = {
  flight: "✈️",
  hotel: "🏨",
  restaurant: "🍽️",
  activity: "🎟️",
};
const TYPES: Reservation["type"][] = ["flight", "hotel", "restaurant", "activity"];

export function ReservationsClient({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [type, setType] = useState<Reservation["type"]>("flight");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage after mount, not a render-loop update
      if (raw) setReservations(JSON.parse(raw));
    } catch {
      // ignore malformed local data
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
  }, [reservations, loaded]);

  function resetForm() {
    setType("flight");
    setTitle("");
    setDate("");
    setTime("");
    setConfirmation("");
    setNotes("");
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !date) return;
    const newReservation: Reservation = {
      id: crypto.randomUUID(),
      type,
      title,
      date,
      time: time || undefined,
      confirmation: confirmation || undefined,
      notes: notes || undefined,
    };
    setReservations((prev) => [...prev, newReservation].sort((a, b) => a.date.localeCompare(b.date)));
    resetForm();
    setShowForm(false);
  }

  function handleDelete(id: string) {
    setReservations((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <PageHeader eyebrow={dict.reservations.eyebrow} title={dict.reservations.title} subtitle={dict.reservations.subtitle} />

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

          <div className="flex gap-3 sm:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25"
            >
              {dict.reservations.form.save}
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
                <div className="text-xs font-semibold uppercase tracking-wide text-brand-500">
                  {dict.reservations.typeLabels[r.type]}
                </div>
                <div className="text-sm font-semibold text-brand-950">{r.title}</div>
                <div className="mt-0.5 text-xs text-brand-950/50">
                  {r.date}
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

      {reservations.length > 0 && (
        <p className="mt-6 text-center text-xs text-brand-950/40">{dict.reservations.localOnly}</p>
      )}
    </div>
  );
}
