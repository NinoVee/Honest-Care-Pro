import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Honest Care",
  description: "A secure way to coordinate care, with full transparency.",
  icons: {
    icon: [
      { url: "/favicons/logo_set_1_64x64.png", sizes: "64x64", type: "image/png" },
      { url: "/favicons/logo_set_1_128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/favicons/logo_set_1_256x256.png", sizes: "256x256", type: "image/png" },
    ],
    apple: [
      { url: "/favicons/logo_set_1_256x256.png", sizes: "256x256", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />

        <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">{children}</main>

        <footer className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-subtle md:px-6">
          Honest Care — Delivering With Trust.
        </footer>
      </body>
    </html>
  );
}