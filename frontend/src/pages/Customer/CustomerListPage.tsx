import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, User } from "lucide-react";
import { motion } from "framer-motion";
import { customerApi } from "../../services/api";
import type { Customer } from "../../types";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Badge from "../../components/common/Badge";
import type { BadgeVariant } from "../../components/common/Badge";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import LoadingSkeleton from "../../components/common/LoadingSkeleton";
import { useToast } from "../../components/common/Toast";

function CustomerListPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("Lead");

  const { showToast } = useToast();

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await customerApi.getAll();
      setCustomers(data);
    } catch (err) {
      console.error(err);
      showToast("Could not retrieve customer database. Verify the API connection.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !company || !phone) {
      showToast("Please enter all required contact details.", "warning");
      return;
    }

    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast("Please enter a valid email address.", "warning");
      return;
    }

    setIsCreating(true);
    try {
      await customerApi.create({
        name,
        email,
        company,
        phone,
        status,
      });

      showToast(`Added ${name} successfully!`, "success");
      setIsAddOpen(false);
      resetForm();
      fetchCustomers();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || "Could not register customer.";
      showToast(msg, "error");
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setCompany("");
    setPhone("");
    setStatus("Lead");
  };

  // Filter and Search logic
  const filteredCustomers = customers.filter((c) => {
    const query = search.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(query) ||
      c.company.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query);

    const matchesStatus = selectedStatus === "All" || c.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const statuses = ["All", "Lead", "Contacted", "Opportunity", "Customer", "Closed"];

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-[var(--border)]">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-3 flex items-center text-[var(--text-secondary)]">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search by name, company, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-[var(--border)] bg-white pl-10 pr-4 py-3 text-sm text-[var(--text)] outline-none transition-all duration-200 placeholder:text-[var(--text-secondary)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(200,110,75,0.08)]"
          />
        </div>

        {/* Filters and Add Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex overflow-x-auto p-1 bg-[var(--background)] rounded-2xl border border-[var(--border)] scrollbar-none">
            {statuses.map((stat) => (
              <button
                key={stat}
                onClick={() => setSelectedStatus(stat)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap ${selectedStatus === stat ? "bg-white text-[var(--text)] shadow-sm border border-[var(--border)]" : "text-[var(--text-secondary)] hover:text-[var(--text)]"}`}
              >
                {stat}
              </button>
            ))}
          </div>

          <Button onClick={() => setIsAddOpen(true)}>
            <Plus size={18} />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Main Table / Directory List */}
      {isLoading ? (
        <div className="bg-white rounded-3xl border border-[var(--border)] p-6 space-y-4">
          <LoadingSkeleton variant="table-row" count={5} />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          icon={User}
          title={search || selectedStatus !== "All" ? "No matches found" : "Your Customer Directory is empty"}
          description={
            search || selectedStatus !== "All"
              ? "Try adjusting your filters or search keywords."
              : "Register your first lead or customer details to launch relationship trackers."
          }
          actionText={search || selectedStatus !== "All" ? undefined : "Register Customer"}
          onActionClick={search || selectedStatus !== "All" ? undefined : () => setIsAddOpen(true)}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl border border-[var(--border)] overflow-hidden shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--background)] border-b border-[var(--border)] text-xs font-bold text-[var(--text-secondary)] tracking-wider">
                  <th className="px-6 py-4">Name / Contact</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Phone Number</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-sm">
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-[var(--background)]/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link to={`/customers/${customer.id}`} className="group">
                        <div className="font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">
                          {customer.name}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] font-medium">
                          {customer.email}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)] font-medium">
                      {customer.company}
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)] font-medium">
                      {customer.phone}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={customer.status as BadgeVariant}>
                        {customer.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/customers/${customer.id}`}>
                        <Button variant="secondary" className="px-3 py-2 rounded-xl !inline-flex text-xs font-bold">
                          Manage Profiles
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Add Customer Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register New Customer">
        <form onSubmit={handleAddCustomer} className="space-y-6">
          <Input
            label="Full Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="E.g. Madhav Khera"
            required
            disabled={isCreating}
          />

          <Input
            label="Email Address *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E.g. madhav@company.com"
            required
            disabled={isCreating}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company *"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="E.g. Stripe Inc."
              required
              disabled={isCreating}
            />

            <Input
              label="Phone Number *"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="E.g. +1 555-0199"
              required
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text)]">Pipeline Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={isCreating}
              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text)] outline-none transition-all duration-200 focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(200,110,75,0.12)]"
            >
              <option value="Lead">Lead</option>
              <option value="Contacted">Contacted</option>
              <option value="Opportunity">Opportunity</option>
              <option value="Customer">Customer</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <Button variant="secondary" type="button" onClick={() => setIsAddOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Adding..." : "Add Profile"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default CustomerListPage;
