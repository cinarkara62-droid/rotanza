"use client";

import { useEffect, useRef, useState } from "react";
import { cities } from "@/lib/mock-data/cities";
import type { Locale } from "@/lib/i18n/config";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

export interface CustomCity {
  name: string;
  lat: number;
  lon: number;
}

interface GeocodeResult {
  osmId: number;
  name: string;
  displayName: string;
  lat: number;
  lon: number;
}

export function CitySearchInput({
  locale,
  label,
  curatedLabel,
  otherLabel,
  noResultsLabel,
  onSelectCurated,
  onSelectCustom,
}: {
  locale: Locale;
  label: string;
  curatedLabel: string;
  otherLabel: string;
  noResultsLabel: string;
  onSelectCurated: (cityId: string) => void;
  onSelectCustom: (city: CustomCity) => void;
}) {
  const isTr = locale === "tr";
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [liveResults, setLiveResults] = useState<GeocodeResult[]>([]);
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

  const curatedMatches = cities.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.cityTr.toLowerCase().includes(q) ||
      c.cityEn.toLowerCase().includes(q) ||
      c.countryTr.toLowerCase().includes(q) ||
      c.countryEn.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale results when the query is cleared, not a render loop
      setLiveResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetchWithTimeout(`/api/geocode?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setLiveResults(data.results ?? []);
      } catch {
        setLiveResults([]);
      } finally {
        setLoading(false);
      }
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function selectCurated(cityId: string) {
    const c = cities.find((x) => x.id === cityId)!;
    setQuery(`${c.emoji} ${isTr ? c.cityTr : c.cityEn}`);
    setOpen(false);
    onSelectCurated(cityId);
  }

  function selectCustom(r: GeocodeResult) {
    setQuery(r.name);
    setOpen(false);
    onSelectCustom({ name: r.name, lat: r.lat, lon: r.lon });
  }

  return (
    <div ref={rootRef} className="relative flex flex-1 flex-col gap-2 text-sm font-medium text-brand-50">
      {label}
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={isTr ? "Bir şehir ara..." : "Search a city..."}
        className="rounded-xl border border-white/15 bg-sand-100 px-3 py-2.5 text-sm text-brand-50 outline-none focus:border-brand-400"
      />
      {open && (
        <div className="absolute top-full z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-2xl border border-white/10 bg-sand-100 py-2 shadow-xl">
          {curatedMatches.length > 0 && (
            <div>
              <div className="px-3.5 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wide text-brand-50/40">
                {curatedLabel}
              </div>
              {curatedMatches.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectCurated(c.id)}
                  className="flex w-full items-center gap-2 px-3.5 py-2 text-start text-sm text-brand-50/80 hover:bg-sand-50"
                >
                  <span>{c.emoji}</span>
                  {isTr ? c.cityTr : c.cityEn}
                  <span className="text-xs text-brand-50/40">{isTr ? c.countryTr : c.countryEn}</span>
                </button>
              ))}
            </div>
          )}

          {query.trim().length >= 2 && (
            <div>
              <div className="border-t border-white/10 px-3.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-brand-50/40">
                {otherLabel} {loading && "…"}
              </div>
              {liveResults
                .filter((r) => !curatedMatches.some((c) => (isTr ? c.cityTr : c.cityEn) === r.name))
                .map((r) => (
                  <button
                    key={r.osmId}
                    type="button"
                    onClick={() => selectCustom(r)}
                    className="flex w-full flex-col px-3.5 py-2 text-start text-sm text-brand-50/80 hover:bg-sand-50"
                  >
                    <span>📍 {r.name}</span>
                    <span className="truncate text-xs text-brand-50/40">{r.displayName}</span>
                  </button>
                ))}
              {!loading && liveResults.length === 0 && curatedMatches.length === 0 && (
                <div className="px-3.5 py-2 text-sm text-brand-50/40">{noResultsLabel}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
