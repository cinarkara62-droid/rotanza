import Link from "next/link";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { notFound } from "next/navigation";
import { HeroQuickSearch } from "@/components/HeroQuickSearch";
import { LanguageStrip } from "@/components/LanguageStrip";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale as Locale);
  const l = locale as Locale;

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-300 via-brand-400 to-brand-600 px-4 pb-24 pt-14 sm:px-6 sm:pt-20 lg:px-8">
        {/* decorative clouds */}
        <div className="pointer-events-none absolute -left-10 top-24 h-40 w-72 rounded-full bg-white/40 blur-2xl" />
        <div className="pointer-events-none absolute right-10 top-10 h-32 w-56 rounded-full bg-white/30 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-96 rounded-full bg-white/20 blur-3xl" />
        {/* soft fade into the page background instead of a hard color cut */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[var(--background)] sm:h-36" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8">
          <div className="relative z-10 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-brand-950/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-50">
                {dict.home.hero.eyebrow}
              </span>
              <span className="inline-flex items-center rounded-full bg-coral-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-coral-600">
                {dict.home.demoNotice}
              </span>
            </div>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.05] tracking-tight text-brand-50 sm:text-6xl">
              {dict.home.hero.titleLine1}
              <br />
              {dict.home.hero.titleLine2}
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-brand-50/80">
              {dict.home.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={`/${l}/planner`}
                className="rounded-full bg-brand-950 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-950/20 transition-transform hover:scale-[1.03]"
              >
                {dict.home.hero.ctaPrimary}
              </Link>
              <a
                href="#how-it-works"
                className="flex items-center gap-2 rounded-full bg-white/70 px-5 py-3.5 text-sm font-semibold text-brand-950 backdrop-blur transition-colors hover:bg-white/90"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-950 text-[10px] text-white">
                  ▶
                </span>
                {dict.home.hero.ctaSecondary}
              </a>
            </div>

            <HeroQuickSearch
              locale={l}
              label={dict.home.hero.searchLabel}
              placeholder={dict.home.hero.searchPlaceholder}
              cta={dict.home.hero.searchCta}
            />
          </div>

          {/* floating landmark stack */}
          <div className="relative hidden min-h-[380px] lg:block">
            <div
              className="animate-float-slow absolute right-24 top-2 flex h-40 w-40 rotate-[-6deg] items-center justify-center rounded-[2rem] bg-sand-100 text-7xl shadow-xl"
              style={{ ["--rot" as string]: "-6deg" }}
            >
              🗼
            </div>
            <div
              className="animate-float-slow-delay absolute right-0 top-40 flex h-32 w-32 rotate-[5deg] items-center justify-center rounded-[1.75rem] bg-sand-100 text-5xl shadow-xl"
              style={{ ["--rot" as string]: "5deg" }}
            >
              🕌
            </div>
            <div
              className="animate-float-slow absolute left-4 top-56 flex h-28 w-28 rotate-[-4deg] items-center justify-center rounded-[1.5rem] bg-sand-100 text-4xl shadow-xl"
              style={{ ["--rot" as string]: "-4deg" }}
            >
              🏛️
            </div>

            <div className="absolute left-0 top-16 flex w-64 items-center gap-3 rounded-2xl bg-sand-100 p-3 shadow-lg">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg">
                🧭
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-brand-50">{dict.home.hero.chip1Title}</p>
                <p className="truncate text-[11px] text-brand-50/50">{dict.home.hero.chip1Sub}</p>
              </div>
            </div>

            <div className="absolute bottom-4 right-16 flex w-60 items-center gap-3 rounded-2xl bg-sand-100 p-3 shadow-lg">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral-500/15 text-lg">
                🔔
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-brand-50">{dict.home.hero.chip2Title}</p>
                <p className="truncate text-[11px] font-semibold text-coral-600">{dict.home.hero.chip2Sub}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <p className="mx-auto max-w-2xl px-4 pt-8 text-center text-sm text-brand-50/50">
        {dict.home.trustedBy}
      </p>
      <div className="pb-8">
        <LanguageStrip locale={l} label={dict.home.languagesLabel} />
      </div>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-500">
            {dict.home.features.eyebrow}
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-brand-50 sm:text-4xl">
            {dict.home.features.title}
          </h2>
          <p className="mt-4 text-base text-brand-50/60">{dict.home.features.subtitle}</p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dict.home.features.items.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-sand-100 p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-xl">
                {item.icon}
              </div>
              <h3 className="mt-4 text-base font-semibold text-brand-50">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-50/60">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHY ROTANZA */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-brand-50 sm:text-4xl">{dict.home.why.title}</h2>
            <p className="mt-4 text-base text-brand-50/60">{dict.home.why.subtitle}</p>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-sand-100 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-sand-50/60">
                  <th className="px-5 py-3 font-semibold text-brand-50">{dict.home.why.headerFeature}</th>
                  <th className="px-5 py-3 text-center font-semibold text-brand-300">{dict.home.why.headerUs}</th>
                  <th className="px-5 py-3 text-center font-semibold text-brand-50/50">{dict.home.why.headerOthers}</th>
                </tr>
              </thead>
              <tbody>
                {dict.home.why.rows.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 1 ? "bg-sand-50/40" : ""}>
                    <td className="px-5 py-3.5 text-brand-50/80">{row.feature}</td>
                    <td className="px-5 py-3.5 text-center text-base">✅</td>
                    <td className="px-5 py-3.5 text-center text-base">
                      {row.others === "partial" ? "⚠️" : "❌"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-sand-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight text-brand-50 sm:text-4xl">
            {dict.home.how.title}
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {dict.home.how.steps.map((step, i) => (
              <div key={step.title} className="relative rounded-2xl bg-sand-100 p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-950 text-sm font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-base font-semibold text-brand-50">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-50/60">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-brand-950 px-8 py-10 text-center sm:flex-row sm:text-left">
          <div>
            <h3 className="text-2xl font-bold text-white">{dict.home.pricingTeaser.title}</h3>
            <p className="mt-2 text-sm text-white/60">{dict.home.pricingTeaser.subtitle}</p>
          </div>
          <Link
            href={`/${l}/pricing`}
            className="shrink-0 rounded-full bg-sand-100 px-6 py-3 text-sm font-semibold text-brand-50 transition-transform hover:scale-[1.03]"
          >
            {dict.home.pricingTeaser.cta}
          </Link>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-3xl px-4 pb-24 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-brand-50">{dict.home.finalCta.title}</h2>
        <p className="mt-3 text-base text-brand-50/60">{dict.home.finalCta.subtitle}</p>
        <Link
          href={`/${l}/planner`}
          className="mt-7 inline-block rounded-full bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-transform hover:scale-[1.03]"
        >
          {dict.home.finalCta.cta}
        </Link>
      </section>
    </div>
  );
}
