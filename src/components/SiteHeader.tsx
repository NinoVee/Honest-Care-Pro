"use client";

import { useState } from "react";
import Link from "next/link";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/patients", label: "Patients" },
  { href: "/schedule", label: "Schedule" },
  { href: "/vitals", label: "Vitals" },
  { href: "/tablets", label: "Tablets" },
];

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-navy text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
        <Link href="/" className="flex min-w-0 items-center gap-2 md:gap-3" onClick={() => setIsMenuOpen(false)}>
          <img
            src="/logo_set_1_64x64.png"
            alt="Honest Care"
            className="h-10 w-10 shrink-0 object-contain md:h-14 md:w-14"
          />
          <div className="min-w-0 leading-tight">
            <div className="truncate font-display text-base font-semibold md:text-lg">Honest Care</div>
            <div className="hidden truncate text-xs text-white/60 sm:block">
              A secure way to coordinate care, with full transparency
            </div>
          </div>
        </Link>

        {/* Desktop nav — hidden on small screens */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-white/80 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden text-xs text-white/50 md:block">
          Signed in as Dr. Test Physician
        </div>

        {/* Hamburger button — only visible below md breakpoint */}
        <button
          onClick={() => setIsMenuOpen((v) => !v)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white md:hidden"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {isMenuOpen && (
        <nav className="flex flex-col gap-1 border-t border-white/10 bg-navy-light px-4 py-3 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 hover:bg-white/5"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 border-t border-white/10 px-3 pt-3 text-xs text-white/50">
            Signed in as Dr. Test Physician
          </div>
        </nav>
      )}
    </header>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"></svg>