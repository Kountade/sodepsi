// src/components/finances/EcrituresList.jsx
// ============================================================
// VERSION OPTIMISÉE - Pagination serveur + debounce + filtres
// ============================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Search, FileText, RefreshCw, X,
  CheckCircle, AlertCircle, Eye, Filter,
  ChevronLeft, ChevronRight, Calendar,
  ArrowLeftRight, Loader2, AlertTriangle,
  TrendingUp, TrendingDown
} from 'lucide-react';

// ============================================================
// CONSTANTES
// ============================================================
const DEBOUNCE_MS = 400;

const TYPE_LABELS = {
  vente: 'Vente',
  achat: 'Achat',
  paiement_client: 'Paiement client',
  paiement_fournisseur: 'Paiement fournisseur',
  recette: 'Recette',
  depense: 'Dépense',
  tresorerie: 'Trésorerie',
  regularisation: 'Régularisation',
  autre: 'Autre',
};

const STATUT_LABELS = {
  brouillon: 'Brouillon',
  valide: 'Validée',
  annulee: 'Annulée',
};

const STATUT_BADGES = {
  brouillon: 'badge-ghost',
  valide: 'badge-success',
  annulee: 'badge-error',
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
const EcrituresList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const compteParam = searchParams.get('compte');

  // ----- Données -----
  const [ecritures, setEcritures] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ----- Filtres -----
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statutFilter, setStatutFilter] = useState('all');
  const [compteFilter, setCompteFilter] = useState(compteParam || '');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // ----- Pagination -----
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
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
  const fetchEcritures = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statutFilter !== 'all') params.append('statut', statutFilter);
      if (compteFilter) params.append('compte', compteFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      params.append('page', currentPage);
      params.append('page_size', itemsPerPage);
      params.append('ordering', '-date_ecriture');

      const url = `/ecritures-comptables/?${params.toString()}`;

      const response = await AxiosInstance.get(url, {
        headers: { Authorization: `Token ${token}` },
        signal: controller.signal,
      });

      const data = response.data;
      if (data && typeof data === 'object' && Array.isArray(data.results)) {
        setEcritures(data.results);
        setTotalCount(data.count ?? data.results.length);
        setIsPaginated(true);
      } else if (Array.isArray(data)) {
        setEcritures(data);
        setTotalCount(data.length);
        setIsPaginated(false);
      } else {
        setEcritures([]);
        setTotalCount(0);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;

      console.error('❌ Erreur chargement écritures :', err);
      let message = 'Erreur de chargement des écritures';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        message = 'Le serveur met trop de temps à répondre. Réessayez.';
      } else if (err.response?.status === 401) {
        message = 'Session expirée. Veuillez vous reconnecter.';
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 403) {
        message = 'Accès refusé.';
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
    compteFilter,
    dateFrom,
    dateTo,
    currentPage,
    itemsPerPage,
    navigate,
    showNotification,
  ]);

  useEffect(() => {
    fetchEcritures();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchEcritures]);

  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, statutFilter, compteFilter, dateFrom, dateTo]);

  // ==========================================================
  // PAGINATION
  // ==========================================================
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + ecritures.length, totalCount);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  // ==========================================================
  // STATS
  // ==========================================================
  const stats = {
    total: totalCount,
    brouillon: ecritures.filter((e) => e.statut === 'brouillon').length,
    valide: ecritures.filter((e) => e.statut === 'valide').length,
    annulee: ecritures.filter((e) => e.statut === 'annulee').length,
    totalMontant: ecritures.reduce(
      (sum, e) => sum + (parseFloat(e.montant) || 0),
      0
    ),
  };

  // ==========================================================
  // BADGES
  // ==========================================================
  const getStatutBadge = (statut) => {
    const label = STATUT_LABELS[statut] || statut;
    const className = STATUT_BADGES[statut] || 'badge-ghost';
    return <span className={`badge ${className}`}>{label}</span>;
  };

  const getTypeBadge = (type) => {
    const label = TYPE_LABELS[type] || type;
    return <span className="badge badge-info badge-outline">{label}</span>;
  };

  const resetFilters = () => {
    setSearchInput('');
    setTypeFilter('all');
    setStatutFilter('all');
    setCompteFilter('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  // ==========================================================
  // CHARGEMENT INITIAL
  // ==========================================================
  if (loading && ecritures.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">
            Chargement des écritures…
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
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Écritures comptables
              </h1>
              {loading && ecritures.length > 0 && (
                <Loader2 className="w-5 h-5 text-primary animate-spin ml-2" />
              )}
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Gérez vos écritures comptables •{' '}
              <strong>{totalCount.toLocaleString('fr-FR')}</strong>{' '}
              écriture(s)
              {!isPaginated && ' (total brut)'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchEcritures}
              className="btn btn-sm sm:btn-md btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              />
              Actualiser
            </button>
            <button
              onClick={() => navigate('/ecritures-comptables/nouveau')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" /> Nouvelle écriture
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
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
              <p className="text-xs text-gray-500">Brouillons</p>
              <p className="text-xl font-bold text-info">{stats.brouillon}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Validées</p>
              <p className="text-xl font-bold text-success">{stats.valide}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Annulées</p>
              <p className="text-xl font-bold text-error">{stats.annulee}</p>
            </div>
            <X className="w-8 h-8 text-error/20" />
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
              placeholder="Rechercher par numéro, description ou référence…"
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Tous les types</option>
              <option value="vente">Vente</option>
              <option value="achat">Achat</option>
              <option value="paiement_client">Paiement client</option>
              <option value="paiement_fournisseur">
                Paiement fournisseur
              </option>
              <option value="depense">Dépense</option>
              <option value="recette">Recette</option>
              <option value="tresorerie">Trésorerie</option>
              <option value="regularisation">Régularisation</option>
              <option value="autre">Autre</option>
            </select>
            <select
              className="select select-bordered w-full"
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="valide">Validée</option>
              <option value="annulee">Annulée</option>
            </select>
            <input
              type="date"
              className="input input-bordered"
              placeholder="Du"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <input
              type="date"
              className="input input-bordered"
              placeholder="Au"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            <button
              className="btn btn-outline gap-2"
              onClick={resetFilters}
            >
              <RefreshCw className="w-4 h-4" /> Réinitialiser
            </button>
          </div>

          {compteFilter && (
            <div className="alert alert-info py-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">
                Filtré sur le compte #{compteFilter}
              </span>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => setCompteFilter('')}
              >
                <X className="w-3 h-3" /> Retirer le filtre
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3">N°</th>
                <th className="py-3">Date</th>
                <th className="py-3">Description</th>
                <th className="py-3 hidden lg:table-cell">Type</th>
                <th className="py-3 text-right">Débit</th>
                <th className="py-3 text-right">Crédit</th>
                <th className="py-3 text-center">Statut</th>
                <th className="py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && ecritures.length > 0 && (
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

              {ecritures.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">
                        Aucune écriture trouvée
                      </p>
                      {(searchTerm ||
                        typeFilter !== 'all' ||
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
                        onClick={() =>
                          navigate('/ecritures-comptables/nouveau')
                        }
                        className="btn btn-primary btn-sm gap-2"
                      >
                        <Plus className="w-4 h-4" /> Créer une écriture
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                ecritures.map((ecriture) => (
                  <tr key={ecriture.id} className="hover:bg-gray-50">
                    <td className="py-3 font-mono text-sm">
                      {ecriture.numero}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatDate(ecriture.date_ecriture)}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="max-w-xs">
                        <p className="text-sm truncate">
                          {ecriture.description}
                        </p>
                        {ecriture.reference && (
                          <p className="text-xs text-gray-400 font-mono">
                            {ecriture.reference}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 hidden lg:table-cell">
                      {getTypeBadge(ecriture.type)}
                    </td>
                    <td className="py-3 text-right text-sm font-semibold text-success whitespace-nowrap">
                      {formatCurrency(ecriture.montant)}
                    </td>
                    <td className="py-3 text-right text-sm font-semibold text-error whitespace-nowrap">
                      {formatCurrency(ecriture.montant)}
                    </td>
                    <td className="py-3 text-center">
                      {getStatutBadge(ecriture.statut)}
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() =>
                            navigate(`/ecritures-comptables/${ecriture.id}`)
                          }
                          className="btn btn-ghost btn-sm btn-circle tooltip"
                          data-tip="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
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
                <option value="10">10 lignes</option>
                <option value="20">20 lignes</option>
                <option value="50">50 lignes</option>
                <option value="100">100 lignes</option>
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

      {error && ecritures.length > 0 && (
        <div className="alert alert-error shadow-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default EcrituresList;