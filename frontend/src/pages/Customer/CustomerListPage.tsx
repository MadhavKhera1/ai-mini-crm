import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, User, Upload, X, FileText, AlertCircle, Bot } from "lucide-react";
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

  // Import CSV state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [importResult, setImportResult] = useState<{
    total: number;
    imported: number;
    skipped: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".csv")) {
        setImportFile(file);
      } else {
        showToast("Invalid file format. Please select a CSV file.", "warning");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith(".csv")) {
        setImportFile(file);
      } else {
        showToast("Invalid file format. Please select a CSV file.", "warning");
      }
    }
  };

  const triggerUpload = async () => {
    if (!importFile) return;
    setIsUploading(true);
    setImportResult(null);

    setUploadStep("Uploading file...");
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    setUploadStep("Reading CSV stream...");
    await new Promise((resolve) => setTimeout(resolve, 600));
    
    setUploadStep("Importing customer records...");
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    try {
      const result = await customerApi.importCustomers(importFile);
      setImportResult(result);
      showToast(`Import complete! ${result.imported} profiles added successfully.`, "success");
      
      const updatedList = await customerApi.getAll();
      setCustomers(updatedList);
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || "Import failed. Please verify file format.";
      showToast(detail, "error");
    } finally {
      setIsUploading(false);
      setUploadStep("");
    }
  };

  const resetImportState = () => {
    setImportFile(null);
    setImportResult(null);
    setIsUploading(false);
    setUploadStep("");
  };

  const handleCloseImport = () => {
    setIsImportOpen(false);
    resetImportState();
  };

  const downloadSampleCSV = () => {
    const csvContent = "name,email,company,phone,status\n" +
      "Madhav Khera,madhav@example.com,Gupshup,9876543210,Customer\n" +
      "Manoj Kumar,manoj@example.com,DriveX,9123456789,Lead\n" +
      "Jane Doe,jane@example.com,TechCorp,,Opportunity\n";
      
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "sample_customers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
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

          <Button
            onClick={() => setIsImportOpen(true)}
            className="font-bold border border-[var(--primary)] bg-[rgba(200,110,75,0.08)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all duration-200"
          >
            <Upload size={16} />
            Import CSV
          </Button>

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

      {/* CSV Import Modal */}
      <Modal isOpen={isImportOpen} onClose={handleCloseImport} title="CSV Bulk Import">
        <div className="space-y-6">
          {!importResult && (
            <div className="space-y-4">
              {/* Expected Format Tips */}
              <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--border)] space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Expected CSV Format
                </span>
                <p className="font-mono text-xs text-[var(--primary)] bg-white p-2.5 rounded-xl border border-[var(--border)] select-all overflow-x-auto whitespace-nowrap">
                  name,email,company,phone,status
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-[var(--text-secondary)]">
                    * Required: name, email (others are optional).
                  </span>
                  <button
                    onClick={downloadSampleCSV}
                    className="text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors cursor-pointer"
                  >
                    Download Sample CSV
                  </button>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              {!importFile ? (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`
                    border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer relative overflow-hidden min-h-[180px]
                    ${dragActive 
                      ? "border-[var(--primary)] bg-[var(--accent)]/15 scale-[0.99]" 
                      : "border-[var(--border)] hover:border-gray-400 bg-white"
                    }
                  `}
                >
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    disabled={isUploading}
                  />
                  <div className="h-12 w-12 rounded-2xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] shadow-xs">
                    <Upload size={20} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-[var(--text)]">
                      Drag & Drop CSV File here
                    </p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                      or click to browse your local directory
                    </p>
                  </div>
                </div>
              ) : (
                /* Selected File Preview */
                <div className="p-4 rounded-2xl border border-[var(--border)] bg-white flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-[var(--accent)] text-[var(--primary)] flex items-center justify-center flex-shrink-0">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--text)] truncate">
                        {importFile.name}
                      </p>
                      <p className="text-[10px] text-[var(--text-secondary)]">
                        {(importFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  {!isUploading && (
                    <button
                      onClick={resetImportState}
                      className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Uploading Stepper Progress */}
          {isUploading && (
            <div className="py-6 flex flex-col items-center justify-center gap-4 text-center">
              <div className="relative flex items-center justify-center">
                <div className="h-12 w-12 rounded-full border-[3px] border-[var(--accent)] border-t-[var(--primary)] animate-spin" />
                <Bot size={18} className="absolute text-[var(--primary)] animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-[var(--text)]">
                  {uploadStep}
                </p>
                <p className="text-[10px] text-[var(--text-secondary)] animate-pulse">
                  Please hold, this might take a moment.
                </p>
              </div>
            </div>
          )}

          {/* Import Result Summary */}
          {importResult && (
            <div className="space-y-6">
              {/* Summary Cards Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                  <p className="text-xs font-bold text-emerald-800">✔ Imported</p>
                  <p className="text-lg font-black text-emerald-600 mt-1">{importResult.imported}</p>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 text-center">
                  <p className="text-xs font-bold text-amber-800">⚠ Skipped</p>
                  <p className="text-lg font-black text-amber-600 mt-1">{importResult.skipped}</p>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-center">
                  <p className="text-xs font-bold text-rose-800">❌ Failed</p>
                  <p className="text-lg font-black text-rose-600 mt-1">{importResult.failed}</p>
                </div>
              </div>

              {/* Row Level Errors Box */}
              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-rose-500" />
                    Row-Level Failures ({importResult.errors.length})
                  </span>
                  <div className="max-h-[160px] overflow-y-auto p-3 rounded-2xl border border-rose-200 bg-rose-50/30 space-y-1.5">
                    {importResult.errors.map((err, idx) => (
                      <p key={idx} className="text-xs text-rose-700 font-medium leading-relaxed">
                        {err}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Reset to upload more button */}
              <Button onClick={resetImportState} variant="secondary" fullWidth className="font-bold border border-[var(--border)]">
                Import Another File
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          {!isUploading && !importResult && (
            <div className="flex gap-3">
              <Button onClick={handleCloseImport} variant="secondary" className="flex-1 font-bold border border-[var(--border)]">
                Cancel
              </Button>
              <Button
                onClick={triggerUpload}
                disabled={!importFile}
                className="flex-1 font-bold"
              >
                Upload File
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default CustomerListPage;
