// src/components/stock/Categories.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, FolderTree, Package,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, Download, Printer,
  ChevronLeft, ChevronRight, Grid3x3, List,
  ChevronDown, ChevronRight as ChevronRightIcon,
  Archive, Tag, Layers, Home
} from 'lucide-react';

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [expandedCategories, setExpandedCategories] = useState({});
  const [viewMode, setViewMode] = useState('list');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ ...notification, show: false }), 4000);
  };

  // Récupérer le token
  const getToken = () => localStorage.getItem('Token');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const token = getToken();
      console.log('Token présent:', !!token);
      
      const response = await AxiosInstance.get('/categories/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      console.log('Catégories chargées:', response.data);
      setCategories(response.data);
    } catch (error) {
      console.error('Erreur détaillée:', error);
      console.error('Status:', error.response?.status);
      console.error('Message:', error.response?.data);
      
      if (error.response?.status === 401) {
        showNotification('Session expirée, veuillez vous reconnecter', 'error');
        setTimeout(() => {
          localStorage.removeItem('Token');
          localStorage.removeItem('User');
          navigate('/login');
        }, 2000);
      } else {
        showNotification('Erreur de chargement des catégories', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [statusFilter]);

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/categories/${categoryToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Catégorie supprimée avec succès', 'success');
      fetchCategories();
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Erreur suppression:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        navigate('/login');
      } else {
        showNotification('Erreur lors de la suppression', 'error');
      }
    }
  };

  const toggleActive = async (category) => {
    try {
      const token = getToken();
      await AxiosInstance.patch(`/categories/${category.id}/`, 
        { is_active: !category.is_active },
        { headers: { 'Authorization': `Token ${token}` } }
      );
      showNotification(category.is_active ? 'Catégorie désactivée' : 'Catégorie activée', 'success');
      fetchCategories();
    } catch (error) {
      console.error('Erreur modification:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        navigate('/login');
      } else {
        showNotification('Erreur lors de la modification', 'error');
      }
    }
  };

  const getSubCategories = (parentId) => {
    return categories.filter(cat => cat.parent === parentId);
  };

  const toggleExpand = (categoryId) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const filteredCategories = categories.filter(category => {
    const matchesSearch = !searchTerm || 
      (category.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (category.code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (category.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && category.is_active) ||
      (statusFilter === 'inactive' && !category.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: categories.length,
    actives: categories.filter(c => c.is_active).length,
    inactives: categories.filter(c => !c.is_active).length,
    withSubcategories: categories.filter(c => getSubCategories(c.id).length > 0).length
  };

  const renderCategoryTree = (parentId = null, level = 0) => {
    const children = paginatedCategories.filter(cat =>
      (parentId === null && cat.parent === null) || cat.parent === parentId
    );
    
    if (children.length === 0) return null;
    
    return children.map(category => (
      <React.Fragment key={category.id}>
        <tr className="hover:bg-gray-50 transition-colors group">
          <td className="px-4 py-3">
            <div className="flex items-center gap-2" style={{ marginLeft: level * 24 }}>
              {getSubCategories(category.id).length > 0 && (
                <button
                  onClick={() => toggleExpand(category.id)}
                  className="btn btn-ghost btn-xs btn-circle"
                >
                  {expandedCategories[category.id] ? 
                    <ChevronDown className="w-4 h-4" /> : 
                    <ChevronRightIcon className="w-4 h-4" />
                  }
                </button>
              )}
              {getSubCategories(category.id).length === 0 && <div className="w-6" />}
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <FolderTree className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{category.name}</p>
                <p className="text-xs text-gray-500">{category.code}</p>
              </div>
            </div>
           </td>
          <td className="px-4 py-3 hidden md:table-cell">
            <div className="flex items-center gap-1 text-sm">
              <Package className="w-3 h-3 text-gray-400" />
              <span>{category.products_count || 0} produits</span>
            </div>
           </td>
          <td className="px-4 py-3 hidden lg:table-cell">
            <div className="flex items-center gap-1 text-sm">
              <Layers className="w-3 h-3 text-gray-400" />
              <span>{getSubCategories(category.id).length} sous-catégories</span>
            </div>
           </td>
          <td className="px-4 py-3">
            {category.description ? (
              <span className="text-sm text-gray-600 truncate max-w-[150px] block">
                {category.description}
              </span>
            ) : (
              <span className="text-sm text-gray-400 italic">Aucune description</span>
            )}
           </td>
          <td className="px-4 py-3 text-center">
            <span className={`badge ${category.is_active ? 'badge-success' : 'badge-error'}`}>
              {category.is_active ? 'Actif' : 'Inactif'}
            </span>
           </td>
          <td className="px-4 py-3 text-center">
            <div className="flex justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => navigate(`/categories/${category.id}`)} 
                className="btn btn-ghost btn-sm btn-circle" 
                title="Détails"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button 
                onClick={() => navigate(`/categories/${category.id}/modifier`)} 
                className="btn btn-ghost btn-sm btn-circle" 
                title="Modifier"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button 
                onClick={() => toggleActive(category)} 
                className="btn btn-ghost btn-sm btn-circle" 
                title={category.is_active ? 'Désactiver' : 'Activer'}
              >
                <Archive className={`w-4 h-4 ${category.is_active ? 'text-warning' : 'text-success'}`} />
              </button>
              <button 
                onClick={() => { setCategoryToDelete(category); setShowDeleteModal(true); }} 
                className="btn btn-ghost btn-sm btn-circle text-error" 
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
           </td>
         </tr>
        {expandedCategories[category.id] && renderCategoryTree(category.id, level + 1)}
      </React.Fragment>
    ));
  };

  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedCategories.map(category => (
          <div key={category.id} className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
            <div className="card-body p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FolderTree className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-xs text-gray-500">{category.code}</p>
                  </div>
                </div>
                <div className="dropdown dropdown-end">
                  <button className="btn btn-ghost btn-sm btn-circle">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  <ul className="dropdown-menu dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-52">
                    <li><button onClick={() => navigate(`/categories/${category.id}`)}>👁️ Voir détails</button></li>
                    <li><button onClick={() => navigate(`/categories/${category.id}/modifier`)}>✏️ Modifier</button></li>
                    <li><button onClick={() => toggleActive(category)}>{category.is_active ? '📦 Désactiver' : '🔄 Activer'}</button></li>
                    <li><button onClick={() => { setCategoryToDelete(category); setShowDeleteModal(true); }} className="text-error">🗑️ Supprimer</button></li>
                  </ul>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {category.description || 'Aucune description'}
              </p>
              
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                <div className="flex gap-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Sous-catégories</p>
                    <p className="font-semibold text-sm">{getSubCategories(category.id).length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Produits</p>
                    <p className="font-semibold text-sm">{category.products_count || 0}</p>
                  </div>
                </div>
                <span className={`badge ${category.is_active ? 'badge-success' : 'badge-error'}`}>
                  {category.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12 sm:w-16 sm:h-16"></div>
          <p className="text-base sm:text-xl font-semibold text-base-content/70 animate-pulse">
            Chargement des catégories...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen">
      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl text-sm sm:text-base rounded-xl`}>
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
      {showDeleteModal && categoryToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-base-content/70">Voulez-vous vraiment supprimer cette catégorie ?</p>
              <p className="font-semibold text-error mt-2">{categoryToDelete.name}</p>
              {getSubCategories(categoryToDelete.id).length > 0 && (
                <p className="text-warning text-sm mt-2">⚠️ Cette catégorie a {getSubCategories(categoryToDelete.id).length} sous-catégorie(s)</p>
              )}
              {categoryToDelete.products_count > 0 && (
                <p className="text-warning text-sm mt-1">⚠️ Cette catégorie contient {categoryToDelete.products_count} produit(s)</p>
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

      {/* En-tête avec gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <FolderTree className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary">Catégories</h1>
            </div>
            <p className="text-sm text-base-content/60 ml-1">
              Gérez vos catégories de produits – {stats.total} catégorie(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchCategories} className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all">
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <button onClick={() => navigate('/categories/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white border-none shadow-lg hover:shadow-xl transition-all gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle catégorie
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500 font-medium uppercase">Total</p><p className="text-xl sm:text-2xl font-bold text-primary">{stats.total}</p></div>
              <FolderTree className="w-8 h-8 text-primary/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500 font-medium uppercase">Actives</p><p className="text-xl sm:text-2xl font-bold text-success">{stats.actives}</p></div>
              <CheckCircle className="w-8 h-8 text-success/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500 font-medium uppercase">Inactives</p><p className="text-xl sm:text-2xl font-bold text-error">{stats.inactives}</p></div>
              <Archive className="w-8 h-8 text-error/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500 font-medium uppercase">Avec sous-catégories</p><p className="text-xl sm:text-2xl font-bold text-secondary">{stats.withSubcategories}</p></div>
              <Layers className="w-8 h-8 text-secondary/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres avancés */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Rechercher par nom, code, description..." 
              className="input input-bordered w-full pl-9 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline btn-sm sm:hidden gap-2">
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-3 gap-3`}>
            <select className="select select-bordered w-full focus:border-primary" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les statuts</option>
              <option value="active">Actives</option>
              <option value="inactive">Inactives</option>
            </select>
            <div className="flex gap-2">
              <button className="btn btn-outline gap-2 flex-1 hover:bg-primary/10 transition-all" onClick={() => { setStatusFilter('all'); setSearchTerm(''); setCurrentPage(1); }}>
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

      {/* Tableau professionnel */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-white text-sm">
                  <th className="py-4 font-semibold">Catégorie</th>
                  <th className="py-4 font-semibold hidden md:table-cell">Produits</th>
                  <th className="py-4 font-semibold hidden lg:table-cell">Sous-catégories</th>
                  <th className="py-4 font-semibold">Description</th>
                  <th className="py-4 font-semibold text-center">Statut</th>
                  <th className="py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCategories.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                          <FolderTree className="w-10 h-10 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">Aucune catégorie trouvée</p>
                        <button onClick={() => navigate('/categories/nouveau')} className="btn btn-primary btn-sm gap-2 mt-2">
                          <Plus className="w-4 h-4" /> Ajouter une catégorie
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  renderCategoryTree()
                )}
              </tbody>
            </table>
          </div>
        ) : (
          renderGridView()
        )}

        {/* Pagination élégante */}
        {filteredCategories.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Affichage de <span className="font-semibold text-primary">{((currentPage-1)*itemsPerPage)+1}</span> à{' '}
                <span className="font-semibold text-primary">{Math.min(currentPage*itemsPerPage, filteredCategories.length)}</span>{' '}
                sur <span className="font-semibold">{filteredCategories.length}</span> catégories
              </div>
              <div className="flex items-center gap-3">
                <select className="select select-bordered select-sm" value={itemsPerPage} onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}>
                  <option value="5">5 lignes</option>
                  <option value="10">10 lignes</option>
                  <option value="15">15 lignes</option>
                  <option value="20">20 lignes</option>
                </select>
                <div className="join">
                  <button className="join-item btn btn-sm" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i+1;
                    else if (currentPage <= 3) pageNum = i+1;
                    else if (currentPage >= totalPages-2) pageNum = totalPages-4+i;
                    else pageNum = currentPage-2+i;
                    return (
                      <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`join-item btn btn-sm ${currentPage === pageNum ? 'btn-primary text-white' : ''}`}>
                        {pageNum}
                      </button>
                    );
                  })}
                  <button className="join-item btn btn-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;