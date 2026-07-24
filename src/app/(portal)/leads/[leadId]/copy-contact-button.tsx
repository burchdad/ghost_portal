"use client";

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyContactButton({ value, label }: { value: string; label: string }) {
  return (
    <Button type="button" size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(value)}>
      <Copy className="mr-2 size-4" />
      {label}
    </Button>
  );
}
