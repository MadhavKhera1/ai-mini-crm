import { Menu, Bell, Search, Bot } from "lucide-react";

interface HeaderProps {
  title: string;
  onOpenSidebar: () => void;
}

function Header({ title, onOpenSidebar }: HeaderProps) {
  return (
    <header className="sticky top-0 bg-[#FAF8F5]/80 backdrop-blur-md z-30 border-b border-[var(--border)] px-6 py-4 flex items-center justify-between gap-4">
      {/* Page Title & Mobile Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-2xl hover:bg-[var(--accent)] text-[var(--text)] transition-colors cursor-pointer border border-[var(--border)] bg-white"
        >
          <Menu size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-[var(--text)] tracking-tight">
            {title}
          </h2>
        </div>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-4">
        {/* Mock search input */}
        <div className="relative hidden md:block w-64">
          <span className="absolute inset-y-0 left-3 flex items-center text-[var(--text-secondary)]">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search CRM..."
            className="w-full rounded-2xl border border-[var(--border)] bg-white pl-10 pr-4 py-2 text-xs font-medium text-[var(--text)] outline-none transition-all duration-200 placeholder:text-[var(--text-secondary)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(200,110,75,0.06)]"
          />
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full bg-[var(--accent)] border border-[#d9c4b3] text-xs font-bold text-[var(--primary)] select-none">
          <Bot size={12} className="animate-pulse" />
          AI Assistant Active
        </div>

        {/* Notifications Button */}
        <button
        className="p-2.5 rounded-2xl hover:bg-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-all duration-200 cursor-pointer border border-[var(--border)] bg-white relative"
        >
          <Bell size={18} />
          <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-[var(--primary)]" />
        </button>
      </div>
    </header>
  );
}

export default Header;
