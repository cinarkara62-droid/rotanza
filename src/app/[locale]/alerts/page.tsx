import { isLocale, type Locale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { AlertsClient } from "./AlertsClient";

export default async function AlertsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <AlertsClient locale={locale as Locale} />;
}
