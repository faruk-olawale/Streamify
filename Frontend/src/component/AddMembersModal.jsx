import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAvailableFriendsForGroup, addMemberDirectly } from "../lib/api";
import { X, UserPlus, Loader } from "lucide-react";
import toast from "react-hot-toast";
import Avatar from "./Avatar";

const AddMembersModal = ({ group, groupId: propGroupId, onClose }) => {
  // Support both props: group object or groupId string
  const groupId = propGroupId || group?._id;
  
  const queryClient = useQueryClient();
  const [selectedFriends, setSelectedFriends] = useState(new Set());

  const { data: availableFriends = [], isLoading } = useQuery({
    queryKey: ["availableFriends", groupId],
    queryFn: () => getAvailableFriendsForGroup(groupId),
    enabled: !!groupId,
  });

  const { mutate: addMemberMutation, isPending } = useMutation({
    mutationFn: ({ groupId, userId }) => addMemberDirectly(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupDetails", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["availableFriends", groupId] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to add member");
    },
  });

  const handleToggleFriend = (friendId) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedFriends(newSelected);
  };

  const handleAddSelected = async () => {
    if (selectedFriends.size === 0) {
      toast.error("Please select at least one friend");
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Add each selected friend
    for (const userId of selectedFriends) {
      try {
        await new Promise((resolve, reject) => {
          addMemberMutation(
            { groupId, userId },
            {
              onSuccess: () => {
                successCount++;
                resolve();
              },
              onError: () => {
                errorCount++;
                reject();
              },
            }
          );
        });
      } catch (error) {
        // Error already counted
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully added ${successCount} member(s)!`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to add ${errorCount} member(s)`);
    }

    setSelectedFriends(new Set());
    onClose();
  };

  if (!groupId) {
    return null;
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-xl md:text-2xl">Add Friends to Group</h3>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader className="animate-spin" size={32} />
          </div>
        ) : availableFriends.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-base-content/70">
              All your friends are already members of this group!
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-base-content/70 mb-4">
              Select friends to add to the group. They'll receive a notification.
            </p>

            <div className="max-h-96 overflow-y-auto space-y-2 mb-4">
              {availableFriends.map((friend) => (
                <div
                  key={friend._id}
                  className={`card cursor-pointer transition-all ${
                    selectedFriends.has(friend._id)
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-base-200 hover:bg-base-300"
                  }`}
                  onClick={() => handleToggleFriend(friend._id)}
                >
                  <div className="card-body p-3 flex flex-row items-center gap-3">
                    <Avatar
                      src={friend.profilePic}
                      alt={friend.fullName}
                      size="md"
                      showRing={false}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{friend.fullName}</h4>
                      {friend.bio && (
                        <p className="text-sm text-base-content/70 truncate">
                          {friend.bio}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {friend.nativeLanguages && friend.nativeLanguages.length > 0 && (
                          <span className="badge badge-xs badge-secondary">
                            {Array.isArray(friend.nativeLanguages)
                              ? friend.nativeLanguages[0]
                              : friend.nativeLanguages}
                          </span>
                        )}
                        {friend.learningLanguages && friend.learningLanguages.length > 0 && (
                          <span className="badge badge-xs badge-outline">
                            Learning: {Array.isArray(friend.learningLanguages)
                              ? friend.learningLanguages[0]
                              : friend.learningLanguages}
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedFriends.has(friend._id) && (
                      <div className="badge badge-primary">✓</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="btn btn-ghost flex-1"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleAddSelected}
                className="btn btn-primary flex-1"
                disabled={isPending || selectedFriends.size === 0}
              >
                {isPending ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Add {selectedFriends.size > 0 ? `(${selectedFriends.size})` : "Friends"}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export default AddMembersModal;