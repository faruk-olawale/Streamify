import { useLocation } from "react-router";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";

const Layout = ({ children, showSidebar = false }) => {
  const location = useLocation();

  const hideNavbar = location.pathname.startsWith("/groups");

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && <Sidebar />}

        <div className="flex-1 flex flex-col overflow-hidden">
          {!hideNavbar && <Navbar />}

          <main
            className={`overflow-auto ${
              !hideNavbar ? "pt-16" : ""
            } pb-16`}
          >
            {children}
          </main>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Layout;
