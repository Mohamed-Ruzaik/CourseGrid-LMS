import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiClient } from "../api/client";
import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload
} from "../types/auth";
import { clearStoredToken, getStoredToken, storeToken } from "./storage";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isBootstrapping: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<AuthUser>;
  refreshCurrentUser: () => Promise<AuthUser | null>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      if (!token) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const response = await apiClient.get<AuthUser>("/auth/me");
        if (!cancelled) {
          setUser(response.data);
        }
      } catch {
        if (!cancelled) {
          logout();
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    }

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [logout, token]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await apiClient.post<AuthResponse>("/auth/login", payload);
    storeToken(response.data.access_token);
    setToken(response.data.access_token);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await apiClient.post<AuthUser>("/auth/register", payload);
    return response.data;
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    try {
      const response = await apiClient.get<AuthUser>("/auth/me");
      setUser(response.data);
      return response.data;
    } catch {
      logout();
      return null;
    }
  }, [logout]);

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    const response = await apiClient.patch<AuthUser>("/auth/me", payload);
    setUser(response.data);
    return response.data;
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isBootstrapping,
      login,
      register,
      updateProfile,
      refreshCurrentUser,
      logout
    }),
    [isBootstrapping, login, logout, refreshCurrentUser, register, token, updateProfile, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
