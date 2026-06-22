// src/components/stock/CategoryForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Save, X, FolderTree, RefreshCw, ArrowLeft, 
  CheckCircle, AlertCircle, Trash2, Home,
  Tag, FileText, ToggleLeft, ToggleRight
} from 'lucide-react';

const CategoryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    parent: '',
    is_active: true
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ ...notification, show: false }), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  // Charger les catégories pour le select parent
  const loadCategories = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/categories/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée, veuillez vous reconnecter', 'error');
        setTimeout(() => navigate('/login'), 2000);
      }
    }
  };

  // Charger la catégorie à modifier
  const loadCategory = async () => {
    if (!isEditMode) {
      setFetching(false);
      return;
    }
    
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/categories/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const category = response.data;
      setFormData({
        name: category.name || '',
        code: category.code || '',
        description: category.description || '',
        parent: category.parent || '',
        is_active: category.is_active !== undefined ? category.is_active : true
      });
    } catch (error) {
      console.error('Erreur chargement catégorie:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        navigate('/login');
      } else if (error.response?.status === 404) {
        showNotification('Catégorie non trouvée', 'error');
        navigate('/categories');
      } else {
        showNotification('Impossible de charger la catégorie', 'error');
      }
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadCategories();
      await loadCategory();
    };
    init();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const generateCode = () => {
    const prefix = formData.name ? formData.name.substring(0, 3).toUpperCase() : 'CAT';
    const randomNum = Math.floor(Math.random() * 1000);
    const code = `${prefix}${randomNum}`;
    setFormData(prev => ({ ...prev, code }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }
    if (!formData.code.trim()) {
      newErrors.code = 'Le code est requis';
    }
    if (formData.code) {
      const existingCategory = categories.find(c => 
        c.code === formData.code && c.id !== parseInt(id)
      );
      if (existingCategory) {
        newErrors.code = 'Ce code existe déjà';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const token = getToken();
      const dataToSend = {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        is_active: formData.is_active
      };
      
      if (formData.parent) {
        dataToSend.parent = formData.parent;
      }
      
      const headers = { 'Authorization': `Token ${token}` };
      
      if (isEditMode) {
        await AxiosInstance.patch(`/categories/${id}/`, dataToSend, { headers });
        showNotification('Catégorie modifiée avec succès', 'success');
      } else {
        await AxiosInstance.post('/categories/', dataToSend, { headers });
        showNotification('Catégorie créée avec succès', 'success');
      }
      
      setTimeout(() => navigate('/categories'), 1500);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée, veuillez vous reconnecter', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.data) {
        setErrors(error.response.data);
        showNotification('Veuillez vérifier les champs', 'error');
      } else {
        showNotification('Une erreur est survenue', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12 sm:w-16 sm:h-16"></div>
          <p className="text-base sm:text-xl font-semibold text-base-content/70 animate-pulse">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-slideDown">
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

      <div className="max-w-3xl mx-auto">
        {/* En-tête */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/categories')}
            className="btn btn-ghost btn-sm gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <FolderTree className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                {isEditMode ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1 ml-1">
              {isEditMode ? 'Modifiez les informations de la catégorie' : 'Créez une nouvelle catégorie de produits'}
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              {/* Nom */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">
                    Nom <span className="text-error">*</span>
                  </span>
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`input input-bordered w-full pl-10 py-3 ${errors.name ? 'input-error' : ''}`}
                    placeholder="Ex: Électronique, Alimentation, Mode..."
                    autoFocus
                  />
                </div>
                {errors.name && (
                  <span className="text-error text-xs mt-1">{errors.name}</span>
                )}
              </div>

              {/* Code */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">
                    Code <span className="text-error">*</span>
                  </span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      className={`input input-bordered w-full pl-10 ${errors.code ? 'input-error' : ''}`}
                      placeholder="Ex: ELEC001"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={generateCode}
                    className="btn btn-outline gap-2"
                    title="Générer un code automatique"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Générer
                  </button>
                </div>
                {errors.code && (
                  <span className="text-error text-xs mt-1">{errors.code}</span>
                )}
                <span className="text-xs text-gray-400 mt-1">
                  Code unique pour identifier cette catégorie
                </span>
              </div>

              {/* Catégorie parente */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">
                    Catégorie parente
                  </span>
                </label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    name="parent"
                    value={formData.parent}
                    onChange={handleChange}
                    className="select select-bordered w-full pl-10"
                  >
                    <option value="">Aucune (catégorie racine)</option>
                    {categories
                      .filter(cat => {
                        if (isEditMode) {
                          return cat.id !== parseInt(id) && !cat.parent;
                        }
                        return !cat.parent;
                      })
                      .map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} ({cat.code})
                        </option>
                      ))}
                  </select>
                </div>
                <span className="text-xs text-gray-400 mt-1">
                  Laissez vide pour une catégorie de niveau supérieur
                </span>
              </div>

              {/* Description */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">
                    Description
                  </span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="textarea textarea-bordered w-full"
                  rows="4"
                  placeholder="Description détaillée de la catégorie..."
                />
                <span className="text-xs text-gray-400 mt-1">
                  Optionnel - Une description claire aide à organiser les produits
                </span>
              </div>

              {/* Statut */}
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="toggle toggle-primary"
                  />
                  <span className="label-text font-semibold text-gray-700">
                    {formData.is_active ? 'Catégorie active' : 'Catégorie inactive'}
                  </span>
                </label>
                <span className="text-xs text-gray-400 mt-1 ml-1">
                  {formData.is_active 
                    ? 'Les produits de cette catégorie seront visibles' 
                    : 'Cette catégorie sera masquée'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/categories')}
                className="btn btn-ghost gap-2"
                disabled={loading}
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary gap-2 min-w-[120px]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    {isEditMode ? 'Modification...' : 'Création...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEditMode ? 'Modifier' : 'Créer'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Information supplémentaire pour l'édition */}
        {isEditMode && (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-blue-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-800">Information</p>
                <p className="text-xs text-blue-600 mt-1">
                  La modification d'une catégorie peut affecter l'organisation de vos produits.
                  Les sous-catégories et produits associés seront automatiquement mis à jour.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryForm;