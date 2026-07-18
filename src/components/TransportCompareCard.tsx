export function TransportCompareCard({
  emoji,
  title,
  durationLabel,
  durationValue,
  costLabel,
  costValue,
  badge,
  badgeTone,
  cta,
  onClick,
  href,
}: {
  emoji: string;
  title: string;
  durationLabel: string;
  durationValue: string;
  costLabel: string;
  costValue: string;
  badge: string;
  badgeTone: "brand" | "coral";
  cta: string;
  onClick?: () => void;
  href?: string;
}) {
  const badgeClass =
    badgeTone === "brand" ? "bg-brand-500/15 text-brand-300" : "bg-coral-500/15 text-coral-600";

  return (
    <div className="rounded-2xl border border-white/10 bg-sand-100 p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-xl">{emoji}</div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${badgeClass}`}>{badge}</span>
      </div>
      <h3 className="mt-4 text-base font-semibold text-brand-50">{title}</h3>
      <div className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between text-brand-50/70">
          <span className="text-brand-50/40">{durationLabel}</span>
          <span className="font-semibold">{durationValue}</span>
        </div>
        <div className="flex justify-between text-brand-50/70">
          <span className="text-brand-50/40">{costLabel}</span>
          <span className="font-semibold">{costValue}</span>
        </div>
      </div>
      {href ? (
        <a
          href={href}
          className="mt-5 block w-full rounded-full border border-white/15 py-2.5 text-center text-sm font-semibold text-brand-50 transition-colors hover:border-brand-300 hover:bg-sand-50"
        >
          {cta}
        </a>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className="mt-5 w-full rounded-full border border-white/15 py-2.5 text-sm font-semibold text-brand-50 transition-colors hover:border-brand-300 hover:bg-sand-50"
        >
          {cta}
        </button>
      )}
    </div>
  );
}
