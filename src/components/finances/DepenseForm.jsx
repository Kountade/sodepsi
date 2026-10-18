// src/components/finances/DepenseForm.jsx
// ============================================================
// VERSION CORRIGÉE - Formulaire dépense
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, TrendingDown, Loader2,
  CheckCircle, AlertCircle, AlertTriangle, FileText
} from 'lucide-react';

// ============================================================
// CONSTANTES
// ============================================================
const CATEGORIE_OPTIONS = [
  { value: 'fournitures', label: 'Fournitures de bureau' },
  { value: 'utilities', label: 'Services publics' },
  { value: 'loyer', label: 'Loyer' },
  { value: 'salaires', label: 'Salaires' },
  { value: 'marketing', label: 'Marketing et publicité' },
  { value: 'transport', label: 'Transport et déplacements' },
  { value: 'maintenance', label: 'Maintenance et réparation' },
  { value: 'formation', label: 'Formation' },
  { value: 'informatique', label: 'Informatique' },
  { value: 'telecommunication', label: 'Télécommunication' },
  { value: 'frais_bancaires', label: 'Frais bancaires' },
  { value: 'impots', label: 'Impôts et taxes' },
  { value: 'assurance', label: 'Assurance' },
  { value: 'frais_professionnels', label: 'Frais professionnels' },
  { value: 'achat_stock', label: 'Achat de stock' },
  { value: 'autre', label: 'Autre' },
];

const MODE_PAIEMENT_OPTIONS = [
  { value: 'cash', label: 'Espèces' },
  { value: 'card', label: 'Carte bancaire' },
  { value: 'check', label: 'Chèque' },
  { value: 'transfer', label: 'Virement bancaire' },
  { value: 'mobile_money', label: 'Mobile Money' },
];

