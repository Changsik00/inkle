import type { HealthProbe } from "@/backend/application/ports";

export type Health = { db: "ok" | "down" };

export async function checkHealth(probe: HealthProbe): Promise<Health> {
  try {
    return { db: (await probe.isDatabaseReachable()) ? "ok" : "down" };
  } catch {
    return { db: "down" };
  }
}
