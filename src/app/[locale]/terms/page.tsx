import { isLocale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { getLegalDoc } from "@/lib/legal-content";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { doc, pendingNote } = getLegalDoc("terms", locale);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-brand-50">{doc.title}</h1>
      <p className="mt-1 text-sm text-brand-50/40">{doc.updated}</p>
      {pendingNote && (
        <p className="mt-4 rounded-xl bg-sand-100 p-3 text-sm text-brand-50/60">{pendingNote}</p>
      )}
      <p className="mt-6 text-base leading-relaxed text-brand-50/70">{doc.intro}</p>
      <div className="mt-8 space-y-6">
        {doc.sections.map((s) => (
          <div key={s.heading}>
            <h2 className="text-lg font-semibold text-brand-50">{s.heading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-50/60">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
