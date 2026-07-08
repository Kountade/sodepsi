// src/components/paiements/PaiementsList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, CreditCard,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight,
  Calendar, Clock, Users, DollarSign,
  FileText, Download, Printer, Send,
  Ban, Loader2, QrCode, Building2, Mail,
  Wallet, Phone
} from 'lucide-react';

const PaiementsList = () => {
  const navigate = useNavigate();
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [paiementToDelete, setPaiementToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [downloading, setDownloading] = useState(null);

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchPaiements = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      let url = '/payments/';
      const params = new URLSearchParams();
      
      if (methodFilter !== 'all') {
        params.append('method', methodFilter);
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
      setPaiements(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement des paiements', 'error');
        // Données de test pour le développement
        setPaiements(getMockPaiements());
      }
    } finally {
      setLoading(false);
    }
  };

  // Données de test
  const getMockPaiements = () => [
    {
      id: 1,
      sale_invoice_number: 'INV-2024-001',
      client_name: 'Client Test 1',
      amount: 150000,
      method: 'cash',
      payment_date: new Date().toISOString(),
      reference: 'REF-001',
      notes: 'Paiement en espèces'
    },
    {
      id: 2,
      sale_invoice_number: 'INV-2024-002',
      client_name: 'Client Test 2',
      amount: 250000,
      method: 'transfer',
      payment_date: new Date().toISOString(),
      reference: 'TRF-002',
      notes: 'Virement bancaire'
    },
    {
      id: 3,
      sale_invoice_number: 'INV-2024-003',
      client_name: 'Client Test 3',
      amount: 75000,
      method: 'mobile_money',
      payment_date: new Date().toISOString(),
      reference: 'MM-003',
      notes: 'Mobile Money'
    }
  ];

  useEffect(() => {
    fetchPaiements();
  }, [methodFilter, dateFrom, dateTo]);

  const handleDelete = async () => {
    if (!paiementToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/payments/${paiementToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Paiement supprimé avec succès', 'success');
      fetchPaiements();
      setShowDeleteModal(false);
      setPaiementToDelete(null);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  // ✅ Fonction de téléchargement du PDF du paiement
  const handleDownloadPdf = async (paiementId) => {
    setDownloading(paiementId);
    try {
      // Rediriger vers la page de génération PDF
      // Le composant PaiementPdf va générer et télécharger le PDF automatiquement
      navigate(`/paiements/${paiementId}/pdf`);
      
      // Note: Si vous voulez télécharger directement sans naviguer,
      // vous pouvez utiliser cette approche:
      /*
      const token = getToken();
      const response = await AxiosInstance.get(`/payments/${paiementId}/pdf/`, {
        headers: { 'Authorization': `Token ${token}` },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recu_paiement_${paiementId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showNotification('PDF téléchargé avec succès', 'success');
      */
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error);
      showNotification('Erreur lors du téléchargement du PDF', 'error');
    } finally {
      setDownloading(null);
    }
  };

  const filteredPaiements = paiements.filter(paiement => {
    const matchesSearch = !searchTerm || 
      (paiement.sale_invoice_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (paiement.client_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredPaiements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPaiements = filteredPaiements.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: paiements.length,
    totalAmount: paiements.reduce((sum, p) => sum + (p.amount || 0), 0),
    cash: paiements.filter(p => p.method === 'cash').length,
    card: paiements.filter(p => p.method === 'card').length,
    transfer: paiements.filter(p => p.method === 'transfer').length,
    mobile_money: paiements.filter(p => p.method === 'mobile_money').length
  };

  const getMethodBadge = (method) => {
    const configs = {
      cash: { label: 'Espèces', className: 'badge-success' },
      card: { label: 'Carte', className: 'badge-info' },
      check: { label: 'Chèque', className: 'badge-warning' },
      transfer: { label: 'Virement', className: 'badge-primary' },
      mobile_money: { label: 'Mobile Money', className: 'badge-secondary' },
      credit: { label: 'Crédit', className: 'badge-error' }
    };
    const config = configs[method] || { label: method, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
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
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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
          <p className="text-base font-medium text-gray-500">Chargement des paiements...</p>
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
      {showDeleteModal && paiementToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer ce paiement ?</p>
              <p className="font-semibold text-error mt-2">#{paiementToDelete.id}</p>
              <p className="text-sm text-gray-500">{formatCurrency(paiementToDelete.amount)}</p>
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
                <CreditCard className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Paiements</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              {stats.total} paiement(s) - {formatCurrency(stats.totalAmount)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchPaiements} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={() => navigate('/paiements/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2">
              <Plus className="w-4 h-4" /> Nouveau paiement
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-primary">{stats.total}</p></div>
            <CreditCard className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Espèces</p><p className="text-xl font-bold text-success">{stats.cash}</p></div>
            <Wallet className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Carte</p><p className="text-xl font-bold text-info">{stats.card}</p></div>
            <CreditCard className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Virement</p><p className="text-xl font-bold text-primary">{stats.transfer}</p></div>
            <Send className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Mobile Money</p><p className="text-xl font-bold text-secondary">{stats.mobile_money}</p></div>
            <Phone className="w-8 h-8 text-secondary/20" />
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
              placeholder="Rechercher par facture ou client..." 
              className="input input-bordered w-full pl-9" 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline btn-sm sm:hidden gap-2">
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer' : 'Filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-3 gap-3`}>
            <select className="select select-bordered w-full" value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Toutes les méthodes</option>
              <option value="cash">Espèces</option>
              <option value="card">Carte bancaire</option>
              <option value="check">Chèque</option>
              <option value="transfer">Virement</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="credit">Crédit</option>
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
              {paginatedPaiements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <CreditCard className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucun paiement trouvé</p>
                      <button onClick={() => navigate('/paiements/nouveau')} className="btn btn-primary btn-sm gap-2">
                        <Plus className="w-4 h-4" /> Enregistrer un paiement
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPaiements.map(paiement => (
                  <tr key={paiement.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-mono">#{paiement.id}</td>
                    <td className="py-3 px-4 font-mono">{paiement.sale_invoice_number || '-'}</td>
                    <td className="py-3 px-4 font-medium">{paiement.client_name || '-'}</td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatDate(paiement.payment_date)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-primary">{formatCurrency(paiement.amount)}</td>
                    <td className="py-3 px-4 text-center">{getMethodBadge(paiement.method)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-1">
                        {/* Voir détails */}
                        <button 
                          onClick={() => navigate(`/paiements/${paiement.id}`)} 
                          className="btn btn-ghost btn-sm btn-circle tooltip"
                          data-tip="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* ✅ Télécharger PDF */}
                        <button 
                          className={`btn btn-sm btn-circle tooltip ${downloading === paiement.id ? 'btn-primary loading' : 'btn-ghost text-primary'}`}
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

                        {/* Supprimer */}
                        <button 
                          onClick={() => { setPaiementToDelete(paiement); setShowDeleteModal(true); }} 
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

        {/* Pagination */}
        {filteredPaiements.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(currentPage * itemsPerPage, filteredPaiements.length)} sur {filteredPaiements.length}
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

export default PaiementsList;