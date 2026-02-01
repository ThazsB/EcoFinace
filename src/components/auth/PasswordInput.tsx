import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  error?: string;
  isLoading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export function PasswordInput({
  value,
  onChange,
  onSubmit,
  error,
  isLoading,
  placeholder = 'Digite sua senha',
  autoFocus = false,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  }, [onSubmit]);

  const getPasswordStrength = () => {
    if (!value) return { level: 0, label: '' };
    if (value.length < 4) return { level: 1, label: 'Fraca', color: 'bg-red-500' };
    if (value.length < 8) return { level: 2, label: 'Média', color: 'bg-yellow-500' };
    return { level: 3, label: 'Forte', color: 'bg-green-500' };
  };

  const strength = getPasswordStrength();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full"
    >
      <div className="relative">
        {/* Ícone de cadeado */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Lock className="w-5 h-5" />
        </div>

        {/* Input de senha */}
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={isLoading}
          className={`
            w-full pl-12 pr-12 py-4 bg-muted rounded-xl
            border-2 outline-none transition-all duration-200
            focus:ring-2 focus:ring-primary/20
            ${error 
              ? 'border-red-500 focus:border-red-500 shake-animation' 
              : 'border-border focus:border-primary'
            }
          `}
        />

        {/* Botão de mostrar/ocultar */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          disabled={isLoading}
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      {/* Indicador de força da senha */}
      {value.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2 flex items-center gap-2"
        >
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(strength.level / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
              className={`h-full ${strength.color}`}
            />
          </div>
          <span className="text-xs text-muted-foreground">{strength.label}</span>
        </motion.div>
      )}

      {/* Mensagem de erro */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 flex items-center gap-2 text-red-500 text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center rounded-xl">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </motion.div>
  );
}
