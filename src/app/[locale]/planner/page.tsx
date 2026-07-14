import { isLocale, type Locale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { PlannerClient } from "./PlannerClient";

export default async function PlannerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <PlannerClient locale={locale as Locale} />;
}
