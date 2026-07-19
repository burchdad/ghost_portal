import { Suspense } from "react";
import { LoginForm } from "@/app/(auth)/login/login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center text-white/60">Loading...</main>}>
      <LoginForm />
    </Suspense>
  );
}
