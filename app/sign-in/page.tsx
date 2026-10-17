import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { authOptions, isAdminEmail, isGoogleSignInConfigured } from "@/lib/auth";

export default async function SignInPage() {
  const session = await getServerSession(authOptions);
  if (isAdminEmail(session?.user?.email)) {
    redirect("/");
  }

  return (
    <section className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <p className="label-mono">Private assistant</p>
      <h1 className="mt-4 text-3xl font-medium tracking-tight">
        Sign in to RoxAI
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Access is limited to the authorized Google account.
      </p>
      {isGoogleSignInConfigured ? (
        <GoogleSignInButton />
      ) : (
        <p
          role="status"
          className="mt-7 rounded-md border border-border bg-surface p-4 text-sm leading-6 text-muted-foreground"
        >
          Google sign-in is not configured yet. Add the Google OAuth credentials
          and NextAuth secret to this deployment&apos;s environment variables.
        </p>
      )}
    </section>
  );
}
