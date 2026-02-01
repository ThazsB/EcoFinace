import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { AVAILABLE_AVATARS, AVAILABLE_COLORS } from '@/types';
import { ArrowLeft, UserPlus, Check } from 'lucide-react';

interface FirstAccessScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function FirstAccessScreen({ onBack, onSuccess }: FirstAccessScreenProps) {
  const { createProfile, loading } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
    avatar: AVAILABLE_AVATARS[0],
    color: AVAILABLE_COLORS[0].value,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (formData.password.length < 4) {
      newErrors.password = 'Senha deve ter pelo menos 4 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const profile = await createProfile(
      formData.name.trim(),
      formData.password,
      formData.avatar,
      formData.color
    );

    if (profile) {
      onSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        {/* Botão Voltar */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        {/* Título */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center"
          >
            <UserPlus className="w-10 h-10 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">Bem-vindo!</h1>
          <p className="text-muted-foreground">Vamos criar seu primeiro perfil</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção de Avatar */}
          <div>
            <label className="block text-sm font-medium mb-3">Avatar</label>
            <div className="grid grid-cols-6 gap-2">
              {AVAILABLE_AVATARS.slice(0, 12).map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setFormData({ ...formData, avatar })}
                  className={`
                    w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all
                    ${formData.avatar === avatar 
                      ? 'bg-primary text-primary-foreground scale-110 shadow-lg' 
                      : 'bg-muted hover:bg-muted/80'
                    }
                  `}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          {/* Seleção de Cor */}
          <div>
            <label className="block text-sm font-medium mb-3">Cor do Perfil</label>
            <div className="grid grid-cols-5 gap-2">
              {AVAILABLE_COLORS.slice(0, 10).map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`
                    w-12 h-12 rounded-xl transition-all
                    ${formData.color === color.value 
                      ? 'ring-2 ring-primary ring-offset-2 scale-110' 
                      : 'hover:scale-105'
                    }
                  `}
                  style={{ backgroundColor: color.value }}
                />
              ))}
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium mb-2">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`
                w-full px-4 py-3 bg-muted rounded-xl outline-none transition-all
                focus:ring-2 focus:ring-primary/20
                ${errors.name ? 'border-2 border-red-500' : 'border-2 border-transparent focus:border-primary'}
              `}
              placeholder="Digite seu nome"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium mb-2">Senha</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`
                w-full px-4 py-3 bg-muted rounded-xl outline-none transition-all
                focus:ring-2 focus:ring-primary/20
                ${errors.password ? 'border-2 border-red-500' : 'border-2 border-transparent focus:border-primary'}
              `}
              placeholder="Mínimo 4 caracteres"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-sm font-medium mb-2">Confirmar Senha</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className={`
                w-full px-4 py-3 bg-muted rounded-xl outline-none transition-all
                focus:ring-2 focus:ring-primary/20
                ${errors.confirmPassword ? 'border-2 border-red-500' : 'border-2 border-transparent focus:border-primary'}
              `}
              placeholder="Digite a senha novamente"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 px-4 py-3 bg-muted rounded-xl hover:bg-muted/80 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Criar Perfil
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
