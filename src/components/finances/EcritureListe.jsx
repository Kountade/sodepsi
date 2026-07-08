// src/components/finances/EcritureListe.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, BookOpen,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight,
  Loader2, DollarSign, Calendar, User,
  Check, Ban, FileText, TrendingUp, TrendingDown
} from 'lucide-react';

const EcritureListe = () => {
  const navigate = useNavigate();
  const [ecritures, setEcritures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statutFilter, setStatutFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ecritureToDelete, setEcritureToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [actionLoading, setActionLoading] = useState(null);

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchEcritures = async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/ecritures/';
      const params = new URLSearchParams();
      
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
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
      setEcritures(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement des écritures', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEcritures();
  }, [typeFilter, statutFilter, dateFrom, dateTo]);

  const handleDelete = async () => {
    if (!ecritureToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/ecritures/${ecritureToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Écriture supprimée avec succès', 'success');
      fetchEcritures();
      setShowDeleteModal(false);
      setEcritureToDelete(null);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const handleValider = async (id) => {
    setActionLoading(id);
    try {
      const token = getToken();
      await AxiosInstance.post(`/ecritures/${id}/valider/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Écriture validée avec succès', 'success');
      fetchEcritures();
    } catch (error) {
      showNotification('Erreur lors de la validation', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAnnuler = async (id) => {
    setActionLoading(id);
    try {
      const token = getToken();
      await AxiosInstance.post(`/ecritures/${id}/annuler/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Écriture annulée avec succès', 'success');
      fetchEcritures();
    } catch (error) {
      showNotification('Erreur lors de l\'annulation', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredEcritures = ecritures.filter(ecriture => {
    const matchesSearch = !searchTerm || 
      (ecriture.numero?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (ecriture.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (ecriture.reference?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredEcritures.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEcritures = filteredEcritures.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: ecritures.length,
    brouillon: ecritures.filter(e => e.statut === 'brouillon').length,
    valide: ecritures.filter(e => e.statut === 'valide').length,
    annulee: ecritures.filter(e => e.statut === 'annulee').length,
    totalMontant: ecritures.reduce((sum, e) => sum + (e.montant || 0), 0)
  };

  const getTypeBadge = (type) => {
    const configs = {
      vente: { label: 'Vente', className: 'badge-success' },
      achat: { label: 'Achat', className: 'badge-info' },
      paiement_client: { label: 'Paiement Client', className: 'badge-primary' },
      paiement_fournisseur: { label: 'Paiement Fournisseur', className: 'badge-warning' },
      recette: { label: 'Recette', className: 'badge-success' },
      depense: { label: 'Dépense', className: 'badge-error' },
      tresorerie: { label: 'Trésorerie', className: 'badge-secondary' },
      regularisation: { label: 'Régularisation', className: 'badge-ghost' },
      autre: { label: 'Autre', className: 'badge-ghost' }
    };
    const config = configs[type] || { label: type, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  const getStatutBadge = (statut) => {
    const configs = {
      brouillon: { label: 'Brouillon', className: 'badge-ghost' },
      valide: { label: 'Validée', className: 'badge-success' },
      annulee: { label: 'Annulée', className: 'badge-error' }
    };
    const config = configs[statut] || { label: statut, className: 'badge-ghost' };
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
          <p className="text-base font-medium text-gray-500">Chargement des écritures...</p>
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
      {showDeleteModal && ecritureToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer cette écriture ?</p>
              <p className="font-semibold text-error mt-2">{ecritureToDelete.numero}</p>
              <p className="text-sm text-gray-500">{ecritureToDelete.description}</p>
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
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Écritures Comptables</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              {stats.total} écriture(s) - {formatCurrency(stats.totalMontant)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchEcritures} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={() => navigate('/ecritures/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2">
              <Plus className="w-4 h-4" /> Nouvelle écriture
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-primary">{stats.total}</p></div>
            <BookOpen className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Brouillons</p><p className="text-xl font-bold text-gray-400">{stats.brouillon}</p></div>
            <FileText className="w-8 h-8 text-gray-400/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Validées</p><p className="text-xl font-bold text-success">{stats.valide}</p></div>
            <CheckCircle className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Annulées</p><p className="text-xl font-bold text-error">{stats.annulee}</p></div>
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
              placeholder="Rechercher par numéro, description..." 
              className="input input-bordered w-full pl-9" 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline btn-sm sm:hidden gap-2">
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer' : 'Filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-4 gap-3`}>
            <select className="select select-bordered w-full" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les types</option>
              <option value="vente">Vente</option>
              <option value="achat">Achat</option>
              <option value="paiement_client">Paiement Client</option>
              <option value="paiement_fournisseur">Paiement Fournisseur</option>
              <option value="recette">Recette</option>
              <option value="depense">Dépense</option>
              <option value="tresorerie">Trésorerie</option>
              <option value="regularisation">Régularisation</option>
            </select>
            <select className="select select-bordered w-full" value={statutFilter} onChange={(e) => { setStatutFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="valide">Validée</option>
              <option value="annulee">Annulée</option>
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
                <th className="py-3 px-4">N° Écriture</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 hidden lg:table-cell">Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEcritures.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <BookOpen className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucune écriture trouvée</p>
                      <button onClick={() => navigate('/ecritures/nouveau')} className="btn btn-primary btn-sm gap-2">
                        <Plus className="w-4 h-4" /> Créer une écriture
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEcritures.map(ecriture => (
                  <tr key={ecriture.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold">{ecriture.numero}</td>
                    <td className="py-3 px-4 text-sm">{formatDate(ecriture.date_ecriture)}</td>
                    <td className="py-3 px-4 hidden lg:table-cell">{getTypeBadge(ecriture.type)}</td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="text-sm">{ecriture.description}</span>
                        {ecriture.reference && (
                          <span className="text-xs text-gray-400 block">Réf: {ecriture.reference}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-primary">{formatCurrency(ecriture.montant)}</td>
                    <td className="py-3 px-4 text-center">{getStatutBadge(ecriture.statut)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-1 flex-wrap">
                        <button 
                          onClick={() => navigate(`/ecritures/${ecriture.id}`)} 
                          className="btn btn-ghost btn-sm btn-circle tooltip"
                          data-tip="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {ecriture.statut === 'brouillon' && (
                          <>
                            <button 
                              onClick={() => navigate(`/ecritures/${ecriture.id}/modifier`)} 
                              className="btn btn-ghost btn-sm btn-circle tooltip text-warning"
                              data-tip="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleValider(ecriture.id)} 
                              className={`btn btn-sm btn-circle tooltip ${actionLoading === ecriture.id ? 'btn-primary loading' : 'btn-ghost text-success'}`}
                              data-tip="Valider"
                              disabled={actionLoading === ecriture.id}
                            >
                              {actionLoading === ecriture.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            <button 
                              onClick={() => handleAnnuler(ecriture.id)} 
                              className={`btn btn-sm btn-circle tooltip ${actionLoading === ecriture.id ? 'btn-primary loading' : 'btn-ghost text-error'}`}
                              data-tip="Annuler"
                              disabled={actionLoading === ecriture.id}
                            >
                              {actionLoading === ecriture.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Ban className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                        
                        {ecriture.statut !== 'annulee' && (
                          <button 
                            onClick={() => { setEcritureToDelete(ecriture); setShowDeleteModal(true); }} 
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
        {filteredEcritures.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(currentPage * itemsPerPage, filteredEcritures.length)} sur {filteredEcritures.length}
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

export default EcritureListe;