"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface PoliceOfficer {
  name: string;
  user_id?: string;
  username?: string;
  role?: string;
}

export default function PoliceSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type");

  const [officer, setOfficer] = useState<PoliceOfficer>({
    name: "Inspector Kumar",
    username: "police_kumar",
    role: "police",
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("cvirms_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          setOfficer(parsed);
        }
      }
    } catch {
      // Fallback
    }
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("cvirms_token");
      localStorage.removeItem("cvirms_user");
    } catch {
      // Ignore
    }
    router.push("/police/login");
  };

  const checkIsActive = (href: string) => {
    if (href.includes("?type=")) {
      const targetType = href.split("?type=")[1];
      return pathname === "/police/establishments" && currentType === targetType;
    }
    if (href === "/police/establishments") {
      return pathname === "/police/establishments" && !currentType;
    }
    return pathname === href;
  };

  const navGroups = [
    {
      label: "COMMAND & INTELLIGENCE",
      items: [
        {
          name: "Dashboard",
          href: "/police/dashboard",
          icon: (
            <svg
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="7" height="9" x="3" y="3" rx="1" />
              <rect width="7" height="5" x="14" y="3" rx="1" />
              <rect width="7" height="9" x="14" y="12" rx="1" />
              <rect width="7" height="5" x="3" y="16" rx="1" />
            </svg>
          ),
        },
        {
          name: "City Visitors Search",
          href: "/police/search/visitors",
          icon: (
            <svg
              className="w-4 h-4 shrink-0"
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
          ),
        },
        {
          name: "CVIRMS Member Search",
          href: "/police/search/members",
          icon: (
            <svg
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
        },
        {
          name: "Report",
          href: "/police/reports",
          icon: (
            <svg
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          ),
        },
      ],
    },
    {
      label: "ESTABLISHMENTS & DIRECTORY",
      items: [
        {
          name: "PG's",
          href: "/police/establishments?type=pg",
          icon: (
            <svg
              className="w-4 h-4 shrink-0"
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
          ),
        },
        {
          name: "Hotel/Lodge",
          href: "/police/establishments?type=hotel",
          icon: (
            <svg
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 4v16" />
              <path d="M2 8h18a2 2 0 0 1 2 2v10" />
              <path d="M2 17h20" />
              <path d="M6 8v9" />
            </svg>
          ),
        },
        {
          name: "Organization",
          href: "/police/establishments?type=organization",
          icon: (
            <svg
              className="w-4 h-4 shrink-0"
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
          ),
        },
        {
          name: "Society Details",
          href: "/police/establishments?type=housing_society",
          icon: (
            <svg
              className="w-4 h-4 shrink-0"
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
            </svg>
          ),
        },
        {
          name: "Scrap Merchants",
          href: "/police/establishments?type=scrap_dealer",
          icon: (
            <svg
              className="w-4 h-4 shrink-0"
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
          ),
        },
        {
          name: "Jewellery",
          href: "/police/establishments?type=jewellery",
          icon: (
            <svg
              className="w-4 h-4 shrink-0"
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
          ),
        },
      ],
    },
    {
      label: "LAW ENFORCEMENT",
      items: [
        {
          name: "Police Station Info",
          href: "/police/stations",
          icon: (
            <svg
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          ),
        },
      ],
    },
    {
      label: "FLAGS & ALERTS",
      items: [
        {
          name: "Add Flag",
          href: "/police/flags/add",
          icon: (
            <svg
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" x2="4" y1="22" y2="15" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="10" x2="14" y1="10" y2="10" />
            </svg>
          ),
        },
        {
          name: "All Flag",
          href: "/police/flags",
          icon: (
            <svg
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" x2="4" y1="22" y2="15" />
            </svg>
          ),
        },
        {
          name: "My Alert",
          href: "/police/alerts",
          icon: (
            <svg
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          ),
        },
      ],
    },
    {
      label: "COMMUNICATIONS",
      items: [
        {
          name: "Add Notice",
          href: "/police/notices/add",
          icon: (
            <svg
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" x2="12" y1="18" y2="12" />
              <line x1="9" x2="15" y1="15" y2="15" />
            </svg>
          ),
        },
        {
          name: "All Notices",
          href: "/police/notices",
          icon: (
            <svg
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" x2="8" y1="13" y2="13" />
              <line x1="16" x2="8" y1="17" y2="17" />
              <line x1="10" x2="8" y1="9" y2="9" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <aside className="w-64 h-screen bg-white border-r border-[#EAECF0] flex flex-col justify-between shrink-0 select-none z-30 font-sans shadow-sm">
      {/* Top Brand Header */}
      <div className="flex-1 overflow-y-auto">
        <Link
          href="/police/dashboard"
          className="p-4 border-b border-[#EAECF0] flex items-center gap-3 bg-white sticky top-0 z-10 hover:bg-[#F9FAFB] transition-colors cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            <svg
              className="w-5 h-5 text-[#0284C7]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-[#101828] tracking-tight uppercase group-hover:text-[#0284C7] transition-colors">
                POLICE ADMIN
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] font-mono text-[#667085] truncate">
              Karnataka State Police
            </p>
          </div>
        </Link>

        {/* Navigation Sections */}
        <div className="py-3 px-3 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-mono font-semibold tracking-wider text-[#98A2B3] uppercase">
                {group.label}
              </div>
              {group.items.map((item) => {
                const isActive = checkIsActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-150 ${
                      isActive
                        ? "bg-[#F0F9FF] text-[#0284C7] font-semibold border-l-2 border-[#0EA5E9]"
                        : "text-[#475467] hover:bg-[#F8FAFC] hover:text-[#101828] font-medium"
                    }`}
                  >
                    <span className={isActive ? "text-[#0284C7]" : "text-[#667085]"}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Officer Profile & Logout */}
      <div className="p-3 border-t border-[#EAECF0] bg-[#F9FAFB] space-y-2 shrink-0">
        <div className="p-2.5 rounded-xl bg-white border border-[#EAECF0] flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-xs font-mono font-bold text-[#0284C7]">
            {officer.name ? officer.name.charAt(0).toUpperCase() : "P"}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-semibold text-[#101828] truncate">
              {officer.name || "Inspector Kumar"}
            </p>
            <p className="text-[10px] font-mono text-[#667085] truncate">
              {officer.username || "police_dept"}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          type="button"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer border border-transparent hover:border-red-200"
        >
          <svg
            className="w-4 h-4 shrink-0 text-red-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
