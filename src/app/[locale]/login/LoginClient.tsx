"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { PageHeader } from "@/components/PageHeader";

export function LoginClient({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError(dict.auth.errorInvalidCredentials);
      setLoading(false);
      return;
    }
    router.push(`/${locale}/account`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <PageHeader eyebrow={dict.common.brand} title={dict.auth.loginTitle} subtitle={dict.auth.loginSubtitle} />

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-3xl border border-white/10 bg-sand-100 p-6 shadow-sm sm:p-8">
        <label className="flex flex-col gap-2 text-sm font-medium text-brand-50">
          {dict.auth.emailLabel}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-white/15 bg-sand-50 px-3 py-2.5 text-sm text-brand-50 outline-none focus:border-brand-400"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-brand-50">
          {dict.auth.passwordLabel}
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-white/15 bg-sand-50 px-3 py-2.5 text-sm text-brand-50 outline-none focus:border-brand-400"
          />
        </label>

        {error && <p className="text-sm font-medium text-coral-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/25 disabled:opacity-60"
        >
          {dict.auth.loginCta}
        </button>

        <p className="text-center text-sm text-brand-50/50">
          {dict.auth.switchToSignup}{" "}
          <Link href={`/${locale}/signup`} className="font-semibold text-brand-700">
            {dict.auth.switchToSignupLink}
          </Link>
        </p>
      </form>
    </div>
  );
}
