import { redirect } from "next/navigation";

export default function LegacyOnboardingContentRedirectPage() {
  redirect("/admin/academy/content");
}
