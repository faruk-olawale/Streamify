import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createGroup } from "../lib/api";
import toast from "react-hot-toast";
import { X } from "lucide-react";

const CreateGroupModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
  });

  const queryClient = useQueryClient();

  const createGroupMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      toast.success("Group created successfully!");
      queryClient.invalidateQueries(["my-groups"]);
      queryClient.invalidateQueries(["all-groups"]);
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create group");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Group name is required");
      return;
    }
    createGroupMutation.mutate(formData);
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Create New Group</h3>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Group Image URL (optional)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://example.com/image.jpg"
                className="input input-bordered flex-1"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
              />
            </div>
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

          <div className="form-control">
            <label className="label">
              <span className="label-text">Description (optional)</span>
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

          <div className="modal-action">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={createGroupMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createGroupMutation.isPending}
            >
              {createGroupMutation.isPending ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                "Create Group"
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export default CreateGroupModal;