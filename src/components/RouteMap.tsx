"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import type { ItineraryDay, ItineraryStop } from "@/lib/planner";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { ViewpointInsight } from "@/lib/claude";

const CAMERA_ICON = L.divIcon({
  className: "",
  html: `<div style="background:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 1px 4px rgba(0,0,0,0.35);border:1px solid rgba(0,0,0,0.1);">📷</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Independent from the brand/sand/coral tokens on purpose — this is a route
// legend (one color per day), not a UI accent color.
const DAY_COLORS = ["#2563eb", "#f97316", "#7c3aed", "#0d9488", "#db2777"];

function dayColor(day: number) {
  return DAY_COLORS[(day - 1) % DAY_COLORS.length];
}

function numberedIcon(label: string, color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;box-shadow:0 1px 4px rgba(0,0,0,0.35);">${label}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

interface Stop extends ItineraryStop {
  day: number;
  order: number;
}

function stopsWithCoords(itinerary: ItineraryDay[]): Stop[] {
  const stops: Stop[] = [];
  for (const entry of itinerary) {
    (["morning", "afternoon", "evening"] as const).forEach((slot, i) => {
      const poi = entry[slot];
      if (poi?.lat != null && poi?.lon != null) {
        stops.push({ ...poi, day: entry.day, order: i + 1 });
      }
    });
  }
  return stops;
}

interface Viewpoint {
  osmId: number;
  name: string;
  lat: number;
  lon: number;
}

function ViewpointMarker({ point, destination, locale }: { point: Viewpoint; destination: string; locale: string }) {
  const [insight, setInsight] = useState<ViewpointInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const isTr = locale === "tr";

  async function loadInsight() {
    if (insight || loading) return;
    setLoading(true);
    try {
      const res = await fetchWithTimeout(
        "/api/viewpoint-insight",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: point.name, destination, locale }),
        },
        15000
      );
      const data = await res.json();
      if (data.insight) setInsight(data.insight);
    } catch {
      // silently no insight — the popup still shows the name
    } finally {
      setLoading(false);
    }
  }

  return (
    <Marker position={[point.lat, point.lon]} icon={CAMERA_ICON} eventHandlers={{ click: loadInsight }}>
      <Popup>
        <div className="text-sm">
          <div className="font-semibold">{point.name}</div>
          {loading && <div className="mt-1 text-xs text-brand-50/50">{isTr ? "Yükleniyor…" : "Loading…"}</div>}
          {insight && (
            <div className="mt-1 space-y-1 text-xs">
              <div>{insight.reason}</div>
              <div>
                <span className="font-semibold">{isTr ? "Gün batımı" : "Sunset"}:</span> {insight.sunsetSuitability}
              </div>
              <div>
                <span className="font-semibold">{isTr ? "Kalabalık" : "Crowd"}:</span> {insight.crowdLevel}
              </div>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

export function RouteMap({
  itinerary,
  selectedStopId,
  onSelectStop,
  destination,
  locale = "tr",
}: {
  itinerary: ItineraryDay[];
  selectedStopId: string | null;
  onSelectStop: (stop: ItineraryStop) => void;
  destination?: string;
  locale?: string;
}) {
  const stops = stopsWithCoords(itinerary);
  const [viewpoints, setViewpoints] = useState<Viewpoint[]>([]);

  const center: [number, number] | null = stops.length ? [stops[0].lat!, stops[0].lon!] : null;

  useEffect(() => {
    if (!center) return;
    let cancelled = false;
    fetchWithTimeout(`/api/viewpoints?lat=${center[0]}&lon=${center[1]}`, undefined, 20000)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setViewpoints(data.results ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when the map's center city changes
  }, [center?.[0], center?.[1]]);

  if (!stops.length || !center) return null;

  const byDay = new Map<number, Stop[]>();
  for (const s of stops) {
    if (!byDay.has(s.day)) byDay.set(s.day, []);
    byDay.get(s.day)!.push(s);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 shadow-sm">
      <MapContainer center={center} zoom={13} style={{ height: "420px", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {[...byDay.entries()].map(([day, dayStops]) => (
          <Polyline
            key={day}
            positions={dayStops.map((s) => [s.lat!, s.lon!])}
            pathOptions={{ color: dayColor(day), weight: 3, opacity: 0.7 }}
          />
        ))}
        {stops.map((s) => (
          <Marker
            key={s.id}
            position={[s.lat!, s.lon!]}
            icon={numberedIcon(String(s.order), dayColor(s.day))}
            eventHandlers={{ click: () => onSelectStop(s) }}
            opacity={selectedStopId && selectedStopId !== s.id ? 0.6 : 1}
          />
        ))}
        {viewpoints.map((v) => (
          <ViewpointMarker key={v.osmId} point={v} destination={destination ?? ""} locale={locale} />
        ))}
      </MapContainer>
    </div>
  );
}
