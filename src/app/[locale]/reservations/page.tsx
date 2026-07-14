import { isLocale, type Locale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { ReservationsClient } from "./ReservationsClient";

export default async function ReservationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <ReservationsClient locale={locale as Locale} />;
}
