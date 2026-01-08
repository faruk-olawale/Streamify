import React from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ShipWheelIcon,
  BellIcon,
  LogOutIcon,
  ArrowLeft,
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

  const isHomePage = location.pathname === "/";
  const isChatPage = location.pathname.startsWith("/chat");
  const isNotificationsPage = location.pathname === "/notifications";

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
    (friendRequests?.incomingReqs?.length || 0) +
    visibleAccepted.length;

  // Logout
  const { mutate: logoutMutation } = useMutation({
    mutationFn: logout,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  });

  return (
    <nav className="sticky top-0 z-30 h-16 bg-base-200 border-b border-base-300">
      <div className="container mx-auto h-full px-4 lg:px-8">
        <div className="flex h-full items-center">

          {/* LEFT */}
          {(isHomePage || isChatPage) && !isNotificationsPage && (
            <Link to="/" className="flex items-center gap-2.5">
              <ShipWheelIcon className="size-7 text-primary" />
              {/* <span className="text-2xl font-bold font-mono bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-wider">
                Streamify
              </span> */}
            </Link>
          )}

          {isNotificationsPage && (
            <button
              onClick={() => navigate("/")}
              className="btn btn-ghost btn-circle"
            >
              <ArrowLeft className="h-6 w-6 opacity-70" />
            </button>
          )}

          {/* RIGHT */}
          <div className="ml-auto flex items-center gap-3">

            {!isChatPage && (
              <>
                <Link to="/groups" className="btn btn-ghost btn-circle">
                  <UsersIcon className="h-6 w-6 opacity-70" />
                </Link>

                <Link to="/notifications">
                  <button className="btn btn-ghost btn-circle relative">
                    <BellIcon className="h-6 w-6 opacity-70" />
                    {notificationCount > 0 && (
                      <span className="absolute top-1 right-1 badge badge-primary badge-sm">
                        {notificationCount > 9 ? "9+" : notificationCount}
                      </span>
                    )}
                  </button>
                </Link>

                <div className="avatar">
                  <div className="w-9 rounded-full">
                    <img
                      src={authUser?.profilePic}
                      alt="avatar"
                    />
                  </div>
                </div>
              </>
            )}

            <ThemeSelector />

            <button
              onClick={logoutMutation}
              className="btn btn-ghost btn-circle"
            >
              <LogOutIcon className="h-6 w-6 opacity-70" />
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
