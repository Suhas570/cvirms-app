"use client";

import React, { useState } from "react";
import Link from "next/link";

export interface ReceiptPrinterProps {
  orderId: string;
  amount: number;
  date: string;
  method: string;
  username: string;
  tempPassword?: string;
  phone?: string;
  establishmentName?: string;
}

export default function ReceiptPrinter({
  orderId,
  amount = 1450,
  date,
  method = "upi",
  username,
  tempPassword,
  phone,
  establishmentName,
}: ReceiptPrinterProps) {
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const copyToClipboard = async (text: string, type: "user" | "pass") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "user") {
        setCopiedUser(true);
        setTimeout(() => setCopiedUser(false), 2000);
      } else {
        setCopiedPass(true);
        setTimeout(() => setCopiedPass(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const formattedDate = (() => {
    try {
      const d = new Date(date || Date.now());
      return d.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
    } catch {
      return "15 Oct 2026, 12:30 PM";
    }
  })();

  const maskedPhone = (() => {
    if (!phone) return "+91 ••••••••••";
    const clean = phone.replace(/\D/g, "");
    if (clean.length === 10) {
      return `+91 ${clean.slice(0, 2)}••••••${clean.slice(8)}`;
    }
    return `+91 ${clean}`;
  })();

  const cleanOrderDigits = orderId.replace(/\D/g, "").slice(-5) || "00047";

  return (
    <div className="w-full max-w-[460px] mx-auto space-y-6">
      {/* ================= 1. DARK RECEIPT PRINTER WRAPPER (#0F172A) ================= */}
      <div className="receipt-wrapper relative rounded-[24px] bg-[#0F172A] p-6 sm:p-7 shadow-2xl border border-slate-800 text-white overflow-hidden">
        {/* SUCCESS HEADER */}
        <div className="success-header flex flex-col items-center text-center mb-6">
          {/* Animated Green Circle with Pulsing Ring & Self-Drawing Check */}
          <div className="relative mb-3.5">
            <div className="pulse-ring absolute inset-0 rounded-full bg-[#12B76A]/30" />
            <div className="check-icon relative w-14 h-14 rounded-full bg-gradient-to-tr from-[#12B76A] to-[#32D583] flex items-center justify-center shadow-lg">
              <svg
                className="w-7 h-7 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline className="draw-check" points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Order Complete
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-[320px] leading-relaxed">
            Your establishment is registered. Login credentials sent to your WhatsApp.
          </p>
        </div>

        {/* PRINTER HARDWARE SLOT WITH BLINKING LED */}
        <div className="printer-slot relative w-full h-4 bg-[#090D16] rounded-full border border-slate-700/60 shadow-inner flex items-center justify-between px-3 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="led-blink w-2 h-2 rounded-full bg-[#12B76A]" />
            <span className="text-[9px] font-mono tracking-wider uppercase text-slate-500 font-semibold">
              PRINTER READY
            </span>
          </div>
          <span className="text-[9px] font-mono text-slate-600">CV-THERMAL-2026</span>
        </div>

        {/* RECEIPT PAPER CONTAINER (Animated feed down with jagged torn edges) */}
        <div className="receipt-paper-container overflow-hidden pt-1">
          <div className="receipt-paper bg-white text-[#101828] p-6 shadow-xl relative font-sans">
            {/* Receipt Watermark / Header */}
            <div className="text-center pb-3 border-b border-dashed border-gray-300">
              <span className="inline-block px-2 py-0.5 rounded bg-sky-50 text-[#0284C7] font-mono text-[10px] font-bold tracking-wider uppercase mb-1">
                OFFICIAL PAYMENT RECEIPT
              </span>
              <h3 className="text-base font-extrabold text-[#101828] uppercase tracking-wide">
                CVIRMS KARNATAKA
              </h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-tight">
                Police Department & E-Governance Initiative
              </p>
              {establishmentName && (
                <p className="text-xs font-bold text-[#0284C7] mt-1">
                  {establishmentName}
                </p>
              )}
            </div>

            {/* Metadata (Mono 11px) */}
            <div className="py-3 border-b border-dashed border-gray-300 font-mono text-[11px] space-y-1 text-gray-600">
              <div className="flex justify-between">
                <span>DATE:</span>
                <span className="font-semibold text-gray-900">{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>ORDER ID:</span>
                <span className="font-semibold text-[#0284C7]">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span>PAYMENT METHOD:</span>
                <span className="font-semibold uppercase text-gray-900">{method}</span>
              </div>
              <div className="flex justify-between">
                <span>STATUS:</span>
                <span className="font-bold text-[#12B76A]">PAID / VERIFIED</span>
              </div>
            </div>

            {/* Line Items */}
            <div className="py-3 border-b border-dashed border-gray-300 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-700">Registration Fee</span>
                <span className="font-mono font-medium text-gray-900">₹1,299.00</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Platform Fee</span>
                <span className="font-mono text-[#12B76A] font-semibold">₹0.00</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>GST (18%)</span>
                <span className="font-mono">₹151.00</span>
              </div>
            </div>

            {/* Total Row */}
            <div className="py-3 flex items-baseline justify-between border-b-2 border-gray-900">
              <span className="text-xs font-bold tracking-wider uppercase text-gray-900">
                TOTAL PAID
              </span>
              <span className="font-mono text-[20px] font-extrabold text-[#101828]">
                ₹{amount.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Hand-Crafted Authentic SVG Barcode */}
            <div className="pt-4 pb-2 flex flex-col items-center">
              <svg
                viewBox="0 0 280 44"
                className="w-full max-w-[260px] h-10 overflow-visible"
              >
                <rect x="0" y="0" width="3" height="44" fill="#101828" />
                <rect x="5" y="0" width="1.5" height="44" fill="#101828" />
                <rect x="9" y="0" width="4" height="44" fill="#101828" />
                <rect x="16" y="0" width="2" height="44" fill="#101828" />
                <rect x="21" y="0" width="1" height="44" fill="#101828" />
                <rect x="25" y="0" width="3.5" height="44" fill="#101828" />
                <rect x="31" y="0" width="2" height="44" fill="#101828" />
                <rect x="36" y="0" width="5" height="44" fill="#101828" />
                <rect x="44" y="0" width="1.5" height="44" fill="#101828" />
                <rect x="48" y="0" width="3" height="44" fill="#101828" />
                <rect x="54" y="0" width="4" height="44" fill="#101828" />
                <rect x="61" y="0" width="1" height="44" fill="#101828" />
                <rect x="65" y="0" width="2.5" height="44" fill="#101828" />
                <rect x="71" y="0" width="4.5" height="44" fill="#101828" />
                <rect x="78" y="0" width="1.5" height="44" fill="#101828" />
                <rect x="83" y="0" width="3.5" height="44" fill="#101828" />
                <rect x="89" y="0" width="2" height="44" fill="#101828" />
                <rect x="94" y="0" width="4" height="44" fill="#101828" />
                <rect x="101" y="0" width="1.5" height="44" fill="#101828" />
                <rect x="105" y="0" width="3" height="44" fill="#101828" />
                <rect x="111" y="0" width="5" height="44" fill="#101828" />
                <rect x="119" y="0" width="2" height="44" fill="#101828" />
                <rect x="124" y="0" width="1" height="44" fill="#101828" />
                <rect x="128" y="0" width="3.5" height="44" fill="#101828" />
                <rect x="134" y="0" width="2" height="44" fill="#101828" />
                <rect x="139" y="0" width="4" height="44" fill="#101828" />
                <rect x="146" y="0" width="1.5" height="44" fill="#101828" />
                <rect x="150" y="0" width="3" height="44" fill="#101828" />
                <rect x="156" y="0" width="4.5" height="44" fill="#101828" />
                <rect x="163" y="0" width="1" height="44" fill="#101828" />
                <rect x="167" y="0" width="3.5" height="44" fill="#101828" />
                <rect x="173" y="0" width="2" height="44" fill="#101828" />
                <rect x="178" y="0" width="4" height="44" fill="#101828" />
                <rect x="185" y="0" width="1.5" height="44" fill="#101828" />
                <rect x="189" y="0" width="3" height="44" fill="#101828" />
                <rect x="195" y="0" width="5" height="44" fill="#101828" />
                <rect x="203" y="0" width="2" height="44" fill="#101828" />
                <rect x="208" y="0" width="1" height="44" fill="#101828" />
                <rect x="212" y="0" width="3.5" height="44" fill="#101828" />
                <rect x="218" y="0" width="2" height="44" fill="#101828" />
                <rect x="223" y="0" width="4" height="44" fill="#101828" />
                <rect x="230" y="0" width="1.5" height="44" fill="#101828" />
                <rect x="234" y="0" width="3" height="44" fill="#101828" />
                <rect x="240" y="0" width="4.5" height="44" fill="#101828" />
                <rect x="247" y="0" width="1" height="44" fill="#101828" />
                <rect x="251" y="0" width="3" height="44" fill="#101828" />
                <rect x="257" y="0" width="2" height="44" fill="#101828" />
                <rect x="262" y="0" width="4" height="44" fill="#101828" />
                <rect x="269" y="0" width="1.5" height="44" fill="#101828" />
                <rect x="273" y="0" width="3" height="44" fill="#101828" />
                <rect x="278" y="0" width="2" height="44" fill="#101828" />
              </svg>

              <span className="text-[10px] font-mono tracking-[0.3em] text-gray-500 mt-1 uppercase">
                CV2026 {cleanOrderDigits} 1450
              </span>
            </div>

            {/* Thank you note */}
            <p className="text-[10px] text-gray-500 text-center pt-2 border-t border-dashed border-gray-300 italic">
              Thank you for registering with CVIRMS Karnataka
            </p>
          </div>
        </div>

        {/* PRINTER BASE */}
        <div className="printer-base h-2 bg-[#090D16] rounded-b-xl border-t border-slate-700/40 mt-1" />
      </div>

      {/* ================= 2. CREDENTIALS CARD ================= */}
      <div className="bg-white rounded-[16px] border border-[#EAECF0] shadow-sm p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-[#101828]">
            Your Login Credentials
          </h3>
          <p className="text-xs text-[#667085] mt-0.5">
            Also sent to <span className="font-semibold text-gray-800">{maskedPhone}</span> via WhatsApp
          </p>
        </div>

        {/* Credential rows with copy buttons */}
        <div className="space-y-2.5">
          {/* Username */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7F8FA] border border-[#EAECF0]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                Username
              </p>
              <p className="font-mono text-sm font-bold text-[#101828] select-all">
                {username}
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(username, "user")}
              className="px-2.5 py-1.5 rounded-lg border border-[#D0D5DD] bg-white hover:bg-[#F2F4F7] text-xs font-semibold text-[#344054] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              {copiedUser ? (
                <>
                  <svg className="w-3.5 h-3.5 text-[#12B76A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-[#12B76A]">Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-[#667085]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Temporary Password */}
          {tempPassword && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7F8FA] border border-[#EAECF0]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                  Temporary Password
                </p>
                <p className="font-mono text-sm font-bold text-[#101828] select-all">
                  {tempPassword}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(tempPassword, "pass")}
                className="px-2.5 py-1.5 rounded-lg border border-[#D0D5DD] bg-white hover:bg-[#F2F4F7] text-xs font-semibold text-[#344054] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                {copiedPass ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-[#12B76A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-[#12B76A]">Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 text-[#667085]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Warning Banner (Amber #FEF0C7) */}
        <div className="p-3 rounded-xl bg-[#FEF0C7] border border-[#FEDF89] text-[#B54708] text-xs flex items-center gap-2.5">
          <svg className="w-4 h-4 shrink-0 text-[#F79009]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="font-semibold leading-tight">
            Please change your temporary password after your first login.
          </span>
        </div>

        {/* Button to go to login */}
        <Link
          href="/login"
          className="w-full flex items-center justify-center gap-2 text-white font-semibold text-[15px] rounded-[8px] transition-all duration-200 hover:-translate-y-px active:translate-y-0 cursor-pointer select-none shadow-[0_4px_12px_rgba(15,23,42,0.25)] hover:shadow-[0_8px_20px_rgba(15,23,42,0.35)]"
          style={{
            background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
            padding: "14px",
          }}
        >
          <span>Go to Login</span>
          <svg
            className="w-4 h-4 shrink-0 text-white"
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
        </Link>
      </div>

      {/* ================= EXACT CSS KEYFRAME ANIMATIONS ================= */}
      <style jsx>{`
        .receipt-wrapper {
          animation: fadeInUp 0.6s ease-out;
        }

        .check-icon {
          animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s both;
        }

        .pulse-ring {
          animation: pulseRing 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
        }

        .draw-check {
          stroke-dasharray: 24;
          stroke-dashoffset: 24;
          animation: drawCheck 0.5s ease-out 0.5s forwards;
        }

        .led-blink {
          animation: ledBlink 2s ease-in-out infinite;
        }

        .receipt-paper-container {
          max-height: 800px;
          animation: printReceipt 2.4s steps(28, end) 0.8s both;
        }

        .receipt-paper {
          /* Authentic Jagged Torn Edges at top & bottom */
          clip-path: polygon(
            0% 10px, 2.5% 0px, 5% 10px, 7.5% 0px, 10% 10px, 12.5% 0px, 15% 10px, 17.5% 0px, 
            20% 10px, 22.5% 0px, 25% 10px, 27.5% 0px, 30% 10px, 32.5% 0px, 35% 10px, 37.5% 0px, 
            40% 10px, 42.5% 0px, 45% 10px, 47.5% 0px, 50% 10px, 52.5% 0px, 55% 10px, 57.5% 0px, 
            60% 10px, 62.5% 0px, 65% 10px, 67.5% 0px, 70% 10px, 72.5% 0px, 75% 10px, 77.5% 0px, 
            80% 10px, 82.5% 0px, 85% 10px, 87.5% 0px, 90% 10px, 92.5% 0px, 95% 10px, 97.5% 0px, 100% 10px,
            100% calc(100% - 10px), 97.5% 100%, 95% calc(100% - 10px), 92.5% 100%, 90% calc(100% - 10px), 87.5% 100%, 
            85% calc(100% - 10px), 82.5% 100%, 80% calc(100% - 10px), 77.5% 100%, 75% calc(100% - 10px), 72.5% 100%, 
            70% calc(100% - 10px), 67.5% 100%, 65% calc(100% - 10px), 62.5% 100%, 60% calc(100% - 10px), 57.5% 100%, 
            55% calc(100% - 10px), 52.5% 100%, 50% calc(100% - 10px), 47.5% 100%, 45% calc(100% - 10px), 42.5% 100%, 
            40% calc(100% - 10px), 37.5% 100%, 35% calc(100% - 10px), 32.5% 100%, 30% calc(100% - 10px), 27.5% 100%, 
            25% calc(100% - 10px), 22.5% 100%, 20% calc(100% - 10px), 17.5% 100%, 15% calc(100% - 10px), 12.5% 100%, 
            10% calc(100% - 10px), 7.5% 100%, 5% calc(100% - 10px), 2.5% 100%, 0% calc(100% - 10px)
          );
          animation: feedPaper 2.4s steps(28, end) 0.8s both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes popIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          70% {
            transform: scale(1.15);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes pulseRing {
          0% {
            transform: scale(0.95);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.35);
            opacity: 0;
          }
          100% {
            transform: scale(0.95);
            opacity: 0;
          }
        }

        @keyframes drawCheck {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes ledBlink {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 6px #12B76A;
          }
          50% {
            opacity: 0.3;
            box-shadow: none;
          }
        }

        @keyframes printReceipt {
          from {
            max-height: 0px;
          }
          to {
            max-height: 800px;
          }
        }

        @keyframes feedPaper {
          from {
            transform: translateY(-90%);
          }
          to {
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .receipt-wrapper,
          .check-icon,
          .pulse-ring,
          .draw-check,
          .led-blink,
          .receipt-paper-container,
          .receipt-paper {
            animation-duration: 0.01s !important;
            animation-delay: 0s !important;
          }
        }
      `}</style>
    </div>
  );
}
