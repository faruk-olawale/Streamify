import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useAuthUser from "../hooks/useAuthUser";
import { logout } from "../lib/api";
import { LogOut, Edit, Camera, Loader, MapPin, Globe } from "lucide-react";
import ThemeSelector from "../component/ThemeSelector";
import { LANGUAGES } from "../constants";
import toast from "react-hot-toast";
import { updateProfile } from "../lib/api"; // You'll need to create this

const ProfilePage = () => {
  const { authUser } = useAuthUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { mutate: logoutMutation } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      navigate("/login");
    },
  });

  return (
    <div className="bg-base-100 pt-0 flex flex-col pb-28">
      {/* Header */}
      <div className="bg-base-200 p-6 text-center flex-shrink-0 relative">
        {/* Edit Button */}
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="btn btn-circle btn-sm absolute top-4 right-4"
          aria-label="Edit profile"
        >
          <Edit size={16} />
        </button>

        <div className="avatar mb-4">
          <div className="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
            <img src={authUser?.profilePic} alt={authUser?.fullName} />
          </div>
        </div>
        <h2 className="text-2xl font-bold">{authUser?.fullName}</h2>
        <p className="text-base-content/60">{authUser?.email}</p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Profile Info */}
        <div className="space-y-2">
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title text-lg">Bio</h3>
              <p className="text-base-content/70">
                {authUser?.bio || "No bio yet"}
              </p>
            </div>
          </div>

          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title text-lg">Location</h3>
              <p className="text-base-content/70 flex items-center gap-2">
                <MapPin size={16} />
                {authUser?.location || "Not specified"}
              </p>
            </div>
          </div>

          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title text-lg">Languages</h3>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <span className="font-semibold">Native:</span>
                  {authUser?.nativeLanguages && authUser.nativeLanguages.length > 0 ? (
                    authUser.nativeLanguages.map((lang) => (
                      <span key={lang} className="badge badge-secondary">
                        {lang}
                      </span>
                    ))
                  ) : (
                    <span className="text-base-content/70">Not specified</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="font-semibold">Learning:</span>
                  {authUser?.learningLanguages && authUser.learningLanguages.length > 0 ? (
                    authUser.learningLanguages.map((lang) => (
                      <span key={lang} className="badge badge-outline">
                        {lang}
                      </span>
                    ))
                  ) : (
                    <span className="text-base-content/70">Not specified</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg mb-2">Settings</h3>

          {/* Theme */}
          <div className="card bg-base-200">
            <div className="card-body flex items-center justify-between">
              <span className="font-medium">Theme</span>
              <div className="dropdown dropdown-top">
                <ThemeSelector />
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => {
              if (confirm("Are you sure you want to logout?")) {
                logoutMutation();
              }
            }}
            className="btn btn-error btn-block gap-2"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <EditProfileModal
          authUser={authUser}
          onClose={() => setIsEditModalOpen(false)}
          queryClient={queryClient}
        />
      )}
    </div>
  );
};

// Edit Profile Modal Component
function EditProfileModal({ authUser, onClose, queryClient }) {
  const [formData, setFormData] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    location: authUser?.location || "",
    profilePic: authUser?.profilePic || "",
    nativeLanguages: authUser?.nativeLanguages?.[0] || "",
    learningLanguages: authUser?.learningLanguages?.[0] || "",
  });

  const { mutate: updateProfileMutation, isPending } = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Convert languages to arrays
    const updatedData = {
      ...formData,
      nativeLanguages: formData.nativeLanguages ? [formData.nativeLanguages] : [],
      learningLanguages: formData.learningLanguages ? [formData.learningLanguages] : [],
    };

    updateProfileMutation(updatedData);
  };

  const handleGenerateAvatar = () => {
    const idx = Math.floor(Math.random() * 100) + 1;
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;
    setFormData({ ...formData, profilePic: randomAvatar });
    toast.success("Random avatar generated!");
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-2xl mb-4">Edit Profile</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Picture */}
          <div className="flex flex-col items-center space-y-3">
            <div className="avatar">
              <div className="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                {formData.profilePic ? (
                  <img src={formData.profilePic} alt="Profile" />
                ) : (
                  <div className="flex items-center justify-center h-full bg-base-300">
                    <Camera size={32} className="opacity-40" />
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerateAvatar}
              className="btn btn-sm btn-outline gap-2"
            >
              <Camera size={16} />
              Generate Random Avatar
            </button>
          </div>

          {/* Full Name */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Full Name</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="input input-bordered"
              placeholder="Your full name"
              required
            />
          </div>

          {/* Bio */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Bio</span>
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="textarea textarea-bordered h-24"
              placeholder="Tell others about yourself and your language learning goals"
            />
          </div>

          {/* Location */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Location</span>
            </label>
            <div className="relative">
              <MapPin className="absolute top-1/2 transform -translate-y-1/2 left-3 size-5 text-base-content opacity-70" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="input input-bordered w-full pl-10"
                placeholder="City, Country"
              />
            </div>
          </div>

          {/* Languages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Native Language */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Native Language</span>
              </label>
              <select
                value={formData.nativeLanguages}
                onChange={(e) => setFormData({ ...formData, nativeLanguages: e.target.value })}
                className="select select-bordered"
              >
                <option value="">Select native language</option>
                {LANGUAGES.map((lang) => (
                  <option key={`native-${lang}`} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Learning Language */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Learning Language</span>
              </label>
              <select
                value={formData.learningLanguages}
                onChange={(e) => setFormData({ ...formData, learningLanguages: e.target.value })}
                className="select select-bordered"
              >
                <option value="">Select learning language</option>
                {LANGUAGES.map((lang) => (
                  <option key={`learning-${lang}`} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="modal-action">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader className="animate-spin" size={16} />
                  Saving...
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
}

export default ProfilePage;