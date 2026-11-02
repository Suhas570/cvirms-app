"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getEstablishmentLabel } from "@/lib/establishmentTypes";

export interface MemberEstablishment {
  id: number;
  name: string;
  member_type: string;
  owner_name?: string | null;
  phone?: string | null;
  district?: string | null;
  taluka?: string | null;
  police_station?: string | null;
  city?: string | null;
  address?: string | null;
  is_verified?: boolean | null;
  total_visitors: number;
  created_at?: string | null;
}

interface GeoOption {
  district: string;
  taluka: string;
}

const DEFAULT_DISTRICTS = [
  "All Districts",
  "Bengaluru Urban",
  "Chikkaballapur",
  "Chitradurga",
  "Dakshina Kannada",
  "Mysuru",
  "Tumakuru",
];

const DEFAULT_TALUKAS = [
  "All Talukas",
  "Bengaluru North",
  "Bengaluru South",
  "Gauribidanur",
  "Chitradurga",
  "Yelahanka",
];

const ESTABLISHMENT_TYPES = [
  { value: "all", label: "All Types" },
  { value: "hotel", label: "Hotel" },
  { value: "lodge", label: "Lodge" },
  { value: "pg", label: "PG" },
  { value: "petrol_bunk", label: "Petrol Bunk" },
  { value: "jewellery", label: "Jewellery" },
  { value: "organization", label: "Organization" },
  { value: "housing_society", label: "Housing Society" },
  { value: "scrap_dealer", label: "Scrap Dealer" },
];

