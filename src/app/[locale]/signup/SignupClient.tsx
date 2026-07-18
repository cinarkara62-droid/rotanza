"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { PageHeader } from "@/components/PageHeader";

export function SignupClient({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(dict.auth.errorPasswordLength);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error === "email_taken" ? dict.auth.errorEmailTaken : dict.auth.errorGeneric);
        setLoading(false);
        return;
      }
      const signInRes = await signIn("credentials", { email, password, redirect: false });
      if (signInRes?.error) {
        setError(dict.auth.errorGeneric);
        setLoading(false);
        return;
      }
      router.push(`/${locale}/account`);
      router.refresh();
    } catch {
      setError(dict.auth.errorGeneric);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <PageHeader eyebrow={dict.common.brand} title={dict.auth.signupTitle} subtitle={dict.auth.signupSubtitle} />

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-3xl border border-white/10 bg-sand-100 p-6 shadow-sm sm:p-8">
        <label className="flex flex-col gap-2 text-sm font-medium text-brand-50">
          {dict.auth.nameLabel}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-white/15 bg-sand-50 px-3 py-2.5 text-sm text-brand-50 outline-none focus:border-brand-400"
          />
        </label>
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
            minLength={8}
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
          {dict.auth.signupCta}
        </button>

        <p className="text-center text-sm text-brand-50/50">
          {dict.auth.switchToLogin}{" "}
          <Link href={`/${locale}/login`} className="font-semibold text-brand-300">
            {dict.auth.switchToLoginLink}
          </Link>
        </p>
      </form>
    </div>
  );
}
