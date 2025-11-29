import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/hooks/useAuth";
import { CreateSnippetPage } from "@/pages/CreateSnippet";
import { HomePage } from "@/pages/Home";
import { LoginPage } from "@/pages/Login";
import { ProfilePage } from "@/pages/Profile";
import { RegisterPage } from "@/pages/Register";
import { SnippetDetailPage } from "@/pages/SnippetDetail";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/new" element={<CreateSnippetPage />} />
            <Route path="/snippet/:id" element={<SnippetDetailPage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
