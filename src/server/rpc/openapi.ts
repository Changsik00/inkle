import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { contract } from "@/http/contract";
import { API_PREFIX } from "@/server/rpc/handler";

const generator = new OpenAPIGenerator({ schemaConverters: [new ZodToJsonSchemaConverter()] });

// 계약에서 만든 엔드포인트 문서 (`/api/openapi.json`).
export function openApiDocument() {
  return generator.generate(contract, {
    info: { title: "inkle API", version: "0.1.0" },
    servers: [{ url: API_PREFIX }],
  });
}
