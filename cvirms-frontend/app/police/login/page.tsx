"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function PoliceLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState<string>("police_kumar");
  const [password, setPassword] = useState<string>("123456");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handlePoliceLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      setError("Please enter your Officer Username or Badge ID.");
      return;
    }
    if (!cleanPassword) {
      setError("Please enter your security password.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/api/auth/login-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanUsername,
          password: cleanPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Authentication failed. Invalid officer credentials.");
      }

      // STRICT RBAC CHECK: If role is not 'police', reject and DO NOT save token
      if (data.user?.role !== "police") {
        throw new Error("Access Denied: Unauthorized role. Police credentials required.");
      }

      // Persist auth session
      localStorage.setItem("cvirms_token", data.token);
      localStorage.setItem("cvirms_user", JSON.stringify(data.user));

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("user-profile-updated"));
      }

      // Redirect immediately to police dashboard
      router.push("/police/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication error. Access denied.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#F7F8FA] selection:bg-[#0EA5E9] selection:text-white font-sans">
      {/* Decorative Sky Blue & Soft Violet Ambient Radial Gradients */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#E0F2FE] via-[#BAE6FD]/40 to-transparent blur-3xl pointer-events-none opacity-80" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-[#F4EBFF] via-[#E9D5FF]/30 to-transparent blur-3xl pointer-events-none opacity-80" />

      {/* Main Card (16px radius, Light White Theme) */}
      <div className="relative w-full max-w-[440px] bg-white/95 backdrop-blur-xl border border-white/60 shadow-xl shadow-sky-900/5 rounded-2xl p-8 z-10 transition-all">
        {/* Emblem & Branding Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-[#0EA5E9] to-[#0284C7] p-0.5 shadow-lg shadow-sky-500/20 transition-transform hover:scale-105 flex items-center justify-center">
            <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center">
              <Image
                src="/cvirms-logo.png"
                alt="CVIRMS Logo"
                width={46}
                height={46}
                priority
                className="object-contain"
              />
            </div>
          </div>

          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0F2FE] border border-sky-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] animate-pulse" />
            <span className="text-[11px] font-semibold text-[#0284C7] tracking-wider uppercase">
              Police Portal Authentication
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#101828]">
            Karnataka Police Portal
          </h1>
          <p className="text-xs font-medium text-[#667085] mt-0.5">
            City Visitor Information &amp; Record Management System
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200 shadow-xs">
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

        {/* Login Form */}
        <form onSubmit={handlePoliceLogin} className="space-y-4">
          {/* Officer Username / Badge ID */}
          <div>
            <label
              htmlFor="police-username"
              className="block text-[12px] font-semibold uppercase tracking-[0.04em] text-[#101828] mb-1.5"
            >
              Officer Username / Badge ID
            </label>
            <div className="relative">
              <input
                id="police-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="police_kumar"
                disabled={loading}
                className="w-full h-11 pl-10 pr-4 text-xs font-medium rounded-xl border border-[#D0D5DD] bg-white text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] transition-all disabled:opacity-50"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3] pointer-events-none">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Security Password */}
          <div>
            <label
              htmlFor="police-password"
              className="block text-[12px] font-semibold uppercase tracking-[0.04em] text-[#101828] mb-1.5"
            >
              Security Password
            </label>
            <div className="relative">
              <input
                id="police-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full h-11 pl-10 pr-10 text-xs font-medium rounded-xl border border-[#D0D5DD] bg-white text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] transition-all disabled:opacity-50"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3] pointer-events-none">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#101828] transition-colors cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Authenticate Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0369A1] text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-[#0EA5E9]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Authenticating Officer...</span>
              </>
            ) : (
              <>
                <span>Authenticate &amp; Enter Portal</span>
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Footer Audit Notice */}
        <div className="mt-6 pt-5 border-t border-[#EAECF0] text-center text-[11px] text-[#667085] font-mono">
          <p>Official Karnataka Police Network • Audit Log Active</p>
        </div>
      </div>
    </div>
  );
}
