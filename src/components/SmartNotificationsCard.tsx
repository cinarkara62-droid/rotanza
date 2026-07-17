"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { ToggleSwitch } from "@/components/ToggleSwitch";

interface NotificationOption {
  key: string;
  titleTr: string;
  titleEn: string;
  descTr: string;
  descEn: string;
  // None of these are wired to a real reminder-delivery backend yet — this
  // is preference UI only (persisted client-side). Marked "Coming soon"
  // rather than left toggleable, since toggling them currently does
  // nothing real.
  implemented: boolean;
}

const OPTIONS: NotificationOption[] = [
  {
    key: "checkin",
    titleTr: "Uçuş Check-in Hatırlatıcısı",
    titleEn: "Flight Check-in Reminder",
    descTr: "Online check-in açıldığında bildirim al.",
    descEn: "Get notified when online check-in opens.",
    implemented: false,
  },
  {
    key: "hotelCheckin",
    titleTr: "Otel Check-in Hatırlatıcısı",
    titleEn: "Hotel Check-in Reminder",
    descTr: "Otel check-in'inden önce bildirim al.",
    descEn: "Get notified before hotel check-in.",
    implemented: false,
  },
  {
    key: "boarding",
    titleTr: "Biniş Hatırlatıcısı",
    titleEn: "Boarding Reminder",
    descTr: "Biniş saatini asla kaçırma.",
    descEn: "Never miss your boarding time.",
    implemented: false,
  },
  {
    key: "transfer",
    titleTr: "Havalimanı Transfer Hatırlatıcısı",
    titleEn: "Airport Transfer Reminder",
    descTr: "Taksiye çıkma zamanı geldiğinde hatırlatma al.",
    descEn: "Receive a reminder when it's time to leave for your taxi.",
    implemented: false,
  },
  {
    key: "delay",
    titleTr: "Uçuş Gecikme Uyarıları",
    titleEn: "Flight Delay Alerts",
    descTr: "Uçuşunuz gecikirse anında uyarı alın.",
    descEn: "Instant alerts if your flight is delayed.",
    implemented: false,
  },
  {
    key: "gate",
    titleTr: "Kapı Değişikliği Uyarıları",
    titleEn: "Gate Change Alerts",
    descTr: "Kalkış kapınız değişirse hemen haberdar olun.",
    descEn: "Be notified immediately if your departure gate changes.",
    implemented: false,
  },
  {
    key: "weather",
    titleTr: "Hava Durumu Uyarıları",
    titleEn: "Weather Alerts",
    descTr: "Varıştan önce hedef şehrin hava durumunu öğrenin.",
    descEn: "Receive destination weather updates before arrival.",
    implemented: false,
  },
  {
    key: "localTransport",
    titleTr: "Yerel Ulaşım Uyarıları",
    titleEn: "Local Transportation Alerts",
    descTr: "Metro aksaklıkları veya ulaşım sorunlarından haberdar olun.",
    descEn: "Know about metro disruptions or transportation issues.",
    implemented: false,
  },
];

const STORAGE_KEY = "rotanza:notification-prefs";

export function SmartNotificationsCard({ locale, plan }: { locale: Locale; plan: string }) {
  const isTr = locale === "tr";
  const isPremium = plan === "pro" || plan === "max";

  const [prefs, setPrefs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isPremium) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage once on mount, not a render loop
      if (raw) setPrefs(JSON.parse(raw));
    } catch {
      // ignore malformed/unavailable storage
    }
  }, [isPremium]);

  function toggle(key: string, next: boolean) {
    setPrefs((prev) => {
      const updated = { ...prev, [key]: next };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore storage write failures (private mode, quota, etc.)
      }
      return updated;
    });
  }

  return (
    <div className="relative mt-12 overflow-hidden rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-2">
        <span className="text-xl">🔔</span>
        <h2 className="text-lg font-bold text-brand-950">
          {isTr ? "Akıllı Seyahat Bildirimleri" : "Smart Travel Notifications"}
        </h2>
      </div>
      <p className="mt-1.5 text-sm text-brand-950/60">
        {isTr
          ? "Yolculuğunuz öncesinde ve sırasında akıllı hatırlatmalar alın."
          : "Receive intelligent reminders before and during your journey."}
      </p>

      <div className={`mt-6 space-y-1 ${isPremium ? "" : "pointer-events-none select-none blur-[2px]"}`}>
        {OPTIONS.map((opt) => (
          <div
            key={opt.key}
            className="flex items-center justify-between gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-sand-50"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-brand-950">{isTr ? opt.titleTr : opt.titleEn}</span>
                {!opt.implemented && (
                  <span className="shrink-0 rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-950/40">
                    {isTr ? "Yakında" : "Coming soon"}
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-xs text-brand-950/50">{isTr ? opt.descTr : opt.descEn}</div>
            </div>
            <ToggleSwitch
              checked={!!prefs[opt.key]}
              onChange={(next) => toggle(opt.key, next)}
              disabled={!isPremium || !opt.implemented}
              label={isTr ? opt.titleTr : opt.titleEn}
            />
          </div>
        ))}
      </div>

      {!isPremium && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="mx-4 flex flex-col items-center rounded-2xl border border-black/5 bg-white px-8 py-7 text-center shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-2xl">🔒</div>
            <span className="mt-3 rounded-full bg-brand-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
              {isTr ? "Pro ve Max ile kullanılabilir" : "Available with Pro & Max"}
            </span>
            <Link
              href={`/${locale}/pricing`}
              className="mt-4 rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-transform hover:scale-[1.03]"
            >
              {isTr ? "Pro'ya Yükselt" : "Upgrade to Pro"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
