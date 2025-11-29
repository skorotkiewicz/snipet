import type { AuthModel } from "pocketbase";
import { createContext, useContext, useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";

interface AuthContextType {
  user: AuthModel | null;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, signOut: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthModel | null>(pb.authStore.model);

  useEffect(() => {
    pb.authStore.onChange((_token, model) => {
      setUser(model);
    });
  }, []);

  const signOut = () => {
    pb.authStore.clear();
  };

  return <AuthContext.Provider value={{ user, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
