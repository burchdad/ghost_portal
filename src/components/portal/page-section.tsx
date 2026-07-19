import type { ReactNode } from "react";

export function PageSection({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="px-5 py-7 lg:px-8">
      <div className="mb-7">
        {eyebrow ? <p className="mb-3 text-xs uppercase tracking-[0.24em] text-accent">{eyebrow}</p> : null}
        <h2 className="text-3xl font-semibold">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/56">{description}</p>
      </div>
      {children}
    </section>
  );
}
