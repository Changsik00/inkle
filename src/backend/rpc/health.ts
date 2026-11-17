import { checkHealth } from "@/backend/application/health";
import { os } from "@/backend/rpc/os";

export const health = {
  check: os.health.check.handler(async ({ context, errors }) => {
    const result = await checkHealth(context.healthProbe);
    if (result.db !== "ok") throw errors.SERVICE_UNAVAILABLE();
    return { db: "ok" as const };
  }),
};
