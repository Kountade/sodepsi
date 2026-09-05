// src/components/ventes/VentesList.jsx
// ============================================================
// VERSION COMPLETE AVEC CHARGEMENT PAR DATE
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import TicketPOS from '../ventesclients/TicketPOS';
import {
  Plus, Edit, Trash2, Search, ShoppingCart,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight,
  Calendar, FileText, CreditCard, Truck,
  AlertTriangle, Loader2, Download,
  Printer, Ban
} from 'lucide-react';

const VentesList = () => {
  const navigate = useNavigate();
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [venteToDelete, setVenteToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [actionLoading, setActionLoading] = useState(false);
  const [printingId, setPrintingId] = useState(null);
  const [stats, setStats] = useState({ total: 0, total_amount: 0, by_status: {}, by_payment_status: {} });
  const [viewMode, setViewMode] = useState('today');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // ============================================================
  // FORMATAGE
  // ============================================================
  const formatDate = (date) => {
    if (!date) return '-';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  const formatDateInput = (date) => {
    if (!date) return '';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 FCFA';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0 FCFA';
    return `${num.toLocaleString('fr-FR')} FCFA`;
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
  };

  const getToken = () => localStorage.getItem('Token');

  // ============================================================
  // CHARGEMENT DES VENTES DU JOUR
  // ============================================================
  const fetchTodaySales = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const dateStr = formatDateInput(selectedDate);
      const params = new URLSearchParams();
      params.append('date', dateStr);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (paymentFilter !== 'all') params.append('payment_status', paymentFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await AxiosInstance.get(`/sales/by-date/?${params.toString()}`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      const data = response.data;
      setVentes(data.results || []);
      setStats(data.stats || { total: 0, total_amount: 0, by_status: {}, by_payment_status: {} });
      setIsFirstLoad(false);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDate, statusFilter, paymentFilter, searchTerm, navigate]);

  // ============================================================
  // CHARGEMENT DES VENTES SUR UNE PLAGE DE DATES
  // ============================================================
  const fetchDateRangeSales = useCallback(async () => {
    if (!dateFrom || !dateTo) {
      showNotification('Veuillez sélectionner une plage de dates', 'warning');
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const params = new URLSearchParams();
      params.append('date_from', dateFrom);
      params.append('date_to', dateTo);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (paymentFilter !== 'all') params.append('payment_status', paymentFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await AxiosInstance.get(`/sales/date-range/?${params.toString()}`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      const data = response.data;
      setVentes(data.results || []);
      setStats({
        total: data.stats?.total || 0,
        total_amount: data.stats?.total_amount || 0,
        by_status: {},
        by_payment_status: {}
      });
      setIsFirstLoad(false);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, statusFilter, paymentFilter, searchTerm, navigate]);

  // ============================================================
  // CHARGEMENT DE TOUTES LES VENTES (mode 'all')
  // ============================================================
  const fetchAllSales = useCallback(async () => {
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
      if (paymentFilter !== 'all') params.append('payment_status', paymentFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await AxiosInstance.get(`/sales/?${params.toString()}`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      let data = response.data;
      let ventesData = [];
      if (Array.isArray(data)) {
        ventesData = data;
      } else if (data.results) {
        ventesData = data.results;
      } else {
        ventesData = [];
      }

      setVentes(ventesData);
      setStats({
        total: ventesData.length,
        total_amount: ventesData.reduce((sum, v) => sum + parseFloat(v.total || 0), 0),
        by_status: {},
        by_payment_status: {}
      });
      setIsFirstLoad(false);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentFilter, searchTerm, navigate]);

  // ============================================================
  // NAVIGATION JOURS
  // ============================================================
  const goToPreviousDay = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const goToNextDay = () => {
    const today = new Date();
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate > today ? prev : newDate;
    });
  };

  const goToToday = () => {
    setSelectedDate(new Date());
    setViewMode('today');
  };

  // ============================================================
  // EFFET DE CHARGEMENT
  // ============================================================
  useEffect(() => {
    if (viewMode === 'today') {
      fetchTodaySales();
    } else if (viewMode === 'range') {
      fetchDateRangeSales();
    } else {
      fetchAllSales();
    }
  }, [viewMode, fetchTodaySales, fetchDateRangeSales, fetchAllSales]);

  // ============================================================
  // RÉCUPÉRATION DES DONNÉES COMPLÈTES POUR TICKET
  // ============================================================
  const fetchCompleteSale = async (saleId) => {
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        return null;
      }

      const response = await AxiosInstance.get(`/sales/${saleId}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur récupération vente complète:', error);
      showNotification('Erreur lors de la récupération des données', 'error');
      return null;
    }
  };

  // ============================================================
  // IMPRESSION TICKET
  // ============================================================
  const handlePrintTicket = async (vente) => {
    const saleId = vente.id;
    setPrintingId(saleId);

    try {
      const completeVente = await fetchCompleteSale(saleId);

      if (!completeVente) {
        showNotification('Impossible de récupérer les données de la vente', 'error');
        setPrintingId(null);
        return;
      }

      if (!completeVente.lines || completeVente.lines.length === 0) {
        showNotification('Cette vente ne contient aucun produit', 'warning');
        setPrintingId(null);
        return;
      }

      await TicketPOS(completeVente, {
        companyName: 'ETABLISSEMENTS BAH SOULEYMANE ET FILS',
        companySlogan: 'E.B.S.F',
        companyPhone: '+224 626 53 32 53',
        companyEmail: 'ebsfservices@gmail.com',
        companyAddress: 'Pita Centre – Grand Marché, Guinée'
      });

      showNotification('Ticket imprimé avec succès', 'success');
    } catch (error) {
      console.error('Erreur impression ticket:', error);
      showNotification('Erreur lors de l\'impression du ticket', 'error');
    } finally {
      setPrintingId(null);
    }
  };

  // ============================================================
  // ACTIONS
  // ============================================================
  const handleDelete = async () => {
    if (!venteToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/sales/${venteToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Vente supprimée', 'success');
      if (viewMode === 'today') fetchTodaySales();
      else if (viewMode === 'range') fetchDateRangeSales();
      else fetchAllSales();
      setShowDeleteModal(false);
      setVenteToDelete(null);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    setActionLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setActionLoading(false);
        return;
      }

      let notes = '';
      if (status === 'cancelled') {
        const reason = window.prompt('Raison de l\'annulation :', '');
        if (reason === null) {
          setActionLoading(false);
          return;
        }
        notes = reason;
      }

      const payload = { status };
      if (notes) payload.notes = notes;

      await AxiosInstance.post(
        `/sales/${id}/update_status/`,
        payload,
        { headers: { 'Authorization': `Token ${token}` } }
      );

      showNotification(`Statut mis à jour: ${status}`, 'success');
      if (viewMode === 'today') fetchTodaySales();
      else if (viewMode === 'range') fetchDateRangeSales();
      else fetchAllSales();
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      showNotification('Erreur lors de la mise à jour', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmSale = async (id) => {
    setActionLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setActionLoading(false);
        return;
      }

      await AxiosInstance.post(
        `/sales/${id}/confirm/`,
        {},
        { headers: { 'Authorization': `Token ${token}` } }
      );

      showNotification('Vente confirmée avec succès', 'success');
      if (viewMode === 'today') fetchTodaySales();
      else if (viewMode === 'range') fetchDateRangeSales();
      else fetchAllSales();
    } catch (error) {
      console.error('Erreur confirmation:', error);
      showNotification('Erreur lors de la confirmation', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async (id) => {
    setActionLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setActionLoading(false);
        return;
      }

      await AxiosInstance.post(
        `/sales/${id}/mark_paid/`,
        {},
        { headers: { 'Authorization': `Token ${token}` } }
      );

      showNotification('Vente marquée comme payée', 'success');
      if (viewMode === 'today') fetchTodaySales();
      else if (viewMode === 'range') fetchDateRangeSales();
      else fetchAllSales();
    } catch (error) {
      console.error('Erreur paiement:', error);
      showNotification('Erreur lors du paiement', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = (id) => {
    navigate(`/ventes/${id}/pdf`);
  };

  // ============================================================
  // PAGINATION
  // ============================================================
  const paginatedVentes = ventes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(ventes.length / itemsPerPage);

  // ============================================================
  // BADGES
  // ============================================================
  const getStatusBadge = (status) => {
    const configs = {
      draft: { label: 'Brouillon', className: 'badge-ghost' },
      confirmed: { label: 'Confirmée', className: 'badge-info' },
      paid: { label: 'Payée', className: 'badge-success' },
      delivered: { label: 'Livrée', className: 'badge-primary' },
      cancelled: { label: 'Annulée', className: 'badge-error' },
      returned: { label: 'Retournée', className: 'badge-warning' }
    };
    const config = configs[status] || { label: status, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  const getPaymentBadge = (status) => {
    const configs = {
      paid: { label: 'Payé', className: 'badge-success' },
      partial: { label: 'Partiel', className: 'badge-warning' },
      pending: { label: 'En attente', className: 'badge-error' }
    };
    const config = configs[status] || { label: status, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  // ============================================================
  // RENDU
  // ============================================================
  if (loading && isFirstLoad) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-base font-medium text-gray-500">Chargement des ventes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : notification.type === 'warning' ? 'alert-warning' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : notification.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification({ ...notification, show: false })}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {showDeleteModal && venteToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer cette vente ?</p>
              <p className="font-semibold text-error mt-2">{venteToDelete.invoice_number}</p>
              <p className="text-sm text-gray-500">{venteToDelete.client_name}</p>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button className="btn btn-ghost flex-1" onClick={() => setShowDeleteModal(false)}>Annuler</button>
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
                <ShoppingCart className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Ventes</h1>
              {loading && !isFirstLoad && (
                <Loader2 className="w-5 h-5 text-primary animate-spin ml-2" />
              )}
            </div>
            <p className="text-sm text-gray-500 ml-1">
              {viewMode === 'today' ? `Ventes du ${formatDate(selectedDate)}` :
               viewMode === 'range' ? `Période du ${formatDate(dateFrom)} au ${formatDate(dateTo)}` :
               `Toutes les ventes`}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                if (viewMode === 'today') fetchTodaySales();
                else if (viewMode === 'range') fetchDateRangeSales();
                else fetchAllSales();
              }}
              className="btn btn-sm sm:btn-md btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
            </button>
            <button onClick={() => navigate('/ventes/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2">
              <Plus className="w-4 h-4" /> Nouvelle vente
            </button>
          </div>
        </div>
      </div>

      {/* Sélecteur de mode et navigation */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2 flex-wrap">
            <button
              className={`btn btn-sm ${viewMode === 'today' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => { setViewMode('today'); goToToday(); }}
            >
              Aujourd'hui
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'range' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('range')}
            >
              Plage de dates
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('all')}
            >
              Toutes
            </button>
          </div>

          {viewMode === 'today' && (
            <div className="flex items-center gap-2 flex-1 justify-center sm:justify-end">
              <button onClick={goToPreviousDay} className="btn btn-sm btn-ghost btn-circle">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                className="input input-bordered input-sm w-auto"
                value={formatDateInput(selectedDate)}
                onChange={(e) => {
                  const newDate = new Date(e.target.value + 'T00:00:00');
                  if (!isNaN(newDate.getTime())) {
                    setSelectedDate(newDate);
                  }
                }}
              />
              <button onClick={goToNextDay} className="btn btn-sm btn-ghost btn-circle">
                <ChevronRight className="w-4 h-4" />
              </button>
              <button onClick={goToToday} className="btn btn-sm btn-ghost">
                Aujourd'hui
              </button>
            </div>
          )}

          {viewMode === 'range' && (
            <div className="flex items-center gap-2 flex-1 justify-center sm:justify-end flex-wrap">
              <input
                type="date"
                className="input input-bordered input-sm"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <span className="text-sm text-gray-500">à</span>
              <input
                type="date"
                className="input input-bordered input-sm"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={fetchDateRangeSales}
                disabled={!dateFrom || !dateTo || loading}
              >
                <Search className="w-3 h-3" /> Charger
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Statistiques */}
      {viewMode === 'today' && stats && stats.total !== undefined && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-white shadow-md rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-primary">{stats.total || 0}</p></div>
              <ShoppingCart className="w-8 h-8 text-primary/20" />
            </div>
          </div>
          <div className="bg-white shadow-md rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500">Montant</p><p className="text-xl font-bold text-success">{formatCurrency(stats.total_amount)}</p></div>
              <CreditCard className="w-8 h-8 text-success/20" />
            </div>
          </div>
          {stats.by_status && Object.entries(stats.by_status).filter(([_, count]) => count > 0).map(([status, count]) => (
            <div key={status} className="bg-white shadow-md rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{status === 'draft' ? 'Brouillons' :
                    status === 'confirmed' ? 'Confirmées' :
                    status === 'paid' ? 'Payées' :
                    status === 'delivered' ? 'Livrées' :
                    status === 'cancelled' ? 'Annulées' : 'Retournées'}</p>
                  <p className="text-xl font-bold">{count}</p>
                </div>
                <span className="badge badge-ghost">{count}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'range' && stats && stats.total !== undefined && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white shadow-md rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500">Total ventes</p><p className="text-xl font-bold text-primary">{stats.total || 0}</p></div>
              <ShoppingCart className="w-8 h-8 text-primary/20" />
            </div>
          </div>
          <div className="bg-white shadow-md rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500">Montant total</p><p className="text-xl font-bold text-success">{formatCurrency(stats.total_amount)}</p></div>
              <CreditCard className="w-8 h-8 text-success/20" />
            </div>
          </div>
        </div>
      )}

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
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline btn-sm sm:hidden gap-2">
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer' : 'Filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-2 gap-3`}>
            <select className="select select-bordered w-full" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillons</option>
              <option value="confirmed">Confirmées</option>
              <option value="paid">Payées</option>
              <option value="delivered">Livrées</option>
              <option value="cancelled">Annulées</option>
              <option value="returned">Retournées</option>
            </select>
            <select className="select select-bordered w-full" value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les paiements</option>
              <option value="paid">Payé</option>
              <option value="partial">Partiel</option>
              <option value="pending">En attente</option>
            </select>
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
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Paiement</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && !isFirstLoad && (
                Array.from({ length: Math.min(itemsPerPage, 5) }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 w-20 bg-gray-200 rounded"></div></td>
                    <td className="py-3 px-4"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
                    <td className="py-3 px-4 hidden lg:table-cell"><div className="h-4 w-16 bg-gray-200 rounded"></div></td>
                    <td className="py-3 px-4 text-right"><div className="h-4 w-16 bg-gray-200 rounded ml-auto"></div></td>
                    <td className="py-3 px-4 text-center"><div className="h-6 w-16 bg-gray-200 rounded mx-auto"></div></td>
                    <td className="py-3 px-4 text-center"><div className="h-6 w-16 bg-gray-200 rounded mx-auto"></div></td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-1">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {!loading && paginatedVentes.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <ShoppingCart className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucune vente trouvée</p>
                      <button onClick={() => navigate('/ventes/nouveau')} className="btn btn-primary btn-sm gap-2">
                        <Plus className="w-4 h-4" /> Créer une vente
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && paginatedVentes.map(vente => (
                <tr key={vente.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{vente.invoice_number}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">{vente.client_name}</td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      {formatDate(vente.sale_date)}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-primary">{formatCurrency(vente.total)}</td>
                  <td className="py-3 px-4 text-center">{getStatusBadge(vente.status)}</td>
                  <td className="py-3 px-4 text-center">{getPaymentBadge(vente.payment_status)}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center gap-1 flex-wrap">
                      <button
                        onClick={() => navigate(`/ventes/${vente.id}`)}
                        className="btn btn-ghost btn-sm btn-circle tooltip"
                        data-tip="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {vente.status === 'draft' && (
                        <>
                          <button
                            onClick={() => navigate(`/ventes/${vente.id}/modifier`)}
                            className="btn btn-ghost btn-sm btn-circle tooltip text-warning"
                            data-tip="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleConfirmSale(vente.id)}
                            className="btn btn-ghost btn-sm btn-circle tooltip text-success"
                            data-tip="Confirmer"
                            disabled={actionLoading}
                          >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                        </>
                      )}

                      {vente.status === 'confirmed' && (
                        <button
                          onClick={() => handleMarkPaid(vente.id)}
                          className="btn btn-ghost btn-sm btn-circle tooltip text-success"
                          data-tip="Marquer payée"
                          disabled={actionLoading}
                        >
                          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                        </button>
                      )}

                      <button
                        className="btn btn-ghost btn-sm btn-circle tooltip text-primary"
                        data-tip="Télécharger PDF"
                        onClick={() => handleDownloadPdf(vente.id)}
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        className="btn btn-ghost btn-sm btn-circle tooltip text-secondary"
                        data-tip="Imprimer ticket"
                        onClick={() => handlePrintTicket(vente)}
                        disabled={printingId === vente.id}
                      >
                        {printingId === vente.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Printer className="w-4 h-4" />
                        )}
                      </button>

                      {vente.status !== 'cancelled' && vente.status !== 'paid' && (
                        <button
                          onClick={() => handleUpdateStatus(vente.id, 'cancelled')}
                          className="btn btn-ghost btn-sm btn-circle tooltip text-error"
                          data-tip="Annuler"
                          disabled={actionLoading}
                        >
                          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {ventes.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, ventes.length)} sur {ventes.length}
            </div>
            <div className="flex items-center gap-3">
              <select
                className="select select-bordered select-sm"
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
              >
                <option value="5">5 lignes</option>
                <option value="10">10 lignes</option>
                <option value="20">20 lignes</option>
                <option value="50">50 lignes</option>
              </select>
              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || totalPages === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="join-item btn btn-sm btn-disabled">
                  {totalPages > 0 ? `Page ${currentPage} / ${totalPages}` : 'Page 0'}
                </span>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VentesList;