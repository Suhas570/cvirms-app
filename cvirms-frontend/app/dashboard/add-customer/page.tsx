"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { formatAadhaar, isValidAadhaar } from "@/lib/aadhaar";

interface FormErrors {
  [key: string]: string;
}

export default function AddCustomerPage() {
  const router = useRouter();

  // Mode: "ocr" (Auto-Fill via Aadhaar OCR) or "manual" (Direct Manual Entry)
  const [entryMode, setEntryMode] = useState<"ocr" | "manual">("ocr");

  // Form State
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    contact_number: "", // Intentionally manual
    gender: "Male",
    address: "",
    pincode: "",
    number_of_guests: "1",
    id_proof_type: "Aadhaar Card",
    id_proof_number: "",
    room_number: "",
    check_in_date: new Date().toISOString().split("T")[0],
    check_out_date: "",
    purpose_of_visit: "Business",
  });

  // OCR Uploads & Previews State
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  // OCR Processing State
  const [isExtracting, setIsExtracting] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Form Submission State
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Handle Form Input Change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === "id_proof_number" && formData.id_proof_type === "Aadhaar Card") {
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

  // Handle Front File Selection
  const handleFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFrontFile(file);
    setOcrError(null);
    setOcrSuccess(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFrontPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Back File Selection
  const handleBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackFile(file);
    setOcrError(null);
    setOcrSuccess(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBackPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Clear Uploads
  const handleClearUploads = () => {
    setFrontFile(null);
    setFrontPreview(null);
    setBackFile(null);
    setBackPreview(null);
    setOcrError(null);
    setOcrSuccess(null);
  };

  // Run OCR Extraction via Backend (/api/ocr/extract)
  const handleExtractOcr = async () => {
    if (!frontFile && !backFile) {
      setOcrError("Please upload at least one side (Front or Back) of the Aadhaar card.");
      return;
    }

    setIsExtracting(true);
    setOcrError(null);
    setOcrSuccess(null);

    try {
      const uploadData = new FormData();
      if (frontFile) uploadData.append("front", frontFile);
      if (backFile) uploadData.append("back", backFile);

      const response = await fetch("http://localhost:5000/api/ocr/extract", {
        method: "POST",
        body: uploadData,
      });

      const resJson = await response.json();

      if (!response.ok || !resJson.success) {
        throw new Error(resJson.message || "Failed to extract Aadhaar information.");
      }

      const extracted = resJson.data || {};

      // Auto-fill form fields (EXCEPT contact_number which remains manual)
      setFormData((prev) => ({
        ...prev,
        first_name: extracted.firstName || prev.first_name,
        middle_name: extracted.middleName || prev.middle_name,
        last_name: extracted.lastName || prev.last_name,
        gender:
          extracted.gender === "Female" || extracted.gender === "Other"
            ? extracted.gender
            : "Male",
        address: extracted.address || prev.address,
        pincode: extracted.pincode || prev.pincode,
        id_proof_number: extracted.aadhaarNumber
          ? formatAadhaar(extracted.aadhaarNumber)
          : prev.id_proof_number,
      }));

      // Clear any validation errors for the auto-filled fields
      setErrors((prev) => {
        const copy = { ...prev };
        if (extracted.firstName) delete copy.first_name;
        if (extracted.lastName) delete copy.last_name;
        if (extracted.aadhaarNumber) delete copy.id_proof_number;
        return copy;
      });

      setOcrSuccess(
        "Aadhaar details extracted successfully! Verify details below and enter the customer's phone number manually."
      );
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Unable to process document. Please ensure images are clear or enter manually.";
      setOcrError(errorMsg);
    } finally {
      setIsExtracting(false);
    }
  };

  // Validate Form
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
    } else if (!/^[0-9+\s-]{10,15}$/.test(formData.contact_number.trim())) {
      const digitsOnly = formData.contact_number.replace(/\D/g, "");
      if (digitsOnly.length !== 10) {
        errs.contact_number = "Contact number must be 10 digits";
      }
    }
    if (!formData.id_proof_number.trim()) {
      errs.id_proof_number = "Aadhaar number is required";
    } else if (
      formData.id_proof_type === "Aadhaar Card" &&
      !isValidAadhaar(formData.id_proof_number)
    ) {
      errs.id_proof_number = "Aadhaar number must be 12 valid digits";
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

  // Submit Customer to Backend
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
        id_proof_type: "Aadhaar Card",
      };

      const response = await fetch("http://localhost:5000/api/guests", {
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
        setApiError(
          data.message || "Failed to register customer. Please check inputs."
        );
        setIsSubmitting(false);
        return;
      }

      setShowToast(true);
      setTimeout(() => {
        router.push("/dashboard/visitors");
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
                Customer registered successfully. Redirecting to visitor list...
              </p>
            </div>
          </div>
        )}

        {/* Page Header + Mode Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#101828] tracking-tight">
              Add New Customer
            </h1>
            <p className="text-xs text-[#667085] mt-1 font-medium">
              Register a new visitor or resident into the CVIRMS compliance portal
            </p>
          </div>

          {/* Mode Switcher: OCR Scan vs Manual */}
          <div className="flex items-center p-1 bg-[#F2F4F7] rounded-xl border border-[#D0D5DD] self-start sm:self-auto shadow-2xs">
            <button
              type="button"
              onClick={() => setEntryMode("ocr")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                entryMode === "ocr"
                  ? "bg-white text-[#0284C7] shadow-sm"
                  : "text-[#667085] hover:text-[#101828]"
              }`}
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
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>Aadhaar OCR</span>
            </button>

            <button
              type="button"
              onClick={() => setEntryMode("manual")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                entryMode === "manual"
                  ? "bg-white text-[#0284C7] shadow-sm"
                  : "text-[#667085] hover:text-[#101828]"
              }`}
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
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>Manual Entry</span>
            </button>
          </div>
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

        {/* OPTIONAL OCR SECTION (SHOWN ONLY WHEN OCR MODE IS ACTIVE) */}
        {entryMode === "ocr" ? (
          <div className="bg-gradient-to-b from-[#F0F9FF] to-white rounded-2xl border border-[#BAE6FD] shadow-xs p-6 space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1 border-b border-[#E0F2FE]">
              <div className="flex items-center gap-2.5 text-[#0284C7]">
                <div className="w-7 h-7 rounded-lg bg-[#E0F2FE] flex items-center justify-center shrink-0">
                  <svg
                    className="w-4 h-4 text-[#0284C7]"
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
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#101828]">
                    Aadhaar Card Document OCR
                  </h2>
                  <p className="text-[11px] text-[#667085] font-normal">
                    Upload Front and Back sides of customer&apos;s Aadhaar card to auto-fill details
                  </p>
                </div>
              </div>

              {(frontFile || backFile) && (
                <button
                  type="button"
                  onClick={handleClearUploads}
                  className="text-[11px] font-semibold text-[#667085] hover:text-red-600 transition-colors self-start sm:self-auto flex items-center gap-1"
                >
                  <svg
                    className="w-3 h-3"
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
                  <span>Clear Uploads</span>
                </button>
              )}
            </div>

            {/* Upload Dropzones (Front & Back) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* FRONT SIDE UPLOAD */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#344054]">
                  Front Side (Identity & Photo)
                </label>
                {frontPreview ? (
                  <div className="relative border border-[#B9E6FE] bg-white rounded-xl p-3 flex items-center gap-3 shadow-2xs">
                    <img
                      src={frontPreview}
                      alt="Aadhaar Front Preview"
                      className="w-16 h-12 object-cover rounded-lg border border-[#EAECF0] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#101828] truncate">
                        {frontFile?.name || "Front Side Image"}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-mono font-medium flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Ready for scan</span>
                      </p>
                    </div>
                    <label className="cursor-pointer px-2.5 py-1 text-[11px] font-semibold text-[#0284C7] hover:bg-[#F0F9FF] border border-[#BAE6FD] rounded-lg transition-colors">
                      Change
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFrontChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-[#BAE6FD] hover:border-[#0284C7] bg-[#F7F8FA] hover:bg-white rounded-xl cursor-pointer transition-all group">
                    <div className="w-9 h-9 rounded-full bg-[#E0F2FE] group-hover:bg-[#0EA5E9] flex items-center justify-center text-[#0284C7] group-hover:text-white transition-colors mb-2">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <p className="text-xs font-bold text-[#101828] group-hover:text-[#0284C7]">
                      Upload Aadhaar Front
                    </p>
                    <p className="text-[10px] text-[#667085] mt-0.5 font-medium">
                      PNG, JPG, WebP (Max 15MB)
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFrontChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* BACK SIDE UPLOAD */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#344054]">
                  Back Side (Address & QR Code)
                </label>
                {backPreview ? (
                  <div className="relative border border-[#B9E6FE] bg-white rounded-xl p-3 flex items-center gap-3 shadow-2xs">
                    <img
                      src={backPreview}
                      alt="Aadhaar Back Preview"
                      className="w-16 h-12 object-cover rounded-lg border border-[#EAECF0] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#101828] truncate">
                        {backFile?.name || "Back Side Image"}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-mono font-medium flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Ready for scan</span>
                      </p>
                    </div>
                    <label className="cursor-pointer px-2.5 py-1 text-[11px] font-semibold text-[#0284C7] hover:bg-[#F0F9FF] border border-[#BAE6FD] rounded-lg transition-colors">
                      Change
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBackChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-[#BAE6FD] hover:border-[#0284C7] bg-[#F7F8FA] hover:bg-white rounded-xl cursor-pointer transition-all group">
                    <div className="w-9 h-9 rounded-full bg-[#E0F2FE] group-hover:bg-[#0EA5E9] flex items-center justify-center text-[#0284C7] group-hover:text-white transition-colors mb-2">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <p className="text-xs font-bold text-[#101828] group-hover:text-[#0284C7]">
                      Upload Aadhaar Back
                    </p>
                    <p className="text-[10px] text-[#667085] mt-0.5 font-medium">
                      PNG, JPG, WebP (Max 15MB)
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBackChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* OCR Extract Action Button */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-[#667085] italic font-medium">
                Tip: Both sides provide 100% complete address and identity data.
              </p>

              <button
                type="button"
                onClick={handleExtractOcr}
                disabled={isExtracting || (!frontFile && !backFile)}
                className="px-5 py-2.5 bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0369A1] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isExtracting ? (
                  <>
                    <svg
                      className="w-3.5 h-3.5 animate-spin text-white"
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
                    <span>Extracting Details with OCR...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <span>Extract &amp; Auto-Fill Form</span>
                  </>
                )}
              </button>
            </div>

            {/* OCR Success Banner */}
            {ocrSuccess && (
              <div className="p-3.5 bg-[#ECFDF3] border border-[#A6F4C5] rounded-xl flex items-start gap-2.5 text-[#027A48] text-xs shadow-2xs animate-fadeIn">
                <svg
                  className="w-4 h-4 text-[#12B76A] shrink-0 mt-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <div className="flex-1">
                  <p className="font-bold">Aadhaar Data Extracted</p>
                  <p className="text-[11px] text-[#05603A] mt-0.5 font-medium">{ocrSuccess}</p>
                </div>
              </div>
            )}

            {/* OCR Error Banner */}
            {ocrError && (
              <div className="p-3.5 bg-[#FEF3F2] border border-[#FECDCA] rounded-xl flex items-start gap-2.5 text-[#B42318] text-xs shadow-2xs animate-fadeIn">
                <svg
                  className="w-4 h-4 text-[#D92D20] shrink-0 mt-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div className="flex-1">
                  <p className="font-bold">Extraction Notice</p>
                  <p className="text-[11px] text-[#912018] mt-0.5 font-medium">{ocrError}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* MANUAL MODE INFO BANNER */
          <div className="p-4 bg-[#F8FAFC] border border-[#EAECF0] rounded-xl flex items-center justify-between text-xs text-[#475467] shadow-2xs animate-fade-in">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-[#0284C7] shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>
                <strong>Manual Entry Mode Active:</strong> Enter customer information directly in the form below.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEntryMode("ocr")}
              className="text-[#0284C7] font-bold hover:underline"
            >
              Switch to Aadhaar OCR
            </button>
          </div>
        )}

        {/* Main Customer Details Form */}
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

              {/* Name Row: First Name | Middle Name | Last Name */}
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

              {/* Gender and Contact Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D0D5DD] rounded-lg text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9] transition-all"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Contact Number (Phone)* <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleChange}
                    placeholder="e.g., 9876543210 (Manual)"
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

              {/* Address and Pincode Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Address
                  </label>
                  <textarea
                    rows={2}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Residential address as per Aadhaar"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-[#D0D5DD] rounded-lg text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="6-digit pincode"
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D0D5DD] rounded-lg text-[#101828] placeholder-[#98A2B3] font-mono focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* DASHED DIVIDER */}
            <div className="border-t border-dashed border-[#EAECF0]" />

            {/* SECTION 2: ID VERIFICATION (FIXED AADHAAR CARD) */}
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

              {/* Row (2 cols): Fixed ID Proof Type | Aadhaar ID Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    ID Proof Type (Mandatory Compliance)
                  </label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#F2F4F7] border border-[#D0D5DD] rounded-lg text-[#344054] text-xs font-semibold select-none">
                    <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
                    <span>Aadhaar Card</span>
                    <span className="ml-auto text-[10px] font-mono uppercase bg-[#E0F2FE] text-[#0284C7] px-2 py-0.5 rounded-full font-bold">
                      Standard
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase text-[#101828] mb-1.5">
                    Aadhaar Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="id_proof_number"
                    value={formData.id_proof_number}
                    onChange={handleChange}
                    placeholder="e.g., 9876 5432 7101"
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
                onClick={() => router.push("/dashboard/visitors")}
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
                    <span>Register Customer</span>
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
