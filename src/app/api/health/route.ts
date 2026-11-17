import { getSql } from "@/db/client";
import { checkHealth } from "@/domain/health";

export async function GET() {
  const health = await checkHealth(getSql());
  return Response.json(health, { status: health.db === "ok" ? 200 : 503 });
}
