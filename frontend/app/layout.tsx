import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DrugCatch",
  description: "처방전 및 약품 사진으로 복약정보를 조회하는 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
