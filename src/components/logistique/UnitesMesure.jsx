// src/components/stock/UnitesMesure.jsx
// ============================================================
// VERSION COMPLÈTE CORRIGÉE - Pagination serveur + ErrorBoundary
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Ruler,
  RefreshCw,
  X,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  List,
  Archive,
  Scale,
  Droplet,
  Box
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
    console.error('❌ ErrorBoundary UnitesMesure:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-4 text-error">
              <AlertCircle className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Erreur dans la liste des unités</h2>
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
const UnitesMesureContent = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [viewMode, setViewMode] = useState('list');
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // ✅ Stats globales
  const [stats, setStats] = useState({
    total: 0,
    actives: 0,
    inactives: 0,
    baseUnits: 0,
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
  // ✅ NORMALISATION
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
  // ✅ CHARGEMENT DES UNITÉS (pagination serveur)
  // ============================================================
  const fetchUnits = useCallback(async (page = 1) => {
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
      if (searchTerm) params.append('search', searchTerm);

      const url = `/unit-measures/?${params.toString()}`;
      console.log('🔍 fetchUnits:', url);

      const response = await AxiosInstance.get(url, {
        headers: { 'Authorization': `Token ${token}` }
      });

      const data = response.data;
      console.log('✅ Réponse API unités:', data);

      const { results, count } = getPaginatedInfo(data);

      setUnits(results);
      setTotalCount(count);
      setTotalPages(count > 0 ? Math.ceil(count / itemsPerPage) : 1);
      setIsFirstLoad(false);

    } catch (error) {
      console.error('❌ Erreur fetchUnits:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
      setUnits([]);
      setTotalCount(0);
      setTotalPages(1);
      setIsFirstLoad(false);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, searchTerm, itemsPerPage, navigate, showNotification]);

  // ============================================================
  // ✅ CHARGEMENT DES STATS
  // ============================================================
  const fetchStats = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await AxiosInstance.get('/unit-measures/?page_size=1000', {
        headers: { 'Authorization': `Token ${token}` }
      });

      const allUnits = normalizeData(response.data);

      setStats({
        total: allUnits.length,
        actives: allUnits.filter(u => u.is_active).length,
        inactives: allUnits.filter(u => !u.is_active).length,
        baseUnits: allUnits.filter(u => u.is_base_unit).length,
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
    fetchUnits(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, searchTerm, itemsPerPage]);

  useEffect(() => {
    if (currentPage > 1 || isFirstLoad === false) {
      fetchUnits(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    if (!unitToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/unit-measures/${unitToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Unité supprimée', 'success');
      fetchUnits(currentPage);
      fetchStats();
      setShowDeleteModal(false);
      setUnitToDelete(null);
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================
  const getTypeIcon = (type) => {
    switch (type) {
      case 'weight': return <Scale className="w-4 h-4" />;
      case 'volume': return <Droplet className="w-4 h-4" />;
      case 'length': return <Ruler className="w-4 h-4" />;
      default: return <Box className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'weight': return 'Poids';
      case 'volume': return 'Volume';
      case 'length': return 'Longueur';
      default: return 'Unité';
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
  // RENDU
  // ============================================================
  if (loading && isFirstLoad) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement des unités...</p>
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
      {showDeleteModal && unitToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer cette unité ?</p>
              <p className="font-semibold text-error mt-2">{unitToDelete.name}</p>
              {unitToDelete.is_base_unit && (
                <p className="text-warning text-sm mt-2">
                  ⚠️ Cette unité est marquée comme unité de base
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
                <Ruler className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Unités de mesure</h1>
              {loading && !isFirstLoad && (
                <RefreshCw className="w-5 h-5 text-primary animate-spin ml-2" />
              )}
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Gérez les unités de mesure – {totalCount.toLocaleString('fr-FR')} unité(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => fetchUnits(currentPage)}
              className="btn btn-sm sm:btn-md btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
            </button>
            <button
              onClick={() => navigate('/unites-mesure/nouveau')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" /> Nouvelle unité
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
            <Ruler className="w-8 h-8 text-primary/20" />
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
              <p className="text-xs text-gray-500">Unités de base</p>
              <p className="text-xl font-bold text-info">{stats.baseUnits}</p>
            </div>
            <Box className="w-8 h-8 text-info/20" />
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
              placeholder="Rechercher par nom ou symbole..."
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
              <option value="unit">Unités</option>
              <option value="weight">Poids</option>
              <option value="volume">Volume</option>
              <option value="length">Longueur</option>
            </select>
            <div className="flex gap-2">
              <button
                className="btn btn-outline gap-2 flex-1"
                onClick={() => {
                  setTypeFilter('all');
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
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3">Unité</th>
                  <th className="py-3">Symbole</th>
                  <th className="py-3 hidden md:table-cell">Type</th>
                  <th className="py-3 text-center">Facteur</th>
                  <th className="py-3 text-center">Base</th>
                  <th className="py-3 text-center">Statut</th>
                  <th className="py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && !isFirstLoad ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse">
                      <td className="py-3"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
                      <td className="py-3"><div className="h-4 w-12 bg-gray-200 rounded"></div></td>
                      <td className="py-3 hidden md:table-cell"><div className="h-4 w-16 bg-gray-200 rounded"></div></td>
                      <td className="py-3 text-center"><div className="h-4 w-12 bg-gray-200 rounded mx-auto"></div></td>
                      <td className="py-3 text-center"><div className="h-4 w-8 bg-gray-200 rounded mx-auto"></div></td>
                      <td className="py-3 text-center"><div className="h-6 w-16 bg-gray-200 rounded mx-auto"></div></td>
                      <td className="py-3 text-center"><div className="h-8 w-24 bg-gray-200 rounded mx-auto"></div></td>
                    </tr>
                  ))
                ) : units.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <Ruler className="w-16 h-16 text-gray-300" />
                        <p className="text-gray-500 font-medium">Aucune unité trouvée</p>
                        <button
                          onClick={() => navigate('/unites-mesure/nouveau')}
                          className="btn btn-primary btn-sm gap-2"
                        >
                          <Plus className="w-4 h-4" /> Ajouter une unité
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  units.map(unit => (
                    <tr key={unit.id} className="hover:bg-gray-50">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            {getTypeIcon(unit.type)}
                          </div>
                          <div>
                            <p className="font-semibold">{unit.name}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">{unit.symbol}</code>
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="badge badge-ghost">{getTypeLabel(unit.type)}</span>
                      </td>
                      <td className="text-center">
                        <span className="font-semibold">{unit.conversion_factor}</span>
                      </td>
                      <td className="text-center">
                        {unit.is_base_unit ? (
                          <CheckCircle className="w-5 h-5 text-success mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="text-center">
                        {unit.is_active ? (
                          <span className="badge badge-success">Actif</span>
                        ) : (
                          <span className="badge badge-error">Inactif</span>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => navigate(`/unites-mesure/${unit.id}`)}
                            className="btn btn-ghost btn-sm btn-circle tooltip"
                            data-tip="Détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/unites-mesure/${unit.id}/modifier`)}
                            className="btn btn-ghost btn-sm btn-circle tooltip"
                            data-tip="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setUnitToDelete(unit);
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
            {units.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <Ruler className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucune unité trouvée</p>
              </div>
            ) : (
              units.map(unit => (
                <div
                  key={unit.id}
                  className="bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          {getTypeIcon(unit.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{unit.name}</h3>
                          <p className="text-xs text-gray-500">{unit.symbol}</p>
                        </div>
                      </div>
                      {unit.is_active ? (
                        <span className="badge badge-success">Actif</span>
                      ) : (
                        <span className="badge badge-error">Inactif</span>
                      )}
                    </div>

                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between items-center pt-2">
                        <div>
                          <p className="text-xs text-gray-500">Type</p>
                          <p className="font-medium">{getTypeLabel(unit.type)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Facteur</p>
                          <p className="font-medium">{unit.conversion_factor}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
                        <span>Unité de base : {unit.is_base_unit ? 'Oui' : 'Non'}</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-3 pt-2 border-t">
                      <button
                        onClick={() => navigate(`/unites-mesure/${unit.id}`)}
                        className="btn btn-sm btn-ghost"
                      >
                        Détails
                      </button>
                      <button
                        onClick={() => navigate(`/unites-mesure/${unit.id}/modifier`)}
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
const UnitesMesure = () => (
  <ErrorBoundary>
    <UnitesMesureContent />
  </ErrorBoundary>
);

export default UnitesMesure;