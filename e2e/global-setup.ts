// 앱이 떠 있지 않으면 이유를 분명히 알리고 멈춘다.
export default async function globalSetup() {
  const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${baseURL}/api/health`);
    if (!res.ok) throw new Error(`상태 ${res.status}`);
  } catch (e) {
    throw new Error(`앱에 닿지 못했다 (${baseURL}). 먼저 \`docker compose up -d --wait\` 를 실행한다. 원인: ${String(e)}`);
  }
}
