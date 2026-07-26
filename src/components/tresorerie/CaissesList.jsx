// src/components/tresorerie/CaissesList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, Wallet,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight,
  Banknote, Building2, User, Clock,
  TrendingUp, TrendingDown, AlertTriangle,
  DollarSign, Shield, Check, Archive
} from 'lucide-react';

const CaissesList = () => {
  const navigate = useNavigate();
  const [caisses, setCaisses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [caisseToDelete, setCaisseToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchCaisses = async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/caisses/';
      const params = new URLSearchParams();
      
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      if (statusFilter !== 'all') {
        params.append('is_active', statusFilter === 'active' ? 'true' : 'false');
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
      setCaisses(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement des caisses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaisses();
  }, [typeFilter, statusFilter]);

  const handleDelete = async () => {
    if (!caisseToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/caisses/${caisseToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Caisse supprimée avec succès', 'success');
      fetchCaisses();
      setShowDeleteModal(false);
      setCaisseToDelete(null);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const filteredCaisses = caisses.filter(caisse => {
    const matchesSearch = !searchTerm || 
      (caisse.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (caisse.code?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || caisse.type_caisse === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' ? caisse.is_active : !caisse.is_active);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCaisses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCaisses = filteredCaisses.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: caisses.length,
    actives: caisses.filter(c => c.is_active).length,
    inactives: caisses.filter(c => !c.is_active).length,
    sous_seuil: caisses.filter(c => c.est_sous_seuil_min).length,
    sur_seuil: caisses.filter(c => c.est_sur_seuil_max).length,
    solde_total: caisses.reduce((acc, c) => acc + parseFloat(c.solde_actuel || 0), 0)
  };

  const getTypeBadge = (type) => {
    const configs = {
      principale: { label: 'Principale', className: 'badge-primary' },
      secondaire: { label: 'Secondaire', className: 'badge-info' },
      mobile: { label: 'Mobile', className: 'badge-warning' },
      virtuelle: { label: 'Virtuelle', className: 'badge-secondary' }
    };
    const config = configs[type] || { label: type, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  const getStatusBadge = (isActive) => {
    return isActive 
      ? <span className="badge badge-success gap-1"><Check className="w-3 h-3" /> Active</span>
      : <span className="badge badge-error gap-1"><X className="w-3 h-3" /> Inactive</span>;
  };

  const getSoldeClass = (solde, seuil_min, seuil_max) => {
    if (seuil_min > 0 && solde < seuil_min) return 'text-error';
    if (seuil_max > 0 && solde > seuil_max) return 'text-warning';
    return 'text-success';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement des caisses...</p>
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
      {showDeleteModal && caisseToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer cette caisse ?</p>
              <p className="font-semibold text-error mt-2">{caisseToDelete.nom}</p>
              {parseFloat(caisseToDelete.solde_actuel || 0) > 0 && (
                <p className="text-warning text-sm mt-2">⚠️ Solde: {parseFloat(caisseToDelete.solde_actuel || 0).toLocaleString()} FCFA</p>
              )}
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
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Caisses</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Gestion des caisses – {stats.total} caisse(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchCaisses} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={() => navigate('/caisses/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2">
              <Plus className="w-4 h-4" /> Nouvelle caisse
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-primary">{stats.total}</p></div>
            <Wallet className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Actives</p><p className="text-xl font-bold text-success">{stats.actives}</p></div>
            <Check className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Sous seuil</p><p className="text-xl font-bold text-error">{stats.sous_seuil}</p></div>
            <AlertTriangle className="w-8 h-8 text-error/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Sur seuil</p><p className="text-xl font-bold text-warning">{stats.sur_seuil}</p></div>
            <TrendingUp className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3 sm:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Solde total</p><p className="text-xl font-bold text-primary">{stats.solde_total.toLocaleString()} FCFA</p></div>
            <DollarSign className="w-8 h-8 text-primary/20" />
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
              placeholder="Rechercher par nom, code..." 
              className="input input-bordered w-full pl-9" 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline btn-sm sm:hidden gap-2">
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer' : 'Filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-3 gap-3`}>
            <select className="select select-bordered w-full" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les types</option>
              <option value="principale">Principales</option>
              <option value="secondaire">Secondaires</option>
              <option value="mobile">Mobiles</option>
              <option value="virtuelle">Virtuelles</option>
            </select>
            <select className="select select-bordered w-full" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les statuts</option>
              <option value="active">Actives</option>
              <option value="inactive">Inactives</option>
            </select>
            <button className="btn btn-outline gap-2" onClick={() => { setTypeFilter('all'); setStatusFilter('all'); setSearchTerm(''); setCurrentPage(1); }}>
              <RefreshCw className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Tableau des caisses */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3">Caisse</th>
                <th className="py-3 hidden md:table-cell">Type</th>
                <th className="py-3">Solde</th>
                <th className="py-3 hidden lg:table-cell">Seuils</th>
                <th className="py-3 text-center">Statut</th>
                <th className="py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCaisses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Wallet className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucune caisse trouvée</p>
                      <button onClick={() => navigate('/caisses/nouveau')} className="btn btn-primary btn-sm gap-2">
                        <Plus className="w-4 h-4" /> Ajouter une caisse
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCaisses.map(caisse => (
                  <tr key={caisse.id} className="hover:bg-gray-50">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Banknote className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{caisse.nom}</p>
                          <p className="text-xs text-gray-500">{caisse.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">{getTypeBadge(caisse.type_caisse)}</td>
                    <td>
                      <div>
                        <p className={`font-bold ${getSoldeClass(parseFloat(caisse.solde_actuel || 0), parseFloat(caisse.seuil_min || 0), parseFloat(caisse.seuil_max || 0))}`}>
                          {parseFloat(caisse.solde_actuel || 0).toLocaleString()} FCFA
                        </p>
                        <p className="text-xs text-gray-400">
                          Initial: {parseFloat(caisse.solde_initial || 0).toLocaleString()} FCFA
                        </p>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell">
                      <div className="space-y-1">
                        <div className="text-xs">
                          <span className="text-gray-500">Min:</span>
                          <span className="ml-1">{parseFloat(caisse.seuil_min || 0).toLocaleString()} FCFA</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-500">Max:</span>
                          <span className="ml-1">{parseFloat(caisse.seuil_max || 0).toLocaleString()} FCFA</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        {getStatusBadge(caisse.is_active)}
                        {caisse.est_sous_seuil_min && (
                          <span className="badge badge-error badge-xs gap-1">
                            <AlertTriangle className="w-3 h-3" /> Sous seuil
                          </span>
                        )}
                        {caisse.est_sur_seuil_max && (
                          <span className="badge badge-warning badge-xs gap-1">
                            <TrendingUp className="w-3 h-3" /> Sur seuil
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => navigate(`/caisses/${caisse.id}`)} className="btn btn-ghost btn-sm btn-circle">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => navigate(`/caisses/${caisse.id}/modifier`)} className="btn btn-ghost btn-sm btn-circle">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setCaisseToDelete(caisse); setShowDeleteModal(true); }} className="btn btn-ghost btn-sm btn-circle text-error">
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
        {filteredCaisses.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(currentPage * itemsPerPage, filteredCaisses.length)} sur {filteredCaisses.length}
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
                <button className="join-item btn btn-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}>
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

export default CaissesList;