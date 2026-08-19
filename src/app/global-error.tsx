"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global.error]", {
      message: error.message,
      digest: error.digest
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main style={{ minHeight: "100vh", background: "#050607", color: "#f8fafc", padding: "40px", fontFamily: "system-ui, sans-serif" }}>
          <section style={{ maxWidth: "680px", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", padding: "24px", background: "rgba(255,255,255,0.04)" }}>
            <p style={{ color: "#6ee7c8", fontSize: "12px", letterSpacing: "0.16em", textTransform: "uppercase" }}>Ghost Portal</p>
            <h1 style={{ fontSize: "28px", margin: "12px 0" }}>Something went wrong.</h1>
            <p style={{ color: "rgba(248,250,252,0.68)", lineHeight: 1.6 }}>Try reloading the app. If this repeats, send Stephen the screen name and the time it happened.</p>
            {error.digest ? <p style={{ color: "rgba(248,250,252,0.48)", fontFamily: "monospace", marginTop: "16px" }}>Error reference: {error.digest}</p> : null}
            <button
              type="button"
              onClick={reset}
              style={{ marginTop: "20px", border: 0, borderRadius: "8px", padding: "10px 14px", background: "#6ee7c8", color: "#03110d", fontWeight: 700 }}
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
