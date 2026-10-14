"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { formatAadhaar, isValidAadhaar } from "@/lib/aadhaar";

interface FormErrors {
  [key: string]: string;
}

export default function AddEmployeePage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    full_name: "",
    gender: "Male",
    contact_number: "",
    alternate_contact: "",
    address: "",
    pincode: "",
    document_type: "Aadhaar Card",
    document_id: "",
    check_in_time: "",
    remark: "",
  });

  // Mocked photo uploads (FileReader preview only)
  // TODO: S3/Cloudinary
  const [documentPhoto, setDocumentPhoto] = useState<string | null>(null);
  const [employeePhoto, setEmployeePhoto] = useState<string | null>(null);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "document_id" && formData.document_type === "Aadhaar Card") {
      formattedValue = formatAadhaar(value);
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));

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
    type: "document" | "employee"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // TODO: S3/Cloudinary integration in future phase
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (type === "document") {
        setDocumentPhoto(result);
      } else {
        setEmployeePhoto(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};

    if (!formData.full_name.trim()) {
      errs.full_name = "Full name is required";
    }

    if (!formData.contact_number.trim()) {
      errs.contact_number = "Contact number is required";
    } else {
      const digitsOnly = formData.contact_number.replace(/\D/g, "");
      if (digitsOnly.length !== 10) {
        errs.contact_number = "Contact number must be 10 digits";
      }
    }

    if (!formData.gender) {
      errs.gender = "Gender is required";
    }

    if (!formData.address.trim()) {
      errs.address = "Address is required";
    }

    if (!formData.pincode.trim()) {
      errs.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      errs.pincode = "Pincode must be 6 digits";
    }

    if (!formData.document_type) {
      errs.document_type = "Document type is required";
    }

    if (!formData.document_id.trim()) {
      errs.document_id = "Document ID is required";
    } else if (
      formData.document_type === "Aadhaar Card" &&
      !isValidAadhaar(formData.document_id)
    ) {
      errs.document_id = "Aadhaar number must be 12 valid digits";
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
        // Mock photo storage URLs
        // TODO: S3/Cloudinary
        photo_url: employeePhoto ? "mock://employee-photo.jpg" : null,
      };

      const response = await fetch("http://localhost:5000/api/employees", {
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
        throw new Error(data.message || "Failed to register employee");
      }

      setShowToast(true);

      setTimeout(() => {
        router.push("/dashboard/employees");
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
              Add New Employee
            </h1>
            <p className="text-xs text-[#667085] mt-1">
              Register a staff member into the CVIRMS system
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard/employees")}
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
            <span>Back to Employee List</span>
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
              Employee registered successfully. Redirecting to employee list...
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

        {/* Main Employee Form Card */}
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

              {/* Row 1 (2 cols): Full Name | Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="e.g., Rajesh Kumar"
                    className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-lg text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 transition-all ${
                      errors.full_name
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#D0D5DD] focus:border-[#0EA5E9]"
                    }`}
                  />
                  {errors.full_name && (
                    <p className="mt-1 text-[12px] text-red-500 font-medium">
                      {errors.full_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D0D5DD] rounded-lg text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 focus:border-[#0EA5E9] transition-all"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Row 2 (2 cols): Contact Number | Alternate Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Contact Number (Phone) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleChange}
                    maxLength={10}
                    placeholder="e.g., 98765 43210"
                    className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-lg text-[#101828] placeholder-[#98A2B3] font-mono focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 transition-all ${
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
                    Alternate Contact (Optional)
                  </label>
                  <input
                    type="text"
                    name="alternate_contact"
                    value={formData.alternate_contact}
                    onChange={handleChange}
                    maxLength={15}
                    placeholder="e.g., 98765 43211"
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D0D5DD] rounded-lg text-[#101828] placeholder-[#98A2B3] font-mono focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 focus:border-[#0EA5E9] transition-all"
                  />
                </div>
              </div>

              {/* Row 3 (1 col): Address */}
              <div>
                <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                  Permanent Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g., #221, MG Road, 4th Block, Bangalore"
                  className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-lg text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 transition-all resize-y min-h-[80px] ${
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

              {/* Row 4 (1 col): Pincode */}
              <div className="w-full sm:w-1/2">
                <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  maxLength={6}
                  placeholder="e.g., 560001"
                  className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-lg text-[#101828] placeholder-[#98A2B3] font-mono focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 transition-all ${
                    errors.pincode
                      ? "border-red-400 focus:border-red-500"
                      : "border-[#D0D5DD] focus:border-[#0EA5E9]"
                  }`}
                />
                {errors.pincode && (
                  <p className="mt-1 text-[12px] text-red-500 font-medium">
                    {errors.pincode}
                  </p>
                )}
              </div>
            </div>

            {/* DASHED DIVIDER */}
            <div className="border-t border-dashed border-[#EAECF0]" />

            {/* SECTION 2: DOCUMENT VERIFICATION */}
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
                  Document Verification
                </h2>
              </div>

              {/* Row 1 (2 cols): Document Type | Document ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Document Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="document_type"
                    value={formData.document_type}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D0D5DD] rounded-lg text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 focus:border-[#0EA5E9] transition-all"
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="PAN Card">PAN Card</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Driving License">Driving License</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Document ID Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="document_id"
                    value={formData.document_id}
                    onChange={handleChange}
                    placeholder={
                      formData.document_type === "Aadhaar Card"
                        ? "e.g., 9876 5432 7101"
                        : "e.g., ABCDE1234F"
                    }
                    className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-lg text-[#101828] placeholder-[#98A2B3] font-mono focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 transition-all ${
                      errors.document_id
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#D0D5DD] focus:border-[#0EA5E9]"
                    }`}
                  />
                  {errors.document_id && (
                    <p className="mt-1 text-[12px] text-red-500 font-medium">
                      {errors.document_id}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2 (2 cols): Upload Document Photo | Upload Employee Photo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Upload Document Photo */}
                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Upload Document Photo
                  </label>
                  <div className="border border-dashed border-[#D0D5DD] rounded-xl p-4 text-center hover:bg-[#F7F8FA] transition-colors relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "document")}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {documentPhoto ? (
                      <div className="relative w-full h-24 rounded-lg overflow-hidden border border-emerald-200">
                        <img
                          src={documentPhoto}
                          alt="Document Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-2 space-y-1.5">
                        <svg
                          className="w-6 h-6 text-[#98A2B3]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <p className="text-xs font-semibold text-[#0284C7]">
                          Click to select document image
                        </p>
                        <p className="text-[11px] text-[#667085]">
                          JPG, PNG or PDF up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Employee Photo */}
                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Upload Employee Photo
                  </label>
                  <div className="border border-dashed border-[#D0D5DD] rounded-xl p-4 text-center hover:bg-[#F7F8FA] transition-colors relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "employee")}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {employeePhoto ? (
                      <div className="relative w-full h-24 rounded-lg overflow-hidden border border-emerald-200">
                        <img
                          src={employeePhoto}
                          alt="Employee Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-2 space-y-1.5">
                        <svg
                          className="w-6 h-6 text-[#98A2B3]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <p className="text-xs font-semibold text-[#0284C7]">
                          Click to select passport-size photo
                        </p>
                        <p className="text-[11px] text-[#667085]">
                          Front portrait view recommended
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* DASHED DIVIDER */}
            <div className="border-t border-dashed border-[#EAECF0]" />

            {/* SECTION 3: EMPLOYMENT DETAILS */}
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
                  <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#101828]">
                  Employment Details
                </h2>
              </div>

              {/* Row 1 (1 col): Check-in Time */}
              <div className="w-full sm:w-1/2">
                <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                  Check-in / Joining Time
                </label>
                <input
                  type="datetime-local"
                  name="check_in_time"
                  value={formData.check_in_time}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D0D5DD] rounded-lg text-[#101828] font-mono focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 focus:border-[#0EA5E9] transition-all"
                />
              </div>

              {/* Row 2 (1 col): Remark */}
              <div>
                <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                  Remarks / Responsibilities (Optional)
                </label>
                <textarea
                  name="remark"
                  rows={2}
                  value={formData.remark}
                  onChange={handleChange}
                  placeholder="e.g., Front desk receptionist, day shift roster"
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D0D5DD] rounded-lg text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 focus:border-[#0EA5E9] transition-all resize-y"
                />
              </div>
            </div>

            {/* DASHED DIVIDER */}
            <div className="border-t border-dashed border-[#EAECF0]" />

            {/* Bottom Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard/employees")}
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
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" />
                      <line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                    <span>Register Employee</span>
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
