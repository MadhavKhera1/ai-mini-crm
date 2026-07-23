import type { ReactNode } from "react";

export type BadgeVariant =
  | "Lead"
  | "Contacted"
  | "Opportunity"
  | "Customer"
  | "Closed"
  | "default"
  | "success"
  | "warning"
  | "neutral";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  Lead: "bg-[#E7E1DA] text-[#2D2A26] border border-[#d2c9be]",
  Contacted: "bg-[#E8D8CC] text-[#C86E4B] border border-[#d9c4b3]",
  Opportunity: "bg-[#FFF8E6] text-[#D9A441] border border-[#FBE3B5]",
  Customer: "bg-[#EAF4E8] text-[#7EA172] border border-[#CDE5C9]",
  Closed: "bg-red-50 text-red-600 border border-red-200",
  default: "bg-[#FAF8F5] text-[#2D2A26] border border-[#E7E1DA]",
  success: "bg-[#EAF4E8] text-[#7EA172] border border-[#CDE5C9]",
  warning: "bg-[#FFF8E6] text-[#D9A441] border border-[#FBE3B5]",
  neutral: "bg-[#FAF8F5] text-[#7A746E] border border-[#E7E1DA]",
};

function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex
        items-center
        justify-center
        rounded-full
        px-2.5
        py-0.5
        text-xs
        font-semibold
        transition-colors
        duration-150
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

export default Badge;
