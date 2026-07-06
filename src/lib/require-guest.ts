import { headers } from "next/headers";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";

export async function redirectIfAuthenticated(locale: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    redirect({ href: "/dashboard", locale });
  }
}
