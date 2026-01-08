import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ShipWheelIcon,
  BellIcon,
  LogOutIcon,
  UsersIcon,
} from "lucide-react";

import useAuthUser from "../hooks/useAuthUser";
import { logout, getFriendReqests } from "../lib/api";
import ThemeSelector from "./ThemeSelector";

// --------- Helpers ----------
function formatTime(timestamp) {
  if (!timestamp) return "Recently";

  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMin < 1) return "Recently";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHrs < 24) return `${diffHrs} hr ago`;
  if (diffHrs < 30) return "1 day ago";
  return null;
}

// --------- Component ----------
const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const isHomePage = location.pathname === "/";
  const isChatPage = location.pathname.startsWith("/chat");
  const isNotificationsPage = location.pathname === "/notifications";
  const isGroupsPage = location.pathname.startsWith("/groups");

  // Fetch notifications
  const { data: friendRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendReqests,
  });

  const visibleAccepted =
    friendRequests?.acceptedReqs?.filter(
      (n) => formatTime(n.updatedAt || n.createdAt) !== null
    ) || [];

  const notificationCount =
    (friendRequests?.incomingReqs?.length || 0) + visibleAccepted.length;

  // Logout
  const { mutate: logoutMutation } = useMutation({
    mutationFn: logout,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  });

  // Handle scroll behavior - hide on scroll down, show on scroll up
  useEffect(() => {
    if (!isHomePage) {
      setIsVisible(true);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        // Always show at top
        setIsVisible(true);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show navbar
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
        // Scrolling down - hide navbar
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY, isHomePage]);

  // Don't show navbar on mobile for certain pages (they'll use bottom nav)
  const showOnMobile = isChatPage || isNotificationsPage || isGroupsPage;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 h-16 bg-base-200 border-b border-base-300 transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      } ${!showOnMobile ? "lg:block" : ""}`}
    >
      <div className="container mx-auto h-full px-4 lg:px-8">
        <div className="flex h-full items-center">
          {/* LEFT - Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <ShipWheelIcon className="w-8 h-8 text-primary" />
            <span className="hidden sm:block text-2xl font-bold font-mono bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-wider">
              Streamify
            </span>
          </Link>

          {/* RIGHT - Actions */}
          <div className="ml-auto flex items-center gap-2 md:gap-3">
            {/* Groups - Desktop only */}
            <Link to="/groups" className="hidden lg:flex btn btn-ghost btn-circle">
              <UsersIcon className="h-6 w-6 opacity-70" />
            </Link>

            {/* Notifications */}
            <Link to="/notifications">
              <button className="btn btn-ghost btn-circle relative">
                <BellIcon className="h-6 w-6 opacity-70" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 badge badge-primary badge-xs">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </button>
            </Link>

            {/* Avatar - Desktop only */}
            <div className="avatar hidden lg:block">
              <div className="w-9 rounded-full">
                <img src={authUser?.profilePic} alt="avatar" />
              </div>
            </div>

            {/* Theme Selector - Desktop only */}
            <div className="hidden lg:block">
              <ThemeSelector />
            </div>

            {/* Logout */}
            <button
              onClick={logoutMutation}
              className="btn btn-ghost btn-circle"
            >
              <LogOutIcon className="h-5 w-5 md:h-6 md:w-6 opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;