import React from "react";
import Link from "next/link";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "navy" | "ghost" | "danger" | "success";
  fullWidth?: boolean;
  href?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  fullWidth = true,
  href,
  icon,
  children,
  className = "",
  style = {},
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  // Base classes for consistent sizing, typography, and micro-interactions
  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-semibold text-[15px] rounded-[8px] transition-all duration-200 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 active:translate-y-0 text-center";

  const widthClass = fullWidth ? "w-full" : "";

  let variantClasses = "";
  let variantStyle: React.CSSProperties = {
    padding: "14px",
  };

  switch (variant) {
    case "primary":
      variantClasses =
        "text-white shadow-[0_4px_12px_rgba(14,165,233,0.3)] hover:-translate-y-px hover:shadow-[0_6px_16px_rgba(14,165,233,0.4)]";
      variantStyle.background = "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)";
      break;

    case "navy":
      variantClasses =
        "text-white shadow-[0_4px_12px_rgba(15,23,42,0.25)] hover:-translate-y-px hover:shadow-[0_8px_20px_rgba(15,23,42,0.35)]";
      variantStyle.background = "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)";
      break;

    case "ghost":
      variantClasses =
        "text-[#344054] bg-white border border-[#D0D5DD] shadow-xs hover:bg-[#F9FAFB] hover:text-[#1D2939] hover:-translate-y-px";
      break;

    case "danger":
      variantClasses =
        "text-white shadow-[0_4px_12px_rgba(220,38,38,0.25)] hover:-translate-y-px hover:shadow-[0_6px_16px_rgba(220,38,38,0.35)]";
      variantStyle.background = "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)";
      break;

    case "success":
      variantClasses =
        "text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)] hover:-translate-y-px hover:shadow-[0_6px_16px_rgba(16,185,129,0.35)]";
      variantStyle.background = "linear-gradient(135deg, #10B981 0%, #059669 100%)";
      break;
  }

  const combinedClasses = `${baseClasses} ${widthClass} ${variantClasses} ${className}`.trim();
  const combinedStyle = { ...variantStyle, ...style };

  const content = (
    <>
      <span>{children}</span>
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={combinedClasses} style={combinedStyle}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={combinedClasses}
      style={combinedStyle}
      {...props}
    >
      {content}
    </button>
  );
}
