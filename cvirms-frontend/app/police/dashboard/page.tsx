"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface PoliceGlobalStats {
  totalPgs: number;
  totalHotels: number;
  totalOrgs: number;
  totalSocieties: number;
  totalJewellery: number;
  totalVisitors: number;
}

export default function PoliceDashboardPage() {
  const [stats, setStats] = useState<PoliceGlobalStats>({
    totalPgs: 0,
    totalHotels: 0,
    totalOrgs: 0,
    totalSocieties: 0,
    totalJewellery: 0,
    totalVisitors: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const token = typeof window !== "undefined" ? localStorage.getItem("cvirms_token") : null;
      if (!token) {
        throw new Error("No authorization token found. Please sign in.");
      }

      const res = await fetch("http://localhost:5000/api/police/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.status === 403) {
        throw new Error("Access Denied: Law Enforcement privileges required.");
      }

      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      } else {
        throw new Error(data.message || "Failed to load statistics.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load police intelligence feed.";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statCards = [
    {
      title: "Total PGs",
      subtitle: "Paying Guest Accommodations",
      value: stats.totalPgs,
      badge: "Commercial Lodging",
      containerClass:
        "bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg shadow-blue-500/30",
      icon: (
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.293 2.293a1 1 0 0 1 1.414 0l8 8A1 1 0 0 1 20 12h-1v8a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8H3a1 1 0 0 1-.707-1.707l8-8z" />
        </svg>
      ),
    },
    {
      title: "Total Hotels / Lodges",
      subtitle: "Licensed Hotels & Boarding",
      value: stats.totalHotels,
      badge: "Hospitality Network",
      containerClass:
        "bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-lg shadow-purple-500/30",
      icon: (
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4 3a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3zm4 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H8zm6 0a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1zm-6 5a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H8zm6 0a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1h-1zm-4 6a1 1 0 0 0-1 1v3h4v-3a1 1 0 0 0-1-1h-2z"
          />
        </svg>
      ),
    },
    {
      title: "Total Organizations",
      subtitle: "Corporate & Institutional Hostels",
      value: stats.totalOrgs,
      badge: "Enterprise",
      containerClass:
        "bg-gradient-to-br from-pink-400 to-pink-600 text-white shadow-lg shadow-pink-500/30",
      icon: (
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 2a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4V4a2 2 0 0 0-2-2h-4zm0 2h4v2h-4V4zm-6 6h16v3h-4a2 2 0 0 0-2 2h-4a2 2 0 0 0-2-2H4V10z" />
        </svg>
      ),
    },
    {
      title: "Total Jewellery",
      subtitle: "Pawnbrokers & Gold Dealers",
      value: stats.totalJewellery,
      badge: "High Value Retail",
      containerClass:
        "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30",
      icon: (
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="6,3 18,3 22,9 12,22 2,9" />
          <path
            d="M6 3l6 19 6-19M2 9h20M7 9l5 13 5-13"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      ),
    },
    {
      title: "Total Societies",
      subtitle: "Housing & Apartment Complexes",
      value: stats.totalSocieties,
      badge: "Residential",
      containerClass:
        "bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-lg shadow-emerald-500/30",
      icon: (
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a5 5 0 0 1 10 0v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1zm13-8a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm2.5 8a4.5 4.5 0 0 0-4.5-4.5h-.5a6.5 6.5 0 0 1 2 4.5v1h4v-1h-1z" />
        </svg>
      ),
    },
    {
      title: "Total City Visitors (Global)",
      subtitle: "Cross-Establishment Aggregate Check-ins",
      value: stats.totalVisitors,
      badge: "Live Registry",
      containerClass:
        "bg-gradient-to-br from-sky-400 to-cyan-500 text-white shadow-lg shadow-sky-500/30",
      icon: (
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm7.93 9h-3.18a13.6 13.6 0 0 0-1.22-5.18A8.02 8.02 0 0 1 19.93 11zM12 4.07c.88 1.4 1.7 3.7 1.94 6.93H10.06C10.3 7.77 11.12 5.47 12 4.07zM4.07 13h3.18a13.6 13.6 0 0 0 1.22 5.18A8.02 8.02 0 0 1 4.07 13zm3.18-2H4.07a8.02 8.02 0 0 1 4.4-5.18A13.6 13.6 0 0 0 7.25 11zM12 19.93c-.88-1.4-1.7-3.7-1.94-6.93h3.88c-.24 3.23-1.06 5.53-1.94 6.93zm2.47-8.93H9.53a15.5 15.5 0 0 1 0-2h4.94a15.5 15.5 0 0 1 0 2zm.8 7.18A13.6 13.6 0 0 0 16.75 13h3.18a8.02 8.02 0 0 1-4.66 5.18z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#EAECF0] bg-white p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#101828]">
              City-Wide Intelligence Command Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">
              LIVE RADAR
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#475467] mt-1">
            Global monitoring across all licensed establishments, tenant databases, and guest records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/police/establishments"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#101828] bg-white hover:bg-[#F9FAFB] border border-[#D0D5DD] transition-all shadow-xs"
          >
            <svg
              className="w-4 h-4 text-[#667085]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
              <path d="M9 22v-4h6v4" />
            </svg>
            <span>View Directory</span>
          </Link>

          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing || loading}
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0369A1] shadow-sm shadow-[#0EA5E9]/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <svg
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
            <span>{refreshing ? "Syncing..." : "Sync Stats"}</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-xs text-red-700">
          <div className="flex items-center gap-2">
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
            onClick={() => fetchStats()}
            type="button"
            className="px-3 py-1 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Light Theme Bento Grid (6 Cards, 16px radius, Soft Shadows) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="bg-white border border-[#EAECF0] rounded-[16px] p-6 shadow-xs hover:shadow-md transition-all relative overflow-hidden group"
          >
            {/* Top row: Label & Icon */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#667085]">
                {card.title}
              </span>
              <div
                className={`w-12 h-12 rounded-2xl ${card.containerClass} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}
              >
                {card.icon}
              </div>
            </div>

            {/* Metric Value */}
            <div className="flex items-baseline gap-2.5 mb-2">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[#101828] tracking-tight">
                {loading ? "..." : card.value.toLocaleString()}
              </span>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#F2F4F7] text-[#344054]">
                {card.badge}
              </span>
            </div>

            {/* Subtitle */}
            <p className="text-xs text-[#475467] font-medium">
              {card.subtitle}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Navigation Panel */}
      <div className="bg-white border border-[#EAECF0] rounded-[16px] p-6 shadow-xs">
        <h2 className="text-sm font-bold text-[#101828] uppercase tracking-wider font-mono mb-3">
          Surveillance &amp; Enforcement Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <Link
            href="/police/establishments"
            className="p-4 rounded-xl border border-[#EAECF0] bg-[#F9FAFB] hover:bg-[#F0F9FF] hover:border-[#BAE6FD] transition-all flex items-center gap-3 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-[#EAECF0] flex items-center justify-center text-[#0284C7] shadow-xs group-hover:bg-[#E0F2FE]">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
                <path d="M9 22v-4h6v4" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-[#101828]">Establishment Directory</p>
              <p className="text-[#667085] text-[11px]">Inspect all hotels, PGs &amp; dealers</p>
            </div>
          </Link>

          <Link
            href="/police/search/visitors"
            className="p-4 rounded-xl border border-[#EAECF0] bg-[#F9FAFB] hover:bg-[#F0F9FF] hover:border-[#BAE6FD] hover:shadow-xs transition-all flex items-center gap-3 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-[#EAECF0] flex items-center justify-center text-[#0284C7] shadow-xs group-hover:bg-[#E0F2FE]">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-[#101828]">Visitor Search Radar</p>
              <p className="text-[#667085] text-[11px]">Query city guests by name &amp; ID proof</p>
            </div>
          </Link>

          <Link
            href="/police/flags"
            className="p-4 rounded-xl border border-[#EAECF0] bg-[#F9FAFB] hover:bg-[#F0F9FF] hover:border-[#BAE6FD] transition-all flex items-center gap-3 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-[#EAECF0] flex items-center justify-center text-[#0284C7] shadow-xs group-hover:bg-[#E0F2FE]">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" x2="4" y1="22" y2="15" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-[#101828]">Red Flags &amp; Watchlists</p>
              <p className="text-[#667085] text-[11px]">Manage person of interest flags</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
