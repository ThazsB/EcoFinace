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

        // Resetar perfil ativo quando o usuário fechar o site
  useEffect(() => {
    const PROFILE_KEY = 'ecofinance_active_profile';
    const TIMESTAMP_KEY = 'ecofinance_profile_timestamp';
    
    // Verificar se a página foi reaberta após um tempo de inatividade
    const checkAndClearProfile = () => {
      const timestamp = localStorage.getItem(TIMESTAMP_KEY);
      const profileActive = localStorage.getItem(PROFILE_KEY);
      
      if (profileActive && timestamp) {
        const lastActivity = parseInt(timestamp);
        const now = Date.now();
        const timeDiff = now - lastActivity;
        
        // Se passaram mais de 30 segundos desde a última atividade, limpar o perfil
        if (timeDiff > 30000) {
          console.log('[AuthContext] Clearing profile due to inactivity:', timeDiff, 'ms');
          localStorage.removeItem(PROFILE_KEY);
          localStorage.removeItem(TIMESTAMP_KEY);
          sessionStorage.removeItem('welcome_shown');
          useAuthStore.setState({ user: null });
        }
      }
    };

    // Atualizar timestamp a cada 5 segundos se há perfil ativo
    const updateTimestamp = () => {
      const profileActive = localStorage.getItem(PROFILE_KEY);
      if (profileActive) {
        localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
      }
    };

    const handleBeforeUnload = () => {
      console.log('[AuthContext] BeforeUnload event fired - clearing profile');
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem(TIMESTAMP_KEY);
      sessionStorage.removeItem('welcome_shown');
      useAuthStore.setState({ user: null });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('[AuthContext] Page hidden');
        // Não limpar imediatamente para não interferir com navegação entre abas
        // Apenas atualizar que a página ficou oculta
      } else if (document.visibilityState === 'visible') {
        console.log('[AuthContext] Page visible - checking profile');
        // Verificar se deve limpar o perfil ao voltar a visualizar a página
        checkAndClearProfile();
      }
    };

    // Verificar perfil ao carregar a página
    checkAndClearProfile();
    
    // Adicionar listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Atualizar timestamp periodicamente
    const timestampInterval = setInterval(updateTimestamp, 5000);

    console.log('[AuthContext] Added unload listeners and profile monitoring');

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(timestampInterval);
    };
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
