// src/components/achats/PaiementsFournisseursList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Search, CreditCard,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight,
  Calendar, DollarSign, Clock, Download,
  Receipt, AlertTriangle, FileCheck, Banknote,
  QrCode, Trash2, Building2, Hash, Printer,
  HandCoins
} from 'lucide-react';

const PaiementsFournisseursList = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/fournisseur-paiements/';
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
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
      setPayments(response.data);
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
    fetchPayments();
  }, [statusFilter, methodFilter, dateFrom, dateTo]);

  const handleCancelPayment = async () => {
    if (!selectedPayment) return;
    
    try {
      const token = getToken();
      await AxiosInstance.post(
        `/fournisseur-paiements/${selectedPayment.id}/cancel/`,
        {},
        { headers: { 'Authorization': `Token ${token}` } }
      );
      showNotification('Paiement annulé avec succès', 'success');
      setShowCancelModal(false);
      setSelectedPayment(null);
      fetchPayments();
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors de l\'annulation', 'error');
    }
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment) return;
    
    try {
      const token = getToken();
      await AxiosInstance.delete(`/fournisseur-paiements/${selectedPayment.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Paiement supprimé avec succès', 'success');
      setShowDeleteModal(false);
      setSelectedPayment(null);
      fetchPayments();
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const handleViewDetails = (paymentId) => {
    navigate(`/paiements-fournisseurs/${paymentId}`);
  };

  const handleGenerateQr = (paymentId) => {
    showNotification('Génération du QR Code...', 'success');
  };

  const handleDownloadReceipt = (paymentId) => {
    showNotification('Téléchargement du reçu...', 'success');
  };

  // ✅ NOUVEAU : Redirection directe vers le formulaire de paiement
  // L'utilisateur devra choisir une facture dans le formulaire
  const handleNewPayment = () => {
    // Rediriger vers un formulaire qui permet de sélectionner une facture
    navigate('/paiements-fournisseurs/nouveau');
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = !searchTerm || 
      (payment.reference?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (payment.invoice_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (payment.supplier_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.status === 'pending').length,
    confirmed: payments.filter(p => p.status === 'confirmed').length,
    cancelled: payments.filter(p => p.status === 'cancelled').length,
    totalAmount: payments
      .filter(p => p.status === 'confirmed')
      .reduce((sum, p) => sum + (p.amount || 0), 0),
    byMethod: {
      especes: payments.filter(p => p.method === 'especes' && p.status === 'confirmed').length,
      virement: payments.filter(p => p.method === 'virement' && p.status === 'confirmed').length,
      cheque: payments.filter(p => p.method === 'cheque' && p.status === 'confirmed').length,
      mobile_money: payments.filter(p => p.method === 'mobile_money' && p.status === 'confirmed').length,
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { label: 'En attente', color: 'warning', icon: <Clock className="w-3 h-3" /> },
      'confirmed': { label: 'Confirmé', color: 'success', icon: <CheckCircle className="w-3 h-3" /> },
      'cancelled': { label: 'Annulé', color: 'error', icon: <X className="w-3 h-3" /> }
    };
    const s = statusMap[status] || { label: status, color: 'ghost', icon: null };
    return (
      <span className={`badge badge-${s.color} gap-1`}>
        {s.icon} {s.label}
      </span>
    );
  };

  const getMethodBadge = (method) => {
    const methodMap = {
      'especes': { label: '💰 Espèces', color: 'primary' },
      'cheque': { label: '📄 Chèque', color: 'info' },
      'virement': { label: '🏦 Virement', color: 'success' },
      'transfert': { label: '🔄 Transfert', color: 'warning' },
      'mobile_money': { label: '📱 Mobile Money', color: 'secondary' },
      'autre': { label: '🔧 Autre', color: 'ghost' }
    };
    const m = methodMap[method] || { label: method, color: 'ghost' };
    return <span className={`badge badge-${m.color}`}>{m.label}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement des paiements...</p>
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

      {/* Modals */}
      {showCancelModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-modalIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-error/10 rounded-full">
                <AlertTriangle className="w-6 h-6 text-error" />
              </div>
              <h3 className="text-xl font-bold">Annuler le paiement</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Êtes-vous sûr de vouloir annuler le paiement <strong>{selectedPayment.reference}</strong> de <strong>{selectedPayment.amount?.toLocaleString()} F</strong> ?
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-700">
                <strong>Attention :</strong> Cette action restaurera le solde de la facture et ne pourra pas être annulée.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)} className="btn btn-ghost flex-1">
                Non, annuler
              </button>
              <button onClick={handleCancelPayment} className="btn bg-gradient-to-r from-error to-error/80 text-white flex-1 gap-2">
                <Trash2 className="w-4 h-4" /> Oui, annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-modalIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-error/10 rounded-full">
                <AlertTriangle className="w-6 h-6 text-error" />
              </div>
              <h3 className="text-xl font-bold">Supprimer le paiement</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Êtes-vous sûr de vouloir supprimer définitivement le paiement <strong>{selectedPayment.reference}</strong> ?
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">
                <strong>Attention :</strong> Cette action est irréversible et supprimera également le mouvement de trésorerie associé.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-ghost flex-1">
                Annuler
              </button>
              <button onClick={handleDeletePayment} className="btn bg-gradient-to-r from-error to-error/80 text-white flex-1 gap-2">
                <X className="w-4 h-4" /> Supprimer
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
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Paiements fournisseurs</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Gérez vos paiements aux fournisseurs – {stats.total} paiement(s) pour {stats.totalAmount.toLocaleString()} FCFA
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchPayments} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            
            {/* ✅ NOUVEAU BOUTON : Nouveau paiement - Redirection directe */}
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
              <Receipt className="w-4 h-4" /> Voir les factures
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-primary">{stats.total}</p></div>
            <CreditCard className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Confirmés</p><p className="text-xl font-bold text-success">{stats.confirmed}</p></div>
            <CheckCircle className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">En attente</p><p className="text-xl font-bold text-warning">{stats.pending}</p></div>
            <Clock className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Annulés</p><p className="text-xl font-bold text-error">{stats.cancelled}</p></div>
            <X className="w-8 h-8 text-error/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total payé</p><p className="text-sm font-bold text-primary">{stats.totalAmount.toLocaleString()} F</p></div>
            <Banknote className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Par virement</p><p className="text-xl font-bold text-success">{stats.byMethod.virement}</p></div>
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
              placeholder="Rechercher par référence, facture ou fournisseur..." 
              className="input input-bordered w-full pl-9" 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline btn-sm sm:hidden gap-2">
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer' : 'Filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-5 gap-3`}>
            <select className="select select-bordered w-full" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmés</option>
              <option value="cancelled">Annulés</option>
            </select>
            <select className="select select-bordered w-full" value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Toutes les méthodes</option>
              <option value="especes">💰 Espèces</option>
              <option value="cheque">📄 Chèque</option>
              <option value="virement">🏦 Virement</option>
              <option value="transfert">🔄 Transfert</option>
              <option value="mobile_money">📱 Mobile Money</option>
            </select>
            <input type="date" className="input input-bordered" placeholder="Date début" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <input type="date" className="input input-bordered" placeholder="Date fin" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            <button className="btn btn-outline gap-2" onClick={() => { 
              setStatusFilter('all'); 
              setMethodFilter('all');
              setDateFrom(''); 
              setDateTo(''); 
              setSearchTerm(''); 
              setCurrentPage(1); 
            }}>
              <RefreshCw className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Tableau des paiements */}
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
              {paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-16">
                    <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Aucun paiement trouvé</p>
                    <div className="flex justify-center gap-2 mt-3">
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
                  </td>
                </tr>
              ) : (
                paginatedPayments.map(payment => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="py-3 font-mono font-semibold">{payment.reference}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-gray-400" />
                        <span>{payment.supplier_name}</span>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-sm">{payment.invoice_number || '-'}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">{new Date(payment.payment_date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right font-semibold">{payment.amount?.toLocaleString()} F</td>
                    <td className="py-3 text-center">{getMethodBadge(payment.method)}</td>
                    <td className="py-3 text-center">{getStatusBadge(payment.status)}</td>
                    <td className="py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button 
                          onClick={() => handleViewDetails(payment.id)} 
                          className="btn btn-ghost btn-sm btn-circle"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {payment.status !== 'cancelled' && (
                          <button 
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowCancelModal(true);
                            }} 
                            className="btn btn-error btn-sm btn-circle"
                            title="Annuler"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {payment.status === 'confirmed' && (
                          <button 
                            onClick={() => handleDownloadReceipt(payment.id)} 
                            className="btn btn-ghost btn-sm btn-circle text-primary"
                            title="Télécharger le reçu"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                        {payment.qr_code && (
                          <button 
                            onClick={() => handleGenerateQr(payment.id)} 
                            className="btn btn-ghost btn-sm btn-circle text-primary"
                            title="QR Code"
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
        {filteredPayments.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(currentPage * itemsPerPage, filteredPayments.length)} sur {filteredPayments.length}
            </div>
            <div className="flex items-center gap-3">
              <select className="select select-bordered select-sm" value={itemsPerPage} onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}>
                <option value="5">5 lignes</option>
                <option value="10">10 lignes</option>
                <option value="20">20 lignes</option>
              </select>
              <div className="join">
                <button className="join-item btn btn-sm" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="join-item btn btn-sm btn-disabled">
                  Page {currentPage} / {totalPages}
                </span>
                <button className="join-item btn btn-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Légende des statuts */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <h4 className="text-sm font-semibold text-gray-500 mb-2">Légende des statuts</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="badge badge-warning gap-1"><Clock className="w-3 h-3" /> En attente</span>
            <span className="text-gray-500">Paiement en cours de validation</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-success gap-1"><CheckCircle className="w-3 h-3" /> Confirmé</span>
            <span className="text-gray-500">Paiement validé et enregistré</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-error gap-1"><X className="w-3 h-3" /> Annulé</span>
            <span className="text-gray-500">Paiement annulé</span>
          </div>
        </div>
      </div>

      {/* ✅ BOUTON FLOTTANT POUR NOUVEAU PAIEMENT (Mobile) */}
      <div className="fixed bottom-6 right-6 z-40 sm:hidden">
        <button
          onClick={handleNewPayment}
          className="btn btn-circle btn-lg bg-gradient-to-r from-success to-success/80 text-white border-none shadow-2xl hover:shadow-xl transition-all duration-300"
          title="Nouveau paiement"
        >
          <HandCoins className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default PaiementsFournisseursList;