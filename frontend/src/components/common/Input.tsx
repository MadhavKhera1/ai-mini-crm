import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

function Input({
  label,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[var(--text)]">
        {label}
      </label>

      <input
        className={`w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text)] outline-none transition-all duration-200 placeholder:text-[var(--text-secondary)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(200,110,75,0.12)] ${className}`}
        {...props}
      />
    </div>
  );
}

export default Input;