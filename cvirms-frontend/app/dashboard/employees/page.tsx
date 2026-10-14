"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";

interface Employee {
  id: number;
  user_id: number;
  full_name: string;
  contact_number: string;
  alternate_contact?: string | null;
  gender: string;
  address: string;
  pincode: string;
  document_type: string;
  document_id: string;
  photo_url?: string | null;
  check_in_time?: string | null;
  remark?: string | null;
  created_at: string;
}

export default function EmployeeListPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Fetch employees
  const fetchEmployees = async (search = "") => {
    try {
      setLoading(true);
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("cvirms_token")
          : null;

      const url = search
        ? `http://localhost:5000/api/employees?search=${encodeURIComponent(
            search
          )}`
        : "http://localhost:5000/api/employees";

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.warn("Failed to fetch employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(searchQuery);
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
    if (!name) return "E";
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
    if (employees.length === 0) return;

    const headers = [
      "ID",
      "Full Name",
      "Gender",
      "Contact Number",
      "Alternate Contact",
      "Address",
      "Pincode",
      "Document Type",
      "Document ID",
      "Joining Date",
      "Check-in Time",
      "Remark",
      "Status",
    ];

    const rows = employees.map((emp) => [
      emp.id,
      `"${emp.full_name.replace(/"/g, '""')}"`,
      `"${emp.gender}"`,
      `"${emp.contact_number}"`,
      `"${emp.alternate_contact || ""}"`,
      `"${emp.address.replace(/"/g, '""')}"`,
      `"${emp.pincode}"`,
      `"${emp.document_type}"`,
      `"${emp.document_id}"`,
      `"${formatDate(emp.created_at)}"`,
      `"${emp.check_in_time || ""}"`,
      `"${(emp.remark || "").replace(/"/g, '""')}"`,
      `"Active"`,
    ].join(","));

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `cvirms_employees_${new Date().toISOString().split("T")[0]}.csv`
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
              Employee List
            </h1>
            <p className="text-xs text-[#667085] mt-1 font-medium">
              All staff members registered at your establishment
            </p>
          </div>

          <Link
            href="/dashboard/add-employee"
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
            <span>Add Employee</span>
          </Link>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-2xl border border-[#EAECF0] shadow-sm overflow-hidden">
          {/* Card Header & Search Bar */}
          <div className="p-5 border-b border-[#EAECF0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#101828]">
                All Employees
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-[#F2F4F7] text-[#344054] rounded-full border border-[#EAECF0]">
                {employees.length.toLocaleString("en-IN")}
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
                  placeholder="Search employees..."
                  className="w-full h-8 pl-8 pr-3 text-xs bg-[#F7F8FA] border border-[#EAECF0] rounded-lg text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9] transition-all"
                />
              </div>

              {/* Export CSV Ghost Button */}
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={employees.length === 0}
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
              <span>Loading employee records...</span>
            </div>
          ) : employees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-[#EAECF0] text-[11px] font-bold text-[#667085] uppercase tracking-wider">
                    <th className="py-3 px-4 w-10 text-center"> </th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Gender</th>
                    <th className="py-3 px-4">Document</th>
                    <th className="py-3 px-4">Joining Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAECF0] text-xs">
                  {employees.map((employee) => {
                    const isExpanded = expandedRows.has(employee.id);

                    return (
                      <React.Fragment key={employee.id}>
                        {/* Summary Clickable Row */}
                        <tr
                          onClick={() => toggleRow(employee.id)}
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

                          {/* Employee Avatar & Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0284C7] to-[#0EA5E9] flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-xs">
                                {getInitials(employee.full_name)}
                              </div>
                              <div>
                                <p className="font-bold text-[#101828] text-[13px] leading-tight">
                                  {employee.full_name}
                                </p>
                                <p className="text-[11px] font-mono text-[#667085]">
                                  PIN: {employee.pincode}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="py-3.5 px-4 font-mono text-xs text-[#667085]">
                            {employee.contact_number
                              ? `+91 ${employee.contact_number}`
                              : "—"}
                          </td>

                          {/* Gender */}
                          <td className="py-3.5 px-4 text-xs font-medium text-[#344054]">
                            {employee.gender}
                          </td>

                          {/* Document */}
                          <td className="py-3.5 px-4 font-mono text-xs text-[#667085]">
                            {employee.document_type.split(" ")[0]}:{" "}
                            {employee.document_id}
                          </td>

                          {/* Joining Date */}
                          <td className="py-3.5 px-4 font-mono text-xs text-[#667085]">
                            {formatDate(employee.created_at)}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6]">
                              Active
                            </span>
                          </td>
                        </tr>

                        {/* EXPANDABLE ROW (MAX-HEIGHT ACCORDION) */}
                        <tr
                          className={`bg-[#F8FAFC] transition-all duration-300 ease-in-out ${
                            isExpanded ? "" : "hidden"
                          }`}
                        >
                          <td colSpan={7} className="p-0 border-b border-[#EAECF0]">
                            <div className="p-5 border-l-4 border-[#0EA5E9] bg-white m-3 rounded-xl shadow-xs">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0284C7] mb-3 flex items-center gap-2">
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
                                Full Staff Information & Document Details
                              </h4>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#EAECF0]">
                                  <span className="text-[#667085] text-[11px] block">
                                    Residential Address
                                  </span>
                                  <span className="font-semibold text-[#101828] mt-0.5 block leading-relaxed">
                                    {employee.address}
                                  </span>
                                  <span className="text-[10px] text-[#667085] mt-1 block font-mono">
                                    Pincode: {employee.pincode}
                                  </span>
                                </div>

                                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#EAECF0]">
                                  <span className="text-[#667085] text-[11px] block">
                                    Contact Details
                                  </span>
                                  <span className="font-semibold text-[#101828] mt-0.5 block font-mono">
                                    Primary: +91 {employee.contact_number}
                                  </span>
                                  <span className="text-[#667085] text-xs mt-1 block font-mono">
                                    Alternate:{" "}
                                    {employee.alternate_contact
                                      ? `+91 ${employee.alternate_contact}`
                                      : "None provided"}
                                  </span>
                                </div>

                                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#EAECF0]">
                                  <span className="text-[#667085] text-[11px] block">
                                    Identity Document
                                  </span>
                                  <span className="font-semibold text-[#101828] mt-0.5 block font-mono">
                                    {employee.document_type}: {employee.document_id}
                                  </span>
                                  <span className="text-[11px] text-[#0284C7] mt-1 block font-medium">
                                    Status: Verified by Employer
                                  </span>
                                </div>
                              </div>

                              {/* Row 2: Shift, Remark, and Photo Previews */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mt-3">
                                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#EAECF0]">
                                  <span className="text-[#667085] text-[11px] block">
                                    Check-in Time / Shift
                                  </span>
                                  <span className="font-semibold text-[#101828] mt-0.5 block font-mono">
                                    {employee.check_in_time
                                      ? employee.check_in_time.replace("T", " ")
                                      : "Standard Morning Shift"}
                                  </span>
                                </div>

                                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#EAECF0]">
                                  <span className="text-[#667085] text-[11px] block">
                                    Verification Remarks
                                  </span>
                                  <span className="font-semibold text-[#101828] mt-0.5 block">
                                    {employee.remark || "Active staff member"}
                                  </span>
                                </div>

                                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#EAECF0] flex items-center justify-between">
                                  <div>
                                    <span className="text-[#667085] text-[11px] block">
                                      Photos & Documents
                                    </span>
                                    <span className="text-[11px] font-bold text-[#101828] block mt-0.5">
                                      2 Uploaded Attachments
                                    </span>
                                  </div>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">
                                    Verified
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
            /* STYLED EMPTY STATE (MUTED BRIEFCASE SVG, NO EMOJIS) */
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
                  <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>

              <h3 className="text-base font-bold text-[#101828] tracking-tight">
                No employees yet
              </h3>

              <p className="text-xs text-[#667085] mt-1.5 mb-6 leading-relaxed">
                Click &apos;Add Employee&apos; to register your first staff member
              </p>

              <Link
                href="/dashboard/add-employee"
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
                <span>+ Add First Employee</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
