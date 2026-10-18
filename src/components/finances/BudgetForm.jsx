// src/components/finances/BudgetForm.jsx
// ============================================================
// VERSION CORRIGÉE - Formulaire budget avec lignes
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, Wallet, Loader2,
  CheckCircle, AlertCircle, AlertTriangle,
  Plus, Trash2, FileText, Calculator
} from 'lucide-react';

// ============================================================
// CONSTANTES
// ============================================================
const TYPE_OPTIONS = [
  { value: 'annuel', label: 'Annuel' },
  { value: 'trimestriel', label: 'Trimestriel' },
  { value: 'mensuel', label: 'Mensuel' },
  { value: 'projet', label: 'Projet' },
];

const STATUT_OPTIONS = [
  { value: 'en_cours', label: 'En cours' },
  { value: 'termine', label: 'Terminé' },
  { value: 'annule', label: 'Annulé' },
];

// ============================================================
// HELPERS
// ============================================================
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '0 FCFA';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0 FCFA';
  return `${num.toLocaleString('fr-FR')} FCFA`;
};

// ============================================================
// COMPOSANT
// ============================================================
const BudgetForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});

  const [lignes, setLignes] = useState([]);

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  const [formData, setFormData] = useState({
    nom: '',
    type: 'annuel',
    montant_total: '',
    date_debut: '',
    date_fin: '',
    statut: 'en_cours',
    notes: '',
  });

  const abortCategoriesRef = useRef(null);
  const abortBudgetRef = useRef(null);

  const getToken = () => localStorage.getItem('Token');

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

  // ==========================================================
  // CHARGEMENT CATÉGORIES
  // ==========================================================
  const fetchCategories = useCallback(async () => {
    if (abortCategoriesRef.current) abortCategoriesRef.current.abort();
    const controller = new AbortController();
    abortCategoriesRef.current = controller;

    setLoadingCategories(true);
    try {
      const token = getToken();
      if (!token) return;

      const response = await AxiosInstance.get(
        '/budget-categories/?is_active=true&page_size=200',
        {
          headers: { Authorization: `Token ${token}` },
          signal: controller.signal,
        }
      );

      const data = response.data;
      const results = Array.isArray(data) ? data : data.results || [];
      setCategories(results);
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      console.error('❌ Erreur chargement catégories:', err);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // ==========================================================
  // CHARGEMENT BUDGET (mode édition)
  // ==========================================================
  const fetchBudget = useCallback(async () => {
    if (!isEdit) return;

    if (abortBudgetRef.current) abortBudgetRef.current.abort();
    const controller = new AbortController();
    abortBudgetRef.current = controller;

    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await AxiosInstance.get(`/budgets/${id}/`, {
        headers: { Authorization: `Token ${token}` },
        signal: controller.signal,
      });

      const data = response.data;
      setFormData({
        nom: data.nom || '',
        type: data.type || 'annuel',
        montant_total: data.montant_total || '',
        date_debut: data.date_debut || '',
        date_fin: data.date_fin || '',
        statut: data.statut || 'en_cours',
        notes: data.notes || '',
      });

      // Lignes existantes
      if (data.lignes && data.lignes.length > 0) {
        setLignes(
          data.lignes.map((l) => ({
            id: l.id,
            categorie: l.categorie,
            categorie_nom: l.categorie_nom,
            montant_prevu: l.montant_prevu,
            montant_utilise: l.montant_utilise || 0,
          }))
        );
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      console.error('❌ Erreur chargement budget:', err);
      if (err.response?.status === 404) {
        showNotification('Budget introuvable', 'error');
        setTimeout(() => navigate('/budgets'), 1500);
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
    fetchCategories();
    if (isEdit) fetchBudget();
    return () => {
      if (abortCategoriesRef.current) abortCategoriesRef.current.abort();
      if (abortBudgetRef.current) abortBudgetRef.current.abort();
    };
  }, [fetchCategories, fetchBudget, isEdit]);

  // ==========================================================
  // HANDLERS
  // ==========================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleLigneChange = (index, field, value) => {
    const newLignes = [...lignes];
    newLignes[index][field] = value;
    setLignes(newLignes);
  };

  const addLigne = () => {
    setLignes([...lignes, { categorie: '', montant_prevu: '' }]);
  };

  const removeLigne = (index) => {
    setLignes(lignes.filter((_, i) => i !== index));
  };

  // ==========================================================
  // CALCULS
  // ==========================================================
  const totalLignes = lignes.reduce(
    (sum, l) => sum + (parseFloat(l.montant_prevu) || 0),
    0
  );

  const montantTotal = parseFloat(formData.montant_total) || 0;
  const difference = totalLignes - montantTotal;

  // ==========================================================
  // VALIDATION
  // ==========================================================
  const validateForm = () => {
    const newErrors = {};

    if (!formData.nom || formData.nom.trim() === '') {
      newErrors.nom = 'Le nom est requis';
    }
    if (!formData.date_debut) {
      newErrors.date_debut = 'La date de début est requise';
    }
    if (!formData.date_fin) {
      newErrors.date_fin = 'La date de fin est requise';
    }
    if (
      formData.date_debut &&
      formData.date_fin &&
      formData.date_debut > formData.date_fin
    ) {
      newErrors.date_fin = 'La date de fin doit être postérieure à la date de début';
    }
    if (!formData.montant_total || parseFloat(formData.montant_total) <= 0) {
      newErrors.montant_total = 'Le montant total doit être supérieur à 0';
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

    // Vérifier les lignes
    const validLignes = lignes.filter(
      (l) => l.categorie && parseFloat(l.montant_prevu) > 0
    );
    if (lignes.length > 0 && validLignes.length !== lignes.length) {
      showNotification(
        'Toutes les lignes doivent avoir une catégorie et un montant valide',
        'error'
      );
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
        nom: formData.nom,
        type: formData.type,
        montant_total: parseFloat(formData.montant_total),
        date_debut: formData.date_debut,
        date_fin: formData.date_fin,
        statut: formData.statut,
        notes: formData.notes,
        lignes: validLignes.map((l) => ({
          categorie: parseInt(l.categorie),
          montant_prevu: parseFloat(l.montant_prevu),
        })),
      };

      if (isEdit) {
        await AxiosInstance.put(`/budgets/${id}/`, dataToSend, {
          headers: { Authorization: `Token ${token}` },
        });
        showNotification('Budget modifié avec succès', 'success');
      } else {
        await AxiosInstance.post('/budgets/', dataToSend, {
          headers: { Authorization: `Token ${token}` },
        });
        showNotification('Budget créé avec succès', 'success');
      }

      setTimeout(() => navigate('/budgets'), 1500);
    } catch (err) {
      console.error('❌ Erreur enregistrement:', err);

      let errorMsg = "Erreur lors de l'enregistrement";

      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'object') {
          if (data.nom) {
            setErrors((prev) => ({ ...prev, nom: data.nom[0] }));
            errorMsg = data.nom[0];
          } else if (data.montant_total) {
            setErrors((prev) => ({
              ...prev,
              montant_total: data.montant_total[0],
            }));
            errorMsg = data.montant_total[0];
          } else if (data.lignes) {
            errorMsg = Array.isArray(data.lignes)
              ? data.lignes[0]
              : data.lignes;
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
    navigate('/budgets');
  };

  // ==========================================================
  // CHARGEMENT INITIAL
  // ==========================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-green-600 w-14 h-14 mx-auto" />
          <p className="text-lg font-medium text-gray-500">
            Chargement du budget…
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDU
  // ==========================================================
  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div
            className={`alert ${
              notification.type === 'success'
                ? 'alert-success'
                : notification.type === 'warning'
                ? 'alert-warning'
                : 'alert-error'
            } shadow-xl rounded-xl max-w-md`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5 shrink-0" />
              ) : notification.type === 'warning' ? (
                <AlertTriangle className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
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
      <div className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-6 py-5">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="btn btn-ghost btn-sm gap-2"
              disabled={submitting}
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-xl">
                <Wallet className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-green-600">
                  {isEdit ? 'Modifier le budget' : 'Nouveau budget'}
                </h1>
                <p className="text-sm text-gray-500">
                  {isEdit
                    ? 'Modifiez les informations du budget'
                    : 'Créez un nouveau budget'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="w-full px-6 py-6">
        <form onSubmit={handleSubmit} className="w-full space-y-6">
          {/* Section infos générales */}
          <div className="w-full bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3.5 border-b border-gray-200">
              <h3 className="font-semibold flex items-center gap-2 text-gray-700">
                <FileText className="w-5 h-5 text-green-600" />
                Informations du budget
              </h3>
            </div>
            <div className="w-full p-6 space-y-4">
              {/* Nom + Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    placeholder="Ex: Budget 2026"
                    disabled={submitting}
                  />
                  {errors.nom && (
                    <p className="text-red-500 text-xs mt-1">{errors.nom}</p>
                  )}
                </div>
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                    disabled={submitting}
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Date début <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date_debut"
                    value={formData.date_debut}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${
                      errors.date_debut ? 'input-error' : ''
                    }`}
                    disabled={submitting}
                  />
                  {errors.date_debut && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.date_debut}
                    </p>
                  )}
                </div>
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Date fin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date_fin"
                    value={formData.date_fin}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${
                      errors.date_fin ? 'input-error' : ''
                    }`}
                    disabled={submitting}
                  />
                  {errors.date_fin && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.date_fin}
                    </p>
                  )}
                </div>
              </div>

              {/* Montant total + Statut */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Montant total <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      F
                    </span>
                    <input
                      type="number"
                      name="montant_total"
                      value={formData.montant_total}
                      onChange={handleChange}
                      className={`input input-bordered w-full pl-8 ${
                        errors.montant_total ? 'input-error' : ''
                      }`}
                      placeholder="0"
                      step="0.01"
                      min="0"
                      disabled={submitting}
                    />
                  </div>
                  {errors.montant_total && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.montant_total}
                    </p>
                  )}
                  {formData.montant_total &&
                    !errors.montant_total &&
                    parseFloat(formData.montant_total) > 0 && (
                      <p className="text-green-600 text-xs mt-1">
                        {formatCurrency(parseFloat(formData.montant_total))}
                      </p>
                    )}
                </div>
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Statut
                  </label>
                  <select
                    name="statut"
                    value={formData.statut}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                    disabled={submitting}
                  >
                    {STATUT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
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
                  className="textarea textarea-bordered w-full min-h-[60px]"
                  placeholder="Informations supplémentaires…"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* Section lignes budgétaires */}
          <div className="w-full bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3.5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2 text-gray-700">
                <Calculator className="w-5 h-5 text-primary" />
                Lignes budgétaires ({lignes.length})
              </h3>
              <button
                type="button"
                onClick={addLigne}
                className="btn btn-sm btn-primary gap-1"
                disabled={submitting}
              >
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>
            <div className="w-full p-4 space-y-3">
              {lignes.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Calculator className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Aucune ligne budgétaire</p>
                  <button
                    type="button"
                    onClick={addLigne}
                    className="btn btn-ghost btn-sm gap-1 mt-2"
                    disabled={submitting}
                  >
                    <Plus className="w-4 h-4" /> Ajouter une ligne
                  </button>
                </div>
              ) : (
                lignes.map((ligne, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div>
                      <label className="label text-xs font-medium text-gray-600">
                        Catégorie
                      </label>
                      <select
                        value={ligne.categorie}
                        onChange={(e) =>
                          handleLigneChange(index, 'categorie', e.target.value)
                        }
                        className="select select-bordered w-full select-sm"
                        disabled={loadingCategories || submitting}
                      >
                        <option value="">
                          {loadingCategories
                            ? 'Chargement…'
                            : 'Sélectionner'}
                        </option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code} - {c.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label text-xs font-medium text-gray-600">
                        Montant prévu
                      </label>
                      <input
                        type="number"
                        value={ligne.montant_prevu}
                        onChange={(e) =>
                          handleLigneChange(
                            index,
                            'montant_prevu',
                            e.target.value
                          )
                        }
                        className="input input-bordered w-full input-sm"
                        placeholder="0"
                        step="0.01"
                        min="0"
                        disabled={submitting}
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeLigne(index)}
                        className="btn btn-ghost btn-sm btn-circle text-error"
                        disabled={submitting}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* Total lignes */}
              {lignes.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700">
                      Total des lignes
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(totalLignes)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500">
                      Montant total du budget
                    </span>
                    <span className="font-semibold text-gray-700">
                      {formatCurrency(montantTotal)}
                    </span>
                  </div>
                  {Math.abs(difference) > 0.01 && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-semibold ${
                            difference > 0 ? 'text-error' : 'text-warning'
                          }`}
                        >
                          {difference > 0
                            ? '⚠️ Dépassement'
                            : '💡 Reste à allouer'}
                        </span>
                        <span
                          className={`font-bold ${
                            difference > 0 ? 'text-error' : 'text-warning'
                          }`}
                        >
                          {formatCurrency(Math.abs(difference))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Boutons */}
          <div className="w-full mt-6 flex flex-col sm:flex-row gap-3 justify-end">
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
              className="btn btn-success gap-2 min-w-[180px] text-white"
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

export default BudgetForm;