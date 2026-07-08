// src/components/stocks/InventaireForm.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, CheckCircle, AlertCircle,
  Loader2, Warehouse, Calendar, FileText, Plus
} from 'lucide-react';

const InventaireForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // pour la modification
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [formData, setFormData] = useState({
    warehouse: '',
    name: '',
    description: '',
    start_date: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  // Charger la liste des entrepôts
  const fetchWarehouses = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/warehouses/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setWarehouses(response.data || []);
    } catch (error) {
      console.error('Erreur chargement entrepôts:', error);
      showNotification('Erreur de chargement des entrepôts', 'error');
    }
  };

  // Charger les données de l'inventaire en mode édition
  const fetchInventory = async () => {
    if (!isEditMode) return;
    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/inventories/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = response.data;
      setFormData({
        warehouse: data.warehouse || '',
        name: data.name || '',
        description: data.description || '',
        start_date: data.start_date ? data.start_date.slice(0, 16) : '',
        notes: data.notes || ''
      });
    } catch (error) {
      console.error('Erreur chargement inventaire:', error);
      showNotification('Inventaire introuvable', 'error');
      setTimeout(() => navigate('/inventaire'), 2000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    if (isEditMode) fetchInventory();
  }, [isEditMode, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.warehouse) newErrors.warehouse = 'L\'entrepôt est requis';
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.start_date) newErrors.start_date = 'La date de début est requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const token = getToken();
      const payload = {
        warehouse: formData.warehouse,
        name: formData.name.trim(),
        description: formData.description.trim(),
        start_date: formData.start_date,
        notes: formData.notes.trim()
      };

      let response;
      if (isEditMode) {
        response = await AxiosInstance.put(`/inventories/${id}/`, payload, {
          headers: { 'Authorization': `Token ${token}` }
        });
      } else {
        response = await AxiosInstance.post('/inventories/', payload, {
          headers: { 'Authorization': `Token ${token}` }
        });
      }

      showNotification(
        isEditMode ? 'Inventaire mis à jour avec succès' : 'Inventaire créé avec succès',
        'success'
      );
      setTimeout(() => navigate('/inventaire'), 1500);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      if (error.response && error.response.data) {
        // Afficher les erreurs du backend
        const apiErrors = error.response.data;
        if (typeof apiErrors === 'object') {
          setErrors(apiErrors);
          // Afficher un message global
          const firstError = Object.values(apiErrors)[0];
          showNotification(firstError?.[0] || 'Erreur de validation', 'error');
        } else {
          showNotification('Erreur lors de la sauvegarde', 'error');
        }
      } else {
        showNotification('Erreur réseau', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement de l'inventaire...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
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
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/inventaire')}
              className="btn btn-ghost btn-sm btn-square"
              title="Retour à la liste"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {isEditMode ? 'Modifier l\'inventaire' : 'Nouvel inventaire'}
              </h1>
              <p className="text-sm text-gray-500">
                {isEditMode ? 'Mettez à jour les informations' : 'Créez un nouvel inventaire physique'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Entrepôt */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">Entrepôt <span className="text-error">*</span></span>
            </label>
            <select
              name="warehouse"
              value={formData.warehouse}
              onChange={handleChange}
              className={`select select-bordered w-full ${errors.warehouse ? 'select-error' : ''}`}
              disabled={saving || isEditMode} // On ne peut pas changer l'entrepôt en édition (cohérence)
            >
              <option value="">Sélectionner un entrepôt</option>
              {warehouses.map(wh => (
                <option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</option>
              ))}
            </select>
            {errors.warehouse && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.warehouse}</span>
              </label>
            )}
          </div>

          {/* Nom */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">Nom <span className="text-error">*</span></span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Inventaire du 1er trimestre"
              className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
              disabled={saving}
            />
            {errors.name && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.name}</span>
              </label>
            )}
          </div>

          {/* Description */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">Description</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Précisez le périmètre de l'inventaire..."
              className="textarea textarea-bordered w-full h-24"
              disabled={saving}
            />
          </div>

          {/* Date de début */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">Date de début <span className="text-error">*</span></span>
            </label>
            <input
              type="datetime-local"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className={`input input-bordered w-full ${errors.start_date ? 'input-error' : ''}`}
              disabled={saving}
            />
            {errors.start_date && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.start_date}</span>
              </label>
            )}
          </div>

          {/* Notes */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">Notes</span>
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Informations complémentaires..."
              className="textarea textarea-bordered w-full h-20"
              disabled={saving}
            />
          </div>

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              className="btn btn-ghost flex-1"
              onClick={() => navigate('/inventaire')}
              disabled={saving}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1 gap-2"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditMode ? 'Mettre à jour' : 'Créer l\'inventaire'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Aide */}
      <div className="mt-6 max-w-3xl mx-auto bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-800">À propos des inventaires</h4>
            <p className="text-sm text-blue-700">
              Un inventaire physique permet de vérifier la concordance entre le stock théorique et le stock réel.
              Une fois créé, vous pourrez le démarrer, saisir les quantités réelles, puis le finaliser.
              Les ajustements seront appliqués automatiquement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventaireForm;