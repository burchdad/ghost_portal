import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="glass max-w-md rounded-lg p-8 text-center">
        <p className="text-sm uppercase tracking-[0.24em] text-danger">Access denied</p>
        <h1 className="mt-3 text-3xl font-semibold">This area is restricted</h1>
        <p className="mt-3 text-sm leading-6 text-white/58">
          Ghost Portal blocks direct URL access when your role or record assignment does not allow the data.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Return to dashboard</Link>
        </Button>
      </section>
    </main>
  );
}
