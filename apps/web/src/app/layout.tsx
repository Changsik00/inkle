import type { Metadata } from "next";
import { Gowun_Batang } from "next/font/google";
import { Providers } from "@/providers";
import "./globals.css";

// 명조: 책 제목과 인용에만 쓴다 (DESIGN.md §Typography). 빌드 때 받아 자체 호스팅된다.
// 한국어 글자는 Google Fonts 가 글자 범위별로 나눠 둔 파일을 필요한 만큼만 받으므로 미리 불러오지 않는다.
const serif = Gowun_Batang({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-gowun-batang",
});

export const metadata: Metadata = {
  title: "inkle",
  description: "혼자서도 열리는 독서 모임",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${serif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>
          <main className="mx-auto flex w-full max-w-measure flex-1 flex-col px-4 py-10 sm:px-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
