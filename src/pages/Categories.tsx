/**
 * Página de Gerenciamento de Categorias
 * Permite criar, editar, excluir e organizar categorias personalizadas
 */

import { useState } from 'react';
import { CategoriesManager } from '@/components/categories';

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-primary/5 to-primary/10">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12 text-center">
          <h1 className="text-6xl font-bold text-primary">Gerenciar Categorias</h1>
        </div>

        <CategoriesManager />
      </div>
    </div>
  );
}
