// src/components/achats/FournisseursList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, Truck,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter,
  ChevronLeft, ChevronRight, Grid3x3, List,
  Archive, Star, Building2, Phone, Mail, MapPin,
  TrendingUp, Clock, Globe
} from 'lucide-react';

const FournisseursList = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [viewMode, setViewMode] = useState('list');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/suppliers/';
      const params = new URLSearchParams();
      
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      if (statusFilter !== 'all') {
        params.append('is_active', statusFilter === 'active');
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
      setSuppliers(response.data);
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
    fetchSuppliers();
  }, [typeFilter, statusFilter]);

  const handleDelete = async () => {
    if (!supplierToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/suppliers/${supplierToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Fournisseur supprimé', 'success');
      fetchSuppliers();
      setShowDeleteModal(false);
      setSupplierToDelete(null);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = !searchTerm || 
      (supplier.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (supplier.code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (supplier.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (supplier.phone?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSuppliers = filteredSuppliers.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: suppliers.length,
    actifs: suppliers.filter(s => s.is_active).length,
    inactifs: suppliers.filter(s => !s.is_active).length,
    preferes: suppliers.filter(s => s.is_preferred).length,
    locaux: suppliers.filter(s => s.type === 'local').length,
    internationaux: suppliers.filter(s => s.type === 'international').length
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'local': return 'Local';
      case 'international': return 'International';
      case 'importateur': return 'Importateur';
      case 'distributeur': return 'Distributeur';
      case 'fabricant': return 'Fabricant';
      default: return type;
    }
  };

  const getTypeBadge = (type) => {
    const colors = {
      local: 'badge-info',
      international: 'badge-primary',
      importateur: 'badge-secondary',
      distributeur: 'badge-warning',
      fabricant: 'badge-success'
    };
    return <span className={`badge ${colors[type] || 'badge-ghost'}`}>{getTypeLabel(type)}</span>;
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-3 h-3 text-warning fill-warning" />);
    }
    const emptyStars = 5 - fullStars;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-3 h-3 text-gray-300" />);
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement des fournisseurs...</p>
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
      {showDeleteModal && supplierToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer ce fournisseur ?</p>
              <p className="font-semibold text-error mt-2">{supplierToDelete.name}</p>
              {supplierToDelete.total_purchases > 0 && (
                <p className="text-warning text-sm mt-2">⚠️ Total achats: {supplierToDelete.total_purchases?.toLocaleString()} FCFA</p>
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
                <Truck className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Fournisseurs</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Gérez votre base de fournisseurs – {stats.total} fournisseur(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchSuppliers} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={() => navigate('/fournisseurs/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2">
              <Plus className="w-4 h-4" /> Nouveau fournisseur
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-primary">{stats.total}</p></div>
            <Truck className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Actifs</p><p className="text-xl font-bold text-success">{stats.actifs}</p></div>
            <CheckCircle className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Privilégiés</p><p className="text-xl font-bold text-warning">{stats.preferes}</p></div>
            <Star className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Locaux</p><p className="text-xl font-bold text-info">{stats.locaux}</p></div>
            <Building2 className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Internationaux</p><p className="text-xl font-bold text-secondary">{stats.internationaux}</p></div>
            <Globe className="w-8 h-8 text-secondary/20" />
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
              placeholder="Rechercher par nom, code, email, téléphone..." 
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
              <option value="local">Locaux</option>
              <option value="international">Internationaux</option>
              <option value="importateur">Importateurs</option>
              <option value="distributeur">Distributeurs</option>
              <option value="fabricant">Fabricants</option>
            </select>
            <select className="select select-bordered w-full" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
            <div className="flex gap-2">
              <button className="btn btn-outline gap-2 flex-1" onClick={() => { setTypeFilter('all'); setStatusFilter('all'); setSearchTerm(''); setCurrentPage(1); }}>
                <RefreshCw className="w-4 h-4" /> Réinitialiser
              </button>
              <div className="join">
                <button onClick={() => setViewMode('list')} className={`join-item btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}>
                  <List className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('grid')} className={`join-item btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}>
                  <Grid3x3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des fournisseurs */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3">Fournisseur</th>
                  <th className="py-3 hidden md:table-cell">Contact</th>
                  <th className="py-3 hidden lg:table-cell">Ville</th>
                  <th className="py-3 text-center">Type</th>
                  <th className="py-3 text-center">Note</th>
                  <th className="py-3 text-center">Statut</th>
                  <th className="py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <Truck className="w-16 h-16 text-gray-300" />
                        <p className="text-gray-500 font-medium">Aucun fournisseur trouvé</p>
                        <button onClick={() => navigate('/fournisseurs/nouveau')} className="btn btn-primary btn-sm gap-2">
                          <Plus className="w-4 h-4" /> Ajouter un fournisseur
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedSuppliers.map(supplier => (
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Truck className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{supplier.name}</p>
                            <p className="text-xs text-gray-500">{supplier.code}</p>
                            {supplier.is_preferred && (
                              <span className="badge badge-warning badge-xs mt-1">Privilégié</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell">
                        <div className="space-y-1">
                          {supplier.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span>{supplier.phone}</span>
                            </div>
                          )}
                          {supplier.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span className="truncate max-w-[150px]">{supplier.email}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{supplier.city || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="text-center">{getTypeBadge(supplier.type)}</td>
                      <td className="text-center">
                        <div className="flex justify-center gap-0.5">
                          {getRatingStars(supplier.rating)}
                        </div>
                      </td>
                      <td className="text-center">
                        {supplier.is_active ? (
                          <span className="badge badge-success">Actif</span>
                        ) : (
                          <span className="badge badge-error">Inactif</span>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => navigate(`/fournisseurs/${supplier.id}`)} className="btn btn-ghost btn-sm btn-circle">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => navigate(`/fournisseurs/${supplier.id}/modifier`)} className="btn btn-ghost btn-sm btn-circle">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setSupplierToDelete(supplier); setShowDeleteModal(true); }} className="btn btn-ghost btn-sm btn-circle text-error">
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {paginatedSuppliers.map(supplier => (
              <div key={supplier.id} className="bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Truck className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{supplier.name}</h3>
                        <p className="text-xs text-gray-500">{supplier.code}</p>
                      </div>
                    </div>
                    {supplier.is_preferred && (
                      <Star className="w-5 h-5 text-warning fill-warning" />
                    )}
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Type</span>
                      {getTypeBadge(supplier.type)}
                    </div>
                    {supplier.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span className="truncate">{supplier.email}</span>
                      </div>
                    )}
                    {supplier.city && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span>{supplier.city}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm pt-2 border-t">
                      <span className="text-gray-500">Note</span>
                      <div className="flex gap-0.5">{getRatingStars(supplier.rating)}</div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Statut</span>
                      {supplier.is_active ? (
                        <span className="badge badge-success">Actif</span>
                      ) : (
                        <span className="badge badge-error">Inactif</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                    <button onClick={() => navigate(`/fournisseurs/${supplier.id}`)} className="btn btn-sm btn-ghost">Détails</button>
                    <button onClick={() => navigate(`/fournisseurs/${supplier.id}/modifier`)} className="btn btn-sm btn-primary">Modifier</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredSuppliers.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(currentPage * itemsPerPage, filteredSuppliers.length)} sur {filteredSuppliers.length}
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

export default FournisseursList;