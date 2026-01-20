import { useState } from "react";
import useAuthUser from "../hooks/useAuthUser"
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { completeOnboarding } from "../lib/api";
import { LoaderIcon, ShuffleIcon, MapPinIcon, ShipWheelIcon, ChevronRight, ChevronLeft } from "lucide-react";
import { LANGUAGES } from "../constants";
import { generateRandomAvatar } from "../utils/avatar-helper";
import Avatar from "../component/Avatar";

// Match the goals from your ProfilePage
const LEARNING_GOALS = [
  'Conversation', 'Pronunciation', 'Grammar', 
  'Writing', 'Reading', 'Business', 'Travel'
];

const AVAILABILITY_OPTIONS = [
  'Mornings', 'Afternoons', 'Evenings', 
  'Weekends', 'Weekdays', 'Flexible'
];

const PROFICIENCY_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'Just starting out' },
  { value: 'intermediate', label: 'Intermediate', description: 'Can have basic conversations' },
  { value: 'advanced', label: 'Advanced', description: 'Fluent in most situations' },
];

const OnboardingPage = () => {
  const queryClient = useQueryClient();
  const { authUser } = useAuthUser();
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4; // Added step 4 for availability
  
  const [formState, setFormState] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    nativeLanguages: authUser?.nativeLanguages?.[0] || "",
    learningLanguages: authUser?.learningLanguages?.[0] || "",
    location: authUser?.location || "",
    profilePic: authUser?.profilePic || "",
    // NEW: Proficiency level (simple string for now)
    proficiencyLevel: "",
    // Match your existing ProfilePage structure
    learningGoals: authUser?.learningGoals || [],
    availability: authUser?.availability || []
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

    // Validate
    if (!formState.nativeLanguages) {
      toast.error("Please select your native language");
      return;
    }
    if (!formState.learningLanguages) {
      toast.error("Please select the language you want to learn");
      return;
    }

    // Build proficiency levels for backend
    const proficiencyLevels = {};
    if (formState.proficiencyLevel && formState.learningLanguages) {
      proficiencyLevels[formState.learningLanguages] = {
        level: formState.proficiencyLevel,
        startedLearning: new Date()
      };
    }

    onboardingMutation({
      fullName: formState.fullName,
      bio: formState.bio,
      location: formState.location,
      profilePic: formState.profilePic,
      nativeLanguages: [formState.nativeLanguages],
      learningLanguages: [formState.learningLanguages],
      proficiencyLevels,
      learningGoals: formState.learningGoals,
      availability: formState.availability,
      isOnboarded: true,
    });
  };

  const handleRandomAvatar = () => {
    const randomAvatar = generateRandomAvatar(formState.fullName || 'User', 'ui-avatars');
    setFormState({ ...formState, profilePic: randomAvatar });
    toast.success("Random profile picture generated");
  };

  const toggleArrayItem = (field, value) => {
    const currentArray = formState[field] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    setFormState({ ...formState, [field]: newArray });
  };

  const nextStep = () => {
    // Validation for each step
    if (currentStep === 1) {
      if (!formState.fullName) {
        toast.error("Please enter your name");
        return;
      }
      if (!formState.nativeLanguages || !formState.learningLanguages) {
        toast.error("Please select both languages");
        return;
      }
    }
    
    if (currentStep === 2) {
      if (!formState.proficiencyLevel) {
        toast.error("Please select your proficiency level");
        return;
      }
    }
    
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="card bg-base-200 w-full max-w-3xl shadow-xl">
        <div className="card-body p-6 sm:p-8">
          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
              <span className="text-sm text-base-content/60">
                {currentStep === 1 && "Basic Info"}
                {currentStep === 2 && "Language Level"}
                {currentStep === 3 && "Learning Goals"}
                {currentStep === 4 && "Availability"}
              </span>
            </div>
            <div className="w-full bg-base-300 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">
            {currentStep === 1 && "Complete Your Profile"}
            {currentStep === 2 && "Your Language Level"}
            {currentStep === 3 && "Learning Goals"}
            {currentStep === 4 && "Your Availability"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* STEP 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <Avatar 
                    src={formState.profilePic}
                    alt={formState.fullName}
                    size="2xl"
                    showRing={false}
                  />
                  <button
                    type="button"
                    onClick={handleRandomAvatar}
                    className="btn btn-accent btn-sm"
                  >
                    <ShuffleIcon className="size-4 mr-2" />
                    Generate Random Avatar
                  </button>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Full Name</span>
                  </label>
                  <input
                    type="text"
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
                    value={formState.bio}
                    onChange={(e) =>
                      setFormState({ ...formState, bio: e.target.value })
                    }
                    className="textarea textarea-bordered h-24"
                    placeholder="Tell others about yourself and your language learning goals"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Native Language</span>
                    </label>
                    <select
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

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Learning Language</span>
                    </label>
                    <select
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
                      value={formState.location}
                      onChange={(e) =>
                        setFormState({ ...formState, location: e.target.value })
                      }
                      className="input input-bordered w-full pl-10"
                      placeholder="City, Country"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Proficiency Level */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <p className="text-base-content/70">
                    What's your current level in <strong>{formState.learningLanguages}</strong>?
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {PROFICIENCY_LEVELS.map((level) => (
                    <label
                      key={level.value}
                      className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                        formState.proficiencyLevel === level.value
                          ? 'border-primary bg-primary/10'
                          : 'border-base-300 hover:border-base-content/20'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="radio"
                          name="proficiency"
                          className="radio radio-primary"
                          checked={formState.proficiencyLevel === level.value}
                          onChange={() => setFormState({ ...formState, proficiencyLevel: level.value })}
                        />
                        <div className="flex-1">
                          <div className="font-semibold">{level.label}</div>
                          <div className="text-sm text-base-content/60">{level.description}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: Learning Goals */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <p className="text-base-content/70">
                    What do you want to focus on? (Select all that apply)
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {LEARNING_GOALS.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleArrayItem('learningGoals', goal)}
                      className={`btn btn-sm ${
                        formState.learningGoals?.includes(goal)
                          ? 'btn-primary'
                          : 'btn-outline'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>

                {formState.learningGoals?.length === 0 && (
                  <div className="alert alert-info">
                    <span className="text-sm">Select at least one goal to help us match you better!</span>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: Availability */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <p className="text-base-content/70">
                    When are you available to practice?
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVAILABILITY_OPTIONS.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => toggleArrayItem('availability', time)}
                      className={`btn btn-sm ${
                        formState.availability?.includes(time)
                          ? 'btn-accent'
                          : 'btn-outline'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>

                {formState.availability?.length === 0 && (
                  <div className="alert alert-info">
                    <span className="text-sm">Select your availability to connect with partners in your timezone!</span>
                  </div>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 pt-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn btn-ghost flex-1"
                >
                  <ChevronLeft className="size-5 mr-2" />
                  Back
                </button>
              )}
              
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn btn-primary flex-1"
                >
                  Next
                  <ChevronRight className="size-5 ml-2" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={isPending}
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
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;