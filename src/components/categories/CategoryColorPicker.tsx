/**
 * CategoryColorPicker - Componente de seleção de cores para categorias do Fins
 */

import React from 'react';
import { CATEGORY_COLORS } from '@/types/categories';

interface CategoryColorPickerProps {
  selectedColor: string;
  onSelect: (color: string) => void;
}

export const CategoryColorPicker: React.FC<CategoryColorPickerProps> = ({
  selectedColor,
  onSelect,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_COLORS.map((color) => (
        <button
          key={color.value}
          onClick={() => onSelect(color.value)}
          className={`w-8 h-8 rounded-full border-2 transition-all ${
            selectedColor === color.value
              ? 'border-foreground scale-110'
              : 'border-transparent hover:scale-105'
          }`}
          style={{ 
            backgroundColor: color.value,
            boxShadow: selectedColor === color.value ? `0 0 0 2px ${color.value}40` : 'none'
          }}
          title={color.name}
          aria-label={`Selecionar cor ${color.name}`}
        />
      ))}
    </div>
  );
};

export default CategoryColorPicker;
