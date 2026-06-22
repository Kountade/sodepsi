// src/components/stock/CategoryDetails.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, FolderTree, Package, Layers, Edit, Trash2,
  CheckCircle, XCircle, Calendar, User, Code, FileText,
  Home, RefreshCw, AlertCircle
} from 'lucide-react';

const CategoryDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subCategories, setSubCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const getToken = () => localStorage.getItem('Token');

  const fetchCategoryDetails = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/categories/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setCategory(response.data);
      
      // Récupérer les sous-catégories
      const allCats = await AxiosInstance.get('/categories/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setSubCategories(allCats.data.filter(cat => cat.parent === parseInt(id)));
      
    } catch (error) {
      console.error('Erreur:', error);
      navigate('/categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (!category) return null;

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/categories')} className="btn btn-ghost btn-sm gap-2">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <FolderTree className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">{category.name}</h1>
            <span className={`badge ${category.is_active ? 'badge-success' : 'badge-error'}`}>
              {category.is_active ? 'Actif' : 'Inactif'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Code: {category.code}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/categories/${id}/modifier`)} className="btn btn-primary btn-sm gap-2">
            <Edit className="w-4 h-4" /> Modifier
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Sous-catégories</p>
              <p className="text-2xl font-bold text-primary">{subCategories.length}</p>
            </div>
            <Layers className="w-10 h-10 text-primary/20" />
          </div>
        </div>
        <div className="card bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Produits</p>
              <p className="text-2xl font-bold text-primary">{category.products_count || 0}</p>
            </div>
            <Package className="w-10 h-10 text-primary/20" />
          </div>
        </div>
        <div className="card bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Chemin complet</p>
              <p className="text-sm font-medium truncate">{category.full_path || category.name}</p>
            </div>
            <Home className="w-10 h-10 text-primary/20" />
          </div>
        </div>
      </div>

      {/* Informations détaillées */}
      <div className="card bg-white shadow-md rounded-xl">
        <div className="card-body">
          <h3 className="font-semibold text-lg mb-4">Informations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Code:</span>
              <span className="font-mono text-sm">{category.code}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Créé le:</span>
              <span className="text-sm">{new Date(category.created_at).toLocaleDateString()}</span>
            </div>
            {category.parent && (
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Catégorie parente:</span>
                <span className="text-sm">{category.parent_name || 'N/A'}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Statut:</span>
              <span className={`badge badge-sm ${category.is_active ? 'badge-success' : 'badge-error'}`}>
                {category.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
          
          {category.description && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium">Description</span>
              </div>
              <p className="text-sm text-gray-600">{category.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Sous-catégories */}
      {subCategories.length > 0 && (
        <div className="card bg-white shadow-md rounded-xl">
          <div className="card-body">
            <h3 className="font-semibold text-lg mb-4">Sous-catégories ({subCategories.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {subCategories.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-primary" />
                    <span>{sub.name}</span>
                    <span className="text-xs text-gray-400">({sub.code})</span>
                  </div>
                  <button onClick={() => navigate(`/categories/${sub.id}`)} className="btn btn-xs btn-ghost">
                    Voir
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryDetails;