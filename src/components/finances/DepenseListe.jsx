// src/components/finances/DepenseListe.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, FileText,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight,
  Loader2, DollarSign, Calendar, Building2,
  Check, Ban, Clock, TrendingUp, TrendingDown,
  Printer, Download, Send
} from 'lucide-react';

const DepenseListe = () => {
  const navigate = useNavigate();
  const [depenses, setDepenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categorieFilter, setCategorieFilter] = useState('all');
  const [statutFilter, setStatutFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [depenseToDelete, setDepenseToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [actionLoading, setActionLoading] = useState(null);

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchDepenses = async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/depenses/';
      const params = new URLSearchParams();
      
      if (categorieFilter !== 'all') {
        params.append('categorie', categorieFilter);
      }
      if (statutFilter !== 'all') {
        params.append('statut', statutFilter);
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
      setDepenses(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement des dépenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepenses();
  }, [categorieFilter, statutFilter, dateFrom, dateTo]);

  const handleDelete = async () => {
    if (!depenseToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/depenses/${depenseToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Dépense supprimée avec succès', 'success');
      fetchDepenses();
      setShowDeleteModal(false);
      setDepenseToDelete(null);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const handleApprouver = async (id) => {
    setActionLoading(id);
    try {
      const token = getToken();
      await AxiosInstance.post(`/depenses/${id}/approuver/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Dépense approuvée avec succès', 'success');
      fetchDepenses();
    } catch (error) {
      showNotification('Erreur lors de l\'approbation', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePayer = async (id) => {
    setActionLoading(id);
    try {
      const token = getToken();
      await AxiosInstance.post(`/depenses/${id}/payer/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Dépense payée avec succès', 'success');
      fetchDepenses();
    } catch (error) {
      showNotification('Erreur lors du paiement', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejeter = async (id) => {
    setActionLoading(id);
    try {
      const token = getToken();
      await AxiosInstance.post(`/depenses/${id}/rejeter/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Dépense rejetée', 'success');
      fetchDepenses();
    } catch (error) {
      showNotification('Erreur lors du rejet', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadPdf = async (id, reference) => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/depenses/${id}/pdf/`, {
        headers: { 'Authorization': `Token ${token}` },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `depense_${reference || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showNotification('PDF téléchargé avec succès', 'success');
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors du téléchargement du PDF', 'error');
    }
  };

  const filteredDepenses = depenses.filter(depense => {
    const matchesSearch = !searchTerm || 
      (depense.reference?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (depense.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (depense.supplier_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredDepenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDepenses = filteredDepenses.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: depenses.length,
    totalMontant: depenses.reduce((sum, d) => sum + (d.total || 0), 0),
    en_attente: depenses.filter(d => d.statut === 'en_attente').length,
    approuve: depenses.filter(d => d.statut === 'approuve').length,
    paye: depenses.filter(d => d.statut === 'paye').length,
    totalPaye: depenses.filter(d => d.statut === 'paye').reduce((sum, d) => sum + (d.total || 0), 0)
  };

  const getCategorieBadge = (categorie) => {
    const configs = {
      fournitures: { label: 'Fournitures de bureau', className: 'badge-info' },
      utilities: { label: 'Services publics', className: 'badge-warning' },
      loyer: { label: 'Loyer', className: 'badge-primary' },
      salaires: { label: 'Salaires', className: 'badge-success' },
      marketing: { label: 'Marketing', className: 'badge-secondary' },
      transport: { label: 'Transport', className: 'badge-info' },
      maintenance: { label: 'Maintenance', className: 'badge-warning' },
      formation: { label: 'Formation', className: 'badge-primary' },
      informatique: { label: 'Informatique', className: 'badge-secondary' },
      telecommunication: { label: 'Télécommunication', className: 'badge-info' },
      frais_bancaires: { label: 'Frais bancaires', className: 'badge-error' },
      impots: { label: 'Impôts et taxes', className: 'badge-error' },
      assurance: { label: 'Assurance', className: 'badge-primary' },
      frais_professionnels: { label: 'Frais professionnels', className: 'badge-ghost' },
      achat_stock: { label: 'Achat de stock', className: 'badge-success' },
      autre: { label: 'Autre', className: 'badge-ghost' }
    };
    const config = configs[categorie] || { label: categorie, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  const getStatutBadge = (statut) => {
    const configs = {
      en_attente: { label: 'En attente', className: 'badge-ghost', icon: Clock },
      approuve: { label: 'Approuvé', className: 'badge-info', icon: Check },
      paye: { label: 'Payé', className: 'badge-success', icon: CheckCircle },
      annule: { label: 'Annulé', className: 'badge-error', icon: Ban },
      rejete: { label: 'Rejeté', className: 'badge-error', icon: X }
    };
    const config = configs[statut] || { label: statut, className: 'badge-ghost', icon: Clock };
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
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement des dépenses...</p>
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
      {showDeleteModal && depenseToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer cette dépense ?</p>
              <p className="font-semibold text-error mt-2">{depenseToDelete.reference}</p>
              <p className="text-sm text-gray-500">{depenseToDelete.description}</p>
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
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Dépenses</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              {stats.total} dépense(s) - {formatCurrency(stats.totalMontant)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchDepenses} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={() => navigate('/depenses/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2">
              <Plus className="w-4 h-4" /> Nouvelle dépense
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-primary">{stats.total}</p></div>
            <FileText className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">En attente</p><p className="text-xl font-bold text-gray-400">{stats.en_attente}</p></div>
            <Clock className="w-8 h-8 text-gray-400/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Approuvées</p><p className="text-xl font-bold text-info">{stats.approuve}</p></div>
            <Check className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Payées</p><p className="text-xl font-bold text-success">{stats.paye}</p></div>
            <CheckCircle className="w-8 h-8 text-success/20" />
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
              placeholder="Rechercher par référence, description..." 
              className="input input-bordered w-full pl-9" 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline btn-sm sm:hidden gap-2">
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer' : 'Filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-4 gap-3`}>
            <select className="select select-bordered w-full" value={categorieFilter} onChange={(e) => { setCategorieFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Toutes les catégories</option>
              <option value="fournitures">Fournitures de bureau</option>
              <option value="utilities">Services publics</option>
              <option value="loyer">Loyer</option>
              <option value="salaires">Salaires</option>
              <option value="marketing">Marketing</option>
              <option value="transport">Transport</option>
              <option value="maintenance">Maintenance</option>
              <option value="formation">Formation</option>
              <option value="informatique">Informatique</option>
              <option value="telecommunication">Télécommunication</option>
              <option value="frais_bancaires">Frais bancaires</option>
              <option value="impots">Impôts et taxes</option>
              <option value="assurance">Assurance</option>
              <option value="achat_stock">Achat de stock</option>
              <option value="autre">Autre</option>
            </select>
            <select className="select select-bordered w-full" value={statutFilter} onChange={(e) => { setStatutFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="approuve">Approuvé</option>
              <option value="paye">Payé</option>
              <option value="annule">Annulé</option>
              <option value="rejete">Rejeté</option>
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
                <th className="py-3 px-4">Référence</th>
                <th className="py-3 px-4 hidden lg:table-cell">Catégorie</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDepenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucune dépense trouvée</p>
                      <button onClick={() => navigate('/depenses/nouveau')} className="btn btn-primary btn-sm gap-2">
                        <Plus className="w-4 h-4" /> Créer une dépense
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDepenses.map(depense => (
                  <tr key={depense.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold">{depense.reference}</td>
                    <td className="py-3 px-4 hidden lg:table-cell">{getCategorieBadge(depense.categorie)}</td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="text-sm">{depense.description}</span>
                        {depense.supplier_name && (
                          <span className="text-xs text-gray-400 block">Fournisseur: {depense.supplier_name}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-primary">{formatCurrency(depense.total)}</td>
                    <td className="py-3 px-4 text-center">{getStatutBadge(depense.statut)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-1 flex-wrap">
                        <button 
                          onClick={() => navigate(`/depenses/${depense.id}`)} 
                          className="btn btn-ghost btn-sm btn-circle tooltip"
                          data-tip="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {/* Actions selon le statut */}
                        {depense.statut === 'en_attente' && (
                          <>
                            <button 
                              onClick={() => navigate(`/depenses/${depense.id}/modifier`)} 
                              className="btn btn-ghost btn-sm btn-circle tooltip text-warning"
                              data-tip="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleApprouver(depense.id)} 
                              className={`btn btn-sm btn-circle tooltip ${actionLoading === depense.id ? 'btn-primary loading' : 'btn-ghost text-info'}`}
                              data-tip="Approuver"
                              disabled={actionLoading === depense.id}
                            >
                              {actionLoading === depense.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            <button 
                              onClick={() => handleRejeter(depense.id)} 
                              className={`btn btn-sm btn-circle tooltip ${actionLoading === depense.id ? 'btn-primary loading' : 'btn-ghost text-error'}`}
                              data-tip="Rejeter"
                              disabled={actionLoading === depense.id}
                            >
                              {actionLoading === depense.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                        
                        {depense.statut === 'approuve' && (
                          <button 
                            onClick={() => handlePayer(depense.id)} 
                            className={`btn btn-sm btn-circle tooltip ${actionLoading === depense.id ? 'btn-primary loading' : 'btn-ghost text-success'}`}
                            data-tip="Payer"
                            disabled={actionLoading === depense.id}
                          >
                            {actionLoading === depense.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        
                        {/* Télécharger PDF - pour toutes les dépenses */}
                        <button 
                          onClick={() => handleDownloadPdf(depense.id, depense.reference)} 
                          className="btn btn-ghost btn-sm btn-circle tooltip text-primary"
                          data-tip="Télécharger PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        
                        {/* Supprimer - seulement si pas payé */}
                        {depense.statut !== 'paye' && (
                          <button 
                            onClick={() => { setDepenseToDelete(depense); setShowDeleteModal(true); }} 
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
        {filteredDepenses.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(currentPage * itemsPerPage, filteredDepenses.length)} sur {filteredDepenses.length}
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

export default DepenseListe;