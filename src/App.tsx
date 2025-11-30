import { lazy, Suspense } from "react";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/hooks/useAuth";

const CreateSnippetPage = lazy(() =>
  import("@/pages/CreateSnippet").then((module) => ({ default: module.CreateSnippetPage })),
);
const EditProfilePage = lazy(() =>
  import("@/pages/EditProfile").then((module) => ({ default: module.EditProfilePage })),
);
const HomePage = lazy(() =>
  import("@/pages/Home").then((module) => ({ default: module.HomePage })),
);
const LoginPage = lazy(() =>
  import("@/pages/Login").then((module) => ({ default: module.LoginPage })),
);
const ProfilePage = lazy(() =>
  import("@/pages/Profile").then((module) => ({ default: module.ProfilePage })),
);
const RegisterPage = lazy(() =>
  import("@/pages/Register").then((module) => ({ default: module.RegisterPage })),
);
const SnippetDetailPage = lazy(() =>
  import("@/pages/SnippetDetail").then((module) => ({ default: module.SnippetDetailPage })),
);

const LoadingSpinner = () => {
  return (
    <div className="flex justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route
              path="/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <HomePage />
                </Suspense>
              }
            />

            <Route
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Outlet />
                </Suspense>
              }
            >
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/new" element={<CreateSnippetPage />} />
              <Route path="/snippet/:id" element={<SnippetDetailPage />} />
              <Route path="/profile/:id" element={<ProfilePage />} />
              <Route path="/profile/edit" element={<EditProfilePage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
