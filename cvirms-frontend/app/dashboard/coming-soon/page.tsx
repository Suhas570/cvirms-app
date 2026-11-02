"use client";

import React from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";

export default function ComingSoonPage() {
  return (
    <DashboardLayout>
      <div className="min-h-[70vh] flex items-center justify-center animate-fade-in p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#EAECF0] shadow-sm p-8 text-center animate-scale-in">
          {/* Construction / Shield Lock SVG Icon (64px) */}
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] shadow-inner">
            <svg
              className="w-8 h-8 text-[#0284C7]"
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

          {/* Heading */}
          <h1 className="text-2xl font-extrabold text-[#101828] tracking-tight">
            Coming Soon
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-[#667085] mt-2 mb-6 leading-relaxed">
            This feature is under development. It will be available shortly.
          </p>

          {/* Back to Dashboard Button */}
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0369A1] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            <svg
              className="w-4 h-4"
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
    </DashboardLayout>
  );
}
