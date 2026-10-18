// src/components/finances/DepensesList.jsx
// ============================================================
// VERSION OPTIMISÉE - Pagination serveur + debounce + filtres
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  TrendingDown, Plus, Search, Eye, Loader2,
  RefreshCw, X, CheckCircle, AlertCircle,
  Filter, ChevronLeft, ChevronRight,
  Calendar, Check, Ban, Clock, FileText,
  AlertTriangle
} from 'lucide-react';

// ============================================================
// CONSTANTES
// ============================================================
const DEBOUNCE_MS = 400;

const CATEGORIE_LABELS = {
  fournitures: 'Fournitures',
  utilities: 'Services',
  loyer: 'Loyer',
  salaires: 'Salaires',
  marketing: 'Marketing',
  transport: 'Transport',
  maintenance: 'Maintenance',
  formation: 'Formation',
  informatique: 'Informatique',
  telecommunication: 'Télécom',
  frais_bancaires: 'Frais bancaires',
  impots: 'Impôts',
  assurance: 'Assurance',
  frais_professionnels: 'Frais pro',
  achat_stock: 'Achat stock',
  autre: 'Autre',
};

const CATEGORIE_BADGES = {
  fournitures: 'badge-info',
  utilities: 'badge-primary',
  loyer: 'badge-warning',
  salaires: 'badge-success',
  marketing: 'badge-secondary',
  transport: 'badge-ghost',
  maintenance: 'badge-ghost',
  formation: 'badge-info',
  informatique: 'badge-primary',
  telecommunication: 'badge-secondary',
  frais_bancaires: 'badge-warning',
  impots: 'badge-error',
  assurance: 'badge-info',
  frais_professionnels: 'badge-ghost',
  achat_stock: 'badge-success',
  autre: 'badge-ghost',
};

const STATUT_LABELS = {
  en_attente: 'En attente',
  approuve: 'Approuvé',
  paye: 'Payé',
  annule: 'Annulé',
  rejete: 'Rejeté',
};

