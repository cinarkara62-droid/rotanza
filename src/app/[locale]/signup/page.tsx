import { isLocale, type Locale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { SignupClient } from "./SignupClient";

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <SignupClient locale={locale as Locale} />;
}
