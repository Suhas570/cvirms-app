"use client";

import React, { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { getEstablishmentLabel } from "@/lib/establishmentTypes";

interface EstablishmentItem {
  id: number;
  name: string;
  member_type: string;
  owner_name?: string;
  phone?: string;
  city?: string;
  district?: string;
  address?: string;
  police_station?: string;
  is_verified?: boolean;
  created_at: string;
  total_visitors: number;
}

function EstablishmentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get("type");

  const [establishments, setEstablishments] = useState<EstablishmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>(typeFilter || "all");
  const [selectedItem, setSelectedItem] = useState<EstablishmentItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEstablishments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = typeof window !== "undefined" ? localStorage.getItem("cvirms_token") : null;
      if (!token) throw new Error("No authorization token found.");

      const queryUrl = typeFilter
        ? `http://localhost:5000/api/police/establishments?type=${encodeURIComponent(typeFilter)}`
        : "http://localhost:5000/api/police/establishments";

      const res = await fetch(queryUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.status === 403) {
        throw new Error("Access Denied: Officer privileges required.");
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.establishments)) {
        setEstablishments(data.establishments);
      } else {
        throw new Error(data.message || "Failed to load directory.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error fetching establishments.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    setSelectedType(typeFilter || "all");
    fetchEstablishments();
  }, [typeFilter, fetchEstablishments]);

  // Unique list of types for filter buttons
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    establishments.forEach((e) => {
      if (e.member_type) types.add(e.member_type);
    });
    return Array.from(types);
  }, [establishments]);

  // Filtered establishments based on search query and type pill
  const filteredList = useMemo(() => {
    return establishments.filter((item) => {
      // Type match (in case backend returned all or filtered list)
      if (selectedType !== "all") {
        if (selectedType === "hotel" || selectedType === "lodge") {
          if (item.member_type !== "hotel" && item.member_type !== "lodge") return false;
        } else if (item.member_type !== selectedType) {
          return false;
        }
      }
      // Search match
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.owner_name && item.owner_name.toLowerCase().includes(q)) ||
        (item.phone && item.phone.includes(q)) ||
        (item.city && item.city.toLowerCase().includes(q)) ||
        (item.district && item.district.toLowerCase().includes(q)) ||
        (item.address && item.address.toLowerCase().includes(q)) ||
        (item.police_station && item.police_station.toLowerCase().includes(q))
      );
    });
  }, [establishments, selectedType, searchQuery]);

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    if (type === "all") {
      router.push("/police/establishments");
    } else {
      router.push(`/police/establishments?type=${type}`);
    }
  };

  const getHeading = () => {
    switch (typeFilter) {
      case "pg":
        return "PG Directory";
      case "hotel":
      case "lodge":
        return "Hotels & Lodges Directory";
      case "organization":
        return "Organizations Directory";
      case "housing_society":
        return "Housing Societies Directory";
      case "scrap_dealer":
        return "Scrap Merchants Directory";
      case "jewellery":
        return "Jewellery Directory";
      default:
        return "Master Establishment Directory";
    }
  };

  // Format date helper
  const formatDate = (isoString?: string) => {
    if (!isoString) return "N/A";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EAECF0] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#101828]">
              {getHeading()}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">
              {filteredList.length} Listed
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#475467] mt-1">
            Official law enforcement registry of all verified lodges, PGs, organizations, and commercial dealers.
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

      {/* Search and Filters Card */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAECF0] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by establishment, owner, phone, city..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F9FAFB] border border-[#D0D5DD] rounded-xl text-xs font-medium text-[#101828] placeholder-[#98A2B3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all shadow-xs"
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
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#101828]"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Type Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <button
              onClick={() => handleTypeSelect("all")}
              type="button"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedType === "all"
                  ? "bg-[#0284C7] text-white shadow-xs"
                  : "bg-[#F2F4F7] text-[#344054] hover:bg-[#E4E7EC]"
              }`}
            >
              All ({establishments.length})
            </button>
            {availableTypes.map((type) => {
              const count = establishments.filter((e) => e.member_type === type).length;
              return (
                <button
                  key={type}
                  onClick={() => handleTypeSelect(type)}
                  type="button"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer capitalize ${
                    selectedType === type
                      ? "bg-[#0284C7] text-white shadow-xs"
                      : "bg-[#F2F4F7] text-[#344054] hover:bg-[#E4E7EC]"
                  }`}
                >
                  {getEstablishmentLabel(type)} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-xs text-red-700">
          <span>{error}</span>
          <button
            onClick={() => fetchEstablishments()}
            className="px-2.5 py-1 bg-red-600 text-white rounded-lg font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Establishments Modern Light Data Table */}
      <div className="bg-white rounded-[16px] border border-[#EAECF0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAECF0] bg-[#F9FAFB] text-[11px] font-mono uppercase tracking-wider text-[#475467]">
                <th className="py-3 px-5 font-bold">Establishment</th>
                <th className="py-3 px-5 font-bold">Owner / Contact</th>
                <th className="py-3 px-5 font-bold">Type</th>
                <th className="py-3 px-5 font-bold">Visitor Count</th>
                <th className="py-3 px-5 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-[#667085]">
                    <div className="inline-block w-6 h-6 border-2 border-[#EAECF0] border-t-[#0EA5E9] rounded-full animate-spin mb-2" />
                    <p className="font-mono text-xs">Querying city establishment registry...</p>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-[#667085]">
                    <svg
                      className="w-10 h-10 text-[#98A2B3] mx-auto mb-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <p className="font-bold text-[#101828] text-sm">No establishments found</p>
                    <p className="text-xs text-[#667085] mt-1">Try refining your search terms or filter selection.</p>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#F9FAFB] transition-colors group"
                  >
                    {/* Establishment Name & Location */}
                    <td className="py-4 px-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#101828] text-sm group-hover:text-[#0284C7] transition-colors">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-[#667085] mt-0.5 line-clamp-1">
                          {item.address || `${item.city || "Bangalore"}, ${item.district || "Karnataka"}`}
                        </span>
                      </div>
                    </td>

                    {/* Owner & Contact */}
                    <td className="py-4 px-5">
                      <div className="flex flex-col font-mono text-[11px]">
                        <span className="font-semibold text-[#101828]">
                          {item.owner_name || "—"}
                        </span>
                        <span className="text-[#667085]">
                          {item.phone || "No phone"}
                        </span>
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]">
                        {getEstablishmentLabel(item.member_type)}
                      </span>
                    </td>

                    {/* Visitor Count Pill */}
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                        </svg>
                        <span>{item.total_visitors} visitors</span>
                      </span>
                    </td>

                    {/* Action View Button */}
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => setSelectedItem(item)}
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#0284C7] bg-[#F0F9FF] hover:bg-[#E0F2FE] border border-[#BAE6FD] transition-colors cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Directory Footer */}
        <div className="p-4 border-t border-[#EAECF0] bg-[#F9FAFB] flex flex-col sm:flex-row items-center justify-between text-xs text-[#667085] font-mono gap-2">
          <span>Showing {filteredList.length} of {establishments.length} licensed facilities</span>
          <span className="text-[#98A2B3]">CVIRMS Automated Police Sync Active</span>
        </div>
      </div>

      {/* Detail Inspection Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#EAECF0] shadow-2xl max-w-lg w-full p-6 relative">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-5 right-5 text-[#98A2B3] hover:text-[#101828] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7]">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
                  <path d="M9 22v-4h6v4" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#101828] leading-tight">
                  {selectedItem.name}
                </h3>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#E0F2FE] text-[#0284C7]">
                  {getEstablishmentLabel(selectedItem.member_type)}
                </span>
              </div>
            </div>

            <div className="space-y-3 border-t border-b border-[#EAECF0] py-4 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#667085]">Establishment ID:</span>
                <span className="font-bold text-[#101828]">EST-{selectedItem.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Proprietor / Owner:</span>
                <span className="font-semibold text-[#101828]">{selectedItem.owner_name || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Contact Phone:</span>
                <span className="font-bold text-[#0284C7]">{selectedItem.phone || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Jurisdiction Police Station:</span>
                <span className="font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                  {selectedItem.police_station || "Central City Station"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">District &amp; City:</span>
                <span className="text-[#101828]">{selectedItem.city || "Bangalore"}, {selectedItem.district || "Karnataka"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Total Registered Visitors:</span>
                <span className="font-bold text-[#0369A1]">{selectedItem.total_visitors} check-ins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Registration Date:</span>
                <span className="text-[#101828]">{formatDate(selectedItem.created_at)}</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-[#F2F4F7] hover:bg-[#E4E7EC] text-[#344054] rounded-xl font-semibold text-xs transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PoliceEstablishmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#EAECF0] border-t-[#0EA5E9] rounded-full animate-spin mb-2" />
          <p className="text-xs font-mono text-[#667085]">Loading directory...</p>
        </div>
      }
    >
      <EstablishmentsContent />
    </Suspense>
  );
}
