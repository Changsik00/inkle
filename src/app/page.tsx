import { HealthStatus } from "@/app/health-status";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/product";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">{PRODUCT_NAME}</h1>
      <p className="text-zinc-600 dark:text-zinc-400">{PRODUCT_TAGLINE}</p>
      <HealthStatus />
    </main>
  );
}
