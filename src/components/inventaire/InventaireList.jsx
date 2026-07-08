// src/components/stocks/InventaireList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, Package,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight,
  Calendar, Clock, Warehouse,
  ClipboardList, PlayCircle, CheckSquare,
  AlertTriangle, Loader2, FileText,
  Download, TrendingUp, Activity,
  XCircle   // <-- AJOUTER ICI
} from 'lucide-react';

const InventaireList = () => {
  const navigate = useNavigate();
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [inventoryToDelete, setInventoryToDelete] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [stats, setStats] = useState({
    total: 0,
    planned: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    verified: 0
  });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchInventories = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      let url = '/inventories/';
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
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
      
      const data = response.data || [];
      setInventories(data);
      
      setStats({
        total: data.length,
        planned: data.filter(i => i.status === 'planned').length,
        in_progress: data.filter(i => i.status === 'in_progress').length,
        completed: data.filter(i => i.status === 'completed').length,
        cancelled: data.filter(i => i.status === 'cancelled').length,
        verified: data.filter(i => i.status === 'verified').length
      });
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement des inventaires', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventories();
  }, [statusFilter]);

  const handleDelete = async () => {
    if (!inventoryToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/inventories/${inventoryToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Inventaire supprimé avec succès', 'success');
      fetchInventories();
      setShowDeleteModal(false);
      setInventoryToDelete(null);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const handleStartInventory = async (id) => {
    try {
      const token = getToken();
      await AxiosInstance.post(`/inventories/${id}/start/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Inventaire démarré avec succès', 'success');
      fetchInventories();
    } catch (error) {
      showNotification('Erreur lors du démarrage', 'error');
    }
  };

  const handleCompleteInventory = async (id) => {
    try {
      const token = getToken();
      await AxiosInstance.post(`/inventories/${id}/complete/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Inventaire terminé avec succès', 'success');
      fetchInventories();
    } catch (error) {
      showNotification('Erreur lors de la finalisation', 'error');
    }
  };

  const filteredInventories = inventories.filter(inv => {
    const matchesSearch = !searchTerm || 
      (inv.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (inv.warehouse_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredInventories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInventories = filteredInventories.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status) => {
    const configs = {
      planned: { label: 'Planifié', className: 'badge-info' },
      in_progress: { label: 'En cours', className: 'badge-warning' },
      completed: { label: 'Terminé', className: 'badge-success' },
      cancelled: { label: 'Annulé', className: 'badge-error' },
      verified: { label: 'Vérifié', className: 'badge-primary' }
    };
    const config = configs[status] || { label: status, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
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

  const formatCurrency = (amount) => {
    if (!amount) return '0 FCFA';
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement des inventaires...</p>
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
      {showDeleteModal && inventoryToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer cet inventaire ?</p>
              <p className="font-semibold text-error mt-2">{inventoryToDelete.name}</p>
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
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5 border border-primary/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <ClipboardList className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Inventaires</h1>
              <p className="text-sm text-gray-500">
                {stats.total} inventaire(s) - {stats.in_progress} en cours, {stats.completed} terminés
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={fetchInventories} className="btn btn-sm btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={() => navigate('/inventaire/nouveau')} className="btn btn-sm btn-primary gap-2">
              <Plus className="w-4 h-4" /> Nouvel inventaire
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-primary">{stats.total}</p></div>
            <ClipboardList className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Planifiés</p><p className="text-xl font-bold text-info">{stats.planned}</p></div>
            <Calendar className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">En cours</p><p className="text-xl font-bold text-warning">{stats.in_progress}</p></div>
            <Clock className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Terminés</p><p className="text-xl font-bold text-success">{stats.completed}</p></div>
            <CheckCircle className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Vérifiés</p><p className="text-xl font-bold text-primary">{stats.verified}</p></div>
            <CheckSquare className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Annulés</p><p className="text-xl font-bold text-error">{stats.cancelled}</p></div>
            <XCircle className="w-8 h-8 text-error/20" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Rechercher par nom ou entrepôt..." 
              className="input input-bordered w-full pl-9" 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select className="select select-bordered w-full sm:w-64" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les statuts</option>
              <option value="planned">📅 Planifiés</option>
              <option value="in_progress">⏳ En cours</option>
              <option value="completed">✅ Terminés</option>
              <option value="cancelled">❌ Annulés</option>
              <option value="verified">✔️ Vérifiés</option>
            </select>
            <button className="btn btn-outline gap-2" onClick={() => { setStatusFilter('all'); setSearchTerm(''); setCurrentPage(1); }}>
              <RefreshCw className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Nom</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 hidden md:table-cell">Entrepôt</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 hidden lg:table-cell">Date début</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 hidden lg:table-cell">Date fin</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Valeur</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Statut</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInventories.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <ClipboardList className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucun inventaire trouvé</p>
                      <button onClick={() => navigate('/inventaire/nouveau')} className="btn btn-primary btn-sm gap-2">
                        <Plus className="w-4 h-4" /> Créer un inventaire
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedInventories.map(inventory => (
                  <tr key={inventory.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{inventory.name}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{inventory.description || '-'}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Warehouse className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{inventory.warehouse_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-600">
                      {formatDate(inventory.start_date)}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-600">
                      {inventory.end_date ? formatDate(inventory.end_date) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-semibold text-primary">{formatCurrency(inventory.total_actual_value || inventory.total_expected_value)}</p>
                      {inventory.total_difference !== 0 && (
                        <p className={`text-xs ${inventory.total_difference > 0 ? 'text-success' : 'text-error'}`}>
                          {inventory.total_difference > 0 ? '+' : ''}{formatCurrency(inventory.total_difference)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(inventory.status)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button 
                          onClick={() => navigate(`/inventaire/${inventory.id}`)} 
                          className="btn btn-ghost btn-sm btn-square"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {inventory.status === 'planned' && (
                          <>
                            <button 
                              onClick={() => navigate(`/inventaire/${inventory.id}/modifier`)} 
                              className="btn btn-ghost btn-sm btn-square text-warning"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleStartInventory(inventory.id)} 
                              className="btn btn-ghost btn-sm btn-square text-success"
                              title="Démarrer"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        {inventory.status === 'in_progress' && (
                          <button 
                            onClick={() => handleCompleteInventory(inventory.id)} 
                            className="btn btn-ghost btn-sm btn-square text-success"
                            title="Terminer"
                          >
                            <CheckSquare className="w-4 h-4" />
                          </button>
                        )}
                        
                        {(inventory.status === 'planned' || inventory.status === 'in_progress') && (
                          <button 
                            onClick={() => { setInventoryToDelete(inventory); setShowDeleteModal(true); }} 
                            className="btn btn-ghost btn-sm btn-square text-error"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        
                        {inventory.status === 'completed' && (
                          <button 
                            className="btn btn-ghost btn-sm btn-square text-primary"
                            title="Télécharger rapport"
                          >
                            <Download className="w-4 h-4" />
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
        {filteredInventories.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(currentPage * itemsPerPage, filteredInventories.length)} sur {filteredInventories.length}
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

      {/* Footer stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-success/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Taux de complétion</p>
            <p className="font-bold text-lg">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-warning/10 rounded-lg">
            <Activity className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="text-xs text-gray-500">En cours</p>
            <p className="font-bold text-lg">{stats.in_progress}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-info/10 rounded-lg">
            <Calendar className="w-5 h-5 text-info" />
          </div>
          <div>
            <p className="text-xs text-gray-500">À planifier</p>
            <p className="font-bold text-lg">{stats.planned}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventaireList;