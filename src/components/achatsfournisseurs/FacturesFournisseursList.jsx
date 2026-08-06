// src/components/achats/FacturesFournisseursList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Search, FileText,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight,
  Calendar, DollarSign, Clock, Download,
  CreditCard, Receipt, AlertTriangle, FileCheck,
  Building2, Hash, Printer, QrCode, TrendingUp,
  Trash2, HandCoins
} from 'lucide-react';

const FacturesFournisseursList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paiementStatusFilter, setPaiementStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/supplier-invoices/';
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (paiementStatusFilter !== 'all') {
        params.append('paiement_status', paiementStatusFilter);
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
      setInvoices(response.data);
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
    fetchInvoices();
  }, [statusFilter, paiementStatusFilter, dateFrom, dateTo]);

  const handleRegisterPayment = (invoiceId) => {
    navigate(`/factures-fournisseurs/${invoiceId}/paiement`);
  };

  const handleViewDetails = (invoiceId) => {
    navigate(`/factures-fournisseurs/${invoiceId}`);
  };

  const handleEdit = (invoiceId) => {
    navigate(`/factures-fournisseurs/${invoiceId}/modifier`);
  };

  const handleDelete = async () => {
    if (!selectedInvoice) return;
    
    try {
      const token = getToken();
      await AxiosInstance.delete(`/supplier-invoices/${selectedInvoice.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Facture supprimée avec succès', 'success');
      setShowDeleteModal(false);
      setSelectedInvoice(null);
      fetchInvoices();
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !searchTerm || 
      (invoice.invoice_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (invoice.supplier_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (invoice.po_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (invoice.receipt_number?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

  // Statistiques
  const stats = {
    total: invoices.length,
    unpaid: invoices.filter(i => i.paiement_status === 'unpaid').length,
    partial: invoices.filter(i => i.paiement_status === 'partial').length,
    paid: invoices.filter(i => i.paiement_status === 'paid').length,
    overdue: invoices.filter(i => i.paiement_status === 'overdue').length,
    totalAmount: invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0),
    totalPaid: invoices.reduce((sum, i) => sum + (i.amount_paid || 0), 0),
    unpaidAmount: invoices
      .filter(i => i.paiement_status !== 'paid')
      .reduce((sum, i) => sum + (i.remaining_amount || 0), 0)
  };

  const formatAmount = (amount) => {
    if (amount === undefined || amount === null) return '0';
    return amount.toLocaleString();
  };

  const PaymentProgressBar = ({ invoice }) => {
    const progress = invoice.paid_percentage || 0;
    
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

  const getPaiementStatusBadge = (status) => {
    const statusMap = {
      'unpaid': { label: 'Non payée', color: 'error', icon: <AlertTriangle className="w-3 h-3" /> },
      'partial': { label: 'Partielle', color: 'warning', icon: <Clock className="w-3 h-3" /> },
      'paid': { label: '✅ Payée', color: 'success', icon: <CheckCircle className="w-3 h-3" /> },
      'overdue': { label: '🔴 En retard', color: 'error', icon: <AlertTriangle className="w-3 h-3" /> }
    };
    const s = statusMap[status] || { label: status, color: 'ghost', icon: null };
    
    return (
      <span className={`badge badge-${s.color} gap-1 text-xs`}>
        {s.icon} {s.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'received': { label: 'Reçue', color: 'info' },
      'verified': { label: 'Vérifiée', color: 'success' },
      'paid': { label: 'Payée', color: 'success' },
      'partial': { label: 'Partielle', color: 'warning' },
      'disputed': { label: 'Contestée', color: 'error' }
    };
    const s = statusMap[status] || { label: status, color: 'ghost' };
    return <span className={`badge badge-${s.color} text-xs`}>{s.label}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement des factures...</p>
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

      {/* Modal de suppression */}
      {showDeleteModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-modalIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-error/10 rounded-full">
                <AlertTriangle className="w-6 h-6 text-error" />
              </div>
              <h3 className="text-xl font-bold">Supprimer la facture</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Êtes-vous sûr de vouloir supprimer la facture <strong>{selectedInvoice.invoice_number}</strong> de <strong>{selectedInvoice.supplier_name}</strong> ?
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-700">
                <strong>Attention :</strong> Cette action est irréversible et supprimera également tous les paiements associés.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-ghost flex-1">
                Annuler
              </button>
              <button onClick={handleDelete} className="btn bg-gradient-to-r from-error to-error/80 text-white flex-1 gap-2">
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
                <Receipt className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Factures fournisseurs</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Gérez vos factures fournisseurs – {stats.total} facture(s) pour {stats.totalAmount.toLocaleString()} FCFA
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchInvoices} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
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

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-7 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-primary">{stats.total}</p></div>
            <FileText className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Non payées</p><p className="text-xl font-bold text-error">{stats.unpaid}</p></div>
            <AlertCircle className="w-8 h-8 text-error/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Partielles</p><p className="text-xl font-bold text-warning">{stats.partial}</p></div>
            <CreditCard className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Payées</p><p className="text-xl font-bold text-success">{stats.paid}</p></div>
            <CheckCircle className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">En retard</p><p className="text-xl font-bold text-error">{stats.overdue}</p></div>
            <AlertTriangle className="w-8 h-8 text-error/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total payé</p><p className="text-sm font-bold text-success">{formatAmount(stats.totalPaid)} F</p></div>
            <TrendingUp className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Reste à payer</p><p className="text-sm font-bold text-error">{formatAmount(stats.unpaidAmount)} F</p></div>
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
              placeholder="Rechercher par numéro, fournisseur, commande ou réception..." 
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
              <option value="received">Reçues</option>
              <option value="verified">Vérifiées</option>
              <option value="paid">Payées</option>
              <option value="partial">Partielles</option>
              <option value="disputed">Contestées</option>
            </select>
            <select className="select select-bordered w-full" value={paiementStatusFilter} onChange={(e) => { setPaiementStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les paiements</option>
              <option value="unpaid">Non payées</option>
              <option value="partial">Partiellement payées</option>
              <option value="paid">✅ Payées</option>
              <option value="overdue">🔴 En retard</option>
            </select>
            <input type="date" className="input input-bordered" placeholder="Date début" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <input type="date" className="input input-bordered" placeholder="Date fin" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            <button className="btn btn-outline gap-2" onClick={() => { 
              setStatusFilter('all'); 
              setPaiementStatusFilter('all');
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

      {/* Tableau des factures */}
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
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-16">
                    <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Aucune facture trouvée</p>
                    <button 
                      onClick={() => navigate('/factures-fournisseurs/nouveau')} 
                      className="btn btn-primary btn-sm gap-2 mt-3"
                    >
                      <Plus className="w-4 h-4" /> Créer une facture
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="py-3 font-mono font-semibold">{invoice.invoice_number}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-gray-400" />
                        <span>{invoice.supplier_name}</span>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-sm">{invoice.po_number || '-'}</td>
                    <td className="py-3 font-mono text-sm text-gray-500">{invoice.receipt_number || '-'}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">{new Date(invoice.invoice_date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className={`text-sm ${invoice.is_overdue ? 'text-error font-semibold' : ''}`}>
                          {new Date(invoice.due_date).toLocaleDateString()}
                          {invoice.is_overdue && ' 🔴'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right font-semibold">{formatAmount(invoice.total_amount)} F</td>
                    <td className="py-3 text-right text-success font-semibold">{formatAmount(invoice.amount_paid)} F</td>
                    <td className="py-3 text-right font-semibold text-error">{formatAmount(invoice.remaining_amount)} F</td>
                    <td className="py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {getPaiementStatusBadge(invoice.paiement_status)}
                        {getStatusBadge(invoice.status)}
                        <PaymentProgressBar invoice={invoice} />
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button 
                          onClick={() => handleViewDetails(invoice.id)} 
                          className="btn btn-ghost btn-sm btn-circle"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {invoice.paiement_status !== 'paid' && (
                          <>
                            <button 
                              onClick={() => handleEdit(invoice.id)} 
                              className="btn btn-ghost btn-sm btn-circle text-warning"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleRegisterPayment(invoice.id)} 
                              className="btn btn-primary btn-sm btn-circle"
                              title="Enregistrer un paiement"
                            >
                              <HandCoins className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowDeleteModal(true);
                              }} 
                              className="btn btn-ghost btn-sm btn-circle text-error"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {invoice.pdf_file && (
                          <button 
                            className="btn btn-ghost btn-sm btn-circle text-primary"
                            title="Télécharger PDF"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                        {invoice.qr_code && (
                          <button 
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
        {filteredInvoices.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} sur {filteredInvoices.length}
            </div>
            <div className="flex items-center gap-3">
              <select className="select select-bordered select-sm" value={itemsPerPage} onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}>
                <option value="5">5 lignes</option>
                <option value="10">10 lignes</option>
                <option value="20">20 lignes</option>
                <option value="50">50 lignes</option>
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
            <span className="badge badge-info">Reçue</span>
            <span className="text-gray-500">Facture reçue du fournisseur</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-success">Vérifiée</span>
            <span className="text-gray-500">Facture vérifiée et conforme</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-success gap-1"><CheckCircle className="w-3 h-3" /> Payée</span>
            <span className="text-gray-500">Facture entièrement payée ✅</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-warning gap-1"><Clock className="w-3 h-3" /> Partielle</span>
            <span className="text-gray-500">Partiellement payée</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-error">Contestée</span>
            <span className="text-gray-500">Facture en litige</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-error gap-1"><AlertTriangle className="w-3 h-3" /> En retard</span>
            <span className="text-gray-500">Date d'échéance dépassée 🔴</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacturesFournisseursList;