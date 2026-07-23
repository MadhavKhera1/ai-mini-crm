import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("crm_auth");
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("crm_auth");
    navigate("/login", { replace: true });
  };

  // Determine page title based on route path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith("/customers/")) {
      if (path.includes("/notes")) {
        return "Customer Activity Notes";
      }
      return "Customer Profile";
    }
    if (path === "/customers") {
      return "Customer Directory";
    }
    if (path === "/dashboard") {
      return "Dashboard Overview";
    }
    return "AI Mini CRM";
  };

  return (
    <div className="min-h-screen w-full bg-[var(--background)] flex">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          title={getPageTitle()}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