function MemberSearchContent() {
  const searchParams = useSearchParams();

  // Navigation tab state: 'geo' or 'user'
  const [activeTab, setActiveTab] = useState<"geo" | "user">("geo");

  // Tab 1: Geo Area Search Controls
  const [selectedDistrict, setSelectedDistrict] = useState<string>("All Districts");
  const [selectedTaluka, setSelectedTaluka] = useState<string>("All Talukas");
  const [geoEstablishmentType, setGeoEstablishmentType] = useState<string>("all");

  // Tab 2: User Search Controls
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [userEstablishmentType, setUserEstablishmentType] = useState<string>("all");

  // Dynamic geo options from backend stations API
  const [dynamicGeoOptions, setDynamicGeoOptions] = useState<GeoOption[]>([]);

  // Results & Loading State
  const [establishments, setEstablishments] = useState<MemberEstablishment[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal State
  const [selectedEstablishment, setSelectedEstablishment] = useState<MemberEstablishment | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedEstablishment(null);
      }
    };
    if (selectedEstablishment) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedEstablishment]);

  // Fetch dynamic geo options from /api/police/stations
  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("cvirms_token") : null;
        if (!token) return;

        const res = await fetch("http://localhost:5000/api/police/stations", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.geoOptions)) {
            setDynamicGeoOptions(data.geoOptions);
          }
        }
      } catch {
        // Silently use defaults if stations call fails
      }
    };

    fetchGeoData();
  }, []);

  // Compute merged distinct districts
  const districtList = useMemo(() => {
    const set = new Set<string>(DEFAULT_DISTRICTS);
    dynamicGeoOptions.forEach((opt) => {
      if (opt.district && opt.district.trim()) {
        set.add(opt.district.trim());
      }
    });
    return Array.from(set);
  }, [dynamicGeoOptions]);

  // Compute merged distinct talukas, filtered by district if selected
  const talukaList = useMemo(() => {
    const set = new Set<string>(DEFAULT_TALUKAS);
    dynamicGeoOptions.forEach((opt) => {
      if (opt.taluka && opt.taluka.trim()) {
        if (
          selectedDistrict === "All Districts" ||
          (opt.district && opt.district.toLowerCase() === selectedDistrict.toLowerCase())
        ) {
          set.add(opt.taluka.trim());
        }
      }
    });
    return Array.from(set);
  }, [dynamicGeoOptions, selectedDistrict]);

  // Main search execution function
  const executeSearch = useCallback(
    async (params: {
      q?: string;
      district?: string;
      taluka?: string;
      type?: string;
    }) => {
      try {
        setLoading(true);
        setError(null);
        setHasSearched(true);

        const token = typeof window !== "undefined" ? localStorage.getItem("cvirms_token") : null;
        if (!token) {
          throw new Error("No authorization token found. Please sign in as a police officer.");
        }

        const queryParams = new URLSearchParams();
        if (params.q && params.q.trim()) {
          queryParams.append("q", params.q.trim());
        }
        if (params.district && params.district !== "All Districts" && params.district !== "all") {
          queryParams.append("district", params.district.trim());
        }
        if (params.taluka && params.taluka !== "All Talukas" && params.taluka !== "all") {
          queryParams.append("taluka", params.taluka.trim());
        }
        if (params.type && params.type !== "all") {
          queryParams.append("type", params.type.trim());
        }

        const url = `http://localhost:5000/api/police/search-establishments?${queryParams.toString()}`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (res.status === 403) {
          throw new Error("Access Denied: Law Enforcement privileges required.");
        }

        const data = await res.json();
        if (data.success && Array.isArray(data.establishments)) {
          setEstablishments(data.establishments);
        } else {
          throw new Error(data.message || "Failed to retrieve member establishments.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error executing member establishment search.";
        setError(msg);
        setEstablishments([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial load trigger on component mount
  useEffect(() => {
    const initialQ = searchParams.get("q") || "";
    const initialDistrict = searchParams.get("district") || "All Districts";
    const initialTaluka = searchParams.get("taluka") || "All Talukas";
    const initialType = searchParams.get("type") || "all";

    if (initialQ) {
      setActiveTab("user");
      setSearchQuery(initialQ);
      setUserEstablishmentType(initialType);
      executeSearch({ q: initialQ, type: initialType });
    } else {
      executeSearch({
        district: initialDistrict,
        taluka: initialTaluka,
        type: initialType,
      });
    }
  }, [searchParams, executeSearch]);

  // Tab 1 Submit Handler (Geo Area)
  const handleGeoSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch({
      district: selectedDistrict,
      taluka: selectedTaluka,
      type: geoEstablishmentType,
    });
  };

  // Tab 1 Reset Handler
  const handleGeoReset = () => {
    setSelectedDistrict("All Districts");
    setSelectedTaluka("All Talukas");
    setGeoEstablishmentType("all");
    executeSearch({
      district: "All Districts",
      taluka: "All Talukas",
      type: "all",
    });
  };

  // Tab 2 Submit Handler (User Search)
  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch({
      q: searchQuery,
      type: userEstablishmentType,
    });
  };

  // Tab 2 Reset Handler
  const handleUserReset = () => {
    setSearchQuery("");
    setUserEstablishmentType("all");
    executeSearch({
      q: "",
      type: "all",
    });
  };

  // Establishment Type Badge Color Mapper
  const renderTypeBadge = (memberType?: string) => {
    const raw = (memberType || "lodge").toLowerCase().replace(/[\s-]+/g, "_");
    let colorClasses = "bg-[#F0F9FF] text-[#0284C7] border-[#BAE6FD]";

    if (raw === "hotel" || raw === "lodge") {
      colorClasses = "bg-indigo-50 text-indigo-700 border-indigo-200";
    } else if (raw === "pg") {
      colorClasses = "bg-blue-50 text-blue-700 border-blue-200";
    } else if (raw === "organization") {
      colorClasses = "bg-purple-50 text-purple-700 border-purple-200";
    } else if (raw === "housing_society") {
      colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (raw === "jewellery") {
      colorClasses = "bg-amber-50 text-amber-800 border-amber-200";
    } else if (raw === "petrol_bunk") {
      colorClasses = "bg-rose-50 text-rose-700 border-rose-200";
    } else if (raw === "scrap_dealer") {
      colorClasses = "bg-slate-100 text-slate-700 border-slate-200";
    }

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border shrink-0 ${colorClasses}`}
      >
        {getEstablishmentLabel(memberType)}
      </span>
    );
  };

  // Establishment Icon Helper
  const renderEstablishmentIcon = (memberType?: string) => {
    const raw = (memberType || "").toLowerCase();

    if (raw.includes("pg") || raw.includes("society") || raw.includes("housing")) {
      return (
        <svg
          className="w-4 h-4 text-[#0284C7]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    }

    if (raw.includes("jewellery")) {
      return (
        <svg
          className="w-4 h-4 text-amber-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="6 3 18 3 22 9 12 22 2 9 6 3" />
          <path d="M12 22V9" />
          <path d="m2 9 10 13" />
          <path d="m22 9-10 13" />
        </svg>
      );
    }

    if (raw.includes("scrap")) {
      return (
        <svg
          className="w-4 h-4 text-slate-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
          <path d="M11 19h8.2a1.8 1.8 0 0 0 1.6-1 1.8 1.8 0 0 0 0-1.8L16.5 9" />
          <path d="M11 5h2a2 2 0 0 1 2 2v1" />
          <path d="m14 16 3 3 3-3" />
        </svg>
      );
    }

    // Default Building / Commercial Icon
    return (
      <svg
        className="w-4 h-4 text-[#0284C7]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01" />
        <path d="M16 6h.01" />
        <path d="M8 10h.01" />
        <path d="M16 10h.01" />
        <path d="M8 14h.01" />
        <path d="M16 14h.01" />
      </svg>
    );
  };

  // Verification Status Badge Helper
  const renderVerificationBadge = (isVerified?: boolean | null) => {
    if (isVerified) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
          <svg
            className="w-3 h-3 text-emerald-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Verified
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Pending Verification
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EAECF0] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#101828]">
              CVIRMS Member Search
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">
              OFFICIAL REGISTRY
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#475467] mt-1">
            Query and verify registered hotels, PGs, corporate hostels, housing societies, and commercial pawn shops across Karnataka.
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

      {/* 2. Navigation Tabs (Clean segmented pill design) */}
      <div className="bg-white p-2 rounded-2xl border border-[#EAECF0] shadow-xs inline-flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("geo")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "geo"
              ? "bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white shadow-xs"
              : "bg-white text-[#475467] hover:text-[#101828] hover:bg-[#F9FAFB]"
          }`}
        >
          {/* Lucide MapPin icon */}
          <svg
            className="w-4 h-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>Search by Geo Area</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("user")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "user"
              ? "bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white shadow-xs"
              : "bg-white text-[#475467] hover:text-[#101828] hover:bg-[#F9FAFB]"
          }`}
        >
          {/* Lucide Building2 icon */}
          <svg
            className="w-4 h-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
            <path d="M6 12H4a2 2 0 0 0-2 2v8h4" />
            <path d="M18 9h2a2 2 0 0 1 2 2v11h-4" />
            <path d="M10 6h4" />
            <path d="M10 10h4" />
            <path d="M10 14h4" />
            <path d="M10 18h4" />
          </svg>
          <span>Search by User</span>
        </button>
      </div>

      {/* 3. Search Controls Card */}
      <div className="bg-white p-5 rounded-2xl border border-[#EAECF0] shadow-xs">
        {/* Tab 1: Geo Area Search Controls */}
        {activeTab === "geo" && (
          <form onSubmit={handleGeoSearch} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* District Dropdown */}
              <div className="md:col-span-4 relative">
                <label className="block text-[11px] font-mono font-semibold text-[#475467] mb-1">
                  District Jurisdiction
                </label>
                <div className="relative">
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full h-11 pl-3.5 pr-8 bg-[#F9FAFB] border border-[#D0D5DD] rounded-xl text-xs font-semibold text-[#101828] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all shadow-xs appearance-none cursor-pointer"
                  >
                    {districtList.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
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
              </div>

              {/* Taluka Dropdown */}
              <div className="md:col-span-3 relative">
                <label className="block text-[11px] font-mono font-semibold text-[#475467] mb-1">
                  Taluka / Sub-Division
                </label>
                <div className="relative">
                  <select
                    value={selectedTaluka}
                    onChange={(e) => setSelectedTaluka(e.target.value)}
                    className="w-full h-11 pl-3.5 pr-8 bg-[#F9FAFB] border border-[#D0D5DD] rounded-xl text-xs font-semibold text-[#101828] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all shadow-xs appearance-none cursor-pointer"
                  >
                    {talukaList.map((tal) => (
                      <option key={tal} value={tal}>
                        {tal}
                      </option>
                    ))}
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
              </div>

              {/* Establishment Type Dropdown */}
              <div className="md:col-span-3 relative">
                <label className="block text-[11px] font-mono font-semibold text-[#475467] mb-1">
                  Establishment Type
                </label>
                <div className="relative">
                  <select
                    value={geoEstablishmentType}
                    onChange={(e) => setGeoEstablishmentType(e.target.value)}
                    className="w-full h-11 pl-3.5 pr-8 bg-[#F9FAFB] border border-[#D0D5DD] rounded-xl text-xs font-semibold text-[#101828] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all shadow-xs appearance-none cursor-pointer"
                  >
                    {ESTABLISHMENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
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
              </div>

              {/* Search & Reset Buttons */}
              <div className="md:col-span-2 flex items-end gap-2 pt-5">
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
                  onClick={handleGeoReset}
                  disabled={loading}
                  title="Reset geo search filters"
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
        )}

        {/* Tab 2: User Search Controls */}
        {activeTab === "user" && (
          <form onSubmit={handleUserSearch} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Text Search Input (h-11 rounded-xl) */}
              <div className="md:col-span-7 relative">
                <label className="block text-[11px] font-mono font-semibold text-[#475467] mb-1">
                  Establishment / Owner Query
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by establishment name, owner name, phone, or User ID..."
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
              </div>

              {/* Establishment Type Dropdown */}
              <div className="md:col-span-3 relative">
                <label className="block text-[11px] font-mono font-semibold text-[#475467] mb-1">
                  Establishment Type
                </label>
                <div className="relative">
                  <select
                    value={userEstablishmentType}
                    onChange={(e) => setUserEstablishmentType(e.target.value)}
                    className="w-full h-11 pl-3.5 pr-8 bg-[#F9FAFB] border border-[#D0D5DD] rounded-xl text-xs font-semibold text-[#101828] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all shadow-xs appearance-none cursor-pointer"
                  >
                    {ESTABLISHMENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
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
              </div>

              {/* Search & Reset Buttons */}
              <div className="md:col-span-2 flex items-end gap-2 pt-5">
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
                  onClick={handleUserReset}
                  disabled={loading}
                  title="Reset user query"
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
        )}
      </div>

      {/* 4. Error Alert */}
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
            className="text-red-600 hover:text-red-800 text-xs font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 5. Results Container / Table / Empty States */}
      <div className="bg-white rounded-[16px] border border-[#EAECF0] shadow-xs overflow-hidden">
        {/* Loading Spinner */}
        {loading && (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-3 border-[#EAECF0] border-t-[#0EA5E9] rounded-full animate-spin mb-4" />
            <p className="font-mono font-bold text-sm text-[#101828]">
              Searching member establishments...
            </p>
            <p className="text-xs text-[#667085] mt-1 font-sans">
              Querying Karnataka State Police Central Registry and cross-referencing accommodation logs...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && hasSearched && establishments !== null && establishments.length === 0 && (
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
              No establishments found matching your search criteria.
            </h3>
            <p className="text-xs text-[#667085] max-w-md mx-auto">
              Try adjusting your district, taluka, establishment type, or search keyword.
            </p>
          </div>
        )}

        {/* Results Data Table */}
        {!loading && establishments !== null && establishments.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#EAECF0] bg-[#F9FAFB] text-[11px] font-mono uppercase tracking-wider text-[#475467]">
                    <th className="py-3 px-5 font-bold">Establishment Name</th>
                    <th className="py-3 px-5 font-bold">Type</th>
                    <th className="py-3 px-5 font-bold">Owner Name</th>
                    <th className="py-3 px-5 font-bold">Contact Number</th>
                    <th className="py-3 px-5 font-bold">District / Taluka</th>
                    <th className="py-3 px-5 font-bold">Police Station</th>
                    <th className="py-3 px-5 font-bold">Total Visitors</th>
                    <th className="py-3 px-5 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAECF0] text-xs">
                  {establishments.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F9FAFB] transition-colors group">
                      {/* Column 1: Establishment Name (with icon, member type badge, verified status) */}
                      <td className="py-4 px-5">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                            {renderEstablishmentIcon(item.member_type)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-[#101828] text-sm group-hover:text-[#0284C7] transition-colors">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              {renderTypeBadge(item.member_type)}
                              {renderVerificationBadge(item.is_verified)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Type (colored badge using getEstablishmentLabel) */}
                      <td className="py-4 px-5">
                        {renderTypeBadge(item.member_type)}
                      </td>

                      {/* Column 3: Owner Name (text-xs font-medium text-[#101828]) */}
                      <td className="py-4 px-5">
                        <span className="text-xs font-medium text-[#101828]">
                          {item.owner_name || "—"}
                        </span>
                      </td>

                      {/* Column 4: Contact Number (font-mono text-xs text-[#344054]) */}
                      <td className="py-4 px-5">
                        <span className="font-mono text-xs text-[#344054]">
                          {item.phone || "—"}
                        </span>
                      </td>

                      {/* Column 5: District / Taluka (text-xs text-[#475467]) */}
                      <td className="py-4 px-5">
                        <span className="text-xs text-[#475467]">
                          {[item.taluka, item.district].filter(Boolean).join(", ") || "—"}
                        </span>
                      </td>

                      {/* Column 6: Police Station (text-xs font-mono font-medium text-[#0284C7]) */}
                      <td className="py-4 px-5">
                        <span className="text-xs font-mono font-medium text-[#0284C7]">
                          {item.police_station || "Unassigned"}
                        </span>
                      </td>

                      {/* Column 7: Total Visitors (font-mono text-xs font-bold text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded-full) */}
                      <td className="py-4 px-5">
                        <span className="font-mono text-xs font-bold text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded-full inline-block">
                          {item.total_visitors || 0}
                        </span>
                      </td>

                      {/* Column 8: Action ("View Details" button opening modal) */}
                      <td className="py-4 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedEstablishment(item)}
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
                Matching Establishments: <strong className="text-[#101828]">{establishments.length}</strong>
              </span>
              <span className="text-[#98A2B3]">CVIRMS Law Enforcement Protocol Verified</span>
            </div>
          </>
        )}
      </div>

      {/* 6. DETAIL MODAL */}
      {selectedEstablishment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#EAECF0] shadow-2xl max-w-2xl w-full p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#EAECF0] mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center shrink-0 text-[#0284C7] shadow-xs">
                  {renderEstablishmentIcon(selectedEstablishment.member_type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-[#101828]">
                      {selectedEstablishment.name}
                    </h3>
                    {renderTypeBadge(selectedEstablishment.member_type)}
                  </div>
                  <p className="text-xs text-[#667085] font-mono mt-0.5">
                    Establishment ID: #EST-{selectedEstablishment.id.toString().padStart(6, "0")}
                  </p>
                </div>
              </div>

              {/* Clean Lucide Close Button */}
              <button
                type="button"
                onClick={() => setSelectedEstablishment(null)}
                className="p-2 rounded-xl text-[#667085] hover:text-[#101828] hover:bg-[#F2F4F7] transition-colors cursor-pointer"
                aria-label="Close modal"
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

            {/* Modal Body: Establishment Profile Details */}
            <div className="space-y-5 text-xs">
              {/* Section 1: Proprietor & Contact Info */}
              <div>
                <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#667085] mb-2.5">
                  Proprietor &amp; Verification Status
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F9FAFB] p-4 rounded-xl border border-[#EAECF0]">
                  <div>
                    <span className="text-[#667085] block mb-0.5">Owner / Proprietor:</span>
                    <span className="font-bold text-[#101828] text-sm">
                      {selectedEstablishment.owner_name || "Not specified"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#667085] block mb-0.5">Contact Phone Number:</span>
                    <span className="font-mono font-bold text-[#0284C7] text-sm">
                      {selectedEstablishment.phone || "Not available"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#667085] block mb-0.5">Member Category:</span>
                    <div className="mt-0.5">
                      {renderTypeBadge(selectedEstablishment.member_type)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#667085] block mb-0.5">Verification Status:</span>
                    <div className="mt-0.5">
                      {renderVerificationBadge(selectedEstablishment.is_verified)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Address & Location Details */}
              <div>
                <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#667085] mb-2.5">
                  Location &amp; Address Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F9FAFB] p-4 rounded-xl border border-[#EAECF0]">
                  <div className="sm:col-span-2">
                    <span className="text-[#667085] block mb-0.5">Full Physical Address:</span>
                    <span className="font-medium text-[#101828]">
                      {selectedEstablishment.address || "No detailed street address recorded"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#667085] block mb-0.5">City / Town:</span>
                    <span className="font-semibold text-[#101828]">
                      {selectedEstablishment.city || "Karnataka"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#667085] block mb-0.5">Taluka / Sub-Division:</span>
                    <span className="font-semibold text-[#101828]">
                      {selectedEstablishment.taluka || "Unassigned"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#667085] block mb-0.5">District:</span>
                    <span className="font-semibold text-[#101828]">
                      {selectedEstablishment.district || "Karnataka"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#667085] block mb-0.5">Police Station Jurisdiction:</span>
                    <span className="font-mono font-bold text-[#0284C7] bg-[#E0F2FE] px-2.5 py-1 rounded-lg border border-[#BAE6FD] inline-block">
                      {selectedEstablishment.police_station || "Karnataka Central PS"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Visitors & Statutory Activity */}
              <div>
                <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#667085] mb-2.5">
                  Statutory Visitor Activity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F9FAFB] p-4 rounded-xl border border-[#EAECF0]">
                  <div>
                    <span className="text-[#667085] block mb-0.5">Total Registered Visitors:</span>
                    <span className="font-mono font-extrabold text-[#0284C7] text-base">
                      {selectedEstablishment.total_visitors || 0} check-ins
                    </span>
                  </div>
                  <div>
                    <span className="text-[#667085] block mb-0.5">Surveillance Link:</span>
                    <Link
                      href={`/police/search/visitors?q=${encodeURIComponent(selectedEstablishment.name)}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0284C7] hover:underline mt-0.5"
                    >
                      <span>View Guest Records</span>
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-[#EAECF0] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedEstablishment(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#344054] bg-[#F9FAFB] hover:bg-[#F2F4F7] border border-[#D0D5DD] transition-all cursor-pointer shadow-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MemberSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <div className="inline-block w-8 h-8 border-3 border-[#EAECF0] border-t-[#0EA5E9] rounded-full animate-spin mb-4" />
          <p className="font-mono font-bold text-xs text-[#667085]">
            Loading CVIRMS Member Search...
          </p>
        </div>
      }
    >
      <MemberSearchContent />
    </Suspense>
  );
}

