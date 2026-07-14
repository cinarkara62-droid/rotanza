import { isLocale, type Locale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { TransportClient } from "./TransportClient";

export default async function TransportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <TransportClient locale={locale as Locale} />;
}
