"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";

interface FormErrors {
  [key: string]: string;
}

export default function AddForeignerPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    country: "",
    mobile_number: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    indian_contact: "",
    passport_number: "",
    visa_number: "",
    valid_from: "",
    valid_upto: "",
    purpose_of_visit: "Tourism",
    coming_from: "",
    going_to: "",
  });

  // Mocked document uploads (FileReader preview only)
  // TODO: S3/Cloudinary
  const [customerPhoto, setCustomerPhoto] = useState<string | null>(null);
  const [passportPhoto, setPassportPhoto] = useState<string | null>(null);
  const [cFormPhoto, setCFormPhoto] = useState<string | null>(null);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "customer" | "passport" | "cform"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // TODO: S3/Cloudinary integration in future phase
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (type === "customer") setCustomerPhoto(result);
      else if (type === "passport") setPassportPhoto(result);
      else if (type === "cform") setCFormPhoto(result);
    };
    reader.readAsDataURL(file);
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};

    if (!formData.first_name.trim()) errs.first_name = "First name is required";
    if (!formData.last_name.trim()) errs.last_name = "Last name is required";
    if (!formData.country.trim()) errs.country = "Country of origin is required";
    if (!formData.mobile_number.trim()) {
      errs.mobile_number = "Mobile number is required";
    }
    if (!formData.address.trim()) errs.address = "Address is required";
    if (!formData.city.trim()) errs.city = "City is required";
    if (!formData.passport_number.trim()) {
      errs.passport_number = "Passport number is required";
    }
    if (!formData.visa_number.trim()) errs.visa_number = "Visa number is required";
    if (!formData.valid_from) errs.valid_from = "Valid from date is required";
    if (!formData.valid_upto) errs.valid_upto = "Valid up to date is required";
    if (!formData.purpose_of_visit.trim()) {
      errs.purpose_of_visit = "Purpose of visit is required";
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

      const payload = {
        ...formData,
        // Mocked upload URLs
        // TODO: S3/Cloudinary
        photo_url: customerPhoto ? "mock://customer-photo.jpg" : null,
        passport_photo_url: passportPhoto ? "mock://passport-photo.jpg" : null,
        c_form_url: cFormPhoto ? "mock://c-form.jpg" : null,
      };

      const response = await fetch("http://localhost:5000/api/foreigners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        }
        throw new Error(data.message || "Failed to register foreign national");
      }

      setShowToast(true);

      setTimeout(() => {
        router.push("/dashboard/foreigners");
      }, 1200);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Network error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-[900px] mx-auto space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#101828] tracking-tight">
              Add Foreigner
            </h1>
            <p className="text-xs text-[#667085] mt-1">
              Register a foreign national as per C-Form compliance
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard/foreigners")}
            className="self-start sm:self-auto px-4 py-2 text-xs font-semibold text-[#667085] hover:text-[#101828] bg-white border border-[#D0D5DD] rounded-xl hover:bg-[#F7F8FA] transition-colors shadow-2xs flex items-center gap-2"
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
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Foreigner List</span>
          </button>
        </div>

        {/* Global Toast Notification */}
        {showToast && (
          <div className="p-4 bg-[#ECFDF3] border border-[#A6F4C5] rounded-xl flex items-center gap-3 text-emerald-800 shadow-sm animate-fadeIn">
            <div className="w-5 h-5 rounded-full bg-[#12B76A] text-white flex items-center justify-center shrink-0">
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-xs font-semibold">
              Foreigner registered successfully. Redirecting to foreigner list...
            </p>
          </div>
        )}

        {/* API Error Alert */}
        {apiError && (
          <div className="p-4 bg-[#FEF3F2] border border-[#FECDCA] rounded-xl flex items-center gap-3 text-[#B42318] text-xs shadow-sm animate-fadeIn">
            <div className="w-5 h-5 rounded-full bg-[#D92D20] text-white flex items-center justify-center shrink-0">
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <p className="font-semibold">{apiError}</p>
          </div>
        )}

        {/* Main Foreigner Form Card */}
        <div className="bg-white rounded-2xl border border-[#EAECF0] shadow-sm p-7">
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* SECTION 1: PERSONAL INFORMATION */}
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
                  Personal Information
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
                    placeholder="e.g., John"
                    className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-lg text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 transition-all ${
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
                    placeholder="e.g., Robert"
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D0D5DD] rounded-lg text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 focus:border-[#0EA5E9] transition-all"
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
                    placeholder="e.g., Smith"
                    className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-lg text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 transition-all ${
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

              {/* Row 2 (2 cols): Country | Mobile Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Country of Origin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="e.g., United Kingdom, Germany, Japan"
                    className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-lg text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 transition-all ${
                      errors.country
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#D0D5DD] focus:border-[#0EA5E9]"
                    }`}
                  />
                  {errors.country && (
                    <p className="mt-1 text-[12px] text-red-500 font-medium">
                      {errors.country}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Mobile Number (International) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="mobile_number"
                    value={formData.mobile_number}
                    onChange={handleChange}
                    placeholder="e.g., +44 7911 123456"
                    className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-lg text-[#101828] placeholder-[#98A2B3] font-mono focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 transition-all ${
                      errors.mobile_number
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#D0D5DD] focus:border-[#0EA5E9]"
                    }`}
                  />
                  {errors.mobile_number && (
                    <p className="mt-1 text-[12px] text-red-500 font-medium">
                      {errors.mobile_number}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3 (2 cols): Address | City */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Permanent Address (Home Country) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    rows={2}
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g., 10 Downing Street, Westminster"
                    className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-lg text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 transition-all resize-y ${
                      errors.address
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#D0D5DD] focus:border-[#0EA5E9]"
                    }`}
                  />
                  {errors.address && (
                    <p className="mt-1 text-[12px] text-red-500 font-medium">
                      {errors.address}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g., London"
                    className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-lg text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 transition-all ${
                      errors.city
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#D0D5DD] focus:border-[#0EA5E9]"
                    }`}
                  />
                  {errors.city && (
                    <p className="mt-1 text-[12px] text-red-500 font-medium">
                      {errors.city}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 4 (3 cols): State | Zip/PIN Code | Indian Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    State / Province
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="e.g., Greater London"
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D0D5DD] rounded-lg text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 focus:border-[#0EA5E9] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Zip / Postal Code
                  </label>
                  <input
                    type="text"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleChange}
                    placeholder="e.g., SW1A 2AA"
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D0D5DD] rounded-lg text-[#101828] placeholder-[#98A2B3] font-mono focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 focus:border-[#0EA5E9] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Indian Contact Number
                  </label>
                  <input
                    type="text"
                    name="indian_contact"
                    value={formData.indian_contact}
                    onChange={handleChange}
                    placeholder="e.g., 98765 43210"
                    maxLength={10}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D0D5DD] rounded-lg text-[#101828] placeholder-[#98A2B3] font-mono focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 focus:border-[#0EA5E9] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* DASHED DIVIDER */}
            <div className="border-t border-dashed border-[#EAECF0]" />

            {/* SECTION 2: PASSPORT & VISA */}
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
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#101828]">
                  Passport & Visa Details
                </h2>
              </div>

              {/* Row 1 (2 cols): Passport Number | Visa Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Passport Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="passport_number"
                    value={formData.passport_number}
                    onChange={handleChange}
                    placeholder="e.g., GB98765432"
                    className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-lg text-[#101828] placeholder-[#98A2B3] font-mono focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 transition-all ${
                      errors.passport_number
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#D0D5DD] focus:border-[#0EA5E9]"
                    }`}
                  />
                  {errors.passport_number && (
                    <p className="mt-1 text-[12px] text-red-500 font-medium">
                      {errors.passport_number}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Visa Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="visa_number"
                    value={formData.visa_number}
                    onChange={handleChange}
                    placeholder="e.g., IND-V-2026-889"
                    className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-lg text-[#101828] placeholder-[#98A2B3] font-mono focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 transition-all ${
                      errors.visa_number
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#D0D5DD] focus:border-[#0EA5E9]"
                    }`}
                  />
                  {errors.visa_number && (
                    <p className="mt-1 text-[12px] text-red-500 font-medium">
                      {errors.visa_number}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2 (2 cols): Valid From | Valid Up To */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Visa Valid From <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="valid_from"
                    value={formData.valid_from}
                    onChange={handleChange}
                    className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-lg text-[#101828] font-mono focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 transition-all ${
                      errors.valid_from
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#D0D5DD] focus:border-[#0EA5E9]"
                    }`}
                  />
                  {errors.valid_from && (
                    <p className="mt-1 text-[12px] text-red-500 font-medium">
                      {errors.valid_from}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Visa Valid Up To <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="valid_upto"
                    value={formData.valid_upto}
                    onChange={handleChange}
                    className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-lg text-[#101828] font-mono focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 transition-all ${
                      errors.valid_upto
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#D0D5DD] focus:border-[#0EA5E9]"
                    }`}
                  />
                  {errors.valid_upto && (
                    <p className="mt-1 text-[12px] text-red-500 font-medium">
                      {errors.valid_upto}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3 (3 cols): Purpose of Visit | Coming From | Going To */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Purpose of Visit <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="purpose_of_visit"
                    value={formData.purpose_of_visit}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D0D5DD] rounded-lg text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 focus:border-[#0EA5E9] transition-all"
                  >
                    <option value="Tourism">Tourism</option>
                    <option value="Business">Business</option>
                    <option value="Conference">Conference / Seminar</option>
                    <option value="Employment">Employment</option>
                    <option value="Medical">Medical Treatment</option>
                    <option value="Education">Education / Research</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Coming From
                  </label>
                  <input
                    type="text"
                    name="coming_from"
                    value={formData.coming_from}
                    onChange={handleChange}
                    placeholder="e.g., Heathrow, London"
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D0D5DD] rounded-lg text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 focus:border-[#0EA5E9] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Going To
                  </label>
                  <input
                    type="text"
                    name="going_to"
                    value={formData.going_to}
                    onChange={handleChange}
                    placeholder="e.g., Mumbai, India"
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D0D5DD] rounded-lg text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 focus:border-[#0EA5E9] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* DASHED DIVIDER */}
            <div className="border-t border-dashed border-[#EAECF0]" />

            {/* SECTION 3: DOCUMENTS */}
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
                  Documents & Compliance Attachments
                </h2>
              </div>

              {/* Row 1 (3 cols): Customer Photo | Passport Photo | C-Form */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Customer Photo */}
                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Upload Customer Photo
                  </label>
                  <div className="border border-dashed border-[#D0D5DD] rounded-xl p-3 text-center hover:bg-[#F7F8FA] transition-colors relative min-h-[110px] flex items-center justify-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "customer")}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {customerPhoto ? (
                      <div className="relative w-full h-20 rounded-lg overflow-hidden border border-emerald-200">
                        <img
                          src={customerPhoto}
                          alt="Customer Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <svg
                          className="w-5 h-5 text-[#98A2B3]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <p className="text-xs font-semibold text-[#0284C7]">
                          Front Portrait
                        </p>
                        <p className="text-[10px] text-[#667085]">JPG/PNG</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Passport Photo */}
                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Upload Passport Photo
                  </label>
                  <div className="border border-dashed border-[#D0D5DD] rounded-xl p-3 text-center hover:bg-[#F7F8FA] transition-colors relative min-h-[110px] flex items-center justify-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "passport")}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {passportPhoto ? (
                      <div className="relative w-full h-20 rounded-lg overflow-hidden border border-emerald-200">
                        <img
                          src={passportPhoto}
                          alt="Passport Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <svg
                          className="w-5 h-5 text-[#98A2B3]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect width="20" height="14" x="2" y="5" rx="2" />
                          <line x1="2" x2="22" y1="10" y2="10" />
                        </svg>
                        <p className="text-xs font-semibold text-[#0284C7]">
                          Bio Page
                        </p>
                        <p className="text-[10px] text-[#667085]">JPG/PNG</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* C-Form */}
                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Upload C-Form
                  </label>
                  <div className="border border-dashed border-[#D0D5DD] rounded-xl p-3 text-center hover:bg-[#F7F8FA] transition-colors relative min-h-[110px] flex items-center justify-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "cform")}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {cFormPhoto ? (
                      <div className="relative w-full h-20 rounded-lg overflow-hidden border border-emerald-200">
                        <img
                          src={cFormPhoto}
                          alt="C-Form Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <svg
                          className="w-5 h-5 text-[#98A2B3]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        <p className="text-xs font-semibold text-[#0284C7]">
                          Compliance Doc
                        </p>
                        <p className="text-[10px] text-[#667085]">PDF/JPG</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* DASHED DIVIDER */}
            <div className="border-t border-dashed border-[#EAECF0]" />

            {/* Bottom Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard/foreigners")}
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
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
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    <span>Register Foreigner</span>
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
