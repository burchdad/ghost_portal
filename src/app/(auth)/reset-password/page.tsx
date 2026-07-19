export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="glass max-w-md rounded-lg p-8">
        <h1 className="text-2xl font-semibold">Create a new password</h1>
        <p className="mt-3 text-sm leading-6 text-white/58">
          Reset completion is reserved for the mail-token flow. No production password is stored in source control.
        </p>
      </section>
    </main>
  );
}
