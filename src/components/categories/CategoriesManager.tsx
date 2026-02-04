/**
 * CategoriesManager - Componente de gerenciamento de categorias do Fins
 * Interface completa para criar, editar, excluir e organizar categorias
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Star, 
  Edit2, 
  Trash2, 
  GripVertical,
  X,
  Check,
  AlertTriangle,
  Folder,
  ArrowUpDown,
  LayoutGrid,
  List,
  Settings
} from 'lucide-react';
import { useCategoriesStore, useFilteredCategories } from '@/stores/categoriesStore';
import { useToast } from '@/components/notifications';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CategoryColorPicker } from './CategoryColorPicker';
import { CategoryIconSelector } from './CategoryIconSelector';
import type { Category, CategoryType, CategoryColor } from '@/types/categories';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/types/categories';

// Tipos de ordenação
type SortOption = 'name' | 'usage' | 'type' | 'custom';

export const CategoriesManager: React.FC = () => {
  const { 
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    duplicateCategory,
    toggleFavorite,
    reorderCategories,
    setSortBy,
    setSearchQuery,
    clearFilters,
    validateCategory,
    init,
    getSystemCategories,
    getCustomCategories,
  } = useCategoriesStore();

  const filteredCategories = useFilteredCategories();
  const { showToast } = useToast();

  // Estados locais
  const [searchQuery, setLocalSearchQuery] = useState('');
  const [sortBy, setLocalSortBy] = useState<SortOption>('custom');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showSystemOnly, setShowSystemOnly] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [migrateTo, setMigrateTo] = useState<string>('Outros');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as CategoryType,
    icon: 'tag',
    color: CATEGORY_COLORS[0].value,
    isFavorite: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Inicializar categorias
  React.useEffect(() => {
    const profileId = localStorage.getItem('fins_active_profile') || 'default';
    init(profileId);
  }, [init]);

  // Atualizar store quando o estado local mudar
  React.useEffect(() => {
    setSearchQuery(searchQuery);
  }, [searchQuery, setSearchQuery]);

  React.useEffect(() => {
    setSortBy(sortBy);
  }, [sortBy, setSortBy]);

  // Filtrar categorias
  const displayedCategories = useMemo(() => {
    let result = [...categories];

    // Aplicar busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(query));
    }

    // Aplicar filtros
    if (filterType !== 'all') {
      result = result.filter(c => c.type === filterType);
    }
    if (showFavoritesOnly) {
      result = result.filter(c => c.isFavorite);
    }
    if (showSystemOnly) {
      result = result.filter(c => c.isSystem);
    }

    // Aplicar ordenação
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'usage':
        result.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case 'type':
        result.sort((a, b) => a.type.localeCompare(b.type));
        break;
      case 'custom':
      default:
        // Manter ordem atual
        break;
    }

    return result;
  }, [categories, searchQuery, filterType, showFavoritesOnly, showSystemOnly, sortBy]);

  // Abrir modal de criação
  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      name: '',
      type: 'expense',
      icon: 'tag',
      color: CATEGORY_COLORS[0].value,
      isFavorite: false,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Abrir modal de edição
  const handleOpenEdit = (category: Category) => {
    setModalMode('edit');
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color,
      isFavorite: category.isFavorite,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Confirmar exclusão
  const handleOpenDelete = (category: Category) => {
    setCategoryToDelete(category);
    setMigrateTo('Outros');
    setDeleteConfirmOpen(true);
  };

  // Salvar categoria
  const handleSave = async () => {
    // Validar
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'O nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'O nome deve ter pelo menos 2 caracteres';
    } else if (formData.name.trim().length > 30) {
      errors.name = 'O nome deve ter no máximo 30 caracteres';
    }

    // Verificar duplicata
    const existing = categories.find(
      c => c.name.toLowerCase() === formData.name.toLowerCase() && c.id !== editingCategory?.id
    );
    if (existing) {
      errors.name = `Já existe uma categoria chamada "${existing.name}"`;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (modalMode === 'create') {
      const result = await addCategory(formData);
      if (result.success) {
        showToast({
          title: 'Categoria criada',
          message: `A categoria "${formData.name}" foi criada com sucesso`,
          type: 'success',
        });
        setIsModalOpen(false);
      } else {
        showToast({
          title: 'Erro',
          message: result.error || 'Não foi possível criar a categoria',
          type: 'error',
        });
      }
    } else if (editingCategory) {
      const result = await updateCategory(editingCategory.id, formData);
      if (result.success) {
        showToast({
          title: 'Categoria atualizada',
          message: `A categoria foi atualizada com sucesso`,
          type: 'success',
        });
        setIsModalOpen(false);
      } else {
        showToast({
          title: 'Erro',
          message: result.error || 'Não foi possível atualizar a categoria',
          type: 'error',
        });
      }
    }
  };

  // Excluir categoria
  const handleDelete = async () => {
    if (!categoryToDelete) return;

    const result = await deleteCategory(categoryToDelete.id, migrateTo);
    if (result.success) {
      showToast({
        title: 'Categoria excluída',
        message: result.message,
        type: 'success',
      });
    } else {
      showToast({
        title: 'Erro',
        message: result.message,
        type: 'error',
      });
    }
    setDeleteConfirmOpen(false);
    setCategoryToDelete(null);
  };

  // Duplicar categoria
  const handleDuplicate = async (category: Category) => {
    const result = await duplicateCategory(category.id);
    if (result.success) {
      showToast({
        title: 'Categoria duplicada',
        message: `Uma cópia de "${category.name}" foi criada`,
        type: 'success',
      });
    } else {
      showToast({
        title: 'Erro',
        message: result.error || 'Não foi possível duplicar a categoria',
        type: 'error',
      });
    }
  };

  // Renderizar ícone da categoria
  const renderCategoryIcon = (iconId: string, color: string, size: number = 20) => {
    const iconData = CATEGORY_ICONS.find(i => i.id === iconId);
    const IconComponent = iconData?.component;
    
    return (
      <div 
        className="flex items-center justify-center rounded-full"
        style={{ 
          width: size + 16, 
          height: size + 16, 
          backgroundColor: `${color}20` 
        }}
      >
        {IconComponent ? (
          <IconComponent 
            size={size} 
            style={{ color }} 
            className="lucide-icon"
          />
        ) : (
          // Fallback se ícone não encontrado
          <span className="text-sm" style={{ color }}>?</span>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 bg-card rounded-xl shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Categorias</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie suas categorias de transações
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          Nova Categoria
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Buscar categorias..."
            value={searchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border border-border rounded-lg transition-colors ${
              showFilters ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-accent'
            }`}
          >
            <Filter size={20} />
            <span className="hidden md:inline">Filtrar</span>
          </button>
          <select
            value={sortBy}
            onChange={(e) => setLocalSortBy(e.target.value as SortOption)}
            className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="custom">Ordem Personalizada</option>
            <option value="name">Nome (A-Z)</option>
            <option value="usage">Mais Usadas</option>
            <option value="type">Tipo</option>
          </select>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 bg-accent/50 rounded-lg mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tipo</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    filterType === 'all' ? 'bg-primary text-primary-foreground' : 'bg-background'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterType('income')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    filterType === 'income' ? 'bg-primary text-primary-foreground' : 'bg-background'
                  }`}
                >
                  Receitas
                </button>
                <button
                  onClick={() => setFilterType('expense')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    filterType === 'expense' ? 'bg-primary text-primary-foreground' : 'bg-background'
                  }`}
                >
                  Despesas
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFavoritesOnly}
                  onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                  className="rounded border-border"
                />
                <Star size={16} />
                <span>Apenas Favoritas</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSystemOnly}
                  onChange={(e) => setShowSystemOnly(e.target.checked)}
                  className="rounded border-border"
                />
                <span>Apenas Sistema</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedCategories.map((category) => (
          <div
            key={category.id}
            className="flex items-center gap-3 p-4 bg-background border border-border rounded-lg hover:shadow-md transition-shadow"
          >
            {/* Icon */}
            {renderCategoryIcon(category.icon, category.color)}
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{category.name}</h3>
                {category.isFavorite && <Star size={14} className="text-yellow-500 fill-yellow-500" />}
                {category.isSystem && (
                  <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded">
                    Sistema
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {category.type === 'income' ? 'Receita' : category.type === 'expense' ? 'Despesa' : 'Transferência'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {!category.isSystem && (
                <>
                  <button
                    onClick={() => toggleFavorite(category.id)}
                    className="p-2 hover:bg-accent rounded-lg transition-colors"
                    title={category.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    <Star 
                      size={18} 
                      className={category.isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'} 
                    />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(category)}
                    className="p-2 hover:bg-accent rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={18} className="text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(category)}
                    className="p-2 hover:bg-accent rounded-lg transition-colors"
                    title="Duplicar"
                  >
                    <Folder size={18} className="text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleOpenDelete(category)}
                    className="p-2 hover:bg-accent rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={18} className="text-muted-foreground" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {displayedCategories.length === 0 && (
        <div className="text-center py-12">
          <Folder size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma categoria encontrada</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'Tente uma busca diferente' : 'Crie sua primeira categoria personalizada'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Criar Categoria
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold">
                {modalMode === 'create' ? 'Nova Categoria' : 'Editar Categoria'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            {/* Form */}
            <div className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Alimentação"
                  className={`w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 ${
                    formErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-border focus:ring-primary'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Tipo *</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.type === 'expense'
                        ? 'bg-red-500/20 text-red-600 border-2 border-red-500'
                        : 'bg-background border-2 border-border hover:border-red-300'
                    }`}
                  >
                    Despesa
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.type === 'income'
                        ? 'bg-green-500/20 text-green-600 border-2 border-green-500'
                        : 'bg-background border-2 border-border hover:border-green-300'
                    }`}
                  >
                    Receita
                  </button>
                </div>
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium mb-2">Ícone</label>
                <CategoryIconSelector
                  selectedIcon={formData.icon}
                  onSelect={(icon: string) => setFormData({ ...formData, icon })}
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium mb-2">Cor</label>
                <CategoryColorPicker
                  selectedColor={formData.color}
                  onSelect={(color: string) => setFormData({ ...formData, color })}
                />
              </div>

              {/* Favorite */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFavorite}
                  onChange={(e) => setFormData({ ...formData, isFavorite: e.target.checked })}
                  className="rounded border-border"
                />
                <Star size={16} className={formData.isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'} />
                <span>Adicionar aos favoritos</span>
              </label>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-background border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {modalMode === 'create' ? 'Criar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Categoria"
        confirmText="Excluir"
        cancelText="Cancelar"
        isDestructive
      >
        {categoryToDelete && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <AlertTriangle size={24} className="text-yellow-600" />
              <p className="text-sm">
                Tem certeza que deseja excluir a categoria "{categoryToDelete.name}"?
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Migrar transações para:
              </label>
              <select
                value={migrateTo}
                onChange={(e) => setMigrateTo(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Outros">Outros</option>
                {categories
                  .filter(c => c.id !== categoryToDelete.id && !c.isSystem)
                  .map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
              </select>
            </div>

            <p className="text-sm text-muted-foreground">
              As transações existentes serão migradas para a categoria selecionada.
            </p>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
};

export default CategoriesManager;
