"use client";

import React from "react";
import Link from "next/link";

export default function PoliceReportsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EAECF0] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#101828]">
              City Analytics &amp; Reports
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">
              PHASE 2
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#475467] mt-1">
            Detailed visitor reports coming in Prompt 17.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/police/dashboard"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#344054] bg-[#F9FAFB] hover:bg-[#F2F4F7] border border-[#D0D5DD] transition-all"
          >
            <svg
              className="w-3.5 h-3.5 text-[#667085]"
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
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Placeholder Shell Card */}
      <div className="bg-white rounded-[16px] border border-[#EAECF0] shadow-xs p-12 text-center flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] mb-4 shadow-xs">
          <svg
            className="w-7 h-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-[#101828] mb-1">
          City Analytics &amp; Intelligence Reports Engine
        </h2>
        <p className="text-xs text-[#667085] max-w-md mb-6">
          Detailed visitor reports, cross-establishment guest trends, flag audit logs, and compliance analytics are scheduled for deployment in Prompt 17.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F2F4F7] text-[11px] font-mono text-[#475467]">
          <span className="w-2 h-2 rounded-full bg-[#0EA5E9] animate-pulse" />
          <span>Status: Queue Scheduled (Prompt 17)</span>
        </div>
      </div>
    </div>
  );
}

