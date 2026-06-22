// src/components/stock/UniteMesureForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Save, X, Ruler, RefreshCw, ArrowLeft, Scale, Droplet, Box,
  CheckCircle, AlertCircle, Trash2
} from 'lucide-react';

const UniteMesureForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    type: 'unit',
    conversion_factor: 1.0000,
    is_base_unit: false,
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const loadUniteMesure = async () => {
    if (!isEditMode) {
      setFetching(false);
      return;
    }
    
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/unit-measures/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = response.data;
      setFormData({
        name: data.name || '',
        symbol: data.symbol || '',
        type: data.type || 'unit',
        conversion_factor: data.conversion_factor || 1.0000,
        is_base_unit: data.is_base_unit || false,
        is_active: data.is_active !== undefined ? data.is_active : true
      });
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Impossible de charger l\'unité', 'error');
      navigate('/unites-mesure');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadUniteMesure();
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

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.symbol.trim()) newErrors.symbol = 'Le symbole est requis';
    if (formData.conversion_factor <= 0) newErrors.conversion_factor = 'Le facteur de conversion doit être positif';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const token = getToken();
      const headers = { 'Authorization': `Token ${token}` };
      
      if (isEditMode) {
        await AxiosInstance.patch(`/unit-measures/${id}/`, formData, { headers });
        showNotification('Unité modifiée avec succès', 'success');
      } else {
        await AxiosInstance.post('/unit-measures/', formData, { headers });
        showNotification('Unité créée avec succès', 'success');
      }
      
      setTimeout(() => navigate('/unites-mesure'), 1500);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.data) {
        setErrors(error.response.data);
        showNotification('Veuillez vérifier les champs', 'error');
      } else {
        showNotification('Une erreur est survenue', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = getToken();
      await AxiosInstance.delete(`/unit-measures/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Unité supprimée avec succès', 'success');
      setTimeout(() => navigate('/unites-mesure'), 1500);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
    setShowDeleteModal(false);
  };

  const getTypeIcon = () => {
    switch(formData.type) {
      case 'weight': return <Scale className="w-5 h-5" />;
      case 'volume': return <Droplet className="w-5 h-5" />;
      case 'length': return <Ruler className="w-5 h-5" />;
      default: return <Box className="w-5 h-5" />;
    }
  };

  const getTypeLabel = () => {
    switch(formData.type) {
      case 'weight': return 'Poids';
      case 'volume': return 'Volume';
      case 'length': return 'Longueur';
      default: return 'Unité';
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
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

      {/* Modal Suppression */}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer cette unité ?</p>
              <p className="font-semibold text-error mt-2">{formData.name}</p>
              {formData.is_base_unit && (
                <p className="text-warning text-sm mt-2">⚠️ Cette unité est marquée comme unité de base</p>
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/unites-mesure')} className="btn btn-ghost btn-sm gap-2">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Ruler className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">{isEditMode ? 'Modifier' : 'Nouvelle'} unité de mesure</h1>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {isEditMode ? 'Modifiez les informations de l\'unité' : 'Créez une nouvelle unité de mesure'}
              </p>
            </div>
          </div>
          {isEditMode && (
            <button onClick={() => setShowDeleteModal(true)} className="btn btn-error btn-sm gap-2">
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          )}
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              {/* Type d'unité - Carte d'aperçu */}
              <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
                    {getTypeIcon()}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type d'unité</p>
                    <p className="text-xl font-semibold text-primary">{getTypeLabel()}</p>
                  </div>
                </div>
              </div>

              {/* Informations principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="form-control">
                  <label className="label text-sm font-medium text-gray-700">
                    Nom <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                    placeholder="Ex: Kilogramme, Litre, Mètre"
                  />
                  {errors.name && <span className="text-error text-xs mt-1">{errors.name}</span>}
                </div>

                <div className="form-control">
                  <label className="label text-sm font-medium text-gray-700">
                    Symbole <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.symbol ? 'input-error' : ''}`}
                    placeholder="Ex: kg, L, m"
                  />
                  {errors.symbol && <span className="text-error text-xs mt-1">{errors.symbol}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="form-control">
                  <label className="label text-sm font-medium text-gray-700">Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    <option value="unit">📦 Unité</option>
                    <option value="weight">⚖️ Poids</option>
                    <option value="volume">💧 Volume</option>
                    <option value="length">📏 Longueur</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label text-sm font-medium text-gray-700">
                    Facteur de conversion
                  </label>
                  <input
                    type="number"
                    name="conversion_factor"
                    value={formData.conversion_factor}
                    onChange={handleChange}
                    step="0.0001"
                    className={`input input-bordered w-full ${errors.conversion_factor ? 'input-error' : ''}`}
                    placeholder="1.0000"
                  />
                  <p className="text-xs text-gray-400 mt-1">Facteur de conversion vers l'unité de base</p>
                  {errors.conversion_factor && <span className="text-error text-xs mt-1">{errors.conversion_factor}</span>}
                </div>
              </div>

              {/* Options */}
              <div className="border-t pt-5">
                <div className="space-y-3">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      name="is_base_unit"
                      checked={formData.is_base_unit}
                      onChange={handleChange}
                      className="checkbox checkbox-primary"
                    />
                    <div>
                      <span className="text-sm font-medium">Unité de base</span>
                      <p className="text-xs text-gray-400">Les conversions se feront par rapport à cette unité</p>
                    </div>
                  </label>

                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="checkbox checkbox-primary"
                    />
                    <div>
                      <span className="text-sm font-medium">Active</span>
                      <p className="text-xs text-gray-400">Les unités inactives ne seront pas disponibles</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t">
              <button
                type="button"
                onClick={() => navigate('/unites-mesure')}
                className="btn btn-ghost gap-2 px-6"
                disabled={loading}
              >
                <X className="w-4 h-4" /> Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary gap-2 px-8 min-w-[140px]"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <><Save className="w-4 h-4" /> {isEditMode ? 'Enregistrer' : 'Créer'}</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Information supplémentaire */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="p-1 bg-blue-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-800">Information sur les conversions</p>
              <p className="text-xs text-blue-600 mt-1">
                Le facteur de conversion permet de convertir cette unité vers l'unité de base.
                Par exemple, si l'unité de base est le "Gramme" et cette unité est "Kilogramme",
                le facteur de conversion sera 1000.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniteMesureForm;