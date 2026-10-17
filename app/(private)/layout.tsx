import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { authOptions, isAdminEmail } from "@/lib/auth";

export default async function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!isAdminEmail(email)) {
    redirect("/sign-in");
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-end gap-3 px-4 pt-4 sm:px-6">
        <span className="text-xs text-muted-foreground">{email}</span>
        <SignOutButton />
      </div>
      {children}
    </>
  );
}
