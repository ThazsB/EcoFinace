import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { ProfileCard } from './ProfileCard';
import { PasswordInput } from './PasswordInput';
import { FirstAccessScreen } from './FirstAccessScreen';
import { DeleteProfileModal } from './DeleteProfileModal';
import { PieChart, UserPlus, ChevronRight } from 'lucide-react';

export default function LoginScreen() {
  const { 
    user, 
    profiles, 
    login, 
    deleteProfile,
    validatePassword,
  } = useAuthStore();
  const userId = user?.id ?? null;

  // Estados locais para o fluxo de autenticação
  const [view, setView] = useState<'profiles' | 'password' | 'first-access'>('profiles');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('none');
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Estados para modal de exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

  // Se não há perfis, mostrar tela de primeiro acesso
  useEffect(() => {
    if (profiles.length === 0 && view === 'profiles') {
      setView('first-access');
    }
  }, [profiles.length, view]);

  // Se usuário já está logado, não mostrar tela de login
  if (user) {
    return null;
  }

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

  const handleSelectProfile = useCallback((profileId: string) => {
    setSelectedProfileId(profileId);
    setPassword('');
    setError('none');
    setErrorMessage('');
    setView('password');
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedProfileId(null);
    setPassword('');
    setError('none');
    setErrorMessage('');
    setView('profiles');
  }, []);

  const handleCreateProfile = useCallback(() => {
    setView('first-access');
  }, []);

  const handleBackToProfiles = useCallback(() => {
    setView('profiles');
  }, []);

  const handleDeleteProfile = useCallback((profileId: string) => {
    setProfileToDelete(profileId);
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async (password: string) => {
    if (!profileToDelete) return false;
    
    const isValid = await validatePassword(profileToDelete, password);
    
    if (isValid) {
      const success = await deleteProfile(profileToDelete);
      if (success) {
        setShowDeleteModal(false);
        setProfileToDelete(null);
        // Se não houver mais perfis, ir para tela de criação
        const updatedProfiles = profiles.filter(p => p.id !== profileToDelete);
        if (updatedProfiles.length === 0) {
          setView('first-access');
        }
      }
      return success;
    }
    
    return false;
  }, [profileToDelete, validatePassword, deleteProfile, profiles]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setProfileToDelete(null);
  }, []);

  const handleLogin = useCallback(async () => {
    if (!selectedProfileId || !password) return;

    setIsAuthenticating(true);
    setError('none');
    setErrorMessage('');

    try {
      const success = await login(selectedProfileId, password);
      
      if (success) {
        // Login sucesso - redirect será feito pelo App
      } else {
        setError('invalid-password');
        setErrorMessage('Senha incorreta. Tente novamente.');
        setPassword('');
      }
    } catch {
      setError('network-error');
      setErrorMessage('Erro de conexão. Tente novamente.');
    } finally {
      setIsAuthenticating(false);
    }
  }, [selectedProfileId, password, login]);

  // Último perfil acessado
  const lastAccessProfile = profiles.length > 0 
    ? profiles.reduce((latest, profile) => {
        const profileDate = new Date(profile.lastAccess || 0);
        const latestDate = new Date(latest?.lastAccess || 0);
        return profileDate > latestDate ? profile : latest;
      }, profiles[0])
    : null;

  // Perfil a ser excluído
  const profileToDeleteData = profiles.find(p => p.id === profileToDelete);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center">
              <PieChart className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Finanças<span className="text-primary">EmDia</span></h1>
          </motion.div>
          <p className="text-muted-foreground">
            {view === 'password' && selectedProfile
              ? `Olá, ${selectedProfile.name}!` 
              : 'Selecione ou crie um perfil para continuar'
            }
          </p>
        </div>

        {/* Área de autenticação */}
        <AnimatePresence mode="wait">
          {view === 'first-access' ? (
            <motion.div
              key="first-access"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full"
            >
              <FirstAccessScreen
                onBack={handleBackToProfiles}
                onSuccess={() => {
                  // Login será detectado pelo useEffect no App
                }}
              />
            </motion.div>
          ) : view === 'password' && selectedProfile ? (
            <motion.div
              key="password-panel"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              {/* Perfil selecionado */}
              <div className="flex items-center justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center"
                >
                  <div 
                    className="w-24 h-24 rounded-full mx-auto mb-3 flex items-center justify-center text-5xl shadow-lg"
                    style={{ backgroundColor: `${selectedProfile.color}20` }}
                  >
                    {selectedProfile.avatar}
                  </div>
                  <p className="text-xl font-semibold">{selectedProfile.name}</p>
                </motion.div>
              </div>

              {/* Campo de senha */}
              <div className="max-w-md mx-auto">
                <PasswordInput
                  value={password}
                  onChange={(value) => {
                    setPassword(value);
                    if (error !== 'none') {
                      setError('none');
                      setErrorMessage('');
                    }
                  }}
                  onSubmit={handleLogin}
                  error={error !== 'none' ? errorMessage : undefined}
                  isLoading={isAuthenticating}
                  autoFocus
                  placeholder="Digite sua senha"
                />

                {/* Botão de entrar */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogin}
                  disabled={password.length < 4 || isAuthenticating}
                  className={`
                    w-full mt-4 py-4 rounded-xl font-semibold text-lg
                    transition-all duration-200 flex items-center justify-center gap-2
                    ${password.length >= 4 && !isAuthenticating
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }
                  `}
                >
                  {isAuthenticating ? (
                    <div className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Entrar</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>

                {/* Voltar */}
                <button
                  onClick={handleClearSelection}
                  className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Selecionar outro perfil
                </button>
              </div>
            </motion.div>
          ) : (
            /* Lista de perfis */
            <motion.div
              key="profile-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {profiles.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-6">Nenhum perfil encontrado</p>
                  <button
                    onClick={handleCreateProfile}
                    className="bg-primary text-primary-foreground px-8 py-4 rounded-xl hover:bg-primary/90 transition-all font-medium flex items-center gap-2 mx-auto shadow-lg shadow-primary/25"
                  >
                    <UserPlus className="w-5 h-5" />
                    Criar Primeiro Perfil
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {profiles.map((profile) => (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      isSelected={profile.id === selectedProfileId}
                      isLastAccess={profile.id === lastAccessProfile?.id}
                      onClick={() => handleSelectProfile(profile.id)}
                      onDelete={handleDeleteProfile}
                    />
                  ))}

                  {/* Botão criar novo perfil */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCreateProfile}
                    className="p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/50 transition-all flex flex-col items-center justify-center gap-3"
                  >
                    <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
                      <UserPlus className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">Criar Novo</p>
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de exclusão de perfil */}
      {showDeleteModal && profileToDeleteData && (
        <DeleteProfileModal
          profile={profileToDeleteData}
          currentUserId={userId}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
