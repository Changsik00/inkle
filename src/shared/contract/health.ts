import { oc } from "@orpc/contract";
import { z } from "zod";

export const healthContract = {
  check: oc
    .route({ method: "GET", path: "/health", summary: "DB 에 닿는지 확인한다" })
    .errors({ SERVICE_UNAVAILABLE: { status: 503, message: "DB 에 닿지 못함" } })
    .output(z.object({ db: z.literal("ok") })),
};
