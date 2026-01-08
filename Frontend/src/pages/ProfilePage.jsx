import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useAuthUser from "../hooks/useAuthUser";
import { logout } from "../lib/api";
import { LogOut } from "lucide-react";
import ThemeSelector from "../component/ThemeSelector";

const ProfilePage = () => {
  const { authUser } = useAuthUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate: logoutMutation } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      navigate("/login");
    },
  });

  return (
  <div className="bg-base-100 pt-0 flex flex-col ">


      {/* Header */}
      <div className="bg-base-200 p-6 text-center flex-shrink-0">
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
              <p className="text-base-content/70">
                {authUser?.location || "Not specified"}
              </p>
            </div>
          </div>

          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title text-lg">Languages</h3>
              <div className="space-y-1">
                <p className="text-base-content/70">
                  <span className="font-semibold">Native:</span>{" "}
                  {authUser?.nativeLanguages || "Not specified"}
                </p>
                <p className="text-base-content/70">
                  <span className="font-semibold">Learning:</span>{" "}
                  {authUser?.learningLanguages || "Not specified"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg mb-2">Settings</h3>

          {/* Theme Selector */}
          <div className="card bg-base-200">
            <div className="card-body flex-row items-center justify-between">
              <span className="font-medium">Theme</span>
              <ThemeSelector />
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
    </div>
  );
};

export default ProfilePage;
