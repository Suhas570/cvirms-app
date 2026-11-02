"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ReceiptPrinter, { ReceiptPrinterProps } from "@/components/ReceiptPrinter";

export default function RegisterSuccessPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<ReceiptPrinterProps | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cvirms_new_credentials");
      if (!raw) {
        router.replace("/register");
        return;
      }
      const parsed = JSON.parse(raw);
      if (!parsed.username || !parsed.orderId) {
        router.replace("/register");
        return;
      }
      setCredentials(parsed);
    } catch {
      router.replace("/register");
    } finally {
      setReady(true);
    }
  }, [router]);

  if (!ready || !credentials) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F7F8FA]">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 animate-spin text-[#0EA5E9]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-xs font-semibold text-[#667085]">Printing official receipt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-[#F7F8FA] selection:bg-[#0EA5E9] selection:text-white font-sans">
      {/* Decorative Radial Gradients */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#E0F2FE] via-[#BAE6FD]/40 to-transparent blur-3xl pointer-events-none opacity-80" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-[#F4EBFF] via-[#E9D5FF]/30 to-transparent blur-3xl pointer-events-none opacity-80" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[500px] py-8">
        <ReceiptPrinter
          orderId={credentials.orderId}
          amount={credentials.amount || 1450}
          date={credentials.date}
          method={credentials.method}
          username={credentials.username}
          tempPassword={credentials.tempPassword}
          phone={credentials.phone}
          establishmentName={credentials.establishmentName}
        />
      </div>
    </div>
  );
}
