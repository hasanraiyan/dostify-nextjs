import { auth } from "@clerk/nextjs/server";
import { getUsageSummary } from "@/lib/dostify/usage";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  const summary = await getUsageSummary(userId).catch(() => null);
  return Response.json(summary);
}
