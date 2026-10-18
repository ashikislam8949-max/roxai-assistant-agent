import { getServerSession } from "next-auth";
import { authOptions, isAdminEmail } from "@/lib/auth";
import { auditSbtechPublicSite } from "@/lib/site-audit";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return Response.json(
      { error: "Sign in with the authorized Google account to run an audit." },
      { status: 401 },
    );
  }

  try {
    return Response.json(await auditSbtechPublicSite(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Public site audit failed", error);
    return Response.json(
      { error: "The site audit could not be completed. Try again shortly." },
      { status: 502 },
    );
  }
}
