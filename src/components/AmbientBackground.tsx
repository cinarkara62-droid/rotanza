import type { ReactNode } from "react";

// Shared full-viewport decorative layer. `fixed` so it doesn't affect page
// layout/height and stays put while content scrolls over it (same trick
// Stripe/Linear-style landing pages use for ambient backgrounds). Always
// pointer-events-none and behind everything (-z-10) — purely visual.
export function AmbientBackground({
  children,
  gradientClassName,
}: {
  children?: ReactNode;
  gradientClassName: string;
}) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className={`absolute inset-0 ${gradientClassName}`} />
      {children}
    </div>
  );
}
