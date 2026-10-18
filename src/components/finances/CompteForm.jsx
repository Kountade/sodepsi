// src/components/finances/CompteForm.jsx
// ============================================================
// VERSION OPTIMISÉE - Formulaire compte comptable
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, Building2, Loader2,
  CheckCircle, AlertCircle, AlertTriangle
} from 'lucide-react';

// ============================================================
// CONSTANTES
// ============================================================
const TYPE_OPTIONS = [
  { value: 'actif', label: 'Actif' },
  { value: 'passif', label: 'Passif' },
  { value: 'capitaux', label: 'Capitaux propres' },
  { value: 'produits', label: 'Produits' },
  { value: 'charges', label: 'Charges' },
];

const CLASSE_OPTIONS = [
  { value: '1', label: 'Classe 1 - Capital' },
  { value: '2', label: 'Classe 2 - Immobilisations' },
  { value: '3', label: 'Classe 3 - Stocks' },
  { value: '4', label: 'Classe 4 - Tiers' },
  { value: '5', label: 'Classe 5 - Trésorerie' },
  { value: '6', label: 'Classe 6 - Charges' },
  { value: '7', label: 'Classe 7 - Produits' },
  { value: '8', label: 'Classe 8 - Régularisation' },
];

// ============================================================
// COMPOSANT
// ============================================================
const CompteForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingParents, setLoadingParents] = useState(false);
  const [comptesParents, setComptesParents] = useState([]);
  const [errors, setErrors] = useState({});

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  const [formData, setFormData] = useState({
    numero: '',
    nom: '',
    nom_complet: '',
    type: 'actif',
    classe: '1',
    parent: '',
    solde_initial: 0,
    is_analytique: false,
    is_budgetaire: false,
    is_active: true,
    notes: '',
  });

  const abortParentsRef = useRef(null);
  const abortCompteRef = useRef(null);

  // ==========================================================
  // NOTIFICATIONS
  // ==========================================================
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  }, []);

  const getToken = () => localStorage.getItem('Token');

  // ==========================================================
  // CHARGEMENT COMPTES PARENTS
  // ==========================================================
  const fetchComptesParents = useCallback(async () => {
    if (abortParentsRef.current) abortParentsRef.current.abort();
    const controller = new AbortController();
    abortParentsRef.current = controller;

    setLoadingParents(true);
    try {
      const token = getToken();
      if (!token) return;

      const response = await AxiosInstance.get(
        '/comptes-comptables/?is_active=true&page_size=500',
        {
          headers: { Authorization: `Token ${token}` },
          signal: controller.signal,
        }
      );

      const data = response.data;
      const results = Array.isArray(data) ? data : data.results || [];
      setComptesParents(results);
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      console.error('❌ Erreur chargement parents:', err);
    } finally {
      setLoadingParents(false);
    }
  }, []);

  // ==========================================================
  // CHARGEMENT COMPTE (mode édition)
  // ==========================================================
  const fetchCompte = useCallback(async () => {
    if (!isEdit) return;

    if (abortCompteRef.current) abortCompteRef.current.abort();
    const controller = new AbortController();
    abortCompteRef.current = controller;

    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await AxiosInstance.get(`/comptes-comptables/${id}/`, {
        headers: { Authorization: `Token ${token}` },
        signal: controller.signal,
      });

      const data = response.data;
      setFormData({
        numero: data.numero || '',
        nom: data.nom || '',
        nom_complet: data.nom_complet || '',
        type: data.type || 'actif',
        classe: data.classe || '1',
        parent: data.parent || '',
        solde_initial: data.solde_initial || 0,
        is_analytique: data.is_analytique || false,
        is_budgetaire: data.is_budgetaire || false,
        is_active: data.is_active !== undefined ? data.is_active : true,
        notes: data.notes || '',
      });
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      console.error('❌ Erreur chargement compte:', err);
      if (err.response?.status === 404) {
        showNotification('Compte introuvable', 'error');
        setTimeout(() => navigate('/comptes-comptables'), 1500);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [id, isEdit, navigate, showNotification]);

  // ==========================================================
  // EFFETS
  // ==========================================================
  useEffect(() => {
    fetchComptesParents();
    if (isEdit) fetchCompte();
    return () => {
      if (abortParentsRef.current) abortParentsRef.current.abort();
      if (abortCompteRef.current) abortCompteRef.current.abort();
    };
  }, [fetchComptesParents, fetchCompte, isEdit]);

  // ==========================================================
  // HANDLERS
  // ==========================================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Efface l'erreur du champ modifié
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // ==========================================================
  // VALIDATION
  // ==========================================================
  const validateForm = () => {
    const newErrors = {};

    if (!formData.numero || formData.numero.trim() === '') {
      newErrors.numero = 'Le numéro est requis';
    }
    if (!formData.nom || formData.nom.trim() === '') {
      newErrors.nom = 'Le nom est requis';
    }
    if (!formData.type) {
      newErrors.type = 'Le type est requis';
    }
    if (!formData.classe) {
      newErrors.classe = 'La classe est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==========================================================
  // SOUMISSION
  // ==========================================================
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) {
      showNotification('Veuillez corriger les erreurs du formulaire', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const dataToSend = {
        ...formData,
        parent: formData.parent || null,
        solde_initial: parseFloat(formData.solde_initial) || 0,
      };

      if (isEdit) {
        await AxiosInstance.put(`/comptes-comptables/${id}/`, dataToSend, {
          headers: { Authorization: `Token ${token}` },
        });
        showNotification('Compte modifié avec succès', 'success');
      } else {
        await AxiosInstance.post('/comptes-comptables/', dataToSend, {
          headers: { Authorization: `Token ${token}` },
        });
        showNotification('Compte créé avec succès', 'success');
      }

      setTimeout(() => navigate('/comptes-comptables'), 1500);
    } catch (err) {
      console.error('❌ Erreur enregistrement:', err);

      let errorMsg = "Erreur lors de l'enregistrement";

      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'object') {
          if (data.numero) {
            setErrors((prev) => ({ ...prev, numero: data.numero[0] }));
            errorMsg = data.numero[0];
          } else if (data.nom) {
            setErrors((prev) => ({ ...prev, nom: data.nom[0] }));
            errorMsg = data.nom[0];
          } else if (data.detail) {
            errorMsg = data.detail;
          } else if (data.message) {
            errorMsg = data.message;
          } else if (data.non_field_errors) {
            errorMsg = data.non_field_errors.join(', ');
          } else {
            const firstError = Object.values(data)[0];
            if (Array.isArray(firstError)) errorMsg = firstError[0];
            else if (typeof firstError === 'string') errorMsg = firstError;
          }
        } else if (typeof data === 'string') {
          errorMsg = data;
        }
      }

      showNotification(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/comptes-comptables');
  };

  // ==========================================================
  // CHARGEMENT INITIAL
  // ==========================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-14 h-14 mx-auto" />
          <p className="text-lg font-medium text-gray-500">
            Chargement du compte…
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDU
  // ==========================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown max-w-md">
          <div
            className={`alert ${
              notification.type === 'success'
                ? 'alert-success'
                : notification.type === 'warning'
                ? 'alert-warning'
                : 'alert-error'
            } shadow-xl rounded-xl`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : notification.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="font-medium text-sm">{notification.message}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() =>
                setNotification((prev) => ({ ...prev, show: false }))
              }
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="btn btn-ghost btn-sm gap-2"
              disabled={submitting}
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Building2 className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-primary">
                    {isEdit
                      ? 'Modifier le compte'
                      : 'Nouveau compte comptable'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isEdit
                      ? 'Modifiez les informations du compte'
                      : 'Créez un nouveau compte comptable'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3.5 border-b border-gray-200">
              <h3 className="font-semibold flex items-center gap-2 text-gray-700">
                <Building2 className="w-5 h-5 text-primary" />
                Informations du compte
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Numéro + Nom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Numéro <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="numero"
                    value={formData.numero}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${
                      errors.numero ? 'input-error' : ''
                    }`}
                    placeholder="Ex: 411"
                    disabled={isEdit || submitting}
                  />
                  {errors.numero && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.numero}
                    </p>
                  )}
                  {isEdit && (
                    <p className="text-xs text-gray-400 mt-1">
                      Le numéro ne peut pas être modifié
                    </p>
                  )}
                </div>
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${
                      errors.nom ? 'input-error' : ''
                    }`}
                    placeholder="Ex: Clients"
                    disabled={submitting}
                  />
                  {errors.nom && (
                    <p className="text-red-500 text-xs mt-1">{errors.nom}</p>
                  )}
                </div>
              </div>

              {/* Nom complet */}
              <div>
                <label className="label text-sm font-medium text-gray-700">
                  Nom complet
                </label>
                <input
                  type="text"
                  name="nom_complet"
                  value={formData.nom_complet}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Ex: Clients - Comptes clients"
                  disabled={submitting}
                />
              </div>

              {/* Type + Classe */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className={`select select-bordered w-full ${
                      errors.type ? 'select-error' : ''
                    }`}
                    disabled={submitting}
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {errors.type && (
                    <p className="text-red-500 text-xs mt-1">{errors.type}</p>
                  )}
                </div>
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Classe <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="classe"
                    value={formData.classe}
                    onChange={handleChange}
                    className={`select select-bordered w-full ${
                      errors.classe ? 'select-error' : ''
                    }`}
                    disabled={submitting}
                  >
                    {CLASSE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {errors.classe && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.classe}
                    </p>
                  )}
                </div>
              </div>

              {/* Parent + Solde initial */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Compte parent
                  </label>
                  <select
                    name="parent"
                    value={formData.parent}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                    disabled={loadingParents || submitting}
                  >
                    <option value="">Aucun (compte racine)</option>
                    {comptesParents
                      .filter((c) => c.id !== parseInt(id))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.numero} - {c.nom}
                        </option>
                      ))}
                  </select>
                  {loadingParents && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Chargement des comptes parents…
                    </p>
                  )}
                </div>
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Solde initial
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      F
                    </span>
                    <input
                      type="number"
                      name="solde_initial"
                      value={formData.solde_initial}
                      onChange={handleChange}
                      className="input input-bordered w-full pl-8"
                      step="0.01"
                      min="0"
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_analytique"
                    checked={formData.is_analytique}
                    onChange={handleChange}
                    className="checkbox checkbox-primary"
                    disabled={submitting}
                  />
                  <span className="text-sm text-gray-700">
                    Compte analytique
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_budgetaire"
                    checked={formData.is_budgetaire}
                    onChange={handleChange}
                    className="checkbox checkbox-primary"
                    disabled={submitting}
                  />
                  <span className="text-sm text-gray-700">
                    Compte budgétaire
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="checkbox checkbox-primary"
                    disabled={submitting}
                  />
                  <span className="text-sm text-gray-700">Actif</span>
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="label text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="textarea textarea-bordered w-full min-h-[80px]"
                  placeholder="Informations supplémentaires…"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-ghost gap-2"
              disabled={submitting}
            >
              <X className="w-5 h-5" /> Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2 min-w-[180px]"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isEdit ? 'Modifier' : 'Créer'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompteForm;