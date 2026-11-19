import { getUserId } from "@/lib/session";
import { getUsageSummary } from "@/lib/dostify/usage";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  const summary = await getUsageSummary(userId).catch(() => null);
  return Response.json(summary);
}
