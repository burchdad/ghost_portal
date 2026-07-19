import { LoginForm } from "@/app/(auth)/login/login-form";

type LoginPageProps = {
  searchParams?: Promise<{
    redirectTo?: string | string[];
    reason?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return <LoginForm redirectTo={firstParam(params?.redirectTo) ?? "/dashboard"} reason={firstParam(params?.reason)} />;
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
