import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getCurrentUser } from "@/lib/auth";
import type { User } from "@shared/schema";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  streakCelebration: {
    show: boolean;
    streak: number;
    message: string;
  } | null;
  dismissStreakCelebration: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [streakCelebration, setStreakCelebration] = useState<{
    show: boolean;
    streak: number;
    message: string;
  } | null>(null);

  const refreshUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      
      // Check for streak celebration data
      if ((userData as any)?.celebrateStreak && (userData as any)?.streakMessage) {
        setStreakCelebration({
          show: true,
          streak: (userData as any).streak || 0,
          message: (userData as any).streakMessage,
        });
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
      setUser(null);
    }
  };

  const dismissStreakCelebration = () => {
    setStreakCelebration(null);
  };

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;
      
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        if (mounted) {
          await refreshUser();
        }
      } else {
        if (mounted) {
          setUser(null);
        }
      }
      
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      firebaseUser, 
      user, 
      loading, 
      refreshUser, 
      streakCelebration,
      dismissStreakCelebration 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
