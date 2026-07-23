import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string;
  delay?: number;
}

function StatCard({
  icon,
  title,
  value,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay,
        duration: 0.5,
      }}
      whileHover={{
        y: -6,
      }}
      className="
        rounded-3xl
        bg-white/70
        backdrop-blur-md
        border
        border-white/60
        p-5
        shadow-sm
      "
    >
      <div className="flex items-center gap-4">

        <div className="h-12 w-12 rounded-2xl bg-[var(--accent)] flex items-center justify-center">
          {icon}
        </div>

        <div>
          <p className="text-sm text-[var(--text-secondary)]">
            {title}
          </p>

          <h3 className="text-xl font-bold text-[var(--text)]">
            {value}
          </h3>
        </div>

      </div>
    </motion.div>
  );
}

export default StatCard;