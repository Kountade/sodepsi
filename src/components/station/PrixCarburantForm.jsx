// src/components/station/PrixCarburantForm.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, BadgeDollarSign, AlertCircle, Fuel,
  Droplet, TrendingUp, Calendar, FileText, CheckCircle, X
} from 'lucide-react';

const PrixCarburantForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    cuve: '',
    prix_litre: '',
    date_application: new Date().toISOString().slice(0, 16),
    date_fin: '',
    est_actif: true,
    notes: '',
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
  const formatNumber = (n) => new Intl.NumberFormat('fr-FR').format(parseFloat(n || 0));

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
        const res = await AxiosInstance.get(`/prix-carburant/${id}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        setForm({
          cuve: res.data.cuve || '',
          prix_litre: res.data.prix_litre || '',
          date_application: res.data.date_application
            ? res.data.date_application.slice(0, 16)
            : '',
          date_fin: res.data.date_fin
            ? res.data.date_fin.slice(0, 16)
            : '',
          est_actif: res.data.est_actif ?? true,
          notes: res.data.notes || '',
        });
      } catch (e) {
        showNotification('Erreur de chargement', 'error');
      } finally {
        setLoadingData(false);
      }
    })();
  }, [id, isEdit]);

  const selectedCuve = useMemo(
    () => cuves.find(c => String(c.id) === String(form.cuve)),
    [cuves, form.cuve]
  );

  // Prix actif de la cuve sélectionnée
  const [prixActuel, setPrixActuel] = useState(null);
  useEffect(() => {
    if (!form.cuve) {
      setPrixActuel(null);
      return;
    }
    (async () => {
      try {
        const token = getToken();
        const res = await AxiosInstance.get(
          `/prix-carburant/?cuve=${form.cuve}&est_actif=true`,
          { headers: { Authorization: `Token ${token}` } }
        );
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setPrixActuel(data[0] || null);
      } catch (e) {
        setPrixActuel(null);
      }
    })();
  }, [form.cuve]);

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
        cuve: parseInt(form.cuve),
        prix_litre: parseFloat(form.prix_litre),
        date_application: form.date_application,
        date_fin: form.date_fin || null,
        est_actif: form.est_actif,
        notes: form.notes || '',
      };

      if (isEdit) {
        await AxiosInstance.put(`/prix-carburant/${id}/`, payload, {
          headers: { Authorization: `Token ${token}` }
        });
        showNotification('Prix modifié avec succès', 'success');
      } else {
        await AxiosInstance.post('/prix-carburant/', payload, {
          headers: { Authorization: `Token ${token}` }
        });
        showNotification('Prix créé avec succès', 'success');
      }
      setTimeout(() => navigate('/prix-carburant'), 1000);
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

  // Calcul de variation par rapport au prix actuel
  const variation = prixActuel && form.prix_litre && !isEdit
    ? parseFloat(form.prix_litre) - parseFloat(prixActuel.prix_litre)
    : 0;
  const variationPct = prixActuel && parseFloat(prixActuel.prix_litre) > 0
    ? (variation / parseFloat(prixActuel.prix_litre)) * 100
    : 0;

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
          <button onClick={() => navigate('/prix-carburant')} className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2 bg-primary/10 rounded-xl">
            <BadgeDollarSign className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-primary">
              {isEdit ? 'Modifier le prix' : 'Nouveau prix carburant'}
            </h1>
            <p className="text-sm text-gray-500">
              {isEdit ? 'Modifiez le prix sélectionné' : 'Enregistrez un nouveau prix par cuve'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Cuve */}
            <div className="form-control md:col-span-2">
              <label className="label"><span className="label-text font-semibold">Cuve *</span></label>
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

              {/* Info cuve + prix actuel */}
              {selectedCuve && (
                <div className="mt-2 bg-primary/5 rounded-lg p-3 border-l-4 border-primary">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Fuel className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{selectedCuve.nom}</p>
                      <p className="text-xs text-gray-500">
                        {selectedCuve.type_carburant_display} · Niveau actuel : {formatNumber(selectedCuve.niveau_actuel)} L
                      </p>
                    </div>
                    {prixActuel && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Prix actuel</p>
                        <p className="font-bold text-primary">
                          {formatNumber(prixActuel.prix_litre)} FCFA/L
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Prix */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  Prix au litre (FCFA) *
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`input input-bordered input-lg text-lg font-bold ${errors.prix_litre ? 'input-error' : ''}`}
                value={form.prix_litre}
                onChange={(e) => handleChange('prix_litre', e.target.value)}
                placeholder="Ex: 850"
                required
              />
              {errors.prix_litre && (
                <span className="text-error text-xs mt-1">
                  {Array.isArray(errors.prix_litre) ? errors.prix_litre[0] : errors.prix_litre}
                </span>
              )}

              {/* Variation par rapport au prix actuel */}
              {prixActuel && form.prix_litre && !isEdit && (
                <div className={`mt-2 flex items-center gap-2 text-sm ${
                  variation > 0 ? 'text-error' : variation < 0 ? 'text-success' : 'text-gray-500'
                }`}>
                  {variation !== 0 && (
                    <>
                      <TrendingUp className={`w-4 h-4 ${variation < 0 ? 'rotate-180' : ''}`} />
                      <span className="font-semibold">
                        {variation > 0 ? '+' : ''}{formatNumber(variation)} FCFA
                        {' '}({variationPct > 0 ? '+' : ''}{variationPct.toFixed(1)}%)
                      </span>
                    </>
                  )}
                  {variation === 0 && <span>Prix identique au prix actuel</span>}
                </div>
              )}
            </div>

            {/* Statut */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Statut</span>
              </label>
              <label className="label cursor-pointer justify-start gap-3 p-0">
                <input
                  type="checkbox"
                  className="toggle toggle-success"
                  checked={form.est_actif}
                  onChange={(e) => handleChange('est_actif', e.target.checked)}
                />
                <span className="label-text">
                  {form.est_actif ? 'Prix actif' : 'Prix inactif'}
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Un prix inactif n'est plus utilisé pour les nouvelles ventes.
              </p>
            </div>

            {/* Date d'application */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Date d'application *</span>
              </label>
              <input
                type="datetime-local"
                className="input input-bordered"
                value={form.date_application}
                onChange={(e) => handleChange('date_application', e.target.value)}
                required
              />
            </div>

            {/* Date de fin */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Date de fin (optionnel)</span>
              </label>
              <input
                type="datetime-local"
                className="input input-bordered"
                value={form.date_fin}
                onChange={(e) => handleChange('date_fin', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Laisser vide si le prix n'a pas de date de fin prévue.
              </p>
            </div>

            {/* Notes */}
            <div className="form-control md:col-span-2">
              <label className="label">
                <span className="label-text font-semibold">Notes</span>
              </label>
              <textarea
                className="textarea textarea-bordered"
                rows="3"
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Raison de la modification, référence, etc."
              />
            </div>
          </div>

          {errors.non_field_errors && (
            <div className="alert alert-error">
              <AlertCircle className="w-5 h-5" />
              <span>{errors.non_field_errors.join(', ')}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => navigate('/prix-carburant')} className="btn btn-ghost">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary gap-2">
              {loading ? <span className="loading loading-spinner loading-sm"></span> : <Save className="w-4 h-4" />}
              {isEdit ? 'Enregistrer' : 'Créer le prix'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrixCarburantForm;