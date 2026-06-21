import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";

export interface UserProfile {
  uid: string;
  displayName: string;
  username?: string;
  photoURL: string | null;
  email: string;
  points: number;
  vipLevel: 0 | 1 | 2 | 3;
  vip?: number;
  isAdmin?: boolean;
  bio: string;
  location?: { lat: number; lng: number };
  themeColor: string;
  createdAt: number;
  followersCount: number;
  followingCount: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const docRef = doc(db, "users", uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile(firebaseUser.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      const newProfile: UserProfile = {
        uid: cred.user.uid,
        displayName,
        photoURL: null,
        email,
        points: 100,
        vipLevel: 0,
        bio: "",
        themeColor: "purple",
        createdAt: Date.now(),
        followersCount: 0,
        followingCount: 0,
      };
      await setDoc(doc(db, "users", cred.user.uid), newProfile);
      setProfile(newProfile);
    },
    []
  );

  const logout = useCallback(async () => {
    await signOut(auth);
    setProfile(null);
  }, []);

  const updateUserProfile = useCallback(
    async (data: Partial<UserProfile>) => {
      if (!user) return;
      await updateDoc(doc(db, "users", user.uid), data as Record<string, unknown>);
      setProfile((prev) => (prev ? { ...prev, ...data } : null));
    },
    [user]
  );

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.uid);
  }, [user, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, login, register, logout, updateUserProfile, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
