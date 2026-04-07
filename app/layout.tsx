import "./globals.css";
import type { Metadata } from "next";
import { noto_sans } from "./fonts";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Interactive Explainable Ranking",
  description: "Interactive Explainable Ranking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={noto_sans.className}>
      <body
        data-theme="light"
        className="absolute inset-0 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"
      >
        {children}
      </body>
    </html>
  );
}
