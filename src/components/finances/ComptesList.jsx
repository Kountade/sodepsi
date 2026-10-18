// src/components/finances/ComptesList.jsx
// ============================================================
// VERSION OPTIMISÉE - Pagination serveur + debounce + filtres
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Building2, Plus, Search, Eye, Edit, Trash2, Loader2,
  RefreshCw, X, CheckCircle, AlertCircle,
  Filter, ChevronLeft, ChevronRight,
  ChevronDown, Boxes, AlertTriangle
} from 'lucide-react';

// ============================================================
// CONSTANTES
// ============================================================
const DEBOUNCE_MS = 400;

const TYPE_LABELS = {
  actif: 'Actif',
  passif: 'Passif',
  capitaux: 'Capitaux',
  produits: 'Produits',
  charges: 'Charges',
};

const TYPE_BADGES = {
  actif: 'badge-success',
  passif: 'badge-error',
  capitaux: 'badge-primary',
  produits: 'badge-info',
  charges: 'badge-warning',
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

// ============================================================
// COMPOSANT
// ============================================================
const ComptesList = () => {
  const navigate = useNavigate();

  // ==========================================================
  // ÉTATS - Données
  // ==========================================================
  const [comptes, setComptes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================================
  // ÉTATS - Filtres
  // ==========================================================
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [classeFilter, setClasseFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // ==========================================================
  // ÉTATS - UI
  // ==========================================================
  const [expandedRows, setExpandedRows] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isPaginated, setIsPaginated] = useState(true);

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
  // FETCH COMPTES
  // ==========================================================
  const fetchComptes = useCallback(async () => {
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
      if (classeFilter !== 'all') params.append('classe', classeFilter);
      params.append('page', currentPage);
      params.append('page_size', itemsPerPage);
      params.append('ordering', 'numero');

      const url = `/comptes-comptables/?${params.toString()}`;

      const response = await AxiosInstance.get(url, {
        headers: { Authorization: `Token ${token}` },
        signal: controller.signal,
      });

      const data = response.data;

      // ✅ Détection : réponse paginée DRF ou tableau brut
      if (data && typeof data === 'object' && Array.isArray(data.results)) {
        setComptes(data.results);
        setTotalCount(data.count ?? data.results.length);
        setIsPaginated(true);
      } else if (Array.isArray(data)) {
        setComptes(data);
        setTotalCount(data.length);
        setIsPaginated(false);
      } else {
        setComptes([]);
        setTotalCount(0);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;

      console.error('❌ Erreur chargement comptes :', err);

      let message = 'Erreur de chargement des comptes';
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
    classeFilter,
    currentPage,
    itemsPerPage,
    navigate,
    showNotification,
  ]);

  // ==========================================================
  // DÉCLENCHEUR
  // ==========================================================
  useEffect(() => {
    fetchComptes();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchComptes]);

  // Reset page si filtre change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, classeFilter]);

  // ==========================================================
  // ACTIONS
  // ==========================================================
  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce compte ?')) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/comptes-comptables/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      showNotification('Compte supprimé avec succès', 'success');
      fetchComptes();
    } catch (err) {
      console.error('❌ Erreur suppression :', err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Erreur lors de la suppression';
      showNotification(msg, 'error');
    }
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ==========================================================
  // PAGINATION
  // ==========================================================
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + comptes.length, totalCount);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  // ==========================================================
  // FILTRAGE LOCAL (arborescence)
  // ==========================================================
  const rootComptes = comptes.filter((c) => !c.parent);
  const getChildren = (parentId) =>
    comptes.filter((c) => c.parent === parentId);

  // ==========================================================
  // STATS (page courante)
  // ==========================================================
  const stats = {
    total: totalCount,
    actif: comptes.filter((c) => c.type === 'actif').length,
    passif: comptes.filter((c) => c.type === 'passif').length,
    produits: comptes.filter((c) => c.type === 'produits').length,
    charges: comptes.filter((c) => c.type === 'charges').length,
  };

  // ==========================================================
  // BADGES
  // ==========================================================
  const getTypeBadge = (type) => {
    const label = TYPE_LABELS[type] || type;
    const className = TYPE_BADGES[type] || 'badge-ghost';
    return <span className={`badge ${className}`}>{label}</span>;
  };

  const resetFilters = () => {
    setSearchInput('');
    setTypeFilter('all');
    setClasseFilter('all');
    setCurrentPage(1);
  };

  // ==========================================================
  // CHARGEMENT INITIAL
  // ==========================================================
  if (loading && comptes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-14 h-14 mx-auto" />
          <p className="text-lg font-medium text-gray-500">
            Chargement des comptes…
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

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Plan comptable
              </h1>
              {loading && comptes.length > 0 && (
                <Loader2 className="w-5 h-5 text-primary animate-spin ml-2" />
              )}
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Gestion des comptes comptables •{' '}
              <strong>{totalCount.toLocaleString('fr-FR')}</strong> compte(s)
              {!isPaginated && ' (total brut)'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchComptes}
              className="btn btn-sm sm:btn-md btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={() => navigate('/comptes-comptables/nouveau')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" /> Nouveau compte
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
            <Building2 className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Actif</p>
              <p className="text-xl font-bold text-success">{stats.actif}</p>
            </div>
            <Boxes className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Passif</p>
              <p className="text-xl font-bold text-error">{stats.passif}</p>
            </div>
            <Boxes className="w-8 h-8 text-error/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Produits / Charges</p>
              <p className="text-xl font-bold text-info">
                {stats.produits} / {stats.charges}
              </p>
            </div>
            <Boxes className="w-8 h-8 text-info/20" />
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
              placeholder="Rechercher par numéro ou nom…"
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Tous les types</option>
              <option value="actif">Actif</option>
              <option value="passif">Passif</option>
              <option value="capitaux">Capitaux propres</option>
              <option value="produits">Produits</option>
              <option value="charges">Charges</option>
            </select>
            <select
              className="select select-bordered w-full"
              value={classeFilter}
              onChange={(e) => setClasseFilter(e.target.value)}
            >
              <option value="all">Toutes les classes</option>
              <option value="1">Classe 1 - Capital</option>
              <option value="2">Classe 2 - Immobilisations</option>
              <option value="3">Classe 3 - Stocks</option>
              <option value="4">Classe 4 - Tiers</option>
              <option value="5">Classe 5 - Trésorerie</option>
              <option value="6">Classe 6 - Charges</option>
              <option value="7">Classe 7 - Produits</option>
              <option value="8">Classe 8 - Régularisation</option>
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
                <th className="py-3 px-4 w-10"></th>
                <th className="py-3 px-4">Numéro</th>
                <th className="py-3 px-4">Nom</th>
                <th className="py-3 px-4 hidden md:table-cell">Type</th>
                <th className="py-3 px-4 hidden lg:table-cell">Classe</th>
                <th className="py-3 px-4 text-right">Solde</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && comptes.length > 0 && (
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

              {rootComptes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Building2 className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">
                        Aucun compte trouvé
                      </p>
                      <p className="text-sm text-gray-400">
                        Ajustez vos filtres ou créez un compte
                      </p>
                      {(searchTerm ||
                        typeFilter !== 'all' ||
                        classeFilter !== 'all') && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={resetFilters}
                        >
                          Réinitialiser les filtres
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                rootComptes.map((compte) => {
                  const children = getChildren(compte.id);
                  const isExpanded = expandedRows[compte.id];

                  return (
                    <React.Fragment key={compte.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          {children.length > 0 && (
                            <button
                              onClick={() => toggleRow(compte.id)}
                              className="btn btn-ghost btn-xs btn-circle"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold">
                          {compte.numero}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-medium">{compte.nom}</span>
                            {compte.nom_complet && (
                              <p className="text-xs text-gray-400">
                                {compte.nom_complet}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          {getTypeBadge(compte.type)}
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          <span className="badge badge-ghost">
                            Classe {compte.classe}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-primary whitespace-nowrap">
                          {formatCurrency(compte.solde)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() =>
                                navigate(`/comptes-comptables/${compte.id}`)
                              }
                              className="btn btn-ghost btn-sm btn-circle tooltip"
                              data-tip="Voir"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                navigate(
                                  `/comptes-comptables/${compte.id}/modifier`
                                )
                              }
                              className="btn btn-ghost btn-sm btn-circle tooltip text-warning"
                              data-tip="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(compte.id)}
                              className="btn btn-ghost btn-sm btn-circle tooltip text-error"
                              data-tip="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded &&
                        children.map((child) => (
                          <tr
                            key={child.id}
                            className="hover:bg-gray-50 transition-colors bg-gray-50/50"
                          >
                            <td className="py-3 px-4"></td>
                            <td className="py-3 px-4 font-mono text-sm text-gray-600 pl-8">
                              {child.numero}
                            </td>
                            <td className="py-3 px-4 pl-8">
                              <span className="text-sm">
                                └─ {child.nom}
                              </span>
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell">
                              {getTypeBadge(child.type)}
                            </td>
                            <td className="py-3 px-4 hidden lg:table-cell">
                              <span className="badge badge-ghost badge-sm">
                                Classe {child.classe}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-primary text-sm whitespace-nowrap">
                              {formatCurrency(child.solde)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex justify-center gap-1">
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/comptes-comptables/${child.id}`
                                    )
                                  }
                                  className="btn btn-ghost btn-xs btn-circle tooltip"
                                  data-tip="Voir"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/comptes-comptables/${child.id}/modifier`
                                    )
                                  }
                                  className="btn btn-ghost btn-xs btn-circle tooltip text-warning"
                                  data-tip="Modifier"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination serveur */}
        {totalCount > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Affichage de <strong>{startIndex + 1}</strong> à{' '}
              <strong>{endIndex}</strong> sur <strong>{totalCount}</strong>{' '}
              comptes
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

      {/* Bandeau erreur */}
      {error && comptes.length > 0 && (
        <div className="alert alert-error shadow-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default ComptesList;