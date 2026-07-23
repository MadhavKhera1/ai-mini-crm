import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, LogOut, X, Bot } from "lucide-react";
import { motion } from "framer-motion";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

function Sidebar({ isOpen, onClose, onLogout }: SidebarProps) {
  const menuItems = [
    {
      path: "/dashboard",
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    {
      path: "/customers",
      name: "Customers",
      icon: <Users size={20} />,
    },
  ];

  const sidebarContent = (
    <div className="w-72 flex flex-col h-full bg-white border-r border-[var(--border)] p-6 justify-between">
      <div className="space-y-8">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[var(--primary)] flex items-center justify-center text-white shadow-md shadow-[rgba(200,110,75,0.2)]">
              <Bot size={22} />
            </div>
            <div>
              <h1 className="font-extrabold text-[var(--text)] text-lg leading-none">
                AI Mini CRM
              </h1>
              <span className="text-[10px] text-[var(--text-secondary)] font-semibold tracking-wider uppercase">
                Sales Assistant
              </span>
            </div>
          </div>

          {/* Close button for mobile screen drawer */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-full hover:bg-[var(--background)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${isActive ? "bg-[var(--accent)] text-[var(--primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--background)]"}`}
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="pt-6 border-t border-[var(--border)] space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-10 rounded-2xl bg-[var(--accent)] text-[var(--primary)] font-bold flex items-center justify-center border border-[var(--border)]">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--text)] truncate">
              Admin
            </p>
            <p className="text-xs text-[var(--text-secondary)] truncate">
              admin@crm.com
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all duration-200 cursor-pointer"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 h-screen sticky top-0 flex-shrink-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (with Backdrop overlay) */}
      <div className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${isOpen ? "visible opacity-100" : "invisible opacity-0"}`}>
        <div
          className="absolute inset-0 bg-[#2D2A26]/40 backdrop-blur-xs"
          onClick={onClose}
        />
        <motion.div
          animate={{ x: isOpen ? 0 : "-100%" }}
          transition={{ type: "tween", duration: 0.25 }}
          className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] h-full shadow-2xl z-50"
        >
          {sidebarContent}
        </motion.div>
      </div>
    </>
  );
}

export default Sidebar;
