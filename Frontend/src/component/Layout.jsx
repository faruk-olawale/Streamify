import { useLocation } from "react-router";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";

const Layout = ({ children, showSidebar = false }) => {
  const location = useLocation();

  // Hide Navbar on Groups pages
  const hideNavbar = location.pathname.startsWith("/groups");

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        {showSidebar && <Sidebar />}

        <div className="flex-1 flex flex-col">
          {/* Top Navbar (hidden on Groups pages) */}
          {!hideNavbar && <Navbar />}

          {/* Page Content */}
          <main
            className={`flex-1 overflow-auto ${
              !hideNavbar ? "pt-16 lg:pt-16" : ""
            }`}
          >
            {children}
          </main>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Layout;
