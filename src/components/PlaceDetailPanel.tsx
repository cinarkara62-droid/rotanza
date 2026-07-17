"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { ItineraryStop } from "@/lib/planner";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

export function PlaceDetailPanel({
  stop,
  locale,
  onClose,
}: {
  stop: ItineraryStop;
  locale: Locale;
  onClose: () => void;
}) {
  const isTr = locale === "tr";
  const [photoUrl, setPhotoUrl] = useState<string | null>(stop.photoUrl ?? null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting to the new stop's photo before fetching, not a render loop
    setPhotoUrl(stop.photoUrl ?? null);
    if (stop.photoUrl) return;
    const params = new URLSearchParams();
    if (stop.wikidataId) params.set("wikidataId", stop.wikidataId);
    params.set("name", isTr ? stop.nameTr : stop.nameEn);
    let cancelled = false;
    fetchWithTimeout(`/api/place-photo?${params}`, undefined, 8000)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.photoUrl) setPhotoUrl(data.photoUrl);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-fetch only when the selected stop identity changes
  }, [stop.id]);

  return (
    <div className="animate-card-in overflow-hidden rounded-2xl border border-black/5 bg-[var(--background)]/85 shadow-lg backdrop-blur-md">
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable Wikimedia dimensions
        <img src={photoUrl} alt={isTr ? stop.nameTr : stop.nameEn} className="h-40 w-full object-cover" />
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-lg font-bold text-brand-950">
            <span className="text-xl">{stop.emoji}</span>
            {isTr ? stop.nameTr : stop.nameEn}
          </div>
          <button onClick={onClose} className="text-sm text-brand-950/40 hover:text-brand-950/70">
            ✕
          </button>
        </div>
        <p className="mt-1 text-sm text-brand-950/60">{isTr ? stop.descTr : stop.descEn}</p>

        {(stop.openingHours || stop.phone || stop.website) && (
          <div className="mt-3 space-y-1 text-xs text-brand-950/70">
            {stop.openingHours && (
              <div>
                <span className="font-semibold">{isTr ? "Açılış saatleri" : "Opening hours"}:</span> {stop.openingHours}
              </div>
            )}
            {stop.phone && (
              <div>
                <span className="font-semibold">{isTr ? "Telefon" : "Phone"}:</span> {stop.phone}
              </div>
            )}
            {stop.website && (
              <div>
                <span className="font-semibold">{isTr ? "Web sitesi" : "Website"}:</span>{" "}
                <a href={stop.website} target="_blank" rel="noreferrer" className="text-brand-600 underline">
                  {stop.website}
                </a>
              </div>
            )}
          </div>
        )}

        {(stop.aiTip || stop.bestVisitTime || stop.crowdNote) && (
          <div className="mt-4 rounded-xl bg-brand-50 p-3 text-xs text-brand-700">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-brand-950/40">
              {isTr ? "Yapay zekâ tavsiyesi (genel tahmin)" : "AI advice (general estimate)"}
            </div>
            {stop.bestVisitTime && (
              <div>
                <span className="font-semibold">{isTr ? "En iyi ziyaret zamanı" : "Best visit time"}:</span>{" "}
                {stop.bestVisitTime}
              </div>
            )}
            {stop.crowdNote && <div className="mt-1">{stop.crowdNote}</div>}
            {stop.aiTip && <div className="mt-1">{stop.aiTip}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
