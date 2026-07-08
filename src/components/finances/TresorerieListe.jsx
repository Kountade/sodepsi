// src/components/finances/TresorerieListe.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, Wallet,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight,
  Loader2, DollarSign, Building2, CreditCard,
  Landmark, Smartphone, TrendingUp, TrendingDown
} from 'lucide-react';

const TresorerieListe = () => {
  const navigate = useNavigate();
  const [tresoreries, setTresoreries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tresorerieToDelete, setTresorerieToDelete] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchTresoreries = async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/tresorerie/';
      const params = new URLSearchParams();
      
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
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
      setTresoreries(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement des trésoreries', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTresoreries();
  }, [typeFilter]);

  const handleDelete = async () => {
    if (!tresorerieToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/tresorerie/${tresorerieToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Trésorerie supprimée avec succès', 'success');
      fetchTresoreries();
      setShowDeleteModal(false);
      setTresorerieToDelete(null);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const handleUpdateSolde = async (id) => {
    try {
      const token = getToken();
      await AxiosInstance.post(`/tresorerie/${id}/update_solde/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Solde mis à jour avec succès', 'success');
      fetchTresoreries();
    } catch (error) {
      showNotification('Erreur lors de la mise à jour du solde', 'error');
    }
  };

  const filteredTresoreries = tresoreries.filter(tresorerie => {
    const matchesSearch = !searchTerm || 
      (tresorerie.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (tresorerie.code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (tresorerie.banque?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredTresoreries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTresoreries = filteredTresoreries.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: tresoreries.length,
    totalSolde: tresoreries.reduce((sum, t) => sum + (t.solde_actuel || 0), 0),
    banque: tresoreries.filter(t => t.type === 'banque').length,
    caisse: tresoreries.filter(t => t.type === 'caisse').length,
    actif: tresoreries.filter(t => t.is_active).length
  };

  const getTypeBadge = (type) => {
    const configs = {
      banque: { label: 'Banque', className: 'badge-primary', icon: Landmark },
      caisse: { label: 'Caisse', className: 'badge-success', icon: Wallet },
      especes: { label: 'Espèces', className: 'badge-warning', icon: DollarSign },
      mobile_money: { label: 'Mobile Money', className: 'badge-secondary', icon: Smartphone },
      virement: { label: 'Virement', className: 'badge-info', icon: TrendingUp }
    };
    const config = configs[type] || { label: type, className: 'badge-ghost', icon: Wallet };
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement des trésoreries...</p>
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
      {showDeleteModal && tresorerieToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer cette trésorerie ?</p>
              <p className="font-semibold text-error mt-2">{tresorerieToDelete.nom}</p>
              <p className="text-sm text-gray-500">{tresorerieToDelete.code}</p>
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
                <Wallet className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Trésorerie</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              {stats.total} compte(s) - {formatCurrency(stats.totalSolde)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchTresoreries} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={() => navigate('/tresorerie/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2">
              <Plus className="w-4 h-4" /> Nouvelle trésorerie
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-primary">{stats.total}</p></div>
            <Wallet className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Banque</p><p className="text-xl font-bold text-primary">{stats.banque}</p></div>
            <Landmark className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Caisse</p><p className="text-xl font-bold text-success">{stats.caisse}</p></div>
            <Wallet className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Actif</p><p className="text-xl font-bold text-success">{stats.actif}</p></div>
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
              placeholder="Rechercher par nom, code, banque..." 
              className="input input-bordered w-full pl-9" 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <select className="select select-bordered w-full sm:w-48" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}>
            <option value="all">Tous les types</option>
            <option value="banque">Banque</option>
            <option value="caisse">Caisse</option>
            <option value="especes">Espèces</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="virement">Virement</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Nom</th>
                <th className="py-3 px-4 hidden lg:table-cell">Banque</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Solde</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTresoreries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Wallet className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucune trésorerie trouvée</p>
                      <button onClick={() => navigate('/tresorerie/nouveau')} className="btn btn-primary btn-sm gap-2">
                        <Plus className="w-4 h-4" /> Créer une trésorerie
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTresoreries.map(tresorerie => (
                  <tr key={tresorerie.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold">{tresorerie.code}</td>
                    <td className="py-3 px-4 font-medium">{tresorerie.nom}</td>
                    <td className="py-3 px-4 hidden lg:table-cell">{tresorerie.banque || '-'}</td>
                    <td className="py-3 px-4">{getTypeBadge(tresorerie.type)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-primary">{formatCurrency(tresorerie.solde_actuel)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`badge ${tresorerie.is_active ? 'badge-success' : 'badge-ghost'}`}>
                        {tresorerie.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-1 flex-wrap">
                        <button 
                          onClick={() => navigate(`/tresorerie/${tresorerie.id}`)} 
                          className="btn btn-ghost btn-sm btn-circle tooltip"
                          data-tip="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => navigate(`/tresorerie/${tresorerie.id}/modifier`)} 
                          className="btn btn-ghost btn-sm btn-circle tooltip text-warning"
                          data-tip="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleUpdateSolde(tresorerie.id)} 
                          className="btn btn-ghost btn-sm btn-circle tooltip text-info"
                          data-tip="Mettre à jour le solde"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => navigate(`/mouvements-tresorerie?tresorerie=${tresorerie.id}`)} 
                          className="btn btn-ghost btn-sm btn-circle tooltip text-primary"
                          data-tip="Voir les mouvements"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setTresorerieToDelete(tresorerie); setShowDeleteModal(true); }} 
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
        {filteredTresoreries.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(currentPage * itemsPerPage, filteredTresoreries.length)} sur {filteredTresoreries.length}
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

export default TresorerieListe;