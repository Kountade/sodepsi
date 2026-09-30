// src/components/station/CuveApprovisionnement.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Fuel, Droplet, Plus, RefreshCw, CheckCircle,
  AlertCircle, X, TrendingUp, Warehouse, Gauge, Calendar,
  User, FileText, Activity, Search
} from 'lucide-react';

const CuveApprovisionnement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // États
  const [cuves, setCuves] = useState([]);
  const [selectedCuveId, setSelectedCuveId] = useState(searchParams.get('cuve') || '');
  const [selectedCuve, setSelectedCuve] = useState(null);
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMouvements, setLoadingMouvements] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [searchCuve, setSearchCuve] = useState('');

  // Formulaire
  const [form, setForm] = useState({
    quantite: '',
    reference: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');
  const formatNumber = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);
  const formatDate = (d) => d ? new Date(d).toLocaleString('fr-FR') : '';

  // Charger toutes les cuves
  const fetchCuves = async () => {
    try {
      const token = getToken();
      const res = await AxiosInstance.get('/cuves/', {
        headers: { Authorization: `Token ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setCuves(data);

      // Si une cuve est pré-sélectionnée dans l'URL
      if (selectedCuveId) {
        const found = data.find(c => String(c.id) === String(selectedCuveId));
        if (found) setSelectedCuve(found);
      }
    } catch (err) {
      console.error(err);
      showNotification('Erreur de chargement des cuves', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Charger les mouvements d'approvisionnement d'une cuve
  const fetchMouvements = async (cuveId) => {
    if (!cuveId) return;
    setLoadingMouvements(true);
    try {
      const token = getToken();
      const res = await AxiosInstance.get(`/cuves/${cuveId}/mouvements/`, {
        headers: { Authorization: `Token ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      // Filtrer uniquement les approvisionnements récents
      const appros = data
        .filter(m => m.type_mouvement === 'approvisionnement')
        .slice(0, 10);
      setMouvements(appros);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMouvements(false);
    }
  };

  useEffect(() => {
    fetchCuves();
  }, []);

  useEffect(() => {
    if (selectedCuveId) {
      const found = cuves.find(c => String(c.id) === String(selectedCuveId));
      setSelectedCuve(found || null);
      if (found) fetchMouvements(found.id);
    } else {
      setSelectedCuve(null);
      setMouvements([]);
    }
  }, [selectedCuveId, cuves]);

  // Soumettre l'approvisionnement
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCuve) {
      showNotification('Veuillez sélectionner une cuve', 'error');
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const token = getToken();
      const payload = {
        quantite: parseFloat(form.quantite),
        reference: form.reference || '',
        notes: form.notes || '',
      };

      await AxiosInstance.post(
        `/cuves/${selectedCuve.id}/approvisionner/`,
        payload,
        { headers: { Authorization: `Token ${token}` } }
      );

      showNotification(
        `✅ ${formatNumber(payload.quantite)} L ajoutés à ${selectedCuve.nom}`,
        'success'
      );

      // Réinitialiser le formulaire
      setForm({ quantite: '', reference: '', notes: '' });

      // Rafraîchir les données
      await fetchCuves();
      await fetchMouvements(selectedCuve.id);
    } catch (err) {
      console.error(err);
      const data = err.response?.data;
      if (typeof data === 'object') {
        setErrors(data);
        const msg = data.error || data.quantite?.[0] || data.detail || 'Erreur lors de l\'approvisionnement';
        showNotification(msg, 'error');
      } else {
        showNotification('Erreur lors de l\'approvisionnement', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Cuves filtrées par recherche
  const filteredCuves = cuves.filter(c => {
    if (!searchCuve) return true;
    const q = searchCuve.toLowerCase();
    return (
      (c.nom || '').toLowerCase().includes(q) ||
      (c.code || '').toLowerCase().includes(q) ||
      (c.type_carburant_display || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success'
                ? <CheckCircle className="w-4 h-4" />
                : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium text-sm">{notification.message}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => setNotification({ ...notification, show: false })}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/cuves')}
            className="btn btn-ghost btn-circle"
            title="Retour à la liste des cuves"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2 bg-success/10 rounded-xl">
            <TrendingUp className="w-7 h-7 text-success" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-primary">
              Approvisionnement des cuves
            </h1>
            <p className="text-sm text-gray-500">
              Ajoutez du carburant dans vos réservoirs
            </p>
          </div>
        </div>
        <button
          onClick={() => { fetchCuves(); if (selectedCuve) fetchMouvements(selectedCuve.id); }}
          className="btn btn-outline btn-sm gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche : sélection + formulaire */}
        <div className="lg:col-span-2 space-y-6">

          {/* Sélection de la cuve */}
          <div className="bg-white rounded-xl shadow-md p-5">
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Fuel className="w-5 h-5 text-primary" />
              1. Sélectionnez une cuve
            </h2>

            {cuves.length === 0 ? (
              <div className="text-center py-8">
                <Fuel className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 mb-3">Aucune cuve disponible</p>
                <button
                  onClick={() => navigate('/cuves/nouveau')}
                  className="btn btn-primary btn-sm gap-2"
                >
                  <Plus className="w-4 h-4" /> Créer une cuve
                </button>
              </div>
            ) : (
              <>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une cuve..."
                    className="input input-bordered w-full pl-9"
                    value={searchCuve}
                    onChange={(e) => setSearchCuve(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                  {filteredCuves.map(cuve => {
                    const isSelected = String(selectedCuveId) === String(cuve.id);
                    const taux = cuve.taux_remplissage || 0;
                    const isFull = taux >= 100;
                    const enAlerte = cuve.est_en_alerte;

                    return (
                      <button
                        key={cuve.id}
                        onClick={() => setSelectedCuveId(String(cuve.id))}
                        className={`
                          text-left p-3 rounded-xl border-2 transition-all
                          ${isSelected
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${enAlerte ? 'bg-error/10' : 'bg-primary/10'}`}>
                              <Droplet className={`w-4 h-4 ${enAlerte ? 'text-error' : 'text-primary'}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{cuve.nom}</p>
                              <p className="text-xs text-gray-500">{cuve.code}</p>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-primary" />
                          )}
                        </div>

                        <div className="text-xs text-gray-500 mb-1">
                          {cuve.type_carburant_display}
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                enAlerte ? 'bg-error' : taux < 50 ? 'bg-warning' : 'bg-success'
                              }`}
                              style={{ width: `${Math.min(taux, 100)}%` }}
                            ></div>
                          </div>
                          <span className="font-medium">{taux.toFixed(0)}%</span>
                        </div>

                        <div className="text-xs text-gray-500 mt-1">
                          {formatNumber(cuve.niveau_actuel)} / {formatNumber(cuve.capacite_max)} L
                        </div>

                        {isFull && (
                          <div className="badge badge-warning badge-xs mt-2">Cuve pleine</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Formulaire d'approvisionnement */}
          {selectedCuve && (
            <div className="bg-white rounded-xl shadow-md p-5">
              <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Plus className="w-5 h-5 text-success" />
                2. Saisissez l'approvisionnement
              </h2>

              {/* Info cuve sélectionnée */}
              <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-lg p-3 mb-4 border-l-4 border-primary">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{selectedCuve.nom}</p>
                    <p className="text-xs text-gray-500">
                      {selectedCuve.code} · {selectedCuve.type_carburant_display}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Espace disponible</p>
                    <p className="font-bold text-success">
                      {formatNumber(parseFloat(selectedCuve.capacite_max) - parseFloat(selectedCuve.niveau_actuel))} L
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Quantité */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Quantité à ajouter (L) <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={parseFloat(selectedCuve.capacite_max) - parseFloat(selectedCuve.niveau_actuel)}
                    className={`input input-bordered input-lg text-lg font-bold ${errors.quantite ? 'input-error' : ''}`}
                    value={form.quantite}
                    onChange={(e) => setForm({ ...form, quantite: e.target.value })}
                    placeholder="Ex: 1000"
                    required
                    autoFocus
                  />
                  {errors.quantite && (
                    <span className="text-error text-xs mt-1">
                      {Array.isArray(errors.quantite) ? errors.quantite[0] : errors.quantite}
                    </span>
                  )}

                  {/* Raccourcis rapides */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[100, 500, 1000, 2000, 5000].map(q => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setForm({ ...form, quantite: String(q) })}
                        className="btn btn-xs btn-outline"
                      >
                        +{formatNumber(q)} L
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const dispo = parseFloat(selectedCuve.capacite_max) - parseFloat(selectedCuve.niveau_actuel);
                        setForm({ ...form, quantite: dispo.toFixed(2) });
                      }}
                      className="btn btn-xs btn-success"
                    >
                      Remplir au max
                    </button>
                  </div>
                </div>

                {/* Référence */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Référence / N° bon de livraison</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={form.reference}
                    onChange={(e) => setForm({ ...form, reference: e.target.value })}
                    placeholder="Ex: BL-2026-0001"
                  />
                </div>

                {/* Notes */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Notes</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered"
                    rows="2"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Commentaires éventuels..."
                  />
                </div>

                {/* Erreur globale */}
                {errors.non_field_errors && (
                  <div className="alert alert-error">
                    <AlertCircle className="w-5 h-5" />
                    <span>{errors.non_field_errors.join(', ')}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setForm({ quantite: '', reference: '', notes: '' })}
                    className="btn btn-ghost"
                  >
                    Réinitialiser
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !form.quantite}
                    className="btn btn-success gap-2"
                  >
                    {submitting ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <TrendingUp className="w-4 h-4" />
                    )}
                    Enregistrer l'approvisionnement
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Colonne droite : infos + historique */}
        <div className="space-y-6">

          {/* Détails de la cuve sélectionnée */}
          {selectedCuve && (
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-primary" />
                État actuel
              </h3>

              <div className="text-center py-4">
                <p className="text-4xl font-black text-primary">
                  {formatNumber(selectedCuve.niveau_actuel)} L
                </p>
                <p className="text-sm text-gray-500">
                  sur {formatNumber(selectedCuve.capacite_max)} L
                </p>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div
                  className={`h-4 rounded-full transition-all ${
                    selectedCuve.est_en_alerte
                      ? 'bg-error'
                      : selectedCuve.taux_remplissage < 50
                        ? 'bg-warning'
                        : 'bg-success'
                  }`}
                  style={{ width: `${Math.min(selectedCuve.taux_remplissage, 100)}%` }}
                ></div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium">{selectedCuve.type_carburant_display}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Seuil d'alerte</span>
                  <span className="font-medium">{formatNumber(selectedCuve.capacite_alerte)} L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Emplacement</span>
                  <span className="font-medium">{selectedCuve.emplacement || 'N/A'}</span>
                </div>
                {selectedCuve.derniere_livraison && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dernière livraison</span>
                    <span className="font-medium text-xs">
                      {formatDate(selectedCuve.derniere_livraison)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Historique des approvisionnements */}
          {selectedCuve && (
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Approvisionnements récents
                <span className="badge badge-primary badge-sm ml-auto">
                  {mouvements.length}
                </span>
              </h3>

              {loadingMouvements ? (
                <div className="text-center py-6">
                  <span className="loading loading-spinner loading-sm"></span>
                </div>
              ) : mouvements.length === 0 ? (
                <p className="text-center text-gray-400 py-6 text-sm">
                  Aucun approvisionnement enregistré
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {mouvements.map(m => (
                    <div
                      key={m.id}
                      className="p-3 rounded-lg bg-gray-50 border-l-4 border-success"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-success text-sm">
                          +{formatNumber(m.quantite)} L
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(m.created_at)}
                        </span>
                      </div>
                      {m.reference && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <FileText className="w-3 h-3" />
                          {m.reference}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {formatNumber(m.ancien_niveau)} L → {formatNumber(m.nouveau_niveau)} L
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Message si aucune cuve sélectionnée */}
          {!selectedCuve && cuves.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <Fuel className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                Sélectionnez une cuve pour commencer l'approvisionnement
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CuveApprovisionnement;