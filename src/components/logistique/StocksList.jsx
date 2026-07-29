// src/components/stock/StocksList.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Package, Search, RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight, Grid3x3, List,
  AlertTriangle, Building2, TrendingUp, TrendingDown,
  Boxes, Clock, Warehouse, Percent
} from 'lucide-react';

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const StocksList = () => {
  // ==========================================================
  // HOOKS
  // ==========================================================
  const navigate = useNavigate();

  // ==========================================================
  // ÉTATS
  // ==========================================================
  // Données
  const [stocks, setStocks] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalStockValue, setTotalStockValue] = useState(0);

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // UI
  const [viewMode, setViewMode] = useState('list');
  const [notification, setNotification] = useState({ 
    show: false, 
    message: '', 
    type: 'success' 
  });

  // ==========================================================
  // FONCTIONS UTILITAIRES
  // ==========================================================
  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // ==========================================================
  // REQUÊTES API
  // ==========================================================
  const fetchStocks = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/stocks/';
      const params = new URLSearchParams();
      
      if (warehouseFilter !== 'all') {
        params.append('warehouse', warehouseFilter);
      }
      if (statusFilter === 'low_stock') {
        params.append('low_stock', 'true');
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await AxiosInstance.get(url, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      setStocks(response.data);
      
      // Calculer la valeur totale du stock
      const totalValue = response.data.reduce((sum, stock) => {
        return sum + (stock.quantity * (stock.product_purchase_price || 0));
      }, 0);
      setTotalStockValue(totalValue);
      
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
  }, [warehouseFilter, statusFilter, navigate]);

  const fetchWarehouses = useCallback(async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/warehouses/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setWarehouses(response.data.filter(w => w.is_active));
    } catch (error) {
      console.error('Erreur chargement entrepôts:', error);
    }
  }, []);

  // ==========================================================
  // EFFETS
  // ==========================================================
  useEffect(() => {
    fetchStocks();
    fetchWarehouses();
  }, [fetchStocks, fetchWarehouses]);

  // ==========================================================
  // FILTRES ET TRI
  // ==========================================================
  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = !searchTerm || 
      (stock.product_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (stock.product_code?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesWarehouse = warehouseFilter === 'all' || stock.warehouse === parseInt(warehouseFilter);
    
    return matchesSearch && matchesWarehouse;
  });

  // Tri par quantité décroissante
  const sortedStocks = [...filteredStocks].sort((a, b) => b.quantity - a.quantity);

  // ==========================================================
  // PAGINATION
  // ==========================================================
  const totalPages = Math.ceil(sortedStocks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStocks = sortedStocks.slice(startIndex, startIndex + itemsPerPage);

  // ==========================================================
  // STATISTIQUES
  // ==========================================================
  const stats = {
    total: stocks.length,
    lowStock: stocks.filter(s => s.is_low_stock).length,
    outOfStock: stocks.filter(s => s.quantity === 0).length,
    overStock: stocks.filter(s => s.is_over_stock).length,
    totalQuantity: stocks.reduce((sum, s) => sum + s.quantity, 0),
    totalValue: totalStockValue
  };

  // ==========================================================
  // FONCTIONS D' AFFICHAGE
  // ==========================================================
  const getStockStatus = (stock) => {
    if (stock.quantity === 0) {
      return { 
        label: 'Rupture', 
        color: 'error', 
        icon: <AlertTriangle className="w-3 h-3" /> 
      };
    }
    if (stock.is_low_stock) {
      return { 
        label: 'Stock faible', 
        color: 'warning', 
        icon: <AlertCircle className="w-3 h-3" /> 
      };
    }
    if (stock.is_over_stock) {
      return { 
        label: 'Stock excessif', 
        color: 'info', 
        icon: <TrendingUp className="w-3 h-3" /> 
      };
    }
    return { 
      label: 'Normal', 
      color: 'success', 
      icon: <CheckCircle className="w-3 h-3" /> 
    };
  };

  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Entrepôt inconnu';
  };

  const getStockProgress = (stock) => {
    if (stock.max_stock && stock.max_stock > 0) {
      const percentage = (stock.quantity / stock.max_stock) * 100;
      return Math.min(percentage, 100);
    }
    return 0;
  };

  const getProgressColor = (progress) => {
    if (progress > 80) return 'bg-success';
    if (progress > 50) return 'bg-warning';
    return 'bg-error';
  };

  // ==========================================================
  // RENDU : CHARGEMENT
  // ==========================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">
            Chargement des stocks...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDU : COMPOSANT PRINCIPAL
  // ==========================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      
      {/* ======================================================
          NOTIFICATION
          ====================================================== */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button 
              className="btn btn-ghost btn-xs btn-circle" 
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================
          EN-TÊTE
          ====================================================== */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Titre */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Boxes className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Gestion des Stocks
              </h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Suivez l'état des stocks par produit et entrepôt –{' '}
              <span className="font-semibold text-gray-700">{stats.total}</span> référence(s)
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={fetchStocks} 
              className="btn btn-sm sm:btn-md btn-outline gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button 
              onClick={() => navigate('/mouvements-stock')} 
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              <TrendingUp className="w-4 h-4" /> Mouvements
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================
          STATISTIQUES
          ====================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Total références */}
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Références</p>
              <p className="text-xl font-bold text-primary">{stats.total}</p>
            </div>
            <Boxes className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        
        {/* Quantité totale */}
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Quantité totale</p>
              <p className="text-xl font-bold text-primary">{stats.totalQuantity}</p>
            </div>
            <Package className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        
        {/* Valeur totale */}
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Valeur totale</p>
              <p className="text-xl font-bold text-primary">
                {stats.totalValue.toLocaleString()} FCFA
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        
        {/* Stock faible */}
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Stock faible</p>
              <p className="text-xl font-bold text-warning">{stats.lowStock}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        
        {/* Rupture */}
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Rupture</p>
              <p className="text-xl font-bold text-error">{stats.outOfStock}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-error/20" />
          </div>
        </div>
        
        {/* Stock excessif */}
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Stock excessif</p>
              <p className="text-xl font-bold text-info">{stats.overStock}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-info/20" />
          </div>
        </div>
      </div>

      {/* ======================================================
          FILTRES
          ====================================================== */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col gap-3">
          
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Rechercher par produit ou code..." 
              className="input input-bordered w-full pl-9" 
              value={searchTerm} 
              onChange={(e) => { 
                setSearchTerm(e.target.value); 
                setCurrentPage(1); 
              }} 
            />
          </div>
          
          {/* Bouton filtres mobile */}
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="btn btn-outline btn-sm sm:hidden gap-2"
          >
            <Filter className="w-4 h-4" /> 
            {showFilters ? 'Masquer' : 'Filtres'}
          </button>
          
          {/* Filtres */}
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-3 gap-3`}>
            
            {/* Filtre entrepôt */}
            <select 
              className="select select-bordered w-full" 
              value={warehouseFilter} 
              onChange={(e) => { 
                setWarehouseFilter(e.target.value); 
                setCurrentPage(1); 
              }}
            >
              <option value="all">Tous les entrepôts</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            
            {/* Filtre statut */}
            <select 
              className="select select-bordered w-full" 
              value={statusFilter} 
              onChange={(e) => { 
                setStatusFilter(e.target.value); 
                setCurrentPage(1); 
              }}
            >
              <option value="all">Tous les statuts</option>
              <option value="low_stock">Stock faible</option>
              <option value="out_of_stock">Rupture</option>
            </select>
            
            {/* Actions filtres */}
            <div className="flex gap-2">
              <button 
                className="btn btn-outline gap-2 flex-1" 
                onClick={() => { 
                  setWarehouseFilter('all'); 
                  setStatusFilter('all'); 
                  setSearchTerm(''); 
                  setCurrentPage(1); 
                }}
              >
                <RefreshCw className="w-4 h-4" /> Réinitialiser
              </button>
              
              {/* Vue liste / grille */}
              <div className="join">
                <button 
                  onClick={() => setViewMode('list')} 
                  className={`join-item btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('grid')} 
                  className={`join-item btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          TABLEAU DES STOCKS
          ====================================================== */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        
        {/* ====================================================
            VUE LISTE
            ==================================================== */}
        {viewMode === 'list' && (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3">Produit</th>
                  <th className="py-3 hidden md:table-cell">Entrepôt</th>
                  <th className="py-3 text-center">Stock actuel</th>
                  <th className="py-3 text-center hidden lg:table-cell">Occupation</th>
                  <th className="py-3 text-center">Min / Max</th>
                  <th className="py-3 text-center">Statut</th>
                  <th className="py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStocks.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <Boxes className="w-16 h-16 text-gray-300" />
                        <p className="text-gray-500 font-medium">Aucun stock trouvé</p>
                        <p className="text-sm text-gray-400">Ajustez vos filtres ou ajoutez des produits</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedStocks.map(stock => {
                    const status = getStockStatus(stock);
                    const progress = getStockProgress(stock);
                    
                    return (
                      <tr key={`${stock.product}-${stock.warehouse}`} className="hover:bg-gray-50 transition-colors">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Package className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold truncate max-w-[200px]">{stock.product_name}</p>
                              <p className="text-xs text-gray-500">{stock.product_code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="text-sm">{getWarehouseName(stock.warehouse)}</span>
                          </div>
                        </td>
                        <td className="text-center">
                          <span className={`font-bold text-lg ${
                            status.color === 'warning' ? 'text-warning' : 
                            status.color === 'error' ? 'text-error' : 
                            'text-success'
                          }`}>
                            {stock.quantity}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">u</span>
                        </td>
                        <td className="hidden lg:table-cell">
                          {stock.max_stock > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="text-center">
                          <span className="text-xs text-gray-500">{stock.min_stock} / {stock.max_stock || '∞'}</span>
                        </td>
                        <td className="text-center">
                          <span className={`badge badge-${status.color} gap-1 px-3 py-1.5`}>
                            {status.icon} {status.label}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              onClick={() => navigate(`/stocks/${stock.product}`)} 
                              className="btn btn-ghost btn-sm btn-circle"
                              title="Détails du stock"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => navigate(`/mouvements-stock?product=${stock.product}`)} 
                              className="btn btn-ghost btn-sm btn-circle"
                              title="Voir les mouvements"
                            >
                              <TrendingUp className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ====================================================
            VUE GRILLE
            ==================================================== */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {paginatedStocks.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <Boxes className="w-16 h-16 text-gray-300" />
                  <p className="text-gray-500 font-medium">Aucun stock trouvé</p>
                  <p className="text-sm text-gray-400">Ajustez vos filtres</p>
                </div>
              </div>
            ) : (
              paginatedStocks.map(stock => {
                const status = getStockStatus(stock);
                const progress = getStockProgress(stock);
                
                return (
                  <div key={`${stock.product}-${stock.warehouse}`} className="bg-white shadow-md hover:shadow-xl transition-all duration-300 rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Package className="w-6 h-6 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold truncate">{stock.product_name}</h3>
                            <p className="text-xs text-gray-500">{stock.product_code}</p>
                          </div>
                        </div>
                        <span className={`badge badge-${status.color} gap-1 flex-shrink-0`}>
                          {status.icon} {status.label}
                        </span>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Stock actuel</span>
                          <span className={`font-bold text-xl ${
                            status.color === 'warning' ? 'text-warning' : 
                            status.color === 'error' ? 'text-error' : 
                            'text-success'
                          }`}>
                            {stock.quantity} <span className="text-xs font-normal text-gray-400">u</span>
                          </span>
                        </div>
                        
                        {stock.max_stock > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Occupation</span>
                              <span className="text-gray-600">{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500">Stock min</p>
                            <p className="font-medium">{stock.min_stock}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Stock max</p>
                            <p className="font-medium">{stock.max_stock || '∞'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 text-sm">
                          <Warehouse className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600">{getWarehouseName(stock.warehouse)}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                        <button 
                          onClick={() => navigate(`/stocks/${stock.product}`)} 
                          className="btn btn-sm btn-ghost"
                        >
                          <Eye className="w-4 h-4 mr-1" /> Détails
                        </button>
                        <button 
                          onClick={() => navigate(`/mouvements-stock?product=${stock.product}`)} 
                          className="btn btn-sm btn-outline"
                        >
                          <TrendingUp className="w-4 h-4 mr-1" /> Mouvements
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ====================================================
            PAGINATION
            ==================================================== */}
        {sortedStocks.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Affichage de <span className="font-medium">{startIndex + 1}</span> à{' '}
              <span className="font-medium">{Math.min(currentPage * itemsPerPage, sortedStocks.length)}</span> sur{' '}
              <span className="font-medium">{sortedStocks.length}</span> références
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
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="join-item btn btn-sm btn-disabled">
                  {currentPage} / {totalPages}
                </span>
                <button 
                  className="join-item btn btn-sm" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} 
                  disabled={currentPage === totalPages}
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

export default StocksList;