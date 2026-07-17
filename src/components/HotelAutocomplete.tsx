"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { searchHotelsByName } from "@/lib/mock-data/hotels";
import { getCity } from "@/lib/mock-data/cities";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

export interface HotelSelection {
  name: string;
  location: string;
  entityId: string;
}

interface LiveResult {
  osmId: number;
  name: string;
  displayName: string;
}

export function HotelAutocomplete({
  locale,
  placeholder,
  onSelect,
}: {
  locale: Locale;
  placeholder: string;
  onSelect: (hotel: HotelSelection) => void;
}) {
  const isTr = locale === "tr";
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<HotelSelection | null>(null);
  const [liveResults, setLiveResults] = useState<LiveResult[]>([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const curatedMatches = searchHotelsByName(query, 6);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 3) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale results when the query shrinks, not a render loop
      setLiveResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        // Sent verbatim to the real Nominatim search API — this is the "characters typed go to a real hotel API" step.
        const res = await fetchWithTimeout(`/api/hotels-search?q=${encodeURIComponent(q + " hotel")}`);
        const data = await res.json();
        setLiveResults(data.results ?? []);
      } catch {
        setLiveResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function pickCurated(h: ReturnType<typeof searchHotelsByName>[number]) {
    const city = getCity(h.cityId);
    const location = city ? (isTr ? city.cityTr : city.cityEn) : "";
    const selection: HotelSelection = { name: h.name, location, entityId: `osm:${h.osmId}` };
    setSelected(selection);
    setQuery(h.name);
    setOpen(false);
    onSelect(selection);
  }

  function pickLive(r: LiveResult) {
    const location = r.displayName.split(",").slice(1, 3).join(",").trim();
    const selection: HotelSelection = { name: r.name, location, entityId: `osm:${r.osmId}` };
    setSelected(selection);
    setQuery(r.name);
    setOpen(false);
    onSelect(selection);
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (selected && e.target.value !== selected.name) setSelected(null);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-black/10 bg-sand-50 px-3 py-2.5 text-sm text-brand-950 outline-none focus:border-brand-400"
        // Free text alone can't be submitted — see the "no selection yet" hint below.
        autoComplete="off"
      />

      {open && query.trim().length >= 2 && (
        <div className="absolute top-full z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-2xl border border-black/5 bg-white py-2 shadow-xl">
          {curatedMatches.length > 0 && (
            <div>
              <div className="px-3.5 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wide text-brand-950/40">
                {isTr ? "Bilinen oteller" : "Known hotels"}
              </div>
              {curatedMatches.map((h) => {
                const city = getCity(h.cityId);
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => pickCurated(h)}
                    className="flex w-full items-center gap-2 px-3.5 py-2 text-start text-sm hover:bg-sand-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-brand-950">🏨 {h.name}</span>
                      <span className="block truncate text-xs text-brand-950/40">
                        {city ? (isTr ? city.cityTr : city.cityEn) : ""}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <div>
            <div className="border-t border-black/5 px-3.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-brand-950/40">
              {isTr ? "Canlı arama sonuçları" : "Live search results"} {loading && "…"}
            </div>
            {liveResults.map((r) => (
              <button
                key={r.osmId}
                type="button"
                onClick={() => pickLive(r)}
                className="flex w-full flex-col px-3.5 py-2 text-start text-sm hover:bg-sand-50"
              >
                <span className="truncate font-medium text-brand-950">📍 {r.name}</span>
                <span className="truncate text-xs text-brand-950/40">{r.displayName}</span>
              </button>
            ))}
            {!loading && liveResults.length === 0 && curatedMatches.length === 0 && (
              <div className="px-3.5 py-2 text-sm text-brand-950/40">
                {isTr ? "Sonuç yok, yazmaya devam edin…" : "No matches yet, keep typing…"}
              </div>
            )}
          </div>
        </div>
      )}

      {!selected && query.trim().length > 0 && (
        <p className="mt-1.5 text-xs text-coral-600">
          {isTr
            ? "Listeden bir otel seçmelisiniz — takip serbest metinle başlatılamaz."
            : "You must pick a hotel from the list — tracking can't start from free text."}
        </p>
      )}
    </div>
  );
}
