"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getEstablishmentLabel } from "@/lib/establishmentTypes";

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface StationRecord {
  taluka: string;
  police_station: string;
  member_type: string;
  registrations: number;
}

export interface StationGroup {
  groupKey: string;
  taluka: string;
  policeStation: string;
  rows: StationRecord[];
  totalRegistrations: number;
}

export interface OfficerDutyRecord {
  role: string;
  name: string;
  badgeNumber: string;
  phone: string;
  status: "ACTIVE" | "ON DUTY" | "PATROL" | "LEAVE";
}

export interface PoliceStationDetail {
  stationCode: string;
  policeStation: string;
  taluka: string;
  district: string;
  phone: string;
  email: string;
  cctnsId: string;
  jurisdictionStatus: "ACTIVE" | "MAINTENANCE";
  dutyOfficers: OfficerDutyRecord[];
}

export interface SampleMemberRecord {
  id: number;
  name: string;
  member_type: string;
  owner_name: string;
  phone: string;
  address: string;
  is_verified: boolean;
  total_visitors: number;
}

// Default fallback data if backend is starting or offline
const INITIAL_FALLBACK_STATIONS: StationRecord[] = [
  { taluka: "Bengaluru North", police_station: "Vidhana Soudha PS", member_type: "hotel", registrations: 42 },
  { taluka: "Bengaluru North", police_station: "Vidhana Soudha PS", member_type: "lodge", registrations: 18 },
  { taluka: "Bengaluru North", police_station: "Vidhana Soudha PS", member_type: "organization", registrations: 27 },
  { taluka: "Bengaluru North", police_station: "Cubbon Park PS", member_type: "hotel", registrations: 34 },
  { taluka: "Bengaluru North", police_station: "Cubbon Park PS", member_type: "pg", registrations: 29 },
  { taluka: "Bengaluru North", police_station: "Cubbon Park PS", member_type: "jewellery", registrations: 15 },
  { taluka: "Bengaluru South", police_station: "Ashok Nagar PS", member_type: "hotel", registrations: 38 },
  { taluka: "Bengaluru South", police_station: "Ashok Nagar PS", member_type: "pg", registrations: 52 },
  { taluka: "Bengaluru South", police_station: "Ashok Nagar PS", member_type: "petrol_bunk", registrations: 12 },
  { taluka: "Bengaluru South", police_station: "Ashok Nagar PS", member_type: "housing_society", registrations: 45 },
  { taluka: "Yelahanka", police_station: "Yelahanka New Town PS", member_type: "pg", registrations: 63 },
  { taluka: "Yelahanka", police_station: "Yelahanka New Town PS", member_type: "hotel", registrations: 21 },
  { taluka: "Yelahanka", police_station: "Yelahanka New Town PS", member_type: "scrap_dealer", registrations: 9 },
  { taluka: "Gauribidanur", police_station: "Gauribidanur Town PS", member_type: "lodge", registrations: 14 },
  { taluka: "Gauribidanur", police_station: "Gauribidanur Town PS", member_type: "jewellery", registrations: 8 },
  { taluka: "Gauribidanur", police_station: "Gauribidanur Rural PS", member_type: "petrol_bunk", registrations: 11 },
  { taluka: "Gauribidanur", police_station: "Gauribidanur Rural PS", member_type: "scrap_dealer", registrations: 6 },
  { taluka: "Chitradurga", police_station: "Chitradurga Fort PS", member_type: "hotel", registrations: 19 },
  { taluka: "Chitradurga", police_station: "Chitradurga Fort PS", member_type: "lodge", registrations: 24 },
  { taluka: "Chitradurga", police_station: "Chitradurga Fort PS", member_type: "organization", registrations: 13 },
];

const ESTABLISHMENT_TYPES_FILTER = [
  { value: "all", label: "All Categories" },
  { value: "hotel", label: "Hotel" },
  { value: "lodge", label: "Lodge" },
  { value: "pg", label: "PG" },
  { value: "petrol_bunk", label: "Petrol Bunk" },
  { value: "jewellery", label: "Jewellery" },
  { value: "organization", label: "Organization" },
  { value: "housing_society", label: "Housing Society" },
  { value: "scrap_dealer", label: "Scrap Dealer" },
];

