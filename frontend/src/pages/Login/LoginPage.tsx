import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { useToast } from "../../components/common/Toast";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const slides = [
    {
      title: "Relationship Intelligence",
      description: "Auto-generate summaries of customer timelines. Synthesize budget expectations, sentiment, and checklists using the Gemini Assistant.",
      tag: "Gemini Integration",
      mockup: (
        <div className="bg-white rounded-3xl border border-[var(--border)] p-6 shadow-sm h-mockup flex flex-col justify-between text-left">
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
              <div className="h-7 w-7 rounded-xl bg-[var(--accent)] text-[var(--primary)] flex items-center justify-center">
                <Bot size={16} />
              </div>
              <span className="text-xs font-extrabold text-[var(--text)]">AI Sales Assistant</span>
              <span className="text-[9px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold ml-auto">Synced</span>
            </div>
            <div className="space-y-1">
              <div className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Executive Summary</div>
              <p className="text-[11px] leading-relaxed text-[var(--text)] bg-[var(--background)] p-3 rounded-xl border border-[var(--border)]">
                Client is looking to purchase 50 licenses next month. Budget is confirmed, and they requested a custom contract structure.
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Next Steps</div>
            <div className="flex items-center gap-2 text-[11px] text-[var(--text)]">
              <input type="checkbox" defaultChecked className="rounded border-[var(--border)]" disabled />
              <span className="line-through text-[var(--text-secondary)]">Schedule demo call</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[var(--text)]">
              <input type="checkbox" className="rounded border-[var(--border)]" disabled />
              <span>Draft licensing proposal</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Chronological Timelines",
      description: "Log phone calls, emails, or negotiations instantly. Keep your team on the same page with detailed interaction notes and inline edits.",
      tag: "Interaction Notes",
      mockup: (
        <div className="bg-white rounded-3xl border border-[var(--border)] p-6 shadow-sm h-mockup flex flex-col justify-between text-left">
          <div className="text-xs font-extrabold text-[var(--text)] pb-2 border-b border-[var(--border)] flex items-center justify-between">
            <span>Interaction History</span>
            <span className="text-[10px] text-[var(--text-secondary)] font-bold">2 Logs</span>
          </div>
          <div className="space-y-4 flex-grow pt-2">
            <div className="relative pl-5 border-l-2 border-[var(--accent)] space-y-1">
              <span className="absolute top-1.5 h-2 w-2 rounded-full bg-[var(--primary)]" style={{ left: "-5px" }} />
              <div className="text-[10px] text-[var(--text-secondary)] font-bold">Today, 2:15 PM • Call</div>
              <div className="text-[11px] text-[var(--text)] bg-[var(--background)]/40 p-2.5 rounded-lg border border-[var(--border)]">
                Shared pricing model options. Madhav was interested in the premium tier.
              </div>
            </div>
            <div className="relative pl-5 border-l-2 border-[var(--accent)] space-y-1">
              <span className="absolute top-1.5 h-2 w-2 rounded-full bg-[var(--text-secondary)]" style={{ left: "-5px" }} />
              <div className="text-[10px] text-[var(--text-secondary)] font-bold">Yesterday, 11:00 AM • Email</div>
              <div className="text-[11px] text-[var(--text)] bg-[var(--background)]/40 p-2.5 rounded-lg border border-[var(--border)]">
                Sent product information sheets and documentation.
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "One-Click Demo Mode",
      description: "Skip typing! Click the Quick Demo button to instantly populate pre-loaded mock profiles, active notes, and AI analysis pipelines.",
      tag: "Quick Start",
      mockup: (
        <div className="bg-white rounded-3xl border border-[var(--border)] p-6 shadow-sm h-mockup flex flex-col justify-center items-center text-center space-y-4">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-amber-50 text-[var(--primary)] items-center justify-center border border-amber-200">
            <Bot size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[var(--text)]">Ready to test drive?</h4>
            <p className="text-xs text-[var(--text-secondary)]">Use our pre-configured sandbox credentials.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEmail("admin@crm.com");
              setPassword("password");
              showToast("Credentials auto-filled!", "success");
            }}
            className="w-full py-2.5 rounded-xl border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--accent)] text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            Auto-fill Credentials
          </button>
        </div>
      )
    }
  ];

  // Auto-play effect
  useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlay, slides.length]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showToast("Please enter both email and password.", "warning");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      localStorage.setItem("crm_auth", "true");
      setIsLoading(false);
      showToast("Welcome back! Logged in successfully.", "success");
      navigate("/dashboard", { replace: true });
    }, 800);
  };

  const handleManualSlide = (idx: number) => {
    setActiveSlide(idx);
    setIsAutoPlay(false); // Stop autoplay when user manually interacts
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[var(--background)] grid lg:grid-cols-2">
      {/* Left Panel: Feature Spotlight & Sandbox */}
      <div className="hidden lg:flex relative overflow-hidden bg-[var(--accent)] flex-col justify-between p-16 w-full items-center">
        {/* Soft decorative background glows */}
        <div className="absolute -top-28 -left-24 h-72 w-72 rounded-full bg-[var(--primary)] opacity-20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[var(--primary)] opacity-15 blur-3xl" />

        {/* Top Centered Brand Header - Prominent and Centered */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-3.5 w-full pt-2">
          <div className="h-12 w-12 rounded-[20px] bg-[var(--primary)] flex items-center justify-center text-white shadow-md shadow-[rgba(200,110,75,0.2)]">
            <Bot size={24} />
          </div>
          <div className="space-y-1">
            <h1 className="font-black text-[var(--text)] text-4xl tracking-tight leading-none">
              AI Mini CRM
            </h1>
            <span className="text-xs text-[var(--text-secondary)] font-bold tracking-widest uppercase">
              Sales Assistant Workspace
            </span>
          </div>
        </div>

        {/* Middle: Feature Carousel - Centered Horizontally & Vertically */}
        <div className="relative z-10 mt-12 mb-8 space-y-6 max-w-md w-full mx-auto flex-1 flex flex-col justify-start pt-8 items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="space-y-2 text-center">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 border border-white/40 text-[9px] font-extrabold text-[var(--primary)] uppercase tracking-wider">
                  <Sparkles size={9} /> {slides[activeSlide].tag}
                </span>
                <h2 className="text-2xl font-extrabold text-[var(--text)] tracking-tight">
                  {slides[activeSlide].title}
                </h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {slides[activeSlide].description}
                </p>
              </div>

              <div className="pt-2">
                {slides[activeSlide].mockup}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom: Carousel Pagination controls */}
        <div className="relative z-10 flex items-center justify-between border-t border-[var(--border)]/40 pt-6 w-full max-w-md">
          <div className="flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleManualSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  activeSlide === idx ? "w-6 bg-[var(--primary)]" : "w-2 bg-[var(--text-secondary)]/35 hover:bg-[var(--text-secondary)]/50"
                }`}
              />
            ))}
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] font-bold tracking-wider">
            0{activeSlide + 1} / 0{slides.length}
          </div>
        </div>
      </div>

      {/* Right Panel: Authenticator form */}
      <div className="flex items-center justify-center p-8 md:p-16 bg-white border-l border-[var(--border)]">
        <div className="w-full max-w-md">
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <h2 className="text-4xl font-extrabold text-[var(--text)] tracking-tight">
                Welcome Back
              </h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Relationships grow one conversation at a time. Enter your credentials to access your sales workspace.
              </p>
            </div>

            <div className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isLoading}
                required
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={isLoading}
                required
              />

              <div className="pt-2">
                <Button type="submit" fullWidth disabled={isLoading}>
                  <span>{isLoading ? "Authenticating..." : "Continue"}</span>
                  <ArrowRight size={16} />
                </Button>

                {/* Mobile Quick Sandbox login */}
                <button
                  type="button"
                  onClick={() => {
                    setEmail("admin@crm.com");
                    setPassword("password");
                    showToast("Sandbox credentials loaded! Click Continue to log in.", "success");
                  }}
                  className="w-full mt-5 py-2.5 rounded-2xl bg-[var(--background)] hover:bg-[var(--accent)]/50 text-[var(--primary)] font-bold text-xs transition-colors cursor-pointer border border-[var(--border)] flex items-center justify-center gap-1.5"
                >
                  <Bot size={14} />
                  <span>Autofill Sandbox Account</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;