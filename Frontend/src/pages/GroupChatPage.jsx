import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getGroupDetails,
  requestJoinGroup,
  approveJoinRequest,
  rejectJoinRequest,
  removeMember,
  leaveGroup,
  deleteGroup,
  getStreamToken,
} from "../lib/api";
import { useStreamClient } from "../hooks/useStreamClient";
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageList,
  MessageInput,
  Window,
  Thread,
  TypingIndicator,
} from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";
import {
  ArrowLeft,
  Users,
  Settings,
  UserPlus,
  UserMinus,
  Shield,
  Trash2,
  LogOut,
  Crown,
  CheckCircle,
  XCircle,
  Edit,
  X,
} from "lucide-react";
import EditGroupModal from "../component/EditGroupModal";
import AddMembersModal from "../component/AddMembersModal";

const GroupChatPage = ({ authUser }) => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch group details
  const {
    data: groupData,
    isLoading: loadingGroup,
    refetch: refetchGroup,
  } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => getGroupDetails(groupId),
  });

  const group = groupData?.group;
  const userRole = groupData?.userRole;

  // Fetch Stream token
  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  // Use global Stream client
  const { client, isConnecting } = useStreamClient(
    authUser,
    tokenData?.token
  );

  // Setup channel when client and group are ready
  useEffect(() => {
    if (!client || !group || !userRole?.isMember) {
      setChannel(null);
      return;
    }

    let activeChannel = null;
    let isMounted = true;

    const setupChannel = async () => {
      try {
        activeChannel = client.channel(
          "messaging",
          group.streamChannelId
        );
        await activeChannel.watch();

        if (isMounted) {
          setChannel(activeChannel);
        }
      } catch (err) {
        console.error("Channel setup error:", err);
        if (isMounted) {
          toast.error("Could not connect to chat. Please try again.");
        }
      }
    };

    setupChannel();

    return () => {
      isMounted = false;
      // Only stop watching the channel, don't disconnect client
      if (activeChannel) {
        activeChannel.stopWatching().catch(console.error);
      }
      setChannel(null);
    };
  }, [client, group, userRole]);

  // Request to join mutation
  const requestJoinMutation = useMutation({
    mutationFn: () => requestJoinGroup(groupId),
    onSuccess: () => {
      toast.success("Join request sent!");
      refetchGroup();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to send request");
    },
  });

  // Approve request mutation
  const approveRequestMutation = useMutation({
    mutationFn: (userId) => approveJoinRequest(groupId, userId),
    onSuccess: () => {
      toast.success("User approved!");
      refetchGroup();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to approve");
    },
  });

  // Reject request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: (userId) => rejectJoinRequest(groupId, userId),
    onSuccess: () => {
      toast.success("Request rejected");
      refetchGroup();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to reject");
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId) => removeMember(groupId, userId),
    onSuccess: () => {
      toast.success("Member removed");
      refetchGroup();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to remove member");
    },
  });

  // Leave group mutation
  const leaveGroupMutation = useMutation({
    mutationFn: () => leaveGroup(groupId),
    onSuccess: () => {
      toast.success("Left group successfully");
      queryClient.invalidateQueries(["my-groups"]);
      navigate("/groups");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to leave group");
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: () => deleteGroup(groupId),
    onSuccess: () => {
      toast.success("Group deleted successfully");
      queryClient.invalidateQueries(["my-groups"]);
      queryClient.invalidateQueries(["all-groups"]);
      navigate("/groups");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete group");
    },
  });

  if (loadingGroup || isConnecting) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-4">
          <h2 className="text-xl md:text-2xl font-bold mb-2">Group not found</h2>
          <button onClick={() => navigate("/groups")} className="btn btn-primary btn-sm md:btn-md">
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  const isPending = group.pendingRequests?.some(
    (req) => req.userId._id === authUser._id
  );

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-base-100 overflow-hidden">
      {/* Header */}
      <div className="bg-base-200 p-3 md:p-4 flex items-center justify-between border-b border-base-300 flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <button
            onClick={() => navigate("/groups")}
            className="btn btn-ghost btn-sm btn-circle flex-shrink-0"
          >
            <ArrowLeft size={18} className="md:w-5 md:h-5" />
          </button>
          <div className="avatar flex-shrink-0">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg">
              <img 
                src={group.image || "https://via.placeholder.com/150?text=Group"} 
                alt={group.name}
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(group.name)}&background=random`;
                }}
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm md:text-lg truncate">{group.name}</h2>
            <p className="text-xs md:text-sm text-base-content/60">
              {group.members?.length || 0} {group.members?.length === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>

        {userRole?.isMember && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="btn btn-ghost btn-sm gap-1 md:gap-2 flex-shrink-0"
          >
            <Settings size={18} className="md:w-5 md:h-5" />
            {userRole.isAdmin && <Shield size={14} className="md:w-4 md:h-4 text-warning" />}
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {!userRole?.isMember ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center max-w-md">
                <Users size={48} className="md:w-16 md:h-16 mx-auto text-base-content/30 mb-4" />
                <h3 className="text-lg md:text-xl font-bold mb-2">Join this group</h3>
                <p className="text-sm md:text-base text-base-content/60 mb-6">
                  {group.description || "No description available"}
                </p>
                {isPending ? (
                  <div className="alert alert-info text-sm">
                    <span>Your join request is pending approval</span>
                  </div>
                ) : (
                  <button
                    onClick={() => requestJoinMutation.mutate()}
                    className="btn btn-primary btn-sm md:btn-md gap-2"
                    disabled={requestJoinMutation.isPending}
                  >
                    {requestJoinMutation.isPending ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} className="md:w-5 md:h-5" />
                        Request to Join
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ) : client && channel ? (
            <div className="flex-1 min-h-0 overflow-hidden">
              <Chat client={client}>
                <Channel channel={channel}>
                  <Window>
                    <ChannelHeader />
                    <MessageList />
                    <TypingIndicator />
                    <MessageInput />
                  </Window>
                  <Thread />
                </Channel>
              </Chat>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          )}
        </div>

        {/* Settings Sidebar - Mobile Drawer / Desktop Sidebar */}
        {showSettings && userRole?.isMember && (
          <>
            {/* Mobile Overlay */}
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setShowSettings(false)}
            ></div>
            
            {/* Settings Panel */}
            <div className={`
              fixed lg:relative
              top-0 right-0 bottom-0
              w-full sm:w-96 lg:w-80
              bg-base-200 
              border-l border-base-300 
              overflow-y-auto
              z-50
              transform transition-transform duration-300
              ${showSettings ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            `}>
              <div className="p-4">
                {/* Mobile Close Button */}
                <div className="flex items-center justify-between mb-4 lg:hidden">
                  <h3 className="font-bold text-lg">Group Settings</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="btn btn-ghost btn-sm btn-circle"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Desktop Title */}
                <h3 className="font-bold text-lg mb-4 hidden lg:block">Group Settings</h3>

                {/* Group Info */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">About</h4>
                    {userRole.isAdmin && (
                      <button
                        onClick={() => {
                          setShowEditModal(true);
                          setShowSettings(false);
                        }}
                        className="btn btn-ghost btn-xs gap-1"
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                    )}
                  </div>
                  
                  {/* Group Image */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="avatar">
                      <div className="w-16 h-16 rounded-lg">
                        <img 
                          src={group.image || "https://via.placeholder.com/150?text=Group"} 
                          alt={group.name}
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(group.name)}&background=random`;
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold truncate">{group.name}</h5>
                      <p className="text-xs text-base-content/60">
                        {group.members?.length || 0} members
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-base-content/70 mb-2">
                    {group.description || "No description"}
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm text-base-content/60">
                    <Crown size={14} className="text-warning flex-shrink-0" />
                    <span className="truncate">Created by {group.createdBy?.fullName}</span>
                  </div>
                </div>

                {/* Add Members Button (Admin Only) */}
                {userRole.isAdmin && (
                  <div className="mb-6">
                    <button
                      onClick={() => {
                        setShowAddMembersModal(true);
                        setShowSettings(false);
                      }}
                      className="btn btn-primary btn-block gap-2"
                    >
                      <UserPlus size={18} />
                      Add Members
                    </button>
                  </div>
                )}

                {/* Pending Requests (Admin Only) */}
                {userRole.isAdmin && group.pendingRequests?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-2">
                      Pending Requests ({group.pendingRequests.length})
                    </h4>
                    <div className="space-y-2">
                      {group.pendingRequests.map((request) => (
                        <div
                          key={request.userId._id}
                          className="flex items-center justify-between p-2 bg-base-100 rounded-lg gap-2"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="avatar flex-shrink-0">
                              <div className="w-8 h-8 rounded-full">
                                <img
                                  src={request.userId.profilePic}
                                  alt={request.userId.fullName}
                                  onError={(e) => {
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(request.userId.fullName)}&background=random`;
                                  }}
                                />
                              </div>
                            </div>
                            <span className="text-sm font-medium truncate">
                              {request.userId.fullName}
                            </span>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => {
                                if (confirm(`Approve ${request.userId.fullName}'s request?`)) {
                                  approveRequestMutation.mutate(request.userId._id);
                                }
                              }}
                              className="btn btn-success btn-xs"
                              title="Approve"
                              disabled={approveRequestMutation.isPending}
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Reject ${request.userId.fullName}'s request?`)) {
                                  rejectRequestMutation.mutate(request.userId._id);
                                }
                              }}
                              className="btn btn-error btn-xs"
                              title="Reject"
                              disabled={rejectRequestMutation.isPending}
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Members List */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">
                    Members ({group.members?.length || 0})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {group.members?.map((member) => {
                      const isAdmin = group.admins?.some(
                        (admin) => admin._id === member._id
                      );
                      const isCreator = group.createdBy?._id === member._id;

                      return (
                        <div
                          key={member._id}
                          className="flex items-center justify-between p-2 bg-base-100 rounded-lg gap-2"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="avatar flex-shrink-0">
                              <div className="w-8 h-8 rounded-full">
                                <img
                                  src={member.profilePic}
                                  alt={member.fullName}
                                  onError={(e) => {
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=random`;
                                  }}
                                />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-medium truncate">
                                  {member.fullName}
                                </span>
                                {isCreator && (
                                  <Crown
                                    size={14}
                                    className="flex-shrink-0 text-warning"
                                    title="Creator"
                                  />
                                )}
                                {isAdmin && !isCreator && (
                                  <Shield
                                    size={14}
                                    className="flex-shrink-0 text-info"
                                    title="Admin"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                          {userRole.isAdmin &&
                            member._id !== authUser._id &&
                            !isCreator && (
                              <button
                                onClick={() => {
                                  if (confirm(`Remove ${member.fullName} from the group?`)) {
                                    removeMemberMutation.mutate(member._id);
                                  }
                                }}
                                className="btn btn-error btn-xs flex-shrink-0"
                                title="Remove member"
                                disabled={removeMemberMutation.isPending}
                              >
                                <UserMinus size={14} />
                              </button>
                            )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {!userRole.isCreator && (
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to leave this group?")) {
                          leaveGroupMutation.mutate();
                        }
                      }}
                      className="btn btn-warning btn-block gap-2 btn-sm md:btn-md"
                      disabled={leaveGroupMutation.isPending}
                    >
                      <LogOut size={16} className="md:w-[18px] md:h-[18px]" />
                      Leave Group
                    </button>
                  )}

                  {userRole.isCreator && (
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to delete this group? This action cannot be undone."
                          )
                        ) {
                          deleteGroupMutation.mutate();
                        }
                      }}
                      className="btn btn-error btn-block gap-2 btn-sm md:btn-md"
                      disabled={deleteGroupMutation.isPending}
                    >
                      <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                      Delete Group
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Group Modal */}
      {showEditModal && (
        <EditGroupModal
          group={group}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Add Members Modal */}
      {showAddMembersModal && userRole.isAdmin && (
        <AddMembersModal
          group={group}
          onClose={() => setShowAddMembersModal(false)}
        />
      )}
    </div>
  );
};

export default GroupChatPage;