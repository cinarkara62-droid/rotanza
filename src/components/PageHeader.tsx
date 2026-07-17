export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="text-xs font-semibold uppercase tracking-wide text-brand-500">{eyebrow}</span>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-50 sm:text-4xl">{title}</h1>
      <p className="mt-4 text-base text-brand-50/60">{subtitle}</p>
    </div>
  );
}
