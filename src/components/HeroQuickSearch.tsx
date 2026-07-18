"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { parseQuickSearch } from "@/lib/quick-search-parse";

export function HeroQuickSearch({
  locale,
  label,
  placeholder,
  cta,
}: {
  locale: Locale;
  label: string;
  placeholder: string;
  cta: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { cityId, days } = parseQuickSearch(value);
    const params = new URLSearchParams();
    if (cityId) params.set("city", cityId);
    if (days) params.set("days", String(days));
    const query = params.toString();
    router.push(`/${locale}/planner${query ? `?${query}` : ""}`);
  }

  return (
    <div className="mt-8 max-w-md">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <span aria-hidden>✈️</span>
        {label}
      </p>
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-1.5 rounded-full bg-white/95 p-1.5 shadow-lg shadow-brand-950/10 backdrop-blur"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent px-3.5 py-2 text-sm text-brand-950 outline-none placeholder:text-brand-950/40"
        />
        <button
          type="submit"
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-950 px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
        >
          <span aria-hidden>✨</span>
          {cta}
        </button>
      </form>
    </div>
  );
}
