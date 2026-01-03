import { Routes, Route, Navigate } from "react-router";
import { Toaster } from "react-hot-toast";
import useAuthUser from "./hooks/useAuthUser.jsx";
import { useThemeStore } from "./store/useThemeStore.js";

import Layout from "./component/Layout.jsx";
import PageLoader from "./component/PageLoader.jsx";

import HomePage from "./pages/HomePage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import CallPage from "./pages/CallPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";

const App = () => {
  const { isLoading, authUser } = useAuthUser();
  const { theme } = useThemeStore();

  const isAuthenticated = Boolean(authUser);
  const isOnboarded = authUser?.isOnboarded;

  if (isLoading) return <PageLoader />;

  console.log("authUser:", authUser);
  console.log("isAuthenticated:", isAuthenticated);
  console.log("isOnboarded:", isOnboarded);

  return (
    <div className="h-screen" data-theme={theme}>
      <Routes>
        {/* Home */}
        <Route
          path="/"
          element={
            isAuthenticated
              ? isOnboarded
                ? (
                  <Layout showSidebar={true}>
                    <HomePage />
                  </Layout>
                )
                : <Navigate to="/onboarding" />
              : <Navigate to="/login" />
          }
        />

        {/* Onboarding */}
        <Route
          path="/onboarding"
          element={
            isAuthenticated
              ? !isOnboarded
                ? <OnboardingPage />
                : <Navigate to="/" />
              : <Navigate to={!isAuthenticated ? "/login": "/onboarding" }/>
          }
        />

        {/* Auth */}
        <Route
          path="/signup"
          element={
            !isAuthenticated
              ? <SignUpPage />
              : isOnboarded
                ? <Navigate to="/" />
                : <Navigate to="/onboarding" />
          }
        />
        <Route
          path="/login"
          element={
            !isAuthenticated
              ? <LoginPage />
              : isOnboarded
                ? <Navigate to="/" />
                : <Navigate to="/onboarding" />
          }
        />

        {/* Protected */}
        <Route
          path="/notifications"
          element={isAuthenticated && isOnboarded ? (
            <Layout showSidebar={true}>
              <NotificationsPage/>
            </Layout>
          ) : (
            <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
          )}
        />
        <Route
          path="/call/:id"
          element={isAuthenticated && isOnboarded ? (
            <CallPage/>
          ) : (
            <Navigate to={!isAuthenticated ? "/login" : "/onboarding"}/>
          )}
        />
        <Route
          path="/chat/:id"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={false}>
                <ChatPage/>
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <Toaster />
    </div>
  );
};

export default App;
