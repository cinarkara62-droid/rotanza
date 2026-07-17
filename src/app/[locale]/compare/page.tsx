import { isLocale, type Locale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { CompareClient } from "./CompareClient";

export default async function ComparePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <CompareClient locale={locale as Locale} />;
}
