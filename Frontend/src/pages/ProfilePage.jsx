import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
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
  const location = useLocation();
  const queryClient = useQueryClient();
  const [editingField, setEditingField] = useState(null);
  const [savingField, setSavingField] = useState(null);
  
  // Check if we came from Find Partner page
  const returnToFindPartner = location.state?.from === 'find-partner';
  
  console.log("🚀 ProfilePage Mount:", {
    locationState: location.state,
    from: location.state?.from,
    returnToFindPartner
  });
  
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
      
      queryClient.setQueryData(["authUser"], (old) => {
        console.log("📦 Updating cache from:", old?.user);
        console.log("📦 Updating cache to:", data.user);
        return {
          ...old,
          user: data.user,
          success: true
        };
      });
      
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
    
    setFormData({ ...formData, [field]: newArray });
    setSavingField(field);
    
    console.log(`🔄 Updating ${field}:`, newArray);
    
    const dataToSend = {
      ...formData,
      [field]: newArray,
      nativeLanguages: formData.nativeLanguages ? [formData.nativeLanguages] : [],
      learningLanguages: formData.learningLanguages ? [formData.learningLanguages] : [],
    };
    
    console.log("📤 Sending to backend:", dataToSend);
    
    updateProfileMutation(dataToSend);
  };

  const liveUserData = {
    ...authUser,
    ...formData,
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

  // Show success message when profile is complete (no auto-redirect)
  useEffect(() => {
    if (returnToFindPartner && completionPercentage === 100) {
      console.log("🎉 Profile complete! Should show success banner");
      toast.success("Profile completed! 🎉", { duration: 3000 });
    }
  }, [completionPercentage, returnToFindPartner]);

  console.log("🔍 Banner Debug:", {
    returnToFindPartner,
    completionPercentage,
    locationState: location.state,
    shouldShowIncompleteBanner: returnToFindPartner && completionPercentage < 100,
    shouldShowSuccessBanner: returnToFindPartner && completionPercentage === 100
  });

  return (
    <div className="bg-base-100 pb-8">
      {/* Show banner based on profile completion status */}
      {returnToFindPartner && completionPercentage < 100 && (
        <div className="bg-info text-info-content px-4 py-3 sm:py-4 text-center text-sm sm:text-base">
          <p className="font-semibold">Complete your profile to find language partners</p>
          <p className="text-xs sm:text-sm opacity-90 mt-1">
            {completeness?.missingFields?.length || 0} field(s) remaining
          </p>
        </div>
      )}
      
      {/* Success banner when profile is complete */}
      {returnToFindPartner && completionPercentage === 100 && (
        <div className="bg-success text-success-content px-4 py-4 sm:py-5 text-center">
          <p className="font-bold text-base sm:text-lg mb-2">🎉 Profile Complete!</p>
          <p className="text-xs sm:text-sm mb-3">You're all set to find language partners</p>
          <button 
            onClick={() => navigate('/find-partner', { replace: true })}
            className="btn btn-sm sm:btn-md btn-neutral"
          >
            Continue to Find Partners
          </button>
        </div>
      )}

      {/* Header with Avatar */}
      <div className="bg-base-200 px-4 py-6 sm:px-6 sm:py-8 lg:py-10 text-center">
        <div className="relative inline-block">
          <Avatar 
            src={formData.profilePic}
            alt={formData.fullName}
            size="2xl"
            showRing={true}
          />
          <button
            onClick={handleGenerateAvatar}
            className="btn btn-circle btn-xs sm:btn-sm btn-primary absolute bottom-0 right-0 shadow-lg"
            disabled={savingField === 'profilePic'}
          >
            {savingField === 'profilePic' ? (
              <Loader className="animate-spin w-3 h-3 sm:w-4 sm:h-4" />
            ) : (
              <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
          </button>
        </div>
        <p className="text-xs sm:text-sm text-base-content/60 mt-2 px-4 break-all">
          {authUser?.email}
        </p>
        
        {/* Profile Completion */}
        <div className="mt-4 max-w-[280px] sm:max-w-xs mx-auto px-4">
          <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
            <span className="font-semibold">Profile Completion</span>
            <span className={`font-bold ${completionPercentage === 100 ? 'text-success' : 'text-warning'}`}>
              {completionPercentage}%
            </span>
          </div>
          <progress 
            className={`progress ${completionPercentage === 100 ? 'progress-success' : 'progress-warning'} w-full h-2`} 
            value={completionPercentage} 
            max="100"
          ></progress>
        </div>
      </div>

      {/* Editable Fields */}
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 lg:px-6 py-4 pb-6 space-y-2 sm:space-y-3">
        
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
          icon={<MapPin className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />}
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
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-1.5 sm:gap-2">
                <Target className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                Learning Goals
              </h3>
              {savingField === 'learningGoals' && (
                <span className="loading loading-spinner loading-xs sm:loading-sm"></span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {LEARNING_GOALS.map(goal => (
                <button
                  key={goal}
                  onClick={() => toggleArrayItem('learningGoals', goal)}
                  className={`badge badge-md sm:badge-lg cursor-pointer transition-all text-xs sm:text-sm ${
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
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-1.5 sm:gap-2">
                <Clock className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                Availability
              </h3>
              {savingField === 'availability' && (
                <span className="loading loading-spinner loading-xs sm:loading-sm"></span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {AVAILABILITY_OPTIONS.map(time => (
                <button
                  key={time}
                  onClick={() => toggleArrayItem('availability', time)}
                  className={`badge badge-md sm:badge-lg cursor-pointer transition-all text-xs sm:text-sm ${
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
        <div className="divider mt-6 sm:mt-8 text-sm sm:text-base">Settings</div>

        {/* Theme */}
        <div className="card bg-base-200">
          <div className="card-body p-3 sm:p-4 flex flex-row items-center justify-between">
            <span className="font-medium text-sm sm:text-base">Theme</span>
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
          className="btn btn-error btn-block gap-2 text-sm sm:text-base h-12 sm:h-auto min-h-[48px]"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

// Editable Field Component
function EditableField({
  label,
  value = "",
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
    <div className="card bg-base-200 hover:bg-base-300 transition-colors">
      <div className="card-body p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="font-semibold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
            {icon}
            {label}
          </label>
          {isSaving ? (
            <span className="flex items-center gap-1 text-xs sm:text-sm text-success">
              <Check className="w-3 h-3 sm:w-[14px] sm:h-[14px]" />
              Saved
            </span>
          ) : !isEditing && (
            <ChevronRight className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-base-content/40" />
          )}
        </div>

        {type === 'textarea' ? (
          <textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setEditingField(field)}
            onBlur={handleBlur}
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            className="textarea textarea-bordered w-full text-sm sm:text-base min-h-[80px] sm:min-h-[96px]"
            rows="3"
          />
        ) : type === 'select' ? (
          <select
            value={value || ""}
            onChange={(e) => {
              onChange(e.target.value);
              setSavingField(field);
              setTimeout(onSave, 100);
            }}
            className="select select-bordered w-full text-sm sm:text-base h-10 sm:h-12"
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
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setEditingField(field)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            className="input input-bordered w-full text-sm sm:text-base h-10 sm:h-12"
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