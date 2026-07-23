import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type ToastType = "success" | "warning" | "error" | "info";

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const icons = {
  success: <CheckCircle className="text-[#7EA172]" size={20} />,
  warning: <AlertTriangle className="text-[#D9A441]" size={20} />,
  error: <AlertCircle className="text-red-500" size={20} />,
  info: <Info className="text-[#C86E4B]" size={20} />,
};

const bgColors = {
  success: "bg-white border-[#CDE5C9]",
  warning: "bg-white border-[#FBE3B5]",
  error: "bg-white border-red-200",
  info: "bg-white border-[#E7E1DA]",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
              className={`
                pointer-events-auto
                flex
                items-start
                gap-3
                p-4
                rounded-2xl
                shadow-lg
                border
                ${bgColors[toast.type]}
              `}
            >
              <div className="flex-shrink-0 mt-0.5">
                {icons[toast.type]}
              </div>
              <div className="flex-1 text-sm font-medium text-[var(--text)] leading-snug">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 p-0.5 rounded-full hover:bg-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
