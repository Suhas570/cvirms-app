"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";

interface FormErrors {
  [key: string]: string;
}

export default function AddTenantPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    contact_number: "",
    number_of_guests: "1",
    id_proof_type: "Aadhaar Card",
    id_proof_number: "",
    room_number: "",
    check_in_date: new Date().toISOString().split("T")[0],
    check_out_date: "",
    purpose_of_visit: "Business",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-level error on change
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};

    if (!formData.first_name.trim()) {
      errs.first_name = "First name is required";
    }
    if (!formData.last_name.trim()) {
      errs.last_name = "Last name is required";
    }
    if (!formData.contact_number.trim()) {
      errs.contact_number = "Contact number is required";
    } else if (
      !/^[0-9+\s-]{10,15}$/.test(formData.contact_number.trim())
    ) {
      errs.contact_number = "Contact number must be 10 digits";
    }
    if (!formData.id_proof_type.trim()) {
      errs.id_proof_type = "ID proof type is required";
    }
    if (!formData.id_proof_number.trim()) {
      errs.id_proof_number = "ID proof number is required";
    }
    if (!formData.room_number.trim()) {
      errs.room_number = "Room number is required";
    }
    if (!formData.check_in_date) {
      errs.check_in_date = "Check-in date is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("cvirms_token")
          : null;

      const response = await fetch("http://localhost:5000/api/guests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        }
        setApiError(
          data.message || "Failed to register tenant. Please check inputs."
        );
        setIsSubmitting(false);
        return;
      }

      // Success toast
      setShowToast(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection error";
      setApiError(`Network error: ${msg}. Make sure backend is running.`);
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-[900px] mx-auto space-y-6 animate-fade-in pb-12">
        {/* Toast Notification */}
        {showToast && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-emerald-600 text-white rounded-xl shadow-lg animate-slide-up">
            <svg
              className="w-5 h-5 text-white shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <div>
              <p className="text-xs font-bold leading-tight">Success</p>
              <p className="text-xs text-emerald-100 font-medium">
                Tenant registered successfully. Redirecting...
              </p>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-[#101828] tracking-tight">
            Add New Tenant
          </h1>
          <p className="text-xs text-[#667085] mt-1 font-medium">
            Register a new visitor into the CVIRMS system
          </p>
        </div>

        {/* Top API Error Banner */}
        {apiError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 animate-fade-in text-xs">
            <svg
              className="w-4 h-4 text-red-500 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="font-semibold">{apiError}</p>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-[#EAECF0] shadow-sm p-7">
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* SECTION 1: PERSONAL DETAILS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 text-[#0284C7]">
                <svg
                  className="w-4 h-4 shrink-0"
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
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#101828]">
                  Personal Details
                </h2>
              </div>

              {/* Row 1 (3 cols): First Name | Middle Name | Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-lg text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all ${
                      errors.first_name
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#D0D5DD] focus:border-[#0EA5E9]"
                    }`}
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-[12px] text-red-500 font-medium">
                      {errors.first_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="middle_name"
                    value={formData.middle_name}
                    onChange={handleChange}
                    placeholder="e.g., Kumar"
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D0D5DD] rounded-lg text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-lg text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all ${
                      errors.last_name
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#D0D5DD] focus:border-[#0EA5E9]"
                    }`}
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-[12px] text-red-500 font-medium">
                      {errors.last_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2 (2 cols): Contact Number | Number of Guests */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleChange}
                    placeholder="e.g., 98765 43210"
                    className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-lg text-[#101828] placeholder-[#98A2B3] font-mono focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all ${
                      errors.contact_number
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#D0D5DD] focus:border-[#0EA5E9]"
                    }`}
                  />
                  {errors.contact_number && (
                    <p className="mt-1 text-[12px] text-red-500 font-medium">
                      {errors.contact_number}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Number of Guests <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="number_of_guests"
                    value={formData.number_of_guests}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D0D5DD] rounded-lg text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9] transition-all"
                  >
                    <option value="1">1 Guest</option>
                    <option value="2">2 Guests</option>
                    <option value="3">3 Guests</option>
                    <option value="4">4+ Guests</option>
                  </select>
                </div>
              </div>
            </div>

            {/* DASHED DIVIDER */}
            <div className="border-t border-dashed border-[#EAECF0]" />

            {/* SECTION 2: ID VERIFICATION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 text-[#0284C7]">
                <svg
                  className="w-4 h-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#101828]">
                  ID Verification
                </h2>
              </div>

              {/* Row (2 cols): ID Proof Type | ID Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    ID Proof Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="id_proof_type"
                    value={formData.id_proof_type}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D0D5DD] rounded-lg text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9] transition-all"
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                  </select>
                  {errors.id_proof_type && (
                    <p className="mt-1 text-[12px] text-red-500 font-medium">
                      {errors.id_proof_type}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    ID Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="id_proof_number"
                    value={formData.id_proof_number}
                    onChange={handleChange}
                    placeholder="e.g., 1234-5678-9012"
                    className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-lg text-[#101828] placeholder-[#98A2B3] font-mono focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all ${
                      errors.id_proof_number
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#D0D5DD] focus:border-[#0EA5E9]"
                    }`}
                  />
                  {errors.id_proof_number && (
                    <p className="mt-1 text-[12px] text-red-500 font-medium">
                      {errors.id_proof_number}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* DASHED DIVIDER */}
            <div className="border-t border-dashed border-[#EAECF0]" />

            {/* SECTION 3: STAY DETAILS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 text-[#0284C7]">
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
                  <path d="M12 6h.01" />
                  <path d="M12 10h.01" />
                  <path d="M12 14h.01" />
                  <path d="M16 10h.01" />
                  <path d="M16 14h.01" />
                  <path d="M8 10h.01" />
                  <path d="M8 14h.01" />
                </svg>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#101828]">
                  Stay Details
                </h2>
              </div>

              {/* Row 1 (3 cols): Room Number | Check-in Date | Expected Check-out */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Room Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="room_number"
                    value={formData.room_number}
                    onChange={handleChange}
                    placeholder="e.g., 204"
                    className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-lg text-[#101828] placeholder-[#98A2B3] font-mono focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all ${
                      errors.room_number
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#D0D5DD] focus:border-[#0EA5E9]"
                    }`}
                  />
                  {errors.room_number && (
                    <p className="mt-1 text-[12px] text-red-500 font-medium">
                      {errors.room_number}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Check-in Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="check_in_date"
                    value={formData.check_in_date}
                    onChange={handleChange}
                    className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-lg text-[#101828] font-mono focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all ${
                      errors.check_in_date
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#D0D5DD] focus:border-[#0EA5E9]"
                    }`}
                  />
                  {errors.check_in_date && (
                    <p className="mt-1 text-[12px] text-red-500 font-medium">
                      {errors.check_in_date}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Expected Check-out
                  </label>
                  <input
                    type="date"
                    name="check_out_date"
                    value={formData.check_out_date}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D0D5DD] rounded-lg text-[#101828] font-mono focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9] transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Purpose of Visit */}
              <div className="pt-1">
                <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                  Purpose of Visit
                </label>
                <select
                  name="purpose_of_visit"
                  value={formData.purpose_of_visit}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D0D5DD] rounded-lg text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9] transition-all"
                >
                  <option value="Business">Business</option>
                  <option value="Tourism">Tourism</option>
                  <option value="Family">Family</option>
                  <option value="Medical">Medical</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* DASHED DIVIDER */}
            <div className="border-t border-dashed border-[#EAECF0]" />

            {/* Bottom Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="px-5 py-2.5 text-xs font-semibold text-[#667085] hover:text-[#101828] hover:bg-[#F7F8FA] rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0369A1] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin text-white"
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
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
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
                    <span>Register Tenant</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
