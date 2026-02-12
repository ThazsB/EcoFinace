/**
 * CategoryIconSelector - Componente de seleção de ícones para categorias do Fins
 */

import React, { useState, useRef, useEffect } from 'react';
import { CATEGORY_ICONS } from '@/types/categories';
import { Search, X } from 'lucide-react';

interface CategoryIconSelectorProps {
  selectedIcon: string;
  onSelect: (icon: string) => void;
}

export const CategoryIconSelector: React.FC<CategoryIconSelectorProps> = ({
  selectedIcon,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Filtrar ícones pela busca
  const filteredIcons = CATEGORY_ICONS.filter(
    (icon) =>
      icon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      icon.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Encontrar ícone selecionado
  const selectedIconData = CATEGORY_ICONS.find((icon) => icon.id === selectedIcon);
  const SelectedIconComponent = selectedIconData?.component;

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  return (
    <div className="relative" ref={pickerRef}>
      {/* Botão de seleção */}
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg hover:bg-accent transition-colors w-full justify-between"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${selectedIconData?.color || '#6366f1'}20` }}
          >
            {selectedIconData ? (
              <selectedIconData.component size={18} className="text-current" />
            ) : (
              <span className="text-sm">?</span>
            )}
          </div>
          <span className="text-sm">{selectedIconData?.name || 'Selecionar ícone'}</span>
        </div>
      </button>

      {/* Picker dropdown */}
      {showPicker && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <input
                type="text"
                placeholder="Buscar ícone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-accent rounded"
                >
                  <X size={14} className="text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Grid de ícones */}
          <div className="p-3 max-h-64 overflow-y-auto">
            <div className="grid grid-cols-5 gap-2">
              {filteredIcons.map((icon) => {
                const IconComponent = icon.component;
                const isSelected = selectedIcon === icon.id;
                return (
                  <button
                    key={icon.id}
                    type="button"
                    onClick={() => {
                      onSelect(icon.id);
                      setShowPicker(false);
                    }}
                    className={`w-full aspect-square flex items-center justify-center rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-primary/20 text-primary ring-2 ring-primary'
                        : 'hover:bg-accent'
                    }`}
                    title={icon.name}
                  >
                    <IconComponent size={20} className="lucide-icon" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              {filteredIcons.length} ícone(s) encontrado(s)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryIconSelector;
