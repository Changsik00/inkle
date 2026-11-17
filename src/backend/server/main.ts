// API 서버의 진입점 (`pnpm api`). compose 의 api 컨테이너가 띄운다.
import { container } from "@/backend/container";
import { createHttpServer } from "@/backend/server/http-server";

const PORT = Number(process.env.API_PORT ?? 4000);
const HOST = process.env.API_HOST ?? "0.0.0.0";

const c = container();
const server = createHttpServer(() => c);

server.listen(PORT, HOST, () => {
  console.log(`API 서버: http://${HOST}:${PORT}/api`);
});

function shutdown() {
  server.close(() => {
    void c.close().then(() => process.exit(0));
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
