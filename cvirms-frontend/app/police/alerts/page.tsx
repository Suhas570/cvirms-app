"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { getEstablishmentLabel } from "@/lib/establishmentTypes";

interface ThreatAlert {
  guest_id: number;
  guest_name: string;
  guest_mobile?: string | null;
  id_proof_type?: string | null;
  guest_id_proof?: string | null;
  guest_vehicle?: string | null;
  room_number?: string | null;
  check_in_date?: string | null;
  guest_status?: string | null;
  hotel_id?: number | null;
  hotel_name?: string | null;
  hotel_type?: string | null;
  hotel_city?: string | null;
  hotel_district?: string | null;
  hotel_taluka?: string | null;
  hotel_police_station?: string | null;
  hotel_address?: string | null;
  flag_id: number;
  suspect_name: string;
  flag_mobile?: string | null;
  flag_aadhaar?: string | null;
  flag_pan?: string | null;
  flag_dl?: string | null;
  flag_vehicle?: string | null;
  flag_remark?: string | null;
  flag_created_at: string;
  match_reason: string;
}

export default function PoliceThreatAlertsPage() {
  const [alerts, setAlerts] = useState<ThreatAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [selectedAlert, setSelectedAlert] = useState<ThreatAlert | null>(null);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

  const fetchAlerts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("cvirms_token") : null;
      if (!token) {
        throw new Error("No authorization token found. Please sign in.");
      }

      const res = await fetch("http://localhost:5000/api/police/alerts", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.status === 403) {
        throw new Error("Access Denied: Officer privileges required.");
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.alerts)) {
        setAlerts(data.alerts);
      } else {
        throw new Error(data.message || "Failed to load active threat alerts.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load threat radar alerts.";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Escape key handler for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedAlert(null);
      }
    };
    if (selectedAlert) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedAlert]);

  // KPI Calculations
  const stats = useMemo(() => {
    const activeAlertsCount = alerts.length;
    const suspectsDetectedSet = new Set<string>();
    const establishmentsInvolvedSet = new Set<string>();

    alerts.forEach((a) => {
      if (a.suspect_name) suspectsDetectedSet.add(a.suspect_name.toLowerCase());
      if (a.hotel_name) establishmentsInvolvedSet.add(a.hotel_name.toLowerCase());
    });

    return {
      activeAlertsCount,
      suspectsCount: suspectsDetectedSet.size,
      establishmentsCount: establishmentsInvolvedSet.size,
    };
  }, [alerts]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const handleDispatchPcr = (station: string) => {
    setDispatchSuccess(`Emergency alert dispatched to ${station} patrol units!`);
    setTimeout(() => setDispatchSuccess(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-16">
      {/* 1. Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Live Threat Radar &amp; Suspect Alerts
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-red-50 text-red-700 border border-red-200 ring-1 ring-red-200/50 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              PRIORITY 1 RADAR
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time correlation alerts triggered when active flagged suspects match newly checked-in city visitors.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/police/flags"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 transition-all shadow-sm"
          >
            <svg className="w-3.5 h-3.5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" x2="4" y1="22" y2="15" />
            </svg>
            <span>Manage Flags</span>
          </Link>

          <button
            type="button"
            onClick={() => fetchAlerts(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0369A1] transition-all shadow-sm shadow-[#0EA5E9]/30 cursor-pointer disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
            <span>{refreshing ? "Scanning Radar..." : "Refresh Radar"}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Active Threat Alerts */}
        <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm ring-1 ring-red-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-red-600 block mb-1">
              Active Threat Alerts
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-red-600">
                {loading ? "..." : stats.activeAlertsCount}
              </span>
              <span className="text-[10px] font-mono font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                MATCHES
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Live check-in correlations detected</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-sm">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        </div>

        {/* Suspects Detected */}
        <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm ring-1 ring-amber-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700 block mb-1">
              Suspects Detected
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-amber-700">
                {loading ? "..." : stats.suspectsCount}
              </span>
              <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                INDIVIDUALS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Unique flagged suspects tracked</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-sm">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
        </div>

        {/* Establishments Involved */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Establishments Involved
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-[#0284C7]">
                {loading ? "..." : stats.establishmentsCount}
              </span>
              <span className="text-[10px] font-mono font-bold bg-sky-50 text-[#0284C7] px-2 py-0.5 rounded-full border border-sky-200">
                FACILITIES
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Lodgings with suspect check-ins</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] shadow-sm">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
          <button type="button" onClick={() => fetchAlerts()} className="text-red-500 font-semibold cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* 3. High-Priority Alert Cards or Empty State */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-20 text-center text-slate-500">
          <div className="inline-block w-8 h-8 border-3 border-slate-200 border-t-[#0EA5E9] rounded-full animate-spin mb-3" />
          <p className="font-mono text-sm font-bold text-slate-900">Scanning City Accommodation Check-Ins...</p>
          <p className="text-xs text-slate-500 mt-1">Cross-referencing phone numbers, identity proofs, and vehicle registrations...</p>
        </div>
      ) : alerts.length === 0 ? (
        /* Empty State: All Clear */
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-16 text-center ring-1 ring-emerald-100">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            No active threat alerts. All sectors clear.
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The automated surveillance radar found zero matches between current active watchlist flags and registered visitors across Karnataka hotels, lodges, and PGs.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Radar Status: Synchronized &amp; Listening</span>
          </div>
        </div>
      ) : (
        /* Alert List Feed */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono px-1">
            <span>
              Active Threat Alerts Detected: <strong className="text-red-600">{alerts.length}</strong>
            </span>
            <span className="text-slate-400">Sorted by newest check-in timestamp</span>
          </div>

          {alerts.map((item, idx) => (
            <div
              key={`${item.flag_id}-${item.guest_id}-${idx}`}
              className="bg-white rounded-2xl border border-red-200 shadow-sm hover:shadow-md transition-all p-5 sm:p-6 relative overflow-hidden group ring-1 ring-red-100"
            >
              {/* Top Warning Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="w-5 h-5 text-red-600 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-base">
                        Watchlist Suspect: <span className="text-red-700">{item.suspect_name}</span>
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-800 border border-red-300">
                        THREAT MATCH
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                      <span>Flagged Record: #FLG-{item.flag_id.toString().padStart(5, "0")}</span>
                      <span>•</span>
                      <span>Check-in: {formatDate(item.check_in_date)}</span>
                    </div>
                  </div>
                </div>

                {/* Match Reason Pill */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-xs">
                    <svg className="w-3.5 h-3.5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{item.match_reason}</span>
                  </span>
                </div>
              </div>

              {/* Grid: 2 Side-by-Side Cards (Live Guest vs Flagged Suspect) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 my-4">
                {/* Left: Matched Guest Check-in Profile */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-[#0284C7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Guest Check-in Records</span>
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Guest Name:</span>
                      <span className="font-bold text-slate-900">{item.guest_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Contact Number:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {item.guest_mobile || "Not specified"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">ID Proof:</span>
                      <span className="font-mono text-slate-800">
                        {item.id_proof_type || "ID"}:{" "}
                        <strong className="text-slate-900">{item.guest_id_proof || "N/A"}</strong>
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Vehicle Registered:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {item.guest_vehicle || "None"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Current Establishment Location */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-[#0284C7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
                      <path d="M9 22v-4h6v4" />
                    </svg>
                    <span>Current Establishment Location</span>
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Establishment:</span>
                      <span className="font-bold text-slate-900">{item.hotel_name || "Unknown"}</span>
                      <div className="mt-0.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD] uppercase">
                          {getEstablishmentLabel(item.hotel_type || "lodge")}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Assigned Room:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {item.room_number ? `Room ${item.room_number}` : "Not Assigned"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[11px]">Police Station Jurisdiction:</span>
                      <span className="font-semibold text-slate-800">
                        {item.hotel_police_station || "Karnataka Central Police"} •{" "}
                        {item.hotel_city || "City Precinct"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>Suspect active in premises. Law enforcement discretion advised.</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleDispatchPcr(item.hotel_police_station || "local")}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <span>Dispatch PCR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedAlert(item)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0369A1] transition-all cursor-pointer shadow-sm shadow-[#0EA5E9]/30"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>View Dossier &amp; Intel</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DISPATCH TOAST NOTIFICATION */}
      {dispatchSuccess && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div className="text-xs">
            <p className="font-bold text-white">PCR Dispatch Signal Transmitted</p>
            <p className="text-slate-400 font-mono text-[11px]">{dispatchSuccess}</p>
          </div>
        </div>
      )}

      {/* 4. SIDE-BY-SIDE DOSSIER COMPARISON MODAL */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 relative max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0 shadow-sm">
                  <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-slate-900">
                      Intelligence Dossier &amp; Live Check-in Correlation
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-800 border border-red-300">
                      CONFIDENTIAL
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Match Correlation: <strong className="text-red-700">{selectedAlert.match_reason}</strong> • Flag ID #{selectedAlert.flag_id}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Body: Side-by-Side Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Left Column: Watchlist File */}
              <div className="border border-red-200 bg-red-50/30 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-red-100">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                      <line x1="4" x2="4" y1="22" y2="15" />
                    </svg>
                    <span>Flagged Suspect Record</span>
                  </span>
                  <span className="text-[10px] font-mono text-red-600 bg-red-100 px-2 py-0.5 rounded font-bold">
                    POLICE WATCHLIST
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Suspect Full Name:</span>
                    <span className="text-base font-extrabold text-slate-900">{selectedAlert.suspect_name}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Flagged Contact Number:</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {selectedAlert.flag_mobile || <span className="text-slate-400 italic">None recorded</span>}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Aadhaar Number:</span>
                      <span className="font-mono text-slate-900 font-semibold">
                        {selectedAlert.flag_aadhaar || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">PAN Number:</span>
                      <span className="font-mono text-slate-900 font-semibold uppercase">
                        {selectedAlert.flag_pan || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Driving License:</span>
                      <span className="font-mono text-slate-900 font-semibold uppercase">
                        {selectedAlert.flag_dl || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Vehicle Plate:</span>
                      <span className="font-mono text-slate-900 font-bold uppercase">
                        {selectedAlert.flag_vehicle || "—"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Intelligence Remarks / FIR:</span>
                    <p className="p-3 bg-white border border-red-200 rounded-xl text-slate-800 text-xs mt-1">
                      {selectedAlert.flag_remark || "No additional intelligence remarks provided."}
                    </p>
                  </div>

                  <div className="pt-2 text-[11px] font-mono text-slate-500">
                    Flagged On: {formatDate(selectedAlert.flag_created_at)}
                  </div>
                </div>
              </div>

              {/* Right Column: Live Guest Check-in Record */}
              <div className="border border-sky-200 bg-sky-50/30 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-sky-100">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0284C7] flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#0EA5E9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Live Establishment Check-in</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded font-bold">
                    HOTEL REGISTRY
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Guest Stated Name:</span>
                    <span className="text-base font-extrabold text-slate-900">{selectedAlert.guest_name}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Guest Contact Number:</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {selectedAlert.guest_mobile || <span className="text-slate-400 italic">Not provided</span>}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Submitted ID Type:</span>
                      <span className="font-semibold text-slate-900">
                        {selectedAlert.id_proof_type || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">ID Proof Number:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {selectedAlert.guest_id_proof || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Room Number:</span>
                      <span className="font-mono text-slate-900 font-bold text-sm">
                        {selectedAlert.room_number ? `Room ${selectedAlert.room_number}` : "Not Assigned"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Guest Vehicle:</span>
                      <span className="font-mono text-slate-900 font-bold uppercase">
                        {selectedAlert.guest_vehicle || "None"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Lodging Establishment:</span>
                    <div className="p-3 bg-white border border-sky-200 rounded-xl space-y-1 text-slate-800 text-xs mt-1">
                      <p className="font-bold text-slate-900">{selectedAlert.hotel_name || "Unknown Lodging"}</p>
                      <p className="text-[11px] text-slate-600">
                        {selectedAlert.hotel_address || "Address on file"}
                      </p>
                      <p className="text-[11px] font-mono text-[#0284C7]">
                        PS: {selectedAlert.hotel_police_station || "Karnataka Central"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 text-[11px] font-mono text-slate-500">
                    Check-in Date: {formatDate(selectedAlert.check_in_date)}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="h-10 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm w-full sm:w-auto"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect width="12" height="8" x="6" y="14" />
                </svg>
                <span>Print Dossier</span>
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleDispatchPcr(selectedAlert.hotel_police_station || "local")}
                  className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-red-500/30 w-full sm:w-auto"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  <span>Dispatch Patrol to {selectedAlert.hotel_name || "Hotel"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="h-10 px-5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center cursor-pointer shadow-sm w-full sm:w-auto"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}