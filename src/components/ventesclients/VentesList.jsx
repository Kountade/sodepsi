// src/components/ventes/VentesList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import TicketPOS from '../ventesclients/TicketPOS';
import {
  Plus, Edit, Trash2, Search, ShoppingCart,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight,
  Calendar, Clock, Users, DollarSign,
  FileText, CreditCard, Truck, Package,
  AlertTriangle, Loader2, Download,
  Printer, Send, Ban, QrCode
} from 'lucide-react';

const VentesList = () => {
  const navigate = useNavigate();
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [venteToDelete, setVenteToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [viewMode, setViewMode] = useState('list');
  const [printing, setPrinting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchVentes = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      let url = '/sales/';
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (paymentFilter !== 'all') {
        params.append('payment_status', paymentFilter);
      }
      if (dateFrom) {
        params.append('date_from', dateFrom);
      }
      if (dateTo) {
        params.append('date_to', dateTo);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await AxiosInstance.get(url, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setVentes(response.data);
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
  };

  useEffect(() => {
    fetchVentes();
  }, [statusFilter, paymentFilter, dateFrom, dateTo]);

  const handleDelete = async () => {
    if (!venteToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/sales/${venteToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Vente supprimée', 'success');
      fetchVentes();
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
      if (notes) {
        payload.notes = notes;
      }

      const response = await AxiosInstance.post(
        `/sales/${id}/update_status/`, 
        payload,
        { headers: { 'Authorization': `Token ${token}` } }
      );
      
      showNotification(`Statut mis à jour: ${status}`, 'success');
      fetchVentes();
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      let errorMessage = 'Erreur lors de la mise à jour';
      if (error.response) {
        if (error.response.data && typeof error.response.data === 'object') {
          if (error.response.data.error) {
            errorMessage = error.response.data.error;
          } else if (error.response.data.details) {
            errorMessage = error.response.data.details.join(', ');
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data.detail) {
            errorMessage = error.response.data.detail;
          }
        }
      } else if (error.request) {
        errorMessage = 'Pas de réponse du serveur';
      }
      showNotification(errorMessage, 'error');
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

      const response = await AxiosInstance.post(
        `/sales/${id}/confirm/`, 
        {},
        { headers: { 'Authorization': `Token ${token}` } }
      );
      
      showNotification('Vente confirmée avec succès', 'success');
      fetchVentes();
    } catch (error) {
      console.error('Erreur confirmation:', error);
      let errorMessage = 'Erreur lors de la confirmation';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      showNotification(errorMessage, 'error');
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

      const response = await AxiosInstance.post(
        `/sales/${id}/mark_paid/`, 
        {},
        { headers: { 'Authorization': `Token ${token}` } }
      );
      
      showNotification('Vente marquée comme payée', 'success');
      fetchVentes();
    } catch (error) {
      console.error('Erreur paiement:', error);
      let errorMessage = 'Erreur lors du paiement';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      showNotification(errorMessage, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = (id, invoiceNumber) => {
    navigate(`/ventes/${id}/pdf`);
  };

  const handlePrintTicket = async (vente) => {
    setPrinting(true);
    try {
      await TicketPOS(vente, {
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
      setPrinting(false);
    }
  };

  const filteredVentes = ventes.filter(vente => {
    const matchesSearch = !searchTerm || 
      (vente.invoice_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (vente.client_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredVentes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVentes = filteredVentes.slice(startIndex, startIndex + itemsPerPage);

  // ✅ CORRECTION : conversion explicite en nombre pour éviter concaténation de chaînes
  const stats = {
    total: ventes.length,
    draft: ventes.filter(v => v.status === 'draft').length,
    confirmed: ventes.filter(v => v.status === 'confirmed').length,
    paid: ventes.filter(v => v.status === 'paid').length,
    delivered: ventes.filter(v => v.status === 'delivered').length,
    cancelled: ventes.filter(v => v.status === 'cancelled').length,
    totalAmount: ventes.reduce((sum, v) => sum + parseFloat(v.total || 0), 0)
  };

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

  // ✅ CORRECTION : formatCurrency robuste pour nombres et chaînes
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
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
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
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
            </div>
            <p className="text-sm text-gray-500 ml-1">
              {stats.total} vente(s) - {formatCurrency(stats.totalAmount)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchVentes} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
            </button>
            <button onClick={() => navigate('/ventes/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2">
              <Plus className="w-4 h-4" /> Nouvelle vente
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-primary">{stats.total}</p></div>
            <ShoppingCart className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Confirmées</p><p className="text-xl font-bold text-info">{stats.confirmed}</p></div>
            <CheckCircle className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Payées</p><p className="text-xl font-bold text-success">{stats.paid}</p></div>
            <CreditCard className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Livrées</p><p className="text-xl font-bold text-primary">{stats.delivered}</p></div>
            <Truck className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Brouillons</p><p className="text-xl font-bold text-gray-400">{stats.draft}</p></div>
            <FileText className="w-8 h-8 text-gray-400/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Annulées</p><p className="text-xl font-bold text-error">{stats.cancelled}</p></div>
            <Ban className="w-8 h-8 text-error/20" />
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
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline btn-sm sm:hidden gap-2">
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer' : 'Filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-4 gap-3`}>
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
            <input type="date" className="input input-bordered" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <input type="date" className="input input-bordered" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
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
              {paginatedVentes.length === 0 ? (
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
              ) : (
                paginatedVentes.map(vente => (
                  <tr key={vente.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{vente.invoice_number}</span>
                        {vente.has_qr_code && (
                          <span className="badge badge-secondary badge-xs">QR</span>
                        )}
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
                        {/* Voir détails */}
                        <button 
                          onClick={() => navigate(`/ventes/${vente.id}`)} 
                          className="btn btn-ghost btn-sm btn-circle tooltip"
                          data-tip="Voir détails"
                          disabled={actionLoading}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Modifier (seulement brouillon) */}
                        {vente.status === 'draft' && (
                          <>
                            <button 
                              onClick={() => navigate(`/ventes/${vente.id}/modifier`)} 
                              className="btn btn-ghost btn-sm btn-circle tooltip text-warning"
                              data-tip="Modifier"
                              disabled={actionLoading}
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

                        {/* Marquer payée (seulement confirmée) */}
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

                        {/* Télécharger PDF */}
                        <button 
                          className="btn btn-ghost btn-sm btn-circle tooltip text-primary"
                          data-tip="Télécharger PDF"
                          onClick={() => handleDownloadPdf(vente.id, vente.invoice_number)}
                          disabled={actionLoading}
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Imprimer Ticket */}
                        <button 
                          className="btn btn-ghost btn-sm btn-circle tooltip text-secondary"
                          data-tip="Imprimer ticket"
                          onClick={() => handlePrintTicket(vente)}
                          disabled={printing || actionLoading}
                        >
                          {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                        </button>

                        {/* Annuler */}
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredVentes.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(currentPage * itemsPerPage, filteredVentes.length)} sur {filteredVentes.length}
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
                  onClick={() => setCurrentPage(p => Math.max(1, p-1))} 
                  disabled={currentPage === 1 || totalPages === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="join-item btn btn-sm btn-disabled">
                  {totalPages > 0 ? `Page ${currentPage} / ${totalPages}` : 'Page 0'}
                </span>
                <button 
                  className="join-item btn btn-sm" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} 
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