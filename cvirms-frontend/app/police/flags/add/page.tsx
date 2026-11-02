"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AddPoliceFlagPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    suspect_name: "",
    mobile: "",
    aadhaar: "",
    pan: "",
    dl: "",
    vehicle_number: "",
    remark: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.suspect_name.trim()) {
      setError("Suspect full name is required to issue a watchlist flag.");
      return;
    }

    try {
      setLoading(true);
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("cvirms_token")
          : null;

      if (!token) {
        throw new Error(
          "Law enforcement session expired. Please log in again."
        );
      }

      const res = await fetch("http://localhost:5000/api/police/flags", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to issue watchlist flag.");
      }

      setSuccess("Suspect intelligence flag registered into live radar.");
      setTimeout(() => {
        router.push("/police/flags");
      }, 1200);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while issuing the flag.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans pb-16">
      {/* Header & Breadcrumb Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Issue Suspect Watchlist Flag
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-red-50 text-red-700 border border-red-200">
              RADAR WATCHLIST
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Register a person of interest into the active city surveillance network for real-time check-in correlation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/police/flags"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 transition-all shadow-sm"
          >
            <svg
              className="w-3.5 h-3.5 text-slate-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to All Flags</span>
          </Link>
        </div>
      </div>

      {/* Status Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <svg
              className="w-4 h-4 text-red-600 shrink-0"
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
            <span className="font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 font-semibold text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2.5 shadow-sm">
          <svg
            className="w-4 h-4 text-emerald-600 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span className="font-semibold">{success} Redirecting...</span>
        </div>
      )}

      {/* Main Flag Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Suspect Primary Identity */}
          <div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-[#0EA5E9]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>1. Suspect Personal Identity</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="suspect_name"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Suspect Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="suspect_name"
                    name="suspect_name"
                    type="text"
                    required
                    value={formData.suspect_name}
                    onChange={handleChange}
                    placeholder="Enter suspect full name or known aliases"
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all shadow-sm"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="mobile"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Contact / Mobile Number (Optional)
                </label>
                <div className="relative">
                  <input
                    id="mobile"
                    name="mobile"
                    type="text"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all shadow-sm"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="vehicle_number"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Vehicle Registration Plate (Optional)
                </label>
                <div className="relative">
                  <input
                    id="vehicle_number"
                    name="vehicle_number"
                    type="text"
                    value={formData.vehicle_number}
                    onChange={handleChange}
                    placeholder="e.g. KA01AB1234"
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono uppercase text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all shadow-sm"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.2 1 12 1 13v3c0 .6.4 1 1 1h2" />
                      <circle cx="7" cy="17" r="2" />
                      <circle cx="17" cy="17" r="2" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Official Identification Documents */}
          <div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-[#0EA5E9]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
              <span>2. Government Identification Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="aadhaar"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Aadhaar Number (Optional)
                </label>
                <input
                  id="aadhaar"
                  name="aadhaar"
                  type="text"
                  value={formData.aadhaar}
                  onChange={handleChange}
                  placeholder="12-digit Aadhaar number"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all shadow-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="pan"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  PAN Card Number (Optional)
                </label>
                <input
                  id="pan"
                  name="pan"
                  type="text"
                  value={formData.pan}
                  onChange={handleChange}
                  placeholder="e.g. ABCDE1234F"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono uppercase text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all shadow-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="dl"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Driving License Number (Optional)
                </label>
                <input
                  id="dl"
                  name="dl"
                  type="text"
                  value={formData.dl}
                  onChange={handleChange}
                  placeholder="e.g. KA0120220001234"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono uppercase text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Intelligence Remarks */}
          <div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-[#0EA5E9]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span>3. Intelligence Remarks &amp; FIR Cross-Reference</span>
            </h2>

            <div>
              <label
                htmlFor="remark"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Officer Intelligence Remarks / Case Reference (Optional)
              </label>
              <textarea
                id="remark"
                name="remark"
                rows={3}
                value={formData.remark}
                onChange={handleChange}
                placeholder="Mention FIR number, investigating officer notes, known threat details, or reason for watchlist placement..."
                className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-sans text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all shadow-sm resize-none"
              />
            </div>
          </div>

          {/* Surveillance Notice Banner */}
          <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 flex items-start gap-3">
            <svg
              className="w-5 h-5 text-[#0284C7] shrink-0 mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div className="text-xs text-sky-900">
              <span className="font-bold">Automated Radar Activation:</span> Once registered, any guest check-in matching this suspect&apos;s mobile number, Aadhaar, PAN, DL, or vehicle number across all hotels, PGs, and commercial lodges will instantly trigger high-priority alerts on the Police Radar.
            </div>
          </div>

          {/* Form Action Controls */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled
                className="h-11 px-4 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 text-xs font-semibold flex items-center gap-2 cursor-not-allowed"
                title="Bulk upload via CSV is coming soon"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Bulk CSV Upload</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 text-[10px] font-mono font-bold">
                  Coming Soon
                </span>
              </button>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                href="/police/flags"
                className="h-11 px-5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shadow-sm w-full sm:w-auto"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="h-11 px-6 rounded-xl text-white text-xs font-semibold bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0369A1] flex items-center justify-center gap-2 shadow-sm shadow-[#0EA5E9]/30 transition-all cursor-pointer disabled:opacity-50 w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                    </svg>
                    <span>Registering Intelligence...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                      <line x1="4" x2="4" y1="22" y2="15" />
                    </svg>
                    <span>Issue Intelligence Flag</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}