import { isLocale, type Locale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { PricingClient } from "./PricingClient";

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <PricingClient locale={locale as Locale} />;
}
