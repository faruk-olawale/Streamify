import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAvailableFriendsForGroup, addMemberDirectly } from "../lib/api";
import toast from "react-hot-toast";
import { X, UserPlus, Search } from "lucide-react";

const AddMembersModal = ({ group, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: friendsData, isLoading } = useQuery({
    queryKey: ["available-friends", group._id],
    queryFn: () => getAvailableFriendsForGroup(group._id),
  });

  const addMemberMutation = useMutation({
    mutationFn: (userId) => addMemberDirectly(group._id, userId),
    onSuccess: () => {
      toast.success("Member added successfully!");
      queryClient.invalidateQueries(["group", group._id]);
      queryClient.invalidateQueries(["available-friends", group._id]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to add member");
    },
  });

  const friends = friendsData?.friends || [];

  const filteredFriends = friends.filter((friend) =>
    friend.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Add Members</h3>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
            disabled={addMemberMutation.isPending}
          >
            <X size={20} />
          </button>
        </div>

       {/* Search */}
        <div className="mb-4">
        <div className="relative">
            {/* Icon inside input */}
            <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50"
            />

            <input
            type="text"
            placeholder="Search friends..."
            className="input input-bordered w-full pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        </div>


        {/* Friends List */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus size={48} className="mx-auto text-base-content/30 mb-4" />
              <p className="text-base-content/60">
                {searchQuery
                  ? "No friends found matching your search"
                  : friends.length === 0
                  ? "All your friends are already in this group!"
                  : "No friends available to add"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFriends.map((friend) => (
                <div
                  key={friend._id}
                  className="flex items-center justify-between p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="avatar">
                      <div className="w-10 h-10 rounded-full">
                        <img
                          src={friend.profilePic}
                          alt={friend.fullName}
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              friend.fullName
                            )}&background=random`;
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{friend.fullName}</p>
                      {friend.bio && (
                        <p className="text-xs text-base-content/60 truncate">
                          {friend.bio}
                        </p>
                      )}
                      <div className="flex gap-1 mt-1">
                        {friend.nativeLanguages && (
                          <span className="badge badge-secondary badge-xs">
                            {friend.nativeLanguages}
                          </span>
                        )}
                        {friend.learningLanguages && (
                          <span className="badge badge-outline badge-xs">
                            {friend.learningLanguages}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => addMemberMutation.mutate(friend._id)}
                    className="btn btn-primary btn-sm gap-1"
                    disabled={addMemberMutation.isPending}
                  >
                    {addMemberMutation.isPending ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        Add
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export default AddMembersModal;