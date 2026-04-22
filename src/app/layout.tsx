import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "現場の声 — モック環境",
  description: "社内向け「現場の声」受付システムのモック環境です。本番データには影響しません。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="flex h-screen flex-col antialiased">
        <Header />
        <div className="flex min-h-0 flex-1">
          <Sidebar />
          <div className="flex-1 min-w-0 overflow-y-auto">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
