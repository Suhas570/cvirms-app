"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  // Primary form state
  const [identifier, setIdentifier] = useState<string>("9876543210");
  const [captchaAnswer, setCaptchaAnswer] = useState<string>("");
  const [captchaId, setCaptchaId] = useState<string>("");
  const [captchaSvg, setCaptchaSvg] = useState<string>("");
  const [loadingCaptcha, setLoadingCaptcha] = useState<boolean>(true);

  // OTP State (revealed inline on the same card once OTP is sent)
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState<number>(30);

  // Feedback and loading states
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loadingSendOtp, setLoadingSendOtp] = useState<boolean>(false);
  const [loadingVerify, setLoadingVerify] = useState<boolean>(false);

  // OTP input element references for auto-advance
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Fetch Alphanumeric SVG Captcha challenge from backend
  const fetchCaptcha = async () => {
    try {
      setLoadingCaptcha(true);
      setError(null);
      const res = await fetch("http://localhost:5000/api/auth/captcha");
      const data = await res.json();
      if (res.ok && data.success) {
        setCaptchaId(data.captchaId);
        setCaptchaSvg(data.captchaSvg);
        setCaptchaAnswer("");
      } else {
        throw new Error(data.message || "Failed to load security challenge");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Security service unavailable";
      setError(msg);
    } finally {
      setLoadingCaptcha(false);
    }
  };

  // Initial captcha load
  useEffect(() => {
    fetchCaptcha();
  }, []);

  // Timer countdown for Resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpSent, resendTimer]);

  // Mask phone number for display
  const getMaskedIdentifier = (val: string) => {
    if (!val) return "+91 ••••••••••";
    const clean = val.replace(/\D/g, "");
    if (clean.length === 10) {
      return `+91 ${clean.slice(0, 2)}••••••${clean.slice(8)}`;
    }
    if (val.length > 4) {
      return `${val.slice(0, 2)}${"•".repeat(Math.max(val.length - 4, 3))}${val.slice(-2)}`;
    }
    return val;
  };

  // Step 1: Send OTP with Alphanumeric Captcha validation
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      setError("Please enter your Phone Number or User ID.");
      return;
    }

    const trimmedCaptcha = captchaAnswer.trim();
    if (!trimmedCaptcha) {
      setError("Please enter the security captcha characters.");
      return;
    }

    setLoadingSendOtp(true);
    try {
      const isDigitsOnly = /^\d+$/.test(trimmedIdentifier);
      const payload = {
        phone: isDigitsOnly ? trimmedIdentifier : undefined,
        user_id: !isDigitsOnly ? trimmedIdentifier : undefined,
        captcha: trimmedCaptcha,
        captchaId,
      };

      const res = await fetch("http://localhost:5000/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // Refresh captcha on failure to prevent brute-force
        fetchCaptcha();
        throw new Error(data.message || "Failed to send OTP. Please review inputs.");
      }

      setOtpSent(true);
      setResendTimer(30);
      setSuccessMsg("Security verification passed. OTP sent to registered device.");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Network error. Please try again.";
      setError(errMsg);
    } finally {
      setLoadingSendOtp(false);
    }
  };

  // Handle OTP 6-box input changes with auto-advance
  const handleOtpChange = (index: number, value: string) => {
    const sanitized = value.replace(/\D/g, "");
    const newOtp = [...otp];

    if (sanitized.length > 0) {
      newOtp[index] = sanitized[sanitized.length - 1];
      setOtp(newOtp);
      if (index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    } else {
      newOtp[index] = "";
      setOtp(newOtp);
    }
  };

  // Handle backspace navigation across boxes
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste full 6-digit OTP
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasteData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pasteData.length; i++) {
      newOtp[i] = pasteData[i];
    }
    setOtp(newOtp);

    const nextIndex = Math.min(pasteData.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit OTP code.");
      return;
    }

    setLoadingVerify(true);
    try {
      const isDigitsOnly = /^\d+$/.test(identifier.trim());
      const payload = {
        phone: isDigitsOnly ? identifier.trim() : undefined,
        user_id: !isDigitsOnly ? identifier.trim() : undefined,
        otp: otpCode,
      };

      const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid OTP code. Verification failed.");
      }

      // Persist auth tokens in localStorage
      localStorage.setItem("cvirms_token", data.token);
      localStorage.setItem("cvirms_user", JSON.stringify(data.user));

      // Redirect immediately to dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Verification error. Please try again.";
      setError(errMsg);
    } finally {
      setLoadingVerify(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#F7F8FA] selection:bg-[#0EA5E9] selection:text-white font-sans">
      {/* Decorative Full-Screen Radial Gradients */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#E0F2FE] via-[#BAE6FD]/40 to-transparent blur-3xl pointer-events-none opacity-80" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-[#F4EBFF] via-[#E9D5FF]/30 to-transparent blur-3xl pointer-events-none opacity-80" />

      {/* Centered Glassmorphism Authentication Card */}
      <div
        className="w-full max-w-[480px] relative z-10 p-8 sm:p-10 border border-white/60 shadow-lg animate-scale-in"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: "20px",
        }}
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="mb-3 transition-transform hover:scale-105">
            <Image
              src="/cvirms-logo.png"
              alt="CVIRMS Logo"
              width={46}
              height={46}
              className="object-contain"
              priority
            />
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-[#101828]">
            CVIRMS
          </h1>
          <p className="text-xs font-medium text-[#667085] mt-0.5 max-w-[300px]">
            City Visitor Information & Record Management System
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0F2FE] border border-sky-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] animate-pulse" />
            <span className="text-[11px] font-semibold text-[#0284C7] tracking-wider uppercase">
              Member Portal Authentication
            </span>
          </div>
        </div>

        {/* Global Error Alert Banner (Lucide SVG, NO emojis) */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2.5 animate-fade-in shadow-xs">
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

        {/* Global Success Banner */}
        {successMsg && !error && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2.5 animate-fade-in shadow-xs">
            <svg
              className="w-4 h-4 text-emerald-600 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <div className="flex-1 leading-snug">{successMsg}</div>
          </div>
        )}

        {/* ================= ALL-ON-FIRST-SCREEN AUTHENTICATION FLOW ================= */}
        <div className="space-y-5">
          {/* Section 1: Phone / User ID */}
          <div>
            <label
              htmlFor="identifier"
              className="block text-[12px] font-semibold uppercase tracking-[0.04em] text-[#101828] mb-1.5"
            >
              Phone Number or User ID
            </label>
            <div className="relative">
              <input
                id="identifier"
                type="text"
                disabled={otpSent}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 9876543210 or demopg"
                required
                className={`w-full px-4 py-2.5 rounded-xl border border-[#EAECF0] text-[#101828] placeholder-[#98A2B3] text-sm font-medium outline-none transition-all duration-200 shadow-xs ${
                  otpSent
                    ? "bg-gray-100 text-[#667085] cursor-not-allowed"
                    : "bg-white/90 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10"
                }`}
              />
              {otpSent && (
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setError(null);
                    setSuccessMsg(null);
                    fetchCaptcha();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#0284C7] hover:underline"
                >
                  Edit
                </button>
              )}
            </div>
            {!otpSent && (
              <p className="text-[11px] text-[#667085] mt-1.5">
                Registered establishment contact phone or assigned User ID.
              </p>
            )}
          </div>

          {/* Section 2: Alphanumeric SVG Security Captcha */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="captchaInput"
                className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#101828]"
              >
                Security Check (Alphanumeric)
              </label>
              <button
                type="button"
                onClick={fetchCaptcha}
                disabled={loadingCaptcha || otpSent}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0284C7] hover:text-[#0369A1] disabled:opacity-50 transition-colors"
                title="Request new challenge"
              >
                <svg
                  className={`w-3 h-3 ${loadingCaptcha ? "animate-spin" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 21h5v-5" />
                </svg>
                <span>New Challenge</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Alphanumeric SVG Captcha Box */}
              <div
                className="h-11 w-36 rounded-xl border border-[#D0D5DD] bg-white flex items-center justify-center overflow-hidden shadow-2xs shrink-0 select-none"
                style={{ backgroundColor: "#FFFFFF" }}
              >
                {loadingCaptcha ? (
                  <span className="text-[11px] font-mono text-[#98A2B3]">Loading...</span>
                ) : captchaSvg ? (
                  <div
                    className="w-full h-full flex items-center justify-center [&>svg]:h-full [&>svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: captchaSvg }}
                  />
                ) : (
                  <span className="text-[11px] text-[#98A2B3]">Captcha Error</span>
                )}
              </div>

              {/* Captcha Answer Input */}
              <input
                id="captchaInput"
                type="text"
                disabled={otpSent}
                maxLength={6}
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                placeholder="Enter characters"
                required
                className={`flex-1 h-11 px-3.5 rounded-xl border border-[#EAECF0] text-[#101828] font-mono font-bold text-sm tracking-wider placeholder-[#98A2B3] outline-none transition-all duration-200 shadow-xs ${
                  otpSent
                    ? "bg-gray-100 text-[#667085] cursor-not-allowed"
                    : "bg-white/90 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10"
                }`}
              />
            </div>
            {!otpSent && (
              <p className="text-[11px] text-[#667085] mt-1.5">
                Type the 5 alphanumeric characters shown above (case-insensitive).
              </p>
            )}
          </div>

          {/* Section 3: Send OTP Action Button */}
          {!otpSent && (
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loadingSendOtp || loadingCaptcha}
              className="w-full py-3 px-6 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {loadingSendOtp ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  <span>Sending Secure OTP...</span>
                </>
              ) : (
                <>
                  <span>Send OTP</span>
                  <svg
                    className="w-4 h-4"
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
          )}

          {/* ================= INLINE OTP ENTRY (REVEALED ON SAME CARD) ================= */}
          {otpSent && (
            <div className="pt-4 border-t border-[#EAECF0] space-y-5 animate-slide-up">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-[0.04em] text-[#101828]">
                    Enter 6-Digit OTP Code
                  </label>
                  <p className="text-[11px] text-[#667085] mt-0.5">
                    Sent to{" "}
                    <span className="font-mono font-semibold text-[#101828]">
                      {getMaskedIdentifier(identifier)}
                    </span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-mono font-bold text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded-md border border-sky-200">
                    Dev Mock: 123456
                  </span>
                </div>
              </div>

              {/* 6-box OTP Input Fields */}
              <div className="flex justify-between items-center gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={idx === 0 ? handleOtpPaste : undefined}
                    className="w-12 h-14 text-center text-2xl font-mono font-extrabold rounded-xl border border-[#EAECF0] bg-white text-[#101828] outline-none transition-all duration-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 shadow-xs"
                  />
                ))}
              </div>

              {/* Verify & Sign In Button */}
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loadingVerify || otp.join("").length !== 6}
                className="w-full py-3 px-6 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              >
                {loadingVerify ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Sign In</span>
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </>
                )}
              </button>

              {/* Resend OTP Link with Countdown Timer */}
              <div className="text-center pt-1">
                {resendTimer > 0 ? (
                  <p className="text-xs text-[#667085]">
                    Resend code in{" "}
                    <span className="font-mono font-bold text-[#0284C7]">
                      {resendTimer}s
                    </span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={loadingSendOtp}
                    className="text-xs font-semibold text-[#0284C7] hover:underline"
                  >
                    Didn&apos;t receive code? Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Demo Helper Banner */}
          {!otpSent && (
            <div className="pt-2">
              <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-100 text-[#0284C7] text-[11px] leading-relaxed text-center">
                <span className="font-bold">Demo Establishment:</span> Use phone{" "}
                <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-sky-200">
                  9876543210
                </code>{" "}
                or User ID{" "}
                <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-sky-200">
                  demopg
                </code>
              </div>
            </div>
          )}
        </div>

        {/* Security Footer Notice */}
        <div className="mt-8 pt-4 border-t border-gray-200/60 text-center">
          <p className="text-[10px] uppercase font-bold tracking-wider text-[#98A2B3]">
            Government of Karnataka • Police Department • E-Governance
          </p>
        </div>
      </div>
    </div>
  );
}
