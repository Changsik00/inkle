import { openApiDocument } from "@/server/rpc/openapi";

export async function GET() {
  return Response.json(await openApiDocument());
}
