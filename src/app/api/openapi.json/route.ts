import { openApiDocument } from "@/backend/rpc/openapi";

export async function GET() {
  return Response.json(await openApiDocument());
}
