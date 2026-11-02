"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NotFound() {
  const pathname = usePathname();
  const isPolicePath = pathname?.startsWith("/police");

  const [targetHref, setTargetHref] = useState<string>(
    isPolicePath ? "/police/dashboard" : "/"
  );

  useEffect(() => {
    if (pathname?.startsWith("/police")) {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("cvirms_token") : null;
        const userStr = typeof window !== "undefined" ? localStorage.getItem("cvirms_user") : null;
        if (token && userStr) {
          const user = JSON.parse(userStr);
          if (user?.role === "police") {
            setTargetHref("/police/dashboard");
            return;
          }
        }
      } catch {
        // Fallback
      }
      setTargetHref("/police/login");
    } else {
      setTargetHref("/");
    }
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-[#101828] font-sans selection:bg-[#0EA5E9] selection:text-white">
      {/* Lucide SVG Shield Icon (No Emojis) */}
      <div className="w-12 h-12 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] text-[#0284C7] flex items-center justify-center mb-4 shadow-xs">
        <svg
          className="w-6 h-6 text-[#0284C7]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h2 className="text-2xl font-black text-[#101828] tracking-tight">404 — Page Not Found</h2>
      <p className="mt-2 text-sm text-[#667085] max-w-md text-center">
        The requested record or portal page could not be located on the CVIRMS network.
      </p>

      <Link
        href={targetHref}
        className="mt-6 px-6 py-2.5 rounded-xl bg-[#0EA5E9] text-white text-sm font-semibold hover:bg-[#0284C7] transition-all shadow-xs cursor-pointer"
      >
        Return to Home
      </Link>
    </div>
  );
}
