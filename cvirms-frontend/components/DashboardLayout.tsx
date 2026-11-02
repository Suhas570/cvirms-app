"use client";

import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ProtectedRoute from "./ProtectedRoute";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen w-full bg-[#F7F8FA] overflow-hidden font-sans text-[#101828]">
        {/* Fixed/Sticky Sidebar (260px) */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* Topbar (60px) */}
          <Topbar />

          {/* Scrollable Children Canvas with 24px (p-6) padding */}
          <main className="flex-1 overflow-y-auto p-6 bg-[#F7F8FA]">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
