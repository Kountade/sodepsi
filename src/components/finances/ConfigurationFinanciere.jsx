// src/components/finances/ConfigurationFinanciere.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Save, Loader2, Settings, AlertCircle, CheckCircle,
  DollarSign, Calendar, Percent, RefreshCw, X,
  Cog, Shield, Clock, TrendingUp, TrendingDown
} from 'lucide-react';

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const ConfigurationFinanciere = () => {
  // ==========================================================
  // HOOKS
  // ==========================================================
  const navigate = useNavigate();

  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  const [config, setConfig] = useState(null);
  const [formData, setFormData] = useState({
    devise: 'XOF',
    devise_symbole: 'CFA',
    exercice_debut: '',
    exercice_fin: '',
    taxe_default: 18,
    arrondi: 0,
    auto_validation: false,
    budget_alerte: 80
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
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await AxiosInstance.get('/configuration-financiere/', {
        headers: { 'Authorization': `Token ${token}` }
      });

      if (response.data && response.data.length > 0) {
        const data = response.data[0];
        setConfig(data);
        setFormData({
          devise: data.devise || 'XOF',
          devise_symbole: data.devise_symbole || 'CFA',
          exercice_debut: data.exercice_debut || '',
          exercice_fin: data.exercice_fin || '',
          taxe_default: data.taxe_default || 18,
          arrondi: data.arrondi || 0,
          auto_validation: data.auto_validation || false,
          budget_alerte: data.budget_alerte || 80
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement de la configuration', 'error');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ==========================================================
  // EFFETS
  // ==========================================================
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // ==========================================================
  // GESTIONNAIRES
  // ==========================================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.devise) newErrors.devise = 'La devise est requise';
    if (!formData.exercice_debut) newErrors.exercice_debut = 'La date de début d\'exercice est requise';
    if (!formData.exercice_fin) newErrors.exercice_fin = 'La date de fin d\'exercice est requise';
    if (formData.exercice_debut && formData.exercice_fin && formData.exercice_debut > formData.exercice_fin) {
      newErrors.exercice_fin = 'La date de fin doit être postérieure à la date de début';
    }
    if (formData.taxe_default < 0 || formData.taxe_default > 100) {
      newErrors.taxe_default = 'Le taux de TVA doit être entre 0 et 100';
    }
    if (formData.budget_alerte < 0 || formData.budget_alerte > 100) {
      newErrors.budget_alerte = 'Le seuil d\'alerte doit être entre 0 et 100';
    }
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
        taxe_default: parseFloat(formData.taxe_default),
        budget_alerte: parseFloat(formData.budget_alerte),
        arrondi: parseInt(formData.arrondi) || 0
      };

      if (config) {
        await AxiosInstance.put(`/configuration-financiere/${config.id}/`, dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
        showNotification('Configuration mise à jour avec succès', 'success');
      } else {
        await AxiosInstance.post('/configuration-financiere/', dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
        showNotification('Configuration créée avec succès', 'success');
      }

      setTimeout(() => fetchConfig(), 500);

    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors de l\'enregistrement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================================
  // RENDU : CHARGEMENT
  // ==========================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 w-full">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-14 h-14 mx-auto" />
          <p className="text-lg font-medium text-gray-500">Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDU : COMPOSANT PRINCIPAL - FULL WIDTH
  // ==========================================================
  return (
    <div className="w-full min-h-screen bg-gray-50">

      {/* ======================================================
          NOTIFICATION
          ====================================================== */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
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
      <div className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Settings className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Configuration financière
              </h1>
              <p className="text-sm text-gray-500">Paramètres financiers de l'entreprise</p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          FORMULAIRE - FULL WIDTH
          ====================================================== */}
      <div className="w-full px-6 py-6">
        <form onSubmit={handleSubmit} className="w-full">

          <div className="w-full bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3.5 border-b border-gray-200">
              <h3 className="font-semibold flex items-center gap-2 text-gray-700">
                <Cog className="w-5 h-5 text-primary" />
                Paramètres généraux
              </h3>
            </div>
            <div className="w-full p-6 space-y-4">

              {/* Devise et Symbole */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Devise <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="devise"
                      value={formData.devise}
                      onChange={handleChange}
                      className={`input input-bordered w-full pl-9 ${errors.devise ? 'input-error' : ''}`}
                      placeholder="Ex: XOF"
                      maxLength="3"
                    />
                  </div>
                  {errors.devise && <p className="text-red-500 text-xs mt-1">{errors.devise}</p>}
                </div>
                <div>
                  <label className="label text-sm font-medium text-gray-700">Symbole devise</label>
                  <input
                    type="text"
                    name="devise_symbole"
                    value={formData.devise_symbole}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    placeholder="Ex: CFA"
                  />
                </div>
              </div>

              {/* Dates d'exercice */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Début d'exercice <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      name="exercice_debut"
                      value={formData.exercice_debut}
                      onChange={handleChange}
                      className={`input input-bordered w-full pl-9 ${errors.exercice_debut ? 'input-error' : ''}`}
                    />
                  </div>
                  {errors.exercice_debut && <p className="text-red-500 text-xs mt-1">{errors.exercice_debut}</p>}
                </div>
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Fin d'exercice <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      name="exercice_fin"
                      value={formData.exercice_fin}
                      onChange={handleChange}
                      className={`input input-bordered w-full pl-9 ${errors.exercice_fin ? 'input-error' : ''}`}
                    />
                  </div>
                  {errors.exercice_fin && <p className="text-red-500 text-xs mt-1">{errors.exercice_fin}</p>}
                </div>
              </div>

              {/* TVA, Arrondi et Alerte */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    TVA par défaut (%) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Percent className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="taxe_default"
                      value={formData.taxe_default}
                      onChange={handleChange}
                      className={`input input-bordered w-full pl-9 ${errors.taxe_default ? 'input-error' : ''}`}
                      min="0"
                      max="100"
                      step="0.5"
                    />
                  </div>
                  {errors.taxe_default && <p className="text-red-500 text-xs mt-1">{errors.taxe_default}</p>}
                </div>
                <div>
                  <label className="label text-sm font-medium text-gray-700">Arrondi (décimales)</label>
                  <input
                    type="number"
                    name="arrondi"
                    value={formData.arrondi}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    min="0"
                    max="2"
                  />
                </div>
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Seuil d'alerte budget (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="budget_alerte"
                    value={formData.budget_alerte}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.budget_alerte ? 'input-error' : ''}`}
                    min="0"
                    max="100"
                  />
                  {errors.budget_alerte && <p className="text-red-500 text-xs mt-1">{errors.budget_alerte}</p>}
                </div>
              </div>

              {/* Auto-validation */}
              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="auto_validation"
                    checked={formData.auto_validation}
                    onChange={handleChange}
                    className="checkbox checkbox-primary"
                  />
                  <span className="text-sm text-gray-700">Validation automatique des écritures</span>
                </label>
              </div>

              {/* Information */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-700 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Informations :</strong> La TVA par défaut sera appliquée automatiquement sur les nouvelles écritures.
                    Le seuil d'alerte déclenchera des notifications lorsque l'utilisation du budget dépasse ce pourcentage.
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* ======================================================
              BOUTONS
              ====================================================== */}
          <div className="w-full mt-6 flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate('/dashboard-finances')}
              className="btn btn-ghost gap-2"
              disabled={submitting}
            >
              <X className="w-5 h-5" /> Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2 min-w-[200px]"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {submitting ? 'Enregistrement...' : 'Enregistrer la configuration'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ConfigurationFinanciere;