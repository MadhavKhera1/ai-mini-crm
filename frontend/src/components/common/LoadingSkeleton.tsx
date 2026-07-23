interface LoadingSkeletonProps {
  variant?: "card" | "table-row" | "text-block" | "circle";
  count?: number;
  className?: string;
}

function LoadingSkeleton({
  variant = "text-block",
  count = 1,
  className = "",
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count });

  const baseClass = "bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-2xl";

  const renderSkeleton = () => {
    switch (variant) {
      case "card":
        return (
          <div className={`p-5 bg-white border border-[var(--border)] rounded-3xl flex items-center gap-4 ${className}`}>
            <div className={`h-12 w-12 rounded-2xl ${baseClass}`} />
            <div className="flex-1 space-y-2">
              <div className={`h-4 w-1/3 ${baseClass}`} />
              <div className={`h-6 w-2/3 ${baseClass}`} />
            </div>
          </div>
        );
      case "table-row":
        return (
          <div className={`flex items-center justify-between p-4 border-b border-[var(--border)] bg-white ${className}`}>
            <div className="flex items-center gap-4 flex-1">
              <div className={`h-10 w-10 rounded-full ${baseClass}`} />
              <div className="flex-1 space-y-2">
                <div className={`h-4 w-1/4 ${baseClass}`} />
                <div className={`h-3 w-1/3 ${baseClass}`} />
              </div>
            </div>
            <div className="flex gap-3">
              <div className={`h-6 w-16 rounded-full ${baseClass}`} />
              <div className={`h-8 w-8 rounded-full ${baseClass}`} />
            </div>
          </div>
        );
      case "circle":
        return <div className={`h-12 w-12 rounded-full ${baseClass} ${className}`} />;
      case "text-block":
      default:
        return (
          <div className={`space-y-2.5 py-2 ${className}`}>
            <div className={`h-4 w-3/4 ${baseClass}`} />
            <div className={`h-4 w-full ${baseClass}`} />
            <div className={`h-4 w-5/6 ${baseClass}`} />
          </div>
        );
    }
  };

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
      <div className="w-full space-y-3">
        {items.map((_, index) => (
          <div key={index}>{renderSkeleton()}</div>
        ))}
      </div>
    </>
  );
}

export default LoadingSkeleton;
