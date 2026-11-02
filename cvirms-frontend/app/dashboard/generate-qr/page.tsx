"use client";

import React, { useEffect, useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { QRCodeSVG } from "qrcode.react";

export default function GenerateQRPage() {
  const [qrToken, setQrToken] = useState<string>("");
  const [qrUrl, setQrUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const qrRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function fetchQR() {
      try {
        setLoading(true);
        setError(null);
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("cvirms_token")
            : null;

        const res = await fetch("http://localhost:5000/api/qr/my-qr", {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to load QR code (Status ${res.status})`);
        }

        const data = await res.json();
        if (data.success && data.qrToken) {
          setQrToken(data.qrToken);
          setQrUrl(data.qrUrl || `http://localhost:3001/scan/${data.qrToken}`);
        } else {
          throw new Error(data.message || "Could not retrieve QR token.");
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "An error occurred while loading your QR code.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    fetchQR();
  }, []);

  const handleDownloadPNG = () => {
    if (!qrRef.current) return;
    const svgElement = qrRef.current.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    // Scale up for high-resolution print/display
    const scale = 4;
    const size = 220 * scale;
    canvas.width = size;
    canvas.height = size;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `CVIRMS_QR_${qrToken || "Code"}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (!qrUrl) return;
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#101828] tracking-tight">
            Generate QR Code
          </h1>
          <p className="text-sm text-[#667085] mt-1">
            Share this QR with visitors for self-registration
          </p>
        </div>

        {/* Main Content Card */}
        <div className="flex justify-center">
          <div className="w-full max-w-[600px] bg-white rounded-[16px] border border-[#EAECF0] shadow-md p-8 sm:p-10 transition-all">
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
                <p className="text-sm font-medium">Generating your establishment QR code...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#FEF3F2] border border-[#FECDCA] text-[#D92D20] mx-auto flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-[#101828]">Unable to load QR Code</h2>
                <p className="text-xs text-[#667085] max-w-sm mx-auto">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="space-y-6 text-center">
                {/* Titles */}
                <div>
                  <h2 className="text-[18px] font-bold text-[#101828]">
                    Your Establishment QR Code
                  </h2>
                  <p className="text-[13px] text-[#667085] mt-1">
                    Visitors scan this to self-register
                  </p>
                </div>

                {/* QR Display with subtle border & shadow */}
                <div className="flex justify-center">
                  <div
                    ref={qrRef}
                    className="p-4 bg-white rounded-xl border border-[#EAECF0] shadow-md inline-block hover:shadow-lg transition-shadow"
                  >
                    <QRCodeSVG
                      value={qrUrl}
                      size={220}
                      level="H"
                      includeMargin
                    />
                  </div>
                </div>

                {/* QR Token and URL */}
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F7F8FA] border border-[#EAECF0] rounded-md text-[11px] font-mono text-[#667085]">
                    <span className="font-semibold text-[#101828]">Token:</span>
                    <span>{qrToken}</span>
                  </div>

                  <div>
                    <a
                      href={qrUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-[#0284C7] hover:text-[#0EA5E9] hover:underline break-all transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>{qrUrl}</span>
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleDownloadPNG}
                    type="button"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white text-xs font-bold shadow-sm hover:shadow-md hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Download PNG</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    type="button"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-white border border-[#D0D5DD] text-[#344054] text-xs font-bold hover:bg-[#F9FAFB] hover:border-[#98A2B3] active:scale-[0.98] transition-all cursor-pointer shadow-xs"
                  >
                    <svg className="w-4 h-4 text-[#667085]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect width="12" height="8" x="6" y="14" />
                    </svg>
                    <span>Print</span>
                  </button>

                  <button
                    onClick={handleCopyLink}
                    type="button"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#F7F8FA] border border-[#EAECF0] text-[#475467] text-xs font-semibold hover:bg-[#F2F4F7] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-[#667085]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                    <span>{copied ? "Copied!" : "Copy Link"}</span>
                  </button>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-[#E0F2FE] border border-[#BAE6FD] rounded-[8px] text-left flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-[#0284C7] shrink-0 mt-0.5"
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
                  <p className="text-xs text-[#0369A1] leading-relaxed">
                    Print this QR and place it at your reception desk. Visitors scan with their phone camera to self-register.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
