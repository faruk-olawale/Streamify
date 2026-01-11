import { useState } from "react";
import useAuthUser from "../hooks/useAuthUser"
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { completeOnboarding } from "../lib/api";
import { CameraIcon, LoaderIcon } from "lucide-react";
import { ShuffleIcon } from "lucide-react";
import { LANGUAGES } from "../constants";
import { MapPinIcon, ShipWheelIcon } from "lucide-react";
import { generateRandomAvatar } from "../utils/avatar-helper";
import Avatar from "../component/Avatar";

const OnboardingPage = () => {
  const queryClient = useQueryClient();
  const { authUser } = useAuthUser();
  
  // FIXED: Changed field names to match backend (plural) and added learningLanguages
  const [formState, setFormState] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    nativeLanguages: authUser?.nativeLanguages?.[0] || "", // Get first element if array
    learningLanguages: authUser?.learningLanguages?.[0] || "", // FIXED: Added this field
    location: authUser?.location || "",
    profilePic: authUser?.profilePic || "",
  });

  const { mutate: onboardingMutation, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success("Profile onboarded successfully");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (error) => {
      toast.error(error.response.data.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // FIXED: Validate that languages are selected
    if (!formState.nativeLanguages) {
      toast.error("Please select your native language");
      return;
    }

    if (!formState.learningLanguages) {
      toast.error("Please select the language you want to learn");
      return;
    }

    // FIXED: Convert single strings to arrays for backend
    onboardingMutation({
      fullName: formState.fullName,
      bio: formState.bio,
      location: formState.location,
      profilePic: formState.profilePic,
      nativeLanguages: [formState.nativeLanguages], // Convert to array
      learningLanguages: [formState.learningLanguages], // Convert to array
      isOnboarded: true,
    });
  };

  const handleRounderAvater = () => {
    const randomAvatar = generateRandomAvatar(formState.fullName || 'User', 'ui-avatars');
    setFormState({ ...formState, profilePic: randomAvatar });
    toast.success("Random profile picture generated");
  };

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="card bg-base-200 w-full max-w-3xl shadow-xl">
        <div className="card-body p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">
            Complete Your Profile
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Avatar 
                src={formState.profilePic}
                alt={formState.fullName}
                size="2xl"
                showRing={false}
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRounderAvater}
                  className="btn btn-accent"
                >
                  <ShuffleIcon className="size-4 mr-2" />
                  Generate Random Avatar
                </button>
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Full Name</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formState.fullName}
                onChange={(e) =>
                  setFormState({ ...formState, fullName: e.target.value })
                }
                className="input input-bordered w-full"
                placeholder="Your full name"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Bio</span>
              </label>
              <textarea
                name="bio"
                value={formState.bio}
                onChange={(e) =>
                  setFormState({ ...formState, bio: e.target.value })
                }
                className="textarea textarea-bordered h-24"
                placeholder="Tell others about yourself and your language learning goals"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* FIXED: Changed field name to nativeLanguages */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Native Language</span>
                </label>
                <select
                  name="nativeLanguages"
                  value={formState.nativeLanguages}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      nativeLanguages: e.target.value,
                    })
                  }
                  className="select select-bordered w-full"
                  required
                >
                  <option value="">Select your native language</option>
                  {LANGUAGES.map((lang) => (
                    <option key={`native-${lang}`} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              {/* FIXED: Changed field name to learningLanguages and fixed label */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Learning Language</span>
                </label>
                <select
                  name="learningLanguages"
                  value={formState.learningLanguages}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      learningLanguages: e.target.value,
                    })
                  }
                  className="select select-bordered w-full"
                  required
                >
                  <option value="">Select language to learn</option>
                  {LANGUAGES.map((lang) => (
                    <option key={`learning-${lang}`} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Location</span>
              </label>
              <div className="relative">
                <MapPinIcon className="absolute top-1/2 transform -translate-y-1/2 left-3 size-5 text-base-content opacity-70" />
                <input
                  type="text"
                  name="location"
                  value={formState.location}
                  onChange={(e) =>
                    setFormState({ ...formState, location: e.target.value })
                  }
                  className="input input-bordered w-full pl-10"
                  placeholder="City, Country"
                />
              </div>
            </div>

            <button
              className="btn btn-primary w-full"
              disabled={isPending}
              type="submit"
            >
              {!isPending ? (
                <>
                  <ShipWheelIcon className="size-5 mr-2" />
                  Complete Onboarding
                </>
              ) : (
                <>
                  <LoaderIcon className="animate-spin size-5 mr-2" />
                  Onboarding...
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;