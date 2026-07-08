// src/components/finances/MouvementTresorerieListe.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, TrendingUp,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight,
  Loader2, DollarSign, Calendar, Wallet,
  TrendingDown, FileText, Building2, User
} from 'lucide-react';

const MouvementTresorerieListe = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tresorerieId = queryParams.get('tresorerie');

  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categorieFilter, setCategorieFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mouvementToDelete, setMouvementToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [tresorerieInfo, setTresorerieInfo] = useState(null);

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchTresorerieInfo = async () => {
    if (!tresorerieId) return;
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/tresorerie/${tresorerieId}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setTresorerieInfo(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchMouvements = async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/mouvements-tresorerie/';
      const params = new URLSearchParams();
      
      if (tresorerieId) {
        params.append('tresorerie', tresorerieId);
      }
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      if (categorieFilter !== 'all') {
        params.append('categorie', categorieFilter);
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
      setMouvements(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement des mouvements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tresorerieId) {
      fetchTresorerieInfo();
    }
    fetchMouvements();
  }, [typeFilter, categorieFilter, dateFrom, dateTo, tresorerieId]);

  const handleDelete = async () => {
    if (!mouvementToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/mouvements-tresorerie/${mouvementToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Mouvement supprimé avec succès', 'success');
      fetchMouvements();
      setShowDeleteModal(false);
      setMouvementToDelete(null);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const filteredMouvements = mouvements.filter(mouvement => {
    const matchesSearch = !searchTerm || 
      (mouvement.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (mouvement.reference?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredMouvements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMouvements = filteredMouvements.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: mouvements.length,
    entree: mouvements.filter(m => m.type === 'entree').length,
    sortie: mouvements.filter(m => m.type === 'sortie').length,
    totalEntree: mouvements.filter(m => m.type === 'entree').reduce((sum, m) => sum + (m.montant || 0), 0),
    totalSortie: mouvements.filter(m => m.type === 'sortie').reduce((sum, m) => sum + (m.montant || 0), 0)
  };

  const getTypeBadge = (type) => {
    if (type === 'entree') {
      return <span className="badge badge-success gap-1"><TrendingUp className="w-3 h-3" /> Entrée</span>;
    }
    return <span className="badge badge-error gap-1"><TrendingDown className="w-3 h-3" /> Sortie</span>;
  };

  const getCategorieBadge = (categorie) => {
    const configs = {
      vente: { label: 'Vente', className: 'badge-success' },
      paiement: { label: 'Paiement fournisseur', className: 'badge-warning' },
      recette: { label: 'Recette', className: 'badge-info' },
      depense: { label: 'Dépense', className: 'badge-error' },
      transfert: { label: 'Transfert', className: 'badge-primary' },
      regularisation: { label: 'Régularisation', className: 'badge-ghost' },
      autre: { label: 'Autre', className: 'badge-ghost' }
    };
    const config = configs[categorie] || { label: categorie, className: 'badge-ghost' };
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
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement des mouvements...</p>
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
      {showDeleteModal && mouvementToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer ce mouvement ?</p>
              <p className="font-semibold text-error mt-2">{mouvementToDelete.description}</p>
              <p className="text-sm text-gray-500">{formatCurrency(mouvementToDelete.montant)}</p>
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
                <TrendingUp className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Mouvements de Trésorerie</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              {tresorerieInfo ? `Compte: ${tresorerieInfo.nom} (${tresorerieInfo.code})` : `${stats.total} mouvement(s)`}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchMouvements} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button 
              onClick={() => navigate(`/mouvements-tresorerie/nouveau${tresorerieId ? `?tresorerie=${tresorerieId}` : ''}`)} 
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" /> Nouveau mouvement
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-primary">{stats.total}</p></div>
            <TrendingUp className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Entrées</p><p className="text-xl font-bold text-success">{stats.entree}</p></div>
            <TrendingUp className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Sorties</p><p className="text-xl font-bold text-error">{stats.sortie}</p></div>
            <TrendingDown className="w-8 h-8 text-error/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Solde</p><p className="text-xl font-bold text-primary">{formatCurrency(stats.totalEntree - stats.totalSortie)}</p></div>
            <Wallet className="w-8 h-8 text-primary/20" />
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
              placeholder="Rechercher par description, référence..." 
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
              <option value="entree">Entrées</option>
              <option value="sortie">Sorties</option>
            </select>
            <select className="select select-bordered w-full" value={categorieFilter} onChange={(e) => { setCategorieFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Toutes les catégories</option>
              <option value="vente">Vente</option>
              <option value="paiement">Paiement fournisseur</option>
              <option value="recette">Recette</option>
              <option value="depense">Dépense</option>
              <option value="transfert">Transfert</option>
              <option value="regularisation">Régularisation</option>
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
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 hidden lg:table-cell">Catégorie</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMouvements.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <TrendingUp className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucun mouvement trouvé</p>
                      <button onClick={() => navigate(`/mouvements-tresorerie/nouveau${tresorerieId ? `?tresorerie=${tresorerieId}` : ''}`)} className="btn btn-primary btn-sm gap-2">
                        <Plus className="w-4 h-4" /> Créer un mouvement
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMouvements.map(mouvement => (
                  <tr key={mouvement.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm">{formatDate(mouvement.date_mouvement)}</td>
                    <td className="py-3 px-4">{getTypeBadge(mouvement.type)}</td>
                    <td className="py-3 px-4 hidden lg:table-cell">{getCategorieBadge(mouvement.categorie)}</td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="text-sm">{mouvement.description}</span>
                        {mouvement.reference && (
                          <span className="text-xs text-gray-400 block">Réf: {mouvement.reference}</span>
                        )}
                      </div>
                    </td>
                    <td className={`py-3 px-4 text-right font-semibold ${mouvement.type === 'entree' ? 'text-success' : 'text-error'}`}>
                      {mouvement.type === 'entree' ? '+' : '-'} {formatCurrency(mouvement.montant)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-1">
                        <button 
                          onClick={() => navigate(`/mouvements-tresorerie/${mouvement.id}`)} 
                          className="btn btn-ghost btn-sm btn-circle tooltip"
                          data-tip="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setMouvementToDelete(mouvement); setShowDeleteModal(true); }} 
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
        {filteredMouvements.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(currentPage * itemsPerPage, filteredMouvements.length)} sur {filteredMouvements.length}
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

export default MouvementTresorerieListe;