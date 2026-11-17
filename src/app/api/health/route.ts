import { checkHealth } from "@/application/health";
import { container } from "@/server/container";

export async function GET() {
  const health = await checkHealth(container().healthProbe);
  return Response.json(health, { status: health.db === "ok" ? 200 : 503 });
}
