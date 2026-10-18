// src/components/finances/BudgetCategorieList.jsx
// ============================================================
// VERSION OPTIMISÉE - Pagination serveur + debounce + filtres
// ============================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, ChartPie,
  RefreshCw, X, CheckCircle, AlertCircle,
  Filter, ChevronLeft, ChevronRight,
  Loader2, AlertTriangle
} from 'lucide-react';

// ============================================================
// CONSTANTES
// ============================================================
const DEBOUNCE_MS = 400;

// ============================================================
// COMPOSANT
// ============================================================
const BudgetCategorieList = () => {
  const navigate = useNavigate();

  // ----- Données -----
  const [categories, setCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ----- Filtres -----
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // ----- Pagination -----
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isPaginated, setIsPaginated] = useState(true);

  // ----- Suppression -----
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categorieToDelete, setCategorieToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ----- Notification -----
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  const abortRef = useRef(null);

  // ==========================================================
  // NOTIFICATIONS
  // ==========================================================
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  }, []);

  const getToken = () => localStorage.getItem('Token');

  // ==========================================================
  // DEBOUNCE
  // ==========================================================
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setCurrentPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ==========================================================
  // FETCH
  // ==========================================================
  const fetchCategories = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (isActiveFilter !== 'all') {
        params.append('is_active', isActiveFilter === 'true' ? 'true' : 'false');
      }
      params.append('page', currentPage);
      params.append('page_size', itemsPerPage);
      params.append('ordering', 'nom');

      const url = `/budget-categories/?${params.toString()}`;

      const response = await AxiosInstance.get(url, {
        headers: { Authorization: `Token ${token}` },
        signal: controller.signal,
      });

      const data = response.data;
      if (data && typeof data === 'object' && Array.isArray(data.results)) {
        setCategories(data.results);
        setTotalCount(data.count ?? data.results.length);
        setIsPaginated(true);
      } else if (Array.isArray(data)) {
        setCategories(data);
        setTotalCount(data.length);
        setIsPaginated(false);
      } else {
        setCategories([]);
        setTotalCount(0);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;

      console.error('❌ Erreur chargement catégories:', err);
      let message = 'Erreur de chargement des catégories';
      if (err.response?.status === 401) {
        message = 'Session expirée. Veuillez vous reconnecter.';
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.data?.detail) {
        message = err.response.data.detail;
      }
      setError(message);
      showNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [
    searchTerm,
    isActiveFilter,
    currentPage,
    itemsPerPage,
    navigate,
    showNotification,
  ]);

  useEffect(() => {
    fetchCategories();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchCategories]);

  useEffect(() => {
    setCurrentPage(1);
  }, [isActiveFilter]);

  // ==========================================================
  // ACTIONS
  // ==========================================================
  const handleDelete = async () => {
    if (!categorieToDelete) return;
    setDeleting(true);
    try {
      const token = getToken();
      await AxiosInstance.delete(`/budget-categories/${categorieToDelete.id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      showNotification('Catégorie supprimée avec succès', 'success');
      setShowDeleteModal(false);
      setCategorieToDelete(null);
      fetchCategories();
    } catch (err) {
      console.error('❌ Erreur suppression:', err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Erreur lors de la suppression';
      showNotification(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      const token = getToken();
      await AxiosInstance.patch(
        `/budget-categories/${id}/`,
        { is_active: !isActive },
        { headers: { Authorization: `Token ${token}` } }
      );
      showNotification(
        `Catégorie ${!isActive ? 'activée' : 'désactivée'} avec succès`,
        'success'
      );
      fetchCategories();
    } catch (err) {
      console.error('❌ Erreur toggle:', err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Erreur lors de la modification';
      showNotification(msg, 'error');
    }
  };

  // ==========================================================
  // PAGINATION
  // ==========================================================
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + categories.length, totalCount);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  // ==========================================================
  // STATS (page courante)
  // ==========================================================
  const stats = {
    total: totalCount,
    actif: categories.filter((c) => c.is_active).length,
    inactif: categories.filter((c) => !c.is_active).length,
  };

  const resetFilters = () => {
    setSearchInput('');
    setIsActiveFilter('all');
    setCurrentPage(1);
  };

  // ==========================================================
  // CHARGEMENT INITIAL
  // ==========================================================
  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">
            Chargement des catégories…
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDU
  // ==========================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown max-w-md">
          <div
            className={`alert ${
              notification.type === 'success'
                ? 'alert-success'
                : notification.type === 'warning'
                ? 'alert-warning'
                : 'alert-error'
            } shadow-xl rounded-xl`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : notification.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="font-medium text-sm">{notification.message}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() =>
                setNotification((prev) => ({ ...prev, show: false }))
              }
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Modal suppression */}
      {showDeleteModal && categorieToDelete && (
        <div className="modal modal-open z-50">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">
                Confirmer la suppression
              </h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">
                Voulez-vous vraiment supprimer cette catégorie ?
              </p>
              <p className="font-semibold text-error mt-2">
                {categorieToDelete.nom}
              </p>
              <p className="text-sm text-gray-500 font-mono">
                Code : {categorieToDelete.code}
              </p>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button
                className="btn btn-ghost flex-1"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Annuler
              </button>
              <button
                className="btn btn-error flex-1 gap-2"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Supprimer
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
                <ChartPie className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Catégories de Budget
              </h1>
              {loading && categories.length > 0 && (
                <Loader2 className="w-5 h-5 text-primary animate-spin ml-2" />
              )}
            </div>
            <p className="text-sm text-gray-500 ml-1">
              <strong>{totalCount.toLocaleString('fr-FR')}</strong>{' '}
              catégorie(s) • {stats.actif} active(s)
              {!isPaginated && ' (total brut)'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchCategories}
              className="btn btn-sm sm:btn-md btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={() => navigate('/budget-categories/nouveau')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" /> Nouvelle catégorie
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold text-primary">{stats.total}</p>
            </div>
            <ChartPie className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Actives</p>
              <p className="text-xl font-bold text-success">{stats.actif}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Inactives</p>
              <p className="text-xl font-bold text-gray-400">
                {stats.inactif}
              </p>
            </div>
            <X className="w-8 h-8 text-gray-400/20" />
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
              placeholder="Rechercher par nom ou code…"
              className="input input-bordered w-full pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
                onClick={() => setSearchInput('')}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className="btn btn-outline btn-sm sm:hidden gap-2"
          >
            <Filter className="w-4 h-4" />{' '}
            {showFilters ? 'Masquer filtres' : 'Afficher filtres'}
          </button>

          <div
            className={`${
              showFilters ? 'grid' : 'hidden'
            } sm:grid grid-cols-1 sm:grid-cols-3 gap-3`}
          >
            <select
              className="select select-bordered w-full"
              value={isActiveFilter}
              onChange={(e) => setIsActiveFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="true">Actives</option>
              <option value="false">Inactives</option>
            </select>
            <button className="btn btn-outline gap-2" onClick={resetFilters}>
              <RefreshCw className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Nom</th>
                <th className="py-3 px-4 hidden lg:table-cell">Description</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && categories.length > 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="py-2 text-center text-xs text-gray-400"
                  >
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Mise à jour…
                  </td>
                </tr>
              )}

              {categories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <ChartPie className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">
                        Aucune catégorie trouvée
                      </p>
                      {(searchTerm || isActiveFilter !== 'all') && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={resetFilters}
                        >
                          Réinitialiser les filtres
                        </button>
                      )}
                      <button
                        onClick={() => navigate('/budget-categories/nouveau')}
                        className="btn btn-primary btn-sm gap-2"
                      >
                        <Plus className="w-4 h-4" /> Créer une catégorie
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((categorie) => (
                  <tr
                    key={categorie.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-semibold">
                      {categorie.code}
                    </td>
                    <td className="py-3 px-4 font-medium">{categorie.nom}</td>
                    <td className="py-3 px-4 hidden lg:table-cell text-sm text-gray-600">
                      {categorie.description || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`badge ${
                          categorie.is_active ? 'badge-success' : 'badge-ghost'
                        }`}
                      >
                        {categorie.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() =>
                            navigate(
                              `/budget-categories/${categorie.id}/modifier`
                            )
                          }
                          className="btn btn-ghost btn-sm btn-circle tooltip text-warning"
                          data-tip="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleToggleActive(
                              categorie.id,
                              categorie.is_active
                            )
                          }
                          className={`btn btn-sm btn-circle tooltip ${
                            categorie.is_active
                              ? 'btn-ghost text-error'
                              : 'btn-ghost text-success'
                          }`}
                          data-tip={
                            categorie.is_active ? 'Désactiver' : 'Activer'
                          }
                        >
                          {categorie.is_active ? (
                            <X className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setCategorieToDelete(categorie);
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

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Affichage de <strong>{startIndex + 1}</strong> à{' '}
              <strong>{endIndex}</strong> sur <strong>{totalCount}</strong>
            </div>
            <div className="flex items-center gap-3">
              <select
                className="select select-bordered select-sm"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value, 10));
                  setCurrentPage(1);
                }}
              >
                <option value="5">5 lignes</option>
                <option value="10">10 lignes</option>
                <option value="20">20 lignes</option>
                <option value="50">50 lignes</option>
              </select>
              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1 || loading}
                >
                  «
                </button>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="join-item btn btn-sm btn-disabled">
                  {currentPage} / {totalPages || 1}
                </span>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages || loading}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage >= totalPages || loading}
                >
                  »
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && categories.length > 0 && (
        <div className="alert alert-error shadow-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default BudgetCategorieList;