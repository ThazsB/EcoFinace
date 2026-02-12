import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Profile } from '@/types';
import { Trash2, MoreVertical } from 'lucide-react';

interface ProfileCardProps {
  profile: Profile;
  isSelected: boolean;
  isLastAccess?: boolean;
  onClick: () => void;
  onDelete: (profileId: string) => void;
}

export function ProfileCard({
  profile,
  isSelected,
  isLastAccess,
  onClick,
  onDelete,
}: ProfileCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onDelete(profile.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{
        opacity: 1,
        scale: isSelected ? 1.02 : 1,
        y: 0,
      }}
      whileHover={{
        scale: isSelected ? 1.02 : 1.04,
        y: -4,
        boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.3)',
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      transition={{
        type: 'spring',
        stiffness: 350,
        damping: 20,
        mass: 0.8,
      }}
      className={`
        group relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ease-out
        ${
          isSelected
            ? 'border-primary bg-primary/10 shadow-lg ring-4 ring-primary/15'
            : 'border-border/60 bg-card/80 hover:border-primary/40 hover:bg-card hover:shadow-lg'
        }
      `}
      style={
        {
          '--tw-ring-color': profile.color,
        } as React.CSSProperties
      }
    >
      {/* Botão de menu de contexto - canto superior direito */}
      <div className="absolute top-3 right-3 z-10">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className={`
            p-2.5 rounded-full hover:bg-muted/80 transition-all duration-200 backdrop-blur-sm
            ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
          `}
        >
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </motion.button>

        {/* Menu dropdown */}
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="absolute right-0 top-12 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl py-1.5 min-w-[150px] z-20 overflow-hidden"
          >
            <motion.button
              whileHover={{ backgroundColor: 'rgba(244, 63, 94, 0.1)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDeleteClick}
              className="w-full px-4 py-3 text-left text-sm font-medium text-foreground flex items-center gap-3 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-500" />
              </div>
              Excluir perfil
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Conteúdo do card */}
      <div className="flex flex-col items-center">
        {/* Avatar */}
        <motion.div
          className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-4xl shadow-inner"
          style={{
            backgroundColor: `${profile.color}25`,
            boxShadow: `0 4px 20px -8px ${profile.color}40`,
          }}
          animate={
            isSelected
              ? {
                  scale: [1, 1.08, 1.04, 1],
                  boxShadow: [
                    `0 4px 20px -8px ${profile.color}40`,
                    `0 8px 30px -8px ${profile.color}60`,
                    `0 4px 20px -8px ${profile.color}40`,
                  ],
                }
              : {}
          }
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {profile.avatar.startsWith('data:image/') ? (
            <img src={profile.avatar} alt="" className="w-full h-full object-cover rounded-full" />
          ) : (
            profile.avatar
          )}
        </motion.div>

        {/* Indicador de último acesso - posicionado antes do nome */}
        {isLastAccess && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="bg-primary/20 text-primary text-xs px-3 py-1 rounded-full mb-2.5 font-medium"
          >
            Último acesso
          </motion.div>
        )}

        {/* Nome */}
        <motion.p
          className={`text-lg font-semibold text-center ${isSelected ? 'text-primary' : ''}`}
          animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          {profile.name}
        </motion.p>

        {/* Indicador de seleção */}
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="flex justify-center mt-3"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2.5 h-2.5 rounded-full bg-primary shadow-lg shadow-primary/50"
            />
          </motion.div>
        )}
      </div>

      {/* Efeito de brilho ao hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
      </motion.div>

      {/* Click overlay para fechar menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-[5]"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(false);
          }}
        />
      )}
    </motion.div>
  );
}
