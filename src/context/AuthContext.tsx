import React, { createContext, useContext, ReactNode, useEffect } from 'react';
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
  const { user, loading, login, logout, createProfile, updateProfile, deleteProfile, profiles } = useAuthStore();

  // Carregar usuário ativo do localStorage ao inicializar
  useEffect(() => {
    console.log('[AuthContext] useEffect triggered, profiles.length:', profiles.length)
    const activeProfileId = localStorage.getItem('ecofinance_active_profile');
    console.log('[AuthContext] activeProfileId:', activeProfileId)
    if (activeProfileId && profiles.length > 0) {
      const activeProfile = profiles.find((p: Profile) => p.id === activeProfileId);
      console.log('[AuthContext] activeProfile:', activeProfile)
      if (activeProfile) {
        console.log('[AuthContext] Setting user:', activeProfile.name)
        useAuthStore.setState({ user: activeProfile });
      } else {
        console.log('[AuthContext] Active profile not found in profiles')
      }
    } else {
      console.log('[AuthContext] Skipping (no activeProfileId or no profiles)')
    }
  }, [profiles]); // Depende de profiles para garantir que sejam carregados

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
