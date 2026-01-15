import { Link, useLocation } from "react-router";
import { Home, Users, MessageCircle, UserCircle } from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";
import Avatar from "./Avatar";

const BottomNav = () => {
  const location = useLocation();
  const { authUser } = useAuthUser();

  // Hide BottomNav on ChatPage and GroupChatPage
  if (location.pathname.startsWith("/chat") || location.pathname.startsWith("/groups/")) {
    return null;
  }

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Spacer to prevent content from being covered by navbar */}
      <div className="h-16 w-full lg:hidden" />
     <nav className="fixed bottom-0 left-0 right-0 z-50 bg-base-200 border-t border-base-300 lg:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {/* Home */}
          <Link
            to="/"
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-lg transition-colors ${
              isActive("/") ? "text-primary" : "text-base-content/60"
            }`}
          >
            <Home size={24} className={isActive("/") ? "fill-current" : ""} />
          </Link>

          {/* Friends/Chat */}
          <Link
            to="/friends"
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-lg transition-colors ${
              isActive("/friends") ? "text-primary" : "text-base-content/60"
            }`}
          >
            <MessageCircle size={24} className={isActive("/friends") ? "fill-current" : ""} />
          </Link>

          {/* Groups */}
          <Link
            to="/groups"
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-lg transition-colors ${
              isActive("/groups") ? "text-primary" : "text-base-content/60"
            }`}
          >
            <Users size={24} className={isActive("/groups") ? "fill-current" : ""} />
          </Link>

          {/* Profile */}
          <Link
            to="/profile"
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-lg transition-colors ${
              isActive("/profile") ? "text-primary" : "text-base-content/60"
            }`}
          >
            {authUser?.profilePic ? (
              <Avatar 
                src={authUser.profilePic} 
                alt={authUser.fullName || 'Profile'}
                size="sm"
                showRing={isActive("/profile")}
              />
            ) : (
              <UserCircle size={24} className={isActive("/profile") ? "fill-current" : ""} />
            )}
          </Link>
        </div>
      </nav>
    </>
  );
};

export default BottomNav;