"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();

  const links = [
    { href: `/${locale}/planner`, label: dict.nav.planner },
    { href: `/${locale}/restaurants`, label: dict.nav.restaurants },
    { href: `/${locale}/transport`, label: dict.nav.transport },
    { href: `/${locale}/budget`, label: dict.nav.budget },
    { href: `/${locale}/reservations`, label: dict.nav.reservations },
    { href: `/${locale}/alerts`, label: dict.nav.alerts },
    { href: `/${locale}/pricing`, label: dict.nav.pricing },
  ];

  const isAuthed = status === "authenticated" && !!session;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--background)]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href={`/${locale}`} className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
            <Image src="/logo.png" alt="" aria-hidden width={32} height={32} className="h-8 w-8" priority />
            {dict.common.brand}
            <span className="text-brand-500">.</span>
          </Link>
          <nav className="hidden items-center gap-6 lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher locale={locale} />
          </div>
          <ThemeToggle className="hidden sm:flex" />
          {isAuthed ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href={`/${locale}/account`}
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-sand-50"
              >
                {dict.nav.account}
              </Link>
              <button
                onClick={() => signOut()}
                className="rounded-full bg-brand-950 px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
              >
                {dict.nav.logout}
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href={`/${locale}/login`}
                className="text-sm font-medium text-foreground/70 hover:text-foreground"
              >
                {dict.nav.login}
              </Link>
              <Link
                href={`/${locale}/signup`}
                className="rounded-full bg-brand-950 px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
              >
                {dict.nav.getStarted}
              </Link>
            </div>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 lg:hidden"
          >
            <span className="sr-only">Menu</span>
            <div className="space-y-1">
              <span className="block h-0.5 w-4 bg-brand-950" />
              <span className="block h-0.5 w-4 bg-brand-950" />
            </div>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[var(--background)] px-4 pb-4 pt-2 lg:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm font-medium text-foreground/80 hover:bg-brand-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LanguageSwitcher locale={locale} />
              <ThemeToggle />
            </div>
            {isAuthed ? (
              <div className="flex items-center gap-2">
                <Link
                  href={`/${locale}/account`}
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-foreground"
                >
                  {dict.nav.account}
                </Link>
                <button
                  onClick={() => {
                    setOpen(false);
                    signOut();
                  }}
                  className="rounded-full bg-brand-950 px-4 py-2 text-sm font-semibold text-white"
                >
                  {dict.nav.logout}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href={`/${locale}/login`}
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-foreground/70"
                >
                  {dict.nav.login}
                </Link>
                <Link
                  href={`/${locale}/signup`}
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-brand-950 px-4 py-2 text-sm font-semibold text-white"
                >
                  {dict.nav.getStarted}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
