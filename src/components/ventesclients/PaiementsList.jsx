// src/components/paiements/PaiementsList.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Search, CreditCard, RefreshCw, X, CheckCircle,
  AlertCircle, Eye, Filter, ChevronLeft, ChevronRight,
  Calendar, Download, Trash2, Loader2, Wallet, Send,
  Phone, Users, DollarSign
} from 'lucide-react';

// ============================================================
// CONSTANTES
// ============================================================

const METHOD_LABELS = {
  cash: 'Espèces',
  card: 'Carte',
  check: 'Chèque',
  transfer: 'Virement',
  mobile_money: 'Mobile Money',
  credit: 'Crédit',
  wallet: 'Porte-monnaie',
};

const METHOD_BADGES = {
  cash: 'badge-success',
  card: 'badge-info',
  check: 'badge-warning',
  transfer: 'badge-primary',
  mobile_money: 'badge-secondary',
  credit: 'badge-error',
  wallet: 'badge-accent',
};

const DEBOUNCE_MS = 400;

// ============================================================
// HELPERS DE FORMATAGE
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
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

const PaiementsList = () => {
  const navigate = useNavigate();

  // ----- État des données -----
  const [paiements, setPaiements] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ----- État des filtres -----
  const [searchInput, setSearchInput] = useState('');       // valeur brute du champ
  const [searchTerm, setSearchTerm] = useState('');         // valeur debouncée
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // ----- État de pagination -----
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isPaginated, setIsPaginated] = useState(true); // détecté au 1er appel

  // ----- État suppression -----
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [paiementToDelete, setPaiementToDelete] = useState(null);

  // ----- Notification -----
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  // ----- Téléchargement PDF -----
  const [downloading, setDownloading] = useState(null);

  // ----- AbortController pour annuler les requêtes obsolètes -----
  const abortRef = useRef(null);

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  }, []);

  // ============================================================
  // DEBOUNCE DE LA RECHERCHE
  // ============================================================
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setCurrentPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ============================================================
  // FETCH DES PAIEMENTS
  // ============================================================
  const fetchPaiements = useCallback(async () => {
    // Annule la requête précédente si elle est encore en cours
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (methodFilter !== 'all') params.append('method', methodFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (searchTerm) params.append('search', searchTerm);

      // Pagination serveur
      params.append('page', currentPage);
      params.append('page_size', itemsPerPage);

      const url = `/payments/?${params.toString()}`;

      const response = await AxiosInstance.get(url, {
        signal: controller.signal,
      });

      // ✅ Détection : réponse paginée DRF ou tableau brut
      const data = response.data;
      if (data && typeof data === 'object' && Array.isArray(data.results)) {
        // Format paginé DRF
        setPaiements(data.results);
        setTotalCount(data.count ?? data.results.length);
        setIsPaginated(true);
      } else if (Array.isArray(data)) {
        // Format brut (backend pas encore paginé)
        setPaiements(data);
        setTotalCount(data.length);
        setIsPaginated(false);
      } else {
        setPaiements([]);
        setTotalCount(0);
      }
    } catch (err) {
      // Ignore les erreurs d'annulation
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;

      console.error('❌ Erreur chargement paiements :', err);

      let message = 'Erreur de chargement des paiements';
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
    methodFilter,
    dateFrom,
    dateTo,
    searchTerm,
    currentPage,
    itemsPerPage,
    navigate,
    showNotification,
  ]);

  // ============================================================
  // DÉCLENCHEUR DE FETCH
  // ============================================================
  useEffect(() => {
    fetchPaiements();
    // Nettoyage : annule la requête au démontage
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchPaiements]);

  // Reset page si un filtre change (sauf la recherche déjà gérée)
  useEffect(() => {
    setCurrentPage(1);
  }, [methodFilter, dateFrom, dateTo]);

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    if (!paiementToDelete) return;
    try {
      await AxiosInstance.delete(`/payments/${paiementToDelete.id}/`);
      showNotification('Paiement supprimé avec succès', 'success');
      setShowDeleteModal(false);
      setPaiementToDelete(null);
      fetchPaiements();
    } catch (err) {
      console.error('❌ Erreur suppression :', err);
      const msg =
        err.response?.data?.detail ||
        'Erreur lors de la suppression du paiement';
      showNotification(msg, 'error');
    }
  };

  // ============================================================
  // TÉLÉCHARGEMENT PDF
  // ============================================================
  const handleDownloadPdf = async (paiementId) => {
    setDownloading(paiementId);
    try {
      // Si tu as une route dédiée PDF :
      // navigate(`/paiements/${paiementId}/pdf`);
      // Sinon, on peut ouvrir dans un nouvel onglet :
      window.open(`/paiements/${paiementId}/pdf`, '_blank');
    } catch (err) {
      console.error('Erreur téléchargement PDF :', err);
      showNotification('Erreur lors du téléchargement du PDF', 'error');
    } finally {
      setTimeout(() => setDownloading(null), 800);
    }
  };

  // ============================================================
  // STATS (sur la page courante)
  // ============================================================
  const stats = {
    total: totalCount,
    totalAmount: paiements.reduce(
      (sum, p) => sum + parseFloat(p.amount || 0),
      0
    ),
    cash: paiements.filter((p) => p.method === 'cash').length,
    card: paiements.filter((p) => p.method === 'card').length,
    transfer: paiements.filter((p) => p.method === 'transfer').length,
    mobile_money: paiements.filter((p) => p.method === 'mobile_money').length,
  };

  // ============================================================
  // PAGINATION
  // ============================================================
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + paiements.length, totalCount);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  // ============================================================
  // RENDU : badge méthode
  // ============================================================
  const renderMethodBadge = (method) => {
    const label = METHOD_LABELS[method] || method;
    const className = METHOD_BADGES[method] || 'badge-ghost';
    return <span className={`badge ${className} badge-sm`}>{label}</span>;
  };

  // ============================================================
  // RENDU : loader
  // ============================================================
  if (loading && paiements.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">
            Chargement des paiements…
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* ---------- NOTIFICATION ---------- */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div
            className={`alert ${
              notification.type === 'success'
                ? 'alert-success'
                : 'alert-error'
            } shadow-xl rounded-xl max-w-md`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
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

      {/* ---------- MODAL SUPPRESSION ---------- */}
      {showDeleteModal && paiementToDelete && (
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
                Voulez-vous vraiment supprimer ce paiement ?
              </p>
              <p className="font-semibold text-error mt-2">
                #{paiementToDelete.id}
              </p>
              <p className="text-sm text-gray-500">
                {formatCurrency(paiementToDelete.amount)}
              </p>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button
                className="btn btn-ghost flex-1"
                onClick={() => setShowDeleteModal(false)}
              >
                Annuler
              </button>
              <button
                className="btn btn-error flex-1 gap-2"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- EN-TÊTE ---------- */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <CreditCard className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Paiements
              </h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              {stats.total} paiement(s) — {formatCurrency(stats.totalAmount)}{' '}
              {!isPaginated && '(total brut)'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchPaiements}
              className="btn btn-sm sm:btn-md btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              />
              Actualiser
            </button>
            <button
              onClick={() => navigate('/paiements/nouveau')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" /> Nouveau paiement
            </button>
          </div>
        </div>
      </div>

      {/* ---------- STATISTIQUES ---------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold text-primary">{stats.total}</p>
            </div>
            <CreditCard className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Espèces</p>
              <p className="text-xl font-bold text-success">{stats.cash}</p>
            </div>
            <Wallet className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Carte</p>
              <p className="text-xl font-bold text-info">{stats.card}</p>
            </div>
            <CreditCard className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Virement</p>
              <p className="text-xl font-bold text-primary">
                {stats.transfer}
              </p>
            </div>
            <Send className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Mobile Money</p>
              <p className="text-xl font-bold text-secondary">
                {stats.mobile_money}
              </p>
            </div>
            <Phone className="w-8 h-8 text-secondary/20" />
          </div>
        </div>
      </div>

      {/* ---------- FILTRES ---------- */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par facture, client ou référence…"
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
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="all">Toutes les méthodes</option>
              <option value="cash">Espèces</option>
              <option value="card">Carte bancaire</option>
              <option value="check">Chèque</option>
              <option value="transfer">Virement</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="credit">Crédit</option>
              <option value="wallet">Porte-monnaie</option>
            </select>
            <input
              type="date"
              className="input input-bordered"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="Du"
            />
            <input
              type="date"
              className="input input-bordered"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="Au"
            />
          </div>
        </div>
      </div>

      {/* ---------- TABLEAU ---------- */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Facture</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4 hidden lg:table-cell">Date</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4 text-center">Méthode</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && paiements.length > 0 && (
                <tr>
                  <td colSpan="7" className="py-2 text-center text-xs text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Mise à jour…
                  </td>
                </tr>
              )}

              {paiements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <CreditCard className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">
                        Aucun paiement trouvé
                      </p>
                      {(searchTerm || methodFilter !== 'all' || dateFrom || dateTo) && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setSearchInput('');
                            setMethodFilter('all');
                            setDateFrom('');
                            setDateTo('');
                          }}
                        >
                          Réinitialiser les filtres
                        </button>
                      )}
                      <button
                        onClick={() => navigate('/paiements/nouveau')}
                        className="btn btn-primary btn-sm gap-2"
                      >
                        <Plus className="w-4 h-4" /> Enregistrer un paiement
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paiements.map((paiement) => (
                  <tr
                    key={paiement.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-sm">
                      #{paiement.id}
                    </td>
                    <td className="py-3 px-4 font-mono text-sm">
                      {paiement.facture_number ||
                        paiement.sale_invoice_number ||
                        '-'}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {paiement.client_name || '-'}
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatDate(paiement.payment_date)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-primary whitespace-nowrap">
                      {formatCurrency(paiement.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {renderMethodBadge(paiement.method)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => navigate(`/paiements/${paiement.id}`)}
                          className="btn btn-ghost btn-sm btn-circle tooltip"
                          data-tip="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          className={`btn btn-sm btn-circle tooltip ${
                            downloading === paiement.id
                              ? 'btn-primary'
                              : 'btn-ghost text-primary'
                          }`}
                          data-tip="Télécharger le reçu PDF"
                          onClick={() => handleDownloadPdf(paiement.id)}
                          disabled={downloading === paiement.id}
                        >
                          {downloading === paiement.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setPaiementToDelete(paiement);
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

        {/* ---------- PAGINATION ---------- */}
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
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1 || totalPages === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="join-item btn btn-sm btn-disabled">
                  Page {currentPage} / {totalPages || 1}
                </span>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages || totalPages === 0}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ---------- BANDEAU ERREUR (si non bloqué) ---------- */}
      {error && paiements.length > 0 && (
        <div className="alert alert-error shadow-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default PaiementsList;