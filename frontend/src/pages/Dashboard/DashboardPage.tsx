import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, TrendingUp, Bot, MessageSquare, ArrowRight } from "lucide-react";
import StatCard from "../../components/layout/StatCard";
import { customerApi } from "../../services/api";
import type { Customer } from "../../types";
import LoadingSkeleton from "../../components/common/LoadingSkeleton";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";

function DashboardPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true);
        const data = await customerApi.getAll();
        setCustomers(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Unable to sync dashboard stats with the database. Please check if the backend is running.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  const totalCustomers = customers.length;
  const leadCount = customers.filter((c) => c.status === "Lead").length;
  const contactedCount = customers.filter((c) => c.status === "Contacted").length;
  const customerCount = customers.filter((c) => c.status === "Customer").length;

  // Calculate a conversion rate: (Customers / Total) * 100
  const conversionRate = totalCustomers > 0 ? Math.round((customerCount / totalCustomers) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <LoadingSkeleton variant="card" count={4} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 p-6 bg-white border border-[var(--border)] rounded-3xl h-64 flex items-center justify-center">
            <LoadingSkeleton variant="text-block" count={1} />
          </div>
          <div className="p-6 bg-white border border-[var(--border)] rounded-3xl h-64 flex items-center justify-center">
            <LoadingSkeleton variant="text-block" count={1} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Promo Section */}
      <div className="relative overflow-hidden rounded-3xl bg-[var(--accent)] border border-[#d9c4b3] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-[var(--primary)] opacity-10 blur-2xl" />
        <div className="space-y-2 relative z-10 text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-white/40 text-[10px] font-extrabold text-[var(--primary)] uppercase tracking-wider">
            <Bot size={10} /> AI Assistant
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--text)] tracking-tight">
            Nurture your deals, smarter.
          </h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-lg">
            Use the built-in Gemini Assistant to summarize conversation histories, parse emails, and extract actionable next steps instantly.
          </p>
        </div>
        <Link to="/customers" className="relative z-10">
          <Button>
            Go to Customers
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users size={22} color="#C86E4B" />}
          title="Total Directory"
          value={`${totalCustomers} Profiles`}
          delay={0.1}
        />
        <StatCard
          icon={<TrendingUp size={22} color="#C86E4B" />}
          title="Conversion Rate"
          value={`${conversionRate}%`}
          delay={0.2}
        />
        <StatCard
          icon={<MessageSquare size={22} color="#C86E4B" />}
          title="Active Leads"
          value={`${leadCount} Leads`}
          delay={0.3}
        />
        <StatCard
          icon={<Bot size={22} color="#C86E4B" />}
          title="Contacted"
          value={`${contactedCount} Profiles`}
          delay={0.4}
        />
      </div>

      {/* Workspace Insights & Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Additions Card */}
        <div className="lg:col-span-2 rounded-3xl bg-white border border-[var(--border)] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-4">
              <h3 className="font-bold text-[var(--text)] text-base">
                Recent Customer Profiles
              </h3>
              <Link
                to="/customers"
                className="text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>

            {customers.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--text-secondary)]">
                No customer profiles created yet. Get started by clicking "Go to Customers" and creating a contact.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {customers.slice(-4).reverse().map((customer) => (
                  <Link
                    key={customer.id}
                    to={`/customers/${customer.id}`}
                    className="flex items-center justify-between py-3 hover:bg-[var(--background)] px-2 -mx-2 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-[var(--accent)] font-bold text-xs text-[var(--primary)] flex items-center justify-center">
                        {customer.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">
                          {customer.name}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {customer.company}
                        </p>
                      </div>
                    </div>
                    <Badge variant={customer.status}>
                      {customer.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Tips / Quick Actions Panel */}
        <div className="rounded-3xl bg-white border border-[var(--border)] p-6 space-y-5">
          <h3 className="font-bold text-[var(--text)] text-base">
            CRM Checklist
          </h3>
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <input type="checkbox" defaultChecked className="mt-1 accent-[var(--primary)]" />
              <div>
                <p className="font-bold text-[var(--text)]">Frontend scaffolding</p>
                <p className="text-xs text-[var(--text-secondary)]">Establish routes, themes and custom styles.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" defaultChecked className="mt-1 accent-[var(--primary)]" />
              <div>
                <p className="font-bold text-[var(--text)]">CORS & Database connectivity</p>
                <p className="text-xs text-[var(--text-secondary)]">Bind FastAPI routing with local database.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" defaultChecked className="mt-1 accent-[var(--primary)]" />
              <div>
                <p className="font-bold text-[var(--text)]">Customer Directory</p>
                <p className="text-xs text-[var(--text-secondary)]">Build list grids and customer update views.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1 accent-[var(--primary)]" />
              <div>
                <p className="font-bold text-[var(--text)]">Interact with Sales Assistant</p>
                <p className="text-xs text-[var(--text-secondary)]">Enable notes timeline and run AI summaries.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
