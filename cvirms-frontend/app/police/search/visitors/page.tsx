"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getEstablishmentLabel } from "@/lib/establishmentTypes";

export interface VisitorRecord {
  id: number;
  guest_name: string;
  contact_number: string;
  id_proof_type: string;
  id_proof_number: string;
  room_number?: string | null;
  check_in_date?: string | null;
  check_out_date?: string | null;
  status?: string | null;
  vehicle_registration?: string | null;
  vehicle_type?: string | null;
  vehicle_make_model?: string | null;
  hotel_id?: number | null;
  hotel_name?: string | null;
  hotel_type?: string | null;
  district?: string | null;
  taluka?: string | null;
  police_station?: string | null;
}

function VisitorSearchContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const initialIdType = searchParams.get("id_type") || "all";
  const initialVehicle = searchParams.get("vehicle") || "";

  const [query, setQuery] = useState<string>(initialQ);
  const [idType, setIdType] = useState<string>(initialIdType);
  const [vehicle, setVehicle] = useState<string>(initialVehicle);

  const [visitors, setVisitors] = useState<VisitorRecord[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal State
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorRecord | null>(null);

  // Keyboard escape listener for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedVisitor(null);
      }
    };
    if (selectedVisitor) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedVisitor]);

  const executeSearch = useCallback(
    async (searchQuery: string, searchIdType: string, searchVehicle: string) => {
      // Require at least one criteria or proceed if intentionally triggered
      if (!searchQuery.trim() && (!searchIdType || searchIdType === "all") && !searchVehicle.trim()) {
        setError("Please enter a name, contact number, ID number, or select a filter.");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setHasSearched(true);

        const token = typeof window !== "undefined" ? localStorage.getItem("cvirms_token") : null;
        if (!token) {
          throw new Error("No authorization token found. Please sign in as a police officer.");
        }

        const params = new URLSearchParams();
        if (searchQuery.trim()) {
          params.append("q", searchQuery.trim());
        }
        if (searchIdType && searchIdType !== "all") {
          params.append("id_type", searchIdType.trim());
        }
        if (searchVehicle.trim()) {
          params.append("vehicle", searchVehicle.trim());
        }

        const res = await fetch(`http://localhost:5000/api/police/search-visitors?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (res.status === 403) {
          throw new Error("Access Denied: Law Enforcement privileges required.");
        }

        const data = await res.json();
        if (data.success && Array.isArray(data.visitors)) {
          setVisitors(data.visitors);
        } else {
          throw new Error(data.message || "Failed to retrieve visitors from surveillance registry.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error executing surveillance query.";
        setError(msg);
        setVisitors([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Trigger search on mount if URL parameters are passed
  useEffect(() => {
    if (initialQ || (initialIdType && initialIdType !== "all") || initialVehicle) {
      executeSearch(initialQ, initialIdType, initialVehicle);
    }
  }, [initialQ, initialIdType, initialVehicle, executeSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query, idType, vehicle);
  };

  const handleReset = () => {
    setQuery("");
    setIdType("all");
    setVehicle("");
    setVisitors(null);
    setHasSearched(false);
    setError(null);
  };

  // Helper: Initials Avatar
  const getInitials = (name?: string): string => {
    if (!name) return "V";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Helper: Format Date
  const formatDateTime = (dateStr?: string | null): string => {
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
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  // Helper: Status badge
  const renderStatusPill = (rawStatus?: string | null) => {
    const status = (rawStatus || "ACTIVE").toUpperCase().replace(/[- ]/g, "_");

    if (status === "ACTIVE" || status === "CHECKED_IN") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          ACTIVE
        </span>
      );
    }

    if (status === "APPROVED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
          APPROVED
        </span>
      );
    }

    if (status === "CHECKED_OUT") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          CHECKED_OUT
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        {status}
      </span>
    );
  };

  // Helper: ID type badge color
  const renderIdTypeBadge = (type?: string) => {
    const t = (type || "Other").toUpperCase();
    let badgeClass = "bg-blue-50 text-[#0284C7] border-[#BAE6FD]";

    if (t.includes("AADHAAR")) {
      badgeClass = "bg-purple-50 text-purple-700 border-purple-200";
    } else if (t.includes("PASSPORT")) {
      badgeClass = "bg-amber-50 text-amber-800 border-amber-200";
    } else if (t.includes("DRIVING") || t.includes("LICENSE")) {
      badgeClass = "bg-teal-50 text-teal-700 border-teal-200";
    } else if (t.includes("PAN")) {
      badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    return (
      <span
        className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border uppercase shrink-0 ${badgeClass}`}
      >
        {type || "ID"}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EAECF0] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#101828]">
              City Visitor Intelligence Radar
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">
              LIVE SURVEILLANCE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#475467] mt-1">
            Global search across hotel guests, PG tenants, hostel residents, and commercial visitors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/police/dashboard"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#344054] bg-[#F9FAFB] hover:bg-[#F2F4F7] border border-[#D0D5DD] transition-all shadow-xs"
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
            <span>Command Center</span>
          </Link>
        </div>
      </div>

      {/* Search & Query Controls Card */}
      <div className="bg-white p-5 rounded-2xl border border-[#EAECF0] shadow-xs">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* 1. Large Search Input (h-11 rounded-xl) */}
            <div className="md:col-span-5 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search visitor name, contact number, ID proof number, vehicle reg..."
                className="w-full h-11 pl-10 pr-4 bg-[#F9FAFB] border border-[#D0D5DD] rounded-xl text-xs font-medium text-[#101828] placeholder-[#98A2B3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all shadow-xs"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#667085] pointer-events-none">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
            </div>

            {/* 2. ID Proof Type Dropdown (h-11 rounded-xl) */}
            <div className="md:col-span-3 relative">
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="w-full h-11 pl-3.5 pr-8 bg-[#F9FAFB] border border-[#D0D5DD] rounded-xl text-xs font-semibold text-[#101828] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all shadow-xs appearance-none cursor-pointer"
              >
                <option value="all">All ID Types</option>
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="Passport">Passport</option>
                <option value="Voter ID">Voter ID</option>
                <option value="Driving License">Driving License</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Other">Other</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] pointer-events-none">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>

            {/* 3. Quick Vehicle Reg Filter (h-11 rounded-xl) */}
            <div className="md:col-span-2 relative">
              <input
                type="text"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                placeholder="Vehicle Reg (Opt)"
                className="w-full h-11 pl-9 pr-3 bg-[#F9FAFB] border border-[#D0D5DD] rounded-xl text-xs font-mono text-[#101828] placeholder-[#98A2B3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all shadow-xs uppercase"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085] pointer-events-none">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.2 1 12 1 13v3c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
              </div>
            </div>

            {/* 4. Action Buttons (Search & Reset) */}
            <div className="md:col-span-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0369A1] text-white font-semibold rounded-xl px-5 h-11 flex items-center justify-center gap-2 shadow-sm shadow-[#0EA5E9]/20 transition-all cursor-pointer text-xs disabled:opacity-50"
              >
                <svg
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>{loading ? "Searching..." : "Search"}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                title="Reset search filters"
                className="h-11 px-3.5 rounded-xl border border-[#D0D5DD] bg-[#F9FAFB] hover:bg-[#F2F4F7] text-[#475467] hover:text-[#101828] text-xs font-semibold flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
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
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Error Message */}
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
            onClick={() => setError(null)}
            type="button"
            className="text-red-500 hover:text-red-700 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Results Container / Table / Empty States */}
      <div className="bg-white rounded-[16px] border border-[#EAECF0] shadow-xs overflow-hidden">
        {/* State A: Loading State */}
        {loading && (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-3 border-[#EAECF0] border-t-[#0EA5E9] rounded-full animate-spin mb-4" />
            <p className="font-mono font-bold text-sm text-[#101828]">
              Searching city visitor records...
            </p>
            <p className="text-xs text-[#667085] mt-1 font-sans">
              Querying Karnataka State Police Central Registry and cross-referencing accommodation logs...
            </p>
          </div>
        )}

        {/* State B: Initial Prompt State (No search performed yet) */}
        {!loading && !hasSearched && visitors === null && (
          <div className="py-20 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] flex items-center justify-center mx-auto mb-4 shadow-xs">
              <svg
                className="w-7 h-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 className="font-bold text-[#101828] text-base mb-1">
              Enter a name or number to search the city database.
            </h3>
            <p className="text-xs text-[#667085] max-w-md mx-auto">
              Scan through all registered visitors, tenants, and check-ins across Karnataka lodges, PGs, corporate hostels, and residential networks.
            </p>
          </div>
        )}

        {/* State C: Empty Search Results */}
        {!loading && hasSearched && visitors !== null && visitors.length === 0 && (
          <div className="py-20 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 text-[#667085] flex items-center justify-center mx-auto mb-4 shadow-xs">
              <svg
                className="w-7 h-7"
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
            </div>
            <h3 className="font-bold text-[#101828] text-base mb-1">
              No matching visitors found in city surveillance registry.
            </h3>
            <p className="text-xs text-[#667085] max-w-md mx-auto">
              Verify the spelling of the name, contact number format, or ID proof number and try again.
            </p>
          </div>
        )}

        {/* State D: Data Table */}
        {!loading && visitors !== null && visitors.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#EAECF0] bg-[#F9FAFB] text-[11px] font-mono uppercase tracking-wider text-[#475467]">
                    <th className="py-3 px-5 font-bold">Visitor Name</th>
                    <th className="py-3 px-5 font-bold">Contact Number</th>
                    <th className="py-3 px-5 font-bold">ID Proof</th>
                    <th className="py-3 px-5 font-bold">Vehicle Registration</th>
                    <th className="py-3 px-5 font-bold">Establishment / Hotel Name</th>
                    <th className="py-3 px-5 font-bold">Check-in Date</th>
                    <th className="py-3 px-5 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAECF0] text-xs">
                  {visitors.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#F9FAFB] transition-colors group"
                    >
                      {/* 1. Visitor Name (Avatar + Status Pill) */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD] text-[#0369A1] font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-[#BAE6FD] shadow-xs">
                            {getInitials(item.guest_name)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-[#101828] text-sm group-hover:text-[#0284C7] transition-colors">
                              {item.guest_name}
                            </span>
                            <div className="mt-1">
                              {renderStatusPill(item.status)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Contact Number */}
                      <td className="py-4 px-5">
                        <span className="font-mono text-xs text-[#344054]">
                          {item.contact_number || "—"}
                        </span>
                      </td>

                      {/* 3. ID Proof (mono text + badge) */}
                      <td className="py-4 px-5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                          <span className="font-mono text-xs bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[#101828]">
                            {item.id_proof_number || "—"}
                          </span>
                          {renderIdTypeBadge(item.id_proof_type)}
                        </div>
                      </td>

                      {/* 4. Vehicle Registration */}
                      <td className="py-4 px-5">
                        {item.vehicle_registration ? (
                          <div className="flex flex-col">
                            <span className="font-mono text-xs text-[#101828] font-bold">
                              {item.vehicle_registration}
                            </span>
                            {item.vehicle_make_model && (
                              <span className="text-[11px] text-[#667085]">
                                {item.vehicle_make_model}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-[#98A2B3]">-</span>
                        )}
                      </td>

                      {/* 5. Establishment / Hotel Name */}
                      <td className="py-4 px-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-[#101828]">
                            {item.hotel_name || "Unknown Establishment"}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]">
                              {getEstablishmentLabel(item.hotel_type || "lodge")}
                            </span>
                            {item.police_station && (
                              <span className="text-[10px] font-mono text-[#667085] truncate max-w-[120px]">
                                PS: {item.police_station}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 6. Check-in Date */}
                      <td className="py-4 px-5">
                        <span className="font-mono text-xs text-[#475467] whitespace-nowrap">
                          {formatDateTime(item.check_in_date)}
                        </span>
                      </td>

                      {/* 7. Action: View Details */}
                      <td className="py-4 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedVisitor(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#0284C7] bg-[#F0F9FF] hover:bg-[#E0F2FE] border border-[#BAE6FD] transition-colors cursor-pointer shadow-xs"
                        >
                          <svg
                            className="w-3.5 h-3.5"
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
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-4 border-t border-[#EAECF0] bg-[#F9FAFB] flex flex-col sm:flex-row items-center justify-between text-xs text-[#667085] font-mono gap-2">
              <span>
                Matching Surveillance Records: <strong className="text-[#101828]">{visitors.length}</strong>
              </span>
              <span className="text-[#98A2B3]">CVIRMS Law Enforcement Protocol Verified</span>
            </div>
          </>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedVisitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#EAECF0] shadow-2xl max-w-2xl w-full p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#EAECF0] mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD] text-[#0284C7] font-mono font-bold text-sm flex items-center justify-center shrink-0 border border-[#BAE6FD] shadow-xs">
                  {getInitials(selectedVisitor.guest_name)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-[#101828]">
                      {selectedVisitor.guest_name}
                    </h3>
                    {renderStatusPill(selectedVisitor.status)}
                  </div>
                  <p className="text-xs text-[#667085] font-mono mt-0.5">
                    Surveillance Record ID: #VIS-{selectedVisitor.id.toString().padStart(6, "0")}
                  </p>
                </div>
              </div>

              {/* Close Icon Button */}
              <button
                type="button"
                onClick={() => setSelectedVisitor(null)}
                className="p-2 rounded-xl text-[#667085] hover:text-[#101828] hover:bg-[#F2F4F7] transition-colors cursor-pointer"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Content Sections */}
            <div className="space-y-5 text-xs">
              {/* Section 1: Identity & Contact Info */}
              <div>
                <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#667085] mb-2.5">
                  Identity &amp; Contact Records
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F9FAFB] p-4 rounded-xl border border-[#EAECF0]">
                  <div>
                    <span className="text-[#667085] block mb-0.5">Contact Number:</span>
                    <span className="font-mono font-bold text-[#101828] text-sm">
                      {selectedVisitor.contact_number || "Not provided"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#667085] block mb-0.5">ID Proof Type:</span>
                    <span className="font-semibold text-[#101828]">
                      {selectedVisitor.id_proof_type || "N/A"}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[#667085] block mb-0.5">Official ID Number:</span>
                    <span className="font-mono font-bold text-xs bg-white border border-[#D0D5DD] px-3 py-1 rounded-lg text-[#101828] inline-block shadow-xs">
                      {selectedVisitor.id_proof_number || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Accommodation & Stay Details */}
              <div>
                <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#667085] mb-2.5">
                  Stay &amp; Accommodation Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F9FAFB] p-4 rounded-xl border border-[#EAECF0]">
                  <div>
                    <span className="text-[#667085] block mb-0.5">Establishment:</span>
                    <span className="font-bold text-[#101828]">
                      {selectedVisitor.hotel_name || "Unknown Establishment"}
                    </span>
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]">
                        {getEstablishmentLabel(selectedVisitor.hotel_type || "lodge")}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[#667085] block mb-0.5">Assigned Room:</span>
                    <span className="font-mono font-bold text-[#101828] text-sm">
                      {selectedVisitor.room_number ? `Room ${selectedVisitor.room_number}` : "Not Assigned"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#667085] block mb-0.5">Check-in Timestamp:</span>
                    <span className="font-mono text-[#344054]">
                      {formatDateTime(selectedVisitor.check_in_date)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#667085] block mb-0.5">Check-out Timestamp:</span>
                    <span className="font-mono text-[#344054]">
                      {formatDateTime(selectedVisitor.check_out_date)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Police Jurisdiction & Facility Location */}
              <div>
                <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#667085] mb-2.5">
                  Jurisdiction &amp; Establishment Address
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F9FAFB] p-4 rounded-xl border border-[#EAECF0]">
                  <div>
                    <span className="text-[#667085] block mb-0.5">Police Station Jurisdiction:</span>
                    <span className="font-bold text-[#101828]">
                      {selectedVisitor.police_station || "Karnataka Central Police"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#667085] block mb-0.5">Taluka / District:</span>
                    <span className="text-[#101828] font-medium">
                      {[selectedVisitor.taluka, selectedVisitor.district].filter(Boolean).join(", ") || "Karnataka"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 4: Vehicle & Transport Details */}
              <div>
                <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#667085] mb-2.5">
                  Registered Vehicle &amp; Transport
                </h4>
                <div className="bg-[#F9FAFB] p-4 rounded-xl border border-[#EAECF0]">
                  {selectedVisitor.vehicle_registration ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[#667085] block mb-0.5">Vehicle Reg:</span>
                        <span className="font-mono font-bold text-xs bg-white border border-[#D0D5DD] px-2.5 py-1 rounded-lg text-[#101828] inline-block shadow-xs">
                          {selectedVisitor.vehicle_registration}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#667085] block mb-0.5">Vehicle Type:</span>
                        <span className="font-semibold text-[#101828]">
                          {selectedVisitor.vehicle_type || "Motor Vehicle"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#667085] block mb-0.5">Make / Model:</span>
                        <span className="text-[#101828] font-medium">
                          {selectedVisitor.vehicle_make_model || "—"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[#667085] italic font-mono text-[11px]">
                      No motor vehicle declared upon check-in.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-[#EAECF0] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedVisitor(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#344054] bg-[#F9FAFB] hover:bg-[#F2F4F7] border border-[#D0D5DD] transition-all cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VisitorSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <div className="inline-block w-8 h-8 border-3 border-[#EAECF0] border-t-[#0EA5E9] rounded-full animate-spin mb-4" />
          <p className="font-mono font-bold text-xs text-[#667085]">
            Loading City Visitor Intelligence...
          </p>
        </div>
      }
    >
      <VisitorSearchContent />
    </Suspense>
  );
}

