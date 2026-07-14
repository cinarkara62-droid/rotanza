import { isLocale, type Locale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { BudgetClient } from "./BudgetClient";

export default async function BudgetPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <BudgetClient locale={locale as Locale} />;
}
