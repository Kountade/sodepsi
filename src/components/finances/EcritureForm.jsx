// src/components/finances/EcritureForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, FileText, Loader2,
  CheckCircle, AlertCircle, Calendar
} from 'lucide-react';

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const EcritureForm = () => {
  // ==========================================================
  // HOOKS
  // ==========================================================
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [comptes, setComptes] = useState([]);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  const [formData, setFormData] = useState({
    date_ecriture: new Date().toISOString().split('T')[0],
    date_echeance: '',
    compte_debit: '',
    compte_credit: '',
    montant: '',
    taxe: 0,
    reference: '',
    type: 'autre',
    description: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});

  // ==========================================================
  // FONCTIONS UTILITAIRES
  // ==========================================================
  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // ==========================================================
  // REQUÊTES API
  // ==========================================================
  const fetchComptes = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await AxiosInstance.get('/comptes-comptables/', {
        headers: { 'Authorization': `Token ${token}` },
        params: { is_active: 'true' }
      });
      setComptes(response.data);
    } catch (error) {
      console.error('Erreur chargement comptes:', error);
    }
  }, []);

  const fetchEcriture = useCallback(async () => {
    if (!isEdit) return;

    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await AxiosInstance.get(`/ecritures-comptables/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      const data = response.data;
      setFormData({
        date_ecriture: data.date_ecriture || '',
        date_echeance: data.date_echeance || '',
        compte_debit: data.compte_debit || '',
        compte_credit: data.compte_credit || '',
        montant: data.montant || '',
        taxe: data.taxe || 0,
        reference: data.reference || '',
        type: data.type || 'autre',
        description: data.description || '',
        notes: data.notes || ''
      });
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, isEdit, navigate]);

  // ==========================================================
  // EFFETS
  // ==========================================================
  useEffect(() => {
    fetchComptes();
    if (isEdit) fetchEcriture();
  }, [fetchComptes, fetchEcriture, isEdit]);

  // ==========================================================
  // GESTIONNAIRES
  // ==========================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.date_ecriture) newErrors.date_ecriture = 'La date est requise';
    if (!formData.compte_debit) newErrors.compte_debit = 'Le compte débit est requis';
    if (!formData.compte_credit) newErrors.compte_credit = 'Le compte crédit est requis';
    if (formData.compte_debit === formData.compte_credit) {
      newErrors.compte_credit = 'Les comptes doivent être différents';
    }
    if (!formData.montant || parseFloat(formData.montant) <= 0) {
      newErrors.montant = 'Le montant doit être supérieur à 0';
    }
    if (!formData.description) newErrors.description = 'La description est requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==========================================================
  // SOUMISSION
  // ==========================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

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
        montant: parseFloat(formData.montant),
        taxe: parseFloat(formData.taxe) || 0
      };

      if (isEdit) {
        await AxiosInstance.put(`/ecritures-comptables/${id}/`, dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
        showNotification('Écriture modifiée avec succès', 'success');
      } else {
        await AxiosInstance.post('/ecritures-comptables/', dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
        showNotification('Écriture créée avec succès', 'success');
      }

      setTimeout(() => navigate('/ecritures-comptables'), 1500);

    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors de l\'enregistrement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================================
  // OPTIONS
  // ==========================================================
  const typeOptions = [
    { value: 'vente', label: 'Vente' },
    { value: 'achat', label: 'Achat' },
    { value: 'paiement_client', label: 'Paiement client' },
    { value: 'paiement_fournisseur', label: 'Paiement fournisseur' },
    { value: 'recette', label: 'Recette' },
    { value: 'depense', label: 'Dépense' },
    { value: 'tresorerie', label: 'Trésorerie' },
    { value: 'regularisation', label: 'Régularisation' },
    { value: 'autre', label: 'Autre' }
  ];

  // ==========================================================
  // RENDU : CHARGEMENT
  // ==========================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-14 h-14 mx-auto" />
          <p className="text-lg font-medium text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDU : COMPOSANT PRINCIPAL
  // ==========================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">

      {/* ======================================================
          NOTIFICATION
          ====================================================== */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================
          EN-TÊTE
          ====================================================== */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/ecritures-comptables')}
              className="btn btn-ghost btn-sm gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <FileText className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-primary">
                    {isEdit ? 'Modifier l\'écriture' : 'Nouvelle écriture comptable'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isEdit ? 'Modifiez les informations de l\'écriture' : 'Enregistrez une nouvelle écriture comptable'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          FORMULAIRE
          ====================================================== */}
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3.5 border-b border-gray-200">
              <h3 className="font-semibold flex items-center gap-2 text-gray-700">
                <FileText className="w-5 h-5 text-primary" />
                Informations de l'écriture
              </h3>
            </div>
            <div className="p-6 space-y-4">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Date d'écriture <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date_ecriture"
                    value={formData.date_ecriture}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.date_ecriture ? 'input-error' : ''}`}
                  />
                  {errors.date_ecriture && <p className="text-red-500 text-xs mt-1">{errors.date_ecriture}</p>}
                </div>
                <div>
                  <label className="label text-sm font-medium text-gray-700">Date d'échéance</label>
                  <input
                    type="date"
                    name="date_echeance"
                    value={formData.date_echeance}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Compte débit <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="compte_debit"
                    value={formData.compte_debit}
                    onChange={handleChange}
                    className={`select select-bordered w-full ${errors.compte_debit ? 'select-error' : ''}`}
                  >
                    <option value="">Sélectionner un compte</option>
                    {comptes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.numero} - {c.nom}
                      </option>
                    ))}
                  </select>
                  {errors.compte_debit && <p className="text-red-500 text-xs mt-1">{errors.compte_debit}</p>}
                </div>
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Compte crédit <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="compte_credit"
                    value={formData.compte_credit}
                    onChange={handleChange}
                    className={`select select-bordered w-full ${errors.compte_credit ? 'select-error' : ''}`}
                  >
                    <option value="">Sélectionner un compte</option>
                    {comptes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.numero} - {c.nom}
                      </option>
                    ))}
                  </select>
                  {errors.compte_credit && <p className="text-red-500 text-xs mt-1">{errors.compte_credit}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Montant <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="montant"
                    value={formData.montant}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.montant ? 'input-error' : ''}`}
                    placeholder="0"
                    step="100"
                  />
                  {errors.montant && <p className="text-red-500 text-xs mt-1">{errors.montant}</p>}
                </div>
                <div>
                  <label className="label text-sm font-medium text-gray-700">Taxe (FCFA)</label>
                  <input
                    type="number"
                    name="taxe"
                    value={formData.taxe}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    placeholder="0"
                    step="100"
                  />
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
                  >
                    {typeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label text-sm font-medium text-gray-700">Référence</label>
                <input
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Référence externe..."
                />
              </div>

              <div>
                <label className="label text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={`textarea textarea-bordered w-full min-h-[80px] ${errors.description ? 'textarea-error' : ''}`}
                  placeholder="Description de l'écriture..."
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="label text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="textarea textarea-bordered w-full min-h-[60px]"
                  placeholder="Notes supplémentaires..."
                />
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate('/ecritures-comptables')}
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
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isEdit ? 'Modifier' : 'Créer'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EcritureForm;