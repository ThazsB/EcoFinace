import React, { createContext, useContext, ReactNode } from 'react';
import { Profile } from '@/types';
import { useAuthStore } from '@/stores/authStore';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  login: (id: string, password: string) => Promise<boolean>;
  logout: () => void;
  createProfile: (name: string, password: string, avatar?: string, color?: string) => Promise<Profile | null>;
  updateProfile: (id: string, data: Partial<Profile>) => Promise<Profile | null>;
  deleteProfile: (id: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading, login, logout, createProfile, updateProfile, deleteProfile } = useAuthStore();

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      createProfile,
      updateProfile,
      deleteProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
