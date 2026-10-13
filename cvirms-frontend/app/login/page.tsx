"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  // State Management
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState<string>("9876543210");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [captchaQuestion, setCaptchaQuestion] = useState<{ num1: number; num2: number }>({ num1: 18, num2: 42 });
  const [captchaAnswer, setCaptchaAnswer] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [resendTimer, setResendTimer] = useState<number>(30);

  // OTP input element references for auto-advance
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Generate random math challenge for Captcha
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 80) + 12;
    const num2 = Math.floor(Math.random() * 50) + 7;
    setCaptchaQuestion({ num1, num2 });
    setCaptchaAnswer("");
  };

  // Timer countdown for Resend OTP in Step 2
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  // Mask phone number for display in Step 2 (e.g. +91 98••••••10)
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

  // Handle Step 1: Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const trimmed = identifier.trim();
    if (!trimmed) {
      setError("Please enter your Phone Number or User ID.");
      return;
    }

    setLoading(true);
    try {
      const isDigitsOnly = /^\d+$/.test(trimmed);
      const payload = isDigitsOnly
        ? { phone: trimmed }
        : { user_id: trimmed };

      const res = await fetch("http://localhost:5000/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to send OTP. Please check your details.");
      }

      setStep(2);
      setResendTimer(30);
      generateCaptcha();
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Network error. Please try again.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP 6-box input changes with auto-advance
  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric single character
    const sanitized = value.replace(/\D/g, "");
    const newOtp = [...otp];

    if (sanitized.length > 0) {
      newOtp[index] = sanitized[sanitized.length - 1]; // take latest char
      setOtp(newOtp);
      // Advance to next box if available
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

  // Handle Step 2: Verify OTP + Captcha
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    const expectedCaptcha = captchaQuestion.num1 + captchaQuestion.num2;
    if (parseInt(captchaAnswer.trim(), 10) !== expectedCaptcha) {
      setError(`Incorrect math challenge result. Try again.`);
      generateCaptcha();
      return;
    }

    setLoading(true);
    try {
      const isDigitsOnly = /^\d+$/.test(identifier.trim());
      const payload = {
        phone: isDigitsOnly ? identifier.trim() : undefined,
        user_id: !isDigitsOnly ? identifier.trim() : undefined,
        otp: otpCode,
        captcha: captchaAnswer.trim(),
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
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#F7F8FA] selection:bg-[#0EA5E9] selection:text-white font-sans">
      {/* Decorative Full-Screen Radial Gradients */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#E0F2FE] via-[#BAE6FD]/40 to-transparent blur-3xl pointer-events-none opacity-80" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-[#F4EBFF] via-[#E9D5FF]/30 to-transparent blur-3xl pointer-events-none opacity-80" />

      {/* Centered Glassmorphism Authentication Card */}
      <div
        className="w-full max-w-[460px] relative z-10 p-8 sm:p-10 border border-white/60 shadow-lg animate-scale-in"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: "20px",
        }}
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          {/* Official CVIRMS Logo Image */}
          <div className="mb-3.5 transition-transform hover:scale-105">
            <Image
              src="/cvirms-logo.png"
              alt="CVIRMS Logo"
              width={44}
              height={44}
              className="object-contain"
              priority
            />
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-[#101828]">
            CVIRMS
          </h1>
          <p className="text-xs font-medium text-[#667085] mt-1 max-w-[280px]">
            City Visitor Information & Record Management System
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0F2FE] border border-sky-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] animate-pulse" />
            <span className="text-[11px] font-semibold text-[#0284C7] tracking-wider uppercase">
              Member Portal Authentication
            </span>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2.5 animate-fade-in">
            <span className="text-sm font-bold">⚠️</span>
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* ================= STEP 1: Phone / User ID Entry ================= */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-5 animate-fade-in">
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
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 9876543210 or demopg"
                  autoFocus
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#EAECF0] bg-white/90 text-[#101828] placeholder-[#98A2B3] text-sm font-medium outline-none transition-all duration-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 shadow-xs"
                />
              </div>
              <p className="text-[11px] text-[#667085] mt-1.5">
                Registered establishment phone number or assigned User ID.
              </p>
            </div>

            {/* Primary Action Button: Send OTP */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Sending Secure OTP...</span>
              ) : (
                <span>Send OTP →</span>
              )}
            </button>

            {/* Demo Helper Banner */}
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
          </form>
        )}

        {/* ================= STEP 2: OTP + Math Captcha ================= */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-5 animate-fade-in">
            {/* Header with Back Arrow and Masked Destination */}
            <div className="flex items-start gap-3 pb-1 border-b border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError(null);
                }}
                className="mt-0.5 p-1 rounded-lg text-[#667085] hover:text-[#101828] hover:bg-gray-100 transition-colors"
                title="Return to Step 1"
              >
                ←
              </button>
              <div>
                <p className="text-xs text-[#667085]">
                  We&apos;ve sent a 6-digit OTP to{" "}
                  <span className="font-mono font-semibold text-[#101828]">
                    {getMaskedIdentifier(identifier)}
                  </span>
                </p>
                <p className="text-[11px] text-[#0284C7] font-medium mt-0.5">
                  Mock OTP active: enter <span className="font-mono font-bold">123456</span>
                </p>
              </div>
            </div>

            {/* 6-box OTP Input Fields */}
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-[0.04em] text-[#101828] mb-2 text-center">
                Enter 6-Digit OTP
              </label>
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
                    className="w-11 h-13 text-center text-xl font-mono font-extrabold rounded-xl border border-[#EAECF0] bg-white text-[#101828] outline-none transition-all duration-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 shadow-xs"
                  />
                ))}
              </div>
            </div>

            {/* Mono-font Math CAPTCHA Field */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="captchaInput"
                  className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#101828]"
                >
                  Math Security Check
                </label>
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="text-[11px] text-[#0284C7] hover:underline"
                >
                  New Challenge ⟳
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Gray gradient challenge box */}
                <div className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 font-mono text-center text-sm font-extrabold text-[#101828] tracking-wider select-none shadow-inner">
                  {captchaQuestion.num1} + {captchaQuestion.num2} = ?
                </div>

                {/* Captcha user answer input */}
                <input
                  id="captchaInput"
                  type="number"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="Answer"
                  required
                  className="w-28 py-2.5 px-3 rounded-xl border border-[#EAECF0] bg-white text-[#101828] text-center font-mono font-bold text-sm outline-none transition-all duration-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 shadow-xs"
                />
              </div>
            </div>

            {/* Primary Action Button: Verify & Sign In */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Verifying Credentials...</span>
              ) : (
                <span>Verify & Sign In →</span>
              )}
            </button>

            {/* Resend OTP Link with Countdown Timer */}
            <div className="text-center pt-1">
              {resendTimer > 0 ? (
                <p className="text-xs text-[#667085]">
                  Resend OTP in{" "}
                  <span className="font-mono font-bold text-[#0284C7]">
                    {resendTimer}s
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  className="text-xs font-semibold text-[#0284C7] hover:underline"
                >
                  Didn&apos;t receive code? Resend OTP
                </button>
              )}
            </div>
          </form>
        )}

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