// ============================================================
// COMPOSANT
// ============================================================
const DepenseForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingFournisseurs, setLoadingFournisseurs] = useState(false);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  const [formData, setFormData] = useState({
    categorie: 'autre',
    description: '',
    montant: '',
    taxe: 0,
    date_depense: new Date().toISOString().split('T')[0],
    date_echeance: '',
    mode_paiement: '',
    supplier_id: '',
    supplier_name: '',
    notes: '',
  });

  const abortFournisseursRef = useRef(null);
  const abortDepenseRef = useRef(null);

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
  // CHARGEMENT FOURNISSEURS
  // ==========================================================
  const fetchFournisseurs = useCallback(async () => {
    if (abortFournisseursRef.current) abortFournisseursRef.current.abort();
    const controller = new AbortController();
    abortFournisseursRef.current = controller;

    setLoadingFournisseurs(true);
    try {
      const token = getToken();
      if (!token) return;

      const response = await AxiosInstance.get(
        '/suppliers/?is_active=true&page_size=200',
        {
          headers: { Authorization: `Token ${token}` },
          signal: controller.signal,
        }
      );

      const data = response.data;
      const results = Array.isArray(data) ? data : data.results || [];
      setFournisseurs(results);
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      console.error('❌ Erreur chargement fournisseurs:', err);
    } finally {
      setLoadingFournisseurs(false);
    }
  }, []);

  // ==========================================================
  // CHARGEMENT DÉPENSE (mode édition)
  // ==========================================================
  const fetchDepense = useCallback(async () => {
    if (!isEdit) return;

    if (abortDepenseRef.current) abortDepenseRef.current.abort();
    const controller = new AbortController();
    abortDepenseRef.current = controller;

    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await AxiosInstance.get(`/depenses/${id}/`, {
        headers: { Authorization: `Token ${token}` },
        signal: controller.signal,
      });

      const data = response.data;
      setFormData({
        categorie: data.categorie || 'autre',
        description: data.description || '',
        montant: data.montant || '',
        taxe: data.taxe || 0,
        date_depense: data.date_depense || '',
        date_echeance: data.date_echeance || '',
        mode_paiement: data.mode_paiement || '',
        supplier_id: data.supplier_id || '',
        supplier_name: data.supplier_name || '',
        notes: data.notes || '',
      });

      if (data.piece_jointe) {
        setFilePreview(data.piece_jointe);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      console.error('❌ Erreur chargement dépense:', err);
      if (err.response?.status === 404) {
        showNotification('Dépense introuvable', 'error');
        setTimeout(() => navigate('/depenses'), 1500);
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
    fetchFournisseurs();
    if (isEdit) fetchDepense();
    return () => {
      if (abortFournisseursRef.current) abortFournisseursRef.current.abort();
      if (abortDepenseRef.current) abortDepenseRef.current.abort();
    };
  }, [fetchFournisseurs, fetchDepense, isEdit]);

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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > 2 * 1024 * 1024) {
      showNotification('Le fichier est trop volumineux (max 2 Mo)', 'error');
      return;
    }

    setFile(selectedFile);
    setFilePreview(URL.createObjectURL(selectedFile));
  };

  const handleSupplierChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      supplier_id: value,
      supplier_name: value ? '' : prev.supplier_name,
    }));
  };

  // ==========================================================
  // VALIDATION
  // ==========================================================
  const validateForm = () => {
    const newErrors = {};

    if (!formData.date_depense) {
      newErrors.date_depense = 'La date est requise';
    }
    if (!formData.description || formData.description.trim() === '') {
      newErrors.description = 'La description est requise';
    }
    if (!formData.montant || parseFloat(formData.montant) <= 0) {
      newErrors.montant = 'Le montant doit être supérieur à 0';
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

      const dataToSend = new FormData();
      dataToSend.append('categorie', formData.categorie);
      dataToSend.append('description', formData.description);
      dataToSend.append('montant', parseFloat(formData.montant));
      dataToSend.append('taxe', parseFloat(formData.taxe) || 0);
      dataToSend.append('date_depense', formData.date_depense);
      if (formData.date_echeance)
        dataToSend.append('date_echeance', formData.date_echeance);
      if (formData.mode_paiement)
        dataToSend.append('mode_paiement', formData.mode_paiement);
      if (formData.supplier_id)
        dataToSend.append('supplier_id', formData.supplier_id);
      if (formData.supplier_name)
        dataToSend.append('supplier_name', formData.supplier_name);
      if (formData.notes) dataToSend.append('notes', formData.notes);
      if (file) dataToSend.append('piece_jointe', file);

      if (isEdit) {
        await AxiosInstance.put(`/depenses/${id}/`, dataToSend, {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        showNotification('Dépense modifiée avec succès', 'success');
      } else {
        await AxiosInstance.post('/depenses/', dataToSend, {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        showNotification('Dépense créée avec succès', 'success');
      }

      setTimeout(() => navigate('/depenses'), 1500);
    } catch (err) {
      console.error('❌ Erreur enregistrement:', err);

      let errorMsg = "Erreur lors de l'enregistrement";

      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'object') {
          if (data.message) errorMsg = data.message;
          else if (data.detail) errorMsg = data.detail;
          else if (data.non_field_errors)
            errorMsg = data.non_field_errors.join(', ');
          else {
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
    navigate('/depenses');
  };

  // ==========================================================
  // CHARGEMENT INITIAL
  // ==========================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-error w-14 h-14 mx-auto" />
          <p className="text-lg font-medium text-gray-500">
            Chargement de la dépense…
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
      <div className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-6 py-5">
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
                  <div className="p-2 bg-error/10 rounded-xl">
                    <TrendingDown className="w-7 h-7 text-error" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-error">
                      {isEdit ? 'Modifier la dépense' : 'Nouvelle dépense'}
                    </h1>
                    <p className="text-sm text-gray-500">
                      {isEdit
                        ? 'Modifiez les informations de la dépense'
                        : 'Enregistrez une nouvelle dépense'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="w-full px-6 py-6">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="w-full bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3.5 border-b border-gray-200">
              <h3 className="font-semibold flex items-center gap-2 text-gray-700">
                <FileText className="w-5 h-5 text-error" />
                Informations de la dépense
              </h3>
            </div>
            <div className="w-full p-6 space-y-4">
              {/* Catégorie + Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Catégorie <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="categorie"
                    value={formData.categorie}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                    disabled={submitting}
                  >
                    {CATEGORIE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date_depense"
                    value={formData.date_depense}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${
                      errors.date_depense ? 'input-error' : ''
                    }`}
                    disabled={submitting}
                  />
                  {errors.date_depense && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.date_depense}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="label text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={`textarea textarea-bordered w-full min-h-[80px] ${
                    errors.description ? 'textarea-error' : ''
                  }`}
                  placeholder="Description de la dépense…"
                  disabled={submitting}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Montant + Taxe + Échéance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Montant <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      F
                    </span>
                    <input
                      type="number"
                      name="montant"
                      value={formData.montant}
                      onChange={handleChange}
                      className={`input input-bordered w-full pl-8 ${
                        errors.montant ? 'input-error' : ''
                      }`}
                      placeholder="0"
                      step="0.01"
                      min="0"
                      disabled={submitting}
                    />
                  </div>
                  {errors.montant && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.montant}
                    </p>
                  )}
                </div>
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Taxe (FCFA)
                  </label>
                  <input
                    type="number"
                    name="taxe"
                    value={formData.taxe}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    placeholder="0"
                    step="0.01"
                    min="0"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Date d'échéance
                  </label>
                  <input
                    type="date"
                    name="date_echeance"
                    value={formData.date_echeance}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Fournisseur */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Fournisseur
                  </label>
                  <select
                    name="supplier_id"
                    value={formData.supplier_id}
                    onChange={handleSupplierChange}
                    className="select select-bordered w-full"
                    disabled={loadingFournisseurs || submitting}
                  >
                    <option value="">
                      {loadingFournisseurs
                        ? 'Chargement…'
                        : 'Sélectionner un fournisseur'}
                    </option>
                    {fournisseurs.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.code} - {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Nom du fournisseur (libre)
                  </label>
                  <input
                    type="text"
                    name="supplier_name"
                    value={formData.supplier_name}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    placeholder="Nom du fournisseur"
                    disabled={!!formData.supplier_id || submitting}
                  />
                </div>
              </div>

              {/* Mode paiement */}
              <div>
                <label className="label text-sm font-medium text-gray-700">
                  Mode de paiement
                </label>
                <select
                  name="mode_paiement"
                  value={formData.mode_paiement}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                  disabled={submitting}
                >
                  <option value="">Sélectionner un mode</option>
                  {MODE_PAIEMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pièce jointe */}
              <div>
                <label className="label text-sm font-medium text-gray-700">
                  Pièce jointe
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="file-input file-input-bordered w-full"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    disabled={submitting}
                  />
                  {filePreview && !file && (
                    <span className="text-sm text-green-600 flex items-center gap-1 whitespace-nowrap">
                      <CheckCircle className="w-4 h-4" /> Fichier existant
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-xs mt-1">
                  PDF, JPG, PNG, DOC (max 2 Mo)
                </p>
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
                  placeholder="Notes supplémentaires…"
                  disabled={submitting}
                />
              </div>
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
              className="btn btn-error gap-2 min-w-[180px] text-white"
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

export default DepenseForm;