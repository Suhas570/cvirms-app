"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    // Check for cvirms_token in localStorage on mount
    const token = typeof window !== "undefined" ? localStorage.getItem("cvirms_token") : null;

    if (!token) {
      setIsAuthenticated(false);
      setIsChecking(false);
      router.replace("/login");
    } else {
      setIsAuthenticated(true);
      setIsChecking(false);
    }
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F7F8FA]">
        <div className="w-10 h-10 border-4 border-[#0EA5E9]/20 border-t-[#0EA5E9] rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
          Verifying Member Session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