// Helper generator for mock duty officers for any station
function generateStationDutyInfo(stationName: string, talukaName: string): PoliceStationDetail {
  const slug = stationName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4);
  const codeNum = Math.abs(stationName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 100)) % 800 + 100;
  const stationCode = `KA-POL-${slug}-${codeNum}`;
  const cctnsId = `CCTNS-2026-${codeNum}`;

  return {
    stationCode,
    policeStation: stationName,
    taluka: talukaName,
    district: talukaName.includes("Bengaluru") ? "Bengaluru Urban" : "Karnataka State Police",
    phone: `+91 80 2294 ${codeNum}`,
    email: `sho.${slug.toLowerCase()}@ksp.gov.in`,
    cctnsId,
    jurisdictionStatus: "ACTIVE",
    dutyOfficers: [
      {
        role: "Station House Officer (SHO)",
        name: "Inspector Kumar",
        badgeNumber: `KP-${codeNum + 10}`,
        phone: "+91 94808 01001",
        status: "ACTIVE",
      },
      {
        role: "Sub-Inspector (Law & Order)",
        name: "SI Ramesh Naik",
        badgeNumber: `KP-${codeNum + 24}`,
        phone: "+91 94808 01002",
        status: "ON DUTY",
      },
      {
        role: "Station Intelligence Officer",
        name: "ASI Lakshmi D.",
        badgeNumber: `KP-${codeNum + 35}`,
        phone: "+91 94808 01003",
        status: "ACTIVE",
      },
      {
        role: "General Duty & CCTNS Operator",
        name: "HC Venkatesh M.",
        badgeNumber: `KP-${codeNum + 49}`,
        phone: "+91 94808 01004",
        status: "PATROL",
      },
    ],
  };
}

// ==========================================
// MAIN COMPONENT
// ==========================================

function PoliceStationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [stations, setStations] = useState<StationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedTaluka, setSelectedTaluka] = useState<string>("All Talukas");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals
  const [loginsModalStation, setLoginsModalStation] = useState<PoliceStationDetail | null>(null);
  const [showDrawerItem, setShowDrawerItem] = useState<{
    taluka: string;
    policeStation: string;
    memberType: string;
    registrations: number;
  } | null>(null);
  const [stationSummaryModal, setStationSummaryModal] = useState<StationGroup | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fetch stations from backend API
  const fetchStations = useCallback(async (isSilent = false) => {
    try {
      if (isSilent) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const token = typeof window !== "undefined" ? localStorage.getItem("cvirms_token") : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("http://localhost:5000/api/police/stations", {
        headers,
      });

      if (res.status === 403) {
        throw new Error("Access Denied: Officer privileges required.");
      }

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.stations) && data.stations.length > 0) {
          setStations(data.stations);
          return;
        }
      }

      // Fallback if backend stations route returned empty or during dev mock
      setStations(INITIAL_FALLBACK_STATIONS);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load police station data.";
      setError(msg);
      // Retain fallback data so the screen remains usable
      setStations(INITIAL_FALLBACK_STATIONS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  // Read URL query params on initial mount
  useEffect(() => {
    const urlTaluka = searchParams.get("taluka");
    const urlType = searchParams.get("type");
    const urlSearch = searchParams.get("search");

    if (urlTaluka) setSelectedTaluka(urlTaluka);
    if (urlType) setSelectedType(urlType);
    if (urlSearch) setSearchQuery(urlSearch);
  }, [searchParams]);

  // Unique Talukas List
  const uniqueTalukas = useMemo(() => {
    const set = new Set<string>();
    stations.forEach((s) => {
      if (s.taluka && s.taluka.trim()) {
        set.add(s.taluka.trim());
      }
    });
    return ["All Talukas", ...Array.from(set).sort()];
  }, [stations]);

  // Grouping logic: Group rows by `taluka + police_station`
  const groupedStations = useMemo(() => {
    // 1. Filter rows
    const filtered = stations.filter((item) => {
      // Taluka filter
      if (
        selectedTaluka !== "All Talukas" &&
        item.taluka.toLowerCase() !== selectedTaluka.toLowerCase()
      ) {
        return false;
      }

      // Member Type filter
      if (selectedType !== "all") {
        if (item.member_type.toLowerCase() !== selectedType.toLowerCase()) {
          return false;
        }
      }

      // Search Query filter (matches station, taluka, or member category)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchStation = item.police_station.toLowerCase().includes(q);
        const matchTaluka = item.taluka.toLowerCase().includes(q);
        const matchType =
          item.member_type.toLowerCase().includes(q) ||
          getEstablishmentLabel(item.member_type).toLowerCase().includes(q);
        if (!matchStation && !matchTaluka && !matchType) return false;
      }

      return true;
    });

    // 2. Group by composite key
    const map = new Map<string, StationGroup>();

    filtered.forEach((row) => {
      const key = `${row.taluka}:::${row.police_station}`;
      if (!map.has(key)) {
        map.set(key, {
          groupKey: key,
          taluka: row.taluka,
          policeStation: row.police_station,
          rows: [],
          totalRegistrations: 0,
        });
      }
      const grp = map.get(key)!;
      grp.rows.push(row);
      grp.totalRegistrations += Number(row.registrations) || 0;
    });

    return Array.from(map.values());
  }, [stations, selectedTaluka, selectedType, searchQuery]);

  // KPI Calculations across current grouped results
  const { totalStationsCount, totalTalukasCount, totalRegistrationsSum } = useMemo(() => {
    const distinctStations = new Set<string>();
    const distinctTalukas = new Set<string>();
    let sum = 0;

    groupedStations.forEach((grp) => {
      distinctStations.add(grp.policeStation);
      distinctTalukas.add(grp.taluka);
      sum += grp.totalRegistrations;
    });

    return {
      totalStationsCount: distinctStations.size,
      totalTalukasCount: distinctTalukas.size,
      totalRegistrationsSum: sum,
    };
  }, [groupedStations]);

  // Grand Total of raw records in system
  const stateGrandTotalSum = useMemo(() => {
    return stations.reduce((acc, curr) => acc + (Number(curr.registrations) || 0), 0);
  }, [stations]);

  // Handlers
  const handleOpenLoginsModal = (stationName: string, talukaName: string) => {
    const detail = generateStationDutyInfo(stationName, talukaName);
    setLoginsModalStation(detail);
  };

  const handleShowEstablishments = (row: StationRecord) => {
    setShowDrawerItem({
      taluka: row.taluka,
      policeStation: row.police_station,
      memberType: row.member_type,
      registrations: Number(row.registrations) || 0,
    });
  };

  const handleShowStationSummary = (group: StationGroup) => {
    setStationSummaryModal(group);
  };

  const handleNavigateToMemberSearch = (taluka: string, type: string) => {
    const params = new URLSearchParams();
    if (taluka && taluka !== "All Talukas") params.append("taluka", taluka);
    if (type && type !== "all") params.append("type", type);
    router.push(`/police/search/members?${params.toString()}`);
  };

  const handleCopyText = (text: string, key: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Badge category color scheme
  const renderMemberTypeBadge = (type: string) => {
    const raw = (type || "").toLowerCase().replace(/[\s-]+/g, "_");
    let color = "bg-[#F0F9FF] text-[#0284C7] border-[#BAE6FD]";

    if (raw === "hotel" || raw === "lodge") {
      color = "bg-indigo-50 text-indigo-700 border-indigo-200";
    } else if (raw === "pg") {
      color = "bg-blue-50 text-blue-700 border-blue-200";
    } else if (raw === "organization") {
      color = "bg-purple-50 text-purple-700 border-purple-200";
    } else if (raw === "housing_society") {
      color = "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (raw === "jewellery") {
      color = "bg-amber-50 text-amber-800 border-amber-200";
    } else if (raw === "petrol_bunk") {
      color = "bg-rose-50 text-rose-700 border-rose-200";
    } else if (raw === "scrap_dealer") {
      color = "bg-slate-100 text-slate-700 border-slate-200";
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${color}`}
      >
        {getEstablishmentLabel(type)}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-16">
      {/* ========================================================
          1. PAGE HEADER (Light Theme Card, 16px Radius)
      ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EAECF0] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#101828]">
              Police Station Jurisdictions &amp; Logins
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">
              LIVE RADAR
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#475467] mt-1">
            Directory of Karnataka law enforcement stations, sub-division talukas, member registrations, and jurisdictional access credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/police/dashboard"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#344054] bg-[#F9FAFB] hover:bg-[#F2F4F7] border border-[#D0D5DD] transition-all shadow-xs"
          >
            {/* Lucide ArrowLeft */}
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

          <button
            type="button"
            onClick={() => fetchStations(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0369A1] transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {/* Lucide RefreshCw */}
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
            <span>{refreshing ? "Syncing..." : "Sync Stations"}</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. KPI SUMMARY METRIC CARDS (Bento Grid)
      ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Police Stations */}
        <div className="bg-white border border-[#EAECF0] rounded-[16px] p-5 shadow-xs relative overflow-hidden group hover:border-[#BAE6FD] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#667085]">
              Police Stations
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] group-hover:scale-105 transition-transform">
              {/* Lucide Shield */}
              <svg className="w-5 h-5 text-[#0284C7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-[#101828]">
              {loading ? "..." : totalStationsCount}
            </span>
            <span className="text-[11px] font-mono font-semibold text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded-full">
              Jurisdictions
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-1 font-medium">
            Active stations in current filtered view
          </p>
        </div>

        {/* Card 2: Total Talukas */}
        <div className="bg-white border border-[#EAECF0] rounded-[16px] p-5 shadow-xs relative overflow-hidden group hover:border-[#BAE6FD] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#667085]">
              Talukas / Sub-Divisions
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
              {/* Lucide MapPin */}
              <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-[#101828]">
              {loading ? "..." : totalTalukasCount}
            </span>
            <span className="text-[11px] font-mono font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              Zones
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-1 font-medium">
            Sub-divisional jurisdictions covered
          </p>
        </div>

        {/* Card 3: Filtered Registrations */}
        <div className="bg-white border border-[#EAECF0] rounded-[16px] p-5 shadow-xs relative overflow-hidden group hover:border-[#BAE6FD] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#667085]">
              Filtered Registrations
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0369A1] group-hover:scale-105 transition-transform">
              {/* Lucide Building2 */}
              <svg className="w-5 h-5 text-[#0369A1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
                <path d="M9 22v-4h6v4" />
                <path d="M8 6h.01" />
                <path d="M16 6h.01" />
                <path d="M8 10h.01" />
                <path d="M16 10h.01" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-[#0284C7]">
              {loading ? "..." : totalRegistrationsSum.toLocaleString()}
            </span>
            <span className="text-[11px] font-mono font-semibold text-[#0369A1] bg-[#BAE6FD]/40 px-2 py-0.5 rounded-full">
              Members
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-1 font-medium">
            Registrations matching active filters
          </p>
        </div>

        {/* Card 4: State Grand Total */}
        <div className="bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] text-white rounded-[16px] p-5 shadow-sm shadow-[#0EA5E9]/20 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-white/90">
              Statewide Aggregate
            </span>
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              {/* Lucide Radio */}
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="2" />
                <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {loading ? "..." : stateGrandTotalSum.toLocaleString()}
            </span>
            <span className="text-[11px] font-mono font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
              Karnataka Total
            </span>
          </div>
          <p className="text-xs text-sky-100 mt-1 font-medium">
            Full state registry across all 31 districts
          </p>
        </div>
      </div>

      {/* ========================================================
          3. FILTER / SEARCH CONTROLS CARD
      ======================================================== */}
      <div className="bg-white p-5 rounded-2xl border border-[#EAECF0] shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Station Text Search Input */}
          <div className="md:col-span-5 relative">
            <label className="block text-[11px] font-mono font-semibold text-[#475467] mb-1">
              Search Police Station or Sub-Division
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search station (e.g. Cubbon Park, Yelahanka)..."
                className="w-full h-11 pl-10 pr-9 bg-[#F9FAFB] border border-[#D0D5DD] rounded-xl text-xs font-medium text-[#101828] placeholder-[#98A2B3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all shadow-xs"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#667085] pointer-events-none">
                {/* Lucide Search */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#101828]"
                >
                  {/* Lucide X */}
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Taluka Dropdown */}
          <div className="md:col-span-4 relative">
            <label className="block text-[11px] font-mono font-semibold text-[#475467] mb-1">
              Taluka Jurisdiction
            </label>
            <div className="relative">
              <select
                value={selectedTaluka}
                onChange={(e) => setSelectedTaluka(e.target.value)}
                className="w-full h-11 pl-3.5 pr-8 bg-[#F9FAFB] border border-[#D0D5DD] rounded-xl text-xs font-semibold text-[#101828] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all shadow-xs appearance-none cursor-pointer"
              >
                {uniqueTalukas.map((tal) => (
                  <option key={tal} value={tal}>
                    {tal}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] pointer-events-none">
                {/* Lucide ChevronDown */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>

          {/* Member Type Dropdown */}
          <div className="md:col-span-3 relative">
            <label className="block text-[11px] font-mono font-semibold text-[#475467] mb-1">
              Category Filter
            </label>
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full h-11 pl-3.5 pr-8 bg-[#F9FAFB] border border-[#D0D5DD] rounded-xl text-xs font-semibold text-[#101828] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all shadow-xs appearance-none cursor-pointer"
              >
                {ESTABLISHMENT_TYPES_FILTER.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] pointer-events-none">
                {/* Lucide ChevronDown */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Reset & Status Line */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-[#667085] pt-2 border-t border-[#EAECF0]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-mono">
              Displaying {groupedStations.length} police station groups ({totalRegistrationsSum.toLocaleString()} registrations)
            </span>
          </div>

          {(selectedTaluka !== "All Talukas" || selectedType !== "all" || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedTaluka("All Talukas");
                setSelectedType("all");
                setSearchQuery("");
              }}
              className="mt-2 sm:mt-0 text-[#0284C7] hover:text-[#0369A1] font-semibold text-xs flex items-center gap-1 cursor-pointer"
            >
              {/* Lucide RotateCcw */}
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>Reset Active Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          4. ERROR ALERT (If API issues)
      ======================================================== */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center gap-2.5">
            {/* Lucide AlertTriangle */}
            <svg className="w-4 h-4 text-amber-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>
              {error} - Active offline cache / standard Karnataka precinct roster loaded.
            </span>
          </div>
          <button
            type="button"
            onClick={() => fetchStations()}
            className="px-2.5 py-1 bg-amber-700 text-white rounded-lg font-semibold hover:bg-amber-800 transition-colors"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* ========================================================
          5. STATIONS DATA TABLE WITH GROUPING & STATION TOTALS
      ======================================================== */}
      <div className="bg-white rounded-[16px] border border-[#EAECF0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAECF0] bg-[#F9FAFB] text-[11px] font-mono uppercase tracking-wider text-[#475467]">
                <th className="py-3 px-5 font-bold">Taluka</th>
                <th className="py-3 px-5 font-bold">Police Station</th>
                <th className="py-3 px-5 font-bold">Member Type</th>
                <th className="py-3 px-5 font-bold">Registrations</th>
                <th className="py-3 px-5 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-[#667085]">
                    <div className="inline-block w-7 h-7 border-3 border-[#EAECF0] border-t-[#0EA5E9] rounded-full animate-spin mb-2" />
                    <p className="font-mono text-xs">Querying Karnataka Police Station Register...</p>
                  </td>
                </tr>
              ) : groupedStations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-[#667085]">
                    {/* Lucide ShieldAlert */}
                    <svg
                      className="w-10 h-10 text-[#98A2B3] mx-auto mb-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="font-bold text-[#101828] text-sm">No station records matched</p>
                    <p className="text-xs text-[#667085] mt-1">Try resetting taluka or category filters.</p>
                  </td>
                </tr>
              ) : (
                groupedStations.map((group) => (
                  <React.Fragment key={group.groupKey}>
                    {/* Individual category rows for this police station */}
                    {group.rows.map((row, idx) => (
                      <tr
                        key={`${group.groupKey}-${row.member_type}-${idx}`}
                        className="hover:bg-[#F9FAFB] transition-colors"
                      >
                        {/* 1. Taluka */}
                        <td className="py-3.5 px-5 font-semibold text-[#101828] text-xs">
                          {row.taluka}
                        </td>

                        {/* 2. Police Station */}
                        <td className="py-3.5 px-5">
                          <span className="font-medium text-[#0284C7] flex items-center gap-1.5">
                            {/* Lucide Shield */}
                            <svg
                              className="w-3.5 h-3.5 text-[#0EA5E9] shrink-0"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <span>{row.police_station}</span>
                          </span>
                        </td>

                        {/* 3. Member Type Badge */}
                        <td className="py-3.5 px-5">
                          {renderMemberTypeBadge(row.member_type)}
                        </td>

                        {/* 4. Registrations Count */}
                        <td className="py-3.5 px-5 font-mono font-bold text-[#101828] text-xs">
                          {(Number(row.registrations) || 0).toLocaleString()}
                        </td>

                        {/* 5. Action Buttons */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="inline-flex items-center gap-2">
                            {/* Show Button (Primary Sky Blue) */}
                            <button
                              type="button"
                              onClick={() => handleShowEstablishments(row)}
                              className="bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0369A1] text-white px-3 py-1 rounded-xl font-semibold text-xs shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                            >
                              {/* Lucide Eye */}
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              <span>Show</span>
                            </button>

                            {/* Police Logins List Button (Ghost) */}
                            <button
                              type="button"
                              onClick={() => handleOpenLoginsModal(row.police_station, row.taluka)}
                              className="bg-transparent hover:bg-slate-100 text-[#475467] border border-[#D0D5DD] px-3 py-1 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              {/* Lucide KeyRound */}
                              <svg className="w-3 h-3 text-[#667085]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" />
                                <circle cx="16.5" cy="7.5" r=".5" />
                              </svg>
                              <span>Police Logins List</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* ========================================================
                        STATION GROUP TOTAL ROW (Strict Requirement)
                        Styling: bg-[#F0F9FF]/90 font-bold border-y border-[#BAE6FD] text-[#0369A1]
                    ======================================================== */}
                    <tr
                      key={`total-${group.groupKey}`}
                      className="bg-[#F0F9FF]/90 font-bold border-y border-[#BAE6FD] text-[#0369A1] transition-colors"
                    >
                      {/* Taluka */}
                      <td className="py-3 px-5 text-xs font-bold text-[#0369A1]">
                        {group.taluka}
                      </td>

                      {/* Station Name Total */}
                      <td className="py-3 px-5 text-xs font-bold text-[#0369A1]">
                        <div className="flex items-center gap-1.5">
                          {/* Lucide ShieldCheck */}
                          <svg
                            className="w-4 h-4 text-[#0284C7] shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="m9 12 2 2 4-4" />
                          </svg>
                          <span>TOTAL - {group.policeStation}</span>
                        </div>
                      </td>

                      {/* Member Type Label */}
                      <td className="py-3 px-5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#0284C7]/10 text-[#0284C7] border border-[#BAE6FD]">
                          All Categories ({group.rows.length})
                        </span>
                      </td>

                      {/* Sum of Registrations */}
                      <td className="py-3 px-5 font-mono font-extrabold text-[#0369A1] text-xs">
                        {group.totalRegistrations.toLocaleString()}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleShowStationSummary(group)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0369A1] border border-[#BAE6FD] transition-colors cursor-pointer"
                          >
                            {/* Lucide Layers */}
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="12 2 2 7 12 12 22 7 12 2" />
                              <polyline points="2 17 12 22 22 17" />
                              <polyline points="2 12 12 17 22 12" />
                            </svg>
                            <span>Station Summary</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenLoginsModal(group.policeStation, group.taluka)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-[#344054] border border-[#D0D5DD] transition-colors cursor-pointer shadow-2xs"
                          >
                            {/* Lucide Users */}
                            <svg className="w-3.5 h-3.5 text-[#667085]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <span>Duty Roster</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))
              )}
            </tbody>

            {/* ========================================================
                GRAND TOTAL ROW (Bottom of Table across Karnataka)
            ======================================================== */}
            {groupedStations.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100/90 font-bold border-t-2 border-[#D0D5DD] text-[#101828]">
                  <td className="py-4 px-5 text-xs font-bold text-[#101828] uppercase tracking-wider">
                    Karnataka State
                  </td>
                  <td className="py-4 px-5 text-xs font-extrabold text-[#101828]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span>STATE GRAND TOTAL ({totalStationsCount} Stations)</span>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-slate-200 text-[#344054] border border-[#D0D5DD]">
                      All Member Types
                    </span>
                  </td>
                  <td className="py-4 px-5 font-mono font-extrabold text-[#101828] text-sm">
                    {totalRegistrationsSum.toLocaleString()}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <button
                      type="button"
                      onClick={() => handleNavigateToMemberSearch("All Talukas", "all")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-[#0284C7] border border-[#BAE6FD] transition-colors shadow-2xs cursor-pointer"
                    >
                      {/* Lucide ExternalLink */}
                      <svg className="w-3.5 h-3.5 text-[#0284C7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      <span>Explore Karnataka Registry</span>
                    </button>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Directory Footer Info */}
        <div className="p-4 border-t border-[#EAECF0] bg-[#F9FAFB] flex flex-col sm:flex-row items-center justify-between text-xs text-[#667085] font-mono gap-2">
          <span>Karnataka State Police • City Visitor &amp; Incident Records Management System</span>
          <span className="text-[#98A2B3]">Data source: /api/police/stations (Live Secure Sync)</span>
        </div>
      </div>

      {/* ========================================================
          6. MODAL: POLICE LOGINS LIST & JURISDICTION CREDENTIALS
      ======================================================== */}
      {loginsModalStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#EAECF0] shadow-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setLoginsModalStation(null)}
              className="absolute top-5 right-5 text-[#98A2B3] hover:text-[#101828] transition-colors"
            >
              {/* Lucide X */}
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-[#EAECF0]">
              <div className="w-12 h-12 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] shrink-0">
                {/* Lucide ShieldCheck */}
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div className="flex-1 pr-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#101828]">
                    {loginsModalStation.policeStation}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    JURISDICTION ACTIVE
                  </span>
                </div>
                <p className="text-xs text-[#667085] mt-0.5">
                  Sub-Division: <span className="font-semibold text-[#101828]">{loginsModalStation.taluka}</span> • {loginsModalStation.district}
                </p>
              </div>
            </div>

            {/* Station Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-[#F9FAFB] border border-[#EAECF0] text-xs font-mono mb-5">
              <div>
                <p className="text-[10px] text-[#98A2B3] uppercase">Station Code</p>
                <p className="font-bold text-[#101828]">{loginsModalStation.stationCode}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#98A2B3] uppercase">CCTNS ID</p>
                <p className="font-bold text-[#0284C7]">{loginsModalStation.cctnsId}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#98A2B3] uppercase">Control Desk</p>
                <p className="font-bold text-[#101828]">{loginsModalStation.phone}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#98A2B3] uppercase">Official Email</p>
                <p className="font-bold text-[#101828] truncate">{loginsModalStation.email}</p>
              </div>
            </div>

            {/* Duty Officers Roster */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#475467]">
                  Jurisdictional Duty Officers &amp; Login Authority
                </h4>
                <span className="text-[11px] font-mono text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded-md">
                  Level-1 Police Auth
                </span>
              </div>

              <div className="divide-y divide-[#EAECF0] border border-[#EAECF0] rounded-xl overflow-hidden bg-white text-xs">
                {loginsModalStation.dutyOfficers.map((officer, i) => (
                  <div key={i} className="p-3.5 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center font-mono font-bold text-xs text-[#0284C7]">
                        {officer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#101828]">{officer.name}</p>
                          <span className="text-[10px] font-mono text-[#667085] bg-[#F2F4F7] px-1.5 py-0.5 rounded">
                            {officer.badgeNumber}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#667085] mt-0.5">{officer.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-[#475467]">{officer.phone}</span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                          officer.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : officer.status === "ON DUTY"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {officer.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-[#EAECF0] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyText(loginsModalStation.stationCode, "stnCode")}
                  className="px-3 py-1.5 rounded-xl border border-[#D0D5DD] text-xs font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {/* Lucide Copy */}
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                  <span>{copiedKey === "stnCode" ? "Copied!" : "Copy Station Code"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyText(loginsModalStation.email, "email")}
                  className="px-3 py-1.5 rounded-xl border border-[#D0D5DD] text-xs font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {/* Lucide Mail */}
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span>{copiedKey === "email" ? "Copied!" : "Copy Email"}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLoginsModalStation(null)}
                  className="px-4 py-2 bg-[#F2F4F7] hover:bg-[#E4E7EC] text-[#344054] rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          7. MODAL / DRAWER: SHOW ESTABLISHMENTS UNDER JURISDICTION
      ======================================================== */}
      {showDrawerItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#EAECF0] shadow-2xl max-w-xl w-full p-6 relative">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowDrawerItem(null)}
              className="absolute top-5 right-5 text-[#98A2B3] hover:text-[#101828] transition-colors"
            >
              {/* Lucide X */}
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] shrink-0">
                {/* Lucide Building */}
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
                  <path d="M9 22v-4h6v4" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#101828]">
                  {showDrawerItem.policeStation}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[#667085] font-medium">
                    Taluka: <span className="text-[#101828] font-semibold">{showDrawerItem.taluka}</span>
                  </span>
                  <span>•</span>
                  {renderMemberTypeBadge(showDrawerItem.memberType)}
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-b border-[#EAECF0] py-4 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-[#667085]">Jurisdiction Station:</span>
                <span className="font-bold text-[#0284C7]">{showDrawerItem.policeStation}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#667085]">Category Class:</span>
                <span className="font-bold text-[#101828] uppercase">{getEstablishmentLabel(showDrawerItem.memberType)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#667085]">Active Registered Units:</span>
                <span className="font-extrabold text-[#0369A1] text-sm bg-[#E0F2FE] px-2.5 py-0.5 rounded-lg border border-[#BAE6FD]">
                  {showDrawerItem.registrations} Licensed Facilities
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#667085]">Law Enforcement Sync:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Karnataka CCTNS Verified
                </span>
              </div>
            </div>

            {/* Descriptive Preview */}
            <div className="my-4 p-3 rounded-xl bg-[#F9FAFB] border border-[#EAECF0] text-xs text-[#475467]">
              <p className="font-semibold text-[#101828] mb-1">
                Sub-Division Inspection Notice:
              </p>
              <p className="leading-relaxed">
                All {showDrawerItem.registrations} registered {getEstablishmentLabel(showDrawerItem.memberType)} facilities under {showDrawerItem.policeStation} jurisdiction report tenant/guest records directly to the police server. Click below to inspect comprehensive member accounts.
              </p>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDrawerItem(null);
                  handleNavigateToMemberSearch(showDrawerItem.taluka, showDrawerItem.memberType);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0369A1] text-white rounded-xl font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {/* Lucide Search */}
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>Open in CVIRMS Member Search</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDrawerItem(null)}
                className="w-full sm:w-auto px-4 py-2 bg-[#F2F4F7] hover:bg-[#E4E7EC] text-[#344054] rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          8. MODAL: STATION GROUP SUMMARY DIALOG
      ======================================================== */}
      {stationSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#EAECF0] shadow-2xl max-w-lg w-full p-6 relative">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setStationSummaryModal(null)}
              className="absolute top-5 right-5 text-[#98A2B3] hover:text-[#101828] transition-colors"
            >
              {/* Lucide X */}
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] shrink-0">
                {/* Lucide Layers */}
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#101828]">
                  TOTAL - {stationSummaryModal.policeStation}
                </h3>
                <p className="text-xs text-[#667085]">
                  Jurisdiction Taluka: <span className="font-semibold text-[#101828]">{stationSummaryModal.taluka}</span>
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] text-xs font-mono mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[#0369A1] font-semibold">Total Category Rows:</span>
                <span className="font-bold text-[#101828]">{stationSummaryModal.rows.length} categories</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#0369A1] font-bold">Sum of Registrations:</span>
                <span className="font-mono font-extrabold text-[#0284C7] text-base">
                  {stationSummaryModal.totalRegistrations.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="space-y-2 mb-5">
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#98A2B3]">
                Category Distribution
              </p>
              <div className="divide-y divide-[#EAECF0] border border-[#EAECF0] rounded-xl overflow-hidden text-xs">
                {stationSummaryModal.rows.map((row, i) => (
                  <div key={i} className="p-2.5 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                      {renderMemberTypeBadge(row.member_type)}
                    </div>
                    <span className="font-mono font-bold text-[#101828]">
                      {(Number(row.registrations) || 0).toLocaleString()} registered
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setStationSummaryModal(null)}
                className="px-4 py-2 bg-[#F2F4F7] hover:bg-[#E4E7EC] text-[#344054] rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// SUSPENSE WRAPPER (App Router requirement)
// ==========================================

export default function PoliceStationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex flex-col items-center justify-center bg-[#F7F8FA]">
          <div className="w-8 h-8 border-3 border-[#EAECF0] border-t-[#0EA5E9] rounded-full animate-spin mb-3" />
          <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#667085]">
            Loading Karnataka Police Stations...
          </p>
        </div>
      }
    >
      <PoliceStationsContent />
    </Suspense>
  );
}