import { redirect } from "next/navigation";
import { getCurrentUserFromCookie } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserFromCookie();
  if (user && user.role !== "admin") redirect("/");
  return <>{children}</>;
}
