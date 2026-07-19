// src/components/devis/DevisList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, FileText,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight,
  Calendar, Users, DollarSign,
  Loader2, Download, Printer,
  Send, Ban, Clock, FileCheck, FileX
} from 'lucide-react';

const DevisList = () => {
  const navigate = useNavigate();
  const [devis, setDevis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [devisToDelete, setDevisToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [actionLoading, setActionLoading] = useState(false);

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchDevis = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      let url = '/devis/';
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
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
      setDevis(response.data);
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
    fetchDevis();
  }, [statusFilter, dateFrom, dateTo]);

  const handleDelete = async () => {
    if (!devisToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/devis/${devisToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Devis supprimé', 'success');
      fetchDevis();
      setShowDeleteModal(false);
      setDevisToDelete(null);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(`/devis/${id}/update_status/`, 
        { status },
        { headers: { 'Authorization': `Token ${token}` } }
      );
      showNotification(`Statut mis à jour: ${status}`, 'success');
      fetchDevis();
    } catch (error) {
      showNotification('Erreur lors de la mise à jour', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToSale = async (id) => {
    setActionLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.post(`/devis/${id}/convert_to_sale/`, 
        {},
        { headers: { 'Authorization': `Token ${token}` } }
      );
      showNotification('Devis converti en vente avec succès', 'success');
      fetchDevis();
      // Rediriger vers la vente créée
      if (response.data.sale) {
        setTimeout(() => navigate(`/ventes/${response.data.sale.id}`), 1500);
      }
    } catch (error) {
      showNotification('Erreur lors de la conversion', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = (id) => {
    window.open(`/devis/${id}/pdf/`, '_blank');
  };

  const filteredDevis = devis.filter(item => {
    const matchesSearch = !searchTerm || 
      (item.devis_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.client_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredDevis.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDevis = filteredDevis.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: devis.length,
    draft: devis.filter(d => d.status === 'draft').length,
    sent: devis.filter(d => d.status === 'sent').length,
    accepted: devis.filter(d => d.status === 'accepted').length,
    refused: devis.filter(d => d.status === 'refused').length,
    expired: devis.filter(d => d.status === 'expired').length,
    converted: devis.filter(d => d.status === 'converted').length,
    totalAmount: devis.reduce((sum, d) => sum + (d.total || 0), 0)
  };

  const getStatusBadge = (status) => {
    const configs = {
      draft: { label: 'Brouillon', className: 'badge-ghost', icon: FileText },
      sent: { label: 'Envoyé', className: 'badge-info', icon: Send },
      accepted: { label: 'Accepté', className: 'badge-success', icon: CheckCircle },
      refused: { label: 'Refusé', className: 'badge-error', icon: FileX },
      expired: { label: 'Expiré', className: 'badge-warning', icon: Clock },
      converted: { label: 'Converti', className: 'badge-primary', icon: FileCheck }
    };
    const config = configs[status] || { label: status, className: 'badge-ghost', icon: FileText };
    const Icon = config.icon;
    return (
      <span className={`badge ${config.className} gap-1`}>
        <Icon className="w-3 h-3" /> {config.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 FCFA';
    return `${amount.toLocaleString('fr-FR')} FCFA`;
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

  const isExpired = (item) => {
    if (!item.valid_until) return false;
    const validUntil = new Date(item.valid_until);
    const today = new Date();
    return validUntil < today && item.status !== 'accepted' && item.status !== 'converted';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement des devis...</p>
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
      {showDeleteModal && devisToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer ce devis ?</p>
              <p className="font-semibold text-error mt-2">{devisToDelete.devis_number}</p>
              <p className="text-sm text-gray-500">{devisToDelete.client_name}</p>
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
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Devis</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              {stats.total} devis - {formatCurrency(stats.totalAmount)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchDevis} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
            </button>
            <button onClick={() => navigate('/devis/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2">
              <Plus className="w-4 h-4" /> Nouveau devis
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-primary">{stats.total}</p></div>
            <FileText className="w-8 h-8 text-primary/20" />
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
            <div><p className="text-xs text-gray-500">Envoyés</p><p className="text-xl font-bold text-info">{stats.sent}</p></div>
            <Send className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Acceptés</p><p className="text-xl font-bold text-success">{stats.accepted}</p></div>
            <CheckCircle className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Refusés</p><p className="text-xl font-bold text-error">{stats.refused}</p></div>
            <FileX className="w-8 h-8 text-error/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Expirés</p><p className="text-xl font-bold text-warning">{stats.expired}</p></div>
            <Clock className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Converti</p><p className="text-xl font-bold text-primary">{stats.converted}</p></div>
            <FileCheck className="w-8 h-8 text-primary/20" />
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
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-3 gap-3`}>
            <select className="select select-bordered w-full" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillons</option>
              <option value="sent">Envoyés</option>
              <option value="accepted">Acceptés</option>
              <option value="refused">Refusés</option>
              <option value="expired">Expirés</option>
              <option value="converted">Converti</option>
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
                <th className="py-3 px-4">N° Devis</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4 hidden lg:table-cell">Date</th>
                <th className="py-3 px-4 hidden lg:table-cell">Valable jusqu'à</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDevis.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucun devis trouvé</p>
                      <button onClick={() => navigate('/devis/nouveau')} className="btn btn-primary btn-sm gap-2">
                        <Plus className="w-4 h-4" /> Créer un devis
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDevis.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{item.devis_number}</span>
                        {item.has_qr_code && (
                          <span className="badge badge-secondary badge-xs">QR</span>
                        )}
                        {isExpired(item) && (
                          <span className="badge badge-error badge-xs">Expiré</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">{item.client_name}</td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatDate(item.devis_date)}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {formatDate(item.valid_until)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-primary">{formatCurrency(item.total)}</td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(item.status)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-1 flex-wrap">
                        <button 
                          onClick={() => navigate(`/devis/${item.id}`)} 
                          className="btn btn-ghost btn-sm btn-circle tooltip"
                          data-tip="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {item.status === 'draft' && (
                          <>
                            <button 
                              onClick={() => navigate(`/devis/${item.id}/modifier`)} 
                              className="btn btn-ghost btn-sm btn-circle tooltip text-warning"
                              data-tip="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(item.id, 'sent')} 
                              className="btn btn-ghost btn-sm btn-circle tooltip text-info"
                              data-tip="Envoyer"
                              disabled={actionLoading}
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {item.status === 'sent' && (
                          <>
                            <button 
                              onClick={() => handleUpdateStatus(item.id, 'accepted')} 
                              className="btn btn-ghost btn-sm btn-circle tooltip text-success"
                              data-tip="Accepter"
                              disabled={actionLoading}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(item.id, 'refused')} 
                              className="btn btn-ghost btn-sm btn-circle tooltip text-error"
                              data-tip="Refuser"
                              disabled={actionLoading}
                            >
                              <FileX className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {item.status === 'accepted' && (
                          <button 
                            onClick={() => handleConvertToSale(item.id)} 
                            className="btn btn-ghost btn-sm btn-circle tooltip text-primary"
                            data-tip="Convertir en vente"
                            disabled={actionLoading}
                          >
                            <FileCheck className="w-4 h-4" />
                          </button>
                        )}

                        <button 
                          className="btn btn-ghost btn-sm btn-circle tooltip text-primary"
                          data-tip="Télécharger PDF"
                          onClick={() => handleDownloadPdf(item.id)}
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {item.status !== 'converted' && item.status !== 'accepted' && (
                          <button 
                            onClick={() => { setDevisToDelete(item); setShowDeleteModal(true); }} 
                            className="btn btn-ghost btn-sm btn-circle tooltip text-error"
                            data-tip="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
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
        {filteredDevis.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(currentPage * itemsPerPage, filteredDevis.length)} sur {filteredDevis.length}
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

export default DevisList;