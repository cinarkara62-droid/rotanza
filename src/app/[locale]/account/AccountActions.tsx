"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { PlanId, BillingCycle } from "@/lib/stripe";

export function UpgradeButtons({
  locale,
  viewPlansLabel,
}: {
  locale: Locale;
  viewPlansLabel: string;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  async function upgrade(plan: PlanId, cycle: BillingCycle) {
    setLoading(`${plan}-${cycle}`);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, cycle, locale }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      alert(
        locale === "tr"
          ? "Ödeme sistemi henüz yapılandırılmadı (Stripe API anahtarları eksik)."
          : "Payment isn't configured yet (missing Stripe API keys)."
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        onClick={() => upgrade("pro", "monthly")}
        disabled={!!loading}
        className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading === "pro-monthly" ? "…" : "Pro"}
      </button>
      <button
        onClick={() => upgrade("max", "monthly")}
        disabled={!!loading}
        className="rounded-full bg-brand-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading === "max-monthly" ? "…" : "Max"}
      </button>
      <a
        href={`/${locale}/pricing`}
        className="rounded-full border border-white/15 px-5 py-2.5 text-center text-sm font-semibold text-foreground/70"
      >
        {viewPlansLabel}
      </a>
    </div>
  );
}

export function ManageBillingButton({ locale, label }: { locale: Locale; label: string }) {
  const [loading, setLoading] = useState(false);

  async function manage() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      alert(
        locale === "tr"
          ? "Faturalandırma portalı henüz yapılandırılmadı."
          : "The billing portal isn't configured yet."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={manage}
      disabled={loading}
      className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-foreground/70 disabled:opacity-60"
    >
      {loading ? "…" : label}
    </button>
  );
}
