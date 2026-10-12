// src/components/factures/FacturesList.jsx
// ============================================================
// VERSION CORRIGÉE - Compatible API DRF + ErrorBoundary
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, FileText,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight,
  Calendar, Clock, Users, DollarSign,
  CreditCard, Download, Printer, Send,
  Ban, Loader2, QrCode, Building2, Mail
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
    console.error('❌ ErrorBoundary FacturesList:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-4 text-error">
              <AlertCircle className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Erreur dans la liste des factures</h2>
            </div>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-64 text-red-600">
              {this.state.error?.toString()}
            </pre>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary"
              >
                Recharger
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="btn btn-ghost"
              >
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
const FacturesListContent = () => {
  const navigate = useNavigate();
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [factureToDelete, setFactureToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  const showNotification = useCallback((message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  }, []);

  const getToken = () => localStorage.getItem('Token');

  // ============================================================
  // ✅ CHARGEMENT DES FACTURES (robuste)
  // ============================================================
  const fetchFactures = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (searchTerm) params.append('search', searchTerm);

      // ✅ Pagination serveur
      params.append('page', page);
      params.append('page_size', itemsPerPage);

      const url = `/factures/?${params.toString()}`;
      console.log('🔍 fetchFactures:', url);

      const response = await AxiosInstance.get(url, {
        headers: { 'Authorization': `Token ${token}` }
      });

      const data = response.data;
      console.log('✅ Réponse API factures:', data);

      // ✅ GESTION ROBUSTE
      let results = [];
      let count = 0;

      if (Array.isArray(data)) {
        results = data;
        count = data.length;
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.results)) {
          results = data.results;
        }
        count = typeof data.count === 'number' ? data.count : results.length;
      }

      setFactures(results);
      setTotalCount(count);
      setTotalPages(count > 0 ? Math.ceil(count / itemsPerPage) : 1);

    } catch (error) {
      console.error('❌ Erreur fetchFactures:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
      setFactures([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFrom, dateTo, searchTerm, itemsPerPage, navigate, showNotification]);

  // ============================================================
  // EFFET DE CHARGEMENT
  // ============================================================
  useEffect(() => {
    fetchFactures(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, dateFrom, dateTo, searchTerm, itemsPerPage, currentPage]);

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    if (!factureToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/factures/${factureToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Facture supprimée', 'success');
      fetchFactures(currentPage);
      setShowDeleteModal(false);
      setFactureToDelete(null);
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  // ============================================================
  // MARQUER COMME PAYÉE
  // ============================================================
  const handleMarkPaid = async (id, amount) => {
    try {
      const token = getToken();
      await AxiosInstance.post(
        `/factures/${id}/mark_paid/`,
        { amount: parseFloat(amount) || 0, method: 'cash' },
        { headers: { 'Authorization': `Token ${token}` } }
      );
      showNotification('Facture marquée comme payée', 'success');
      fetchFactures(currentPage);
    } catch (error) {
      console.error('❌ Erreur paiement:', error);
      const msg = error.response?.data?.error || 'Erreur lors du paiement';
      showNotification(msg, 'error');
    }
  };

  // ============================================================
  // FILTRAGE CLIENT-SIDE (si pas de pagination serveur)
  // ============================================================
  const filteredFactures = (factures || []).filter(facture => {
    if (!facture) return false;
    const search = (searchTerm || '').toLowerCase();
    return !search ||
      (facture.invoice_number || '').toLowerCase().includes(search) ||
      (facture.client_name || '').toLowerCase().includes(search);
  });

  // ✅ Si le backend pagine déjà, ne pas re-paginer côté client
  const isBackendPaginated = totalCount > factures.length && totalCount > 0;
  const paginatedFactures = isBackendPaginated
    ? factures
    : filteredFactures.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );

  const localTotalPages = isBackendPaginated
    ? totalPages
    : Math.ceil(filteredFactures.length / itemsPerPage) || 1;

  const displayCount = isBackendPaginated ? totalCount : filteredFactures.length;
  const startIndex = (currentPage - 1) * itemsPerPage;

  // ============================================================
  // STATISTIQUES
  // ============================================================
  const stats = {
    total: factures.length,
    draft: factures.filter(f => f.status === 'draft').length,
    sent: factures.filter(f => f.status === 'sent').length,
    paid: factures.filter(f => f.status === 'paid').length,
    overdue: factures.filter(f => f.status === 'overdue').length,
    cancelled: factures.filter(f => f.status === 'cancelled').length,
    partial: factures.filter(f => f.status === 'partial').length,
    totalAmount: factures.reduce((sum, f) => sum + (parseFloat(f.total) || 0), 0)
  };

  // ============================================================
  // BADGES
  // ============================================================
  const getStatusBadge = (status) => {
    const configs = {
      draft: { label: 'Brouillon', className: 'badge-ghost' },
      sent: { label: 'Envoyée', className: 'badge-info' },
      paid: { label: 'Payée', className: 'badge-success' },
      overdue: { label: 'En retard', className: 'badge-error' },
      cancelled: { label: 'Annulée', className: 'badge-warning' },
      partial: { label: 'Partielle', className: 'badge-warning' }
    };
    const config = configs[status] || { label: status || 'N/A', className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  // ============================================================
  // FORMATAGE
  // ============================================================
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 FCFA';
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
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  // ============================================================
  // RENDU
  // ============================================================
  if (loading && factures.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement des factures...</p>
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
      {showDeleteModal && factureToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer cette facture ?</p>
              <p className="font-semibold text-error mt-2">{factureToDelete.invoice_number}</p>
              <p className="text-sm text-gray-500">{factureToDelete.client_name}</p>
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
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Factures</h1>
              {loading && (
                <RefreshCw className="w-5 h-5 text-primary animate-spin ml-2" />
              )}
            </div>
            <p className="text-sm text-gray-500 ml-1">
              {displayCount} facture(s) • {formatCurrency(stats.totalAmount)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => fetchFactures(currentPage)}
              className="btn btn-sm sm:btn-md btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
            </button>
            <button
              onClick={() => navigate('/factures/nouvelle')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" /> Nouvelle facture
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
              <p className="text-xs text-gray-500">Payées</p>
              <p className="text-xl font-bold text-success">{stats.paid}</p>
            </div>
            <CreditCard className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Envoyées</p>
              <p className="text-xl font-bold text-info">{stats.sent}</p>
            </div>
            <Send className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Partielles</p>
              <p className="text-xl font-bold text-warning">{stats.partial}</p>
            </div>
            <Clock className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">En retard</p>
              <p className="text-xl font-bold text-error">{stats.overdue}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-error/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Brouillons</p>
              <p className="text-xl font-bold text-gray-400">{stats.draft}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-400/20" />
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
              placeholder="Rechercher par numéro ou client..."
              className="input input-bordered w-full pl-9"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
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
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillons</option>
              <option value="sent">Envoyées</option>
              <option value="paid">Payées</option>
              <option value="partial">Partielles</option>
              <option value="overdue">En retard</option>
              <option value="cancelled">Annulées</option>
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
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4">N° Facture</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4 hidden lg:table-cell">Date</th>
                <th className="py-3 px-4 hidden lg:table-cell">Échéance</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && factures.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
                    <td className="py-3 px-4"><div className="h-4 w-32 bg-gray-200 rounded"></div></td>
                    <td className="py-3 px-4 hidden lg:table-cell"><div className="h-4 w-20 bg-gray-200 rounded"></div></td>
                    <td className="py-3 px-4 hidden lg:table-cell"><div className="h-4 w-20 bg-gray-200 rounded"></div></td>
                    <td className="py-3 px-4 text-right"><div className="h-4 w-20 bg-gray-200 rounded ml-auto"></div></td>
                    <td className="py-3 px-4 text-center"><div className="h-6 w-20 bg-gray-200 rounded mx-auto"></div></td>
                    <td className="py-3 px-4 text-center"><div className="h-8 w-32 bg-gray-200 rounded mx-auto"></div></td>
                  </tr>
                ))
              ) : paginatedFactures.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucune facture trouvée</p>
                      <button
                        onClick={() => navigate('/factures/nouvelle')}
                        className="btn btn-primary btn-sm gap-2"
                      >
                        <Plus className="w-4 h-4" /> Créer une facture
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedFactures.map(facture => (
                  <tr key={facture.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{facture.invoice_number}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">{facture.client_name}</td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatDate(facture.invoice_date)}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {formatDate(facture.due_date)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-primary">
                      {formatCurrency(facture.total)}
                    </td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(facture.status)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-1 flex-wrap">
                        <button
                          onClick={() => navigate(`/factures/${facture.id}`)}
                          className="btn btn-ghost btn-sm btn-circle tooltip"
                          data-tip="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {facture.status === 'draft' && (
                          <>
                            <button
                              onClick={() => navigate(`/factures/${facture.id}/modifier`)}
                              className="btn btn-ghost btn-sm btn-circle tooltip text-warning"
                              data-tip="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/factures/${facture.id}/envoyer`)}
                              className="btn btn-ghost btn-sm btn-circle tooltip text-info"
                              data-tip="Envoyer"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {(facture.status === 'sent' || facture.status === 'partial') && (
                          <button
                            onClick={() => handleMarkPaid(facture.id, facture.remaining_amount || facture.total)}
                            className="btn btn-ghost btn-sm btn-circle tooltip text-success"
                            data-tip="Marquer payée"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          className="btn btn-ghost btn-sm btn-circle tooltip text-primary"
                          data-tip="Télécharger PDF"
                          onClick={() => window.open(`/factures/${facture.id}/pdf/`, '_blank')}
                        >
                          <Download className="w-4 h-4" />
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
        {displayCount > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Affichage de {Math.min(startIndex + 1, displayCount)} à {Math.min(currentPage * itemsPerPage, displayCount)} sur {displayCount}
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
                <option value="5">5 lignes</option>
                <option value="10">10 lignes</option>
                <option value="20">20 lignes</option>
                <option value="50">50 lignes</option>
              </select>
              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  «
                </button>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="join-item btn btn-sm btn-disabled">
                  Page {currentPage} / {Math.max(localTotalPages, 1)}
                </span>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(p => Math.min(localTotalPages, p + 1))}
                  disabled={currentPage >= localTotalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(localTotalPages)}
                  disabled={currentPage >= localTotalPages}
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
const FacturesList = () => (
  <ErrorBoundary>
    <FacturesListContent />
  </ErrorBoundary>
);

export default FacturesList;