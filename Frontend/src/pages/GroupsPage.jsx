import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router";
import { getAllGroups, getUserGroups } from "../lib/api";
import { Plus, Users, Globe, ShipWheelIcon, Search } from "lucide-react";
import CreateGroupModal from "../component/CreateGroupModal";
import GroupCard from "../component/GroupCard";

const GroupsPage = () => {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState("my-groups");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: myGroupsData, isLoading: loadingMyGroups } = useQuery({
    queryKey: ["my-groups"],
    queryFn: getUserGroups,
  });

  const { data: allGroupsData, isLoading: loadingAllGroups } = useQuery({
    queryKey: ["all-groups"],
    queryFn: getAllGroups,
    enabled: activeTab === "all-groups",
  });

  const myGroups = myGroupsData?.groups || [];
  const allGroups = allGroupsData?.groups || [];

  // Filter groups based on search query
  const filteredMyGroups = myGroups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAllGroups = allGroups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-base-100 via-base-200/30 to-base-100">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-base-200/80 to-base-300/50 backdrop-blur-xl border-b-2 border-primary/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 hover:opacity-80 transition-all hover:scale-105"
            >
              <div className="p-2 bg-primary/10 rounded-xl">
                <ShipWheelIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <span className="text-lg sm:text-xl md:text-2xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider hidden sm:inline">
                Streamify
              </span>
            </Link>

            {/* Create Group Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary btn-sm sm:btn-md gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Create Group</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 sm:py-6">
          {/* Page Title & Search */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-base-content to-base-content/70 bg-clip-text text-transparent">
                  Groups
                </h1>
                <p className="text-xs sm:text-sm text-base-content/60 mt-1">
                  Create and join group conversations
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
                />
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input input-bordered input-sm sm:input-md w-full pl-9 bg-base-100/80 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Tab */}
            <div className="tabs tabs-boxed bg-base-200/80 backdrop-blur-sm p-1 shadow-sm">
              <button
                className={`tab gap-1.5 sm:gap-2 flex-1 transition-all ${
                  activeTab === "my-groups" ? "tab-active" : ""
                }`}
                onClick={() => setActiveTab("my-groups")}
              >
                <Users size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="text-xs sm:text-sm md:text-base">
                  <span className="hidden sm:inline">My Groups </span>
                  <span className="sm:hidden">Mine </span>
                  <span className="badge badge-sm ml-1">{myGroups.length}</span>
                </span>
              </button>
              <button
                className={`tab gap-1.5 sm:gap-2 flex-1 transition-all ${
                  activeTab === "all-groups" ? "tab-active" : ""
                }`}
                onClick={() => setActiveTab("all-groups")}
              >
                <Globe size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="text-xs sm:text-sm md:text-base">
                  <span className="hidden sm:inline">Discover</span>
                  <span className="sm:hidden">All</span>
                </span>
              </button>
            </div>
          </div>

          {/* Content */}
          {activeTab === "my-groups" && (
            <div className="pb-4 sm:pb-6">
              {loadingMyGroups ? (
                <div className="flex justify-center py-12 sm:py-16">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <span className="loading loading-spinner loading-lg text-primary"></span>
                      <div className="absolute inset-0 loading loading-spinner loading-lg text-secondary opacity-30 scale-125"></div>
                    </div>
                    <p className="mt-4 text-sm text-base-content/60">Loading your groups...</p>
                  </div>
                </div>
              ) : filteredMyGroups.length === 0 ? (
                <div className="text-center py-12 sm:py-16 animate-fadeIn">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Users size={32} className="sm:w-10 sm:h-10 text-primary/50" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2">
                    {searchQuery ? "No groups found" : "No groups yet"}
                  </h3>
                  <p className="text-xs sm:text-sm text-base-content/60 mb-4 max-w-sm mx-auto">
                    {searchQuery
                      ? `No groups match "${searchQuery}"`
                      : "Create your first group or join existing ones"}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="btn btn-primary btn-sm sm:btn-md gap-2 shadow-lg hover:shadow-xl transition-all"
                    >
                      <Plus size={18} />
                      Create Group
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {filteredMyGroups.map((group) => (
                    <GroupCard key={group._id} group={group} isMember={true} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "all-groups" && (
            <div className="pb-4 sm:pb-6">
              {loadingAllGroups ? (
                <div className="flex justify-center py-12 sm:py-16">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <span className="loading loading-spinner loading-lg text-primary"></span>
                      <div className="absolute inset-0 loading loading-spinner loading-lg text-secondary opacity-30 scale-125"></div>
                    </div>
                    <p className="mt-4 text-sm text-base-content/60">
                      Discovering groups...
                    </p>
                  </div>
                </div>
              ) : filteredAllGroups.length === 0 ? (
                <div className="text-center py-12 sm:py-16 animate-fadeIn">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-secondary/10 flex items-center justify-center">
                    <Globe size={32} className="sm:w-10 sm:h-10 text-secondary/50" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2">
                    {searchQuery ? "No groups found" : "No public groups"}
                  </h3>
                  <p className="text-xs sm:text-sm text-base-content/60 max-w-sm mx-auto">
                    {searchQuery
                      ? `No public groups match "${searchQuery}"`
                      : "Be the first to create a public group!"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {filteredAllGroups.map((group) => {
                    const isMember = myGroups.some((g) => g._id === group._id);
                    return (
                      <GroupCard
                        key={group._id}
                        group={group}
                        isMember={isMember}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Animations */}
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
      `}</style>
    </div>
  );
};

export default GroupsPage;