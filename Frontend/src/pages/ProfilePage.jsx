import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useAuthUser from "../hooks/useAuthUser";
import { logout, updateProfile } from "../lib/api";
import { LogOut, Camera, MapPin, Target, Clock, Check, Loader, ChevronRight } from "lucide-react";
import ThemeSelector from "../component/ThemeSelector";
import { LANGUAGES } from "../constants";
import toast from "react-hot-toast";
import { generateRandomAvatar } from "../utils/avatar-helper";
import Avatar from "../component/Avatar";
import { calculateProfileCompleteness } from "../utils/profileHelper";

const LEARNING_GOALS = [
  'Conversation', 'Pronunciation', 'Grammar', 
  'Writing', 'Reading', 'Business', 'Travel'
];

const AVAILABILITY_OPTIONS = [
  'Mornings', 'Afternoons', 'Evenings', 
  'Weekends', 'Weekdays', 'Flexible'
];

const ProfilePage = () => {
  const { authUser } = useAuthUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingField, setEditingField] = useState(null);
  const [savingField, setSavingField] = useState(null);
  // Initialize with empty strings to avoid controlled/uncontrolled warning
  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    location: "",
    profilePic: "",
    nativeLanguages: "",
    learningLanguages: "",
    learningGoals: [],
    availability: [],
  });

  // Initialize form data when authUser changes
  useEffect(() => {
    if (authUser) {
      setFormData({
        fullName: authUser.fullName || "",
        bio: authUser.bio || "",
        location: authUser.location || "",
        profilePic: authUser.profilePic || "",
        nativeLanguages: authUser.nativeLanguages?.[0] || "",
        learningLanguages: authUser.learningLanguages?.[0] || "",
        learningGoals: authUser.learningGoals || [],
        availability: authUser.availability || [],
      });
    } else {
      // Ensure defaults if no authUser
      setFormData({
        fullName: "",
        bio: "",
        location: "",
        profilePic: "",
        nativeLanguages: "",
        learningLanguages: "",
        learningGoals: [],
        availability: [],
      });
    }
  }, [authUser]);

  const { mutate: updateProfileMutation } = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      console.log("✅ Profile update response:", data);
      setSavingField(null);
      setEditingField(null);
      
      // CRITICAL: Update the local cache immediately
      queryClient.setQueryData(["authUser"], (old) => {
        console.log("📦 Updating cache from:", old?.user);
        console.log("📦 Updating cache to:", data.user);
        return {
          ...old,
          user: data.user,
          success: true
        };
      });
      
      // Force re-fetch to ensure sync
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      
      toast.success("Saved!", { duration: 1000 });
    },
    onError: (error) => {
      console.error("❌ Profile update error:", error);
      setSavingField(null);
      toast.error(error.response?.data?.message || "Failed to save");
    },
  });

  const { mutate: logoutMutation } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      navigate("/login");
    },
  });

  const handleSaveField = (field) => {
    setSavingField(field);
    
    const updatedData = {
      ...formData,
      nativeLanguages: formData.nativeLanguages ? [formData.nativeLanguages] : [],
      learningLanguages: formData.learningLanguages ? [formData.learningLanguages] : [],
    };

    updateProfileMutation(updatedData);
  };

  const handleGenerateAvatar = () => {
    const randomAvatar = generateRandomAvatar(formData.fullName || 'User', 'ui-avatars');
    setFormData({ ...formData, profilePic: randomAvatar });
    setSavingField('profilePic');
    updateProfileMutation({
      ...formData,
      profilePic: randomAvatar,
      nativeLanguages: formData.nativeLanguages ? [formData.nativeLanguages] : [],
      learningLanguages: formData.learningLanguages ? [formData.learningLanguages] : [],
    });
  };

  const toggleArrayItem = (field, value) => {
    const currentArray = formData[field] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    // Update local state immediately
    setFormData({ ...formData, [field]: newArray });
    setSavingField(field);
    
    console.log(`🔄 Updating ${field}:`, newArray);
    
    // Prepare data for backend
    const dataToSend = {
      ...formData,
      [field]: newArray,
      nativeLanguages: formData.nativeLanguages ? [formData.nativeLanguages] : [],
      learningLanguages: formData.learningLanguages ? [formData.learningLanguages] : [],
    };
    
    console.log("📤 Sending to backend:", dataToSend);
    
    updateProfileMutation(dataToSend);
  };

  // Calculate profile completeness - use formData for real-time updates
  const liveUserData = {
    ...authUser,
    ...formData,
    // Convert single language strings to arrays for completeness calculation
    nativeLanguages: formData.nativeLanguages ? [formData.nativeLanguages] : authUser?.nativeLanguages || [],
    learningLanguages: formData.learningLanguages ? [formData.learningLanguages] : authUser?.learningLanguages || [],
  };
  
  const completeness = calculateProfileCompleteness(liveUserData);
  const completionPercentage = completeness?.score || 0;

  console.log("📊 Profile completeness:", {
    authUser: authUser,
    formData: formData,
    liveUserData: liveUserData,
    completeness: completeness,
    percentage: completionPercentage
  });

  return (
    <div className="bg-base-100 min-h-screen pb-24 lg:pb-6">
      {/* Header with Avatar */}
      <div className="bg-base-200 p-6 text-center">
        <div className="relative inline-block">
          <Avatar 
            src={formData.profilePic}
            alt={formData.fullName}
            size="2xl"
            showRing={true}
          />
          <button
            onClick={handleGenerateAvatar}
            className="btn btn-circle btn-sm btn-primary absolute bottom-0 right-0"
            disabled={savingField === 'profilePic'}
          >
            {savingField === 'profilePic' ? (
              <Loader className="animate-spin" size={16} />
            ) : (
              <Camera size={16} />
            )}
          </button>
        </div>
        <p className="text-sm text-base-content/60 mt-2">{authUser?.email}</p>
        
        {/* Profile Completion */}
        <div className="mt-4 max-w-xs mx-auto">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-semibold">Profile Completion</span>
            <span className={`font-bold ${completionPercentage === 100 ? 'text-success' : 'text-warning'}`}>
              {completionPercentage}%
            </span>
          </div>
          <progress 
            className={`progress ${completionPercentage === 100 ? 'progress-success' : 'progress-warning'} w-full`} 
            value={completionPercentage} 
            max="100"
          ></progress>
        </div>
      </div>

      {/* Editable Fields */}
      <div className="max-w-2xl mx-auto p-4 space-y-2">
        
        {/* Full Name */}
        <EditableField
          label="Name"
          value={formData.fullName}
          field="fullName"
          editingField={editingField}
          savingField={savingField}
          setEditingField={setEditingField}
          onChange={(value) => setFormData({ ...formData, fullName: value })}
          onSave={() => handleSaveField('fullName')}
          type="text"
          placeholder="Your full name"
          required
        />

        {/* Bio */}
        <EditableField
          label="Bio"
          value={formData.bio}
          field="bio"
          editingField={editingField}
          savingField={savingField}
          setEditingField={setEditingField}
          onChange={(value) => setFormData({ ...formData, bio: value })}
          onSave={() => handleSaveField('bio')}
          type="textarea"
          placeholder="Tell others about yourself..."
        />

        {/* Location */}
        <EditableField
          label="Location"
          value={formData.location}
          field="location"
          editingField={editingField}
          savingField={savingField}
          setEditingField={setEditingField}
          onChange={(value) => setFormData({ ...formData, location: value })}
          onSave={() => handleSaveField('location')}
          type="text"
          placeholder="City, Country"
          icon={<MapPin size={18} />}
        />

        {/* Native Language */}
        <EditableField
          label="Native Language"
          value={formData.nativeLanguages}
          field="nativeLanguages"
          editingField={editingField}
          savingField={savingField}
          setEditingField={setEditingField}
          onChange={(value) => setFormData({ ...formData, nativeLanguages: value })}
          onSave={() => handleSaveField('nativeLanguages')}
          type="select"
          options={LANGUAGES}
          placeholder="Select language"
        />

        {/* Learning Language */}
        <EditableField
          label="Learning Language"
          value={formData.learningLanguages}
          field="learningLanguages"
          editingField={editingField}
          savingField={savingField}
          setEditingField={setEditingField}
          onChange={(value) => setFormData({ ...formData, learningLanguages: value })}
          onSave={() => handleSaveField('learningLanguages')}
          type="select"
          options={LANGUAGES}
          placeholder="Select language"
        />

        {/* Learning Goals */}
        <div className="card bg-base-200">
          <div className="card-body p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Target size={18} />
                Learning Goals
              </h3>
              {savingField === 'learningGoals' && (
                <span className="loading loading-spinner loading-sm"></span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {LEARNING_GOALS.map(goal => (
                <button
                  key={goal}
                  onClick={() => toggleArrayItem('learningGoals', goal)}
                  className={`badge badge-lg cursor-pointer transition-all ${
                    formData.learningGoals?.includes(goal)
                      ? 'badge-primary'
                      : 'badge-outline hover:badge-primary'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Availability */}
        <div className="card bg-base-200">
          <div className="card-body p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock size={18} />
                Availability
              </h3>
              {savingField === 'availability' && (
                <span className="loading loading-spinner loading-sm"></span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {AVAILABILITY_OPTIONS.map(time => (
                <button
                  key={time}
                  onClick={() => toggleArrayItem('availability', time)}
                  className={`badge badge-lg cursor-pointer transition-all ${
                    formData.availability?.includes(time)
                      ? 'badge-accent'
                      : 'badge-outline hover:badge-accent'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="divider mt-6">Settings</div>

        {/* Theme */}
        <div className="card bg-base-200">
          <div className="card-body p-4 flex flex-row items-center justify-between">
            <span className="font-medium">Theme</span>
            <ThemeSelector />
          </div>
        </div>

        {/* Logout */}
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
  );
};

// Editable Field Component
function EditableField({
  label,
  value = "", // Always default to empty string
  field,
  editingField,
  savingField,
  setEditingField,
  onChange,
  onSave,
  type = "text",
  placeholder,
  icon,
  options,
  required = false
}) {
  const isEditing = editingField === field;
  const isSaving = savingField === field;

  const handleBlur = () => {
    if (isEditing && value) {
      onSave();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      if (value) {
        onSave();
      }
    }
  };

  return (
    <div className=" card bg-base-200 hover:bg-base-300 transition-colors">
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="font-semibold text-sm flex items-center gap-2">
            {icon}
            {label}
          </label>
          {isSaving ? (
            <span className="flex items-center gap-1 text-sm text-success">
              <Check size={14} />
              Saved
            </span>
          ) : !isEditing && (
            <ChevronRight size={18} className="text-base-content/40" />
          )}
        </div>

        {type === 'textarea' ? (
          <textarea
            value={value || ""} // Ensure always controlled
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setEditingField(field)}
            onBlur={handleBlur}
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            className="textarea textarea-bordered w-full"
            rows="3"
          />
        ) : type === 'select' ? (
          <select
            value={value || ""} // Ensure always controlled
            onChange={(e) => {
              onChange(e.target.value);
              setSavingField(field);
              setTimeout(onSave, 100);
            }}
            className="select select-bordered w-full"
          >
            <option value="">{placeholder}</option>
            {options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value || ""} // Ensure always controlled
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setEditingField(field)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            className="input input-bordered w-full"
            required={required}
          />
        )}

        {!value && (
          <p className="text-xs text-base-content/50 mt-1">
            Tap to {isEditing ? 'enter' : 'edit'}
          </p>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;