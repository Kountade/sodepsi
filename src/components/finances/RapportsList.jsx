// src/components/finances/RapportsList.jsx
// ============================================================
// VERSION OPTIMISÉE - Pagination serveur + debounce + filtres
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Search, Eye, Loader2, FileText,
  RefreshCw, Filter, X, AlertCircle, CheckCircle,
  Calendar, ChevronLeft, ChevronRight, Download,
  FilePieChart, FileSpreadsheet, AlertTriangle
} from 'lucide-react';

// ============================================================
// CONSTANTES
// ============================================================
const DEBOUNCE_MS = 400;

const TYPE_LABELS = {
  bilan: 'Bilan',
  compte_resultat: 'Compte de résultat',
  tresorerie: 'Trésorerie',
  budget: 'Suivi budgétaire',
  ventes: 'Ventes',
  depenses: 'Dépenses',
  achats: 'Achats',
  client: 'Client',
  fournisseur: 'Fournisseur',
};

const TYPE_BADGES = {
  bilan: 'badge-primary',
  compte_resultat: 'badge-success',
  tresorerie: 'badge-info',
  budget: 'badge-warning',
  ventes: 'badge-secondary',
  depenses: 'badge-error',
  achats: 'badge-ghost',
  client: 'badge-info',
  fournisseur: 'badge-warning',
};

