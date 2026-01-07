import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateGroup } from "../lib/api";
import toast from "react-hot-toast";
import { X } from "lucide-react";

const EditGroupModal = ({ group, onClose }) => {
  const [formData, setFormData] = useState({
    name: group.name || "",
    description: group.description || "",
    image: group.image || "",
  });

  const queryClient = useQueryClient();

  const updateGroupMutation = useMutation({
    mutationFn: (data) => updateGroup(group._id, data),
    onSuccess: () => {
      toast.success("Group updated successfully!");
      queryClient.invalidateQueries(["group", group._id]);
      queryClient.invalidateQueries(["my-groups"]);
      queryClient.invalidateQueries(["all-groups"]);
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update group");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Group name is required");
      return;
    }
    updateGroupMutation.mutate(formData);
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Edit Group</h3>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Image */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Group Image URL</span>
            </label>
            <input
              type="text"
              placeholder="https://example.com/image.jpg"
              className="input input-bordered"
              value={formData.image}
              onChange={(e) =>
                setFormData({ ...formData, image: e.target.value })
              }
            />
            {formData.image && (
              <div className="mt-2">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-20 h-20 rounded-lg object-cover"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/150?text=Invalid";
                  }}
                />
              </div>
            )}
          </div>

          {/* Group Name */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Group Name *</span>
            </label>
            <input
              type="text"
              placeholder="Enter group name"
              className="input input-bordered"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          {/* Description */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              placeholder="What's this group about?"
              className="textarea textarea-bordered h-24"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Actions */}
          <div className="modal-action">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={updateGroupMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={updateGroupMutation.isPending}
            >
              {updateGroupMutation.isPending ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export default EditGroupModal;