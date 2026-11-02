"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface RegistrationSession {
  userId: number;
  orderId: string;
  username: string;
  phone: string;
  amount: number;
  establishmentName: string;
  ownerName: string;
  memberType: string;
}

type PaymentMethodType = "upi" | "card" | "netbanking" | "wallet";

export default function PaymentPage() {
  const router = useRouter();
  const [session, setSession] = useState<RegistrationSession | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("upi");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cvirms_registration");
      if (!raw) {
        router.replace("/register");
        return;
      }
      const parsed = JSON.parse(raw);
      if (!parsed.userId || !parsed.orderId) {
        router.replace("/register");
        return;
      }
      setSession(parsed);
    } catch {
      router.replace("/register");
    } finally {
      setReady(true);
    }
  }, [router]);

  const handlePay = async () => {
    if (!session) return;
    setError(null);
    setProcessing(true);

    try {
      // Simulate payment delay of 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const res = await fetch("http://localhost:5000/api/register/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.userId,
          orderId: session.orderId,
          paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Payment verification failed. Please try again.");
      }

      // Save credentials and receipt details to localStorage
      const credentialPayload = {
        username: data.username,
        tempPassword: data.tempPassword,
        orderId: data.orderId,
        amount: data.amount || 1450,
        date: data.date || new Date().toISOString(),
        method: data.method || paymentMethod,
        phone: data.phone || session.phone,
        establishmentName: session.establishmentName,
      };
      localStorage.setItem("cvirms_new_credentials", JSON.stringify(credentialPayload));

      // Redirect to animated receipt printer page
      router.push("/register/success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment failed. Please try again.";
      setError(msg);
      setProcessing(false);
    }
  };

  if (!ready || !session) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F7F8FA]">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 animate-spin text-[#0EA5E9]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-xs font-semibold text-[#667085]">Loading secure checkout...</p>
        </div>
      </div>
    );
  }

  const paymentOptions: Array<{
    id: PaymentMethodType;
    title: string;
    description: string;
    badge?: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "upi",
      title: "UPI (Google Pay, PhonePe, Paytm)",
      description: "Instant settlement via dynamic QR / VPA",
      badge: "RECOMMENDED",
      icon: (
        <svg className="w-4 h-4 text-[#0284C7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="m9 9 6 6" />
          <path d="m15 9-6 6" />
        </svg>
      ),
    },
    {
      id: "card",
      title: "Credit / Debit Card",
      description: "Visa, Mastercard, RuPay, Corporate Cards",
      icon: (
        <svg className="w-4 h-4 text-[#0284C7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
    },
    {
      id: "netbanking",
      title: "Net Banking",
      description: "All Indian nationalized & private banks",
      icon: (
        <svg className="w-4 h-4 text-[#0284C7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m2 7 10-5 10 5v2H2Z" />
          <path d="M4 11v8" />
          <path d="M8 11v8" />
          <path d="M12 11v8" />
          <path d="M16 11v8" />
          <path d="M20 11v8" />
          <path d="M2 19h20v2H2Z" />
        </svg>
      ),
    },
    {
      id: "wallet",
      title: "Digital Wallets",
      description: "Amazon Pay, Mobikwik, Airtel Money",
      icon: (
        <svg className="w-4 h-4 text-[#0284C7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
          <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-[#F7F8FA] selection:bg-[#0EA5E9] selection:text-white font-sans">
      {/* Decorative Radial Gradients */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#E0F2FE] via-[#BAE6FD]/40 to-transparent blur-3xl pointer-events-none opacity-80" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-[#F4EBFF] via-[#E9D5FF]/30 to-transparent blur-3xl pointer-events-none opacity-80" />

      {/* Centered Glassmorphism Card (max-w-[500px]) */}
      <div
        className="w-full max-w-[500px] relative z-10 p-6 sm:p-8 border border-white/70 shadow-lg animate-scale-in"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.90)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: "20px",
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-2 transition-transform hover:scale-105">
            <Image
              src="/cvirms-logo.png"
              alt="CVIRMS Logo"
              width={42}
              height={42}
              className="object-contain"
              priority
            />
          </div>

          <h1 className="text-[22px] font-extrabold tracking-tight text-[#101828]">
            Complete Payment
          </h1>
          <p className="text-xs font-mono text-[#667085] mt-0.5">
            Order ID: {session.orderId}
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2.5 animate-fade-in">
            <svg
              className="w-4 h-4 text-red-500 shrink-0 mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="flex-1 leading-snug">{error}</div>
          </div>
        )}

        {/* Order Summary Card */}
        <div className="mb-5 p-4 rounded-xl border border-[#EAECF0] bg-white shadow-xs space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#101828]">
              Registration Fee — {session.establishmentName}
            </span>
            <span className="font-mono text-[#475467]">₹1,299.00</span>
          </div>

          <div className="flex items-center justify-between text-xs text-[#667085]">
            <span>Platform & Compliance Fee</span>
            <span className="font-mono text-[#12B76A] font-medium">₹0.00</span>
          </div>

          <div className="flex items-center justify-between text-xs text-[#667085]">
            <span>GST (18%)</span>
            <span className="font-mono">₹151.00</span>
          </div>

          <div className="border-t border-[#EAECF0] pt-2.5 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#101828]">
              Total Amount
            </span>
            <span className="font-mono text-[18px] font-extrabold text-[#101828]">
              ₹1,450
            </span>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-5 space-y-2.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#667085] mb-2">
            Select Payment Method
          </label>

          {paymentOptions.map((opt) => (
            <label
              key={opt.id}
              onClick={() => setPaymentMethod(opt.id)}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                paymentMethod === opt.id
                  ? "bg-[#E0F2FE]/40 border-[#0284C7] ring-1 ring-[#0284C7]"
                  : "bg-white border-[#EAECF0] hover:bg-[#F9FAFB]"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payment_method"
                  value={opt.id}
                  checked={paymentMethod === opt.id}
                  onChange={() => setPaymentMethod(opt.id)}
                  className="w-4 h-4 text-[#0284C7] focus:ring-[#0EA5E9]"
                />
                <div className="w-7 h-7 rounded-lg bg-[#F2F4F7] flex items-center justify-center shrink-0">
                  {opt.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#101828]">
                      {opt.title}
                    </span>
                    {opt.badge && (
                      <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#ECFDF3] text-[#12B76A] border border-[#ABEFC6]">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#667085]">{opt.description}</p>
                </div>
              </div>

              <div
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  paymentMethod === opt.id
                    ? "border-[#0284C7] bg-[#0284C7]"
                    : "border-[#D0D5DD]"
                }`}
              >
                {paymentMethod === opt.id && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
            </label>
          ))}
        </div>

        {/* Demo Simulation Note */}
        <p className="text-[11px] text-[#667085] italic text-center mb-4">
          This is a demo. No real payment will be processed. Click &apos;Pay Now&apos; to simulate success.
        </p>

        {/* Pay Button */}
        <button
          type="button"
          onClick={handlePay}
          disabled={processing}
          className="w-full flex items-center justify-center gap-2 text-white font-semibold text-[15px] rounded-[8px] transition-all duration-200 hover:-translate-y-px active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer select-none shadow-[0_4px_12px_rgba(15,23,42,0.25)] hover:shadow-[0_8px_20px_rgba(15,23,42,0.35)]"
          style={{
            background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
            padding: "14px",
          }}
        >
          {processing ? (
            <>
              <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Processing payment...</span>
            </>
          ) : (
            <>
              <span>Pay ₹1,450</span>
              <svg
                className="w-4 h-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </>
          )}
        </button>

        {/* Cancel link */}
        <div className="mt-4 text-center">
          <Link
            href="/register"
            className="text-xs font-medium text-[#667085] hover:text-[#101828] hover:underline"
          >
            &larr; Back to Registration
          </Link>
        </div>
      </div>
    </div>
  );
}
