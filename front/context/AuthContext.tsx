"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getGuests } from "@/lib/api";

export interface GuestUser {
  id?: string;
  name: string;
  email: string;
  avatar?: string | null;
  rsvpStatus?: "PENDING" | "ATTENDING" | "TENTATIVE" | "DECLINED";
  dietaryNotes?: string | null;
  message?: string | null;
  championId?: string | null;
  championName?: string | null;
  championTitle?: string | null;
  championRole?: string | null;
  championImage?: string | null;
}

interface AuthContextType {
  user: GuestUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  loginQuick: (name: string, email: string, avatar?: string) => void;
  updateGuestData: (data: Partial<GuestUser>) => void;
  logout: () => void;
  refreshGuest: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GuestUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cargar usuario guardado en localStorage y/o sesión activa de Google (NextAuth)
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      let currentUser: GuestUser | null = null;
      try {
        const stored = localStorage.getItem("lol_birthday_user");
        if (stored) {
          currentUser = JSON.parse(stored);
        }
      } catch (e) {
        console.error("Error reading stored user:", e);
      }

      // Detectar sesión de Google OAuth si existe
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const session = await res.json();
          if (session?.user?.email) {
            const googleEmail = session.user.email.toLowerCase();
            if (!currentUser || currentUser.email !== googleEmail) {
              currentUser = {
                name: session.user.name || "Invocador",
                email: googleEmail,
                avatar: session.user.image || null,
              };
            } else {
              currentUser = {
                ...currentUser,
                name: currentUser.name || session.user.name || "Invocador",
                avatar: currentUser.avatar || session.user.image || null,
              };
            }
            localStorage.setItem("lol_birthday_user", JSON.stringify(currentUser));
          }
        }
      } catch (authErr) {
        console.warn("Could not check NextAuth session:", authErr);
      }

      if (isMounted) {
        if (currentUser) {
          setUser(currentUser);
        }
        setIsLoading(false);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const loginQuick = (name: string, email: string, avatar?: string) => {
    const newUser: GuestUser = {
      name,
      email,
      avatar:
        avatar ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
          name
        )}&backgroundColor=091428`,
    };
    setUser(newUser);
    localStorage.setItem("lol_birthday_user", JSON.stringify(newUser));
  };

  const updateGuestData = (data: Partial<GuestUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem("lol_birthday_user", JSON.stringify(updated));
      return updated;
    });
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem("lol_birthday_user");
    try {
      const { signOut } = await import("next-auth/react");
      await signOut({ redirect: false });
    } catch (e) {
      console.error("Error signing out from NextAuth:", e);
    }
  };

  const refreshGuest = async () => {
    if (!user?.email) return;
    try {
      const guests = await getGuests();
      const found = guests.find((g) => g.email === user.email);
      if (found) {
        updateGuestData(found);
      }
    } catch (err) {
      console.error("Error refreshing guest:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: Boolean(user?.email),
        isLoading,
        loginQuick,
        updateGuestData,
        logout,
        refreshGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
