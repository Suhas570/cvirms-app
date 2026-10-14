"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";

interface Foreigner {
  id: number;
  user_id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  country: string;
  mobile_number: string;
  address: string;
  city: string;
  state?: string | null;
  zip_code?: string | null;
  indian_contact?: string | null;
  passport_number?: string | null;
  passport_details?: string | null;
  visa_number: string;
  valid_from: string;
  valid_upto: string;
  purpose_of_visit: string;
  coming_from?: string | null;
  going_to?: string | null;
  photo_url?: string | null;
  passport_photo_url?: string | null;
  c_form_url?: string | null;
  created_at: string;
}

export default function ForeignerListPage() {
  const [foreigners, setForeigners] = useState<Foreigner[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const fetchForeigners = async (search = "") => {
    try {
      setLoading(true);
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("cvirms_token")
          : null;

      const url = search
        ? `http://localhost:5000/api/foreigners?search=${encodeURIComponent(
            search
          )}`
        : "http://localhost:5000/api/foreigners";

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setForeigners(data.foreigners || []);
      }
    } catch (err) {
      console.warn("Failed to fetch foreigners:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForeigners(searchQuery);
  }, [searchQuery]);

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    const f = firstName ? firstName[0] : "F";
    const l = lastName ? lastName[0] : "";
    return `${f}${l}`.toUpperCase();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "—";
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const handleExportCSV = () => {
    if (foreigners.length === 0) return;

    const headers = [
      "ID",
      "Full Name",
      "Country",
      "Mobile Number",
      "Indian Contact",
      "Address",
      "City",
      "Passport Number",
      "Visa Number",
      "Valid From",
      "Valid Up To",
      "Purpose",
      "Coming From",
      "Going To",
      "Registered Date",
      "Status",
    ];

    const rows = foreigners.map((f) => {
      const fullName = [f.first_name, f.middle_name, f.last_name]
        .filter(Boolean)
        .join(" ");
      return [
        f.id,
        `"${fullName.replace(/"/g, '""')}"`,
        `"${f.country}"`,
        `"${f.mobile_number}"`,
        `"${f.indian_contact || ""}"`,
        `"${f.address.replace(/"/g, '""')}"`,
        `"${f.city}"`,
        `"${f.passport_number || f.passport_details || ""}"`,
        `"${f.visa_number}"`,
        `"${formatDate(f.valid_from)}"`,
        `"${formatDate(f.valid_upto)}"`,
        `"${(f.purpose_of_visit || "").replace(/"/g, '""')}"`,
        `"${(f.coming_from || "").replace(/"/g, '""')}"`,
        `"${(f.going_to || "").replace(/"/g, '""')}"`,
        `"${formatDate(f.created_at)}"`,
        `"Active"`,
      ].join(",");
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `cvirms_foreigners_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fadeIn pb-12">
        {/* Page Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#101828] tracking-tight">
              Foreigner List
            </h1>
            <p className="text-xs text-[#667085] mt-1 font-medium">
              Registered foreign nationals and their C-Form records
            </p>
          </div>

          <Link
            href="/dashboard/add-foreigner"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0369A1] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 self-start sm:self-auto"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Foreigner</span>
          </Link>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-2xl border border-[#EAECF0] shadow-sm overflow-hidden">
          {/* Card Header & Search Bar */}
          <div className="p-5 border-b border-[#EAECF0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#101828]">
                All Foreigners
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-[#F2F4F7] text-[#344054] rounded-full border border-[#EAECF0]">
                {foreigners.length.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Search Bar */}
              <div className="relative w-full sm:w-[260px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#98A2B3]">
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" x2="16.65" y1="21" y2="16.65" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, country, passport..."
                  className="w-full h-8 pl-8 pr-3 text-xs bg-[#F7F8FA] border border-[#EAECF0] rounded-lg text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9] transition-all"
                />
              </div>

              {/* Export CSV Ghost Button */}
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={foreigners.length === 0}
                className="h-8 px-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#344054] hover:bg-[#F7F8FA] border border-[#D0D5DD] rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none shrink-0"
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
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Table / Loading / Empty State */}
          {loading ? (
            <div className="p-12 text-center text-xs text-[#667085] flex items-center justify-center gap-2">
              <svg
                className="w-4 h-4 animate-spin text-[#0284C7]"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              <span>Loading foreigner records...</span>
            </div>
          ) : foreigners.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-[#EAECF0] text-[11px] font-bold text-[#667085] uppercase tracking-wider">
                    <th className="py-3 px-4 w-10 text-center"> </th>
                    <th className="py-3 px-4">Foreigner</th>
                    <th className="py-3 px-4">Country</th>
                    <th className="py-3 px-4">Passport</th>
                    <th className="py-3 px-4">Check-in</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAECF0] text-xs">
                  {foreigners.map((foreigner) => {
                    const isExpanded = expandedRows.has(foreigner.id);
                    const fullName = [
                      foreigner.first_name,
                      foreigner.middle_name,
                      foreigner.last_name,
                    ]
                      .filter(Boolean)
                      .join(" ");

                    const passport =
                      foreigner.passport_number ||
                      foreigner.passport_details ||
                      "—";

                    return (
                      <React.Fragment key={foreigner.id}>
                        {/* Summary Clickable Row */}
                        <tr
                          onClick={() => toggleRow(foreigner.id)}
                          className="hover:bg-sky-50/40 cursor-pointer transition-colors group"
                        >
                          {/* Chevron Icon */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-block transition-transform duration-200 text-[#98A2B3] group-hover:text-[#0284C7] ${
                                isExpanded ? "rotate-90 text-[#0284C7]" : ""
                              }`}
                            >
                              ▶
                            </span>
                          </td>

                          {/* Foreigner Avatar & Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0284C7] to-[#0EA5E9] flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-xs">
                                {getInitials(
                                  foreigner.first_name,
                                  foreigner.last_name
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-[#101828] text-[13px] leading-tight">
                                  {fullName}
                                </p>
                                <p className="text-[11px] font-mono text-[#667085]">
                                  Visa: {foreigner.visa_number}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Country (Plain Text, NO flag emojis) */}
                          <td className="py-3.5 px-4 font-semibold text-xs text-[#344054]">
                            {foreigner.country}
                          </td>

                          {/* Passport Number */}
                          <td className="py-3.5 px-4 font-mono text-xs text-[#667085]">
                            {passport}
                          </td>

                          {/* Check-in Date (Indian style: 13 May 2026) */}
                          <td className="py-3.5 px-4 font-mono text-xs text-[#667085]">
                            {formatDate(foreigner.created_at)}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6]">
                              Active
                            </span>
                          </td>
                        </tr>

                        {/* EXPANDABLE ROW */}
                        <tr
                          className={`bg-[#F8FAFC] transition-all duration-300 ease-in-out ${
                            isExpanded ? "" : "hidden"
                          }`}
                        >
                          <td colSpan={6} className="p-0 border-b border-[#EAECF0]">
                            <div className="p-5 border-l-4 border-[#0EA5E9] bg-white m-3 rounded-xl shadow-xs space-y-4">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0284C7] flex items-center gap-2">
                                <svg
                                  className="w-3.5 h-3.5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="12" y1="16" x2="12" y2="12" />
                                  <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                                Full C-Form Compliance Details
                              </h4>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#EAECF0]">
                                  <span className="text-[#667085] text-[11px] block">
                                    Home Country Address
                                  </span>
                                  <span className="font-semibold text-[#101828] mt-0.5 block leading-relaxed">
                                    {foreigner.address}, {foreigner.city}
                                  </span>
                                  <span className="text-[10px] text-[#667085] mt-1 block font-mono">
                                    {foreigner.state || "State N/A"} •{" "}
                                    {foreigner.zip_code || "ZIP N/A"}
                                  </span>
                                </div>

                                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#EAECF0]">
                                  <span className="text-[#667085] text-[11px] block">
                                    Contact Details
                                  </span>
                                  <span className="font-semibold text-[#101828] mt-0.5 block font-mono">
                                    Mobile: {foreigner.mobile_number}
                                  </span>
                                  <span className="text-[#667085] text-xs mt-1 block font-mono">
                                    Indian Contact:{" "}
                                    {foreigner.indian_contact || "None"}
                                  </span>
                                </div>

                                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#EAECF0]">
                                  <span className="text-[#667085] text-[11px] block">
                                    Visa Validity Period
                                  </span>
                                  <span className="font-semibold text-[#101828] mt-0.5 block font-mono">
                                    {formatDate(foreigner.valid_from)} to{" "}
                                    {formatDate(foreigner.valid_upto)}
                                  </span>
                                  <span className="text-[11px] text-[#0284C7] mt-1 block font-medium">
                                    Visa No: {foreigner.visa_number}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#EAECF0]">
                                  <span className="text-[#667085] text-[11px] block">
                                    Purpose of Visit
                                  </span>
                                  <span className="font-semibold text-[#101828] mt-0.5 block">
                                    {foreigner.purpose_of_visit}
                                  </span>
                                </div>

                                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#EAECF0]">
                                  <span className="text-[#667085] text-[11px] block">
                                    Travel Route
                                  </span>
                                  <span className="font-semibold text-[#101828] mt-0.5 block">
                                    From: {foreigner.coming_from || "N/A"}
                                  </span>
                                  <span className="text-[#667085] text-xs mt-0.5 block">
                                    To: {foreigner.going_to || "N/A"}
                                  </span>
                                </div>

                                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#EAECF0] flex items-center justify-between">
                                  <div>
                                    <span className="text-[#667085] text-[11px] block">
                                      Compliance Documents
                                    </span>
                                    <span className="text-[11px] font-bold text-[#101828] block mt-0.5">
                                      C-Form Verified
                                    </span>
                                  </div>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">
                                    Compliant
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* STYLED EMPTY STATE (GLOBE SVG, NO EMOJIS) */
            <div className="p-12 text-center max-w-md mx-auto my-6 animate-scale-in">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#F8FAFC] border border-[#EAECF0] flex items-center justify-center text-[#98A2B3] shadow-inner">
                <svg
                  className="w-7 h-7 text-[#98A2B3]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>

              <h3 className="text-base font-bold text-[#101828] tracking-tight">
                No foreigners yet
              </h3>

              <p className="text-xs text-[#667085] mt-1.5 mb-6 leading-relaxed">
                Click &apos;Add Foreigner&apos; to register your first foreign national
              </p>

              <Link
                href="/dashboard/add-foreigner"
                className="px-5 py-2.5 bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0369A1] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all inline-flex items-center gap-2"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>+ Add First Foreigner</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
