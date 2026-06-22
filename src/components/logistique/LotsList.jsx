// src/components/stock/LotsList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Package, Search, RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight,
  AlertTriangle, Building2, Clock, Calendar,
  Layers, TrendingDown, Ban
} from 'lucide-react';

const LotsList = () => {
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [warehouses, setWarehouses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchLots = async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/lots/';
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        if (statusFilter === 'expiring') params.append('expiring', 'true');
        if (statusFilter === 'expired') params.append('expired', 'true');
        if (statusFilter === 'available') params.append('available', 'true');
      }
      if (warehouseFilter !== 'all') {
        params.append('warehouse', warehouseFilter);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await AxiosInstance.get(url, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setLots(response.data);
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

  const fetchWarehouses = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/warehouses/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setWarehouses(response.data.filter(w => w.is_active));
    } catch (error) {
      console.error('Erreur chargement entrepôts:', error);
    }
  };

  useEffect(() => {
    fetchLots();
    fetchWarehouses();
  }, [statusFilter, warehouseFilter]);

  const filteredLots = lots.filter(lot => {
    const matchesSearch = !searchTerm || 
      (lot.product_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (lot.lot_number?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredLots.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLots = filteredLots.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: lots.length,
    expiring: lots.filter(l => l.status === 'expiring').length,
    expired: lots.filter(l => l.status === 'expired').length,
    good: lots.filter(l => l.status === 'good').length
  };

  const getStatusBadge = (status, daysLeft) => {
    switch(status) {
      case 'expired':
        return <span className="badge badge-error gap-1"><Ban className="w-3 h-3" /> Expiré</span>;
      case 'expiring':
        return <span className="badge badge-warning gap-1"><Clock className="w-3 h-3" /> Expire dans {daysLeft}j</span>;
      case 'good':
        return <span className="badge badge-success gap-1"><CheckCircle className="w-3 h-3" /> Valide</span>;
      default:
        return <span className="badge badge-ghost">{status}</span>;
    }
  };

  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'N/A';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement des lots...</p>
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
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification(prev => ({ ...prev, show: false }))}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Layers className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Gestion des Lots</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Suivez les lots par date d'expiration – {stats.total} lot(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchLots} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total lots</p><p className="text-xl font-bold text-primary">{stats.total}</p></div>
            <Layers className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Valides</p><p className="text-xl font-bold text-success">{stats.good}</p></div>
            <CheckCircle className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Expire bientôt</p><p className="text-xl font-bold text-warning">{stats.expiring}</p></div>
            <Clock className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Expirés</p><p className="text-xl font-bold text-error">{stats.expired}</p></div>
            <AlertTriangle className="w-8 h-8 text-error/20" />
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
              placeholder="Rechercher par produit ou numéro de lot..." 
              className="input input-bordered w-full pl-9" 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline btn-sm sm:hidden gap-2">
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer' : 'Filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-3 gap-3`}>
            <select className="select select-bordered w-full" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les statuts</option>
              <option value="good">Valides</option>
              <option value="expiring">Expire bientôt</option>
              <option value="expired">Expirés</option>
              <option value="available">Disponibles</option>
            </select>
            <select className="select select-bordered w-full" value={warehouseFilter} onChange={(e) => { setWarehouseFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les entrepôts</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <button className="btn btn-outline gap-2" onClick={() => { setStatusFilter('all'); setWarehouseFilter('all'); setSearchTerm(''); setCurrentPage(1); }}>
              <RefreshCw className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Tableau des lots */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3">Produit / Lot</th>
                <th className="py-3 hidden md:table-cell">Entrepôt</th>
                <th className="py-3 text-center">Quantité</th>
                <th className="py-3 text-center">Date expiration</th>
                <th className="py-3 text-center">Statut</th>
                <th className="py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLots.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Layers className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucun lot trouvé</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLots.map(lot => (
                  <tr key={lot.id} className="hover:bg-gray-50">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{lot.product_name}</p>
                          <p className="text-xs text-gray-500">Lot: {lot.lot_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">{getWarehouseName(lot.warehouse)}</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="font-semibold">{lot.current_quantity}</span>
                      <span className="text-xs text-gray-400 ml-1">/{lot.initial_quantity}</span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className={`text-sm ${lot.days_until_expiry <= 7 ? 'text-error font-semibold' : lot.days_until_expiry <= 30 ? 'text-warning' : ''}`}>
                          {new Date(lot.expiry_date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="text-center">
                      {getStatusBadge(lot.status, lot.days_until_expiry)}
                    </td>
                    <td className="text-center">
                      <button 
                        onClick={() => navigate(`/lots/${lot.id}`)} 
                        className="btn btn-ghost btn-sm btn-circle"
                        title="Détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredLots.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(currentPage * itemsPerPage, filteredLots.length)} sur {filteredLots.length}
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

export default LotsList;