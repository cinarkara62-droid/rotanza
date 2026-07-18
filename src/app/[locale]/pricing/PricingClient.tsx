"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { PageHeader } from "@/components/PageHeader";
import { PageBackground } from "@/components/PageBackground";
import type { PlanId, BillingCycle } from "@/lib/stripe";

export function PricingClient({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const [yearly, setYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  const { free, pro, max } = dict.pricing.plans;

  const proPrice = yearly ? Math.round(pro.priceYearly / 12) : pro.priceMonthly;
  const maxPrice = yearly ? Math.round(max.priceYearly / 12) : max.priceMonthly;
  const cycle: BillingCycle = yearly ? "yearly" : "monthly";

  async function handleUpgrade(plan: PlanId) {
    if (status !== "authenticated" || !session) {
      router.push(`/${locale}/signup`);
      return;
    }
    setLoadingPlan(plan);
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
      setLoadingPlan(null);
    }
  }

  return (
    <div className="relative z-10 mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <PageBackground
        gradientClassName="bg-gradient-to-br from-[#0a1a2e] via-[#141826] to-[#171018]"
        dotColor="#34acf7"
        dotSeedA={29}
        dotSeedB={11}
        blobs={[
          { x: "50%", y: "6%", size: 320, delay: "0s", duration: "18s" },
          { x: "10%", y: "60%", size: 220, delay: "2s", duration: "16s" },
          { x: "88%", y: "56%", size: 240, delay: "1.4s", duration: "17s" },
        ]}
        blobColorClass="from-brand-300/22 via-coral-400/8 to-white/0"
      />
      <PageHeader eyebrow={dict.pricing.eyebrow} title={dict.pricing.title} subtitle={dict.pricing.subtitle} />

      <div className="mt-8 flex justify-center">
        <div className="inline-flex items-center rounded-full border border-white/15 bg-sand-100 p-1">
          <button
            onClick={() => setYearly(false)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              !yearly ? "bg-brand-950 text-white" : "text-brand-50/60"
            }`}
          >
            {dict.pricing.monthly}
          </button>
          <button
            onClick={() => setYearly(true)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              yearly ? "bg-brand-950 text-white" : "text-brand-50/60"
            }`}
          >
            {dict.pricing.yearly}
            <span className="rounded-full bg-brand-500/20 px-1.5 py-0.5 text-[10px] font-bold text-brand-300">
              {dict.pricing.yearlyBadge}
            </span>
          </button>
        </div>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
        {/* FREE */}
        <div className="rounded-3xl border border-white/10 bg-sand-100 p-7">
          <h3 className="text-lg font-bold text-brand-50">{free.name}</h3>
          <p className="mt-1 text-sm text-brand-50/50">{free.tagline}</p>
          <div className="mt-5 text-3xl font-extrabold text-brand-50">$0</div>
          <ul className="mt-6 space-y-3">
            {free.features.map((f) => (
              <li key={f} className="flex gap-2 text-sm text-brand-50/70">
                <span className="text-brand-500">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => router.push(`/${locale}/signup`)}
            className="mt-8 w-full rounded-full border border-white/15 py-3 text-sm font-semibold text-brand-50"
          >
            {free.cta}
          </button>
        </div>

        {/* PRO */}
        <div className="relative rounded-3xl border-2 border-brand-500 bg-sand-100 p-7 shadow-xl shadow-brand-500/10 md:scale-[1.03]">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white">
            {dict.pricing.mostPopular}
          </span>
          <h3 className="text-lg font-bold text-brand-50">{pro.name}</h3>
          <p className="mt-1 text-sm text-brand-50/50">{pro.tagline}</p>
          <div className="mt-5 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-brand-50">${proPrice}</span>
            <span className="text-sm text-brand-50/50">{dict.pricing.perMonth}</span>
          </div>
          <ul className="mt-6 space-y-3">
            {pro.features.map((f) => (
              <li key={f} className="flex gap-2 text-sm text-brand-50/70">
                <span className="text-brand-500">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleUpgrade("pro")}
            disabled={loadingPlan !== null}
            className="mt-8 w-full rounded-full bg-brand-500 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/25 disabled:opacity-60"
          >
            {loadingPlan === "pro" ? "…" : pro.cta}
          </button>
        </div>

        {/* MAX */}
        <div className="rounded-3xl border border-white/10 bg-brand-950 p-7 text-white">
          <h3 className="text-lg font-bold">{max.name}</h3>
          <p className="mt-1 text-sm text-white/50">{max.tagline}</p>
          <div className="mt-5 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold">${maxPrice}</span>
            <span className="text-sm text-white/50">{dict.pricing.perMonth}</span>
          </div>
          <ul className="mt-6 space-y-3">
            {max.features.map((f) => (
              <li key={f} className="flex gap-2 text-sm text-white/80">
                <span className="text-brand-300">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleUpgrade("max")}
            disabled={loadingPlan !== null}
            className="mt-8 w-full rounded-full bg-sand-100 py-3 text-sm font-semibold text-brand-50 disabled:opacity-60"
          >
            {loadingPlan === "max" ? "…" : max.cta}
          </button>
        </div>
      </div>

      <div className="mx-auto mt-20 max-w-2xl">
        <h2 className="text-center text-2xl font-bold text-brand-50">{dict.pricing.faq.title}</h2>
        <div className="mt-6 space-y-3">
          {dict.pricing.faq.items.map((item) => (
            <details key={item.q} className="group rounded-2xl border border-white/10 bg-sand-100 p-5">
              <summary className="cursor-pointer list-none text-sm font-semibold text-brand-50 marker:content-none">
                <span className="flex items-center justify-between">
                  {item.q}
                  <span className="ml-4 text-brand-50/40 transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-brand-50/60">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
