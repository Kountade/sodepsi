// src/components/station/ServiceForm.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, Wrench, AlertCircle, CheckCircle, X,
  Droplet, Sparkles, Zap, Activity, Clock, DollarSign
} from 'lucide-react';

const ServiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    code: '',
    nom: '',
    type_service: 'lavage_manuel',
    prix: '',
    description: '',
    duree_estimee: 15,
    est_actif: true,
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const token = getToken();
        const res = await AxiosInstance.get(`/services/${id}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        setForm({
          code: res.data.code || '',
          nom: res.data.nom || '',
          type_service: res.data.type_service || 'lavage_manuel',
          prix: res.data.prix || '',
          description: res.data.description || '',
          duree_estimee: res.data.duree_estimee || 15,
          est_actif: res.data.est_actif ?? true,
        });
      } catch (e) {
        showNotification('Erreur de chargement', 'error');
      } finally {
        setLoadingData(false);
      }
    })();
  }, [id, isEdit]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const token = getToken();
      const payload = {
        ...form,
        prix: parseFloat(form.prix),
        duree_estimee: parseInt(form.duree_estimee),
      };

      if (isEdit) {
        await AxiosInstance.put(`/services/${id}/`, payload, {
          headers: { Authorization: `Token ${token}` }
        });
        showNotification('Service modifié avec succès', 'success');
      } else {
        await AxiosInstance.post('/services/', payload, {
          headers: { Authorization: `Token ${token}` }
        });
        showNotification('Service créé avec succès', 'success');
      }
      setTimeout(() => navigate('/services'), 1000);
    } catch (error) {
      console.error(error);
      if (error.response?.data) {
        setErrors(error.response.data);
        showNotification('Veuillez corriger les erreurs', 'error');
      } else {
        showNotification('Erreur lors de l\'enregistrement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  const TYPES_SERVICE = [
    { value: 'lavage_manuel', label: 'Lavage manuel', icon: Droplet, color: 'text-blue-500' },
    { value: 'lavage_auto', label: 'Lavage automatique', icon: Sparkles, color: 'text-purple-500' },
    { value: 'gonflage', label: 'Gonflage des pneus', icon: Zap, color: 'text-yellow-500' },
    { value: 'vidange', label: 'Vidange', icon: Droplet, color: 'text-green-500' },
    { value: 'graissage', label: 'Graissage', icon: Wrench, color: 'text-orange-500' },
    { value: 'autre', label: 'Autre service', icon: Activity, color: 'text-gray-500' },
  ];

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {notification.show && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium text-sm">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification({ ...notification, show: false })}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/services')} className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2 bg-primary/10 rounded-xl">
            <Wrench className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-primary">
              {isEdit ? 'Modifier le service' : 'Nouveau service'}
            </h1>
            <p className="text-sm text-gray-500">
              {isEdit ? 'Modifiez les informations du service' : 'Créez un nouveau service'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-5">

          {/* Type de service */}
          <div>
            <label className="text-sm font-semibold block mb-2">
              Type de service <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TYPES_SERVICE.map(t => {
                const Icon = t.icon;
                const isSelected = form.type_service === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => handleChange('type_service', t.value)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${t.color}`} />
                      <span className="text-sm font-medium">{t.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Code */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Code *</span>
              </label>
              <input
                type="text"
                className={`input input-bordered ${errors.code ? 'input-error' : ''}`}
                value={form.code}
                onChange={(e) => handleChange('code', e.target.value)}
                placeholder="Ex: SRV-001"
                required
              />
              {errors.code && <span className="text-error text-xs mt-1">{errors.code}</span>}
            </div>

            {/* Nom */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Nom *</span>
              </label>
              <input
                type="text"
                className={`input input-bordered ${errors.nom ? 'input-error' : ''}`}
                value={form.nom}
                onChange={(e) => handleChange('nom', e.target.value)}
                placeholder="Ex: Lavage complet"
                required
              />
              {errors.nom && <span className="text-error text-xs mt-1">{errors.nom}</span>}
            </div>

            {/* Prix */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Prix (FCFA) *</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`input input-bordered input-lg text-lg font-bold ${errors.prix ? 'input-error' : ''}`}
                value={form.prix}
                onChange={(e) => handleChange('prix', e.target.value)}
                placeholder="Ex: 5000"
                required
              />
              {errors.prix && (
                <span className="text-error text-xs mt-1">
                  {Array.isArray(errors.prix) ? errors.prix[0] : errors.prix}
                </span>
              )}
            </div>

            {/* Durée */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Durée estimée (min)</span>
              </label>
              <input
                type="number"
                min="1"
                className="input input-bordered"
                value={form.duree_estimee}
                onChange={(e) => handleChange('duree_estimee', e.target.value)}
                placeholder="15"
              />
            </div>
          </div>

          {/* Description */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Description</span>
            </label>
            <textarea
              className="textarea textarea-bordered"
              rows="3"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description du service..."
            />
          </div>

          {/* Statut */}
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-3 p-0">
              <input
                type="checkbox"
                className="toggle toggle-success"
                checked={form.est_actif}
                onChange={(e) => handleChange('est_actif', e.target.checked)}
              />
              <span className="label-text font-semibold">
                Service actif (disponible à la vente)
              </span>
            </label>
          </div>

          {errors.non_field_errors && (
            <div className="alert alert-error">
              <AlertCircle className="w-5 h-5" />
              <span>{errors.non_field_errors.join(', ')}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => navigate('/services')} className="btn btn-ghost">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary gap-2">
              {loading ? <span className="loading loading-spinner loading-sm"></span> : <Save className="w-4 h-4" />}
              {isEdit ? 'Enregistrer' : 'Créer le service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceForm;