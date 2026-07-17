import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, locales } from "@/lib/i18n/config";

function detectLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get("locale")?.value;
  if (cookieLocale && (locales as readonly string[]).includes(cookieLocale)) {
    return cookieLocale;
  }
  const acceptLanguage = request.headers.get("accept-language")?.toLowerCase() ?? "";
  for (const locale of locales) {
    if (acceptLanguage.startsWith(locale)) return locale;
  }
  // fall back to scanning secondary preferences, e.g. "fr-FR,fr;q=0.9,en;q=0.8"
  for (const locale of locales) {
    if (acceptLanguage.includes(`,${locale}`) || acceptLanguage.includes(`${locale};`)) return locale;
  }
  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameHasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
  if (pathnameHasLocale) return NextResponse.next();

  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|.*\\..*).*)"],
};
