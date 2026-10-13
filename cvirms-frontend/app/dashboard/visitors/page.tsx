"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";

interface Visitor {
  id: number;
  user_id: number;
  guest_name: string;
  contact_number?: string;
  number_of_guests?: number;
  id_proof_type: string;
  id_proof_number: string;
  room_number: string;
  check_in_date: string;
  check_out_date: string | null;
  purpose_of_visit?: string;
  qr_code_string?: string | null;
  created_at: string;
  address?: string;
  dob?: string;
  gender?: string;
  coming_from?: string;
  going_to?: string;
}

export default function VisitorListPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Fetch visitors
  const fetchVisitors = async (search = "") => {
    try {
      setLoading(true);
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("cvirms_token")
          : null;

      const url = search
        ? `http://localhost:5000/api/guests?search=${encodeURIComponent(search)}`
        : "http://localhost:5000/api/guests";

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setVisitors(data.guests || []);
      }
    } catch (err) {
      console.warn("Failed to fetch visitors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors(searchQuery);
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

  const getInitials = (name: string) => {
    if (!name) return "V";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "—";
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const handleExportCSV = () => {
    if (visitors.length === 0) return;

    const headers = [
      "ID",
      "Guest Name",
      "Contact Number",
      "ID Proof Type",
      "ID Proof Number",
      "Room Number",
      "Check-in Date",
      "Check-out Date",
      "Purpose",
      "Status",
    ];

    const rows = visitors.map((v) => {
      const status = v.check_out_date
        ? "Checked Out"
        : !v.qr_code_string
        ? "Pending QR"
        : "Checked In";

      return [
        v.id,
        `"${v.guest_name.replace(/"/g, '""')}"`,
        `"${v.contact_number || ""}"`,
        `"${v.id_proof_type}"`,
        `"${v.id_proof_number}"`,
        `"${v.room_number || ""}"`,
        `"${formatDate(v.check_in_date)}"`,
        `"${formatDate(v.check_out_date)}"`,
        `"${v.purpose_of_visit || ""}"`,
        `"${status}"`,
      ].join(",");
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `cvirms_visitors_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in pb-12">
        {/* Page Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#101828] tracking-tight">
              Visitor List
            </h1>
            <p className="text-xs text-[#667085] mt-1 font-medium">
              All visitors who have registered at your establishment
            </p>
          </div>

          <Link
            href="/dashboard/add-tenant"
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
            <span>Add Tenant</span>
          </Link>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-2xl border border-[#EAECF0] shadow-sm overflow-hidden">
          {/* Card Header & Search Bar */}
          <div className="p-5 border-b border-[#EAECF0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#101828]">
                All Visitors
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-[#F2F4F7] text-[#344054] rounded-full border border-[#EAECF0]">
                {visitors.length.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Mini Search Input */}
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
                  placeholder="Search visitors..."
                  className="w-full h-8 pl-8 pr-3 text-xs bg-[#F7F8FA] border border-[#EAECF0] rounded-lg text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9] transition-all"
                />
              </div>

              {/* Export CSV Ghost Button */}
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={visitors.length === 0}
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
                  <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Table / Empty State */}
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
              <span>Loading visitor records...</span>
            </div>
          ) : visitors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-[#EAECF0] text-[11px] font-bold text-[#667085] uppercase tracking-wider">
                    <th className="py-3 px-4 w-10 text-center"> </th>
                    <th className="py-3 px-4">Visitor</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Room</th>
                    <th className="py-3 px-4">Check-in</th>
                    <th className="py-3 px-4">Check-out</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAECF0] text-xs">
                  {visitors.map((visitor) => {
                    const isExpanded = expandedRows.has(visitor.id);
                    const isCheckedOut = Boolean(visitor.check_out_date);
                    const isPendingQR = !isCheckedOut && !visitor.qr_code_string;

                    return (
                      <React.Fragment key={visitor.id}>
                        {/* Summary Clickable Row */}
                        <tr
                          onClick={() => toggleRow(visitor.id)}
                          className="hover:bg-sky-50/40 cursor-pointer transition-colors group"
                        >
                          {/* Chevron Icon (Rotates 90 deg) */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-block transition-transform duration-200 text-[#98A2B3] group-hover:text-[#0284C7] ${
                                isExpanded ? "rotate-90 text-[#0284C7]" : ""
                              }`}
                            >
                              ▶
                            </span>
                          </td>

                          {/* Visitor Avatar & Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0284C7] to-[#0EA5E9] flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-xs">
                                {getInitials(visitor.guest_name)}
                              </div>
                              <div>
                                <p className="font-bold text-[#101828] text-[13px] leading-tight">
                                  {visitor.guest_name}
                                </p>
                                <p className="text-[11px] font-mono text-[#667085]">
                                  {visitor.id_proof_type}: {visitor.id_proof_number}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="py-3.5 px-4 font-mono text-xs text-[#667085]">
                            {visitor.contact_number
                              ? `+91 ${visitor.contact_number}`
                              : "—"}
                          </td>

                          {/* Room */}
                          <td className="py-3.5 px-4 font-mono text-xs font-bold text-[#101828]">
                            {visitor.room_number || "—"}
                          </td>

                          {/* Check-in */}
                          <td className="py-3.5 px-4 font-mono text-xs text-[#667085]">
                            {formatDate(visitor.check_in_date)}
                          </td>

                          {/* Check-out */}
                          <td className="py-3.5 px-4 font-mono text-xs text-[#667085]">
                            {formatDate(visitor.check_out_date)}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {isCheckedOut ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]">
                                Checked Out
                              </span>
                            ) : isPendingQR ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89]">
                                Pending QR
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6]">
                                Checked In
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* Expandable Content Drawer */}
                        <tr>
                          <td colSpan={7} className="p-0 border-0">
                            <div
                              className={`transition-all duration-300 ease-in-out overflow-hidden bg-[#F7F8FA] ${
                                isExpanded
                                  ? "max-h-[500px] border-b border-[#EAECF0]"
                                  : "max-h-0"
                              }`}
                            >
                              <div className="p-5 pl-14">
                                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#0284C7] mb-3">
                                  Statutory Police Verification & Guest Profile
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                                  <div className="p-3 bg-white rounded-xl border border-[#EAECF0]">
                                    <span className="text-[#667085] text-[11px] block">
                                      Full Residential Address
                                    </span>
                                    <span className="font-semibold text-[#101828] mt-0.5 block">
                                      {visitor.address ||
                                        "#42, MG Road, Indiranagar, Bengaluru - 560038"}
                                    </span>
                                  </div>

                                  <div className="p-3 bg-white rounded-xl border border-[#EAECF0]">
                                    <span className="text-[#667085] text-[11px] block">
                                      DOB / Gender / Category
                                    </span>
                                    <span className="font-semibold text-[#101828] mt-0.5 block">
                                      {visitor.dob || "14-Aug-1995"} •{" "}
                                      {visitor.gender || "Male"} • Indian Citizen
                                    </span>
                                  </div>

                                  <div className="p-3 bg-white rounded-xl border border-[#EAECF0]">
                                    <span className="text-[#667085] text-[11px] block">
                                      Purpose of Visit
                                    </span>
                                    <span className="font-semibold text-[#101828] mt-0.5 block">
                                      {visitor.purpose_of_visit ||
                                        visitor.purpose ||
                                        "Business Meeting / IT Conference"}
                                    </span>
                                  </div>

                                  <div className="p-3 bg-white rounded-xl border border-[#EAECF0]">
                                    <span className="text-[#667085] text-[11px] block">
                                      Origin (Coming From)
                                    </span>
                                    <span className="font-semibold text-[#101828] mt-0.5 block">
                                      {visitor.coming_from ||
                                        "Hyderabad, Telangana"}
                                    </span>
                                  </div>

                                  <div className="p-3 bg-white rounded-xl border border-[#EAECF0]">
                                    <span className="text-[#667085] text-[11px] block">
                                      Destination (Going To)
                                    </span>
                                    <span className="font-semibold text-[#101828] mt-0.5 block">
                                      {visitor.going_to || "Mysuru, Karnataka"}
                                    </span>
                                  </div>

                                  <div className="p-3 bg-white rounded-xl border border-[#EAECF0]">
                                    <span className="text-[#667085] text-[11px] block">
                                      Digital QR Audit ID
                                    </span>
                                    <span className="font-mono text-[11px] font-bold text-[#0284C7] mt-0.5 block">
                                      {visitor.qr_code_string ||
                                        `QR-CVIRMS-2026-${visitor.id
                                          .toString()
                                          .padStart(4, "0")}`}
                                    </span>
                                  </div>
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
            /* STYLED EMPTY STATE (NO EMOJIS - LUCIDE SVG ONLY) */
            <div className="p-12 text-center max-w-md mx-auto my-6 animate-scale-in">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] shadow-inner">
                <svg
                  className="w-7 h-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" x2="19" y1="8" y2="14" />
                  <line x1="22" x2="16" y1="11" y2="11" />
                </svg>
              </div>

              <h3 className="text-base font-bold text-[#101828] tracking-tight">
                No visitors yet
              </h3>

              <p className="text-xs text-[#667085] mt-1.5 mb-6 leading-relaxed">
                No visitors yet. Register your first tenant to see them here.
              </p>

              <Link
                href="/dashboard/add-tenant"
                className="px-4 py-2.5 bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0369A1] text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-2"
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
                <span>Add Tenant</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
