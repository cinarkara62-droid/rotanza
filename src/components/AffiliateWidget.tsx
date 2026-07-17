"use client";

import { useEffect, useRef } from "react";

// Travelpayouts widget scripts (Kiwitaxi, Aviasales, etc.) locate their own
// <script> tag via script.parentElement and insert their content right
// there — next/script doesn't preserve that DOM position (it moves scripts
// to the end of <body>), so the widget silently renders somewhere invisible.
// Appending the script ourselves inside this ref'd container keeps
// parentElement pointed at the spot we actually want the widget to appear.
export function AffiliateWidget({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.charset = "utf-8";
    container.appendChild(script);
    return () => {
      container.innerHTML = "";
    };
  }, [src]);

  return <div ref={containerRef} />;
}
