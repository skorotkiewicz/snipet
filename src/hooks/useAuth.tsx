import type { AuthModel } from "pocketbase";
import { createContext, useContext, useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";

interface AuthContextType {
  user: AuthModel | null;
  token: string | null;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, token: null, signOut: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthModel | null>(pb.authStore.record);
  const [token, setToken] = useState<string | null>(pb.authStore.token);

  useEffect(() => {
    pb.authStore.onChange((token, model) => {
      setToken(token);
      setUser(model);
    });
  }, []);

  const signOut = () => {
    pb.authStore.clear();
  };

  return <AuthContext.Provider value={{ user, token, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
