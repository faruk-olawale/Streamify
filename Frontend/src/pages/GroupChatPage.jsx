import { useEffect, useState } from "react";
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
  Mic,
  Pin,
  Search,
  Image as ImageIcon,
  FileText,
  TrendingUp,
  Zap,
  Sparkles,
  MoreVertical,
  Hash,
} from "lucide-react";
import EditGroupModal from "../component/EditGroupModal";
import AddMembersModal from "../component/AddMembersModal";
import MemberProfileModal from "../component/MemberProfileModal";
import VoiceMessageRecorder from "../component/VoiceMessageRecorder";
import PinnedMessagesPanel from "../component/PinnedMessagesPanel";
import MessageSearchPanel from "../component/MessageSearchPanel";
import ActivityTimelinePanel from "../component/ActivityTimelinePanel";
import QuickActionsMenu from "../component/QuickActionsMenu";

const GroupChatPage = ({ authUser }) => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("about");
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
      if (activeChannel) {
        activeChannel.stopWatching().catch(console.error);
      }
      setChannel(null);
    };
  }, [client, group, userRole]);

  // Mutations
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
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-base-100 via-base-200 to-base-100">
        <div className="text-center">
          <div className="relative">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <div className="absolute inset-0 loading loading-spinner loading-lg text-secondary opacity-30 scale-125"></div>
          </div>
          <p className="mt-4 text-sm text-base-content/60 font-medium">Loading group...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-base-100 via-base-200 to-base-100">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-error/10 flex items-center justify-center">
            <Users size={40} className="text-error/50" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-base-content to-base-content/60 bg-clip-text text-transparent">
            Group not found
          </h2>
          <p className="text-base-content/60 mb-6">This group doesn't exist or has been deleted.</p>
          <button 
            onClick={() => navigate("/groups")} 
            className="btn btn-primary gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <ArrowLeft size={18} />
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  const isPending = group.pendingRequests?.some(
    (req) => req.userId._id === authUser._id
  );

  const renderSettingsContent = () => {
    switch (activeSettingsTab) {
      case "about":
        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Enhanced Group Info Card */}
            <div className="card bg-gradient-to-br from-base-100 to-base-200/50 shadow-md border border-base-300/50">
              <div className="card-body p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-lg flex items-center gap-2">
                    <Hash size={20} className="text-primary" />
                    About Group
                  </h4>
                  {userRole.isAdmin && (
                    <button
                      onClick={() => {
                        setShowEditModal(true);
                        setShowSettings(false);
                      }}
                      className="btn btn-ghost btn-sm gap-2 hover:bg-primary/10 hover:text-primary transition-all"
                    >
                      <Edit size={16} />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                  )}
                </div>
                
                {/* Group Image & Info */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="avatar">
                    <div className="w-20 h-20 rounded-2xl ring-2 ring-primary/20 ring-offset-2 ring-offset-base-100">
                      <img 
                        src={group.image || "https://via.placeholder.com/150?text=Group"} 
                        alt={group.name}
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(group.name)}&background=random&bold=true`;
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xl mb-1 truncate">{group.name}</h5>
                    <div className="flex items-center gap-3 text-sm text-base-content/60 mb-2">
                      <div className="flex items-center gap-1">
                        <Users size={14} />
                        <span className="font-medium">{group.members?.length || 0} members</span>
                      </div>
                      {group.createdAt && (
                        <div className="flex items-center gap-1">
                          <span>•</span>
                          <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {group.description && (
                  <div className="p-3 bg-base-200/50 rounded-lg border border-base-300/30">
                    <p className="text-sm text-base-content/80 leading-relaxed">
                      {group.description}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mt-3 p-3 bg-warning/5 rounded-lg border border-warning/10">
                  <Crown size={16} className="text-warning flex-shrink-0" />
                  <span className="text-sm text-base-content/70">
                    Created by <span className="font-semibold text-base-content">{group.createdBy?.fullName}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Add Members Button (Admin Only) */}
            {userRole.isAdmin && (
              <button
                onClick={() => {
                  setShowAddMembersModal(true);
                  setShowSettings(false);
                }}
                className="btn btn-primary btn-block gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <UserPlus size={20} />
                Add Members
                <Sparkles size={16} className="opacity-60" />
              </button>
            )}

            {/* Pending Requests (Admin Only) */}
            {userRole.isAdmin && group.pendingRequests?.length > 0 && (
              <div className="card bg-info/5 border border-info/20 shadow-sm">
                <div className="card-body p-5">
                  <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <div className="badge badge-info gap-1">
                      {group.pendingRequests.length}
                    </div>
                    Pending Requests
                  </h4>
                  <div className="space-y-2">
                    {group.pendingRequests.map((request) => (
                      <div
                        key={request.userId._id}
                        className="flex items-center justify-between p-3 bg-base-100 rounded-xl border border-base-300/50 gap-3 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="avatar">
                            <div className="w-10 h-10 rounded-full ring-2 ring-primary/20">
                              <img
                                src={request.userId.profilePic}
                                alt={request.userId.fullName}
                                onError={(e) => {
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(request.userId.fullName)}&background=random`;
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{request.userId.fullName}</p>
                            <p className="text-xs text-base-content/50">Wants to join</p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              if (confirm(`Approve ${request.userId.fullName}'s request?`)) {
                                approveRequestMutation.mutate(request.userId._id);
                              }
                            }}
                            className="btn btn-success btn-sm gap-1 shadow-sm hover:shadow-md transition-all"
                            disabled={approveRequestMutation.isPending}
                          >
                            <CheckCircle size={16} />
                            <span className="hidden sm:inline">Approve</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Reject ${request.userId.fullName}'s request?`)) {
                                rejectRequestMutation.mutate(request.userId._id);
                              }
                            }}
                            className="btn btn-error btn-sm gap-1 shadow-sm hover:shadow-md transition-all"
                            disabled={rejectRequestMutation.isPending}
                          >
                            <XCircle size={16} />
                            <span className="hidden sm:inline">Reject</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="card bg-base-100 border border-base-300/50 shadow-sm">
              <div className="card-body p-5">
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Users size={20} className="text-primary" />
                  Members
                  <div className="badge badge-primary badge-sm">{group.members?.length || 0}</div>
                </h4>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {group.members?.map((member) => {
                    const isAdmin = group.admins?.some(
                      (admin) => admin._id === member._id
                    );
                    const isCreator = group.createdBy?._id === member._id;

                    return (
                      <div
                        key={member._id}
                        className="flex items-center justify-between p-3 bg-base-200/30 rounded-xl gap-3 hover:bg-base-200/60 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => setSelectedMember(member)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="avatar">
                            <div className="w-11 h-11 rounded-full ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
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
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold truncate">
                                {member.fullName}
                              </span>
                              {isCreator && (
                                <div className="badge badge-warning badge-sm gap-1">
                                  <Crown size={10} />
                                  Creator
                                </div>
                              )}
                              {isAdmin && !isCreator && (
                                <div className="badge badge-info badge-sm gap-1">
                                  <Shield size={10} />
                                  Admin
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                              <span className="text-xs text-base-content/50">Online</span>
                            </div>
                          </div>
                        </div>
                        {userRole.isAdmin &&
                          member._id !== authUser._id &&
                          !isCreator && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Remove ${member.fullName} from the group?`)) {
                                  removeMemberMutation.mutate(member._id);
                                }
                              }}
                              className="btn btn-error btn-xs gap-1 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                              disabled={removeMemberMutation.isPending}
                            >
                              <UserMinus size={12} />
                              Remove
                            </button>
                          )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case "media":
        return (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon size={20} className="text-primary" />
              <h4 className="font-bold text-lg">Media Gallery</h4>
            </div>
            <p className="text-sm text-base-content/60 mb-4">All images and videos shared in this group</p>
            
            {/* Enhanced Media Grid */}
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div 
                  key={i} 
                  className="aspect-square bg-gradient-to-br from-base-300 to-base-200 rounded-xl animate-pulse shadow-inner border border-base-300/50"
                ></div>
              ))}
            </div>
            
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ImageIcon size={32} className="text-primary/50" />
              </div>
              <p className="text-sm text-base-content/50 font-medium">No media shared yet</p>
              <p className="text-xs text-base-content/40 mt-1">Share photos and videos in the chat</p>
            </div>
          </div>
        );

      case "files":
        return (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={20} className="text-primary" />
              <h4 className="font-bold text-lg">Shared Files</h4>
            </div>
            <p className="text-sm text-base-content/60 mb-4">All documents shared in this group</p>
            
            {/* Enhanced Files List */}
            <div className="space-y-2">
              {[
                { name: "Spanish_Grammar_Guide.pdf", size: "2.4 MB", date: "2 days ago", color: "error" },
                { name: "Vocabulary_List.docx", size: "150 KB", date: "1 week ago", color: "info" },
              ].map((file, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-4 p-4 bg-base-200/50 rounded-xl border border-base-300/50 hover:bg-base-200 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className={`p-3 bg-${file.color}/10 rounded-lg border border-${file.color}/20 group-hover:scale-110 transition-transform`}>
                    <FileText size={24} className={`text-${file.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate mb-0.5">{file.name}</p>
                    <p className="text-xs text-base-content/50">{file.size} • {file.date}</p>
                  </div>
                  <button className="btn btn-ghost btn-sm btn-circle opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case "activity":
        return <ActivityTimelinePanel group={group} groupId={groupId} />;

      default:
        return null;
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-gradient-to-br from-base-100 via-base-200/30 to-base-100 overflow-hidden">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-base-200/80 to-base-300/50 backdrop-blur-xl p-4 flex items-center justify-between border-b-2 border-primary/10 shadow-lg flex-shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => navigate("/groups")}
            className="btn btn-ghost btn-sm btn-circle hover:bg-primary/10 hover:text-primary transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="avatar">
            <div className="w-12 h-12 rounded-2xl ring-2 ring-primary/20 ring-offset-2 ring-offset-base-200">
              <img 
                src={group.image || "https://via.placeholder.com/150?text=Group"} 
                alt={group.name}
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(group.name)}&background=random&bold=true`;
                }}
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg truncate flex items-center gap-2">
              {group.name}
              {userRole?.isAdmin && (
                <Shield size={16} className="text-warning" />
              )}
            </h2>
            <div className="flex items-center gap-2 text-xs text-base-content/60">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                <span>{group.members?.length || 0} members</span>
              </div>
            </div>
          </div>
        </div>

        {userRole?.isMember && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`btn btn-sm btn-circle ${showSearch ? 'btn-primary' : 'btn-ghost'} hover:scale-110 transition-all shadow-sm`}
              title="Search messages"
            >
              <Search size={18} />
            </button>

            <button
              onClick={() => setShowPinnedMessages(!showPinnedMessages)}
              className={`btn btn-sm btn-circle ${showPinnedMessages ? 'btn-warning' : 'btn-ghost'} hover:scale-110 transition-all shadow-sm`}
              title="Pinned messages"
            >
              <Pin size={18} />
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`btn btn-sm gap-2 ${showSettings ? 'btn-primary' : 'btn-ghost'} hover:scale-105 transition-all shadow-sm`}
            >
              <Settings size={18} />
              <span className="hidden md:inline text-xs font-medium">Settings</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {!userRole?.isMember ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-lg">
                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shadow-xl">
                  <Users size={48} className="text-primary" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Join this group
                </h3>
                <p className="text-base-content/60 mb-8 leading-relaxed">
                  {group.description || "Connect with other language learners and start practicing together!"}
                </p>
                {isPending ? (
                  <div className="alert alert-info shadow-lg">
                    <div>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span className="font-medium">Your join request is pending approval</span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => requestJoinMutation.mutate()}
                    className="btn btn-primary btn-lg gap-3 shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                    disabled={requestJoinMutation.isPending}
                  >
                    {requestJoinMutation.isPending ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Sending Request...
                      </>
                    ) : (
                      <>
                        <UserPlus size={24} />
                        Request to Join
                        <Sparkles size={20} className="opacity-60" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ) : client && channel ? (
            <>
              {showPinnedMessages && (
                <PinnedMessagesPanel
                  channel={channel}
                  groupId={groupId}
                  userRole={userRole}
                  onClose={() => setShowPinnedMessages(false)}
                />
              )}

              {showSearch && (
                <MessageSearchPanel
                  channel={channel}
                  onClose={() => setShowSearch(false)}
                />
              )}

              <div className="flex-1 min-h-0 overflow-hidden relative">
                <Chat client={client}>
                  <Channel channel={channel}>
                    <Window>
                      <ChannelHeader />
                      <MessageList />
                      <TypingIndicator />
                      
                      <div style={{ position: 'relative' }}>
                    <MessageInput />
                    
                    <button
                      onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                      className={`btn btn-circle ${showVoiceRecorder ? 'btn-error' : 'btn-ghost hover:btn-primary'}`}
                      title="Send voice message"
                      type="button"
                      style={{
                        position: 'absolute',
                        right: '60px',      // ← Positions it left of Send button
                        bottom: '8px',
                        zIndex: 10,
                        width: '40px',      // ← Same size as Send button
                        height: '40px'
                      }}
                    >
                      <Mic size={20} />
                    </button>

                    {showVoiceRecorder && (
                      <VoiceMessageRecorder
                        channel={channel}
                        onClose={() => setShowVoiceRecorder(false)}
                      />
                    )}
                      </div>

                      {showVoiceRecorder && (
                        <VoiceMessageRecorder
                          channel={channel}
                          onClose={() => setShowVoiceRecorder(false)}
                        />
                      )}
                    </Window>
                    <Thread />
                  </Channel>
                </Chat>

                {/* Enhanced Floating Quick Actions Button */}
                <div className="absolute bottom-24 right-6 z-10">
                  <button
                    onClick={() => setShowQuickActions(!showQuickActions)}
                    className="btn btn-circle btn-lg bg-gradient-to-br from-primary via-secondary to-primary shadow-2xl hover:shadow-3xl hover:scale-110 transition-all border-2 border-white/20 group"
                  >
                    <Zap size={28} className="group-hover:rotate-12 transition-transform" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="mt-4 text-sm text-base-content/60">Connecting to chat...</p>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Settings Sidebar */}
        {showSettings && userRole?.isMember && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setShowSettings(false)}
            ></div>
            
            <div className={`
              fixed lg:relative
              top-0 right-0 bottom-0
              w-full sm:w-[420px] lg:w-96
              bg-gradient-to-b from-base-200 to-base-100
              border-l-2 border-primary/10
              overflow-y-auto
              z-50
              shadow-2xl
              transform transition-all duration-300 ease-out
              ${showSettings ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            `}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6 lg:hidden">
                  <h3 className="font-bold text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Group Settings
                  </h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="btn btn-ghost btn-sm btn-circle hover:bg-error/10 hover:text-error"
                  >
                    <X size={20} />
                  </button>
                </div>

                <h3 className="font-bold text-2xl mb-6 hidden lg:block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Group Settings
                </h3>

                {/* Enhanced Tabs */}
                <div className="tabs tabs-boxed mb-6 p-1 bg-base-300/50 backdrop-blur-sm">
                  {[
                    { id: "about", icon: Users, label: "About" },
                    { id: "media", icon: ImageIcon, label: "Media" },
                    { id: "files", icon: FileText, label: "Files" },
                    { id: "activity", icon: TrendingUp, label: "Activity" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      className={`tab gap-2 flex-1 ${
                        activeSettingsTab === tab.id ? "tab-active" : ""
                      } transition-all`}
                      onClick={() => setActiveSettingsTab(tab.id)}
                    >
                      <tab.icon size={14} />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {renderSettingsContent()}

                {/* Enhanced Action Buttons */}
                <div className="space-y-3 border-t-2 border-base-300/50 pt-6 mt-8">
                  {!userRole.isCreator && (
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to leave this group?")) {
                          leaveGroupMutation.mutate();
                        }
                      }}
                      className="btn btn-warning btn-block gap-2 shadow-md hover:shadow-lg transition-all"
                      disabled={leaveGroupMutation.isPending}
                    >
                      <LogOut size={18} />
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
                      className="btn btn-error btn-block gap-2 shadow-md hover:shadow-lg transition-all"
                      disabled={deleteGroupMutation.isPending}
                    >
                      <Trash2 size={18} />
                      Delete Group
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showEditModal && (
        <EditGroupModal
          group={group}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showAddMembersModal && userRole.isAdmin && (
        <AddMembersModal
          group={group}
          onClose={() => setShowAddMembersModal(false)}
        />
      )}

      {selectedMember && (
        <MemberProfileModal
          member={selectedMember}
          group={group}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {showQuickActions && (
        <QuickActionsMenu
          group={group}
          onClose={() => setShowQuickActions(false)}
        />
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--p) / 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--p) / 0.5);
        }
      `}</style>
            <style jsx global>{`
        .str-chat__input-flat {
          padding-right: 110px !important;
        }
        
        /* Your existing styles... */
        @keyframes fadeIn { ... }
      `}</style>
    </div>
  );
};

export default GroupChatPage;