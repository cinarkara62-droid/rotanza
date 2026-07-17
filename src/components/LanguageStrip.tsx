"use client";

import { usePathname, useRouter } from "next/navigation";
import { locales, localeNames, type Locale } from "@/lib/i18n/config";

export function LanguageStrip({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: Locale) {
    if (next === locale) return;
    const segments = pathname.split("/");
    segments[1] = next;
    const nextPath = segments.join("/") || `/${next}`;
    // eslint-disable-next-line react-hooks/immutability -- click-handler side effect, never runs during render
    document.cookie = `locale=${next}; path=/; max-age=31536000`;
    router.push(nextPath);
  }

  return (
    <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-2 gap-y-2 px-4 text-center">
      <span className="text-xs font-semibold uppercase tracking-wide text-brand-50/40">
        🌐 {label}:
      </span>
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => switchTo(l)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            l === locale
              ? "border-brand-500 bg-brand-500 text-white"
              : "border-white/15 bg-sand-100 text-brand-50/70 hover:border-brand-300"
          }`}
        >
          {localeNames[l]}
        </button>
      ))}
    </div>
  );
}
