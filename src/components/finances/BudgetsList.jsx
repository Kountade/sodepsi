// src/components/finances/BudgetsList.jsx
// ============================================================
// VERSION OPTIMISÉE - Pagination serveur + debounce + filtres
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Wallet, Plus, Search, Eye, Edit, Trash2, Loader2,
  RefreshCw, X, CheckCircle, AlertCircle,
  Filter, ChevronLeft, ChevronRight,
  Calendar, AlertTriangle, PiggyBank, Clock
} from 'lucide-react';

// ============================================================
// CONSTANTES
// ============================================================
const DEBOUNCE_MS = 400;

const TYPE_LABELS = {
  annuel: 'Annuel',
  trimestriel: 'Trimestriel',
  mensuel: 'Mensuel',
  projet: 'Projet',
};

const TYPE_BADGES = {
  annuel: 'badge-primary',
  trimestriel: 'badge-info',
  mensuel: 'badge-secondary',
  projet: 'badge-warning',
};

const STATUT_LABELS = {
  en_cours: 'En cours',
  termine: 'Terminé',
  annule: 'Annulé',
};

const STATUT_BADGES = {
  en_cours: 'badge-info',
  termine: 'badge-success',
  annule: 'badge-error',
};

// ============================================================
// HELPERS
// ============================================================
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '0 FCFA';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0 FCFA';
  return `${num.toLocaleString('fr-FR')} FCFA`;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('fr-FR');
  } catch {
    return '-';
  }
};

const getPourcentageColor = (pourcentage) => {
  if (pourcentage >= 90) return 'text-red-600';
  if (pourcentage >= 75) return 'text-orange-500';
  if (pourcentage >= 50) return 'text-yellow-600';
  return 'text-green-600';
};

const getProgressColor = (pourcentage) => {
  if (pourcentage >= 90) return 'bg-red-500';
  if (pourcentage >= 75) return 'bg-orange-500';
  if (pourcentage >= 50) return 'bg-yellow-500';
  return 'bg-green-500';
};

