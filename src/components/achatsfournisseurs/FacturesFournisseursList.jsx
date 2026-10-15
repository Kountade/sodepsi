// src/components/achats/FacturesFournisseursList.jsx
// ============================================================
// VERSION OPTIMISÉE - Pagination serveur + debounce + filtres
// ============================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Search, FileText,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight,
  Calendar, DollarSign, Clock,
  CreditCard, Receipt, AlertTriangle,
  Building2, QrCode, TrendingUp,
  Trash2, HandCoins, Loader2, Printer
} from 'lucide-react';

// ============================================================
// CONSTANTES
// ============================================================
const DEBOUNCE_MS = 400;

const PAIEMENT_LABELS = {
  unpaid: 'Non payée',
  partial: 'Partielle',
  paid: 'Payée',
  overdue: 'En retard',
};

const PAIEMENT_BADGES = {
  unpaid: 'badge-error',
  partial: 'badge-warning',
  paid: 'badge-success',
  overdue: 'badge-error',
};

// ============================================================
// HELPERS
// ============================================================
const formatAmount = (amount) => {
  if (amount === undefined || amount === null) return '0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  return num.toLocaleString('fr-FR');
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
// COMPOSANT : Barre de progression
// ============================================================
const PaymentProgressBar = ({ progress = 0 }) => {
  const getColor = () => {
    if (progress >= 100) return 'bg-success';
    if (progress >= 50) return 'bg-warning';
    return 'bg-error';
  };

  const getLabel = () => {
    if (progress >= 100) return '✅ Payée';
    if (progress >= 50) return '🔄 Partielle';
    return '⏳ Non payée';
  };

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-gray-500">{getLabel()}</span>
        <span className="font-semibold">{progress.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`${getColor()} h-1.5 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const FacturesFournisseursList = () => {
  const navigate = useNavigate();

  // ----- Données -----
  const [invoices, setInvoices] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ----- Filtres -----
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paiementStatusFilter, setPaiementStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // ----- Pagination serveur -----
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isPaginated, setIsPaginated] = useState(true);

  // ----- Suppression -----
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
  const fetchInvoices = useCallback(async () => {
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
      if (paiementStatusFilter !== 'all')
        params.append('paiement_status', paiementStatusFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', currentPage);
      params.append('page_size', itemsPerPage);
      params.append('ordering', '-invoice_date');

      const url = `/supplier-invoices/?${params.toString()}`;

      const response = await AxiosInstance.get(url, {
        headers: { Authorization: `Token ${token}` },
        signal: controller.signal,
      });

      const data = response.data;
      if (data && typeof data === 'object' && Array.isArray(data.results)) {
        setInvoices(data.results);
        setTotalCount(data.count ?? data.results.length);
        setIsPaginated(true);
      } else if (Array.isArray(data)) {
        setInvoices(data);
        setTotalCount(data.length);
        setIsPaginated(false);
      } else {
        setInvoices([]);
        setTotalCount(0);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;

      console.error('❌ Erreur chargement factures :', err);
      let message = 'Erreur de chargement des factures';
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
    paiementStatusFilter,
    dateFrom,
    dateTo,
    searchTerm,
    currentPage,
    itemsPerPage,
    navigate,
    showNotification,
  ]);

  useEffect(() => {
    fetchInvoices();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchInvoices]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, paiementStatusFilter, dateFrom, dateTo]);

  // ============================================================
  // ACTIONS
  // ============================================================
  const handleRegisterPayment = (invoiceId) => {
    navigate(`/paiements-fournisseurs/nouveau?facture=${invoiceId}`);
  };

  const handleViewDetails = (invoiceId) => {
    navigate(`/factures-fournisseurs/${invoiceId}`);
  };

  const handleEdit = (invoiceId) => {
    navigate(`/factures-fournisseurs/${invoiceId}/modifier`);
  };

  const handleDelete = async () => {
    if (!selectedInvoice) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      await AxiosInstance.delete(`/supplier-invoices/${selectedInvoice.id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      showNotification('Facture supprimée avec succès', 'success');
      setShowDeleteModal(false);
      setSelectedInvoice(null);
      fetchInvoices();
    } catch (err) {
      console.error('❌ Erreur suppression :', err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Erreur lors de la suppression';
      showNotification(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  // ============================================================
  // PAGINATION
  // ============================================================
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + invoices.length, totalCount);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  // ============================================================
  // STATS (page courante)
  // ============================================================
  const stats = {
    total: totalCount,
    unpaid: invoices.filter((i) => i.paiement_status === 'unpaid').length,
    partial: invoices.filter((i) => i.paiement_status === 'partial').length,
    paid: invoices.filter((i) => i.paiement_status === 'paid').length,
    overdue: invoices.filter((i) => i.paiement_status === 'overdue').length,
    totalAmount: invoices.reduce(
      (sum, i) => sum + (parseFloat(i.total_amount) || 0),
      0
    ),
    totalPaid: invoices.reduce(
      (sum, i) => sum + (parseFloat(i.amount_paid) || 0),
      0
    ),
    unpaidAmount: invoices
      .filter((i) => i.paiement_status !== 'paid')
      .reduce(
        (sum, i) =>
          sum +
          (parseFloat(i.total_amount) - parseFloat(i.amount_paid) || 0),
        0
      ),
  };

  const getPaiementStatusBadge = (status) => {
    const label = PAIEMENT_LABELS[status] || status;
    const className = PAIEMENT_BADGES[status] || 'badge-ghost';
    const icon =
      status === 'paid' ? (
        <CheckCircle className="w-3 h-3" />
      ) : status === 'partial' ? (
        <Clock className="w-3 h-3" />
      ) : (
        <AlertTriangle className="w-3 h-3" />
      );
    return (
      <span className={`badge ${className} gap-1 text-xs`}>
        {icon} {label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const map = {
      received: { label: 'Reçue', color: 'info' },
      verified: { label: 'Vérifiée', color: 'success' },
      paid: { label: 'Payée', color: 'success' },
      partial: { label: 'Partielle', color: 'warning' },
      disputed: { label: 'Contestée', color: 'error' },
    };
    const s = map[status] || { label: status, color: 'ghost' };
    return <span className={`badge badge-${s.color} text-xs`}>{s.label}</span>;
  };

  const resetFilters = () => {
    setSearchInput('');
    setStatusFilter('all');
    setPaiementStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================
  if (loading && invoices.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">
            Chargement des factures…
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

      {/* Modal suppression */}
      {showDeleteModal && selectedInvoice && (
        <div className="modal modal-open z-50">
          <div className="modal-box max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-error/10 rounded-full">
                <AlertTriangle className="w-6 h-6 text-error" />
              </div>
              <h3 className="text-xl font-bold">Supprimer la facture</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Êtes-vous sûr de vouloir supprimer la facture{' '}
              <strong>{selectedInvoice.invoice_number}</strong> de{' '}
              <strong>{selectedInvoice.supplier_name}</strong> ?
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-700">
                <strong>Attention :</strong> Cette action est irréversible et
                supprimera également tous les paiements associés.
              </p>
            </div>
            <div className="modal-action">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-ghost"
                disabled={deleting}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-error gap-2"
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
                <Receipt className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Factures fournisseurs
              </h1>
              {loading && invoices.length > 0 && (
                <Loader2 className="w-5 h-5 text-primary animate-spin ml-2" />
              )}
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Gérez vos factures fournisseurs •{' '}
              <strong>{totalCount.toLocaleString('fr-FR')}</strong> facture(s)
              {!isPaginated && ' (total brut)'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchInvoices}
              className="btn btn-sm sm:btn-md btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={() => navigate('/factures-fournisseurs/nouveau')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" /> Nouvelle facture
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-7 gap-3">
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
              <p className="text-xs text-gray-500">Non payées</p>
              <p className="text-xl font-bold text-error">{stats.unpaid}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-error/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Partielles</p>
              <p className="text-xl font-bold text-warning">
                {stats.partial}
              </p>
            </div>
            <CreditCard className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Payées</p>
              <p className="text-xl font-bold text-success">{stats.paid}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">En retard</p>
              <p className="text-xl font-bold text-error">{stats.overdue}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-error/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total payé (page)</p>
              <p className="text-sm font-bold text-success">
                {formatAmount(stats.totalPaid)} F
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Reste à payer (page)</p>
              <p className="text-sm font-bold text-error">
                {formatAmount(stats.unpaidAmount)} F
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-error/20" />
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
              placeholder="Rechercher par numéro, fournisseur, commande ou réception…"
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
              <option value="received">Reçues</option>
              <option value="verified">Vérifiées</option>
              <option value="paid">Payées</option>
              <option value="partial">Partielles</option>
              <option value="disputed">Contestées</option>
            </select>
            <select
              className="select select-bordered w-full"
              value={paiementStatusFilter}
              onChange={(e) => setPaiementStatusFilter(e.target.value)}
            >
              <option value="all">Tous les paiements</option>
              <option value="unpaid">Non payées</option>
              <option value="partial">Partielles</option>
              <option value="paid">Payées</option>
              <option value="overdue">En retard</option>
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
                <th className="py-3">N° Facture</th>
                <th className="py-3">Fournisseur</th>
                <th className="py-3">Commande</th>
                <th className="py-3">Réception</th>
                <th className="py-3">Date</th>
                <th className="py-3">Échéance</th>
                <th className="py-3 text-right">Montant</th>
                <th className="py-3 text-right">Payé</th>
                <th className="py-3 text-right">Reste</th>
                <th className="py-3 text-center">Statut</th>
                <th className="py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && invoices.length > 0 && (
                <tr>
                  <td
                    colSpan="11"
                    className="py-2 text-center text-xs text-gray-400"
                  >
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Mise à jour…
                  </td>
                </tr>
              )}

              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Receipt className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">
                        Aucune facture trouvée
                      </p>
                      {(searchTerm ||
                        statusFilter !== 'all' ||
                        paiementStatusFilter !== 'all' ||
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
                          navigate('/factures-fournisseurs/nouveau')
                        }
                        className="btn btn-primary btn-sm gap-2"
                      >
                        <Plus className="w-4 h-4" /> Créer une facture
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => {
                  const totalAmount = parseFloat(invoice.total_amount) || 0;
                  const amountPaid = parseFloat(invoice.amount_paid) || 0;
                  const remaining = totalAmount - amountPaid;
                  const progress =
                    totalAmount > 0 ? (amountPaid / totalAmount) * 100 : 0;

                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="py-3 font-mono font-semibold">
                        {invoice.invoice_number}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          <span>{invoice.supplier_name}</span>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-sm">
                        {invoice.po_number || '-'}
                      </td>
                      <td className="py-3 font-mono text-sm text-gray-500">
                        {invoice.receipt_number || '-'}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {formatDate(invoice.invoice_date)}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span
                            className={
                              invoice.is_overdue
                                ? 'text-error font-semibold'
                                : 'text-gray-600'
                            }
                          >
                            {formatDate(invoice.due_date)}
                            {invoice.is_overdue && ' 🔴'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-right font-semibold">
                        {formatAmount(totalAmount)} F
                      </td>
                      <td className="py-3 text-right text-success font-semibold">
                        {formatAmount(amountPaid)} F
                      </td>
                      <td className="py-3 text-right font-semibold text-error">
                        {formatAmount(remaining)} F
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {getPaiementStatusBadge(invoice.paiement_status)}
                          {getStatusBadge(invoice.status)}
                          <PaymentProgressBar progress={progress} />
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex justify-center gap-1 flex-wrap">
                          <button
                            onClick={() => handleViewDetails(invoice.id)}
                            className="btn btn-ghost btn-sm btn-circle tooltip"
                            data-tip="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {invoice.paiement_status !== 'paid' && (
                            <>
                              <button
                                onClick={() => handleEdit(invoice.id)}
                                className="btn btn-ghost btn-sm btn-circle tooltip text-warning"
                                data-tip="Modifier"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRegisterPayment(invoice.id)}
                                className="btn btn-primary btn-sm btn-circle tooltip"
                                data-tip="Payer"
                              >
                                <HandCoins className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedInvoice(invoice);
                                  setShowDeleteModal(true);
                                }}
                                className="btn btn-ghost btn-sm btn-circle tooltip text-error"
                                data-tip="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {invoice.pdf_file && (
                            <button
                              className="btn btn-ghost btn-sm btn-circle tooltip text-primary"
                              data-tip="PDF"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                          {invoice.qr_code && (
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
            <span className="badge badge-info">Reçue</span>
            <span className="text-gray-500">Facture reçue</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-success">Vérifiée</span>
            <span className="text-gray-500">Vérifiée et conforme</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-success gap-1">
              <CheckCircle className="w-3 h-3" /> Payée
            </span>
            <span className="text-gray-500">Entièrement payée</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-warning gap-1">
              <Clock className="w-3 h-3" /> Partielle
            </span>
            <span className="text-gray-500">Partiellement payée</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-error gap-1">
              <AlertTriangle className="w-3 h-3" /> En retard
            </span>
            <span className="text-gray-500">Échéance dépassée</span>
          </div>
        </div>
      </div>

      {error && invoices.length > 0 && (
        <div className="alert alert-error shadow-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FacturesFournisseursList;