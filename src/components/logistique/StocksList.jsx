// src/components/stock/StocksList.jsx
// ============================================================
// VERSION COMPLÈTE CORRIGÉE - Compatible pagination DRF
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Package, Search, RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight, Grid3x3, List,
  AlertTriangle, Building2, TrendingUp, TrendingDown,
  Boxes, Clock, Warehouse, Percent
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
    console.error('❌ ErrorBoundary StocksList:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-4 text-error">
              <AlertTriangle className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Erreur dans StocksList</h2>
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
const StocksListContent = () => {
  const navigate = useNavigate();

  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [stocks, setStocks] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalStockValue, setTotalStockValue] = useState(0);

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // UI
  const [viewMode, setViewMode] = useState('list');
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    outOfStock: 0,
    overStock: 0,
    totalQuantity: 0,
    totalValue: 0,
  });

  // ==========================================================
  // UTILITAIRES
  // ==========================================================
  const getToken = () => localStorage.getItem('Token');

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  }, []);

  // ✅ NORMALISATION DES RÉPONSES
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

  // ==========================================================
  // CHARGEMENT DES STOCKS (pagination serveur)
  // ==========================================================
  const fetchStocks = useCallback(async (page = 1) => {
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

      if (warehouseFilter !== 'all') {
        params.append('warehouse', warehouseFilter);
      }
      if (statusFilter === 'low_stock') {
        params.append('low_stock', 'true');
      }

      const url = `/stocks/?${params.toString()}`;
      console.log('🔍 fetchStocks:', url);

      const response = await AxiosInstance.get(url, {
        headers: { 'Authorization': `Token ${token}` }
      });

      const data = response.data;
      console.log('✅ Réponse API stocks:', data);

      const { results, count } = getPaginatedInfo(data);

      setStocks(results);
      setTotalCount(count);
      setTotalPages(count > 0 ? Math.ceil(count / itemsPerPage) : 1);
      setIsFirstLoad(false);

    } catch (error) {
      console.error('❌ Erreur fetchStocks:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
      setStocks([]);
      setTotalCount(0);
      setTotalPages(1);
      setIsFirstLoad(false);
    } finally {
      setLoading(false);
    }
  }, [warehouseFilter, statusFilter, itemsPerPage, navigate, showNotification]);

  // ==========================================================
  // CHARGEMENT DES ENTREPÔTS
  // ==========================================================
  const fetchWarehouses = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await AxiosInstance.get('/warehouses/', {
        headers: { 'Authorization': `Token ${token}` }
      });

      const data = normalizeData(response.data);
      setWarehouses(data.filter(w => w.is_active));
    } catch (error) {
      console.error('❌ Erreur chargement entrepôts:', error);
      setWarehouses([]);
    }
  }, []);

  // ==========================================================
  // CHARGEMENT DES STATS (globales)
  // ==========================================================
  const fetchStats = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await AxiosInstance.get('/stocks/?page_size=1000', {
        headers: { 'Authorization': `Token ${token}` }
      });

      const allStocks = normalizeData(response.data);

      let totalQty = 0;
      let lowStock = 0;
      let outStock = 0;
      let overStock = 0;
      let totalValue = 0;

      allStocks.forEach(s => {
        const qty = parseInt(s.quantity) || 0;
        const minStock = parseInt(s.min_stock) || 5;
        const maxStock = parseInt(s.max_stock) || 0;

        totalQty += qty;
        if (qty === 0) outStock++;
        else if (qty <= minStock) lowStock++;
        else if (maxStock > 0 && qty >= maxStock) overStock++;

        totalValue += qty * (parseFloat(s.product_purchase_price) || 0);
      });

      setStats({
        total: allStocks.length,
        lowStock,
        outOfStock: outStock,
        overStock,
        totalQuantity: totalQty,
        totalValue,
      });
      setTotalStockValue(totalValue);

    } catch (error) {
      console.error('❌ Erreur fetchStats:', error);
    }
  }, []);

  // ==========================================================
  // EFFETS
  // ==========================================================
  useEffect(() => {
    fetchWarehouses();
    fetchStats();
  }, [fetchWarehouses, fetchStats]);

  useEffect(() => {
    setCurrentPage(1);
    fetchStocks(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseFilter, statusFilter, itemsPerPage]);

  useEffect(() => {
    if (currentPage > 1 || isFirstLoad === false) {
      fetchStocks(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // ==========================================================
  // FILTRES CLIENT (uniquement sur les stocks visibles)
  // ==========================================================
  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = !searchTerm ||
      (stock.product_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (stock.product_code?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesWarehouse = warehouseFilter === 'all' ||
      stock.warehouse === parseInt(warehouseFilter);

    return matchesSearch && matchesWarehouse;
  });

  // Tri par quantité décroissante
  const sortedStocks = [...filteredStocks].sort((a, b) =>
    (b.quantity || 0) - (a.quantity || 0)
  );

  // ==========================================================
  // PAGINATION CLIENT (uniquement sur les résultats filtrés)
  // ==========================================================
  const totalFilteredPages = Math.ceil(sortedStocks.length / itemsPerPage);
  const paginatedStocks = sortedStocks;  // ✅ Déjà paginé par le serveur

  // ==========================================================
  // HELPERS
  // ==========================================================
  const getStockStatus = (stock) => {
    if (stock.quantity === 0) {
      return {
        label: 'Rupture',
        color: 'error',
        icon: <AlertTriangle className="w-3 h-3" />
      };
    }
    if (stock.is_low_stock) {
      return {
        label: 'Stock faible',
        color: 'warning',
        icon: <AlertCircle className="w-3 h-3" />
      };
    }
    if (stock.is_over_stock) {
      return {
        label: 'Stock excessif',
        color: 'info',
        icon: <TrendingUp className="w-3 h-3" />
      };
    }
    return {
      label: 'Normal',
      color: 'success',
      icon: <CheckCircle className="w-3 h-3" />
    };
  };

  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Entrepôt inconnu';
  };

  const getStockProgress = (stock) => {
    if (stock.max_stock && stock.max_stock > 0) {
      const percentage = (stock.quantity / stock.max_stock) * 100;
      return Math.min(percentage, 100);
    }
    return 0;
  };

  const getProgressColor = (progress) => {
    if (progress > 80) return 'bg-success';
    if (progress > 50) return 'bg-warning';
    return 'bg-error';
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  const resetFilters = () => {
    setWarehouseFilter('all');
    setStatusFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // ==========================================================
  // RENDU : CHARGEMENT
  // ==========================================================
  if (loading && isFirstLoad) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">
            Chargement des stocks...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDU PRINCIPAL
  // ==========================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Boxes className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Gestion des Stocks
              </h1>
              {loading && !isFirstLoad && (
                <RefreshCw className="w-5 h-5 text-primary animate-spin ml-2" />
              )}
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Suivez l'état des stocks par produit et entrepôt –{' '}
              <span className="font-semibold text-gray-700">{totalCount}</span> référence(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { fetchStocks(currentPage); fetchStats(); }}
              className="btn btn-sm sm:btn-md btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={() => navigate('/mouvements-stock')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              <TrendingUp className="w-4 h-4" /> Mouvements
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Références</p>
              <p className="text-xl font-bold text-primary">{stats.total}</p>
            </div>
            <Boxes className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Quantité totale</p>
              <p className="text-xl font-bold text-primary">
                {stats.totalQuantity.toLocaleString('fr-FR')}
              </p>
            </div>
            <Package className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Valeur totale</p>
              <p className="text-xl font-bold text-primary">
                {stats.totalValue.toLocaleString('fr-FR')} F
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Stock faible</p>
              <p className="text-xl font-bold text-warning">{stats.lowStock}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Rupture</p>
              <p className="text-xl font-bold text-error">{stats.outOfStock}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-error/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Stock excessif</p>
              <p className="text-xl font-bold text-info">{stats.overStock}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-info/20" />
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
              placeholder="Rechercher par produit ou code..."
              className="input input-bordered w-full pl-9"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline btn-sm sm:hidden gap-2"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Masquer' : 'Filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-3 gap-3`}>
            <select
              className="select select-bordered w-full"
              value={warehouseFilter}
              onChange={(e) => {
                setWarehouseFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tous les entrepôts</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <select
              className="select select-bordered w-full"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tous les statuts</option>
              <option value="low_stock">Stock faible</option>
              <option value="out_of_stock">Rupture</option>
            </select>
            <div className="flex gap-2">
              <button
                className="btn btn-outline gap-2 flex-1"
                onClick={resetFilters}
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

      {/* Tableau des stocks */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {viewMode === 'list' && (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3">Produit</th>
                  <th className="py-3 hidden md:table-cell">Entrepôt</th>
                  <th className="py-3 text-center">Stock actuel</th>
                  <th className="py-3 text-center hidden lg:table-cell">Occupation</th>
                  <th className="py-3 text-center">Min / Max</th>
                  <th className="py-3 text-center">Statut</th>
                  <th className="py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && !isFirstLoad ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse">
                      <td className="py-3"><div className="h-4 w-32 bg-gray-200 rounded"></div></td>
                      <td className="py-3 hidden md:table-cell"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
                      <td className="py-3 text-center"><div className="h-4 w-12 bg-gray-200 rounded mx-auto"></div></td>
                      <td className="py-3 text-center hidden lg:table-cell"><div className="h-4 w-20 bg-gray-200 rounded mx-auto"></div></td>
                      <td className="py-3 text-center"><div className="h-4 w-16 bg-gray-200 rounded mx-auto"></div></td>
                      <td className="py-3 text-center"><div className="h-6 w-20 bg-gray-200 rounded mx-auto"></div></td>
                      <td className="py-3 text-center"><div className="h-8 w-20 bg-gray-200 rounded mx-auto"></div></td>
                    </tr>
                  ))
                ) : paginatedStocks.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <Boxes className="w-16 h-16 text-gray-300" />
                        <p className="text-gray-500 font-medium">Aucun stock trouvé</p>
                        <p className="text-sm text-gray-400">
                          Ajustez vos filtres ou ajoutez des produits
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedStocks.map(stock => {
                    const status = getStockStatus(stock);
                    const progress = getStockProgress(stock);

                    return (
                      <tr
                        key={`${stock.product}-${stock.warehouse}`}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Package className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold truncate max-w-[200px]">
                                {stock.product_name || 'N/A'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {stock.product_code || '-'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="text-sm">
                              {stock.warehouse_name || getWarehouseName(stock.warehouse)}
                            </span>
                          </div>
                        </td>
                        <td className="text-center">
                          <span className={`font-bold text-lg ${
                            status.color === 'warning' ? 'text-warning' :
                            status.color === 'error' ? 'text-error' :
                            'text-success'
                          }`}>
                            {stock.quantity || 0}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">u</span>
                        </td>
                        <td className="hidden lg:table-cell">
                          {stock.max_stock > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">
                                {Math.round(progress)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="text-center">
                          <span className="text-xs text-gray-500">
                            {stock.min_stock || 0} / {stock.max_stock || '∞'}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className={`badge badge-${status.color} gap-1 px-3 py-1.5`}>
                            {status.icon} {status.label}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => navigate(`/stocks/${stock.product}`)}
                              className="btn btn-ghost btn-sm btn-circle tooltip"
                              data-tip="Détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/mouvements-stock?product=${stock.product}`)}
                              className="btn btn-ghost btn-sm btn-circle tooltip"
                              data-tip="Mouvements"
                            >
                              <TrendingUp className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {paginatedStocks.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <Boxes className="w-16 h-16 text-gray-300" />
                  <p className="text-gray-500 font-medium">Aucun stock trouvé</p>
                </div>
              </div>
            ) : (
              paginatedStocks.map(stock => {
                const status = getStockStatus(stock);
                const progress = getStockProgress(stock);

                return (
                  <div
                    key={`${stock.product}-${stock.warehouse}`}
                    className="bg-white shadow-md hover:shadow-xl transition-all duration-300 rounded-xl border border-gray-200 overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Package className="w-6 h-6 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold truncate">
                              {stock.product_name || 'N/A'}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {stock.product_code || '-'}
                            </p>
                          </div>
                        </div>
                        <span className={`badge badge-${status.color} gap-1 flex-shrink-0`}>
                          {status.icon} {status.label}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Stock actuel</span>
                          <span className={`font-bold text-xl ${
                            status.color === 'warning' ? 'text-warning' :
                            status.color === 'error' ? 'text-error' :
                            'text-success'
                          }`}>
                            {stock.quantity || 0}
                            <span className="text-xs font-normal text-gray-400 ml-1">u</span>
                          </span>
                        </div>

                        {stock.max_stock > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Occupation</span>
                              <span className="text-gray-600">{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500">Stock min</p>
                            <p className="font-medium">{stock.min_stock || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Stock max</p>
                            <p className="font-medium">{stock.max_stock || '∞'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-sm">
                          <Warehouse className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600">
                            {stock.warehouse_name || getWarehouseName(stock.warehouse)}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                        <button
                          onClick={() => navigate(`/stocks/${stock.product}`)}
                          className="btn btn-sm btn-ghost"
                        >
                          <Eye className="w-4 h-4 mr-1" /> Détails
                        </button>
                        <button
                          onClick={() => navigate(`/mouvements-stock?product=${stock.product}`)}
                          className="btn btn-sm btn-outline"
                        >
                          <TrendingUp className="w-4 h-4 mr-1" /> Mouvements
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ✅ Pagination serveur */}
        {totalCount > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Affichage de {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)} à{' '}
              {Math.min(currentPage * itemsPerPage, totalCount)} sur{' '}
              <span className="font-medium">{totalCount.toLocaleString('fr-FR')}</span> références
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
const StocksList = () => (
  <ErrorBoundary>
    <StocksListContent />
  </ErrorBoundary>
);

export default StocksList;