"use client";

import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";

interface Notice {
  id: number;
  title: string;
  message: string;
  date_posted: string;
  expiry_date: string | null;
  is_archived: boolean;
}

export default function NoticesPage() {
  const [activeTab, setActiveTab] = useState<"current" | "archived">("current");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const fetchNotices = useCallback(async (filterType: "current" | "archived") => {
    try {
      setLoading(true);
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("cvirms_token")
          : null;

      const res = await fetch(`http://localhost:5000/api/notices?filter=${filterType}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setNotices(data.notices || []);
      }
    } catch (err) {
      console.warn("Failed to fetch notices:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices(activeTab);
  }, [activeTab, fetchNotices]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Indefinite";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const truncateMessage = (text: string, maxLen = 80) => {
    if (!text) return "";
    return text.length > maxLen ? `${text.slice(0, maxLen).trim()}...` : text;
  };

  return (
    <DashboardLayout>
      {/* Notice View Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] border border-[#EAECF0] shadow-xl max-w-[600px] w-full p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded-full inline-block mb-1">
                    Police Circular
                  </span>
                  <h2 className="text-[20px] font-extrabold text-[#101828] leading-tight">
                    {selectedNotice.title}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                aria-label="Close modal"
                className="p-1 rounded-lg text-[#98A2B3] hover:text-[#101828] hover:bg-[#F2F4F7] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Dates Bar */}
            <div className="flex flex-wrap items-center gap-4 py-2.5 px-4 bg-[#F7F8FA] rounded-xl border border-[#EAECF0] text-xs font-mono text-[#667085]">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[#344054]">Posted:</span>
                <span>{formatDate(selectedNotice.date_posted)}</span>
              </div>
              <span className="text-[#D0D5DD]">•</span>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[#344054]">Expires:</span>
                <span>{formatDate(selectedNotice.expiry_date)}</span>
              </div>
              {selectedNotice.is_archived && (
                <>
                  <span className="text-[#D0D5DD]">•</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]">
                    Archived
                  </span>
                </>
              )}
            </div>

            {/* Full Message */}
            <div className="py-2">
              <p className="text-[14px] text-[#344054] leading-[1.6] whitespace-pre-wrap">
                {selectedNotice.message}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-[#EAECF0] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                className="px-5 py-2.5 rounded-lg border border-[#D0D5DD] bg-white text-[#344054] text-xs font-semibold hover:bg-[#F9FAFB] active:scale-[0.98] transition-all shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#101828] tracking-tight">
            Notices & Circulars
          </h1>
          <p className="text-sm text-[#667085] mt-1">
            Official communications from the Police Department
          </p>
        </div>

        {/* Tabs Control */}
        <div className="flex items-center gap-2 p-1 bg-[#F2F4F7] rounded-xl w-fit border border-[#EAECF0]">
          <button
            type="button"
            onClick={() => setActiveTab("current")}
            className={`px-4 py-2 text-xs rounded-lg transition-all font-semibold flex items-center gap-1.5 cursor-pointer ${
              activeTab === "current"
                ? "bg-white text-[#0284C7] shadow-xs"
                : "text-[#667085] hover:text-[#101828]"
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            <span>Current</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("archived")}
            className={`px-4 py-2 text-xs rounded-lg transition-all font-semibold flex items-center gap-1.5 cursor-pointer ${
              activeTab === "archived"
                ? "bg-white text-[#0284C7] shadow-xs"
                : "text-[#667085] hover:text-[#101828]"
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 8 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
            </svg>
            <span>Archived</span>
          </button>
        </div>

        {/* Notices Card */}
        <div className="bg-white rounded-[16px] border border-[#EAECF0] shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-[#667085] space-y-3">
              <svg className="w-8 h-8 animate-spin text-[#0EA5E9]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-xs font-medium">Loading circulars & directives...</p>
            </div>
          ) : notices.length === 0 ? (
            /* Empty States */
            <div className="py-20 px-4 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] mx-auto flex items-center justify-center shadow-xs">
                {activeTab === "current" ? (
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 8 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                  </svg>
                )}
              </div>
              <h2 className="text-base font-bold text-[#101828]">
                {activeTab === "current" ? "No current notices" : "No archived notices"}
              </h2>
              <p className="text-xs text-[#667085] max-w-sm mx-auto">
                {activeTab === "current"
                  ? "You're all caught up. New police notices will be displayed here."
                  : "Expired or archived police circulars will appear here."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-[#EAECF0] text-[11px] font-bold text-[#667085] uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">S.No</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Message</th>
                    <th className="py-3 px-4">Posted</th>
                    <th className="py-3 px-4">Expiry</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAECF0] text-xs">
                  {notices.map((notice, idx) => (
                    <tr
                      key={notice.id}
                      className="hover:bg-sky-50/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedNotice(notice)}
                    >
                      {/* S.No */}
                      <td className="py-3.5 px-4 font-mono text-center text-[#667085] text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[13px] text-[#101828] group-hover:text-[#0284C7] transition-colors leading-tight block">
                          {notice.title}
                        </span>
                      </td>

                      {/* Message (truncated 80 chars) */}
                      <td className="py-3.5 px-4 text-[#667085] max-w-xs">
                        <span className="line-clamp-1 block text-xs">
                          {truncateMessage(notice.message, 80)}
                        </span>
                      </td>

                      {/* Posted */}
                      <td className="py-3.5 px-4 font-mono text-xs text-[#475467] whitespace-nowrap">
                        {formatDate(notice.date_posted)}
                      </td>

                      {/* Expiry */}
                      <td className="py-3.5 px-4 font-mono text-xs text-[#475467] whitespace-nowrap">
                        {formatDate(notice.expiry_date)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNotice(notice);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D0D5DD] bg-white text-xs font-semibold text-[#0284C7] hover:bg-[#E0F2FE] hover:border-[#BAE6FD] active:scale-[0.98] transition-all cursor-pointer shadow-xs"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
