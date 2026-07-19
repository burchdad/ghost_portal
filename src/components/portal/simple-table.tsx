import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function SimpleTable({
  columns,
  rows,
  empty
}: {
  columns: string[];
  rows: ReactNode[][];
  empty: string;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="grid border-b border-white/10 bg-white/[0.04] px-4 py-3 text-xs uppercase tracking-[0.16em] text-white/42" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
        {columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="p-5 text-sm text-white/48">{empty}</p>
      ) : (
        rows.map((row, index) => (
          <div key={index} className="grid border-b border-white/10 px-4 py-4 text-sm last:border-0" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
            {row.map((cell, cellIndex) => (
              <div key={cellIndex} className="min-w-0 pr-4 text-white/74">
                {cell}
              </div>
            ))}
          </div>
        ))
      )}
    </Card>
  );
}
