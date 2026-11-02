"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";

interface PoliceFlag {
  id: number;
  suspect_name: string;
  mobile?: string | null;
  aadhaar?: string | null;
  pan?: string | null;
  dl?: string | null;
  vehicle_number?: string | null;
  remark?: string | null;
  status: "ACTIVE" | "CLOSED" | string;
  created_by?: number | null;
  created_at: string;
  officer_name?: string | null;
}

export default function PoliceFlagsListPage() {
  const [flags, setFlags] = useState<PoliceFlag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<number | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "CLOSED">("ALL");

  const fetchFlags = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("cvirms_token") : null;
      if (!token) {
        throw new Error("No authorization token found. Please sign in.");
      }

      const res = await fetch("http://localhost:5000/api/police/flags", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.status === 403) {
        throw new Error("Access Denied: Law Enforcement privileges required.");
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.flags)) {
        setFlags(data.flags);
      } else {
        throw new Error(data.message || "Failed to load suspect flags.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load suspect flags.";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  // Handle closing an active flag
  const handleCloseFlag = async (flagId: number) => {
    if (!window.confirm("Are you sure you want to CLOSE this suspect flag? It will stop triggering radar alerts.")) {
      return;
    }

    try {
      setClosingId(flagId);
      setError(null);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("cvirms_token") : null;
      if (!token) throw new Error("No authorization token found.");

      const res = await fetch(`http://localhost:5000/api/police/flags/${flagId}/close`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to close flag.");
      }

      setFlags((prev) =>
        prev.map((f) => (f.id === flagId ? { ...f, status: "CLOSED" } : f))
      );
      setNotification(`Flag #${flagId} marked as CLOSED.`);
      setTimeout(() => setNotification(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to close flag.";
      setError(msg);
    } finally {
      setClosingId(null);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = flags.length;
    const active = flags.filter((f) => f.status.toUpperCase() === "ACTIVE").length;
    const closed = flags.filter((f) => f.status.toUpperCase() === "CLOSED").length;
    return { total, active, closed };
  }, [flags]);

  // Filtered List
  const filteredFlags = useMemo(() => {
    return flags.filter((f) => {
      // Status filter
      if (statusFilter !== "ALL") {
        if (f.status.toUpperCase() !== statusFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = f.suspect_name?.toLowerCase().includes(q);
        const matchMobile = f.mobile?.toLowerCase().includes(q);
        const matchAadhaar = f.aadhaar?.toLowerCase().includes(q);
        const matchPan = f.pan?.toLowerCase().includes(q);
        const matchDl = f.dl?.toLowerCase().includes(q);
        const matchVehicle = f.vehicle_number?.toLowerCase().includes(q);
        const matchRemark = f.remark?.toLowerCase().includes(q);

        if (
          !matchName &&
          !matchMobile &&
          !matchAadhaar &&
          !matchPan &&
          !matchDl &&
          !matchVehicle &&
          !matchRemark
        ) {
          return false;
        }
      }

      return true;
    });
  }, [flags, statusFilter, searchQuery]);

  // Helper formatting date
  const formatDate = (dateStr: string) => {
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-16">
      {/* 1. Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Suspect Intelligence &amp; Watchlist Flags
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">
              LIVE DIRECTORY
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Active threat watchlist entries cross-correlated against check-in records across all licensed establishments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchFlags(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 text-slate-600 ${refreshing ? "animate-spin" : ""}`}
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
            <span>{refreshing ? "Refreshing..." : "Sync Flags"}</span>
          </button>

          <Link
            href="/police/flags/add"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0369A1] transition-all shadow-sm shadow-[#0EA5E9]/30 cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Issue New Flag</span>
          </Link>
        </div>
      </div>

      {/* 2. Top Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Flags */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Total Watchlist Flags
            </span>
            <span className="text-3xl font-extrabold font-mono text-slate-900">
              {loading ? "..." : stats.total}
            </span>
            <p className="text-xs text-slate-500 mt-1">Total recorded intelligence files</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" x2="4" y1="22" y2="15" />
            </svg>
          </div>
        </div>

        {/* Active Flags */}
        <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm flex items-center justify-between ring-1 ring-red-100">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-red-600 block mb-1">
              Active Threat Flags
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-red-600">
                {loading ? "..." : stats.active}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-50 text-red-700 border border-red-200 ring-1 ring-red-200/50">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                SURVEILLANCE ON
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Live alerts enabled across sectors</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        </div>

        {/* Closed Flags */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Closed / Cleared Flags
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-slate-600">
                {loading ? "..." : stats.closed}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                RESOLVED
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Apprehended or archived suspects</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <span className="font-semibold">{notification}</span>
          </div>
          <button type="button" onClick={() => setNotification(null)} className="text-emerald-700 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="text-red-500 font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Search & Status Filter Controls Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by suspect name, phone, Aadhaar, vehicle..."
            className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all shadow-sm"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 w-full sm:w-auto">
          {(["ALL", "ACTIVE", "CLOSED"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                statusFilter === tab
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab === "ALL" && `All Flags (${stats.total})`}
              {tab === "ACTIVE" && `Active (${stats.active})`}
              {tab === "CLOSED" && `Closed (${stats.closed})`}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                <th className="py-3 px-5 font-bold">Suspect Name &amp; Origin</th>
                <th className="py-3 px-5 font-bold">Registered Identifiers</th>
                <th className="py-3 px-5 font-bold">Intelligence Remarks</th>
                <th className="py-3 px-5 font-bold">Status</th>
                <th className="py-3 px-5 font-bold">Issued Date</th>
                <th className="py-3 px-5 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-500">
                    <div className="inline-block w-7 h-7 border-3 border-slate-200 border-t-[#0EA5E9] rounded-full animate-spin mb-2" />
                    <p className="font-mono text-xs">Loading police watchlist records...</p>
                  </td>
                </tr>
              ) : filteredFlags.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-3">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">No suspect flags found</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {searchQuery
                        ? `No records matching "${searchQuery}". Clear your search query or change filters.`
                        : "No suspect flags currently registered. Issue a new flag using the button above."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredFlags.map((flag) => {
                  const isActive = flag.status.toUpperCase() === "ACTIVE";

                  return (
                    <tr key={flag.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* 1. Suspect Name & Identifiers */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 border ${
                              isActive
                                ? "bg-red-50 text-red-700 border-red-200 shadow-sm"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {flag.suspect_name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm group-hover:text-[#0284C7] transition-colors block">
                              {flag.suspect_name}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mt-0.5">
                              <span>#FLG-{flag.id.toString().padStart(5, "0")}</span>
                              {flag.officer_name && (
                                <>
                                  <span>•</span>
                                  <span>By: {flag.officer_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Matched IDs */}
                      <td className="py-4 px-5">
                        <div className="space-y-1 font-mono text-[11px]">
                          {flag.mobile && (
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">MOB:</span>
                              <span className="font-semibold">{flag.mobile}</span>
                            </div>
                          )}
                          {flag.aadhaar && (
                            <div className="flex items-center gap-1.5 text-purple-700">
                              <span className="text-[10px] font-bold text-purple-400 uppercase">AADHAAR:</span>
                              <span>{flag.aadhaar}</span>
                            </div>
                          )}
                          {flag.pan && (
                            <div className="flex items-center gap-1.5 text-emerald-700">
                              <span className="text-[10px] font-bold text-emerald-400 uppercase">PAN:</span>
                              <span className="uppercase">{flag.pan}</span>
                            </div>
                          )}
                          {flag.dl && (
                            <div className="flex items-center gap-1.5 text-teal-700">
                              <span className="text-[10px] font-bold text-teal-400 uppercase">DL:</span>
                              <span className="uppercase">{flag.dl}</span>
                            </div>
                          )}
                          {flag.vehicle_number && (
                            <div className="flex items-center gap-1.5 text-blue-700">
                              <span className="text-[10px] font-bold text-blue-400 uppercase">VEH:</span>
                              <span className="uppercase font-bold">{flag.vehicle_number}</span>
                            </div>
                          )}
                          {!flag.mobile &&
                            !flag.aadhaar &&
                            !flag.pan &&
                            !flag.dl &&
                            !flag.vehicle_number && (
                              <span className="text-slate-400 italic">No specific ID registered</span>
                            )}
                        </div>
                      </td>

                      {/* 3. Intelligence Remarks */}
                      <td className="py-4 px-5 max-w-xs">
                        <p className="text-slate-600 line-clamp-2 text-xs">
                          {flag.remark || <span className="text-slate-400 italic">None provided</span>}
                        </p>
                      </td>

                      {/* 4. Status Badge */}
                      <td className="py-4 px-5">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-red-50 text-red-700 border border-red-200 ring-1 ring-red-200/50 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            CLOSED
                          </span>
                        )}
                      </td>

                      {/* 5. Issued Date */}
                      <td className="py-4 px-5 font-mono text-slate-500 text-xs whitespace-nowrap">
                        {formatDate(flag.created_at)}
                      </td>

                      {/* 6. Action */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        {isActive ? (
                          <button
                            type="button"
                            onClick={() => handleCloseFlag(flag.id)}
                            disabled={closingId === flag.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                          >
                            {closingId === flag.id ? (
                              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                              </svg>
                            )}
                            <span>Close Flag</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono gap-2">
          <span>
            Total Displayed: <strong className="text-slate-900">{filteredFlags.length}</strong> of{" "}
            {flags.length}
          </span>
          <span className="text-slate-400">CVIRMS Intelligence Radar Protocol v2.4</span>
        </div>
      </div>
    </div>
  );
}