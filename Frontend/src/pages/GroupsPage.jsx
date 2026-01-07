import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllGroups, getUserGroups } from "../lib/api";
import { Plus, Users, Globe } from "lucide-react";
import CreateGroupModal from "../component/CreateGroupModal";
import GroupCard from "../component/GroupCard";

const GroupsPage = () => {
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
    <div className="h-full p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Groups</h1>
          <p className="text-base-content/60 mt-1">
            Create and join group conversations
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary gap-2"
        >
          <Plus size={20} />
          Create Group
        </button>
      </div>

      <div className="tabs tabs-boxed mb-6 bg-base-200">
        <button
          className={`tab gap-2 ${activeTab === "my-groups" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("my-groups")}
        >
          <Users size={18} />
          My Groups ({myGroups.length})
        </button>
        <button
          className={`tab gap-2 ${activeTab === "all-groups" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("all-groups")}
        >
          <Globe size={18} />
          Discover Groups
        </button>
      </div>

      {activeTab === "my-groups" && (
        <div>
          {loadingMyGroups ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : myGroups.length === 0 ? (
            <div className="text-center py-12">
              <Users size={64} className="mx-auto text-base-content/30 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No groups yet</h3>
              <p className="text-base-content/60 mb-4">
                Create your first group or join existing ones
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                Create Group
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <Globe size={64} className="mx-auto text-base-content/30 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No public groups</h3>
              <p className="text-base-content/60">
                Be the first to create a public group!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {showCreateModal && (
        <CreateGroupModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
};

export default GroupsPage;