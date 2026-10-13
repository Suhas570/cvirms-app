"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [showTicker, setShowTicker] = useState<boolean>(true);
  const [language, setLanguage] = useState<string>("English");
  const [isLangOpen, setIsLangOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const navLinks = [
    { name: "Home", href: "#", active: true },
    { name: "About Us", href: "#about", active: false },
    { name: "Features", href: "#features", active: false },
    { name: "Tutorials", href: "#tutorials", active: false },
    { name: "News & Circulars", href: "#circulars", active: false },
    { name: "Resources", href: "#resources", active: false },
  ];

  return (
    <header className="w-full sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#EAECF0] transition-colors">
      {/* Top Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left: Shield Logo + Title & Subtitle */}
          <Link href="/" className="flex items-center gap-3 group select-none">
            <Image
              src="/cvirms-logo.png"
              alt="CVIRMS Logo"
              width={40}
              height={40}
              className="object-contain transition-transform group-hover:scale-105"
              priority
            />
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-[#0F172A] leading-tight">
                CVIRMS
              </span>
              <span className="text-[9px] font-bold tracking-wider text-[#667085] uppercase -mt-0.5">
                CITY VISITOR INFORMATION AND RECORD MANAGEMENT SYSTEM
              </span>
            </div>
          </Link>

          {/* Center Links */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-[#0EA5E9] relative py-1 ${
                  link.active
                    ? "text-[#0EA5E9] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#0EA5E9] after:rounded-full"
                    : "text-[#344054]"
                }`}
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Right Actions: 112 Badge, Language, Dark Mode, Launch Portal */}
          <div className="flex items-center gap-3">
            {/* Red "112" Emergency Pill Badge */}
            <div
              title="State Police Emergency Helpline"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold tracking-wide shadow-sm shadow-red-500/20 cursor-default shrink-0"
            >
              <svg
                width="14"
                height="14"
                className="w-3.5 h-3.5 min-w-[14px] min-h-[14px] shrink-0 animate-pulse text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 4V3z" />
              </svg>
              <span>112</span>
            </div>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#EAECF0] bg-white text-xs font-medium text-[#344054] hover:bg-slate-50 transition-colors shadow-xs"
              >
                <svg
                  width="14"
                  height="14"
                  className="w-3.5 h-3.5 min-w-[14px] min-h-[14px] shrink-0 text-[#667085]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{language}</span>
                <svg
                  width="12"
                  height="12"
                  className="w-3 h-3 min-w-[12px] min-h-[12px] shrink-0 text-[#667085]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isLangOpen && (
                <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-xl shadow-lg border border-[#EAECF0] py-1 z-50 animate-scale-in">
                  {["English", "ಕನ್ನಡ (Kannada)", "हिंदी (Hindi)"].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang.split(" ")[0]);
                        setIsLangOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#344054] hover:bg-sky-50 hover:text-[#0EA5E9] transition-colors"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark Mode Toggle Icon */}
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Dark Mode"
              className="p-2 rounded-lg border border-[#EAECF0] bg-white text-[#667085] hover:text-[#0F172A] hover:bg-slate-50 transition-colors shadow-xs"
            >
              {isDarkMode ? (
                <svg
                  width="16"
                  height="16"
                  className="w-4 h-4 min-w-[16px] min-h-[16px] shrink-0 text-amber-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  className="w-4 h-4 min-w-[16px] min-h-[16px] shrink-0 text-[#667085]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            {/* Sky Blue "Launch Portal" Button (#0EA5E9) with External-Link Icon */}
            <a
              href="#login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs sm:text-sm font-semibold tracking-wide shadow-sm shadow-sky-500/25 active:scale-95 transition-all card-hover-lift shrink-0"
            >
              <span>Launch Portal</span>
              <svg
                width="16"
                height="16"
                className="w-4 h-4 min-w-[16px] min-h-[16px] shrink-0 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Top Ticker Bar: Amber Dot + "CIRCULAR" Badge + Text + Close (×) Button */}
      {showTicker && (
        <div className="w-full bg-[#FFFBEB] border-t border-b border-[#FDE68A]/70 px-4 py-2 transition-all animate-fade-in">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              {/* Pulsing Amber Dot */}
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>

              {/* "CIRCULAR" Badge */}
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] uppercase tracking-wider shrink-0">
                CIRCULAR
              </span>

              {/* Circular Notification Text */}
              <p className="text-[#92400E] font-medium truncate">
                Government Circular #KA-POL-2026-89: Mandatory QR Visitor Registration
              </p>
            </div>

            {/* Close (×) Button */}
            <button
              type="button"
              onClick={() => setShowTicker(false)}
              className="p-1 rounded-md text-[#92400E] hover:bg-[#FDE68A] hover:text-[#78350F] transition-colors shrink-0"
              aria-label="Dismiss circular notification"
            >
              <svg
                width="16"
                height="16"
                className="w-4 h-4 min-w-[16px] min-h-[16px] shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
