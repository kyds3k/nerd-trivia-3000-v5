// src/context/AuthContext.ts
import React, { createContext, useEffect, useState, ReactNode } from "react";
import pb from "@/lib/pocketbase";

// Define the shape of the context value
interface AuthContextType {
  isAuthenticated: boolean;
  refreshAuthState: () => Promise<void>;
}

// Create the context with an initial undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the AuthProvider props type
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }): ReactNode => {
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid);

  const refreshAuthState = async () => {
    if (!pb.authStore.isValid) {
      try {
        const adminEmail = process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_EMAIL;
        const adminPass = process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_PW;
        await pb.admins.authWithPassword(adminEmail as string, adminPass as string);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Failed to refresh auth state:", error);
        setIsAuthenticated(false);
      }
    }
  };

  useEffect(() => {
    refreshAuthState();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, refreshAuthState }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
