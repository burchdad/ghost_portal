import type * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full border border-white/10 bg-white/[0.06] px-3 text-xs font-medium text-white/80",
        className
      )}
      {...props}
    />
  );
}
