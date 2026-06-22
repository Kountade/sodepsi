// src/components/stock/ProductsList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, Package,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter,
  ChevronLeft, ChevronRight, Grid3x3, List,
  Archive, AlertTriangle,
  Clock
} from 'lucide-react';

const ProductsList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [viewMode, setViewMode] = useState('list');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/products/';
      const params = new URLSearchParams();
      
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
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
      setProducts(response.data);
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

  const fetchCategories = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/categories/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [categoryFilter, statusFilter]);

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/products/${productToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Produit supprimé', 'success');
      fetchProducts();
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      (product.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (product.code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (product.barcode?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === parseInt(categoryFilter);
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: products.length,
    actifs: products.filter(p => p.status === 'active').length,
    inactifs: products.filter(p => p.status === 'inactive').length,
    rupture: products.filter(p => p.status === 'out_of_stock').length,
    stockFaible: products.filter(p => (p.current_stock || 0) <= (p.min_stock || 0) && (p.current_stock || 0) > 0).length
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return <span className="badge badge-success">Actif</span>;
      case 'inactive': return <span className="badge badge-error">Inactif</span>;
      case 'out_of_stock': return <span className="badge badge-warning">Rupture</span>;
      default: return <span className="badge badge-ghost">{status}</span>;
    }
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Non catégorisé';
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : 'Non catégorisé';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement des produits...</p>
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
      {showDeleteModal && productToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer ce produit ?</p>
              <p className="font-semibold text-error mt-2">{productToDelete.name}</p>
              {(productToDelete.current_stock || 0) > 0 && (
                <p className="text-warning text-sm mt-2">⚠️ Stock actuel: {productToDelete.current_stock} unités</p>
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
                <Package className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Produits</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Gérez votre catalogue de produits – {stats.total} produit(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchProducts} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={() => navigate('/produits/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2">
              <Plus className="w-4 h-4" /> Nouveau produit
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-primary">{stats.total}</p></div>
            <Package className="w-8 h-8 text-primary/20" />
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
            <div><p className="text-xs text-gray-500">Inactifs</p><p className="text-xl font-bold text-error">{stats.inactifs}</p></div>
            <Archive className="w-8 h-8 text-error/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Rupture</p><p className="text-xl font-bold text-warning">{stats.rupture}</p></div>
            <AlertTriangle className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Stock faible</p><p className="text-xl font-bold text-info">{stats.stockFaible}</p></div>
            <AlertCircle className="w-8 h-8 text-info/20" />
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
              placeholder="Rechercher par nom, code, code-barres..." 
              className="input input-bordered w-full pl-9" 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline btn-sm sm:hidden gap-2">
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer' : 'Filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-3 gap-3`}>
            <select className="select select-bordered w-full" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Toutes les catégories</option>
              {categories.filter(c => c.is_active).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select className="select select-bordered w-full" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="out_of_stock">Rupture</option>
            </select>
            <div className="flex gap-2">
              <button className="btn btn-outline gap-2 flex-1" onClick={() => { setCategoryFilter('all'); setStatusFilter('all'); setSearchTerm(''); setCurrentPage(1); }}>
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

      {/* Tableau des produits */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3">Produit</th>
                  <th className="py-3 hidden md:table-cell">Catégorie</th>
                  <th className="py-3 text-center">Stock</th>
                  <th className="py-3 text-center">Prix vente</th>
                  <th className="py-3 text-center">Expiration</th>
                  <th className="py-3 text-center">Statut</th>
                  <th className="py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <Package className="w-16 h-16 text-gray-300" />
                        <p className="text-gray-500 font-medium">Aucun produit trouvé</p>
                        <button onClick={() => navigate('/produits/nouveau')} className="btn btn-primary btn-sm gap-2">
                          <Plus className="w-4 h-4" /> Ajouter un produit
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Package className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="badge badge-ghost">{getCategoryName(product.category)}</span>
                      </td>
                      <td className="text-center">
                        <span className={`font-semibold ${(product.current_stock || 0) <= (product.min_stock || 0) ? 'text-warning' : 'text-success'}`}>
                          {product.current_stock || 0}
                        </span>
                      </td>
                      <td className="text-center font-semibold">{product.selling_price?.toLocaleString()} F</td>
                      <td className="text-center">
                        {product.has_expiry ? (
                          <div className="flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3 text-warning" />
                            <span className="text-xs">Oui</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Non</span>
                        )}
                       </td>
                      <td className="text-center">{getStatusBadge(product.status)}</td>
                      <td className="text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => navigate(`/produits/${product.id}`)} className="btn btn-ghost btn-sm btn-circle">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => navigate(`/produits/${product.id}/modifier`)} className="btn btn-ghost btn-sm btn-circle">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setProductToDelete(product); setShowDeleteModal(true); }} className="btn btn-ghost btn-sm btn-circle text-error">
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
            {paginatedProducts.map(product => (
              <div key={product.id} className="bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-xs text-gray-500">{product.code}</p>
                      </div>
                    </div>
                    {getStatusBadge(product.status)}
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600 line-clamp-2">{product.description || 'Aucune description'}</p>
                    <div className="flex justify-between items-center pt-2">
                      <div>
                        <p className="text-xs text-gray-500">Stock</p>
                        <p className="font-bold text-lg">{product.current_stock || 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Prix vente</p>
                        <p className="font-bold text-primary">{product.selling_price?.toLocaleString()} F</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
                      <span>Catégorie: {getCategoryName(product.category)}</span>
                      {product.has_expiry && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Avec expiration</span>}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-3 pt-2 border-t">
                    <button onClick={() => navigate(`/produits/${product.id}`)} className="btn btn-sm btn-ghost">Détails</button>
                    <button onClick={() => navigate(`/produits/${product.id}/modifier`)} className="btn btn-sm btn-primary">Modifier</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(currentPage * itemsPerPage, filteredProducts.length)} sur {filteredProducts.length}
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

export default ProductsList;