import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "../globals.css";
import { isLocale, isRtl, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Providers } from "@/components/Providers";
import { auth } from "@/auth";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = isLocale(locale) ? getDictionary(locale) : getDictionary("tr");
  return {
    title: `${dict.common.brand} — ${dict.home.hero.titleLine1} ${dict.home.hero.titleLine2}`,
    description: dict.home.hero.subtitle,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale as Locale);
  const session = await auth();

  return (
    <html lang={locale} dir={isRtl(locale as Locale) ? "rtl" : "ltr"}>
      <head>
        <Script
          id="travelpayouts-drive"
          strategy="afterInteractive"
          data-noptimize="1"
          data-cfasync="false"
          data-wpfc-render="false"
          seraph-accel-crit="1"
          data-no-defer="1"
          dangerouslySetInnerHTML={{
            __html: `(function () {
  var script = document.createElement("script");
  script.async = 1;
  script.src = 'https://tpembars.com/NTUxNjl5.js?t=551629';
  document.head.appendChild(script);
})();`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <Providers session={session}>
          <Navbar locale={locale as Locale} dict={dict} />
          <main>{children}</main>
          <Footer locale={locale as Locale} dict={dict} />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
