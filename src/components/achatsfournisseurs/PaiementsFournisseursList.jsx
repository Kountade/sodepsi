// src/components/achats/PaiementsFournisseursList.jsx
// ============================================================
// VERSION OPTIMISÉE - Pagination serveur + debounce + filtres
// ============================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Search, CreditCard,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight,
  Calendar, Download, Receipt, AlertTriangle,
  Banknote, QrCode, Trash2, Building2,
  Printer, HandCoins, Loader2
} from 'lucide-react';

// ============================================================
// CONSTANTES
// ============================================================
const DEBOUNCE_MS = 400;

const METHOD_LABELS = {
  especes: '💰 Espèces',
  cheque: '📄 Chèque',
  virement: '🏦 Virement',
  transfert: '🔄 Transfert',
  mobile_money: '📱 Mobile Money',
  autre: '🔧 Autre',
};

const METHOD_BADGES = {
  especes: 'badge-primary',
  cheque: 'badge-info',
  virement: 'badge-success',
  transfert: 'badge-warning',
  mobile_money: 'badge-secondary',
  autre: 'badge-ghost',
};

const STATUS_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  cancelled: 'Annulé',
};

const STATUS_BADGES = {
  pending: 'badge-warning',
  confirmed: 'badge-success',
  cancelled: 'badge-error',
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
const PaiementsFournisseursList = () => {
  const navigate = useNavigate();

  // ----- Données -----
  const [payments, setPayments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ----- Filtres -----
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // ----- Pagination -----
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isPaginated, setIsPaginated] = useState(true);

  // ----- Modals -----
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // ----- Notification -----
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
  });

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
  // DEBOUNCE
  // ============================================================
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setCurrentPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ============================================================
  // FETCH
  // ============================================================
  const fetchPayments = useCallback(async () => {
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
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (methodFilter !== 'all') params.append('method', methodFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', currentPage);
      params.append('page_size', itemsPerPage);
      params.append('ordering', '-payment_date');

      const url = `/fournisseur-paiements/?${params.toString()}`;

      const response = await AxiosInstance.get(url, {
        headers: { Authorization: `Token ${token}` },
        signal: controller.signal,
      });

      const data = response.data;
      if (data && typeof data === 'object' && Array.isArray(data.results)) {
        setPayments(data.results);
        setTotalCount(data.count ?? data.results.length);
        setIsPaginated(true);
      } else if (Array.isArray(data)) {
        setPayments(data);
        setTotalCount(data.length);
        setIsPaginated(false);
      } else {
        setPayments([]);
        setTotalCount(0);
      }
    } catch (err) {
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
    statusFilter,
    methodFilter,
    dateFrom,
    dateTo,
    searchTerm,
    currentPage,
    itemsPerPage,
    navigate,
    showNotification,
  ]);

  useEffect(() => {
    fetchPayments();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchPayments]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, methodFilter, dateFrom, dateTo]);

  // ============================================================
  // ACTIONS
  // ============================================================
  const handleCancelPayment = async () => {
    if (!selectedPayment) return;
    setCancelling(true);
    try {
      const token = localStorage.getItem('Token');
      await AxiosInstance.post(
        `/fournisseur-paiements/${selectedPayment.id}/cancel/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      showNotification('Paiement annulé avec succès', 'success');
      setShowCancelModal(false);
      setSelectedPayment(null);
      fetchPayments();
    } catch (err) {
      console.error('❌ Erreur annulation :', err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Erreur lors de l'annulation";
      showNotification(msg, 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleViewDetails = (paymentId) => {
    navigate(`/paiements-fournisseurs/${paymentId}`);
  };

  const handleNewPayment = () => {
    navigate('/paiements-fournisseurs/nouveau');
  };

  // ============================================================
  // PAGINATION
  // ============================================================
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + payments.length, totalCount);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  // ============================================================
  // STATS (page courante)
  // ============================================================
  const stats = {
    total: totalCount,
    pending: payments.filter((p) => p.status === 'pending').length,
    confirmed: payments.filter((p) => p.status === 'confirmed').length,
    cancelled: payments.filter((p) => p.status === 'cancelled').length,
    totalAmount: payments
      .filter((p) => p.status === 'confirmed')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    byMethod: {
      virement: payments.filter(
        (p) => p.method === 'virement' && p.status === 'confirmed'
      ).length,
      especes: payments.filter(
        (p) => p.method === 'especes' && p.status === 'confirmed'
      ).length,
    },
  };

  // ============================================================
  // BADGES
  // ============================================================
  const getStatusBadge = (status) => {
    const label = STATUS_LABELS[status] || status;
    const className = STATUS_BADGES[status] || 'badge-ghost';
    const icon =
      status === 'confirmed' ? (
        <CheckCircle className="w-3 h-3" />
      ) : status === 'pending' ? (
        <AlertCircle className="w-3 h-3" />
      ) : (
        <X className="w-3 h-3" />
      );
    return (
      <span className={`badge ${className} gap-1`}>
        {icon} {label}
      </span>
    );
  };

  const getMethodBadge = (method) => {
    const label = METHOD_LABELS[method] || method;
    const className = METHOD_BADGES[method] || 'badge-ghost';
    return <span className={`badge ${className}`}>{label}</span>;
  };

  const resetFilters = () => {
    setSearchInput('');
    setStatusFilter('all');
    setMethodFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  // ============================================================
  // CHARGEMENT
  // ============================================================
  if (loading && payments.length === 0) {
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
  // RENDU
  // ============================================================
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

      {/* Modal annulation */}
      {showCancelModal && selectedPayment && (
        <div className="modal modal-open z-50">
          <div className="modal-box max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-error/10 rounded-full">
                <AlertTriangle className="w-6 h-6 text-error" />
              </div>
              <h3 className="text-xl font-bold">Annuler le paiement</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Êtes-vous sûr de vouloir annuler le paiement{' '}
              <strong>{selectedPayment.reference}</strong> de{' '}
              <strong>{formatCurrency(selectedPayment.amount)}</strong> ?
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-700">
                <strong>Attention :</strong> Cette action restaurera le solde de
                la facture et ne pourra pas être annulée.
              </p>
            </div>
            <div className="modal-action">
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn btn-ghost"
                disabled={cancelling}
              >
                Non, annuler
              </button>
              <button
                onClick={handleCancelPayment}
                className="btn btn-error gap-2"
                disabled={cancelling}
              >
                {cancelling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Oui, annuler
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
                <CreditCard className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Paiements fournisseurs
              </h1>
              {loading && payments.length > 0 && (
                <Loader2 className="w-5 h-5 text-primary animate-spin ml-2" />
              )}
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Gérez vos paiements fournisseurs •{' '}
              <strong>{totalCount.toLocaleString('fr-FR')}</strong> paiement(s)
              {!isPaginated && ' (total brut)'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchPayments}
              className="btn btn-sm sm:btn-md btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={handleNewPayment}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-success to-success/80 text-white border-none shadow-lg gap-2"
            >
              <HandCoins className="w-4 h-4" /> Nouveau paiement
            </button>
            <button
              onClick={() => navigate('/factures-fournisseurs')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              <Receipt className="w-4 h-4" /> Factures
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
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
              <p className="text-xs text-gray-500">Confirmés</p>
              <p className="text-xl font-bold text-success">
                {stats.confirmed}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">En attente</p>
              <p className="text-xl font-bold text-warning">{stats.pending}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Annulés</p>
              <p className="text-xl font-bold text-error">{stats.cancelled}</p>
            </div>
            <X className="w-8 h-8 text-error/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total payé (page)</p>
              <p className="text-sm font-bold text-primary">
                {formatCurrency(stats.totalAmount)}
              </p>
            </div>
            <Banknote className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Par virement</p>
              <p className="text-xl font-bold text-success">
                {stats.byMethod.virement}
              </p>
            </div>
            <Building2 className="w-8 h-8 text-success/20" />
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
              placeholder="Rechercher par référence, facture ou fournisseur…"
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmés</option>
              <option value="cancelled">Annulés</option>
            </select>
            <select
              className="select select-bordered w-full"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="all">Toutes les méthodes</option>
              <option value="especes">💰 Espèces</option>
              <option value="cheque">📄 Chèque</option>
              <option value="virement">🏦 Virement</option>
              <option value="transfert">🔄 Transfert</option>
              <option value="mobile_money">📱 Mobile Money</option>
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

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3">Référence</th>
                <th className="py-3">Fournisseur</th>
                <th className="py-3">Facture</th>
                <th className="py-3">Date</th>
                <th className="py-3 text-right">Montant</th>
                <th className="py-3 text-center">Méthode</th>
                <th className="py-3 text-center">Statut</th>
                <th className="py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && payments.length > 0 && (
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

              {payments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <CreditCard className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">
                        Aucun paiement trouvé
                      </p>
                      {(searchTerm ||
                        statusFilter !== 'all' ||
                        methodFilter !== 'all' ||
                        dateFrom ||
                        dateTo) && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={resetFilters}
                        >
                          Réinitialiser les filtres
                        </button>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleNewPayment}
                          className="btn btn-success btn-sm gap-2"
                        >
                          <HandCoins className="w-4 h-4" /> Nouveau paiement
                        </button>
                        <button
                          onClick={() => navigate('/factures-fournisseurs')}
                          className="btn btn-primary btn-sm gap-2"
                        >
                          <Receipt className="w-4 h-4" /> Voir les factures
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="py-3 font-mono font-semibold">
                      {payment.reference}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-gray-400" />
                        <span>{payment.supplier_name}</span>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-sm">
                      {payment.invoice_number || '-'}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatDate(payment.payment_date)}
                      </div>
                    </td>
                    <td className="py-3 text-right font-semibold text-primary whitespace-nowrap">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="py-3 text-center">
                      {getMethodBadge(payment.method)}
                    </td>
                    <td className="py-3 text-center">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex justify-center gap-1 flex-wrap">
                        <button
                          onClick={() => handleViewDetails(payment.id)}
                          className="btn btn-ghost btn-sm btn-circle tooltip"
                          data-tip="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {payment.status === 'confirmed' && (
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowCancelModal(true);
                            }}
                            className="btn btn-ghost btn-sm btn-circle tooltip text-error"
                            data-tip="Annuler"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {payment.status === 'confirmed' && (
                          <button
                            className="btn btn-ghost btn-sm btn-circle tooltip text-primary"
                            data-tip="Reçu PDF"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                        {payment.qr_code && (
                          <button
                            className="btn btn-ghost btn-sm btn-circle tooltip text-primary"
                            data-tip="QR Code"
                          >
                            <QrCode className="w-4 h-4" />
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
                  Page {currentPage} / {totalPages || 1}
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

      {/* Légende */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <h4 className="text-sm font-semibold text-gray-500 mb-2">
          Légende des statuts
        </h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="badge badge-warning gap-1">
              <AlertCircle className="w-3 h-3" /> En attente
            </span>
            <span className="text-gray-500">En cours de validation</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-success gap-1">
              <CheckCircle className="w-3 h-3" /> Confirmé
            </span>
            <span className="text-gray-500">Paiement validé</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-error gap-1">
              <X className="w-3 h-3" /> Annulé
            </span>
            <span className="text-gray-500">Paiement annulé</span>
          </div>
        </div>
      </div>

      {/* Bouton flottant mobile */}
      <div className="fixed bottom-6 right-6 z-40 sm:hidden">
        <button
          onClick={handleNewPayment}
          className="btn btn-circle btn-lg bg-gradient-to-r from-success to-success/80 text-white border-none shadow-2xl"
          title="Nouveau paiement"
        >
          <HandCoins className="w-6 h-6" />
        </button>
      </div>

      {error && payments.length > 0 && (
        <div className="alert alert-error shadow-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default PaiementsFournisseursList;