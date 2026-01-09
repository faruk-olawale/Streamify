import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShipWheelIcon, BellIcon, LogOutIcon, UsersIcon } from "lucide-react";

import useAuthUser from "../hooks/useAuthUser";
import { logout, getFriendReqests, getGroupNotifications } from "../lib/api";
import ThemeSelector from "./ThemeSelector";

// ---------- Helpers ----------
function formatTime(timestamp) {
  if (!timestamp) return "Recently";

  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMin < 1) return "Recently";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHrs < 24) return `${diffHrs} hr ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return null;
}

// Fallback avatar generator
function generateAvatarUrl(name) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";
  return `https://ui-avatars.com/api/?name=${initials}&background=random`;
}

// ---------- Navbar Component ----------
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

  // ---------- Queries ----------
  const { data: friendRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendReqests,
  });

  const { data: groupNotificationsData } = useQuery({
    queryKey: ["groupNotifications"],
    queryFn: getGroupNotifications,
    refetchInterval: 30000,
  });

  const unreadGroupNotifications =
    groupNotificationsData?.notifications?.filter((n) => !n.read).length || 0;

  const unreadFriendNotifications =
    friendRequests?.acceptedReqs?.filter((n) => !n.read).length || 0;

  const notificationCount =
    (friendRequests?.incomingReqs?.length || 0) +
    unreadFriendNotifications +
    unreadGroupNotifications;

  // ---------- Logout ----------
  const { mutate: logoutMutation } = useMutation({
    mutationFn: logout,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  });

  // ---------- Scroll behavior ----------
  useEffect(() => {
    if (!isHomePage) {
      setIsVisible(true);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isHomePage]);

  const showOnMobile = isChatPage || isNotificationsPage || isGroupsPage;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 h-16 bg-base-200 border-b border-base-300 transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      } ${!showOnMobile ? "lg:block" : ""}`}
    >
      <div className="container mx-auto h-full px-4 lg:px-8">
        <div className="flex h-full items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <ShipWheelIcon className="w-8 h-8 text-primary" />
            <span className="hidden sm:block text-2xl font-bold font-mono bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-wider">
              Streamify
            </span>
          </Link>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <Link to="/groups" className="hidden lg:flex btn btn-ghost btn-circle">
              <UsersIcon className="h-6 w-6 opacity-70" />
            </Link>

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

            {/* Avatar */}
            <div className="avatar hidden lg:block">
              <div className="w-9 rounded-full">
                <img
                  src={authUser?.profilePic || generateAvatarUrl(authUser?.fullName)}
                  alt={authUser?.fullName || "User"}
                />
              </div>
            </div>

            {/* Theme Selector */}
            <div className="hidden lg:block">
              <ThemeSelector />
            </div>

            {/* Logout */}
            <button onClick={logoutMutation} className="btn btn-ghost btn-circle">
              <LogOutIcon className="h-5 w-5 md:h-6 md:w-6 opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
