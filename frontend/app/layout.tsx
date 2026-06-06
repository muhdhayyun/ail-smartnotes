import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartNotes AI",
  description: "RAG-powered study notes assistant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
