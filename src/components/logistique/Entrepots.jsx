// src/components/stock/Entrepots.jsx
// ============================================================
// VERSION COMPLÈTE CORRIGÉE - Compatible pagination DRF
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, Warehouse,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter,
  ChevronLeft, ChevronRight, Grid3x3, List,
  Archive, Building2, MapPin
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
    console.error('❌ ErrorBoundary Entrepots:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-4 text-error">
              <AlertCircle className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Erreur dans la liste des entrepôts</h2>
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
const EntrepotsContent = () => {
  const navigate = useNavigate();

  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [viewMode, setViewMode] = useState('list');
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // ✅ Stats globales
  const [stats, setStats] = useState({
    total: 0,
    actifs: 0,
    inactifs: 0,
    principaux: 0,
    secondaires: 0,
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
  // CHARGEMENT DES ENTREPÔTS (pagination serveur)
  // ==========================================================
  const fetchWarehouses = useCallback(async (page = 1) => {
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

      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter === 'active') params.append('active', 'true');
      if (statusFilter === 'inactive') params.append('active', 'false');
      if (searchTerm) params.append('search', searchTerm);

      const url = `/warehouses/?${params.toString()}`;
      console.log('🔍 fetchWarehouses:', url);

      const response = await AxiosInstance.get(url, {
        headers: { 'Authorization': `Token ${token}` }
      });

      const data = response.data;
      console.log('✅ Réponse API entrepôts:', data);

      const { results, count } = getPaginatedInfo(data);

      setWarehouses(results);
      setTotalCount(count);
      setTotalPages(count > 0 ? Math.ceil(count / itemsPerPage) : 1);
      setIsFirstLoad(false);

    } catch (error) {
      console.error('❌ Erreur fetchWarehouses:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
      setWarehouses([]);
      setTotalCount(0);
      setTotalPages(1);
      setIsFirstLoad(false);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, searchTerm, itemsPerPage, navigate, showNotification]);

  // ==========================================================
  // CHARGEMENT DES STATS
  // ==========================================================
  const fetchStats = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await AxiosInstance.get('/warehouses/?page_size=1000', {
        headers: { 'Authorization': `Token ${token}` }
      });

      const all = normalizeData(response.data);

      setStats({
        total: all.length,
        actifs: all.filter(w => w.is_active).length,
        inactifs: all.filter(w => !w.is_active).length,
        principaux: all.filter(w => w.type === 'main').length,
        secondaires: all.filter(w => w.type === 'secondary').length,
      });

    } catch (error) {
      console.error('❌ Erreur fetchStats:', error);
    }
  }, []);

  // ==========================================================
  // EFFETS
  // ==========================================================
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    setCurrentPage(1);
    fetchWarehouses(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter, searchTerm, itemsPerPage]);

  useEffect(() => {
    if (currentPage > 1 || isFirstLoad === false) {
      fetchWarehouses(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // ==========================================================
  // SUPPRESSION
  // ==========================================================
  const handleDelete = async () => {
    if (!warehouseToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/warehouses/${warehouseToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Entrepôt supprimé', 'success');
      fetchWarehouses(currentPage);
      fetchStats();
      setShowDeleteModal(false);
      setWarehouseToDelete(null);
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  // ==========================================================
  // HELPERS
  // ==========================================================
  const getTypeBadge = (type) => {
    switch (type) {
      case 'main': return <span className="badge badge-primary">Principal</span>;
      case 'secondary': return <span className="badge badge-secondary">Secondaire</span>;
      case 'store': return <span className="badge badge-info">Magasin</span>;
      default: return <span className="badge badge-ghost">Entrepôt</span>;
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  const resetFilters = () => {
    setTypeFilter('all');
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
            Chargement des entrepôts...
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

      {/* Modal Suppression */}
      {showDeleteModal && warehouseToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer cet entrepôt ?</p>
              <p className="font-semibold text-error mt-2">{warehouseToDelete.name}</p>
              {(warehouseToDelete.current_occupancy || 0) > 0 && (
                <p className="text-warning text-sm mt-2">
                  ⚠️ Stock actuel : {warehouseToDelete.current_occupancy} unités
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
                <Warehouse className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Entrepôts</h1>
              {loading && !isFirstLoad && (
                <RefreshCw className="w-5 h-5 text-primary animate-spin ml-2" />
              )}
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Gérez vos entrepôts et magasins – {totalCount.toLocaleString('fr-FR')} entrepôt(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { fetchWarehouses(currentPage); fetchStats(); }}
              className="btn btn-sm sm:btn-md btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
            </button>
            <button
              onClick={() => navigate('/entrepots/nouveau')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" /> Nouvel entrepôt
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
            <Warehouse className="w-8 h-8 text-primary/20" />
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
              <p className="text-xs text-gray-500">Principaux</p>
              <p className="text-xl font-bold text-info">{stats.principaux}</p>
            </div>
            <Building2 className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Secondaires</p>
              <p className="text-xl font-bold text-secondary">{stats.secondaires}</p>
            </div>
            <Archive className="w-8 h-8 text-secondary/20" />
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
              placeholder="Rechercher par nom, code ou ville..."
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Tous les types</option>
              <option value="main">Principaux</option>
              <option value="secondary">Secondaires</option>
              <option value="store">Magasins</option>
              <option value="warehouse">Entrepôts</option>
            </select>
            <select
              className="select select-bordered w-full"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
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

      {/* Tableau des entrepôts */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3">Entrepôt</th>
                  <th className="py-3 hidden md:table-cell">Code</th>
                  <th className="py-3 hidden lg:table-cell">Type</th>
                  <th className="py-3 text-center">Occupation</th>
                  <th className="py-3 hidden md:table-cell">Ville</th>
                  <th className="py-3 text-center">Statut</th>
                  <th className="py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && !isFirstLoad ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse">
                      <td className="py-3"><div className="h-4 w-32 bg-gray-200 rounded"></div></td>
                      <td className="py-3 hidden md:table-cell"><div className="h-4 w-16 bg-gray-200 rounded"></div></td>
                      <td className="py-3 hidden lg:table-cell"><div className="h-6 w-20 bg-gray-200 rounded"></div></td>
                      <td className="py-3 text-center"><div className="h-4 w-12 bg-gray-200 rounded mx-auto"></div></td>
                      <td className="py-3 hidden md:table-cell"><div className="h-4 w-20 bg-gray-200 rounded"></div></td>
                      <td className="py-3 text-center"><div className="h-6 w-16 bg-gray-200 rounded mx-auto"></div></td>
                      <td className="py-3 text-center"><div className="h-8 w-24 bg-gray-200 rounded mx-auto"></div></td>
                    </tr>
                  ))
                ) : warehouses.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <Warehouse className="w-16 h-16 text-gray-300" />
                        <p className="text-gray-500 font-medium">Aucun entrepôt trouvé</p>
                        <button
                          onClick={() => navigate('/entrepots/nouveau')}
                          className="btn btn-primary btn-sm gap-2"
                        >
                          <Plus className="w-4 h-4" /> Ajouter un entrepôt
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  warehouses.map(warehouse => (
                    <tr key={warehouse.id} className="hover:bg-gray-50">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Warehouse className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{warehouse.name}</p>
                            <p className="text-xs text-gray-500">
                              {warehouse.manager || 'Sans responsable'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {warehouse.code}
                        </code>
                      </td>
                      <td className="hidden lg:table-cell">
                        {getTypeBadge(warehouse.type)}
                      </td>
                      <td className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold">
                            {warehouse.current_occupancy || 0}
                          </span>
                          {warehouse.capacity && (
                            <span className="text-xs text-gray-400">
                              / {warehouse.capacity}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{warehouse.city || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="text-center">
                        {warehouse.is_active ? (
                          <span className="badge badge-success">Actif</span>
                        ) : (
                          <span className="badge badge-error">Inactif</span>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => navigate(`/entrepots/${warehouse.id}`)}
                            className="btn btn-ghost btn-sm btn-circle tooltip"
                            data-tip="Détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/entrepots/${warehouse.id}/modifier`)}
                            className="btn btn-ghost btn-sm btn-circle tooltip"
                            data-tip="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setWarehouseToDelete(warehouse);
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {warehouses.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <Warehouse className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun entrepôt trouvé</p>
              </div>
            ) : (
              warehouses.map(warehouse => (
                <div
                  key={warehouse.id}
                  className="bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Warehouse className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{warehouse.name}</h3>
                          <p className="text-xs text-gray-500">{warehouse.code}</p>
                        </div>
                      </div>
                      {getTypeBadge(warehouse.type)}
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Responsable</span>
                        <span className="font-medium">{warehouse.manager || 'Non défini'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Téléphone</span>
                        <span className="font-medium">{warehouse.phone || 'Non défini'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Ville</span>
                        <span className="font-medium">{warehouse.city || 'Non définie'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Occupation</span>
                        <span className="font-medium">
                          {warehouse.current_occupancy || 0} / {warehouse.capacity || '∞'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Statut</span>
                        {warehouse.is_active ? (
                          <span className="badge badge-success">Actif</span>
                        ) : (
                          <span className="badge badge-error">Inactif</span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                      <button
                        onClick={() => navigate(`/entrepots/${warehouse.id}`)}
                        className="btn btn-sm btn-ghost"
                      >
                        Détails
                      </button>
                      <button
                        onClick={() => navigate(`/entrepots/${warehouse.id}/modifier`)}
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
const Entrepots = () => (
  <ErrorBoundary>
    <EntrepotsContent />
  </ErrorBoundary>
);

export default Entrepots;