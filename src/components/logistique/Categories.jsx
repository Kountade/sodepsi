// src/components/stock/Categories.jsx
// ============================================================
// VERSION COMPLÈTE CORRIGÉE - Compatible pagination DRF
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, FolderTree, Package,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter,
  ChevronLeft, ChevronRight, Grid3x3, List,
  ChevronDown, ChevronRight as ChevronRightIcon,
  Archive, Layers,
} from 'lucide-react';

// ============================================================
// ✅ ERROR BOUNDARY
// ============================================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ ErrorBoundary Categories:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-4 text-error">
              <AlertCircle className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Erreur dans la liste des catégories</h2>
            </div>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-64 text-red-600">
              {this.state.error?.toString()}
            </pre>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary"
              >
                Recharger
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="btn btn-ghost"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const CategoriesContent = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [expandedCategories, setExpandedCategories] = useState({});
  const [viewMode, setViewMode] = useState('list');
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // ✅ Stats globales
  const [stats, setStats] = useState({
    total: 0,
    actives: 0,
    inactives: 0,
    withSubcategories: 0,
  });

  const getToken = () => localStorage.getItem('Token');

  // ============================================================
  // ✅ NOTIFICATION
  // ============================================================
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 4000);
  }, []);

  // ============================================================
  // ✅ NORMALISATION DES RÉPONSES
  // ============================================================
  const normalizeData = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  };

  const getPaginatedInfo = (data) => {
    if (Array.isArray(data)) {
      return { results: data, count: data.length };
    }
    if (data && typeof data === 'object') {
      return {
        results: Array.isArray(data.results) ? data.results : [],
        count: typeof data.count === 'number' ? data.count : 0,
      };
    }
    return { results: [], count: 0 };
  };

  // ============================================================
  // ✅ CHARGEMENT DES CATÉGORIES (avec pagination serveur)
  // ============================================================
  const fetchCategories = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const params = new URLSearchParams();
      params.append('page', page);
      params.append('page_size', itemsPerPage);

      if (statusFilter === 'active') params.append('active', 'true');
      if (statusFilter === 'inactive') params.append('active', 'false');
      if (searchTerm) params.append('search', searchTerm);

      const url = `/categories/?${params.toString()}`;
      console.log('🔍 fetchCategories:', url);

      const response = await AxiosInstance.get(url, {
        headers: { 'Authorization': `Token ${token}` }
      });

      const data = response.data;
      console.log('✅ Réponse API categories:', data);

      const { results, count } = getPaginatedInfo(data);

      setCategories(results);
      setTotalCount(count);
      setTotalPages(count > 0 ? Math.ceil(count / itemsPerPage) : 1);
      setIsFirstLoad(false);

    } catch (error) {
      console.error('❌ Erreur fetchCategories:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => {
          localStorage.removeItem('Token');
          localStorage.removeItem('User');
          navigate('/login');
        }, 2000);
      } else {
        showNotification('Erreur de chargement des catégories', 'error');
      }
      setCategories([]);
      setTotalCount(0);
      setTotalPages(1);
      setIsFirstLoad(false);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, itemsPerPage, navigate, showNotification]);

  // ============================================================
  // ✅ CHARGEMENT DES STATS (basé sur toute la base)
  // ============================================================
  const fetchStats = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      // Récupérer les stats via comptages
      const [allRes, activeRes, inactiveRes] = await Promise.all([
        AxiosInstance.get('/categories/?page_size=1', {
          headers: { 'Authorization': `Token ${token}` }
        }).catch(() => ({ data: { count: 0 } })),
        AxiosInstance.get('/categories/?active=true&page_size=1', {
          headers: { 'Authorization': `Token ${token}` }
        }).catch(() => ({ data: { count: 0 } })),
        AxiosInstance.get('/categories/?active=false&page_size=1', {
          headers: { 'Authorization': `Token ${token}` }
        }).catch(() => ({ data: { count: 0 } })),
      ]);

      const getCount = (res) => {
        const d = res.data;
        if (Array.isArray(d)) return d.length;
        return d.count || 0;
      };

      const total = getCount(allRes);
      const actives = getCount(activeRes);
      const inactives = getCount(inactiveRes);

      setStats({
        total,
        actives,
        inactives,
        withSubcategories: 0, // Calculé différemment
      });

    } catch (error) {
      console.error('❌ Erreur fetchStats:', error);
    }
  }, []);

  // ============================================================
  // EFFETS
  // ============================================================
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    setCurrentPage(1);
    fetchCategories(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchTerm, itemsPerPage]);

  useEffect(() => {
    if (currentPage > 1 || isFirstLoad === false) {
      fetchCategories(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/categories/${categoryToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Catégorie supprimée avec succès', 'success');
      fetchCategories(currentPage);
      fetchStats();
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        navigate('/login');
      } else {
        showNotification('Erreur lors de la suppression', 'error');
      }
    }
  };

  // ============================================================
  // TOGGLE ACTIVE
  // ============================================================
  const toggleActive = async (category) => {
    try {
      const token = getToken();
      await AxiosInstance.patch(
        `/categories/${category.id}/`,
        { is_active: !category.is_active },
        { headers: { 'Authorization': `Token ${token}` } }
      );
      showNotification(
        category.is_active ? 'Catégorie désactivée' : 'Catégorie activée',
        'success'
      );
      fetchCategories(currentPage);
      fetchStats();
    } catch (error) {
      console.error('❌ Erreur modification:', error);
      showNotification('Erreur lors de la modification', 'error');
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================
  const getSubCategories = useCallback((parentId) => {
    return categories.filter(cat => cat.parent === parentId);
  }, [categories]);

  const toggleExpand = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // ============================================================
  // ✅ RENDER RECURSIF DE L'ARBRE (corrigé)
  // ============================================================
  const renderCategoryRow = (category, level = 0) => {
    const subCats = getSubCategories(category.id);
    const hasChildren = subCats.length > 0;

    return (
      <React.Fragment key={category.id}>
        <tr className="hover:bg-gray-50 transition-colors group">
          <td className="px-4 py-3">
            <div
              className="flex items-center gap-2"
              style={{ marginLeft: level * 24 }}
            >
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(category.id)}
                  className="btn btn-ghost btn-xs btn-circle"
                >
                  {expandedCategories[category.id] ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <div className="w-6" />
              )}
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <FolderTree className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{category.name}</p>
                <p className="text-xs text-gray-500">{category.code}</p>
              </div>
            </div>
          </td>
          <td className="px-4 py-3 hidden md:table-cell">
            <div className="flex items-center gap-1 text-sm">
              <Package className="w-3 h-3 text-gray-400" />
              <span>{category.products_count || 0} produits</span>
            </div>
          </td>
          <td className="px-4 py-3 hidden lg:table-cell">
            <div className="flex items-center gap-1 text-sm">
              <Layers className="w-3 h-3 text-gray-400" />
              <span>{subCats.length} sous-catégories</span>
            </div>
          </td>
          <td className="px-4 py-3">
            {category.description ? (
              <span className="text-sm text-gray-600 truncate max-w-[150px] block">
                {category.description}
              </span>
            ) : (
              <span className="text-sm text-gray-400 italic">Aucune description</span>
            )}
          </td>
          <td className="px-4 py-3 text-center">
            <span className={`badge ${category.is_active ? 'badge-success' : 'badge-error'}`}>
              {category.is_active ? 'Actif' : 'Inactif'}
            </span>
          </td>
          <td className="px-4 py-3 text-center">
            <div className="flex justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => navigate(`/categories/${category.id}`)}
                className="btn btn-ghost btn-sm btn-circle"
                title="Détails"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate(`/categories/${category.id}/modifier`)}
                className="btn btn-ghost btn-sm btn-circle"
                title="Modifier"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleActive(category)}
                className="btn btn-ghost btn-sm btn-circle"
                title={category.is_active ? 'Désactiver' : 'Activer'}
              >
                <Archive className={`w-4 h-4 ${category.is_active ? 'text-warning' : 'text-success'}`} />
              </button>
              <button
                onClick={() => {
                  setCategoryToDelete(category);
                  setShowDeleteModal(true);
                }}
                className="btn btn-ghost btn-sm btn-circle text-error"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>

        {expandedCategories[category.id] &&
          subCats.map(subCat => renderCategoryRow(subCat, level + 1))}
      </React.Fragment>
    );
  };

  // ✅ Rendu de toutes les catégories (racines uniquement)
  const renderCategoryTree = () => {
    // ✅ Récupérer UNIQUEMENT les catégories racines (parent = null)
    const rootCategories = categories.filter(cat => !cat.parent);

    if (rootCategories.length === 0) {
      return (
        <tr>
          <td colSpan="6" className="text-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                <FolderTree className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Aucune catégorie trouvée</p>
              <button
                onClick={() => navigate('/categories/nouveau')}
                className="btn btn-primary btn-sm gap-2 mt-2"
              >
                <Plus className="w-4 h-4" /> Ajouter une catégorie
              </button>
            </div>
          </td>
        </tr>
      );
    }

    return rootCategories.map(cat => renderCategoryRow(cat, 0));
  };

  // ============================================================
  // PAGINATION
  // ============================================================
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  // ============================================================
  // RENDU
  // ============================================================
  if (loading && isFirstLoad) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">
            Chargement des catégories...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success'
                ? <CheckCircle className="w-4 h-4" />
                : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => setNotification({ ...notification, show: false })}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {showDeleteModal && categoryToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer cette catégorie ?</p>
              <p className="font-semibold text-error mt-2">{categoryToDelete.name}</p>
              {getSubCategories(categoryToDelete.id).length > 0 && (
                <p className="text-warning text-sm mt-2">
                  ⚠️ {getSubCategories(categoryToDelete.id).length} sous-catégorie(s)
                </p>
              )}
              {categoryToDelete.products_count > 0 && (
                <p className="text-warning text-sm mt-1">
                  ⚠️ {categoryToDelete.products_count} produit(s)
                </p>
              )}
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button
                className="btn btn-ghost flex-1"
                onClick={() => setShowDeleteModal(false)}
              >
                Annuler
              </button>
              <button className="btn btn-error flex-1 gap-2" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <FolderTree className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Catégories</h1>
              {loading && !isFirstLoad && (
                <RefreshCw className="w-5 h-5 text-primary animate-spin ml-2" />
              )}
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Gérez vos catégories – {totalCount.toLocaleString('fr-FR')} catégorie(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => fetchCategories(currentPage)}
              className="btn btn-sm sm:btn-md btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={() => navigate('/categories/nouveau')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle catégorie
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold text-primary">{stats.total}</p>
            </div>
            <FolderTree className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Actives</p>
              <p className="text-xl font-bold text-success">{stats.actives}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Inactives</p>
              <p className="text-xl font-bold text-error">{stats.inactives}</p>
            </div>
            <Archive className="w-8 h-8 text-error/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Sous-catégories</p>
              <p className="text-xl font-bold text-secondary">
                {categories.reduce((sum, c) => sum + getSubCategories(c.id).length, 0)}
              </p>
            </div>
            <Layers className="w-8 h-8 text-secondary/20" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, code, description..."
              className="input input-bordered w-full pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline btn-sm sm:hidden gap-2"
          >
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer' : 'Filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-3 gap-3`}>
            <select
              className="select select-bordered w-full"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actives</option>
              <option value="inactive">Inactives</option>
            </select>
            <div className="flex gap-2">
              <button
                className="btn btn-outline gap-2 flex-1"
                onClick={() => {
                  setStatusFilter('all');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
              >
                <RefreshCw className="w-4 h-4" /> Réinitialiser
              </button>
              <div className="join">
                <button
                  onClick={() => setViewMode('list')}
                  className={`join-item btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`join-item btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3">Catégorie</th>
                  <th className="py-3 hidden md:table-cell">Produits</th>
                  <th className="py-3 hidden lg:table-cell">Sous-catégories</th>
                  <th className="py-3">Description</th>
                  <th className="py-3 text-center">Statut</th>
                  <th className="py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && !isFirstLoad ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse">
                      <td className="px-4 py-3">
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="h-4 w-20 bg-gray-200 rounded"></div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="h-4 w-20 bg-gray-200 rounded"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-40 bg-gray-200 rounded"></div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="h-6 w-16 bg-gray-200 rounded mx-auto"></div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="h-8 w-32 bg-gray-200 rounded mx-auto"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  renderCategoryTree()
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {categories.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <FolderTree className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucune catégorie trouvée</p>
              </div>
            ) : (
              categories.map(category => (
                <div
                  key={category.id}
                  className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200"
                >
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <FolderTree className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{category.name}</h3>
                          <p className="text-xs text-gray-500">{category.code}</p>
                        </div>
                      </div>
                      <span className={`badge ${category.is_active ? 'badge-success' : 'badge-error'}`}>
                        {category.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {category.description || 'Aucune description'}
                    </p>

                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                      <div className="flex gap-3">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Sous-cat.</p>
                          <p className="font-semibold text-sm">
                            {getSubCategories(category.id).length}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Produits</p>
                          <p className="font-semibold text-sm">
                            {category.products_count || 0}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => navigate(`/categories/${category.id}`)}
                          className="btn btn-ghost btn-sm btn-circle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/categories/${category.id}/modifier`)}
                          className="btn btn-ghost btn-sm btn-circle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setCategoryToDelete(category);
                            setShowDeleteModal(true);
                          }}
                          className="btn btn-ghost btn-sm btn-circle text-error"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ✅ Pagination serveur */}
        {totalCount > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Affichage de{' '}
              <span className="font-semibold text-primary">
                {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}
              </span>{' '}
              à{' '}
              <span className="font-semibold text-primary">
                {Math.min(currentPage * itemsPerPage, totalCount)}
              </span>{' '}
              sur <span className="font-semibold">{totalCount}</span> catégories
            </div>
            <div className="flex items-center gap-3">
              <select
                className="select select-bordered select-sm"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="10">10 lignes</option>
                <option value="20">20 lignes</option>
                <option value="50">50 lignes</option>
                <option value="100">100 lignes</option>
              </select>
              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1 || loading}
                >
                  «
                </button>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="join-item btn btn-sm btn-disabled">
                  Page {currentPage} / {Math.max(totalPages, 1)}
                </span>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || loading}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage >= totalPages || loading}
                >
                  »
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// WRAPPER avec ErrorBoundary
// ============================================================
const Categories = () => (
  <ErrorBoundary>
    <CategoriesContent />
  </ErrorBoundary>
);

export default Categories;