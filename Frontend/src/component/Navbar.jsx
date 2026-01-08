import React from 'react';
import useAuthUser from '../hooks/useAuthUser';
import { useLocation, useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { logout, getFriendReqests } from '../lib/api';
import { Link } from 'react-router';
import { ShipWheelIcon, BellIcon, LogOutIcon, ArrowLeft, UsersIcon } from 'lucide-react';
import ThemeSelector from './ThemeSelector';

// Utility: Check if accepted request is still visible and format time
function formatTime(timestamp) {
  if (!timestamp) return "Recently";

  const now = Date.now();
  const diffMs = now - new Date(timestamp).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffSec < 60) return "Recently"; // 0–59 sec
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs === 1 ? "" : "s"} ago`;
  if (diffHrs < 30) return "1 day ago"; // 24–30 hours
  return null; // Remove after 30 hours
}

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isChatPage = location.pathname.startsWith("/chat");
  const isNotificationsPage = location.pathname === "/notifications";

  // Show back arrow only on Notifications page
  const showBackArrow = isNotificationsPage;

  // Fetch friend requests
  const { data: friendRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendReqests,
  });

  // Filter visible accepted requests for counter
  const visibleAccepted = (friendRequests?.acceptedReqs || []).filter(
    (n) => formatTime(n.updatedAt || n.createdAt) !== null
  );

  // Only count incoming requests + visible accepted
  const notificationCount =
    (friendRequests?.incomingReqs?.length || 0) + visibleAccepted.length;

  // Logout mutation
  const { mutate: logoutMutation } = useMutation({
    mutationFn: logout,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  });

  return (
    <nav className='bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center'>
      <div className='container mx-auto px-4 lg:px-8'>
        <div className='flex items-center justify-end w-full'>

          {/* BACK ARROW - ONLY ON NOTIFICATIONS PAGE */}
          {showBackArrow && (
            <div className='mr-auto lg:hidden'>
              <button
                onClick={() => navigate("/")}
                className='btn btn-ghost btn-circle'
                aria-label="Back to home"
              >
                <ArrowLeft className="h-6 w-6 text-base-content opacity-70" />
              </button>
            </div>
          )}

          {/* CHAT PAGE LOGO */}
          {isChatPage && (
            <div className='pl-5'>
              <Link to="/" className="flex items-center gap-2.5">
                <ShipWheelIcon className="size-9 text-primary" />
                <span className='text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r
                  from-primary to-secondary tracking-wider'>
                  Streamify
                </span>
              </Link>
            </div> 
          )}

          <div className='flex items-center gap-3 sm:gap-4 ml-auto'>

              <Link to="/groups" className="flex items-center gap-2.5">
             <div className='btn btn-ghost btn-circle'>
              <UsersIcon className="h-6 w-6 text-base-content opacity-70" />
            </div>
            </Link>

            {/* NOTIFICATIONS ICON */}
            <Link to={"/notifications"}>
              <button className='btn btn-ghost btn-circle relative'>
                <BellIcon className="h-6 w-6 text-base-content opacity-70" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 badge badge-primary badge-sm text-xs font-semibold">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
            </Link>

            <ThemeSelector />

            {/* USER AVATAR */}
            <div className='avatar'>
              <div className='w-9 rounded-full'>
                <img src={authUser?.profilePic} alt="User Avatar" rel='noreferer' />
              </div>
            </div>

            {/* LOGOUT */}
            <div className='btn btn-ghost btn-circle' onClick={logoutMutation}>
              <LogOutIcon className="h-6 w-6 text-base-content opacity-70" />
            </div>

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
