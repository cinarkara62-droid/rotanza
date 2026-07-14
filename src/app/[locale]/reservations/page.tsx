import { isLocale, type Locale } from "@/lib/i18n/config";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { ReservationsClient } from "./ReservationsClient";

export default async function ReservationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;

  const session = await auth();
  if (!session?.user?.id) redirect(`/${l}/login`);

  return <ReservationsClient locale={l} />;
}
