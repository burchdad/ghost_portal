export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="glass max-w-md rounded-lg p-8">
        <h1 className="text-2xl font-semibold">Password reset</h1>
        <p className="mt-3 text-sm leading-6 text-white/58">
          Password reset tokens are modeled for Phase 1. Email delivery will be connected when the production mail provider is selected.
        </p>
      </section>
    </main>
  );
}
