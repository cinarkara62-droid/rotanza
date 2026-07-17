import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const productLinks = [
    { href: `/${locale}/planner`, label: dict.nav.planner },
    { href: `/${locale}/restaurants`, label: dict.nav.restaurants },
    { href: `/${locale}/transport`, label: dict.nav.transport },
    { href: `/${locale}/budget`, label: dict.nav.budget },
    { href: `/${locale}/reservations`, label: dict.nav.reservations },
    { href: `/${locale}/alerts`, label: dict.nav.alerts },
  ];

  return (
    <footer className="border-t border-white/10 bg-sand-50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <div className="flex items-center gap-1.5 text-lg font-bold tracking-tight text-brand-50">
              <span aria-hidden>✦</span>
              {dict.common.brand}
              <span className="text-brand-500">.</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-brand-50/60">
              {dict.footer.blurb}
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold text-brand-50">{dict.footer.product}</div>
            <ul className="mt-3 space-y-2">
              {productLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-brand-50/60 hover:text-brand-50">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-brand-50">{dict.footer.company}</div>
            <ul className="mt-3 space-y-2">
              {dict.footer.companyLinks.map((l) => (
                <li key={l}>
                  <span className="text-sm text-brand-50/60">{l}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-brand-50">{dict.footer.legal}</div>
            <ul className="mt-3 space-y-2">
              {[`/${locale}/privacy`, `/${locale}/terms`].map((href, i) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-brand-50/60 hover:text-brand-50">
                    {dict.footer.legalLinks[i]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col-reverse items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-brand-50/50">
            © {new Date().getFullYear()} {dict.common.brand}. {dict.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
