// src/components/stock/MouvementsStock.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  TrendingUp, Search, RefreshCw, X, CheckCircle, AlertCircle,
  Filter, ChevronLeft, ChevronRight, Package,
  ArrowRightLeft, Calendar, Download, Eye
} from 'lucide-react';

const MouvementsStock = () => {
  const navigate = useNavigate();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/movements/';
      const params = new URLSearchParams();
      
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      if (dateFrom) {
        params.append('date_from', dateFrom);
      }
      if (dateTo) {
        params.append('date_to', dateTo);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await AxiosInstance.get(url, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setMovements(response.data);
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
    fetchMovements();
  }, [typeFilter, dateFrom, dateTo]);

  const filteredMovements = movements.filter(movement => {
    const matchesSearch = !searchTerm || 
      (movement.product_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (movement.lot_number?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMovements = filteredMovements.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: movements.length,
    entrees: movements.filter(m => m.movement_type === 'purchase_in' || m.movement_type === 'transfer_in' || m.movement_type === 'return_in').length,
    sorties: movements.filter(m => m.movement_type === 'sale_out' || m.movement_type === 'transfer_out' || m.movement_type === 'expired_out').length,
    ajustements: movements.filter(m => m.movement_type === 'adjustment_plus' || m.movement_type === 'adjustment_minus').length
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'purchase_in': return 'Entrée achat';
      case 'sale_out': return 'Sortie vente';
      case 'transfer_in': return 'Entrée transfert';
      case 'transfer_out': return 'Sortie transfert';
      case 'adjustment_plus': return 'Ajustement +';
      case 'adjustment_minus': return 'Ajustement -';
      case 'return_in': return 'Retour client';
      case 'return_out': return 'Retour fournisseur';
      case 'expired_out': return 'Péremption';
      case 'damaged_out': return 'Perte/Dommage';
      case 'inventory_adjustment': return 'Ajustement inventaire';
      default: return type;
    }
  };

  const getTypeBadge = (type) => {
    if (type.includes('in') || type === 'adjustment_plus') {
      return <span className="badge badge-success gap-1"><CheckCircle className="w-3 h-3" /> {getTypeLabel(type)}</span>;
    } else if (type.includes('out') || type === 'adjustment_minus') {
      return <span className="badge badge-error gap-1"><X className="w-3 h-3" /> {getTypeLabel(type)}</span>;
    }
    return <span className="badge badge-warning">{getTypeLabel(type)}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement des mouvements...</p>
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

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <TrendingUp className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Mouvements de stock</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Historique des mouvements – {stats.total} mouvement(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchMovements} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button className="btn btn-sm sm:btn-md btn-outline gap-2">
              <Download className="w-4 h-4" /> Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-primary">{stats.total}</p></div>
            <TrendingUp className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Entrées</p><p className="text-xl font-bold text-success">{stats.entrees}</p></div>
            <CheckCircle className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Sorties</p><p className="text-xl font-bold text-error">{stats.sorties}</p></div>
            <X className="w-8 h-8 text-error/20" />
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
              placeholder="Rechercher par produit ou lot..." 
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
              <option value="purchase_in">Entrées achat</option>
              <option value="sale_out">Sorties vente</option>
              <option value="transfer_in">Entrées transfert</option>
              <option value="transfer_out">Sorties transfert</option>
              <option value="adjustment_plus">Ajustements +</option>
              <option value="adjustment_minus">Ajustements -</option>
              <option value="expired_out">Péremptions</option>
              <option value="inventory_adjustment">Ajustements inventaire</option>
            </select>
            <input type="date" className="input input-bordered" placeholder="Date début" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <input type="date" className="input input-bordered" placeholder="Date fin" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            <button className="btn btn-outline gap-2" onClick={() => { setTypeFilter('all'); setDateFrom(''); setDateTo(''); setSearchTerm(''); setCurrentPage(1); }}>
              <RefreshCw className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Tableau des mouvements */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3">Date</th>
                <th className="py-3">Produit / Lot</th>
                <th className="py-3">Type</th>
                <th className="py-3 text-center">Quantité</th>
                <th className="py-3 hidden lg:table-cell">Référence</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMovements.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <TrendingUp className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucun mouvement trouvé</p>
                    </div>
                  </td>
                 </tr>
              ) : (
                paginatedMovements.map(movement => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">{new Date(movement.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{movement.product_name}</p>
                          {movement.lot_number && (
                            <p className="text-xs text-gray-500">Lot: {movement.lot_number}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      {getTypeBadge(movement.movement_type)}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`font-bold ${movement.movement_type.includes('in') || movement.movement_type === 'adjustment_plus' ? 'text-success' : 'text-error'}`}>
                        {movement.movement_type.includes('in') || movement.movement_type === 'adjustment_plus' ? '+' : '-'}{movement.quantity}
                      </span>
                    </td>
                    <td className="py-3 hidden lg:table-cell">
                      <span className="text-xs text-gray-500">{movement.reference_number || '-'}</span>
                    </td>
                    <td className="py-3">
                      <button onClick={() => navigate(`/mouvements-stock/${movement.id}`)} className="btn btn-ghost btn-sm btn-circle">
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
        {filteredMovements.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(currentPage * itemsPerPage, filteredMovements.length)} sur {filteredMovements.length}
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
                <span className="join-item btn btn-sm btn-disabled">Page {currentPage} / {totalPages}</span>
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

export default MouvementsStock;