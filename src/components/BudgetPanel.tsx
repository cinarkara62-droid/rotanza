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
    <div className="animate-card-in rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-wide text-brand-950/40">
        {isTr ? "Bütçe" : "Budget"}
      </div>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-brand-950/60">{isTr ? "Toplam bütçe" : "Total budget"}</span>
          <span className="font-semibold text-brand-950">
            {budgetAmount.toLocaleString()} {currency}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-brand-950/60">{isTr ? "Tahmini harcanan" : "Estimated spent"}</span>
          <span className="font-semibold text-brand-950">
            {result.total.toLocaleString()} {currency}
          </span>
        </div>
        <div className="flex justify-between border-t border-black/5 pt-2">
          <span className="text-brand-950/60">{isTr ? "Kalan bütçe" : "Remaining"}</span>
          <span className={`font-bold ${remaining < 0 ? "text-coral-600" : "text-brand-600"}`}>
            {remaining.toLocaleString()} {currency}
          </span>
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-brand-950/40">
        {isTr
          ? "Tahmini harcama; konaklama, yemek, ulaşım ve aktivite için kaba bir yaklaşımdır, gerçek fiyat kaynağına bağlı değildir."
          : "Estimated spend is a rough approximation across accommodation, food, transport and activities — not sourced from real pricing."}
      </p>
    </div>
  );
}
