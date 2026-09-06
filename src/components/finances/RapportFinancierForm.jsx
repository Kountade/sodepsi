// src/components/finances/RapportFinancierForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, FilePieChart, Loader2,
  CheckCircle, AlertCircle, Calendar, FileText,
  FileSpreadsheet, TrendingUp, TrendingDown, Wallet,
  BarChart3, PieChart, Building2, ShoppingBag
} from 'lucide-react';

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const RapportFinancierForm = () => {
  // ==========================================================
  // HOOKS
  // ==========================================================
  const navigate = useNavigate();

  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  const [formData, setFormData] = useState({
    type: 'bilan',
    nom: '',
    date_debut: '',
    date_fin: '',
    format: 'pdf'
  });
  const [errors, setErrors] = useState({});
  const [generated, setGenerated] = useState(false);

  // ==========================================================
  // FONCTIONS UTILITAIRES
  // ==========================================================
  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  // ==========================================================
  // GESTIONNAIRES
  // ==========================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.type) newErrors.type = 'Le type de rapport est requis';
    if (!formData.nom) newErrors.nom = 'Le nom est requis';
    if (!formData.date_debut) newErrors.date_debut = 'La date de début est requise';
    if (!formData.date_fin) newErrors.date_fin = 'La date de fin est requise';
    if (formData.date_debut && formData.date_fin && formData.date_debut > formData.date_fin) {
      newErrors.date_fin = 'La date de fin doit être postérieure à la date de début';
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

      const response = await AxiosInstance.post('/rapports-financiers/', formData, {
        headers: { 'Authorization': `Token ${token}` }
      });

      showNotification('Rapport généré avec succès', 'success');
      setGenerated(true);

      // Redirection après 2 secondes
      setTimeout(() => {
        navigate('/rapports-financiers');
      }, 2000);

    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors de la génération du rapport', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================================
  // OPTIONS
  // ==========================================================
  const typeOptions = [
    { value: 'bilan', label: 'Bilan comptable', icon: BarChart3, color: 'text-primary' },
    { value: 'compte_resultat', label: 'Compte de résultat', icon: TrendingUp, color: 'text-success' },
    { value: 'tresorerie', label: 'Tableau de trésorerie', icon: Wallet, color: 'text-info' },
    { value: 'budget', label: 'Suivi budgétaire', icon: PieChart, color: 'text-warning' },
    { value: 'ventes', label: 'Rapport de ventes', icon: TrendingUp, color: 'text-secondary' },
    { value: 'depenses', label: 'Rapport de dépenses', icon: TrendingDown, color: 'text-error' },
    { value: 'achats', label: 'Rapport d\'achats', icon: ShoppingBag, color: 'text-ghost' },
    { value: 'client', label: 'Rapport client', icon: Building2, color: 'text-info' },
    { value: 'fournisseur', label: 'Rapport fournisseur', icon: Building2, color: 'text-warning' }
  ];

  const formatOptions = [
    { value: 'pdf', label: 'PDF', icon: FileText },
    { value: 'excel', label: 'Excel', icon: FileSpreadsheet }
  ];

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
            <button
              onClick={() => navigate('/rapports-financiers')}
              className="btn btn-ghost btn-sm gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-xl">
                  <FilePieChart className="w-7 h-7 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-purple-600">
                    Générer un rapport
                  </h1>
                  <p className="text-sm text-gray-500">
                    Créez un rapport financier personnalisé
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          FORMULAIRE - FULL WIDTH
          ====================================================== */}
      <div className="w-full px-6 py-6">
        <form onSubmit={handleSubmit} className="w-full">

          {generated && (
            <div className="w-full mb-6 p-4 bg-green-50 rounded-xl border border-green-200 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className="text-green-700 font-medium">Rapport généré avec succès ! Redirection en cours...</span>
            </div>
          )}

          <div className="w-full bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3.5 border-b border-gray-200">
              <h3 className="font-semibold flex items-center gap-2 text-gray-700">
                <FilePieChart className="w-5 h-5 text-purple-600" />
                Informations du rapport
              </h3>
            </div>
            <div className="w-full p-6 space-y-4">

              {/* Type de rapport */}
              <div>
                <label className="label text-sm font-medium text-gray-700">
                  Type de rapport <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {typeOptions.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.type === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                        className={`
                          flex items-center gap-2 p-2.5 rounded-lg border-2 text-sm font-medium transition-all
                          ${isSelected
                            ? `border-purple-500 bg-purple-50 ${type.color}`
                            : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                          }
                        `}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? type.color : 'text-gray-400'}`} />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
              </div>

              {/* Nom */}
              <div>
                <label className="label text-sm font-medium text-gray-700">
                  Nom du rapport <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  className={`input input-bordered w-full ${errors.nom ? 'input-error' : ''}`}
                  placeholder="Ex: Bilan 2024 - Décembre"
                />
                {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Date début <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      name="date_debut"
                      value={formData.date_debut}
                      onChange={handleChange}
                      className={`input input-bordered w-full pl-9 ${errors.date_debut ? 'input-error' : ''}`}
                    />
                  </div>
                  {errors.date_debut && <p className="text-red-500 text-xs mt-1">{errors.date_debut}</p>}
                </div>
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Date fin <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      name="date_fin"
                      value={formData.date_fin}
                      onChange={handleChange}
                      className={`input input-bordered w-full pl-9 ${errors.date_fin ? 'input-error' : ''}`}
                    />
                  </div>
                  {errors.date_fin && <p className="text-red-500 text-xs mt-1">{errors.date_fin}</p>}
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="label text-sm font-medium text-gray-700">
                  Format <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {formatOptions.map((format) => {
                    const Icon = format.icon;
                    const isSelected = formData.format === format.value;
                    return (
                      <button
                        key={format.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, format: format.value }))}
                        className={`
                          flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all
                          ${isSelected
                            ? 'border-purple-500 bg-purple-50 text-purple-600'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                          }
                        `}
                      >
                        <Icon className="w-4 h-4" />
                        {format.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Information */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-700 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Information :</strong> Le rapport sera généré selon les critères sélectionnés.
                    Les données seront extraites de la période définie.
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
              onClick={() => navigate('/rapports-financiers')}
              className="btn btn-ghost gap-2"
              disabled={submitting}
            >
              <X className="w-5 h-5" /> Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2 min-w-[200px]"
              disabled={submitting || generated}
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FilePieChart className="w-5 h-5" />}
              {submitting ? 'Génération en cours...' : 'Générer le rapport'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default RapportFinancierForm;