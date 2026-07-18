"use client";

import { calculateBudget, type AccommodationLevel, type ActivitiesLevel } from "@/lib/budget";
import type { BudgetLevel } from "@/lib/types";

const LEVEL_MAP: Record<BudgetLevel, AccommodationLevel> = {
  economy: "budget",
  standard: "midrange",
  luxury: "luxury",
};
const ACTIVITY_MAP: Record<BudgetLevel, ActivitiesLevel> = {
  economy: "light",
  standard: "moderate",
  luxury: "packed",
};

export function BudgetPanel({
  budgetAmount,
  currency,
  days,
  budgetLevel,
  dailyCostIndex,
  isTr,
}: {
  budgetAmount: number;
  currency: string;
  days: number;
  budgetLevel: BudgetLevel;
  dailyCostIndex: number;
  isTr: boolean;
}) {
  const level = LEVEL_MAP[budgetLevel];
  const result = calculateBudget({
    dailyCostIndex,
    travelers: 1,
    days,
    accommodation: level,
    meals: level,
    transportStyle: level,
    activities: ACTIVITY_MAP[budgetLevel],
  });
  const remaining = budgetAmount - result.total;

  return (
    <div className="animate-card-in rounded-2xl border border-white/10 bg-sand-100 p-5 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-wide text-brand-50/40">
        {isTr ? "Bütçe" : "Budget"}
      </div>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-brand-50/60">{isTr ? "Toplam bütçe" : "Total budget"}</span>
          <span className="font-semibold text-brand-50">
            {budgetAmount.toLocaleString()} {currency}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-brand-50/60">{isTr ? "Tahmini harcanan" : "Estimated spent"}</span>
          <span className="font-semibold text-brand-50">
            {result.total.toLocaleString()} {currency}
          </span>
        </div>
        <div className="flex justify-between border-t border-white/10 pt-2">
          <span className="text-brand-50/60">{isTr ? "Kalan bütçe" : "Remaining"}</span>
          <span className={`font-bold ${remaining < 0 ? "text-coral-600" : "text-brand-400"}`}>
            {remaining.toLocaleString()} {currency}
          </span>
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-brand-50/40">
        {isTr
          ? "Tahmini harcama; konaklama, yemek, ulaşım ve aktivite için kaba bir yaklaşımdır, gerçek fiyat kaynağına bağlı değildir."
          : "Estimated spend is a rough approximation across accommodation, food, transport and activities — not sourced from real pricing."}
      </p>
    </div>
  );
}
