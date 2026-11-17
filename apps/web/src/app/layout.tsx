import type { Metadata } from "next";
import { Providers } from "@/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "inkle",
  description: "혼자서도 열리는 독서 모임",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Providers>
          <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
