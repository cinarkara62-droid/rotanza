import { isLocale, type Locale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { RestaurantsClient } from "./RestaurantsClient";

export default async function RestaurantsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <RestaurantsClient locale={locale as Locale} />;
}