// ============================================================
// COMPOSANT
// ============================================================
const BudgetsList = () => {
  const navigate = useNavigate();

  // ----- Données -----
  const [budgets, setBudgets] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ----- Filtres -----
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statutFilter, setStatutFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // ----- Pagination -----
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isPaginated, setIsPaginated] = useState(true);

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
  const fetchBudgets = useCallback(async () => {
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
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statutFilter !== 'all') params.append('statut', statutFilter);
      params.append('page', currentPage);
      params.append('page_size', itemsPerPage);
      params.append('ordering', '-date_debut');

      const url = `/budgets/?${params.toString()}`;

      const response = await AxiosInstance.get(url, {
        headers: { Authorization: `Token ${token}` },
        signal: controller.signal,
      });

      const data = response.data;
      if (data && typeof data === 'object' && Array.isArray(data.results)) {
        setBudgets(data.results);
        setTotalCount(data.count ?? data.results.length);
        setIsPaginated(true);
      } else if (Array.isArray(data)) {
        setBudgets(data);
        setTotalCount(data.length);
        setIsPaginated(false);
      } else {
        setBudgets([]);
        setTotalCount(0);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;

      console.error('❌ Erreur chargement budgets:', err);
      let message = 'Erreur de chargement des budgets';
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
    typeFilter,
    statutFilter,
    currentPage,
    itemsPerPage,
    navigate,
    showNotification,
  ]);

  useEffect(() => {
    fetchBudgets();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchBudgets]);

  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, statutFilter]);

  // ==========================================================
  // ACTIONS
  // ==========================================================
  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce budget ?')) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/budgets/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      showNotification('Budget supprimé avec succès', 'success');
      fetchBudgets();
    } catch (err) {
      console.error('❌ Erreur suppression:', err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Erreur lors de la suppression';
      showNotification(msg, 'error');
    }
  };

  // ==========================================================
  // PAGINATION
  // ==========================================================
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + budgets.length, totalCount);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  // ==========================================================
  // STATS (page courante)
  // ==========================================================
  const stats = {
    total: totalCount,
    en_cours: budgets.filter((b) => b.statut === 'en_cours').length,
    termine: budgets.filter((b) => b.statut === 'termine').length,
    annule: budgets.filter((b) => b.statut === 'annule').length,
    total_montant: budgets.reduce(
      (sum, b) => sum + (parseFloat(b.montant_total) || 0),
      0
    ),
  };

  // ==========================================================
  // BADGES
  // ==========================================================
  const getTypeBadge = (type) => {
    const label = TYPE_LABELS[type] || type;
    const className = TYPE_BADGES[type] || 'badge-ghost';
    return <span className={`badge ${className}`}>{label}</span>;
  };

  const getStatutBadge = (statut) => {
    const label = STATUT_LABELS[statut] || statut;
    const className = STATUT_BADGES[statut] || 'badge-ghost';
    return <span className={`badge ${className}`}>{label}</span>;
  };

  const resetFilters = () => {
    setSearchInput('');
    setTypeFilter('all');
    setStatutFilter('all');
    setCurrentPage(1);
  };

  // ==========================================================
  // CHARGEMENT INITIAL
  // ==========================================================
  if (loading && budgets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-green-600 w-14 h-14 mx-auto" />
          <p className="text-lg font-medium text-gray-500">
            Chargement des budgets…
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDU
  // ==========================================================
  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div
            className={`alert ${
              notification.type === 'success'
                ? 'alert-success'
                : notification.type === 'warning'
                ? 'alert-warning'
                : 'alert-error'
            } shadow-xl rounded-xl max-w-md`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5 shrink-0" />
              ) : notification.type === 'warning' ? (
                <AlertTriangle className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
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

      {/* En-tête */}
      <div className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-50 rounded-xl">
                <Wallet className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-green-600">
                  Budgets
                </h1>
                <p className="text-sm text-gray-500">
                  Planification et suivi budgétaire •{' '}
                  <strong>{totalCount.toLocaleString('fr-FR')}</strong> budget(s)
                  {!isPaginated && ' (total brut)'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={fetchBudgets}
                className="btn btn-sm sm:btn-md btn-outline gap-2"
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                />
                Actualiser
              </button>
              <button
                onClick={() => navigate('/budgets/nouveau')}
                className="btn btn-sm sm:btn-md bg-gradient-to-r from-green-600 to-green-700 text-white border-none shadow-lg gap-2"
              >
                <Plus className="w-4 h-4" /> Nouveau budget
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="w-full px-6 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white shadow-md rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-xl font-bold text-primary">{stats.total}</p>
              </div>
              <Wallet className="w-8 h-8 text-primary/20" />
            </div>
          </div>
          <div className="bg-white shadow-md rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">En cours</p>
                <p className="text-xl font-bold text-info">
                  {stats.en_cours}
                </p>
              </div>
              <Clock className="w-8 h-8 text-info/20" />
            </div>
          </div>
          <div className="bg-white shadow-md rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Terminés</p>
                <p className="text-xl font-bold text-success">
                  {stats.termine}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-success/20" />
            </div>
          </div>
          <div className="bg-white shadow-md rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Montant (page)</p>
                <p className="text-sm font-bold text-primary">
                  {formatCurrency(stats.total_montant)}
                </p>
              </div>
              <PiggyBank className="w-8 h-8 text-primary/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="w-full px-6 pb-4">
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un budget…"
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
              onClick={() => setShowFilters(!showFilters)}
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
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">Tous les types</option>
                <option value="annuel">Annuel</option>
                <option value="trimestriel">Trimestriel</option>
                <option value="mensuel">Mensuel</option>
                <option value="projet">Projet</option>
              </select>
              <select
                className="select select-bordered w-full"
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="annule">Annulé</option>
              </select>
              <button className="btn btn-outline gap-2" onClick={resetFilters}>
                <RefreshCw className="w-4 h-4" /> Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="w-full px-6 pb-6">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4">Nom</th>
                  <th className="py-3 px-4 hidden lg:table-cell">Type</th>
                  <th className="py-3 px-4 hidden md:table-cell">Période</th>
                  <th className="py-3 px-4 text-right">Montant total</th>
                  <th className="py-3 px-4 text-right">Utilisé</th>
                  <th className="py-3 px-4 text-center">Avancement</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && budgets.length > 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="py-2 text-center text-xs text-gray-400"
                    >
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Mise à jour…
                    </td>
                  </tr>
                )}

                {budgets.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <Wallet className="w-16 h-16 text-gray-300" />
                        <p className="text-gray-500 font-medium">
                          Aucun budget trouvé
                        </p>
                        {(searchTerm ||
                          typeFilter !== 'all' ||
                          statutFilter !== 'all') && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={resetFilters}
                          >
                            Réinitialiser les filtres
                          </button>
                        )}
                        <button
                          onClick={() => navigate('/budgets/nouveau')}
                          className="btn btn-success btn-sm gap-2"
                        >
                          <Plus className="w-4 h-4" /> Créer un budget
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  budgets.map((budget) => {
                    const pourcentage = budget.pourcentage_utilise || 0;
                    const isAlerte = pourcentage >= 80;

                    return (
                      <tr
                        key={budget.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 font-semibold">
                          {budget.nom}
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          {getTypeBadge(budget.type)}
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div className="text-sm">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              {formatDate(budget.date_debut)}
                            </div>
                            <div className="text-gray-400 text-xs">
                              → {formatDate(budget.date_fin)}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-primary whitespace-nowrap">
                          {formatCurrency(budget.montant_total)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-700 whitespace-nowrap">
                          {formatCurrency(budget.montant_utilise)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-24 h-2 bg-gray-200 rounded-full">
                              <div
                                className={`h-2 rounded-full transition-all ${getProgressColor(
                                  pourcentage
                                )}`}
                                style={{
                                  width: `${Math.min(pourcentage, 100)}%`,
                                }}
                              />
                            </div>
                            <span
                              className={`text-sm font-bold ${getPourcentageColor(
                                pourcentage
                              )}`}
                            >
                              {pourcentage.toFixed(0)}%
                            </span>
                            {isAlerte && (
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {getStatutBadge(budget.statut)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() =>
                                navigate(`/budgets/${budget.id}`)
                              }
                              className="btn btn-ghost btn-sm btn-circle tooltip"
                              data-tip="Voir"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                navigate(`/budgets/${budget.id}/modifier`)
                              }
                              className="btn btn-ghost btn-sm btn-circle tooltip text-warning"
                              data-tip="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {budget.statut !== 'termine' && (
                              <button
                                onClick={() => handleDelete(budget.id)}
                                className="btn btn-ghost btn-sm btn-circle tooltip text-error"
                                data-tip="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
              <div className="text-sm text-gray-500">
                Affichage de <strong>{startIndex + 1}</strong> à{' '}
                <strong>{endIndex}</strong> sur <strong>{totalCount}</strong>{' '}
                budgets
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
      </div>

      {error && budgets.length > 0 && (
        <div className="mx-6 mb-6 alert alert-error shadow-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default BudgetsList;