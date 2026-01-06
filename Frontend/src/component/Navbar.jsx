import React from 'react'
import useAuthUser from '../hooks/useAuthUser'
import { useLocation, useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { logout, getFriendReqests } from '../lib/api';
import { Link } from 'react-router';
import { ShipWheelIcon, BellIcon, LogOutIcon, ArrowLeft } from 'lucide-react';
import ThemeSelector from './ThemeSelector';

const Navbar = () => {
  const {authUser} = useAuthUser();
  const location = useLocation();
  const navigate = useNavigate();
  const isChatPage = location.pathname.startsWith("/chat");
  const isNotificationsPage = location.pathname === "/notifications";
  const showBackArrow = isChatPage || isNotificationsPage; // Show on both pages

  const queryClient = useQueryClient();

  // Get notification count
  const { data: friendRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendReqests,
  });

  const notificationCount = (friendRequests?.incomingReqs?.length || 0) + (friendRequests?.acceptedReqs?.length || 0);

  const {mutate:logoutMutation} = useMutation({
    mutationFn: logout,
    onSuccess:() => queryClient.invalidateQueries({queryKey: ["authUser"]})
  })

  return (
    <nav className='bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center'>
      <div className='container mx-auto px-4 lg:px-8'>
        <div className='flex items-center justify-end w-full'>
          {/* BACK ARROW - SHOW ON CHAT & NOTIFICATIONS PAGE (MOBILE & TABLET ONLY) */}
          {showBackArrow && (
            <div className='mr-auto lg:hidden'>
              <button 
                onClick={() => navigate("/")}
                className='btn btn-ghost btn-circle'
                aria-label="Back to home"
              >
                <ArrowLeft className="h-6 w-6 text-base-content opacity-70"/>
              </button>
            </div>
          )}

          {/* LOGO ONLY IN THE CHAT PAGE */}
          {isChatPage && (
            <div className='pl-5'>
              <Link to="/" className="flex items-center gap-2.5">
               <ShipWheelIcon className="size-9 text-primary"/>
               <span className='text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r
               from-primary to-secondary tracking-wider'>
                Streamify
               </span>
              </Link>
            </div>
          )}

          <div className='flex items-center gap-3 sm:gap-4 ml-auto'>
            <Link to={"/notifications"}>
             <button className='btn btn-ghost btn-circle relative'>
              <BellIcon className="h-6 w-6 text-base-content opacity-70"/>
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 badge badge-primary badge-sm text-xs font-semibold">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
             </button>
            </Link>
          </div>

          <ThemeSelector/>

          <div className='avater'>
            <div className='w-9 rounded-full'>
              <img src={authUser?.profilePic} alt="User Avater" rel='noreferer' />
            </div>
          </div>

          <div className='btn btn-ghost btn-circle' onClick={logoutMutation}>
            <LogOutIcon className="h-6 w-6 text-base-content opacity-70"/>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar