import { redirect } from "next/navigation";
import { getCurrentUserFromCookie } from "@/lib/auth";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserFromCookie();
  if (!user) redirect("/login");
  return <>{children}</>;
}