// ============================================================
// HELPERS
// ============================================================
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
const RapportsList = () => {
  const navigate = useNavigate();

  // ----- Données -----
  const [rapports, setRapports] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ----- Filtres -----
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // ----- Pagination -----
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isPaginated, setIsPaginated] = useState(true);

  // ----- Téléchargement -----
  const [downloading, setDownloading] = useState(null);

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
  const fetchRapports = useCallback(async () => {
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
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      params.append('page', currentPage);
      params.append('page_size', itemsPerPage);
      params.append('ordering', '-created_at');

      const url = `/rapports-financiers/?${params.toString()}`;

      const response = await AxiosInstance.get(url, {
        headers: { Authorization: `Token ${token}` },
        signal: controller.signal,
      });

      const data = response.data;
      if (data && typeof data === 'object' && Array.isArray(data.results)) {
        setRapports(data.results);
        setTotalCount(data.count ?? data.results.length);
        setIsPaginated(true);
      } else if (Array.isArray(data)) {
        setRapports(data);
        setTotalCount(data.length);
        setIsPaginated(false);
      } else {
        setRapports([]);
        setTotalCount(0);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;

      console.error('❌ Erreur chargement rapports:', err);
      let message = 'Erreur de chargement des rapports';
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
    dateFrom,
    dateTo,
    currentPage,
    itemsPerPage,
    navigate,
    showNotification,
  ]);

  useEffect(() => {
    fetchRapports();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchRapports]);

  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, dateFrom, dateTo]);

  // ==========================================================
  // TÉLÉCHARGEMENT
  // ==========================================================
  const handleDownload = async (rapport) => {
    setDownloading(rapport.id);
    try {
      const token = getToken();

      // Si le fichier existe déjà, on le télécharge directement
      if (rapport.fichier) {
        const response = await AxiosInstance.get(
          `/rapports-financiers/${rapport.id}/download/`,
          {
            headers: { Authorization: `Token ${token}` },
            responseType: 'blob',
          }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const ext = rapport.format === 'excel' ? 'xlsx' : 'pdf';
        link.setAttribute('download', `rapport-${rapport.id}.${ext}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        showNotification('Rapport téléchargé avec succès', 'success');
      } else {
        showNotification('Ce rapport n\'a pas de fichier à télécharger', 'warning');
      }
    } catch (err) {
      console.error('❌ Erreur téléchargement:', err);
      showNotification('Erreur lors du téléchargement', 'error');
    } finally {
      setDownloading(null);
    }
  };

  // ==========================================================
  // PAGINATION
  // ==========================================================
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + rapports.length, totalCount);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  // ==========================================================
  // BADGES
  // ==========================================================
  const getTypeBadge = (type) => {
    const label = TYPE_LABELS[type] || type;
    const className = TYPE_BADGES[type] || 'badge-ghost';
    return <span className={`badge ${className}`}>{label}</span>;
  };

  const getFormatIcon = (format) => {
    if (format === 'excel') return <FileSpreadsheet className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const resetFilters = () => {
    setSearchInput('');
    setTypeFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  // ==========================================================
  // CHARGEMENT INITIAL
  // ==========================================================
  if (loading && rapports.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-purple-600 w-14 h-14 mx-auto" />
          <p className="text-lg font-medium text-gray-500">
            Chargement des rapports…
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
      <div className="bg-white border-b border-gray-200 shadow-sm w-full">
        <div className="w-full px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-xl">
                <FilePieChart className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Rapports financiers
                </h1>
                <p className="text-sm text-gray-500">
                  Gestion des rapports et états financiers •{' '}
                  <strong>{totalCount.toLocaleString('fr-FR')}</strong>{' '}
                  rapport(s)
                  {!isPaginated && ' (total brut)'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={fetchRapports}
                className="btn btn-sm btn-outline gap-2"
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                />
                Actualiser
              </button>
              <button
                onClick={() => navigate('/rapports-financiers/nouveau')}
                className="btn btn-sm btn-primary gap-2"
              >
                <Plus className="w-4 h-4" /> Générer un rapport
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="w-full px-6 py-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un rapport…"
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
              } sm:grid grid-cols-1 sm:grid-cols-4 gap-3`}
            >
              <select
                className="select select-bordered w-full"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">Tous les types</option>
                <option value="bilan">Bilan comptable</option>
                <option value="compte_resultat">Compte de résultat</option>
                <option value="tresorerie">Tableau de trésorerie</option>
                <option value="budget">Suivi budgétaire</option>
                <option value="ventes">Ventes</option>
                <option value="depenses">Dépenses</option>
                <option value="achats">Achats</option>
                <option value="client">Client</option>
                <option value="fournisseur">Fournisseur</option>
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
              <button className="btn btn-outline gap-2" onClick={resetFilters}>
                <RefreshCw className="w-4 h-4" /> Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="w-full px-6 pb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4">Nom</th>
                  <th className="py-3 px-4 hidden md:table-cell">Type</th>
                  <th className="py-3 px-4 hidden lg:table-cell">Période</th>
                  <th className="py-3 px-4 text-center">Format</th>
                  <th className="py-3 px-4 hidden md:table-cell">Date</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && rapports.length > 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-2 text-center text-xs text-gray-400"
                    >
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Mise à jour…
                    </td>
                  </tr>
                )}

                {rapports.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <FilePieChart className="w-16 h-16 text-gray-300" />
                        <p className="text-gray-500 font-medium">
                          Aucun rapport trouvé
                        </p>
                        {(searchTerm ||
                          typeFilter !== 'all' ||
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
                            navigate('/rapports-financiers/nouveau')
                          }
                          className="btn btn-primary btn-sm gap-2"
                        >
                          <Plus className="w-4 h-4" /> Générer un rapport
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rapports.map((rapport) => (
                    <tr
                      key={rapport.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold">
                        {rapport.nom}
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        {getTypeBadge(rapport.type)}
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {formatDate(rapport.date_debut)}
                          </div>
                          <div className="text-gray-400 text-xs">
                            → {formatDate(rapport.date_fin)}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="badge badge-ghost gap-1">
                          {getFormatIcon(rapport.format)}
                          {rapport.format?.toUpperCase() || 'PDF'}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell text-sm text-gray-500">
                        {formatDate(rapport.created_at)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() =>
                              navigate(`/rapports-financiers/${rapport.id}`)
                            }
                            className="btn btn-ghost btn-sm btn-circle tooltip"
                            data-tip="Voir"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {rapport.fichier && (
                            <button
                              onClick={() => handleDownload(rapport)}
                              className="btn btn-ghost btn-sm btn-circle tooltip text-primary"
                              data-tip="Télécharger"
                              disabled={downloading === rapport.id}
                            >
                              {downloading === rapport.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
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
                <strong>{endIndex}</strong> sur <strong>{totalCount}</strong>{' '}
                rapports
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

      {error && rapports.length > 0 && (
        <div className="mx-6 mb-6 alert alert-error shadow-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default RapportsList;