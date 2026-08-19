"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PortalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[portal.error]", {
      message: error.message,
      digest: error.digest
    });
  }, [error]);

  return (
    <section className="px-5 py-7 lg:px-8">
      <Card className="max-w-2xl">
        <div className="flex items-start gap-3">
          <span className="rounded-lg border border-danger/30 bg-danger/10 p-2 text-danger">
            <AlertTriangle className="size-5" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-danger">Something needs attention</p>
            <h2 className="mt-2 text-2xl font-semibold">This screen hit a recoverable error.</h2>
            <p className="mt-3 text-sm leading-6 text-white/58">
              Try reloading this screen. If it keeps happening, send Stephen the screen name and the time it happened so it can be traced quickly.
            </p>
            {error.digest ? <p className="mt-3 font-mono text-xs text-white/42">Error reference: {error.digest}</p> : null}
            <Button type="button" onClick={reset} variant="accent" className="mt-5">
              <RotateCcw className="size-4" />
              Try again
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
