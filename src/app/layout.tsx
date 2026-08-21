import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Honest Care",
  description: "Honest care, delivered with trust.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="bg-navy text-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal/20">
                <ShieldCrossIcon />
              </span>
              <div className="leading-tight">
                <div className="font-display text-lg font-semibold">Honest Care</div>
                <div className="text-xs text-white/60">Honest care, delivered with trust.</div>
              </div>
            </Link>

            <nav className="flex items-center gap-6 text-sm font-medium text-white/80">
              <Link href="/" className="hover:text-white">Dashboard</Link>
              <Link href="/patients" className="hover:text-white">Patients</Link>
              <Link href="/schedule" className="hover:text-white">Schedule</Link>
            </nav>

            {/* TODO: replace with real session-based auth. This is a
                development-only role switcher, not a security control. */}
            <div className="text-xs text-white/50">Signed in as Dr. Test Physician</div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}

function ShieldCrossIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2 4 5v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V5l-8-3Z"
        stroke="white"
        strokeWidth="1.6"
      />
      <path d="M12 8v8M8 12h8" stroke="#14B1A2" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
