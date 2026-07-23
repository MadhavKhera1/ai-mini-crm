import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, TrendingUp, Bot, MessageSquare, ArrowRight, Trash2, Plus } from "lucide-react";
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

  // Task state (persisted to localStorage)
  const [tasks, setTasks] = useState<{ id: string; text: string; completed: boolean }[]>(() => {
    const saved = localStorage.getItem("crm_tasks");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return [
      { id: "1", text: "Follow up with Madhav Khera regarding Rs. 5,000 budget cap", completed: false },
      { id: "2", text: "Prepare starter packages for Gupshup", completed: false },
      { id: "3", text: "Conduct scheduled Monday follow-up call", completed: true },
    ];
  });
  const [newTaskText, setNewTaskText] = useState("");

  useEffect(() => {
    localStorage.setItem("crm_tasks", JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
    };
    setTasks((prev) => [...prev, newTask]);
    setNewTaskText("");
  };

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

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

        {/* Interactive Tasks Panel */}
        <div className="rounded-3xl bg-white border border-[var(--border)] p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-[var(--text)] text-base">
              Sales Tasks
            </h3>
            
            <form onSubmit={handleAddTask} className="flex gap-2">
              <input
                type="text"
                placeholder="Add a sales task..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-[var(--primary)] text-[var(--text)]"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors cursor-pointer flex items-center justify-center flex-shrink-0"
              >
                <Plus size={14} />
              </button>
            </form>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <p className="text-xs text-[var(--text-secondary)] text-center py-4">
                  No tasks left! Nice job.
                </p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--background)]/40 transition-colors"
                  >
                    <div
                      onClick={() => handleToggleTask(task.id)}
                      className="flex items-start gap-3 cursor-pointer select-none flex-1 min-w-0"
                    >
                      <div className={`custom-checkbox ${task.completed ? "checked" : ""}`}>
                        {task.completed && (
                          <svg className="h-2.5 w-2.5 text-white fill-current" viewBox="0 0 20 20">
                            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" fill="#ffffff" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs leading-normal truncate ${task.completed ? "line-through text-[var(--text-secondary)]" : "text-[var(--text)] font-semibold"}`}>
                        {task.text}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
