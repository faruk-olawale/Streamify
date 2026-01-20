import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShipWheelIcon, BellIcon, LogOutIcon, UsersIcon } from "lucide-react";

import useAuthUser from "../hooks/useAuthUser";
import { logout, getFriendReqests, getGroupNotifications } from "../lib/api";
import ThemeSelector from "./ThemeSelector";

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
  // Fetch friend requests
  const { data: friendRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendReqests,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch group notifications
  const { data: groupNotificationsData } = useQuery({
    queryKey: ["groupNotifications"],
    queryFn: getGroupNotifications,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Count ONLY unread group notifications
  const unreadGroupNotifications =
    groupNotificationsData?.notifications?.filter((n) => !n.read).length || 0;

  // Count ONLY unread accepted friend requests (new connections)
  const unreadAcceptedFriends =
    friendRequests?.acceptedReqs?.filter((n) => !n.read).length || 0;

  // Total notification count: incoming requests + unread accepted + unread group
  const notificationCount =
    (friendRequests?.incomingReqs?.length || 0) +
    unreadAcceptedFriends +
    unreadGroupNotifications;

  // ---------- Logout ----------
  const { mutate: logoutMutation } = useMutation({
    mutationFn: logout,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  });

  // ---------- Scroll behavior (hide on scroll down, show on scroll up) ----------
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
            <Link
              to="/profile"
               className="avatar hidden lg:block">
              <div className="w-9 rounded-full">
                <img
                  src={authUser?.profilePic}
                  alt={authUser?.fullName || "User"}
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      authUser?.fullName || "User"
                    )}&background=random&size=128`;
                  }}
                />
              </div>
            </Link>

            {/* Theme Selector - Desktop only */}
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