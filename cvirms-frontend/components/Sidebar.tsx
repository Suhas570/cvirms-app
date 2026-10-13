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
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("cvirms_user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // Fallback
    }
  }, []);

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

  const handleLogout = () => {
    try {
      localStorage.removeItem("cvirms_token");
      localStorage.removeItem("cvirms_user");
    } catch {
      // Ignore
    }
    router.push("/login");
  };

  const getInitial = (name: string) => {
    if (!name) return "D";
    return name.trim()[0].toUpperCase();
  };

  const navGroups = [
    {
      label: "OVERVIEW",
      items: [
        {
          name: "Dashboard",
          href: "/dashboard",
          icon: (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          name: "Add Tenant",
          href: "/dashboard/add-tenant",
          icon: (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" x2="19" y1="8" y2="14" />
              <line x1="22" x2="16" y1="11" y2="11" />
            </svg>
          ),
        },
        {
          name: "Add Employee",
          href: "/dashboard/coming-soon",
          icon: (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          ),
        },
        {
          name: "Add Foreigner",
          href: "/dashboard/coming-soon",
          icon: (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          href: "/dashboard/coming-soon",
          icon: (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
        },
        {
          name: "Foreigner List",
          href: "/dashboard/coming-soon",
          icon: (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <svg className="w-4 h-4 shrink-0 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <svg className="w-4 h-4 shrink-0 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        @keyframes activeBorderSlide {
          0% {
            height: 0px;
          }
          100% {
            height: 20px;
          }
        }
        .animate-brand-mount {
          animation: brandMountFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-border-slide {
          animation: activeBorderSlide 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>

      <aside className="w-[260px] min-w-[260px] bg-white border-r border-[#EAECF0] h-screen sticky top-0 flex flex-col justify-between select-none z-20 relative overflow-hidden">
        {/* 6. SUBTLE BACKGROUND TOUCH (Radial Gradient at Top: 200px, z-0) */}
        <div
          className="absolute top-0 left-0 right-0 h-[200px] pointer-events-none z-0"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, rgba(14, 165, 233, 0.08) 0%, transparent 60%)",
          }}
        />

        {/* Top Header & Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-gray-200">
          {/* 1. BRAND HEADER (80px tall with mount animation & soft radial glow) */}
          <div
            className="h-20 border-b border-[#EAECF0] px-5 flex items-center gap-3 relative overflow-hidden bg-white/80 backdrop-blur-xs"
            style={{
              background:
                "radial-gradient(200px circle at 50% 30%, rgba(14, 165, 233, 0.08), transparent 70%)",
            }}
          >
            <div className="animate-brand-mount flex items-center gap-3 w-full">
              <div className="relative w-8 h-8 shrink-0 drop-shadow-2xs">
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
                <span className="font-extrabold text-[16px] tracking-tight text-[#101828] leading-tight">
                  CVIRMS
                </span>
                <span className="text-[10px] font-bold text-[#0284C7] uppercase tracking-wider">
                  Member Portal
                </span>
              </div>
            </div>
          </div>

          {/* Grouped Navigation with 2. MICRO-ANIMATIONS & 3. SECTION DIVIDERS */}
          <div className="py-4 px-3">
            {navGroups.map((group, groupIndex) => (
              <div key={group.label}>
                {/* 3. Section Dashed Divider between groups */}
                {groupIndex > 0 && (
                  <div className="my-4 border-t border-dashed border-[#EAECF0]" />
                )}

                {/* Section Header */}
                <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#98A2B3]">
                  {group.label}
                </div>

                {/* Nav Items */}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`group relative flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] active:scale-[0.98] ${
                          isActive
                            ? "bg-[#E0F2FE] text-[#0284C7] font-bold shadow-2xs"
                            : "text-[#667085] hover:bg-[#F1F5F9] hover:text-[#101828] hover:translate-x-[2px]"
                        }`}
                      >
                        {/* Animated Left Border (0 -> 20px) on Active */}
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] bg-[#0EA5E9] rounded-r animate-border-slide h-5" />
                        )}

                        {/* Nav Icon (Scale 1.1x and Turn #0EA5E9 on Hover) */}
                        <span
                          className={`shrink-0 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110 ${
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

        {/* Bottom Section: 5. Compliance Mini-Widget + 4. User Profile Footer */}
        <div className="p-3 border-t border-[#EAECF0] bg-white relative z-20">
          {/* 5. COMPLIANCE MINI-WIDGET */}
          <div className="p-3 rounded-[8px] bg-[#F8FAFC] border border-[#EAECF0] hover:bg-[#F1F5F9] transition-colors mb-3 flex items-center gap-3 cursor-default group">
            {/* 40px SVG Ring Gauge (radius 16, stroke 3, 85%) */}
            <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
              <svg className="w-10 h-10 -rotate-90">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke="#E2E8F0"
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
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span className="absolute font-mono text-[10px] font-bold text-[#101828]">
                85%
              </span>
            </div>

            {/* Widget Text */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                Compliance
              </p>
              <p className="text-[12px] font-semibold text-[#12B76A] truncate">
                85% Excellent
              </p>
            </div>
          </div>

          {/* 4. USER PROFILE FOOTER WITH DROPDOWN POPOVER */}
          <div className="relative" ref={dropdownRef}>
            {/* Popover Dropdown (appears above footer on click) */}
            {dropdownOpen && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-[#EAECF0] rounded-[12px] shadow-lg p-1.5 z-50 animate-fade-in text-xs">
                <div className="px-3 py-2 border-b border-[#EAECF0] mb-1">
                  <p className="font-bold text-[#101828] truncate">{user.name || "Demo PG"}</p>
                  <p className="text-[10px] text-[#667085] truncate font-mono">Member Account</p>
                </div>

                <Link
                  href="/dashboard/coming-soon"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#344054] hover:bg-[#F7F8FA] hover:text-[#101828] transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-[#667085]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Profile</span>
                </Link>

                <Link
                  href="/dashboard/coming-soon"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#344054] hover:bg-[#F7F8FA] hover:text-[#101828] transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-[#667085]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span>Settings</span>
                </Link>

                <Link
                  href="/dashboard/coming-soon"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#344054] hover:bg-[#F7F8FA] hover:text-[#101828] transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-[#667085]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span>Help</span>
                </Link>

                <div className="border-t border-[#EAECF0] my-1" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#D92D20] hover:bg-[#FEF3F2] font-semibold transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-[#D92D20]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            )}

            {/* Profile Trigger Button (34px purple-pink avatar with "D", hover lift) */}
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="w-full flex items-center gap-3 p-2 rounded-xl bg-[#F7F8FA] border border-[#EAECF0] hover:-translate-y-[1px] hover:shadow-xs transition-all duration-200 text-left group"
            >
              {/* 34px Circular Avatar with Purple #7F56D9 -> Pink #EE46BC gradient */}
              <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-tr from-[#7F56D9] to-[#EE46BC] flex items-center justify-center text-white text-xs font-black shadow-xs shrink-0">
                {getInitial(user.name || "Demo PG")}
              </div>

              {/* User details */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-[#101828] truncate">
                  {user.name || "Demo PG"}
                </p>
                <p className="text-[11px] text-[#667085] truncate font-medium">
                  Hotel Manager
                </p>
              </div>

              {/* Chevron Indicator */}
              <svg
                className={`w-3.5 h-3.5 text-[#98A2B3] transition-transform duration-200 shrink-0 ${
                  dropdownOpen ? "rotate-180 text-[#0284C7]" : "group-hover:text-[#101828]"
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
