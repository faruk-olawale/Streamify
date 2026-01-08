import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateGroup, uploadGroupImage } from "../lib/api";
import toast from "react-hot-toast";
import { X, Upload, Image as ImageIcon } from "lucide-react";

const EditGroupModal = ({ group, onClose }) => {
  const [formData, setFormData] = useState({
    name: group.name || "",
    description: group.description || "",
    image: group.image || "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const queryClient = useQueryClient();

  // Handle image file selection
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload immediately
    setUploadingImage(true);
    try {
      const response = await uploadGroupImage(file);
      setFormData({ ...formData, image: response.imageUrl });
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
      setImageFile(null);
      setImagePreview("");
    } finally {
      setUploadingImage(false);
    }
  };

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

  const currentImage = imagePreview || formData.image;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
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
          {/* Group Image Upload */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Group Image</span>
            </label>
            
            <div className="flex flex-col items-center gap-3">
              {/* Image Preview */}
              <div className="avatar">
                <div className="w-24 h-24 rounded-lg ring ring-primary ring-offset-base-100 ring-offset-2">
                  {currentImage ? (
                    <img
                      src={currentImage}
                      alt="Preview"
                      className="object-cover"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(group.name)}&background=random&size=128`;
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center bg-base-200 w-full h-full">
                      <ImageIcon size={40} className="text-base-content/30" />
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Button */}
              <label className="btn btn-outline btn-sm gap-2 cursor-pointer">
                <Upload size={16} />
                {uploadingImage ? "Uploading..." : "Change Image"}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={uploadingImage}
                />
              </label>

              {/* Or divider */}
              <div className="divider text-xs">OR</div>

              {/* URL Input */}
              <input
                type="text"
                placeholder="Or paste image URL"
                className="input input-bordered input-sm w-full"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
                disabled={uploadingImage}
              />
            </div>
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
              disabled={updateGroupMutation.isPending || uploadingImage}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={updateGroupMutation.isPending || uploadingImage}
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