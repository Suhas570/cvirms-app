"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

interface UserData {
  name: string;
  phone?: string;
  user_id?: string;
  role?: string;
  member_type?: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<UserData>({
    name: "Demo PG",
    member_type: "pg",
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Safely read user from localStorage.getItem('cvirms_user')
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cvirms_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          setUser(parsed);
        }
      }
    } catch {
      // Fallback
    }
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Listen for external sidebar toggle event if dispatched
  useEffect(() => {
    const handleToggle = () => {
      setMobileOpen((prev) => !prev);
    };
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => {
      window.removeEventListener("toggle-sidebar", handleToggle);
    };
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("cvirms_token");
      localStorage.removeItem("cvirms_user");
    } catch {
      // Ignore
    }
    router.push("/login");
  };

  // Derive avatar initial:
  // - Reads from localStorage.getItem('cvirms_user')
  // - Parses JSON and extracts user.name
  // - Sets initial to user.name.charAt(0).toUpperCase() (e.g., "D" for Demo)
  // - Fallback: if user.name is undefined, use "U" (for User)
  const getAvatarInitial = (name?: string): string => {
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return "U";
    }
    return name.trim().charAt(0).toUpperCase();
  };

  const navGroups = [
    {
      label: "OVERVIEW",
      items: [
        {
          name: "Dashboard",
          href: "/dashboard",
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
          name: "Visitor List",
          href: "/dashboard/visitors",
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
      ],
    },
    {
      label: "REGISTRATION",
      items: [
        {
          name: "Add Customer",
          href: "/dashboard/add-customer",
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
              <line x1="19" x2="19" y1="8" y2="14" />
              <line x1="22" x2="16" y1="11" y2="11" />
            </svg>
          ),
        },
        {
          name: "Add Employee",
          href: "/dashboard/add-employee",
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
          name: "Add Foreigner",
          href: "/dashboard/add-foreigner",
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
              <circle cx="12" cy="12" r="10" />
              <line x1="2" x2="22" y1="12" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          ),
        },
      ],
    },
    {
      label: "LISTS",
      items: [
        {
          name: "Employee List",
          href: "/dashboard/employees",
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
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
        },
        {
          name: "Foreigner List",
          href: "/dashboard/foreigners",
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
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
          ),
        },
      ],
    },
    {
      label: "TOOLS",
      items: [
        {
          name: "QR Approvals",
          href: "/dashboard/coming-soon",
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
              <rect width="5" height="5" x="3" y="3" rx="1" />
              <rect width="5" height="5" x="16" y="3" rx="1" />
              <rect width="5" height="5" x="3" y="16" rx="1" />
              <path d="m21 16-4 4-2-2" />
            </svg>
          ),
        },
        {
          name: "Generate QR",
          href: "/dashboard/coming-soon",
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
              <rect width="5" height="5" x="3" y="3" rx="1" />
              <rect width="5" height="5" x="16" y="3" rx="1" />
              <rect width="5" height="5" x="3" y="16" rx="1" />
              <path d="M21 16v5" />
              <path d="M18.5 18.5h5" />
            </svg>
          ),
        },
        {
          name: "Notices",
          href: "/dashboard/coming-soon",
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
              <path d="m3 11 18-5v12L3 14v-3z" />
              <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <>
      <style>{`
        @keyframes brandMountFade {
          0% {
            opacity: 0;
            transform: translateY(-8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes dropdownFadeSlide {
          0% {
            opacity: 0;
            transform: translateY(6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes ringProgress {
          0% {
            stroke-dashoffset: 100.53;
          }
          100% {
            stroke-dashoffset: 15.08;
          }
        }
        .animate-brand-mount {
          animation: brandMountFade 0.5s ease forwards;
        }
        .animate-dropdown-slide {
          animation: dropdownFadeSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-ring-progress {
          animation: ringProgress 1s ease forwards;
        }
      `}</style>

      {/* TASK 6: Mobile Hamburger Icon in Topbar on screens < 800px */}
      {!mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open Navigation Sidebar"
          className="min-[800px]:hidden fixed top-3 left-4 z-40 p-2 rounded-lg bg-white border border-[#EAECF0] text-[#101828] hover:bg-[#F1F5F9] shadow-sm flex items-center justify-center transition-all cursor-pointer"
        >
          <svg
            className="w-5 h-5 text-[#101828]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}

      {/* TASK 6: Backdrop Overlay when sidebar is open on screens < 800px */}
      {mobileOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close Navigation Sidebar Overlay"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") setMobileOpen(false);
          }}
          className="fixed inset-0 bg-black/40 z-40 min-[800px]:hidden transition-opacity duration-300"
        />
      )}

      {/* SIDEBAR MAIN CONTAINER */}
      <aside
        className={`w-[260px] min-w-[260px] bg-white border-r border-[#EAECF0] h-screen flex flex-col justify-between select-none relative overflow-hidden transition-transform duration-300 ease-in-out
          max-[799px]:fixed max-[799px]:inset-y-0 max-[799px]:left-0 max-[799px]:z-50
          ${mobileOpen ? "max-[799px]:translate-x-0 sidebar-open" : "max-[799px]:-translate-x-full"}
          min-[800px]:translate-x-0 min-[800px]:sticky min-[800px]:top-0 min-[800px]:z-20`}
      >
        {/* TASK 1: SOFT RADIAL GRADIENT BEHIND THE BRAND AREA (height 200px, absolute, pointer-events none, z-index 0) */}
        <div
          className="absolute top-0 left-0 right-0 h-[200px] pointer-events-none z-0"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, rgba(14,165,233,0.08), transparent 60%)",
          }}
        />

        {/* Top Header & Scrollable Navigation (z-index 1 above radial background) */}
        <div className="flex-1 overflow-y-auto relative z-1 scrollbar-thin scrollbar-thumb-gray-200">
          {/* TASK 1: BRAND HEADER (80px tall, 32px logo, "CVIRMS" title weight 800 #101828, fade-in mount 0.5s ease) */}
          <div className="h-[80px] border-b border-[#EAECF0] px-5 flex items-center justify-between relative bg-white/70 backdrop-blur-xs">
            <div className="animate-brand-mount flex items-center gap-3 w-full">
              <div className="relative w-8 h-8 shrink-0">
                <Image
                  src="/cvirms-logo.png"
                  alt="CVIRMS Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="font-[800] text-[16px] tracking-tight text-[#101828] leading-tight">
                  CVIRMS
                </span>
                <span className="text-[10px] font-bold text-[#0284C7] uppercase tracking-wider">
                  Member Portal
                </span>
              </div>

              {/* Close Button on Mobile inside Header */}
              {mobileOpen && (
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close Sidebar"
                  className="min-[800px]:hidden ml-auto p-1.5 rounded-lg text-[#667085] hover:bg-[#F1F5F9] hover:text-[#101828] transition-colors"
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
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* TASK 2 & 3: Grouped Navigation Items with Micro-Animations & Dividers */}
          <div className="py-4 px-3">
            {navGroups.map((group, groupIndex) => (
              <div key={group.label}>
                {/* TASK 3: Thin dashed line between nav groups (border-top: 1px dashed #EAECF0, margin: 16px 8px) */}
                {groupIndex > 0 && (
                  <div
                    className="border-t border-dashed border-[#EAECF0]"
                    style={{ margin: "16px 8px" }}
                  />
                )}

                {/* TASK 3: Section labels uppercase 10px weight 700, #98A2B3, letter-spacing 0.08em, padding 8px 10px 4px */}
                <div
                  className="text-[10px] font-bold uppercase text-[#98A2B3]"
                  style={{
                    letterSpacing: "0.08em",
                    padding: "8px 10px 4px",
                  }}
                >
                  {group.label}
                </div>

                {/* Nav Items List */}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`group relative flex items-center gap-3 px-3 py-2 text-xs rounded-lg active:scale-[0.98] ${
                          isActive
                            ? "bg-[#E0F2FE] text-[#0284C7] font-semibold"
                            : "text-[#667085] hover:bg-[#F1F5F9] hover:translate-x-[2px] font-medium"
                        }`}
                        style={{
                          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      >
                        {/* TASK 2: ACTIVE STATE Left border 3px solid #0EA5E9 with animated height 0 -> 20px via pseudo-element scaleY */}
                        <span
                          className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] bg-[#0EA5E9] rounded-r origin-center pointer-events-none ${
                            isActive
                              ? "h-[20px] scale-y-100 opacity-100"
                              : "h-0 scale-y-0 opacity-0"
                          }`}
                          style={{
                            transition:
                              "height 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                        />

                        {/* TASK 2: Icons stroke-width 2, 16px, opacity 0.8 -> 1, scales to 1.1x and changes color to #0EA5E9 on hover */}
                        <span
                          className={`shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110 ${
                            isActive
                              ? "text-[#0284C7] opacity-100"
                              : "text-[#667085] opacity-80 group-hover:opacity-100 group-hover:text-[#0EA5E9]"
                          }`}
                        >
                          {item.icon}
                        </span>

                        <span className="truncate">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM CONTAINER (TASK 5 & TASK 4) */}
        <div className="p-3 border-t border-[#EAECF0] bg-white relative z-10">
          {/* TASK 5: COMPLIANCE MINI-WIDGET (12px padding, 8px radius, bg #F8FAFC, border #EAECF0) */}
          <div className="p-3 rounded-[8px] bg-[#F8FAFC] border border-[#EAECF0] hover:bg-[#F1F5F9] transition-colors mb-3 flex items-center gap-3 cursor-default group">
            {/* 40px SVG ring (viewBox 0 0 40 40, radius 16, stroke-width 3, bg circle #EAECF0, fg circle #12B76A at 85%) */}
            <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke="#EAECF0"
                  strokeWidth="3"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke="#12B76A"
                  strokeWidth="3"
                  strokeDasharray="100.53"
                  strokeDashoffset="15.08"
                  strokeLinecap="round"
                  className="animate-ring-progress"
                />
              </svg>
              {/* Ring Center: "85" in 11px weight 700, #101828 */}
              <span className="absolute font-mono text-[11px] font-bold text-[#101828]">
                85
              </span>
            </div>

            {/* Right details: "COMPLIANCE" (10px uppercase weight 700, #98A2B3) & "Excellent" (12px weight 600, #12B76A) */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase text-[#98A2B3] tracking-wider leading-tight">
                COMPLIANCE
              </p>
              <p className="text-[12px] font-semibold text-[#12B76A] truncate leading-tight">
                Excellent
              </p>
            </div>
          </div>

          {/* TASK 4: USER PROFILE FOOTER WITH DROPDOWN */}
          <div className="relative" ref={dropdownRef}>
            {/* DROPDOWN MENU ABOVE FOOTER (position: absolute, bottom: 60px, left: 12px, right: 12px) */}
            {dropdownOpen && (
              <div
                className="fixed md:absolute bg-white rounded-[12px] shadow-lg border border-[#EAECF0] p-1.5 z-50 animate-dropdown-slide text-xs"
                style={{
                  bottom: "60px",
                  left: "12px",
                  right: "12px",
                }}
              >
                {/* User Info Header */}
                <div className="px-3 py-2 border-b border-[#EAECF0] mb-1">
                  <p className="font-bold text-[#101828] truncate">
                    {user.name || "Demo PG"}
                  </p>
                  <p className="text-[11px] text-[#667085] truncate font-medium">
                    Hotel Manager
                  </p>
                </div>

                {/* Profile Item */}
                <Link
                  href="/dashboard/coming-soon"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#344054] hover:bg-[#F7F8FA] hover:text-[#101828] transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-[#667085]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="font-medium text-xs">Profile</span>
                </Link>

                {/* Settings Item */}
                <Link
                  href="/dashboard/coming-soon"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#344054] hover:bg-[#F7F8FA] hover:text-[#101828] transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-[#667085]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span className="font-medium text-xs">Settings</span>
                </Link>

                {/* Help Item */}
                <Link
                  href="/dashboard/coming-soon"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#344054] hover:bg-[#F7F8FA] hover:text-[#101828] transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-[#667085]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span className="font-medium text-xs">Help</span>
                </Link>

                {/* Separator Line */}
                <div className="border-t border-[#EAECF0] my-1" />

                {/* Logout Button (red text, clears cvirms_token & cvirms_user, redirects to /login) */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#D92D20] hover:bg-[#FEF3F2] font-semibold text-xs transition-colors cursor-pointer"
                >
                  <svg
                    className="w-4 h-4 text-[#D92D20]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            )}

            {/* Profile Trigger Footer Button (34px circular avatar with linear-gradient(135deg, #7F56D9, #EE46BC), hover lift translateY(-1px) + shadow-sm) */}
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="w-full flex items-center gap-3 p-2 rounded-xl bg-[#F7F8FA] border border-[#EAECF0] hover:-translate-y-px hover:shadow-sm transition-all duration-200 text-left group cursor-pointer"
            >
              {/* 34px Circular Avatar with linear-gradient(135deg, #7F56D9, #EE46BC) showing user's initial uppercase */}
              <div
                className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0"
                style={{
                  background: "linear-gradient(135deg, #7F56D9, #EE46BC)",
                }}
              >
                {getAvatarInitial(user?.name)}
              </div>

              {/* User Name (13px weight 700, #101828) + Hotel Manager (11px, #667085) */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-[#101828] truncate leading-tight">
                  {user.name || "Demo PG"}
                </p>
                <p className="text-[11px] text-[#667085] truncate leading-tight">
                  Hotel Manager
                </p>
              </div>

              {/* Chevron Arrow Indicator */}
              <svg
                className={`w-3.5 h-3.5 text-[#98A2B3] transition-transform duration-200 shrink-0 ${
                  dropdownOpen
                    ? "rotate-180 text-[#0284C7]"
                    : "group-hover:text-[#101828]"
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
