import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { getAllGroups, getUserGroups } from "../lib/api";
import { Plus, Users, Globe, ArrowLeft } from "lucide-react";
import CreateGroupModal from "../component/CreateGroupModal";
import GroupCard from "../component/GroupCard";

const GroupsPage = () => {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState("my-groups");

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

  return (
    <div className="h-full p-4 md:p-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="btn btn-ghost btn-sm btn-circle"
          title="Back to Home"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Title and Create Button */}
        <div className="flex justify-between items-center flex-1">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Groups</h1>
            <p className="text-sm md:text-base text-base-content/60 mt-1">
              Create and join group conversations
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary btn-sm md:btn-md gap-2"
          >
            <Plus size={18} className="md:w-5 md:h-5" />
            <span className="hidden sm:inline">Create Group</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-6 bg-base-200">
        <button
          className={`tab gap-2 ${activeTab === "my-groups" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("my-groups")}
        >
          <Users size={16} className="md:w-[18px] md:h-[18px]" />
          <span className="text-sm md:text-base">My Groups ({myGroups.length})</span>
        </button>
        <button
          className={`tab gap-2 ${activeTab === "all-groups" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("all-groups")}
        >
          <Globe size={16} className="md:w-[18px] md:h-[18px]" />
          <span className="text-sm md:text-base">Discover Groups</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === "my-groups" && (
        <div>
          {loadingMyGroups ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : myGroups.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="md:w-16 md:h-16 mx-auto text-base-content/30 mb-4" />
              <h3 className="text-lg md:text-xl font-semibold mb-2">No groups yet</h3>
              <p className="text-sm md:text-base text-base-content/60 mb-4">
                Create your first group or join existing ones
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary btn-sm md:btn-md"
              >
                Create Group
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myGroups.map((group) => (
                <GroupCard key={group._id} group={group} isMember={true} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "all-groups" && (
        <div>
          {loadingAllGroups ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : allGroups.length === 0 ? (
            <div className="text-center py-12">
              <Globe size={48} className="md:w-16 md:h-16 mx-auto text-base-content/30 mb-4" />
              <h3 className="text-lg md:text-xl font-semibold mb-2">No public groups</h3>
              <p className="text-sm md:text-base text-base-content/60">
                Be the first to create a public group!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allGroups.map((group) => {
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

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
};

export default GroupsPage;