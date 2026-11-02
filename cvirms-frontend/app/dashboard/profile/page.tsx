"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  user_id: string;
  role: string;
  member_type: string;
  created_at: string;
  qr_token?: string;
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Settings Toggles
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("cvirms_token")
            : null;

        const res = await fetch("http://localhost:5000/api/profile/me", {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setProfile(data.user);
            setName(data.user.name || "");
            setEmail(data.user.email || "");
            setPhone(data.user.phone || "");
          }
        }
      } catch (err) {
        console.warn("Failed to load user profile:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  // TASK 3: Auto-scroll to section if hash present in URL
  useEffect(() => {
    if (loading) return;

    const handleHashScroll = () => {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      let targetId = "";
      if (hash === "#settings-section" || hash === "#settings") {
        targetId = "settings-section";
      } else if (hash === "#help-section" || hash === "#help") {
        targetId = "help-section";
      }

      if (targetId) {
        setTimeout(() => {
          const el = document.getElementById(targetId);
          if (el) {
            const mainContainer = el.closest("main");
            if (mainContainer) {
              const mainRect = mainContainer.getBoundingClientRect();
              const elRect = el.getBoundingClientRect();
              const targetScroll = mainContainer.scrollTop + (elRect.top - mainRect.top) - 80;
              mainContainer.scrollTo({
                top: Math.max(0, targetScroll),
                behavior: "smooth",
              });
            }
            window.scrollTo({
              top: el.offsetTop - 80,
              behavior: "smooth",
            });
          }
        }, 100);
      }
    };

    handleHashScroll();
    window.addEventListener("hashchange", handleHashScroll);
    return () => window.removeEventListener("hashchange", handleHashScroll);
  }, [loading]);

  const handleCancel = () => {
    if (profile) {
      setName(profile.name || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Full name cannot be blank", "error");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showToast("Please enter a valid email address", "error");
      return;
    }

    try {
      setSaving(true);
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("cvirms_token")
          : null;

      const res = await fetch("http://localhost:5000/api/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProfile(data.user);
        setName(data.user.name);
        setEmail(data.user.email);
        setPhone(data.user.phone);

        // Update localStorage
        try {
          const existingUser = localStorage.getItem("cvirms_user");
          const parsed = existingUser ? JSON.parse(existingUser) : {};
          const updated = { ...parsed, ...data.user };
          localStorage.setItem("cvirms_user", JSON.stringify(updated));
          // Notify any listening components
          window.dispatchEvent(new Event("storage"));
        } catch {
          // Ignore storage error
        }

        showToast("Profile updated successfully", "success");
      } else {
        showToast(data.message || "Failed to update profile", "error");
      }
    } catch {
      showToast("Network error while updating profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const getInitial = (userName?: string): string => {
    if (!userName) return "U";
    return userName.trim().charAt(0).toUpperCase();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "13 May 2026";
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

      <div className="space-y-6 max-w-5xl">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#101828] tracking-tight">
            My Profile
          </h1>
          <p className="text-sm text-[#667085] mt-1">
            Manage your account information and preferences
          </p>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#667085] space-y-3">
            <svg className="w-8 h-8 animate-spin text-[#0EA5E9]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-xs font-medium">Loading profile details...</p>
          </div>
        ) : (
          <>
            {/* Top Row: Left Profile Card + Right Edit Form */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: Profile Card (max-w-[400px], 4 or 5 cols) */}
              <div className="md:col-span-4 bg-white rounded-[16px] border border-[#EAECF0] shadow-sm p-6 text-center space-y-4">
                {/* 80px Circular Avatar with Purple -> Pink Gradient */}
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#9333EA] to-[#EC4899] flex items-center justify-center text-white text-[32px] font-bold shadow-md">
                    {getInitial(profile?.name)}
                  </div>
                </div>

                {/* User Name & Badges */}
                <div className="space-y-1.5">
                  <h2 className="text-[18px] font-bold text-[#101828]">
                    {profile?.name || "Demo Establishment"}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] bg-[#F2F4F7] px-2.5 py-0.5 rounded-full">
                      {profile?.role === "member" ? "Hotel Manager" : profile?.role || "Manager"}
                    </span>
                    <span className="text-[12px] font-bold bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD] px-2.5 py-0.5 rounded-full capitalize">
                      {profile?.member_type === "pg"
                        ? "PG"
                        : profile?.member_type === "hotel"
                        ? "Hotel"
                        : profile?.member_type || "Lodge"}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[#EAECF0] pt-4" />

                {/* Read-Only Info List */}
                <div className="text-left space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#667085] font-medium text-[12px]">User ID</span>
                    <span className="font-mono text-[#101828] font-bold text-[13px]">
                      {profile?.user_id || "demopg"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#667085] font-medium text-[12px]">Phone</span>
                    <span className="font-mono text-[#101828] text-[13px]">
                      {profile?.phone ? `+91 ${profile.phone}` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#667085] font-medium text-[12px]">Joined</span>
                    <span className="font-mono text-[#101828] text-[13px]">
                      {formatDate(profile?.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Edit Form Card */}
              <div className="md:col-span-8 bg-white rounded-[16px] border border-[#EAECF0] shadow-sm p-6 sm:p-7 space-y-6">
                <div>
                  <h3 className="text-[16px] font-bold text-[#101828]">
                    Edit Profile
                  </h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Update your official establishment contact details
                  </p>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-[#344054] mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Demo PG"
                      className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-[#D0D5DD] bg-white text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-[#344054] mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. manager@hotel.com"
                      className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-[#D0D5DD] bg-white text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] transition-all"
                    />
                  </div>

                  {/* Phone Number (Read-only with OTP Change hint) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-[#344054]">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] font-bold text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded">
                        Change via OTP
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-mono text-[#667085]">
                        +91
                      </span>
                      <input
                        type="text"
                        disabled
                        value={phone}
                        className="w-full pl-12 pr-3.5 py-2.5 text-xs font-mono rounded-lg border border-[#EAECF0] bg-[#F7F8FA] text-[#667085] cursor-not-allowed select-none"
                      />
                    </div>
                    <p className="text-[11px] text-[#667085] mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-[#98A2B3] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span>To change your registered phone number, please contact support.</span>
                    </p>
                  </div>

                  {/* Buttons Row */}
                  <div className="pt-3 flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white text-xs font-bold shadow-xs hover:brightness-105 active:scale-[0.98] disabled:opacity-60 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {saving ? (
                        <>
                          <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <span>Save Changes</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2.5 rounded-lg border border-[#D0D5DD] bg-white text-[#344054] text-xs font-semibold hover:bg-[#F9FAFB] active:scale-[0.98] transition-all cursor-pointer shadow-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Bottom Row: Additional Cards (Settings + Help & Support) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* CARD A: Settings */}
              <div
                id="settings-section"
                style={{ scrollMarginTop: "80px" }}
                className="scroll-mt-[80px] bg-white rounded-[16px] border border-[#EAECF0] shadow-sm p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] flex items-center justify-center">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#101828]">Settings</h4>
                      <p className="text-[11px] text-[#667085]">Notification & alert preferences</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#667085] bg-[#F2F4F7] px-2 py-0.5 rounded-full">
                    Preferences
                  </span>
                </div>

                <div className="space-y-3 pt-2">
                  {/* Email Notifications Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-[#EAECF0] bg-[#F7F8FA]">
                    <div>
                      <p className="text-xs font-semibold text-[#101828]">Email Notifications</p>
                      <p className="text-[11px] text-[#667085]">Receive monthly compliance reminders</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        emailNotifications ? "bg-[#0EA5E9]" : "bg-[#D0D5DD]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          emailNotifications ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* SMS Alerts Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-[#EAECF0] bg-[#F7F8FA]">
                    <div>
                      <p className="text-xs font-semibold text-[#101828]">SMS Alerts</p>
                      <p className="text-[11px] text-[#667085]">Urgent police notices and alerts</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSmsAlerts(!smsAlerts)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        smsAlerts ? "bg-[#0EA5E9]" : "bg-[#D0D5DD]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          smsAlerts ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-[11px] text-[#98A2B3] italic pt-1">
                    Additional security & 2FA preferences coming in next release.
                  </p>
                </div>
              </div>

              {/* CARD B: Help & Support */}
              <div
                id="help-section"
                style={{ scrollMarginTop: "80px" }}
                className="scroll-mt-[80px] bg-white rounded-[16px] border border-[#EAECF0] shadow-sm p-6 space-y-4"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] flex items-center justify-center">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#101828]">Help & Support</h4>
                    <p className="text-[11px] text-[#667085]">Documentation and assistance</p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  {/* Documentation */}
                  <a
                    href="https://github.com/Suhas570/cvirms-app#readme"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-[#EAECF0] hover:bg-[#F9FAFB] hover:border-[#D0D5DD] transition-all text-xs font-semibold text-[#344054] group"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#0284C7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                        <path d="M6 6h10" />
                        <path d="M6 10h10" />
                      </svg>
                      <span>CVIRMS Documentation</span>
                    </span>
                    <svg className="w-4 h-4 text-[#98A2B3] group-hover:text-[#0284C7] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>

                  {/* Contact Support */}
                  <a
                    href="mailto:support@cvirms.in?subject=CVIRMS%20Support%20Request"
                    className="flex items-center justify-between p-3 rounded-xl border border-[#EAECF0] hover:bg-[#F9FAFB] hover:border-[#D0D5DD] transition-all text-xs font-semibold text-[#344054] group"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#0284C7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      <span>Contact Support</span>
                    </span>
                    <span className="text-[11px] font-mono text-[#667085]">support@cvirms.in</span>
                  </a>

                  {/* Report a Bug */}
                  <a
                    href="mailto:bugs@cvirms.in?subject=CVIRMS%20Bug%20Report"
                    className="flex items-center justify-between p-3 rounded-xl border border-[#EAECF0] hover:bg-[#F9FAFB] hover:border-[#D0D5DD] transition-all text-xs font-semibold text-[#344054] group"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#D92D20]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m8 2 1.88 1.88" />
                        <path d="M14.12 3.88 16 2" />
                        <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
                        <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
                        <path d="M12 20v-9" />
                        <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
                        <path d="M6 13H2" />
                        <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
                        <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
                        <path d="M22 13h-4" />
                        <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
                      </svg>
                      <span>Report a Bug</span>
                    </span>
                    <span className="text-[11px] font-mono text-[#667085]">bugs@cvirms.in</span>
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
