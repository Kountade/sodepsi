// src/components/tresorerie/ComptesBancairesList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, Landmark,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight,
  Building2, CreditCard, DollarSign,
  Calendar, Clock, Check, Archive
} from 'lucide-react';

const ComptesBancairesList = () => {
  const navigate = useNavigate();
  const [comptes, setComptes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [compteToDelete, setCompteToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchComptes = async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/comptes-bancaires/';
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
      setComptes(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement des comptes bancaires', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComptes();
  }, [typeFilter, statusFilter]);

  const handleDelete = async () => {
    if (!compteToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/comptes-bancaires/${compteToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Compte bancaire supprimé avec succès', 'success');
      fetchComptes();
      setShowDeleteModal(false);
      setCompteToDelete(null);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const filteredComptes = comptes.filter(compte => {
    const matchesSearch = !searchTerm || 
      (compte.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (compte.banque?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (compte.numero_compte?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || compte.type_compte === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' ? compte.is_active : !compte.is_active);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredComptes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedComptes = filteredComptes.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: comptes.length,
    actifs: comptes.filter(c => c.is_active).length,
    inactifs: comptes.filter(c => !c.is_active).length,
    solde_total: comptes.reduce((acc, c) => acc + parseFloat(c.solde_actuel || 0), 0)
  };

  const getTypeBadge = (type) => {
    const configs = {
      courant: { label: 'Courant', className: 'badge-primary' },
      epargne: { label: 'Épargne', className: 'badge-success' },
      bloque: { label: 'Bloqué', className: 'badge-warning' }
    };
    const config = configs[type] || { label: type, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  const getStatusBadge = (isActive) => {
    return isActive 
      ? <span className="badge badge-success gap-1"><Check className="w-3 h-3" /> Actif</span>
      : <span className="badge badge-error gap-1"><X className="w-3 h-3" /> Inactif</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement des comptes bancaires...</p>
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
      {showDeleteModal && compteToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer ce compte bancaire ?</p>
              <p className="font-semibold text-error mt-2">{compteToDelete.nom} - {compteToDelete.banque}</p>
              {parseFloat(compteToDelete.solde_actuel || 0) > 0 && (
                <p className="text-warning text-sm mt-2">⚠️ Solde: {parseFloat(compteToDelete.solde_actuel || 0).toLocaleString()} FCFA</p>
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
                <Landmark className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Comptes Bancaires</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Gestion des comptes bancaires – {stats.total} compte(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchComptes} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={() => navigate('/comptes-bancaires/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2">
              <Plus className="w-4 h-4" /> Nouveau compte
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-primary">{stats.total}</p></div>
            <Landmark className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Actifs</p><p className="text-xl font-bold text-success">{stats.actifs}</p></div>
            <Check className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Inactifs</p><p className="text-xl font-bold text-error">{stats.inactifs}</p></div>
            <X className="w-8 h-8 text-error/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
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
              placeholder="Rechercher par nom, banque, numéro de compte..." 
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
              <option value="courant">Courants</option>
              <option value="epargne">Épargne</option>
              <option value="bloque">Bloqués</option>
            </select>
            <select className="select select-bordered w-full" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
            <button className="btn btn-outline gap-2" onClick={() => { setTypeFilter('all'); setStatusFilter('all'); setSearchTerm(''); setCurrentPage(1); }}>
              <RefreshCw className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3">Compte</th>
                <th className="py-3 hidden md:table-cell">Banque</th>
                <th className="py-3">Solde</th>
                <th className="py-3 hidden lg:table-cell">Type</th>
                <th className="py-3 text-center">Statut</th>
                <th className="py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedComptes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Landmark className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucun compte bancaire trouvé</p>
                      <button onClick={() => navigate('/comptes-bancaires/nouveau')} className="btn btn-primary btn-sm gap-2">
                        <Plus className="w-4 h-4" /> Ajouter un compte
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedComptes.map(compte => (
                  <tr key={compte.id} className="hover:bg-gray-50">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{compte.nom}</p>
                          <p className="text-xs text-gray-500">{compte.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span>{compte.banque}</span>
                      </div>
                      <p className="text-xs text-gray-400">{compte.numero_compte}</p>
                    </td>
                    <td>
                      <p className="font-bold text-primary">
                        {parseFloat(compte.solde_actuel || 0).toLocaleString()} FCFA
                      </p>
                      <p className="text-xs text-gray-400">
                        Initial: {parseFloat(compte.solde_initial || 0).toLocaleString()} FCFA
                      </p>
                    </td>
                    <td className="hidden lg:table-cell">{getTypeBadge(compte.type_compte)}</td>
                    <td className="text-center">{getStatusBadge(compte.is_active)}</td>
                    <td className="text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => navigate(`/comptes-bancaires/${compte.id}`)} className="btn btn-ghost btn-sm btn-circle">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => navigate(`/comptes-bancaires/${compte.id}/modifier`)} className="btn btn-ghost btn-sm btn-circle">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setCompteToDelete(compte); setShowDeleteModal(true); }} className="btn btn-ghost btn-sm btn-circle text-error">
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
        {filteredComptes.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(currentPage * itemsPerPage, filteredComptes.length)} sur {filteredComptes.length}
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

export default ComptesBancairesList;