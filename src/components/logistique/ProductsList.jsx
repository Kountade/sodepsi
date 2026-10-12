// src/components/stock/ProductsList.jsx
// ============================================================
// VERSION COMPLÈTE OPTIMISÉE - Pagination serveur + Recherche
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, Package,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter,
  ChevronLeft, ChevronRight, Grid3x3, List,
  Archive, AlertTriangle,
  Clock
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
    console.error('❌ ErrorBoundary ProductsList:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-4 text-error">
              <AlertCircle className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Erreur dans la liste des produits</h2>
            </div>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-64 text-red-600">
              {this.state.error?.toString()}
            </pre>
            <div className="mt-6 flex gap-3">
              <button onClick={() => window.location.reload()} className="btn btn-primary">
                Recharger
              </button>
              <button onClick={() => window.location.href = '/dashboard'} className="btn btn-ghost">
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
const ProductsListContent = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [viewMode, setViewMode] = useState('list');
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // ✅ Stats récupérées du backend
  const [stats, setStats] = useState({
    total: 0,
    actifs: 0,
    inactifs: 0,
    rupture: 0,
    stockFaible: 0
  });

  // ============================================================
  // UTILITAIRES
  // ============================================================
  const showNotification = useCallback((message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  }, []);

  const getToken = () => localStorage.getItem('Token');

  // ✅ Normalisation des réponses API
  const normalizeData = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  };

  const getPaginatedInfo = (data) => {
    if (Array.isArray(data)) {
      return { results: data, count: data.length, hasMore: false };
    }
    if (data && typeof data === 'object') {
      return {
        results: Array.isArray(data.results) ? data.results : [],
        count: data.count || 0,
        hasMore: !!data.next
      };
    }
    return { results: [], count: 0, hasMore: false };
  };

  // ============================================================
  // ✅ CHARGEMENT DES PRODUITS (pagination serveur)
  // ============================================================
  const fetchProducts = useCallback(async (page = 1) => {
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

      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const url = `/products/?${params.toString()}`;
      console.log('🔍 fetchProducts:', url);

      const response = await AxiosInstance.get(url, {
        headers: { 'Authorization': `Token ${token}` }
      });

      const data = response.data;
      console.log('✅ Réponse API:', data);

      const { results, count, hasMore } = getPaginatedInfo(data);

      setProducts(results);
      setTotalCount(count);
      setTotalPages(count > 0 ? Math.ceil(count / itemsPerPage) : 1);

      setIsFirstLoad(false);

    } catch (error) {
      console.error('❌ Erreur fetchProducts:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
      setProducts([]);
      setTotalCount(0);
      setTotalPages(1);
      setIsFirstLoad(false);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter, searchTerm, itemsPerPage, navigate, showNotification]);

  // ============================================================
  // ✅ CHARGEMENT DES CATÉGORIES
  // ============================================================
  const fetchCategories = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await AxiosInstance.get('/categories/?active=true', {
        headers: { 'Authorization': `Token ${token}` }
      });

      setCategories(normalizeData(response.data));
    } catch (error) {
      console.error('❌ Erreur chargement catégories:', error);
      setCategories([]);
    }
  }, []);

  // ============================================================
  // ✅ CHARGEMENT DES STATS (depuis le backend)
  // ============================================================
  const fetchStats = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      // Compter par statut via l'API (annotations SQL)
      const [allRes, activeRes, inactiveRes, outOfStockRes, lowStockRes] = await Promise.all([
        AxiosInstance.get('/products/?page_size=1', {
          headers: { 'Authorization': `Token ${token}` }
        }).catch(() => ({ data: { count: 0 } })),
        AxiosInstance.get('/products/?status=active&page_size=1', {
          headers: { 'Authorization': `Token ${token}` }
        }).catch(() => ({ data: { count: 0 } })),
        AxiosInstance.get('/products/?status=inactive&page_size=1', {
          headers: { 'Authorization': `Token ${token}` }
        }).catch(() => ({ data: { count: 0 } })),
        AxiosInstance.get('/products/?status=out_of_stock&page_size=1', {
          headers: { 'Authorization': `Token ${token}` }
        }).catch(() => ({ data: { count: 0 } })),
        AxiosInstance.get('/products/?low_stock=true&page_size=1', {
          headers: { 'Authorization': `Token ${token}` }
        }).catch(() => ({ data: { count: 0 } })),
      ]);

      const getCount = (res) => {
        const d = res.data;
        if (Array.isArray(d)) return d.length;
        return d.count || 0;
      };

      setStats({
        total: getCount(allRes),
        actifs: getCount(activeRes),
        inactifs: getCount(inactiveRes),
        rupture: getCount(outOfStockRes),
        stockFaible: getCount(lowStockRes),
      });

    } catch (error) {
      console.error('❌ Erreur chargement stats:', error);
    }
  }, []);

  // ============================================================
  // ✅ EFFET DE CHARGEMENT
  // ============================================================
  useEffect(() => {
    fetchCategories();
    fetchStats();
  }, [fetchCategories, fetchStats]);

  // Recharger les produits quand un filtre change
  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, statusFilter, searchTerm, itemsPerPage]);

  // Recharger quand la page change
  useEffect(() => {
    fetchProducts(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/products/${productToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Produit supprimé', 'success');
      fetchProducts(currentPage);
      fetchStats();
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  // ============================================================
  // PAGINATION
  // ============================================================
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  // ============================================================
  // BADGES
  // ============================================================
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">Actif</span>;
      case 'inactive':
        return <span className="badge badge-error">Inactif</span>;
      case 'out_of_stock':
        return <span className="badge badge-warning">Rupture</span>;
      case 'discontinued':
        return <span className="badge badge-ghost">Abandonné</span>;
      default:
        return <span className="badge badge-ghost">{status}</span>;
    }
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Non catégorisé';
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : 'Non catégorisé';
  };

  // ============================================================
  // RENDU
  // ============================================================
  if (loading && isFirstLoad) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement des produits...</p>
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
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification({ ...notification, show: false })}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {showDeleteModal && productToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer ce produit ?</p>
              <p className="font-semibold text-error mt-2">{productToDelete.name}</p>
              {(productToDelete.current_stock || 0) > 0 && (
                <p className="text-warning text-sm mt-2">
                  ⚠️ Stock actuel : {productToDelete.current_stock} unités
                </p>
              )}
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button className="btn btn-ghost flex-1" onClick={() => setShowDeleteModal(false)}>
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
                <Package className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Produits</h1>
              {loading && !isFirstLoad && (
                <RefreshCw className="w-5 h-5 text-primary animate-spin ml-2" />
              )}
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Gérez votre catalogue – {totalCount.toLocaleString('fr-FR')} produit(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { fetchProducts(currentPage); fetchStats(); }}
              className="btn btn-sm sm:btn-md btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
            </button>
            <button
              onClick={() => navigate('/produits/nouveau')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" /> Nouveau produit
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold text-primary">{stats.total}</p>
            </div>
            <Package className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Actifs</p>
              <p className="text-xl font-bold text-success">{stats.actifs}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Inactifs</p>
              <p className="text-xl font-bold text-error">{stats.inactifs}</p>
            </div>
            <Archive className="w-8 h-8 text-error/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Rupture</p>
              <p className="text-xl font-bold text-warning">{stats.rupture}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Stock faible</p>
              <p className="text-xl font-bold text-info">{stats.stockFaible}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-info/20" />
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
              placeholder="Rechercher par nom, code, code-barres..."
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
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Toutes les catégories</option>
              {categories.filter(c => c.is_active).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select
              className="select select-bordered w-full"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="out_of_stock">Rupture</option>
              <option value="discontinued">Abandonnés</option>
            </select>
            <div className="flex gap-2">
              <button
                className="btn btn-outline gap-2 flex-1"
                onClick={() => {
                  setCategoryFilter('all');
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

      {/* Tableau des produits */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3">Produit</th>
                  <th className="py-3 hidden md:table-cell">Catégorie</th>
                  <th className="py-3 text-center">Stock</th>
                  <th className="py-3 text-center">Prix vente</th>
                  <th className="py-3 text-center">Expiration</th>
                  <th className="py-3 text-center">Statut</th>
                  <th className="py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && !isFirstLoad && (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse">
                      <td className="py-3"><div className="h-4 w-32 bg-gray-200 rounded"></div></td>
                      <td className="py-3 hidden md:table-cell"><div className="h-4 w-20 bg-gray-200 rounded"></div></td>
                      <td className="py-3 text-center"><div className="h-4 w-12 bg-gray-200 rounded mx-auto"></div></td>
                      <td className="py-3 text-center"><div className="h-4 w-16 bg-gray-200 rounded mx-auto"></div></td>
                      <td className="py-3 text-center"><div className="h-4 w-12 bg-gray-200 rounded mx-auto"></div></td>
                      <td className="py-3 text-center"><div className="h-6 w-16 bg-gray-200 rounded mx-auto"></div></td>
                      <td className="py-3 text-center"><div className="h-8 w-24 bg-gray-200 rounded mx-auto"></div></td>
                    </tr>
                  ))
                )}

                {!loading && products.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <Package className="w-16 h-16 text-gray-300" />
                        <p className="text-gray-500 font-medium">Aucun produit trouvé</p>
                        <button
                          onClick={() => navigate('/produits/nouveau')}
                          className="btn btn-primary btn-sm gap-2"
                        >
                          <Plus className="w-4 h-4" /> Ajouter un produit
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && products.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-full w-full object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <Package className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">
                      <span className="badge badge-ghost">{getCategoryName(product.category)}</span>
                    </td>
                    <td className="text-center">
                      <span
                        className={`font-semibold ${
                          (product.current_stock || 0) <= (product.min_stock || 0)
                            ? 'text-warning'
                            : 'text-success'
                        }`}
                      >
                        {product.current_stock || 0}
                      </span>
                    </td>
                    <td className="text-center font-semibold">
                      {parseFloat(product.selling_price || 0).toLocaleString('fr-FR')} F
                    </td>
                    <td className="text-center">
                      {product.has_expiry ? (
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 text-warning" />
                          <span className="text-xs">Oui</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Non</span>
                      )}
                    </td>
                    <td className="text-center">{getStatusBadge(product.status)}</td>
                    <td className="text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => navigate(`/produits/${product.id}`)}
                          className="btn btn-ghost btn-sm btn-circle tooltip"
                          data-tip="Détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/produits/${product.id}/modifier`)}
                          className="btn btn-ghost btn-sm btn-circle tooltip"
                          data-tip="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setProductToDelete(product);
                            setShowDeleteModal(true);
                          }}
                          className="btn btn-ghost btn-sm btn-circle tooltip text-error"
                          data-tip="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {products.length === 0 ? (
              <div className="col-span-3 text-center py-16">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun produit trouvé</p>
              </div>
            ) : (
              products.map(product => (
                <div key={product.id} className="bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-full w-full object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <Package className="w-6 h-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-xs text-gray-500">{product.code}</p>
                        </div>
                      </div>
                      {getStatusBadge(product.status)}
                    </div>

                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {product.description || 'Aucune description'}
                      </p>
                      <div className="flex justify-between items-center pt-2">
                        <div>
                          <p className="text-xs text-gray-500">Stock</p>
                          <p className="font-bold text-lg">{product.current_stock || 0}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Prix vente</p>
                          <p className="font-bold text-primary">
                            {parseFloat(product.selling_price || 0).toLocaleString('fr-FR')} F
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
                        <span>Catégorie : {getCategoryName(product.category)}</span>
                        {product.has_expiry && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Avec expiration
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-3 pt-2 border-t">
                      <button
                        onClick={() => navigate(`/produits/${product.id}`)}
                        className="btn btn-sm btn-ghost"
                      >
                        Détails
                      </button>
                      <button
                        onClick={() => navigate(`/produits/${product.id}/modifier`)}
                        className="btn btn-sm btn-primary"
                      >
                        Modifier
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ✅ PAGINATION SERVEUR */}
        {totalCount > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Affichage de {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)} à {Math.min(currentPage * itemsPerPage, totalCount)} sur {totalCount.toLocaleString('fr-FR')}
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
const ProductsList = () => (
  <ErrorBoundary>
    <ProductsListContent />
  </ErrorBoundary>
);

export default ProductsList;