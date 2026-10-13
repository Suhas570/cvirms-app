import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-[#101828]">
      <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0EA5E9] flex items-center justify-center font-bold text-xl mb-4">
        🛡
      </div>
      <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">404 — Page Not Found</h2>
      <p className="mt-2 text-sm text-[#667085] max-w-md text-center">
        The requested record or portal page could not be located on the CVIRMS network.
      </p>
      <Link
        href="/"
        className="mt-6 px-6 py-2.5 rounded-xl bg-[#0EA5E9] text-white text-sm font-semibold hover:bg-[#0284C7] transition-all shadow-xs"
      >
        Return to Home
      </Link>
    </div>
  );
}