const STATUT_BADGES = {
  en_attente: 'badge-warning',
  approuve: 'badge-info',
  paye: 'badge-success',
  annule: 'badge-error',
  rejete: 'badge-error',
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

// ============================================================
// COMPOSANT
// ============================================================
const DepensesList = () => {
  const navigate = useNavigate();

  // ----- Données -----
  const [depenses, setDepenses] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ----- Filtres -----
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categorieFilter, setCategorieFilter] = useState('all');
  const [statutFilter, setStatutFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // ----- Pagination -----
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isPaginated, setIsPaginated] = useState(true);

  // ----- Actions -----
  const [actionLoading, setActionLoading] = useState(false);

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
  const fetchDepenses = useCallback(async () => {
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
      if (categorieFilter !== 'all') params.append('categorie', categorieFilter);
      if (statutFilter !== 'all') params.append('statut', statutFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      params.append('page', currentPage);
      params.append('page_size', itemsPerPage);
      params.append('ordering', '-date_depense');

      const url = `/depenses/?${params.toString()}`;

      const response = await AxiosInstance.get(url, {
        headers: { Authorization: `Token ${token}` },
        signal: controller.signal,
      });

      const data = response.data;
      if (data && typeof data === 'object' && Array.isArray(data.results)) {
        setDepenses(data.results);
        setTotalCount(data.count ?? data.results.length);
        setIsPaginated(true);
      } else if (Array.isArray(data)) {
        setDepenses(data);
        setTotalCount(data.length);
        setIsPaginated(false);
      } else {
        setDepenses([]);
        setTotalCount(0);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;

      console.error('❌ Erreur chargement dépenses:', err);
      let message = 'Erreur de chargement des dépenses';
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
    categorieFilter,
    statutFilter,
    dateFrom,
    dateTo,
    currentPage,
    itemsPerPage,
    navigate,
    showNotification,
  ]);

  useEffect(() => {
    fetchDepenses();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchDepenses]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categorieFilter, statutFilter, dateFrom, dateTo]);

  // ==========================================================
  // ACTIONS
  // ==========================================================
  const handleApprouver = async (id) => {
    if (!window.confirm('Approuver cette dépense ?')) return;
    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(
        `/depenses/${id}/approuver/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      showNotification('Dépense approuvée avec succès', 'success');
      fetchDepenses();
    } catch (err) {
      console.error('❌ Erreur approbation:', err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Erreur lors de l'approbation";
      showNotification(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayer = async (id) => {
    if (!window.confirm('Marquer cette dépense comme payée ?')) return;
    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(
        `/depenses/${id}/payer/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      showNotification('Dépense marquée comme payée', 'success');
      fetchDepenses();
    } catch (err) {
      console.error('❌ Erreur paiement:', err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Erreur lors du paiement';
      showNotification(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejeter = async (id) => {
    if (!window.confirm('Rejeter cette dépense ?')) return;
    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(
        `/depenses/${id}/rejeter/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      showNotification('Dépense rejetée', 'success');
      fetchDepenses();
    } catch (err) {
      console.error('❌ Erreur rejet:', err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Erreur lors du rejet';
      showNotification(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================================
  // PAGINATION
  // ==========================================================
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + depenses.length, totalCount);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  // ==========================================================
  // STATS
  // ==========================================================
  const stats = {
    total: totalCount,
    en_attente: depenses.filter((d) => d.statut === 'en_attente').length,
    approuve: depenses.filter((d) => d.statut === 'approuve').length,
    paye: depenses.filter((d) => d.statut === 'paye').length,
  };

  // ==========================================================
  // BADGES
  // ==========================================================
  const getCategorieBadge = (categorie) => {
    const label = CATEGORIE_LABELS[categorie] || categorie;
    const className = CATEGORIE_BADGES[categorie] || 'badge-ghost';
    return <span className={`badge ${className}`}>{label}</span>;
  };

  const getStatutBadge = (statut) => {
    const label = STATUT_LABELS[statut] || statut;
    const className = STATUT_BADGES[statut] || 'badge-ghost';
    return <span className={`badge ${className}`}>{label}</span>;
  };

  const resetFilters = () => {
    setSearchInput('');
    setCategorieFilter('all');
    setStatutFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  // ==========================================================
  // CHARGEMENT INITIAL
  // ==========================================================
  if (loading && depenses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-error w-14 h-14 mx-auto" />
          <p className="text-lg font-medium text-gray-500">
            Chargement des dépenses…
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

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-error/10 via-error/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-error/10 rounded-xl">
                <TrendingDown className="w-7 h-7 text-error" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-error">
                Dépenses
              </h1>
              {loading && depenses.length > 0 && (
                <Loader2 className="w-5 h-5 text-error animate-spin ml-2" />
              )}
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Gestion des dépenses •{' '}
              <strong>{totalCount.toLocaleString('fr-FR')}</strong> dépense(s)
              {!isPaginated && ' (total brut)'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchDepenses}
              className="btn btn-sm sm:btn-md btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={() => navigate('/depenses/nouveau')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-error to-error/80 text-white border-none shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" /> Nouvelle dépense
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold text-primary">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">En attente</p>
              <p className="text-xl font-bold text-warning">
                {stats.en_attente}
              </p>
            </div>
            <Clock className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Approuvées</p>
              <p className="text-xl font-bold text-info">{stats.approuve}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Payées</p>
              <p className="text-xl font-bold text-success">{stats.paye}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success/20" />
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
              placeholder="Rechercher par référence ou description…"
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
            } sm:grid grid-cols-1 sm:grid-cols-5 gap-3`}
          >
            <select
              className="select select-bordered w-full"
              value={categorieFilter}
              onChange={(e) => setCategorieFilter(e.target.value)}
            >
              <option value="all">Toutes les catégories</option>
              <option value="fournitures">Fournitures</option>
              <option value="utilities">Services</option>
              <option value="loyer">Loyer</option>
              <option value="salaires">Salaires</option>
              <option value="marketing">Marketing</option>
              <option value="transport">Transport</option>
              <option value="maintenance">Maintenance</option>
              <option value="formation">Formation</option>
              <option value="informatique">Informatique</option>
              <option value="achat_stock">Achat stock</option>
              <option value="autre">Autre</option>
            </select>
            <select
              className="select select-bordered w-full"
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="approuve">Approuvé</option>
              <option value="paye">Payé</option>
              <option value="annule">Annulé</option>
              <option value="rejete">Rejeté</option>
            </select>
            <input
              type="date"
              className="input input-bordered"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <input
              type="date"
              className="input input-bordered"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
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
                <th className="py-3 px-4">Référence</th>
                <th className="py-3 px-4 hidden lg:table-cell">Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 hidden md:table-cell">Catégorie</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && depenses.length > 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="py-2 text-center text-xs text-gray-400"
                  >
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Mise à jour…
                  </td>
                </tr>
              )}

              {depenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <TrendingDown className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">
                        Aucune dépense trouvée
                      </p>
                      {(searchTerm ||
                        categorieFilter !== 'all' ||
                        statutFilter !== 'all' ||
                        dateFrom ||
                        dateTo) && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={resetFilters}
                        >
                          Réinitialiser les filtres
                        </button>
                      )}
                      <button
                        onClick={() => navigate('/depenses/nouveau')}
                        className="btn btn-error btn-sm gap-2"
                      >
                        <Plus className="w-4 h-4" /> Créer une dépense
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                depenses.map((depense) => (
                  <tr key={depense.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono font-semibold">
                      {depense.reference}
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatDate(depense.date_depense)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-medium text-sm">
                          {depense.description}
                        </span>
                        {depense.supplier_name && (
                          <p className="text-xs text-gray-400">
                            {depense.supplier_name}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      {getCategorieBadge(depense.categorie)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-error whitespace-nowrap">
                      {formatCurrency(depense.total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatutBadge(depense.statut)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-1 flex-wrap">
                        <button
                          onClick={() => navigate(`/depenses/${depense.id}`)}
                          className="btn btn-ghost btn-sm btn-circle tooltip"
                          data-tip="Voir"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {depense.statut === 'en_attente' && (
                          <>
                            <button
                              onClick={() => handleApprouver(depense.id)}
                              className="btn btn-ghost btn-sm btn-circle tooltip text-success"
                              data-tip="Approuver"
                              disabled={actionLoading}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejeter(depense.id)}
                              className="btn btn-ghost btn-sm btn-circle tooltip text-error"
                              data-tip="Rejeter"
                              disabled={actionLoading}
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {depense.statut === 'approuve' && (
                          <button
                            onClick={() => handlePayer(depense.id)}
                            className="btn btn-ghost btn-sm btn-circle tooltip text-primary"
                            data-tip="Payer"
                            disabled={actionLoading}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
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

      {error && depenses.length > 0 && (
        <div className="alert alert-error shadow-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default DepensesList;