"use client";

import React, { useEffect, useRef } from "react";

export default function Topbar() {
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="h-[60px] bg-white border-b border-[#EAECF0] px-6 flex items-center justify-between sticky top-0 z-10 select-none">
      {/* Left: Search Box (340px) with ⌘K Badge */}
      <div className="relative w-[340px]">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#98A2B3]">
          {/* Magnifying Glass SVG */}
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" x2="16.65" y1="21" y2="16.65" />
          </svg>
        </div>

        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search visitors, employees, records..."
          className="w-full h-9 pl-9 pr-12 text-xs bg-[#F7F8FA] border border-[#EAECF0] rounded-lg text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9] transition-all"
        />

        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
          <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#667085] bg-white border border-[#D0D5DD] rounded shadow-2xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Notification, Settings, Help SVG Icons */}
      <div className="flex items-center gap-2 text-[#667085]">
        {/* Help Circle Icon */}
        <button
          type="button"
          aria-label="Help"
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#F7F8FA] hover:text-[#101828] transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" x2="12.01" y1="17" y2="17" />
          </svg>
        </button>

        {/* Settings Icon */}
        <button
          type="button"
          aria-label="Settings"
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#F7F8FA] hover:text-[#101828] transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>

        {/* Bell Icon with Red Dot */}
        <button
          type="button"
          aria-label="Notifications"
          className="w-9 h-9 relative flex items-center justify-center rounded-lg hover:bg-[#F7F8FA] hover:text-[#101828] transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          {/* Notification Alert Dot */}
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#F04438] rounded-full ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}
