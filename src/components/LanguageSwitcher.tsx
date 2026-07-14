"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { locales, localeNames, type Locale } from "@/lib/i18n/config";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function switchTo(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    const segments = pathname.split("/");
    segments[1] = next;
    const nextPath = segments.join("/") || `/${next}`;
    // eslint-disable-next-line react-hooks/immutability -- click-handler side effect, never runs during render
    document.cookie = `locale=${next}; path=/; max-age=31536000`;
    router.push(nextPath);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-brand-950 shadow-sm"
        aria-expanded={open}
      >
        <span aria-hidden>🌐</span>
        {locale.toUpperCase()}
        <span className={`text-[9px] transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </button>

      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-black/5 bg-white py-1 shadow-xl">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => switchTo(l)}
              className={`flex w-full items-center justify-between px-3.5 py-2 text-start text-sm transition-colors ${
                l === locale ? "bg-brand-50 font-semibold text-brand-700" : "text-brand-950/70 hover:bg-sand-50"
              }`}
              aria-current={l === locale}
            >
              {localeNames[l]}
              <span className="text-[10px] uppercase text-brand-950/40">{l}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
