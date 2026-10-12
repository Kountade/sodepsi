// src/components/stock/LotsList.jsx
// ============================================================
// VERSION COMPLÈTE CORRIGÉE - Compatible pagination DRF
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Package, Search, RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight,
  AlertTriangle, Building2, Clock, Calendar,
  Layers, TrendingDown, Ban
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
    console.error('❌ ErrorBoundary LotsList:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-4 text-error">
              <AlertCircle className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Erreur dans la liste des lots</h2>
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
const LotsListContent = () => {
  const navigate = useNavigate();

  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [warehouses, setWarehouses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // ✅ Stats globales
  const [stats, setStats] = useState({
    total: 0,
    expiring: 0,
    expired: 0,
    good: 0,
  });

  // ==========================================================
  // UTILITAIRES
  // ==========================================================
  const getToken = () => localStorage.getItem('Token');

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  }, []);

  // ✅ NORMALISATION
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
  // CHARGEMENT DES LOTS (pagination serveur)
  // ==========================================================
  const fetchLots = useCallback(async (page = 1) => {
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

      // Filtres
      if (statusFilter !== 'all') {
        if (statusFilter === 'expiring') params.append('expiring', 'true');
        if (statusFilter === 'expired') params.append('expired', 'true');
        if (statusFilter === 'available') params.append('available', 'true');
      }
      if (warehouseFilter !== 'all') {
        params.append('warehouse', warehouseFilter);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const url = `/lots/?${params.toString()}`;
      console.log('🔍 fetchLots:', url);

      const response = await AxiosInstance.get(url, {
        headers: { 'Authorization': `Token ${token}` }
      });

      const data = response.data;
      console.log('✅ Réponse API lots:', data);

      const { results, count } = getPaginatedInfo(data);

      setLots(results);
      setTotalCount(count);
      setTotalPages(count > 0 ? Math.ceil(count / itemsPerPage) : 1);
      setIsFirstLoad(false);

    } catch (error) {
      console.error('❌ Erreur fetchLots:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
      setLots([]);
      setTotalCount(0);
      setTotalPages(1);
      setIsFirstLoad(false);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, warehouseFilter, searchTerm, itemsPerPage, navigate, showNotification]);

  // ==========================================================
  // CHARGEMENT DES ENTREPÔTS
  // ==========================================================
  const fetchWarehouses = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await AxiosInstance.get('/warehouses/?active=true', {
        headers: { 'Authorization': `Token ${token}` }
      });

      setWarehouses(normalizeData(response.data));
    } catch (error) {
      console.error('❌ Erreur chargement entrepôts:', error);
      setWarehouses([]);
    }
  }, []);

  // ==========================================================
  // CHARGEMENT DES STATS
  // ==========================================================
  const fetchStats = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await AxiosInstance.get('/lots/?page_size=1000', {
        headers: { 'Authorization': `Token ${token}` }
      });

      const all = normalizeData(response.data);

      setStats({
        total: all.length,
        expiring: all.filter(l => l.status === 'expiring').length,
        expired: all.filter(l => l.status === 'expired').length,
        good: all.filter(l => l.status === 'good').length,
      });

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
    fetchLots(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, warehouseFilter, searchTerm, itemsPerPage]);

  useEffect(() => {
    if (currentPage > 1 || isFirstLoad === false) {
      fetchLots(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // ==========================================================
  // HELPERS
  // ==========================================================
  const getStatusBadge = (status, daysLeft) => {
    switch (status) {
      case 'expired':
        return (
          <span className="badge badge-error gap-1">
            <Ban className="w-3 h-3" /> Expiré
          </span>
        );
      case 'expiring':
        const days = daysLeft != null ? daysLeft : '?';
        return (
          <span className="badge badge-warning gap-1">
            <Clock className="w-3 h-3" /> Expire dans {days}j
          </span>
        );
      case 'good':
        return (
          <span className="badge badge-success gap-1">
            <CheckCircle className="w-3 h-3" /> Valide
          </span>
        );
      default:
        return <span className="badge badge-ghost">{status || 'N/A'}</span>;
    }
  };

  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'N/A';
  };

  const formatExpiryDate = (dateStr, daysLeft) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('fr-FR');
    } catch {
      return 'N/A';
    }
  };

  const getExpiryTextClass = (daysLeft) => {
    if (daysLeft == null) return '';
    if (daysLeft <= 7) return 'text-error font-semibold';
    if (daysLeft <= 30) return 'text-warning';
    return '';
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setWarehouseFilter('all');
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
            Chargement des lots...
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
              {notification.type === 'success'
                ? <CheckCircle className="w-4 h-4" />
                : <AlertCircle className="w-4 h-4" />}
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
                <Layers className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Gestion des Lots
              </h1>
              {loading && !isFirstLoad && (
                <RefreshCw className="w-5 h-5 text-primary animate-spin ml-2" />
              )}
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Suivez les lots par date d'expiration –{' '}
              <span className="font-semibold text-gray-700">{totalCount}</span> lot(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { fetchLots(currentPage); fetchStats(); }}
              className="btn btn-sm sm:btn-md btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total lots</p>
              <p className="text-xl font-bold text-primary">{stats.total}</p>
            </div>
            <Layers className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Valides</p>
              <p className="text-xl font-bold text-success">{stats.good}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Expire bientôt</p>
              <p className="text-xl font-bold text-warning">{stats.expiring}</p>
            </div>
            <Clock className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Expirés</p>
              <p className="text-xl font-bold text-error">{stats.expired}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-error/20" />
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
              placeholder="Rechercher par produit ou numéro de lot..."
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
              <option value="good">Valides</option>
              <option value="expiring">Expire bientôt</option>
              <option value="expired">Expirés</option>
              <option value="available">Disponibles</option>
            </select>
            <select
              className="select select-bordered w-full"
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
            >
              <option value="all">Tous les entrepôts</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <button
              className="btn btn-outline gap-2"
              onClick={resetFilters}
            >
              <RefreshCw className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Tableau des lots */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3">Produit / Lot</th>
                <th className="py-3 hidden md:table-cell">Entrepôt</th>
                <th className="py-3 text-center">Quantité</th>
                <th className="py-3 text-center">Date expiration</th>
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
                    <td className="py-3 text-center"><div className="h-4 w-16 bg-gray-200 rounded mx-auto"></div></td>
                    <td className="py-3 text-center"><div className="h-4 w-24 bg-gray-200 rounded mx-auto"></div></td>
                    <td className="py-3 text-center"><div className="h-6 w-24 bg-gray-200 rounded mx-auto"></div></td>
                    <td className="py-3 text-center"><div className="h-8 w-12 bg-gray-200 rounded mx-auto"></div></td>
                  </tr>
                ))
              ) : lots.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Layers className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucun lot trouvé</p>
                    </div>
                  </td>
                </tr>
              ) : (
                lots.map(lot => (
                  <tr key={lot.id} className="hover:bg-gray-50">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{lot.product_name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">Lot : {lot.lot_number || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">
                          {lot.warehouse_name || getWarehouseName(lot.warehouse)}
                        </span>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="font-semibold">{lot.current_quantity || 0}</span>
                      <span className="text-xs text-gray-400 ml-1">
                        / {lot.initial_quantity || 0}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className={`text-sm ${getExpiryTextClass(lot.days_until_expiry)}`}>
                          {formatExpiryDate(lot.expiry_date, lot.days_until_expiry)}
                        </span>
                      </div>
                    </td>
                    <td className="text-center">
                      {getStatusBadge(lot.status, lot.days_until_expiry)}
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => navigate(`/lots/${lot.id}`)}
                        className="btn btn-ghost btn-sm btn-circle tooltip"
                        data-tip="Détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ✅ Pagination serveur */}
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
const LotsList = () => (
  <ErrorBoundary>
    <LotsListContent />
  </ErrorBoundary>
);

export default LotsList;