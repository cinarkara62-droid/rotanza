import { isLocale, type Locale } from "@/lib/i18n/config";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { AlertsClient } from "./AlertsClient";

export default async function AlertsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;

  const session = await auth();
  if (!session?.user?.id) redirect(`/${l}/login`);

  return <AlertsClient locale={l} />;
}
