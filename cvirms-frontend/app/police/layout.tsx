"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import PoliceSidebar from "@/components/PoliceSidebar";

interface PoliceLayoutProps {
  children: React.ReactNode;
}

export default function PoliceLayout({ children }: PoliceLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/police/login";

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(!isLoginPage);

  useEffect(() => {
    if (isLoginPage) {
      setIsChecking(false);
      return;
    }

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("cvirms_token") : null;
      const userStr = typeof window !== "undefined" ? localStorage.getItem("cvirms_user") : null;

      if (!token || !userStr) {
        setIsAuthenticated(false);
        setIsChecking(false);
        router.replace("/police/login");
        return;
      }

      const user = JSON.parse(userStr);
      if (user.role !== "police") {
        setIsAuthenticated(false);
        setIsChecking(false);
        localStorage.removeItem("cvirms_token");
        localStorage.removeItem("cvirms_user");
        router.replace("/police/login");
        return;
      }

      setIsAuthenticated(true);
      setIsChecking(false);
    } catch {
      setIsAuthenticated(false);
      setIsChecking(false);
      router.replace("/police/login");
    }
  }, [pathname, isLoginPage, router]);

  // For /police/login, render without sidebar or layout wrappers
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Session verification loader (Light Theme)
  if (isChecking) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F7F8FA]">
        <div className="w-10 h-10 border-4 border-[#0EA5E9]/20 border-t-[#0EA5E9] rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#667085]">
          Verifying Law Enforcement Session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen w-full bg-[#F7F8FA] overflow-hidden font-sans text-[#101828]">
      {/* Light Theme White Police Sidebar (260px) */}
      <PoliceSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header (60px, White Background) */}
        <header className="h-[60px] bg-white border-b border-[#EAECF0] px-6 flex items-center justify-between shrink-0 z-20 shadow-xs">
          {/* Breadcrumb Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-[#667085]">
              <Link
                href="/police/dashboard"
                className="text-[#344054] font-medium hover:text-[#0284C7] transition-colors cursor-pointer"
              >
                Karnataka Police Headquarters
              </Link>
              <span>/</span>
              <span className="text-[#0284C7] font-semibold">City Surveillance &amp; Visitor Registry</span>
            </div>
          </div>

          {/* Red Police Admin Badge & Security Pulse */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#667085] bg-[#F9FAFB] px-3 py-1.5 rounded-lg border border-[#EAECF0]">
              <span className="text-[#98A2B3]">Station Zone:</span>
              <span className="text-[#101828] font-bold">BLR-CENTRAL-01</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 font-mono font-bold text-xs uppercase tracking-wider shadow-xs">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <span>POLICE ADMIN</span>
            </div>
          </div>
        </header>

        {/* Scrollable Children Canvas with p-6 (Light Theme #F7F8FA) */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#F7F8FA] min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
