"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ESTABLISHMENT_LABELS, EstablishmentType } from "@/lib/establishmentTypes";
import { getDistricts, getTalukas, getPoliceStations } from "@/lib/karnatakaLocations";

const ESTABLISHMENT_OPTIONS: { value: EstablishmentType; label: string }[] = (
  Object.keys(ESTABLISHMENT_LABELS) as EstablishmentType[]
).map((key) => ({
  value: key,
  label: ESTABLISHMENT_LABELS[key],
}));

export default function RegisterPage() {
  const router = useRouter();

  // Section 1: Establishment Details
  const [establishmentName, setEstablishmentName] = useState("");
  const [memberType, setMemberType] = useState<EstablishmentType>("lodge");

  // Section 2: Owner Details
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Section 3: Location Details (Karnataka Cascading)
  const [state, setState] = useState("Karnataka");
  const [district, setDistrict] = useState("");
  const [taluka, setTaluka] = useState("");
  const [policeStation, setPoliceStation] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [landmark, setLandmark] = useState("");
  const [fullAddress, setFullAddress] = useState("");

  // Section 4: Plan & Terms
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Interaction / Touched states for error messages
  const [touched, setTouched] = useState<{
    pincode?: boolean;
    landmark?: boolean;
    fullAddress?: boolean;
  }>({});

  // Dynamic cascading lists from static JSON
  const districtList = getDistricts(state);
  const talukaList = district ? getTalukas(district) : [];
  const policeStationList = district && taluka ? getPoliceStations(district, taluka) : [];

  // Form submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Field validation computations
  const cleanPhone = phone.replace(/\D/g, "");
  const cleanPincode = pincode.replace(/\D/g, "");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = email.trim().length > 0 && emailRegex.test(email.trim());

  // Inline validation errors
  let pincodeError: string | null = null;
  if (pincode.length > 0 || touched.pincode) {
    if (!pincode.startsWith("5") || cleanPincode.length !== 6) {
      pincodeError = "Pincode must be a valid Karnataka pincode (starts with 5)";
    }
  }

  let landmarkError: string | null = null;
  if (landmark.length > 0 || touched.landmark) {
    if (landmark.trim().length < 5) {
      landmarkError = "Landmark must be at least 5 characters";
    }
  }

  let fullAddressError: string | null = null;
  if (fullAddress.length > 0 || touched.fullAddress) {
    if (fullAddress.trim().length < 10) {
      fullAddressError = "Full address must be at least 10 characters";
    }
  }

  // Master validation flag: disable submit button until ALL required fields are filled
  const isFormValid = Boolean(
    establishmentName.trim().length > 0 &&
    ownerName.trim().length > 0 &&
    cleanPhone.length === 10 &&
    isEmailValid &&
    state === "Karnataka" &&
    district.trim().length > 0 &&
    taluka.trim().length > 0 &&
    policeStation.trim().length > 0 &&
    city.trim().length > 0 &&
    cleanPincode.length === 6 &&
    cleanPincode.startsWith("5") &&
    landmark.trim().length >= 5 &&
    fullAddress.trim().length >= 10 &&
    agreeTerms
  );

  // Cascade event handlers
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setState(e.target.value);
    setDistrict("");
    setTaluka("");
    setPoliceStation("");
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDistrict(e.target.value);
    setTaluka("");
    setPoliceStation("");
  };

  const handleTalukaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTaluka(e.target.value);
    setPoliceStation("");
  };

  const handlePoliceStationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPoliceStation(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Mark fields touched
    setTouched({ pincode: true, landmark: true, fullAddress: true });

    // Validate establishment and owner
    if (!establishmentName.trim()) {
      setError("Establishment name is required.");
      return;
    }
    if (!ownerName.trim()) {
      setError("Owner name is required.");
      return;
    }
    if (cleanPhone.length !== 10) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }
    if (!isEmailValid) {
      setError("Please enter a valid email address.");
      return;
    }

    // Validate location cascading fields
    if (!district.trim()) {
      setError("Please select a District.");
      return;
    }
    if (!taluka.trim()) {
      setError("Please select a Taluka.");
      return;
    }
    if (!policeStation.trim()) {
      setError("Please select a Police Station.");
      return;
    }
    if (!city.trim()) {
      setError("City is required.");
      return;
    }
    if (!cleanPincode.startsWith("5") || cleanPincode.length !== 6) {
      setError("Pincode must be a valid Karnataka pincode (starts with 5).");
      return;
    }
    if (landmark.trim().length < 5) {
      setError("Landmark must be at least 5 characters.");
      return;
    }
    if (fullAddress.trim().length < 10) {
      setError("Full address must be at least 10 characters.");
      return;
    }
    if (!agreeTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy to proceed.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        establishment_name: establishmentName.trim(),
        member_type: memberType,
        owner_name: ownerName.trim(),
        phone: cleanPhone,
        email: email.trim(),
        state: "Karnataka",
        district: district.trim(),
        taluka: taluka.trim(),
        police_station: policeStation.trim(),
        city: city.trim(),
        pincode: cleanPincode,
        landmark: landmark.trim(),
        full_address: fullAddress.trim(),
        address: fullAddress.trim(),
      };

      const res = await fetch("http://localhost:5000/api/register/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to initiate registration.");
      }

      // Save registration session in localStorage
      const registrationData = {
        userId: data.userId,
        orderId: data.orderId,
        username: data.username,
        phone: data.phone,
        amount: data.amount || 1450,
        establishmentName: establishmentName.trim(),
        ownerName: ownerName.trim(),
        memberType,
        district: district.trim(),
        taluka: taluka.trim(),
        policeStation: policeStation.trim(),
        city: city.trim(),
        pincode: cleanPincode,
        landmark: landmark.trim(),
        fullAddress: fullAddress.trim(),
      };
      localStorage.setItem("cvirms_registration", JSON.stringify(registrationData));

      // Redirect to mock payment page
      router.push("/register/payment");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to initiate registration. Please try again.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-[#F7F8FA] selection:bg-[#0EA5E9] selection:text-white font-sans">
      {/* Decorative Full-Screen Radial Gradients */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#E0F2FE] via-[#BAE6FD]/40 to-transparent blur-3xl pointer-events-none opacity-80" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-[#F4EBFF] via-[#E9D5FF]/30 to-transparent blur-3xl pointer-events-none opacity-80" />

      {/* Centered Glassmorphism Registration Card (max-w-[620px]) */}
      <div className="w-full max-w-[620px] relative z-10 p-6 sm:p-9 bg-white/95 backdrop-blur-xl border border-white/80 rounded-2xl shadow-xl shadow-sky-900/5 animate-scale-in my-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-2.5 transition-transform hover:scale-105">
            <Image
              src="/cvirms-logo.png"
              alt="CVIRMS Logo"
              width={44}
              height={44}
              className="object-contain"
              priority
            />
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-[#101828]">
            Register Your Establishment
          </h1>
          <p className="text-xs font-medium text-[#667085] mt-1 max-w-[420px]">
            Join CVIRMS — Karnataka Police & E-Governance Initiative
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2.5 animate-fade-in shadow-xs">
            <svg
              className="w-4 h-4 text-red-500 shrink-0 mt-0.5"
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
            <div className="flex-1 leading-snug">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: ESTABLISHMENT DETAILS */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
                  <path d="M9 22v-4h6v4" />
                  <path d="M8 6h.01" />
                  <path d="M16 6h.01" />
                  <path d="M8 10h.01" />
                  <path d="M16 10h.01" />
                  <path d="M8 14h.01" />
                  <path d="M16 14h.01" />
                </svg>
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#101828]">
                Section 1: Establishment Details
              </h2>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">
                  Establishment Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={establishmentName}
                  onChange={(e) => setEstablishmentName(e.target.value)}
                  placeholder="e.g. Grand Plaza Lodge"
                  className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-[#D0D5DD] bg-white text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">
                  Establishment Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={memberType}
                  onChange={(e) => setMemberType(e.target.value as EstablishmentType)}
                  className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-[#D0D5DD] bg-white text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] transition-all cursor-pointer"
                >
                  {ESTABLISHMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Dashed Section Divider */}
          <div className="border-t border-dashed border-[#D0D5DD]" />

          {/* SECTION 2: OWNER DETAILS */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#101828]">
                Section 2: Owner Details
              </h2>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">
                  Owner Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Ramesh Gowda"
                  className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-[#D0D5DD] bg-white text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-mono text-[#667085]">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="9876543210"
                      className="w-full h-10 pl-11 pr-3 text-xs font-mono font-medium rounded-xl border border-[#D0D5DD] bg-white text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-[#667085] mt-1">
                    OTP verification will happen post-registration
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. ramesh@example.com"
                    className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-[#D0D5DD] bg-white text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dashed Section Divider */}
          <div className="border-t border-dashed border-[#D0D5DD]" />

          {/* SECTION 3: LOCATION DETAILS */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                  <line x1="9" y1="3" x2="9" y2="18" />
                  <line x1="15" y1="6" x2="15" y2="21" />
                </svg>
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#101828]">
                Section 3: Location Details
              </h2>
            </div>

            <div className="space-y-3.5">
              {/* Row 1 (2 cols): State* & District* */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-[#98A2B3] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <select
                      value={state}
                      onChange={handleStateChange}
                      disabled
                      className="w-full h-10 pl-9 pr-8 text-xs font-semibold rounded-xl border border-[#D0D5DD] bg-[#F2F4F7] text-[#475467] focus:outline-none cursor-not-allowed opacity-90 transition-all"
                    >
                      <option value="Karnataka">Karnataka</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    District <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-[#98A2B3] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <select
                      id="district-select"
                      value={district}
                      onChange={handleDistrictChange}
                      className="w-full h-10 pl-9 pr-8 text-xs font-semibold rounded-xl border border-[#D0D5DD] bg-white text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] transition-all cursor-pointer"
                    >
                      <option value="">Select District</option>
                      {districtList.map((d) => (
                        <option key={d.name} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 2 (2 cols): Taluka* & Police Station* */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Taluka <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-[#98A2B3] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <select
                      id="taluka-select"
                      value={taluka}
                      onChange={handleTalukaChange}
                      disabled={!district}
                      className="w-full h-10 pl-9 pr-8 text-xs font-semibold rounded-xl border border-[#D0D5DD] bg-white text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] transition-all cursor-pointer disabled:bg-[#F2F4F7] disabled:text-[#98A2B3] disabled:cursor-not-allowed disabled:opacity-75"
                    >
                      <option value="">
                        {!district
                          ? "Select Taluka"
                          : talukaList.length === 0
                          ? "No talukas available"
                          : "Select Taluka"}
                      </option>
                      {talukaList.map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Police Station <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-[#98A2B3] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <select
                      id="police-station-select"
                      value={policeStation}
                      onChange={handlePoliceStationChange}
                      disabled={!taluka}
                      className="w-full h-10 pl-9 pr-8 text-xs font-semibold rounded-xl border border-[#D0D5DD] bg-white text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] transition-all cursor-pointer disabled:bg-[#F2F4F7] disabled:text-[#98A2B3] disabled:cursor-not-allowed disabled:opacity-75"
                    >
                      <option value="">
                        {!taluka
                          ? "Select Police Station"
                          : policeStationList.length === 0
                          ? "No police stations available"
                          : "Select Police Station"}
                      </option>
                      {policeStationList.map((ps) => (
                        <option key={ps} value={ps}>
                          {ps}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 3 (2 cols): City* & Pincode* */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-[#98A2B3] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Bengaluru"
                      className="w-full h-10 pl-9 pr-3 text-xs font-medium rounded-xl border border-[#D0D5DD] bg-white text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-[#98A2B3] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={pincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setPincode(val);
                        setTouched((prev) => ({ ...prev, pincode: true }));
                      }}
                      onBlur={() => setTouched((prev) => ({ ...prev, pincode: true }))}
                      placeholder="560064"
                      className={`w-full h-10 pl-9 pr-3 text-xs font-mono font-medium rounded-xl border ${
                        pincodeError ? "border-red-400 focus:ring-red-400" : "border-[#D0D5DD] focus:ring-[#0EA5E9]"
                      } bg-white text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                    />
                  </div>
                  {pincodeError && (
                    <p className="text-[12px] text-red-600 mt-1 font-normal leading-tight animate-fade-in">
                      {pincodeError}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 4 (1 col): Landmark* */}
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">
                  Landmark <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-[#98A2B3] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    value={landmark}
                    onChange={(e) => {
                      setLandmark(e.target.value);
                      setTouched((prev) => ({ ...prev, landmark: true }));
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, landmark: true }))}
                    placeholder="Nearby Landmark (e.g., Opposite Bus Stand)"
                    className={`w-full h-10 pl-9 pr-3 text-xs font-medium rounded-xl border ${
                      landmarkError ? "border-red-400 focus:ring-red-400" : "border-[#D0D5DD] focus:ring-[#0EA5E9]"
                    } bg-white text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                  />
                </div>
                {landmarkError && (
                  <p className="text-[12px] text-red-600 mt-1 font-normal leading-tight animate-fade-in">
                    {landmarkError}
                  </p>
                )}
              </div>

              {/* Row 5 (1 col): Full Address* */}
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">
                  Full Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute top-2.5 left-3 pointer-events-none">
                    <svg className="w-4 h-4 text-[#98A2B3] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <textarea
                    rows={2}
                    required
                    value={fullAddress}
                    onChange={(e) => {
                      setFullAddress(e.target.value);
                      setTouched((prev) => ({ ...prev, fullAddress: true }));
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, fullAddress: true }))}
                    placeholder="Building, Street Name, Area..."
                    className={`w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border ${
                      fullAddressError ? "border-red-400 focus:ring-red-400" : "border-[#D0D5DD] focus:ring-[#0EA5E9]"
                    } bg-white text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none`}
                  />
                </div>
                {fullAddressError && (
                  <p className="text-[12px] text-red-600 mt-1 font-normal leading-tight animate-fade-in">
                    {fullAddressError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Dashed Section Divider */}
          <div className="border-t border-dashed border-[#D0D5DD]" />

          {/* SECTION 4: PLAN & PRICING */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#101828]">
                Section 4: Plan & Registration Fee
              </h2>
            </div>

            {/* Pricing Card */}
            <div className="p-4 rounded-xl bg-[#E0F2FE]/70 border border-[#BAE6FD] flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#0284C7]">
                  Statutory Registration Fee
                </p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-mono text-[30px] font-extrabold text-[#101828] leading-none">
                    ₹1,450
                  </span>
                  <span className="text-[11px] text-[#667085] font-medium">
                    (inclusive of 18% GST)
                  </span>
                </div>
                <p className="text-[11px] text-[#667085] mt-1">
                  One-time payment · Lifetime statutory license & updates
                </p>
              </div>

              <div className="w-10 h-10 rounded-full bg-white border border-[#BAE6FD] text-[#0284C7] flex items-center justify-center shadow-xs">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="mt-4 flex items-start gap-2.5">
              <input
                id="agree-terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-[#D0D5DD] text-[#0284C7] focus:ring-[#0EA5E9] cursor-pointer"
              />
              <label htmlFor="agree-terms" className="text-xs text-[#475467] leading-relaxed cursor-pointer select-none">
                I agree to the{" "}
                <span className="text-[#0284C7] font-semibold hover:underline">
                  Terms of Service
                </span>{" "}
                and acknowledge the CVIRMS compliance framework under Karnataka Police Department regulations.
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full flex items-center justify-center gap-2 text-white font-semibold text-[15px] rounded-[8px] transition-all duration-200 hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer select-none shadow-[0_4px_12px_rgba(15,23,42,0.25)] hover:shadow-[0_8px_20px_rgba(15,23,42,0.35)] mt-4"
            style={{
              background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
              padding: "14px",
            }}
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Initiating Registration...</span>
              </>
            ) : (
              <>
                <span>Proceed to Payment</span>
                <svg
                  className="w-4 h-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Return to Login Link */}
        <div className="mt-6 pt-4 border-t border-gray-200/60 text-center text-xs">
          <span className="text-[#667085]">Already registered? </span>
          <Link href="/login" className="font-semibold text-[#0284C7] hover:underline">
            Sign In &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
