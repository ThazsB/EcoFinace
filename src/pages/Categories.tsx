/**
 * Página de Gerenciamento de Categorias
 * Permite criar, editar, excluir e organizar categorias personalizadas
 */

import { useState } from 'react'
import { CategoriesManager } from '@/components/categories'

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gerenciar Categorias
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Organize suas categorias de transações, orçamentos e metas
          </p>
        </div>
        
        <CategoriesManager />
      </div>
    </div>
  )
}
