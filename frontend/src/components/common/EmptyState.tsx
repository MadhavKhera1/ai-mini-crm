import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Button from "./Button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onActionClick?: () => void;
  children?: ReactNode;
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onActionClick,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-[var(--border)] rounded-3xl bg-white/50 backdrop-blur-sm">
      <div className="h-16 w-16 rounded-2xl bg-[var(--accent)] flex items-center justify-center text-[var(--primary)] mb-5">
        <Icon size={28} />
      </div>

      <h3 className="text-lg font-bold text-[var(--text)] mb-2">
        {title}
      </h3>

      <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {actionText && onActionClick && (
        <Button onClick={onActionClick}>
          {actionText}
        </Button>
      )}

      {children}
    </div>
  );
}

export default EmptyState;
