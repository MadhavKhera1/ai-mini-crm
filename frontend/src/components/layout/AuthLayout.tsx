import type { ReactNode } from "react";
import { Users, Bot, TrendingUp } from "lucide-react";

import StatCard from "./StatCard";

interface AuthLayoutProps {
  children: ReactNode;
}

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] grid lg:grid-cols-2">
      {/* Left Panel */}
      <div className="hidden lg:flex relative overflow-hidden bg-[var(--accent)]">
        <div className="absolute -top-28 -left-24 h-72 w-72 rounded-full bg-[var(--primary)] opacity-20 blur-3xl" />

        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[var(--primary)] opacity-15 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          <div>
            <h1 className="text-5xl font-extrabold text-[var(--text)] leading-tight">
              AI Mini CRM
            </h1>

            <p className="mt-6 text-lg leading-8 text-[var(--text-secondary)] max-w-md">
              Manage customers, conversations and insights with a clean,
              modern CRM experience.
            </p>
          </div>

          <div className="space-y-5">
            <StatCard
              icon={<Users size={24} color="#C86E4B" />}
              title="Customers"
              value="248 Active"
              delay={0.2}
            />

            <StatCard
              icon={<Bot size={24} color="#C86E4B" />}
              title="AI Summaries"
              value="93 Generated"
              delay={0.35}
            />

            <StatCard
              icon={<TrendingUp size={24} color="#C86E4B" />}
              title="Follow-up Rate"
              value="92%"
              delay={0.5}
            />
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

export default AuthLayout;