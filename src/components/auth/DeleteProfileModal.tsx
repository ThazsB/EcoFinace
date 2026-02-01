import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Profile } from '@/types';
import { Trash2, AlertTriangle, Check } from 'lucide-react';

interface DeleteProfileModalProps {
  profile: Profile;
  currentUserId: string | null;
  onConfirm: (password: string) => Promise<boolean>;
  onCancel: () => void;
}

export function DeleteProfileModal({ profile, currentUserId, onConfirm, onCancel }: DeleteProfileModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const isCurrentUser = profile.id === currentUserId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError('Digite sua senha para confirmar');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isValid = await onConfirm(password);
      
      if (isValid) {
        setSuccess(true);
        setTimeout(() => {
          onCancel();
        }, 1500);
      } else {
        setError('Senha incorreta. Tente novamente.');
      }
    } catch {
      setError('Erro ao validar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="bg-card rounded-3xl border border-border w-full max-w-sm overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Excluir Perfil</h2>
                <p className="text-sm text-muted-foreground">Esta ação é irreversível</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            {success ? (
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4"
                >
                  <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </motion.div>
                <p className="text-base font-medium text-green-600 dark:text-green-400">Perfil excluído!</p>
              </div>
            ) : (
              <>
                {/* Warning */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Todos os dados serão perdidos permanentemente.
                    </p>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 dark:bg-muted/20 rounded-2xl">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${profile.color}25` }}
                  >
                    {profile.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{profile.name}</p>
                    <p className="text-xs text-muted-foreground">Perfil a excluir</p>
                  </div>
                </div>

                {/* Error if current user */}
                {isCurrentUser && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-4">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                      Não é possível excluir o perfil logado.
                    </p>
                  </div>
                )}

                {/* Password Form */}
                {!isCurrentUser && (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (error) setError('');
                        }}
                        className={`
                          w-full px-4 py-3 bg-muted/50 dark:bg-muted/20 rounded-2xl outline-none transition-all
                          text-center placeholder:text-muted-foreground/50
                          ${error ? 'ring-2 ring-red-500' : 'focus:ring-2 focus:ring-primary/50'}
                        `}
                        placeholder="Digite sua senha"
                        autoFocus
                      />
                      {error && (
                        <p className="text-red-500 text-xs text-center mt-2">{error}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 bg-muted/50 dark:bg-muted/20 rounded-2xl hover:bg-muted transition-colors font-medium text-sm"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors font-medium text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {isCurrentUser && (
                  <button
                    onClick={onCancel}
                    className="w-full px-4 py-2.5 bg-muted/50 dark:bg-muted/20 rounded-2xl hover:bg-muted transition-colors font-medium text-sm"
                  >
                    Fechar
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
