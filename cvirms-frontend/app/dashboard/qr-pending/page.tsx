"use client";

import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";

interface PendingGuest {
  id: number;
  user_id: number;
  guest_name: string;
  contact_number?: string;
  id_proof_type: string;
  id_proof_number: string;
  purpose_of_visit?: string;
  room_number?: string;
  check_in_date: string;
  created_at: string;
  qr_code_string: string;
  status?: string;
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

export default function QrPendingPage() {
  const [pendingList, setPendingList] = useState<PendingGuest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Reject Confirmation Modal State
  const [guestToReject, setGuestToReject] = useState<PendingGuest | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const getRelativeTime = (dateString: string): string => {
    try {
      const diff = Date.now() - new Date(dateString).getTime();
      const seconds = Math.floor(diff / 1000);
      if (seconds < 10) return "Just now";
      if (seconds < 60) return `${seconds}s ago`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
      const days = Math.floor(hours / 24);
      return `${days} day${days === 1 ? "" : "s"} ago`;
    } catch {
      return "Recently";
    }
  };

  const formatTimestamp = (dateString: string): string => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateString;
    }
  };

  const getInitials = (name: string): string => {
    if (!name) return "G";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const fetchPending = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("cvirms_token")
          : null;

      const res = await fetch("http://localhost:5000/api/qr/pending", {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setPendingList(data.pending || data.guests || []);
      }
    } catch (err) {
      console.warn("Failed to fetch pending QR list:", err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  // Polling every 10 seconds
  useEffect(() => {
    fetchPending();
    const interval = setInterval(() => {
      fetchPending();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchPending]);

  // Handle Approve
  const handleApprove = async (id: number) => {
    try {
      setActionLoadingId(id);
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("cvirms_token")
          : null;

      const res = await fetch(`http://localhost:5000/api/qr/approve/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Visitor approved successfully", "success");
        await fetchPending(true);
      } else {
        showToast(data.message || "Failed to approve visitor", "error");
      }
    } catch {
      showToast("Network error while approving visitor", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Confirm Reject
  const handleConfirmReject = async () => {
    if (!guestToReject) return;
    const id = guestToReject.id;

    try {
      setActionLoadingId(id);
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("cvirms_token")
          : null;

      const res = await fetch(`http://localhost:5000/api/qr/reject/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Visitor rejected", "success");
        setGuestToReject(null);
        await fetchPending(true);
      } else {
        showToast(data.message || "Failed to reject visitor", "error");
      }
    } catch {
      showToast("Network error while rejecting visitor", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <DashboardLayout>
      {/* Toast Notification Container */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-200 ${
              toast.type === "success"
                ? "bg-[#ECFDF3] border-[#ABEFC6] text-[#027A48]"
                : "bg-[#FEF3F2] border-[#FECDCA] text-[#B42318]"
            }`}
          >
            {toast.type === "success" ? (
              <svg className="w-4 h-4 shrink-0 text-[#12B76A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0 text-[#F04438]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Reject Confirmation Modal */}
      {guestToReject && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] border border-[#EAECF0] shadow-xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-[#FEF3F2] border border-[#FECDCA] text-[#D92D20] flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#101828]">Reject Visitor Registration?</h3>
              <p className="text-xs text-[#667085] mt-1 leading-relaxed">
                Are you sure you want to reject <span className="font-bold text-[#101828]">{guestToReject.guest_name}</span>? This record will be permanently dismissed from your approval queue.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setGuestToReject(null)}
                className="px-4 py-2 rounded-lg border border-[#D0D5DD] bg-white text-[#344054] text-xs font-semibold hover:bg-[#F9FAFB] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoadingId === guestToReject.id}
                className="px-4 py-2 rounded-lg bg-[#D92D20] text-white text-xs font-bold hover:bg-[#B42318] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoadingId === guestToReject.id ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#101828] tracking-tight">
              Pending QR Approvals
            </h1>
            <p className="text-sm text-[#667085] mt-1">
              Review and approve visitor self-registrations
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[16px] border border-[#EAECF0] shadow-sm overflow-hidden">
          {/* Card Title Bar */}
          <div className="p-4 sm:p-5 border-b border-[#EAECF0] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold text-[#101828]">
                Pending Approvals ({pendingList.length})
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] animate-pulse" />
                Auto-refresh: 10s
              </span>
            </div>

            <button
              onClick={() => fetchPending(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D0D5DD] bg-white text-xs font-semibold text-[#344054] hover:bg-[#F9FAFB] active:scale-[0.98] transition-all cursor-pointer shadow-xs disabled:opacity-60"
            >
              <svg
                className={`w-3.5 h-3.5 text-[#667085] ${refreshing ? "animate-spin" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>

          {/* Table / Empty State */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-[#667085] space-y-3">
              <svg
                className="w-8 h-8 animate-spin text-[#0EA5E9]"
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
              <p className="text-xs font-medium">Loading pending self-registrations...</p>
            </div>
          ) : pendingList.length === 0 ? (
            /* Friendly Empty State */
            <div className="py-20 px-4 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#ECFDF3] border border-[#ABEFC6] text-[#027A48] mx-auto flex items-center justify-center shadow-xs">
                <svg
                  className="w-7 h-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-[#101828]">All caught up!</h2>
              <p className="text-xs text-[#667085] max-w-sm mx-auto">
                No pending approvals. New self-registrations will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-[#EAECF0] text-[11px] font-bold text-[#667085] uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">S.No</th>
                    <th className="py-3 px-4">Visitor</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">ID Proof</th>
                    <th className="py-3 px-4">Purpose</th>
                    <th className="py-3 px-4">Submitted</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAECF0] text-xs">
                  {pendingList.map((guest, idx) => (
                    <tr
                      key={guest.id}
                      className="hover:bg-sky-50/30 transition-colors"
                    >
                      {/* S.No */}
                      <td className="py-3.5 px-4 font-mono text-center text-[#667085] text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Visitor */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0284C7] to-[#0EA5E9] flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-xs">
                            {getInitials(guest.guest_name)}
                          </div>
                          <div>
                            <p className="font-bold text-[#101828] text-[13px] leading-tight">
                              {guest.guest_name}
                            </p>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#0284C7] bg-[#E0F2FE] px-1.5 py-0.5 rounded-sm mt-0.5">
                              QR Self-Registered
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 font-mono text-xs text-[#475467]">
                        {guest.contact_number ? `+91 ${guest.contact_number}` : "—"}
                      </td>

                      {/* ID Proof */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs text-[#101828] font-medium">
                          {guest.id_proof_number}
                        </div>
                        <div className="text-[11px] text-[#667085]">
                          {guest.id_proof_type}
                        </div>
                      </td>

                      {/* Purpose */}
                      <td className="py-3.5 px-4 text-xs text-[#344054]">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F2F4F7] text-[#344054] border border-[#EAECF0]">
                          {guest.purpose_of_visit || "General"}
                        </span>
                      </td>

                      {/* Submitted */}
                      <td className="py-3.5 px-4">
                        <span
                          className="font-mono text-xs text-[#475467] block"
                          title={formatTimestamp(guest.created_at)}
                        >
                          {getRelativeTime(guest.created_at)}
                        </span>
                        <span className="text-[10px] text-[#98A2B3] block">
                          {formatTimestamp(guest.created_at)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {/* Approve Button */}
                          <button
                            type="button"
                            onClick={() => handleApprove(guest.id)}
                            disabled={actionLoadingId === guest.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-[#12B76A] hover:bg-[#027A48] text-white text-xs font-bold shadow-xs active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
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
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>
                              {actionLoadingId === guest.id ? "..." : "Approve"}
                            </span>
                          </button>

                          {/* Reject Button */}
                          <button
                            type="button"
                            onClick={() => setGuestToReject(guest)}
                            disabled={actionLoadingId === guest.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] border border-[#FDA29B] bg-white text-[#D92D20] text-xs font-bold hover:bg-[#FEF3F2] active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
                          >
                            <svg
                              className="w-3.5 h-3.5"
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
                            <span>Reject</span>
                          </button>
                        </div>
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
