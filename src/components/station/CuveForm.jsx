// src/components/station/CuveForm.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import { ArrowLeft, Save, Fuel, AlertCircle, CheckCircle } from 'lucide-react';

const CuveForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    code: '', nom: '', type_carburant: 'essence',
    capacite_max: '', capacite_alerte: 500,
    emplacement: '', warehouse: '', est_active: true,
  });
  const [warehouses, setWarehouses] = useState([]);
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
    (async () => {
      try {
        const token = getToken();
        const res = await AxiosInstance.get('/entrepots/', {
          headers: { Authorization: `Token ${token}` }
        });
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setWarehouses(data);
      } catch (e) { console.error(e); }
    })();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const token = getToken();
        const res = await AxiosInstance.get(`/cuves/${id}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        setForm({
          code: res.data.code || '',
          nom: res.data.nom || '',
          type_carburant: res.data.type_carburant || 'essence',
          capacite_max: res.data.capacite_max || '',
          capacite_alerte: res.data.capacite_alerte || 500,
          emplacement: res.data.emplacement || '',
          warehouse: res.data.warehouse || '',
          est_active: res.data.est_active ?? true,
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
        capacite_max: parseFloat(form.capacite_max),
        capacite_alerte: parseFloat(form.capacite_alerte),
        warehouse: form.warehouse || null,
      };

      if (isEdit) {
        await AxiosInstance.put(`/cuves/${id}/`, payload, {
          headers: { Authorization: `Token ${token}` }
        });
        showNotification('Cuve modifiée avec succès', 'success');
      } else {
        await AxiosInstance.post('/cuves/', payload, {
          headers: { Authorization: `Token ${token}` }
        });
        showNotification('Cuve créée avec succès', 'success');
      }
      setTimeout(() => navigate('/cuves'), 1000);
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

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {notification.show && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl`}>
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/cuves')} className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2 bg-primary/10 rounded-xl">
            <Fuel className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-primary">
              {isEdit ? 'Modifier la cuve' : 'Nouvelle cuve'}
            </h1>
            <p className="text-sm text-gray-500">
              {isEdit ? 'Modifiez les informations de la cuve' : 'Créez un nouveau réservoir de carburant'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">Code *</span></label>
              <input
                type="text"
                className={`input input-bordered ${errors.code ? 'input-error' : ''}`}
                value={form.code}
                onChange={(e) => handleChange('code', e.target.value)}
                placeholder="Ex: CUVE-001"
                required
              />
              {errors.code && <span className="text-error text-xs mt-1">{errors.code}</span>}
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">Nom *</span></label>
              <input
                type="text"
                className={`input input-bordered ${errors.nom ? 'input-error' : ''}`}
                value={form.nom}
                onChange={(e) => handleChange('nom', e.target.value)}
                placeholder="Ex: Cuve principale diesel"
                required
              />
              {errors.nom && <span className="text-error text-xs mt-1">{errors.nom}</span>}
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">Type de carburant *</span></label>
              <select
                className="select select-bordered"
                value={form.type_carburant}
                onChange={(e) => handleChange('type_carburant', e.target.value)}
              >
                <option value="essence">Essence</option>
                <option value="diesel">Diesel</option>
                <option value="gpl">GPL</option>
                <option value="ethanol">Ethanol</option>
                <option value="e10">E10</option>
                <option value="e85">E85</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">Emplacement</span></label>
              <input
                type="text"
                className="input input-bordered"
                value={form.emplacement}
                onChange={(e) => handleChange('emplacement', e.target.value)}
                placeholder="Ex: Zone A - Pompe 1"
              />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">Capacité maximale (L) *</span></label>
              <input
                type="number"
                step="0.01"
                className={`input input-bordered ${errors.capacite_max ? 'input-error' : ''}`}
                value={form.capacite_max}
                onChange={(e) => handleChange('capacite_max', e.target.value)}
                placeholder="Ex: 10000"
                required
              />
              {errors.capacite_max && <span className="text-error text-xs mt-1">{errors.capacite_max}</span>}
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">Seuil d'alerte (L) *</span></label>
              <input
                type="number"
                step="0.01"
                className={`input input-bordered ${errors.capacite_alerte ? 'input-error' : ''}`}
                value={form.capacite_alerte}
                onChange={(e) => handleChange('capacite_alerte', e.target.value)}
                required
              />
              {errors.capacite_alerte && <span className="text-error text-xs mt-1">{errors.capacite_alerte}</span>}
            </div>

            <div className="form-control md:col-span-2">
              <label className="label"><span className="label-text font-semibold">Entrepôt</span></label>
              <select
                className="select select-bordered"
                value={form.warehouse}
                onChange={(e) => handleChange('warehouse', e.target.value)}
              >
                <option value="">-- Aucun --</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.nom || w.name} ({w.code})</option>
                ))}
              </select>
            </div>

            <div className="form-control md:col-span-2">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={form.est_active}
                  onChange={(e) => handleChange('est_active', e.target.checked)}
                />
                <span className="label-text font-semibold">Cuve active</span>
              </label>
            </div>
          </div>

          {errors.non_field_errors && (
            <div className="alert alert-error">
              <AlertCircle className="w-5 h-5" />
              <span>{errors.non_field_errors.join(', ')}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => navigate('/cuves')} className="btn btn-ghost">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary gap-2">
              {loading ? <span className="loading loading-spinner loading-sm"></span> : <Save className="w-4 h-4" />}
              {isEdit ? 'Enregistrer' : 'Créer la cuve'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CuveForm;