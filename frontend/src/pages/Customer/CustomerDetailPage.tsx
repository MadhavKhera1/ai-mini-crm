import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Building,
  Phone,
  Mail,
  Trash2,
  Edit,
  Bot,
  Save,
  X,
  Plus,
  MessageSquare,
  RefreshCw,
  ArrowRight,
  Upload,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { customerApi, noteApi, aiApi } from "../../services/api";
import type { Customer, Note, AISummary } from "../../types";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Badge from "../../components/common/Badge";
import type { BadgeVariant } from "../../components/common/Badge";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import LoadingSkeleton from "../../components/common/LoadingSkeleton";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../components/common/Toast";

const parseUTCDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  return new Date(dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : dateStr + "Z");
};

function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const customerId = parseInt(id || "0", 10);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  
  // Page state
  const [isLoading, setIsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Customer Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStatus, setEditStatus] = useState("Lead");
  const [isUpdatingCustomer, setIsUpdatingCustomer] = useState(false);

  // New Note State
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  // Transcript Importer State
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    overview: {
      meeting_summary: string;
      key_topics: string[];
      action_items: string[];
      overall_sentiment: string;
    };
    notes: {
      content: string;
      confidence: number;
      is_duplicate: boolean;
      checked?: boolean;
    }[];
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
      if (file.name.endsWith(".txt") || file.name.endsWith(".docx")) {
        setTranscriptFile(file);
      } else {
        showToast("Invalid file format. Please select a .txt or .docx file.", "warning");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith(".txt") || file.name.endsWith(".docx")) {
        setTranscriptFile(file);
      } else {
        showToast("Invalid file format. Please select a .txt or .docx file.", "warning");
      }
    }
  };

  const triggerAnalysis = async () => {
    if (!transcriptFile) return;
    setIsAnalyzing(true);
    setExtractedData(null);
    
    setAnalysisStep("Uploading document...");
    await new Promise((resolve) => setTimeout(resolve, 600));
    
    setAnalysisStep("Reading document...");
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    setAnalysisStep("Analyzing conversation...");
    await new Promise((resolve) => setTimeout(resolve, 600));
    
    setAnalysisStep("Extracting customer interactions...");
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    setAnalysisStep("Preparing review...");
    await new Promise((resolve) => setTimeout(resolve, 400));
    
    try {
      const result = await noteApi.importPreview(customerId, transcriptFile);
      const enrichedNotes = result.notes.map(n => ({ ...n, checked: true }));
      setExtractedData({
        overview: result.overview,
        notes: enrichedNotes
      });
      showToast("Transcript analyzed successfully! Ready for review.", "success");
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || "Failed to analyze transcript.";
      showToast(detail, "error");
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep("");
    }
  };

  const handleConfirmImport = async () => {
    if (!extractedData) return;
    const notesToImport = extractedData.notes
      .filter((n) => n.checked)
      .map((n) => n.content);
      
    if (notesToImport.length === 0) {
      showToast("Please select at least one interaction to import.", "warning");
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisStep("Importing conversation timeline...");
    
    try {
      const duplicateCount = extractedData.notes.filter(n => n.checked && n.is_duplicate).length;
      const result = await noteApi.importConfirm(customerId, notesToImport);
      showToast(`Imported ${result.imported} notes. Skipped ${duplicateCount} duplicates.`, "success");
      
      const notesData = await noteApi.getByCustomerId(customerId);
      setNotes(notesData);
      
      setAiSummary((prev) => (prev ? { ...prev, is_outdated: true } : null));
      
      setIsTranscriptOpen(false);
      resetTranscriptState();
    } catch (err) {
      console.error(err);
      showToast("Failed to save transcript notes.", "error");
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep("");
    }
  };

  const handleToggleExtractedNote = (index: number) => {
    if (!extractedData) return;
    const updatedNotes = [...extractedData.notes];
    updatedNotes[index].checked = !updatedNotes[index].checked;
    setExtractedData({
      ...extractedData,
      notes: updatedNotes
    });
  };

  const handleTextareaChange = (index: number, newText: string) => {
    if (!extractedData) return;
    const updatedNotes = [...extractedData.notes];
    updatedNotes[index].content = newText;
    setExtractedData({
      ...extractedData,
      notes: updatedNotes
    });
  };

  const resetTranscriptState = () => {
    setTranscriptFile(null);
    setExtractedData(null);
    setIsAnalyzing(false);
    setAnalysisStep("");
  };

  const handleCloseTranscript = () => {
    setIsTranscriptOpen(false);
    resetTranscriptState();
  };

  const getConfidenceLevel = (score: number) => {
    if (score >= 0.8) return { label: "High Confidence", color: "bg-emerald-50 text-emerald-800 border-emerald-200" };
    if (score >= 0.5) return { label: "Medium Confidence", color: "bg-amber-50 text-amber-800 border-amber-200" };
    return { label: "Low Confidence", color: "bg-rose-50 text-rose-800 border-rose-200" };
  };

  // Note editing state
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");
  const [isUpdatingNote, setIsUpdatingNote] = useState(false);
  
  // Note delete state
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);
  const [isDeletingNote, setIsDeletingNote] = useState(false);

  // Checked action items (persisted to state)
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const customerData = await customerApi.getById(customerId);
      setCustomer(customerData);
      
      // Seed edit form values
      setEditName(customerData.name);
      setEditEmail(customerData.email);
      setEditCompany(customerData.company);
      setEditPhone(customerData.phone);
      setEditStatus(customerData.status);

      const notesData = await noteApi.getByCustomerId(customerId);
      setNotes(notesData);

      // Fetch stored AI Summary
      setIsAiLoading(true);
      try {
        const summary = await aiApi.getSummary(customerId);
        setAiSummary(summary);
      } catch (err) {
        console.error("Failed to query stored summary:", err);
        setAiSummary(null);
      } finally {
        setIsAiLoading(false);
      }
    } catch (err) {
      console.error(err);
      showToast("Unable to synchronize profile parameters.", "error");
    } finally {
      setIsLoading(false);
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchData();
    }
  }, [customerId]);

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName || !editEmail || !editCompany || !editPhone) {
      showToast("Required parameters are missing.", "warning");
      return;
    }

    setIsUpdatingCustomer(true);
    try {
      const updated = await customerApi.update(customerId, {
        name: editName,
        email: editEmail,
        company: editCompany,
        phone: editPhone,
        status: editStatus,
      });
      setCustomer(updated);
      showToast("Profile details updated successfully.", "success");
      setIsEditModalOpen(false);
      
      // Mark AI summary as outdated locally
      setAiSummary((prev) => (prev ? { ...prev, is_outdated: true } : null));
    } catch (err) {
      console.error(err);
      showToast("Could not modify customer profile details.", "error");
    } finally {
      setIsUpdatingCustomer(false);
    }
  };

  const handleDeleteCustomer = async () => {
    setIsDeleting(true);
    try {
      await customerApi.delete(customerId);
      showToast("Customer deleted successfully.", "success");
      setDeleteConfirmOpen(false);
      navigate("/customers");
    } catch (err) {
      console.error(err);
      showToast("Could not drop customer from data directory.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) {
      showToast("Note content cannot be empty.", "warning");
      return;
    }

    setIsCreatingNote(true);
    try {
      const note = await noteApi.create(customerId, { content: newNoteContent });
      const updatedNotes = [note, ...notes];
      setNotes(updatedNotes);
      setNewNoteContent("");
      showToast("Log entry saved.", "success");

      // Mark AI summary as outdated locally
      setAiSummary((prev) => (prev ? { ...prev, is_outdated: true } : null));
    } catch (err) {
      console.error(err);
      showToast("Unable to append interaction log.", "error");
    } finally {
      setIsCreatingNote(false);
    }
  };

  const handleStartEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content);
  };

  const handleUpdateNote = async (noteId: number) => {
    if (!editingNoteContent.trim()) {
      showToast("Log content cannot be empty.", "warning");
      return;
    }

    setIsUpdatingNote(true);
    try {
      await noteApi.update(noteId, { content: editingNoteContent });
      const updatedNotes = notes.map((n) => (n.id === noteId ? { ...n, content: editingNoteContent } : n));
      setNotes(updatedNotes);
      setEditingNoteId(null);
      showToast("Log entry updated successfully.", "success");

      // Mark AI summary as outdated locally
      setAiSummary((prev) => (prev ? { ...prev, is_outdated: true } : null));
    } catch (err) {
      console.error(err);
      showToast("Could not modify interaction log entry.", "error");
    } finally {
      setIsUpdatingNote(false);
    }
  };

  const handleDeleteNote = async () => {
    if (noteToDelete === null) return;
    setIsDeletingNote(true);
    try {
      await noteApi.delete(noteToDelete);
      const updatedNotes = notes.filter((n) => n.id !== noteToDelete);
      setNotes(updatedNotes);
      setNoteToDelete(null);
      showToast("Log entry deleted.", "success");

      // Mark AI summary as outdated locally
      setAiSummary((prev) => (prev ? { ...prev, is_outdated: true } : null));
    } catch (err) {
      console.error(err);
      showToast("Could not delete note.", "error");
    } finally {
      setIsDeletingNote(false);
    }
  };

  const handleGenerateAISummary = async () => {
    if (notes.length === 0) {
      showToast("Cannot generate summary without note logs.", "warning");
      return;
    }
    setIsAiLoading(true);
    try {
      const summary = await aiApi.generateSummary(customerId);
      setAiSummary(summary);
      showToast("AI Sales Assistant generated summary.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to compile AI summaries.", "error");
    } finally {
      setIsAiLoading(false);
    }
  };

  const toggleActionItem = (itemText: string) => {
    setCompletedActions((prev) => ({
      ...prev,
      [itemText]: !prev[itemText],
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-6 w-24 bg-gray-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <LoadingSkeleton variant="text-block" count={2} />
          </div>
          <div>
            <LoadingSkeleton variant="card" count={1} />
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <EmptyState
        icon={X}
        title="Profile not found"
        description="The customer directory does not contain this profile index."
        actionText="Back to Directory"
        onActionClick={() => navigate("/customers")}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Back to Directory Link */}
      <Link
        to="/customers"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors group"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        Back to Customer Directory
      </Link>

      {/* Main Profile & Notes Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Customer details card and notes log timeline */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Profile Card details */}
          <div className="bg-white rounded-3xl border border-[var(--border)] p-6 md:p-8 space-y-6 shadow-xs relative overflow-hidden">
            {/* Design accents */}
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-[var(--primary)] opacity-5 blur-2xl" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-6 relative z-10">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text)] tracking-tight">
                    {customer.name}
                  </h1>
                  <Badge variant={customer.status as BadgeVariant}>
                    {customer.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-xs font-semibold text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1.5">
                    <Building size={14} className="text-[var(--primary)]" />
                    {customer.company}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone size={14} className="text-[var(--primary)]" />
                    {customer.phone}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Mail size={14} className="text-[var(--primary)]" />
                    {customer.email}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <Button variant="secondary" onClick={() => setIsEditModalOpen(true)}>
                  <Edit size={16} />
                  Edit Profile
                </Button>
                <Button variant="danger" className="!px-3" onClick={() => setDeleteConfirmOpen(true)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>

            {/* Note logs creator */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[var(--text)]">
                Add Interaction Log
              </h3>
              <form onSubmit={handleCreateNote} className="space-y-3">
                <textarea
                  placeholder="Record key conversation points, pricing negotiations, product questions, or action items..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  disabled={isCreatingNote}
                  className="w-full h-28 rounded-2xl border border-[var(--border)] bg-[var(--background)]/40 p-4 text-sm text-[var(--text)] outline-none transition-all duration-200 placeholder:text-[var(--text-secondary)] focus:bg-white focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(200,110,75,0.08)] resize-none"
                />
                <div className="flex justify-between items-center">
                  <Button
                    type="button"
                    onClick={() => setIsTranscriptOpen(true)}
                    className="font-bold border border-[var(--primary)] bg-[rgba(200,110,75,0.08)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all duration-200"
                  >
                    <Upload size={16} />
                    Import Transcript
                  </Button>
                  <Button type="submit" disabled={isCreatingNote}>
                    <Plus size={16} />
                    {isCreatingNote ? "Saving..." : "Log Note"}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="space-y-4">
            <h3 className="font-bold text-[var(--text)] text-base px-2">
              Conversation Timeline ({notes.length})
            </h3>
            
            {notes.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="Timeline is blank"
                description="No interaction logs documented yet. Write your first conversation note above to sync AI recommendations."
              />
            ) : (
              <div className="relative border-l border-[var(--border)] ml-6 pl-6 space-y-6">
                {notes.map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.25 }}
                    className="relative group"
                  >
                    {/* Timeline Node Point */}
                    <span className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-white bg-[var(--primary)] ring-4 ring-[var(--background)] shadow-xs flex-shrink-0" />

                    <div className="bg-white rounded-2xl border border-[var(--border)] p-4 space-y-2 hover:shadow-xs transition-shadow">
                      {/* Note metadata headers */}
                      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-semibold border-b border-[var(--border)] pb-2">
                        <span>
                          {parseUTCDate(note.created_at).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                            dateStyle: "medium",
                            timeStyle: "short",
                          }) + " IST"}
                        </span>
                        
                        {/* Note actions buttons */}
                        {editingNoteId !== note.id && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleStartEditNote(note)}
                              className="text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => setNoteToDelete(note.id)}
                              className="text-red-500 hover:text-red-600 cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Note Content */}
                      {editingNoteId === note.id ? (
                        <div className="space-y-3 pt-1">
                          <textarea
                            value={editingNoteContent}
                            onChange={(e) => setEditingNoteContent(e.target.value)}
                            disabled={isUpdatingNote}
                            className="w-full h-24 rounded-xl border border-[var(--border)] p-3 text-sm outline-none focus:border-[var(--primary)]"
                          />
                          <div className="flex justify-end gap-2 text-xs">
                            <button
                              onClick={() => setEditingNoteId(null)}
                              disabled={isUpdatingNote}
                              className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--background)] cursor-pointer font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleUpdateNote(note.id)}
                              disabled={isUpdatingNote}
                              className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] cursor-pointer font-bold flex items-center gap-1"
                            >
                              <Save size={12} />
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed">
                          {note.content}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: AI Assistant */}
        <div className="space-y-8">
          
          <div className="bg-white rounded-3xl border border-[var(--border)] p-6 space-y-6 shadow-xs relative overflow-hidden">
            {/* Visual gradient accent */}
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-[var(--primary)] opacity-5 blur-3xl" />

            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] relative z-10">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-[var(--accent)] text-[var(--primary)] flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <h3 className="font-extrabold text-[var(--text)] text-base tracking-tight">
                  AI Sales Assistant
                </h3>
              </div>
              
              {/* Sync Trigger button */}
              {aiSummary && (
                <button
                  onClick={handleGenerateAISummary}
                  disabled={isAiLoading || notes.length === 0}
                  className={`p-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                    aiSummary.is_outdated
                      ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--background)]"
                  }`}
                >
                  <RefreshCw size={14} className={isAiLoading ? "animate-spin" : ""} />
                  Refresh
                </button>
              )}
            </div>

            {/* Outdated Warning Banner */}
            {aiSummary && aiSummary.is_outdated && (
              <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-amber-50/85 border border-amber-200 text-xs text-amber-800 font-bold relative z-10">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  Summary out of date
                </span>
                <button
                  onClick={handleGenerateAISummary}
                  disabled={isAiLoading || notes.length === 0}
                  className="px-2.5 py-1 rounded-xl bg-amber-600 text-white text-[10px] font-extrabold hover:bg-amber-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Refresh AI Summary
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              {isAiLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 py-4"
                >
                  <div className="flex items-center gap-3 text-xs font-bold text-[var(--text-secondary)]">
                    <div className="h-1.5 w-1.5 bg-[var(--primary)] rounded-full animate-ping" />
                    Consulting Gemini model...
                  </div>
                  <LoadingSkeleton variant="text-block" count={1} />
                </motion.div>
              ) : aiSummary ? (
                <motion.div
                  key="summary-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 text-sm"
                >
                  {/* Executive Summary */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Executive Summary
                    </span>
                    <p className="text-xs leading-relaxed text-[var(--text)] bg-[var(--background)]/60 p-4 rounded-2xl border border-[var(--border)]">
                      {aiSummary.summary}
                    </p>
                  </div>

                  {/* Customer Insights */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Behavioral Insights
                    </span>
                    <div className="space-y-3">
                      {aiSummary.insights.map((insight, idx) => (
                        <div key={idx} className="insight-row text-xs text-[var(--text)]">
                          <span className="insight-dot" />
                          <span className="leading-normal">{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Action items */}
                  <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Recommended Next Steps
                    </span>
                    <div className="space-y-2">
                      {aiSummary.action_items.map((action, idx) => {
                        const isDone = !!completedActions[action];
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleActionItem(action)}
                            className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border)] bg-white hover:bg-[var(--background)]/40 transition-colors cursor-pointer select-none"
                          >
                            <div className={`custom-checkbox ${isDone ? "checked" : ""}`}>
                              {isDone && (
                                <svg className="h-2.5 w-2.5 text-white fill-current" viewBox="0 0 20 20">
                                  <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" fill="#ffffff" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-xs leading-normal ${isDone ? "line-through text-[var(--text-secondary)]" : "text-[var(--text)] font-semibold"}`}>
                              {action}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Timestamp */}
                  {aiSummary.last_updated && (
                    <div className="text-[10px] text-right text-[var(--text-secondary)] font-semibold">
                      Refreshed: {parseUTCDate(aiSummary.last_updated).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        hour: "2-digit",
                        minute: "2-digit",
                      }) + " IST"}
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    No AI summary generated for this profile yet. Start by logging interaction notes.
                  </p>
                  <Button
                    onClick={handleGenerateAISummary}
                    disabled={isAiLoading || notes.length === 0}
                    fullWidth
                  >
                    <span>Generate AI Summary</span>
                    <ArrowRight size={14} />
                  </Button>
                  {notes.length === 0 && (
                    <p className="text-[10px] text-amber-600 font-bold leading-normal">
                      * Add at least one interaction note to generate a summary.
                    </p>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>

      {/* Edit Customer Profile details Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modify Customer Details">
        <form onSubmit={handleUpdateCustomer} className="space-y-5">
          <Input
            label="Name *"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
            disabled={isUpdatingCustomer}
          />
          <Input
            label="Email *"
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            required
            disabled={isUpdatingCustomer}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company *"
              value={editCompany}
              onChange={(e) => setEditCompany(e.target.value)}
              required
              disabled={isUpdatingCustomer}
            />
            <Input
              label="Phone *"
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              required
              disabled={isUpdatingCustomer}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text)]">Pipeline Status</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              disabled={isUpdatingCustomer}
              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(200,110,75,0.12)]"
            >
              <option value="Lead">Lead</option>
              <option value="Contacted">Contacted</option>
              <option value="Opportunity">Opportunity</option>
              <option value="Customer">Customer</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <Button variant="secondary" type="button" onClick={() => setIsEditModalOpen(false)} disabled={isUpdatingCustomer}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdatingCustomer}>
              {isUpdatingCustomer ? "Saving..." : "Save Details"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Customer Confirmation dialogue */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteCustomer}
        title="Confirm Profile Deletion"
        description={`This action is permanent. Dropping this profile will discard all associated timeline records for ${customer.name}.`}
        confirmText="Confirm Delete"
        isLoading={isDeleting}
      />

      {/* Delete Note Confirmation dialogue */}
      <ConfirmDialog
        isOpen={noteToDelete !== null}
        onClose={() => setNoteToDelete(null)}
        onConfirm={handleDeleteNote}
        title="Discard Timeline Log Entry"
        description="Are you sure you want to drop this interaction record from the customer timeline?"
        confirmText="Discard Log"
        isLoading={isDeletingNote}
      />
      {/* Import Transcript / Conversation Modal */}
      <Modal isOpen={isTranscriptOpen} onClose={handleCloseTranscript} title="Import Conversation" size="lg">
        <div className="space-y-6">
          {!extractedData && (
            <div className="space-y-4">
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Upload a call transcript, chat log, email thread, or meeting minutes (.txt or .docx). The Gemini model will analyze the conversation to extract key interactions and summarize the meeting.
              </p>

              {/* Drag and Drop Zone */}
              {!transcriptFile ? (
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
                    accept=".txt,.docx"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    disabled={isAnalyzing}
                  />
                  <div className="h-12 w-12 rounded-2xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] shadow-xs">
                    <Upload size={20} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-[var(--text)]">
                      Drag & Drop Transcript here
                    </p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                      Supports .txt and .docx file formats
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
                        {transcriptFile.name}
                      </p>
                      <p className="text-[10px] text-[var(--text-secondary)]">
                        {(transcriptFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  {!isAnalyzing && (
                    <button
                      onClick={resetTranscriptState}
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
          {isAnalyzing && (
            <div className="py-8 flex flex-col items-center justify-center gap-4 text-center">
              <div className="relative flex items-center justify-center">
                <div className="h-12 w-12 rounded-full border-[3px] border-[var(--accent)] border-t-[var(--primary)] animate-spin" />
                <Bot size={18} className="absolute text-[var(--primary)] animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-[var(--text)]">
                  {analysisStep}
                </p>
                <p className="text-[10px] text-[var(--text-secondary)] animate-pulse">
                  Gemini is digesting raw files...
                </p>
              </div>
            </div>
          )}

          {/* Extracted Review Screen */}
          {extractedData && (
            <div className="space-y-6">
              {/* Conversation Overview Summary Card */}
              <div className="p-5 rounded-3xl border border-[var(--border)] bg-[var(--background)]/40 space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <h4 className="font-extrabold text-[var(--text)] text-sm uppercase tracking-wider">
                    Conversation Overview
                  </h4>
                  {/* Sentiment Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                    extractedData.overview.overall_sentiment === "Positive"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : extractedData.overview.overall_sentiment === "Negative"
                      ? "bg-rose-50 text-rose-800 border-rose-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}>
                    {extractedData.overview.overall_sentiment} Sentiment
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Summary */}
                  <div className="space-y-1">
                    <p className="font-bold text-[var(--text-secondary)]">Meeting Summary</p>
                    <p className="leading-relaxed text-[var(--text)]">{extractedData.overview.meeting_summary}</p>
                  </div>

                  {/* Two Column Grid for Key Topics and Action Items */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[var(--border)]/80">
                    <div className="space-y-1.5">
                      <p className="font-bold text-[var(--text-secondary)]">Key Topics</p>
                      <ul className="space-y-1.5 list-none p-0 m-0">
                        {extractedData.overview.key_topics.map((t, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-[var(--text)] text-xs font-semibold leading-relaxed">
                            <span className="h-1.5 w-1.5 bg-[var(--primary)] rounded-full mt-[6px] flex-shrink-0" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-1.5">
                      <p className="font-bold text-[var(--text-secondary)]">Action Items</p>
                      <ul className="space-y-1.5 list-none p-0 m-0">
                        {extractedData.overview.action_items.map((a, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-[var(--text)] text-xs font-semibold leading-relaxed">
                            <span className="h-1.5 w-1.5 bg-[var(--primary)] rounded-full mt-[6px] flex-shrink-0" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Extracted Notes Cards */}
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Extracted Interactions ({extractedData.notes.length})
                </span>
                
                <div className="space-y-3">
                  {extractedData.notes.map((note, idx) => {
                    const confidence = getConfidenceLevel(note.confidence);
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border bg-white space-y-3 shadow-xs transition-colors ${
                          note.checked ? "border-[var(--border)]" : "border-dashed border-gray-200 opacity-60"
                        }`}
                      >
                        {/* Header toolbar */}
                        <div className="flex items-center justify-between gap-3">
                          <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <div
                              onClick={() => handleToggleExtractedNote(idx)}
                              className={`custom-checkbox ${note.checked ? "checked" : ""}`}
                            >
                              {note.checked && (
                                <svg className="h-2.5 w-2.5 text-white fill-current" viewBox="0 0 20 20">
                                  <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" fill="#ffffff" />
                                </svg>
                              )}
                            </div>
                            <span className="text-xs font-bold text-[var(--text)]">
                              Import this note
                            </span>
                          </label>

                          <div className="flex items-center gap-2">
                            {/* Duplicate Warning Badge */}
                            {note.is_duplicate && (
                              <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                Possible Duplicate
                              </span>
                            )}
                            {/* Confidence level */}
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${confidence.color}`}>
                              {confidence.label}
                            </span>
                          </div>
                        </div>

                        {/* Note text field */}
                        {note.checked && (
                          <textarea
                            value={note.content}
                            onChange={(e) => handleTextareaChange(idx, e.target.value)}
                            className="w-full h-20 rounded-xl border border-[var(--border)] bg-[var(--background)]/30 p-3 text-xs text-[var(--text)] outline-none focus:bg-white focus:border-[var(--primary)] transition-all resize-none font-semibold leading-relaxed"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reset upload */}
              <Button onClick={resetTranscriptState} variant="secondary" fullWidth className="font-bold border border-[var(--border)]">
                Upload Different File
              </Button>
            </div>
          )}

          {/* Action Footer Buttons */}
          {!isAnalyzing && (
            <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
              <Button onClick={handleCloseTranscript} variant="secondary" className="flex-1 font-bold border border-[var(--border)]">
                Cancel
              </Button>
              {!extractedData ? (
                <Button
                  onClick={triggerAnalysis}
                  disabled={!transcriptFile}
                  className="flex-1 font-bold"
                >
                  Analyze File
                </Button>
              ) : (
                <Button
                  onClick={handleConfirmImport}
                  className="flex-1 font-bold"
                >
                  Import Selected
                </Button>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default CustomerDetailPage;
