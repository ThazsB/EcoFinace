/**
 * CategoryColorPicker - Componente de seleção de cores para categorias do Fins
 */

import React, { useState } from 'react';
import { CATEGORY_COLORS } from '@/types/categories';
import { Palette } from 'lucide-react';

interface CategoryColorPickerProps {
  selectedColor: string;
  onSelect: (color: string) => void;
}

export const CategoryColorPicker: React.FC<CategoryColorPickerProps> = ({
  selectedColor,
  onSelect,
}) => {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customColor, setCustomColor] = useState(selectedColor);

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    onSelect(color);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {CATEGORY_COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => {
              onSelect(color.value);
              setShowCustomPicker(false);
            }}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              selectedColor === color.value
                ? 'border-foreground scale-110'
                : 'border-transparent hover:scale-105'
            }`}
            style={{
              backgroundColor: color.value,
              boxShadow: selectedColor === color.value ? `0 0 0 2px ${color.value}40` : 'none',
            }}
            title={color.name}
            aria-label={`Selecionar cor ${color.name}`}
          />
        ))}
      </div>

      {/* Botão de cor personalizada */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowCustomPicker(!showCustomPicker)}
          className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-sm"
        >
          <Palette size={16} />
          <span>Cor Personalizada</span>
        </button>
      </div>

      {/* Input de cor personalizada */}
      {showCustomPicker && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <input
            type="color"
            value={customColor}
            onChange={handleCustomColorChange}
            className="w-12 h-12 rounded cursor-pointer border border-border"
          />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Selecione uma cor</p>
            <p className="text-sm font-mono">{customColor.toUpperCase()}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryColorPicker;
