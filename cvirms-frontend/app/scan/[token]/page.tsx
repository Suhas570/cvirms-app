"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function VisitorScanPage() {
  const params = useParams();
  const token = (params?.token as string) || "";

  const [hotelName, setHotelName] = useState<string>("");
  const [memberType, setMemberType] = useState<string>("");
  const [loadingHotel, setLoadingHotel] = useState<boolean>(true);
  const [invalidToken, setInvalidToken] = useState<boolean>(false);

  // Form State
  const [guestName, setGuestName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [idProofType, setIdProofType] = useState("Aadhaar Card");
  const [idProofNumber, setIdProofNumber] = useState("");
  const [purposeOfVisit, setPurposeOfVisit] = useState("Business");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Fetch Hotel Information on Mount
  useEffect(() => {
    if (!token) return;

    async function verifyQRToken() {
      try {
        setLoadingHotel(true);
        setInvalidToken(false);

        const res = await fetch(`http://localhost:5000/api/qr/hotel/${encodeURIComponent(token)}`);
        const data = await res.json();

        if (res.ok && data.valid) {
          setHotelName(data.hotelName || "Establishment");
          setMemberType(data.memberType || "hotel");
        } else {
          setInvalidToken(true);
        }
      } catch {
        setInvalidToken(true);
      } finally {
        setLoadingHotel(false);
      }
    }

    verifyQRToken();
  }, [token]);

  // 2. Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!guestName.trim()) {
      setErrorMsg("Full name is required.");
      return;
    }
    const cleanPhone = contactNumber.trim();
    if (!cleanPhone || !/^[0-9+\s-]{10,15}$/.test(cleanPhone)) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!idProofNumber.trim()) {
      setErrorMsg("ID proof number is required.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(
        `http://localhost:5000/api/qr/public-register/${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guest_name: guestName.trim(),
            contact_number: cleanPhone,
            id_proof_type: idProofType,
            id_proof_number: idProofNumber.trim(),
            purpose_of_visit: purposeOfVisit,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Registration failed. Please check details.");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error. Please try again.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/60 via-[#F7F8FA] to-[#EDF2F7] flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-[#EAECF0] shadow-xs mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0EA5E9] animate-pulse" />
          <span className="text-[11px] font-bold tracking-wider text-[#0284C7] uppercase font-mono">
            CVIRMS • POLICE VERIFICATION PORTAL
          </span>
        </div>
      </div>

      {/* Main Glass Card */}
      <div className="w-full max-w-[500px] bg-white/95 backdrop-blur-md rounded-[16px] border border-[#EAECF0] shadow-lg p-6 sm:p-8 transition-all">
        {loadingHotel ? (
          <div className="py-16 flex flex-col items-center justify-center text-[#667085] space-y-3">
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
            <p className="text-xs font-semibold">Verifying establishment QR code...</p>
          </div>
        ) : invalidToken ? (
          /* Invalid Token Error Card */
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#FEF3F2] border border-[#FECDCA] text-[#D92D20] mx-auto flex items-center justify-center">
              <svg
                className="w-7 h-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-[#101828]">Invalid QR Code</h2>
              <p className="text-xs text-[#667085] max-w-xs mx-auto leading-relaxed">
                Invalid QR code. Please ask your hotel for the correct code.
              </p>
            </div>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 bg-[#F7F8FA] border border-[#EAECF0] rounded-md font-mono text-[11px] text-[#667085]">
                Token: {token || "NONE"}
              </span>
            </div>
          </div>
        ) : submitted ? (
          /* Success Confirmation Card */
          <div className="text-center py-6 space-y-5 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-[#ECFDF3] border border-[#ABEFC6] text-[#027A48] mx-auto flex items-center justify-center shadow-xs">
              <svg
                className="w-8 h-8"
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

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-[#101828] tracking-tight">
                Registration Submitted!
              </h2>
              <p className="text-xs text-[#475467] leading-relaxed max-w-sm mx-auto">
                Your details have been sent to{" "}
                <span className="font-bold text-[#101828]">{hotelName}</span>. Please
                wait at reception — they&apos;ll verify and approve shortly.
              </p>
            </div>

            <div className="p-4 bg-[#F7F8FA] rounded-xl border border-[#EAECF0] text-left text-xs space-y-2">
              <div className="flex justify-between items-center text-[11px] text-[#667085]">
                <span>Visitor Name:</span>
                <span className="font-bold text-[#101828]">{guestName}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-[#667085]">
                <span>Status:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89]">
                  Pending Verification
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-[#667085]">
                <span>Submission Time:</span>
                <span className="font-mono text-[10px] text-[#101828]">
                  {new Date().toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setSubmitted(false);
                setGuestName("");
                setContactNumber("");
                setIdProofNumber("");
              }}
              className="text-xs font-semibold text-[#0284C7] hover:text-[#0EA5E9] hover:underline transition-colors"
            >
              Submit another registration
            </button>
          </div>
        ) : (
          /* Registration Form */
          <div>
            {/* Top Hotel Banner */}
            <div className="mb-5 pb-4 border-b border-[#EAECF0] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#0284C7] uppercase tracking-wider block">
                  Registering at
                </span>
                <span className="text-base font-extrabold text-[#101828] block">
                  {hotelName}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">
                {memberType}
              </span>
            </div>

            {/* Heading & Subtitle */}
            <div className="mb-5">
              <h1 className="text-[20px] font-extrabold text-[#101828] tracking-tight">
                Visitor Self-Registration
              </h1>
              <p className="text-[13px] text-[#667085] mt-1">
                Fill in your details. The hotel will verify shortly.
              </p>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-[#FEF3F2] border border-[#FECDCA] rounded-lg text-xs text-[#D92D20] flex items-center gap-2">
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
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-[#D0D5DD] bg-white text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] transition-all"
                />
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1.5">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-mono text-[#667085]">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-12 pr-3.5 py-2.5 text-xs font-mono rounded-lg border border-[#D0D5DD] bg-white text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] transition-all"
                  />
                </div>
              </div>

              {/* ID Proof Type */}
              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1.5">
                  ID Proof Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={idProofType}
                  onChange={(e) => setIdProofType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-[#D0D5DD] bg-white text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] transition-all cursor-pointer"
                >
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Voter ID">Voter ID</option>
                </select>
              </div>

              {/* ID Number */}
              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1.5">
                  ID Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    idProofType === "Aadhaar Card"
                      ? "XXXX-XXXX-XXXX"
                      : "Enter document number"
                  }
                  value={idProofNumber}
                  onChange={(e) => setIdProofNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono rounded-lg border border-[#D0D5DD] bg-white text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] transition-all uppercase"
                />
              </div>

              {/* Purpose of Visit */}
              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1.5">
                  Purpose of Visit
                </label>
                <select
                  value={purposeOfVisit}
                  onChange={(e) => setPurposeOfVisit(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-[#D0D5DD] bg-white text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] transition-all cursor-pointer"
                >
                  <option value="Business">Business</option>
                  <option value="Tourism">Tourism</option>
                  <option value="Family">Family</option>
                  <option value="Medical">Medical</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white text-xs font-bold shadow-md hover:brightness-105 active:scale-[0.99] disabled:opacity-60 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
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
                      <span>Submitting Registration...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Submit Registration</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center text-[11px] text-[#667085]">
        <span>Protected under Digital Personal Data Protection & Police Regulations</span>
      </div>
    </div>
  );
}
