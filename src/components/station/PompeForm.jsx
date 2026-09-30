// src/components/station/PompeForm.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import { ArrowLeft, Save, Server, AlertCircle } from 'lucide-react';

const PompeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    code: '', nom: '', cuve: '', statut: 'active',
    prix_litre: '', compteur_initial: 0, emplacement: '',
    is_active: true,
  });
  const [cuves, setCuves] = useState([]);
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
        const res = await AxiosInstance.get('/cuves/', {
          headers: { Authorization: `Token ${token}` }
        });
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setCuves(data);
      } catch (e) { console.error(e); }
    })();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const token = getToken();
        const res = await AxiosInstance.get(`/pompes/${id}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        setForm({
          code: res.data.code || '',
          nom: res.data.nom || '',
          cuve: res.data.cuve || '',
          statut: res.data.statut || 'active',
          prix_litre: res.data.prix_litre || '',
          compteur_initial: res.data.compteur_initial || 0,
          emplacement: res.data.emplacement || '',
          is_active: res.data.is_active ?? true,
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
        prix_litre: parseFloat(form.prix_litre),
        compteur_initial: parseFloat(form.compteur_initial),
      };

      if (isEdit) {
        await AxiosInstance.put(`/pompes/${id}/`, payload, {
          headers: { Authorization: `Token ${token}` }
        });
        showNotification('Pompe modifiée avec succès', 'success');
      } else {
        await AxiosInstance.post('/pompes/', payload, {
          headers: { Authorization: `Token ${token}` }
        });
        showNotification('Pompe créée avec succès', 'success');
      }
      setTimeout(() => navigate('/pompes'), 1000);
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
          <button onClick={() => navigate('/pompes')} className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2 bg-primary/10 rounded-xl">
            <Server className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-primary">
              {isEdit ? 'Modifier la pompe' : 'Nouvelle pompe'}
            </h1>
            <p className="text-sm text-gray-500">
              {isEdit ? 'Modifiez les informations de la pompe' : 'Créez une nouvelle pompe à carburant'}
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
                placeholder="Ex: P-001"
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
                placeholder="Ex: Pompe 1 - Essence"
                required
              />
              {errors.nom && <span className="text-error text-xs mt-1">{errors.nom}</span>}
            </div>

            <div className="form-control md:col-span-2">
              <label className="label"><span className="label-text font-semibold">Cuve associée *</span></label>
              <select
                className={`select select-bordered ${errors.cuve ? 'select-error' : ''}`}
                value={form.cuve}
                onChange={(e) => handleChange('cuve', e.target.value)}
                required
              >
                <option value="">-- Sélectionner une cuve --</option>
                {cuves.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nom} ({c.code}) - {c.type_carburant_display}
                  </option>
                ))}
              </select>
              {errors.cuve && <span className="text-error text-xs mt-1">{errors.cuve}</span>}
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">Prix au litre (FCFA) *</span></label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`input input-bordered ${errors.prix_litre ? 'input-error' : ''}`}
                value={form.prix_litre}
                onChange={(e) => handleChange('prix_litre', e.target.value)}
                placeholder="Ex: 850"
                required
              />
              {errors.prix_litre && <span className="text-error text-xs mt-1">{errors.prix_litre}</span>}
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">Compteur initial (L)</span></label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input input-bordered"
                value={form.compteur_initial}
                onChange={(e) => handleChange('compteur_initial', e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">Statut *</span></label>
              <select
                className="select select-bordered"
                value={form.statut}
                onChange={(e) => handleChange('statut', e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">En maintenance</option>
                <option value="panne">En panne</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">Emplacement</span></label>
              <input
                type="text"
                className="input input-bordered"
                value={form.emplacement}
                onChange={(e) => handleChange('emplacement', e.target.value)}
                placeholder="Ex: Zone A - Îlot 1"
              />
            </div>

            <div className="form-control md:col-span-2">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={form.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                />
                <span className="label-text font-semibold">Pompe active</span>
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
            <button type="button" onClick={() => navigate('/pompes')} className="btn btn-ghost">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary gap-2">
              {loading ? <span className="loading loading-spinner loading-sm"></span> : <Save className="w-4 h-4" />}
              {isEdit ? 'Enregistrer' : 'Créer la pompe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PompeForm;