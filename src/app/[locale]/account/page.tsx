import { redirect, notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { UpgradeButtons, ManageBillingButton } from "./AccountActions";

const PLAN_LABEL: Record<string, string> = { free: "Free", pro: "Pro", max: "Max" };

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  const dict = getDictionary(l);
  const isTr = l === "tr";

  const session = await auth();
  if (!session?.user?.id) redirect(`/${l}/login`);

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect(`/${l}/login`);

  const isFree = user.plan === "free";

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:px-8">
      <PageHeader eyebrow={dict.common.brand} title={dict.account.title} subtitle={dict.account.subtitle} />

      <div className="mt-8 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-brand-950/40">
              {dict.account.currentPlan}
            </div>
            <div className="mt-1 text-2xl font-bold text-brand-950">{PLAN_LABEL[user.plan] ?? user.plan}</div>
            {user.billingCycle && (
              <div className="mt-0.5 text-xs text-brand-950/40">
                {user.billingCycle === "monthly" ? dict.account.billingMonthly : dict.account.billingYearly}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold uppercase tracking-wide text-brand-950/40">
              {dict.account.memberSince}
            </div>
            <div className="mt-1 text-sm text-brand-950/70">
              {new Date(user.createdAt).toLocaleDateString(isTr ? "tr-TR" : "en-US")}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-black/5 pt-6">
          {isFree ? (
            <>
              <p className="mb-4 text-sm text-brand-950/60">{dict.account.freePlanNote}</p>
              <UpgradeButtons locale={l} viewPlansLabel={dict.account.viewPlans} />
            </>
          ) : (
            <ManageBillingButton locale={l} label={dict.account.manageBilling} />
          )}
        </div>
      </div>
    </div>
  );
}
