import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variantClasses = {
  primary:
    "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]",

  secondary:
    "bg-white border border-[var(--border)] text-[var(--text)] hover:bg-[var(--accent)]",

  danger:
    "bg-red-500 text-white hover:bg-red-600",
};

function Button({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  return (
  <motion.button
    whileHover={{
      y: -2,
      scale: 1.01,
    }}
    whileTap={{
      scale: 0.98,
    }}
    className={`group rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${variantClasses[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
    {...(props as any)}
  >
    {children}

    {variant === "primary" && (
      <ArrowRight
        size={18}
        className="transition-transform duration-200 group-hover:translate-x-1"
      />
    )}
  </motion.button>
);
}

export default Button;