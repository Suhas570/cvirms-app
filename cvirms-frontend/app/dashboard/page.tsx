"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";

interface UserProfile {
  id?: number;
  name: string;
  phone?: string;
  user_id?: string;
  role?: string;
  member_type?: string;
}

interface DashboardStats {
  totalVisitors: number;
  activeTenants: number;
  pendingQR: number;
  totalEmployees: number;
}

interface ActivityItem {
  id: number;
  type: "checkin" | "checkout" | "qr_approved" | "employee_added" | "foreigner_registered";
  name: string;
  detail: string;
  timestamp: string;
}

interface VisitorRecord {
  id: number;
  guest_name: string;
  id_proof_type: string;
  id_proof_number: string;
  room_number: string;
  check_in_date: string;
  check_out_date: string | null;
  created_at: string;
  address?: string;
  dob?: string;
  gender?: string;
  purpose?: string;
  coming_from?: string;
  going_to?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile>({ name: "Demo PG" });
  const [stats, setStats] = useState<DashboardStats>({
    totalVisitors: 0,
    activeTenants: 0,
    pendingQR: 0,
    totalEmployees: 0,
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [visitorFilter, setVisitorFilter] = useState<string>("");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Load user from localStorage
    try {
      const storedUser = localStorage.getItem("cvirms_user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // Fallback
    }

    // 2. Fetch Dashboard Data
    const token = typeof window !== "undefined" ? localStorage.getItem("cvirms_token") : null;
    const authHeaders = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const API_BASE = "http://localhost:5000";

    async function loadDashboard() {
      try {
        // Fetch Stats
        const statsRes = await fetch(`${API_BASE}/api/dashboard/stats`, { headers: authHeaders });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats({
            totalVisitors: statsData.totalVisitors ?? statsData.stats?.totalVisitors ?? 0,
            activeTenants: statsData.activeTenants ?? statsData.stats?.activeTenants ?? 0,
            pendingQR: statsData.pendingQR ?? statsData.stats?.pendingQR ?? 0,
            totalEmployees: statsData.totalEmployees ?? statsData.stats?.totalEmployees ?? 0,
          });
        }

        // Fetch Recent Visitors
        const visitorsRes = await fetch(`${API_BASE}/api/dashboard/recent-visitors`, { headers: authHeaders });
        if (visitorsRes.ok) {
          const vData = await visitorsRes.json();
          const list = Array.isArray(vData) ? vData : vData.recentVisitors || vData.visitors || [];
          setVisitors(list);
        }

        // Fetch Activity
        const actRes = await fetch(`${API_BASE}/api/dashboard/activity`, { headers: authHeaders });
        if (actRes.ok) {
          const actData = await actRes.json();
          const list = Array.isArray(actData) ? actData : actData.activities || actData.activity || [];
          setActivities(list);
        }
      } catch (err) {
        console.warn("Could not fetch remote dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

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

  const filteredVisitors = visitors.filter((v) =>
    v.guest_name.toLowerCase().includes(visitorFilter.toLowerCase()) ||
    v.id_proof_number.toLowerCase().includes(visitorFilter.toLowerCase()) ||
    (v.room_number && v.room_number.toLowerCase().includes(visitorFilter.toLowerCase()))
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto space-y-6 animate-fade-in">
        {/* Page Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-[24px] font-extrabold text-[#101828] tracking-tight">
              Good morning, {user.name || "Demo PG"} 👋
            </h1>
            <p className="text-xs text-[#667085] mt-0.5">
              Here&apos;s what&apos;s happening with your establishment today
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[11px] font-bold text-[#0284C7] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] animate-pulse" />
              Member Portal Active
            </span>
          </div>
        </div>

        {/* 4-Column Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CARD 1 (col-2, row-2): TOTAL VISITORS - ENTERPRISE STYLE */}
          <div className="md:col-span-2 row-span-2 bg-white rounded-[16px] border border-[#EAECF0] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#667085]">
                  TOTAL VISITORS
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#F2F4F7] text-[#344054]">
                  Last 30 Days
                </span>
              </div>

              <div className="flex items-baseline gap-3 mb-1">
                <span className="font-mono text-[36px] font-extrabold text-[#101828] tracking-tight leading-none">
                  {stats.totalVisitors}
                </span>
                <span className="inline-flex items-center text-xs font-semibold text-[#12B76A] bg-[#ECFDF3] px-2 py-0.5 rounded-full">
                  ↑ 12.5% from last month
                </span>
              </div>
              <p className="text-[11px] text-[#667085]">
                Verified guest registrations across all room blocks
              </p>
            </div>

            {/* SVG Line Chart */}
            <div className="mt-4 pt-4 border-t border-[#F2F4F7]">
              <svg viewBox="0 0 400 130" className="w-full h-[120px] overflow-visible">
                <defs>
                  <linearGradient id="blueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Dashed Grid Lines */}
                <line x1="0" y1="20" x2="400" y2="20" stroke="#EAECF0" strokeDasharray="3 3" />
                <line x1="0" y1="65" x2="400" y2="65" stroke="#EAECF0" strokeDasharray="3 3" />
                <line x1="0" y1="110" x2="400" y2="110" stroke="#EAECF0" strokeDasharray="3 3" />

                {/* Subtle Gradient Area Fill */}
                <path
                  d="M 10 110 Q 70 85 130 90 T 250 45 T 320 60 T 390 25 L 390 120 L 10 120 Z"
                  fill="url(#blueAreaGrad)"
                />

                {/* Primary Blue Line */}
                <path
                  d="M 10 110 Q 70 85 130 90 T 250 45 T 320 60 T 390 25"
                  fill="none"
                  stroke="#1D4ED8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Data Points */}
                <circle cx="10" cy="110" r="3.5" fill="#1D4ED8" className="stroke-white stroke-2" />
                <circle cx="130" cy="90" r="3.5" fill="#1D4ED8" className="stroke-white stroke-2" />
                <circle cx="250" cy="45" r="3.5" fill="#1D4ED8" className="stroke-white stroke-2" />
                <circle cx="320" cy="60" r="3.5" fill="#1D4ED8" className="stroke-white stroke-2" />
                <circle cx="390" cy="25" r="4.5" fill="#0EA5E9" className="stroke-white stroke-2 animate-pulse" />
              </svg>

              <div className="flex justify-between text-[10px] font-mono text-[#98A2B3] mt-1">
                <span>Week 1</span>
                <span>Week 2</span>
                <span>Week 3</span>
                <span>Week 4</span>
              </div>
            </div>
          </div>

          {/* CARD 2 (col-2 / col-span-1): ACTIVE TENANTS */}
          <div className="bg-white rounded-[16px] border border-[#EAECF0] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#667085]">
                ACTIVE TENANTS
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#ECFDF3] text-[#12B76A] text-[10px] font-bold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A] animate-ping" />
                Live
              </span>
            </div>

            <div className="my-3">
              <div className="font-mono text-3xl font-extrabold text-[#101828]">
                {stats.activeTenants}
              </div>
              <div className="text-xs font-semibold text-[#12B76A] mt-1">
                ↑ 8 new this week
              </div>
            </div>

            <p className="text-[11px] text-[#667085]">
              Currently residing with valid check-in
            </p>
          </div>

          {/* CARD 3 (col-2 / col-span-1): PENDING QR */}
          <div className="bg-white rounded-[16px] border border-[#EAECF0] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#667085]">
                PENDING QR
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFFAEB] border border-[#FEDF89] text-[#B54708] text-[10px] font-bold">
                {/* Warning Triangle SVG Icon (NO emoji) */}
                <svg className="w-3 h-3 text-[#F79009]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Requires action
              </span>
            </div>

            <div className="my-3">
              <div className="font-mono text-3xl font-extrabold text-[#F79009]">
                {stats.pendingQR}
              </div>
              <div className="text-xs font-medium text-[#B54708] mt-1">
                Unverified digital passes
              </div>
            </div>

            <p className="text-[11px] text-[#667085]">
              Awaiting manager counter verification
            </p>
          </div>

          {/* CARD 4 (col-2, row-2): WEEKLY CHECK-INS BAR CHART */}
          <div className="md:col-span-2 row-span-2 bg-white rounded-[16px] border border-[#EAECF0] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#101828]">Weekly Check-ins</h3>
                <p className="text-[11px] text-[#667085]">Monday – Sunday check-in distribution</p>
              </div>
              <span className="text-[11px] font-mono font-bold text-[#0284C7] bg-[#E0F2FE] px-2.5 py-1 rounded-full">
                Peak: Saturday
              </span>
            </div>

            {/* 7 Bars (Mon–Sun) */}
            <div className="h-40 flex items-end justify-between gap-3 pt-4 px-2">
              {[
                { day: "Mon", height: "40%", count: 16 },
                { day: "Tue", height: "65%", count: 26 },
                { day: "Wed", height: "45%", count: 18 },
                { day: "Thu", height: "85%", count: 34 },
                { day: "Fri", height: "60%", count: 24 },
                { day: "Sat", height: "95%", count: 38 },
                { day: "Sun", height: "50%", count: 20 },
              ].map((bar) => (
                <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[10px] font-mono text-[#667085] opacity-0 group-hover:opacity-100 transition-opacity">
                    {bar.count}
                  </span>
                  <div className="w-full bg-[#F2F4F7] rounded-lg h-full flex items-end overflow-hidden p-0.5">
                    <div
                      style={{ height: bar.height }}
                      className="w-full bg-gradient-to-t from-[#0284C7] to-[#0EA5E9] rounded-md transition-all duration-300 group-hover:brightness-110 shadow-xs"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[#667085] font-semibold">
                    {bar.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 5 (col-2, row-2): RECENT ACTIVITY FEED */}
          <div className="md:col-span-2 row-span-2 bg-white rounded-[16px] border border-[#EAECF0] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#101828]">Recent Activity Feed</h3>
                <p className="text-[11px] text-[#667085]">Real-time statutory audit log</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#12B76A] bg-[#ECFDF3] px-2 py-0.5 rounded-full font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A] animate-pulse" />
                Live Sync
              </span>
            </div>

            <div className="space-y-3 divide-y divide-[#F2F4F7]">
              {activities.slice(0, 5).map((act) => {
                const dotColor =
                  act.type === "checkin"
                    ? "bg-[#12B76A]"
                    : act.type === "checkout"
                    ? "bg-[#0284C7]"
                    : act.type === "qr_approved"
                    ? "bg-[#7F56D9]"
                    : act.type === "employee_added"
                    ? "bg-[#F79009]"
                    : "bg-[#0EA5E9]";

                return (
                  <div key={act.id} className="pt-2.5 first:pt-0 flex items-start gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${dotColor}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-[#101828] truncate">
                          {act.name}
                        </p>
                        <span className="text-[10px] font-mono text-[#98A2B3] shrink-0">
                          {act.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#667085] truncate">
                        {act.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CARD 6 (col-2 / col-span-1): QUICK ACTIONS (2x2 GRID, NO EMOJIS) */}
          <div className="bg-white rounded-[16px] border border-[#EAECF0] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <h3 className="text-xs font-bold uppercase tracking-[0.05em] text-[#667085] mb-3">
              QUICK ACTIONS
            </h3>

            <div className="grid grid-cols-2 gap-2.5 flex-1">
              {[
                {
                  label: "Add Tenant",
                  href: "/dashboard/add-tenant",
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" x2="19" y1="8" y2="14" />
                      <line x1="22" x2="16" y1="11" y2="11" />
                    </svg>
                  ),
                },
                {
                  label: "Add Employee",
                  href: "/dashboard/coming-soon",
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  ),
                },
                {
                  label: "QR Approvals",
                  href: "/dashboard/coming-soon",
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="5" height="5" x="3" y="3" rx="1" />
                      <rect width="5" height="5" x="16" y="3" rx="1" />
                      <rect width="5" height="5" x="3" y="16" rx="1" />
                      <path d="m21 16-4 4-2-2" />
                    </svg>
                  ),
                },
                {
                  label: "Generate QR",
                  href: "/dashboard/coming-soon",
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="5" height="5" x="3" y="3" rx="1" />
                      <rect width="5" height="5" x="16" y="3" rx="1" />
                      <rect width="5" height="5" x="3" y="16" rx="1" />
                      <path d="M21 16v5" />
                      <path d="M18.5 18.5h5" />
                    </svg>
                  ),
                },
              ].map((btn) => (
                <Link
                  key={btn.label}
                  href={btn.href}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-[#EAECF0] bg-[#F7F8FA] hover:bg-[#E0F2FE] hover:border-[#0284C7] hover:-translate-y-0.5 transition-all text-[#101828] shadow-xs group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#EAECF0] flex items-center justify-center text-[#0284C7] group-hover:bg-[#0284C7] group-hover:text-white transition-colors mb-1.5">
                    {btn.icon}
                  </div>
                  <span className="text-[11px] font-semibold tracking-tight text-center">
                    {btn.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* CARD 7 (col-2 / col-span-1): COMPLIANCE SCORE */}
          <div className="bg-white rounded-[16px] border border-[#EAECF0] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <h3 className="text-xs font-bold uppercase tracking-[0.05em] text-[#667085] mb-2">
              COMPLIANCE SCORE
            </h3>

            <div className="flex items-center gap-4 my-auto">
              {/* SVG Ring Gauge (80px diameter, 34 radius, 6 stroke) */}
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <svg className="w-20 h-20 -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke="#F2F4F7"
                    strokeWidth="6"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke="#12B76A"
                    strokeWidth="6"
                    strokeDasharray="213.63"
                    strokeDashoffset="32.04"
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <span className="absolute font-mono text-base font-extrabold text-[#101828]">
                  85%
                </span>
              </div>

              {/* Right Descriptions */}
              <div className="space-y-0.5">
                <p className="text-[13px] font-bold text-[#101828]">Excellent</p>
                <p className="text-[11px] text-[#667085]">All records compliant</p>
                <p className="text-[11px] font-semibold text-[#12B76A]">
                  ↑ 3% improvement
                </p>
              </div>
            </div>

            <p className="text-[10px] text-[#98A2B3] mt-2">
              Statutory verification score
            </p>
          </div>
        </div>

        {/* FULL-WIDTH CARD: RECENT VISITOR LOGS TABLE WITH EXPANDABLE ROWS */}
        <div className="bg-white rounded-[16px] border border-[#EAECF0] shadow-sm overflow-hidden">
          {/* Card Title Bar */}
          <div className="p-5 border-b border-[#EAECF0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#101828]">
                Recent Visitor Logs
              </h2>
              <p className="text-xs text-[#667085]">
                Expanded statutory guest profiles with KYC identity audit
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Table Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter records..."
                  value={visitorFilter}
                  onChange={(e) => setVisitorFilter(e.target.value)}
                  className="h-8 pl-8 pr-3 text-xs bg-[#F7F8FA] border border-[#EAECF0] rounded-lg text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9] w-48"
                />
                <svg className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#98A2B3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" x2="16.65" y1="21" y2="16.65" />
                </svg>
              </div>

              {/* Export Ghost Button */}
              <button
                type="button"
                className="h-8 px-3 rounded-lg border border-[#EAECF0] hover:bg-gray-50 text-xs font-semibold text-[#344054] inline-flex items-center gap-1.5 transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-[#667085]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
                Export
              </button>
            </div>
          </div>

          {/* Table or Styled Empty State */}
          {filteredVisitors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-[#EAECF0] text-[11px] font-bold text-[#667085] uppercase tracking-wider">
                    <th className="py-3 px-4 w-10 text-center"> </th>
                    <th className="py-3 px-4">Visitor</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Room</th>
                    <th className="py-3 px-4">Check-in</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAECF0] text-xs">
                  {filteredVisitors.map((visitor) => {
                    const isExpanded = expandedRows.has(visitor.id);
                    const isCheckedOut = Boolean(visitor.check_out_date);

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
                            +91 98765 43210
                          </td>

                          {/* Room */}
                          <td className="py-3.5 px-4 font-mono text-xs font-bold text-[#101828]">
                            {visitor.room_number || "—"}
                          </td>

                          {/* Check-in */}
                          <td className="py-3.5 px-4 font-mono text-xs text-[#667085]">
                            {new Date(visitor.check_in_date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {isCheckedOut ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F2F4F7] text-[#344054] border border-[#EAECF0]">
                                Checked Out
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
                          <td colSpan={6} className="p-0 border-0">
                            <div
                              className={`transition-all duration-300 ease-in-out overflow-hidden bg-[#F7F8FA] ${
                                isExpanded ? "max-h-[500px] border-b border-[#EAECF0]" : "max-h-0"
                              }`}
                            >
                              <div className="p-5 pl-14">
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#0284C7] mb-3">
                                  Statutory Police Verification & Guest Profile
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                                  <div className="p-3 bg-white rounded-xl border border-[#EAECF0]">
                                    <span className="text-[#667085] text-[11px] block">Full Residential Address</span>
                                    <span className="font-semibold text-[#101828] mt-0.5 block">
                                      {visitor.address || "#42, MG Road, Indiranagar, Bengaluru - 560038"}
                                    </span>
                                  </div>

                                  <div className="p-3 bg-white rounded-xl border border-[#EAECF0]">
                                    <span className="text-[#667085] text-[11px] block">DOB / Gender / Category</span>
                                    <span className="font-semibold text-[#101828] mt-0.5 block">
                                      {visitor.dob || "14-Aug-1995"} • {visitor.gender || "Male"} • Indian Citizen
                                    </span>
                                  </div>

                                  <div className="p-3 bg-white rounded-xl border border-[#EAECF0]">
                                    <span className="text-[#667085] text-[11px] block">Purpose of Visit</span>
                                    <span className="font-semibold text-[#101828] mt-0.5 block">
                                      {visitor.purpose || "Business Meeting / IT Conference"}
                                    </span>
                                  </div>

                                  <div className="p-3 bg-white rounded-xl border border-[#EAECF0]">
                                    <span className="text-[#667085] text-[11px] block">Origin (Coming From)</span>
                                    <span className="font-semibold text-[#101828] mt-0.5 block">
                                      {visitor.coming_from || "Hyderabad, Telangana"}
                                    </span>
                                  </div>

                                  <div className="p-3 bg-white rounded-xl border border-[#EAECF0]">
                                    <span className="text-[#667085] text-[11px] block">Destination (Going To)</span>
                                    <span className="font-semibold text-[#101828] mt-0.5 block">
                                      {visitor.going_to || "Mysuru, Karnataka"}
                                    </span>
                                  </div>

                                  <div className="p-3 bg-white rounded-xl border border-[#EAECF0]">
                                    <span className="text-[#667085] text-[11px] block">Digital QR Audit ID</span>
                                    <span className="font-mono text-[11px] font-bold text-[#0284C7] mt-0.5 block">
                                      QR-CVIRMS-2026-{visitor.id.toString().padStart(4, "0")}
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
            /* STYLED EMPTY STATE (AS SPECIFIED IN TASK 4 - NO EMOJIS, LUCIDE SVG ONLY) */
            <div className="p-12 text-center max-w-md mx-auto my-6 animate-scale-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] shadow-inner">
                <svg className="w-8 h-8 text-[#0284C7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" x2="19" y1="8" y2="14" />
                  <line x1="22" x2="16" y1="11" y2="11" />
                </svg>
              </div>

              <h3 className="text-lg font-bold text-[#101828] tracking-tight">
                No visitor records yet
              </h3>

              <p className="text-xs text-[#667085] mt-1.5 mb-6 leading-relaxed">
                Click &apos;Add Tenant&apos; or share your QR code to register your first guest
              </p>

              <div className="flex items-center justify-center gap-3">
                <Link
                  href="/dashboard/add-tenant"
                  className="px-4 py-2 bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Add First Tenant</span>
                </Link>

                <Link
                  href="/dashboard/coming-soon"
                  className="px-4 py-2 bg-white border border-[#D0D5DD] hover:bg-gray-50 text-[#344054] text-xs font-semibold rounded-xl shadow-2xs transition-colors inline-flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 text-[#667085]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="5" height="5" x="3" y="3" rx="1" />
                    <rect width="5" height="5" x="16" y="3" rx="1" />
                    <rect width="5" height="5" x="3" y="16" rx="1" />
                    <path d="M21 16v5" />
                    <path d="M18.5 18.5h5" />
                  </svg>
                  <span>Generate QR</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
