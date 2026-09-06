// src/components/finances/BudgetForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, Wallet, Loader2,
  CheckCircle, AlertCircle, Plus, Trash2,
  Calendar, PiggyBank, TrendingUp, TrendingDown
} from 'lucide-react';

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const BudgetForm = () => {
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
  const [categories, setCategories] = useState([]);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  const [lignes, setLignes] = useState([]);
  const [formData, setFormData] = useState({
    nom: '',
    type: 'annuel',
    montant_total: '',
    date_debut: '',
    date_fin: '',
    statut: 'en_cours',
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

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 FCFA';
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  // ==========================================================
  // REQUÊTES API
  // ==========================================================
  const fetchCategories = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await AxiosInstance.get('/budget-categories/', {
        headers: { 'Authorization': `Token ${token}` },
        params: { is_active: 'true' }
      });
      setCategories(response.data || []);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    }
  }, []);

  const fetchBudget = useCallback(async () => {
    if (!isEdit) return;

    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await AxiosInstance.get(`/budgets/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      const data = response.data;
      setFormData({
        nom: data.nom || '',
        type: data.type || 'annuel',
        montant_total: data.montant_total || '',
        date_debut: data.date_debut || '',
        date_fin: data.date_fin || '',
        statut: data.statut || 'en_cours',
        notes: data.notes || ''
      });
      setLignes(data.lignes || []);
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
    fetchCategories();
    if (isEdit) fetchBudget();
  }, [fetchCategories, fetchBudget, isEdit]);

  // ==========================================================
  // GESTIONNAIRES
  // ==========================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nom) newErrors.nom = 'Le nom est requis';
    if (!formData.date_debut) newErrors.date_debut = 'La date de début est requise';
    if (!formData.date_fin) newErrors.date_fin = 'La date de fin est requise';
    if (formData.date_debut && formData.date_fin && formData.date_debut > formData.date_fin) {
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
        montant_total: parseFloat(formData.montant_total),
        lignes: lignes.map(l => ({
          ...l,
          montant_prevu: parseFloat(l.montant_prevu) || 0
        }))
      };

      if (isEdit) {
        await AxiosInstance.put(`/budgets/${id}/`, dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
        showNotification('Budget modifié avec succès', 'success');
      } else {
        await AxiosInstance.post('/budgets/', dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
        showNotification('Budget créé avec succès', 'success');
      }

      setTimeout(() => navigate('/budgets'), 1500);

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
    { value: 'annuel', label: 'Annuel' },
    { value: 'trimestriel', label: 'Trimestriel' },
    { value: 'mensuel', label: 'Mensuel' },
    { value: 'projet', label: 'Projet' }
  ];

  const statutOptions = [
    { value: 'en_cours', label: 'En cours' },
    { value: 'termine', label: 'Terminé' },
    { value: 'annule', label: 'Annulé' }
  ];

  // ==========================================================
  // RENDU : CHARGEMENT
  // ==========================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 w-full">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-14 h-14 mx-auto" />
          <p className="text-lg font-medium text-gray-500">Chargement...</p>
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
            <button
              onClick={() => navigate('/budgets')}
              className="btn btn-ghost btn-sm gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-xl">
                  <Wallet className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-green-600">
                    {isEdit ? 'Modifier le budget' : 'Nouveau budget'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isEdit ? 'Modifiez les informations du budget' : 'Créez un nouveau budget'}
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

          <div className="w-full bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3.5 border-b border-gray-200">
              <h3 className="font-semibold flex items-center gap-2 text-gray-700">
                <Wallet className="w-5 h-5 text-green-600" />
                Informations du budget
              </h3>
            </div>
            <div className="w-full p-6 space-y-4">

              {/* Nom et Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.nom ? 'input-error' : ''}`}
                    placeholder="Ex: Budget 2024"
                  />
                  {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
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

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Date début <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date_debut"
                    value={formData.date_debut}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.date_debut ? 'input-error' : ''}`}
                  />
                  {errors.date_debut && <p className="text-red-500 text-xs mt-1">{errors.date_debut}</p>}
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
                    className={`input input-bordered w-full ${errors.date_fin ? 'input-error' : ''}`}
                  />
                  {errors.date_fin && <p className="text-red-500 text-xs mt-1">{errors.date_fin}</p>}
                </div>
              </div>

              {/* Montant total et Statut */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Montant total <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="montant_total"
                    value={formData.montant_total}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.montant_total ? 'input-error' : ''}`}
                    placeholder="0"
                    step="1000"
                  />
                  {errors.montant_total && <p className="text-red-500 text-xs mt-1">{errors.montant_total}</p>}
                  {formData.montant_total && !errors.montant_total && parseFloat(formData.montant_total) > 0 && (
                    <p className="text-green-600 text-xs mt-1">
                      {formatCurrency(parseFloat(formData.montant_total))}
                    </p>
                  )}
                </div>
                <div>
                  <label className="label text-sm font-medium text-gray-700">Statut</label>
                  <select
                    name="statut"
                    value={formData.statut}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    {statutOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="label text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="textarea textarea-bordered w-full min-h-[60px]"
                  placeholder="Informations supplémentaires..."
                />
              </div>
            </div>
          </div>

          {/* ======================================================
              LIGNES BUDGÉTAIRES
              ====================================================== */}
          <div className="w-full mt-6 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3.5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2 text-gray-700">
                <Plus className="w-5 h-5 text-primary" />
                Lignes budgétaires
              </h3>
              <button
                type="button"
                onClick={addLigne}
                className="btn btn-sm btn-primary gap-1"
              >
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>
            <div className="w-full p-4 space-y-3">
              {lignes.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>Aucune ligne budgétaire</p>
                  <button
                    type="button"
                    onClick={addLigne}
                    className="btn btn-ghost btn-sm gap-1 mt-2"
                  >
                    <Plus className="w-4 h-4" /> Ajouter une ligne
                  </button>
                </div>
              ) : (
                lignes.map((ligne, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <label className="label text-xs font-medium text-gray-600">Catégorie</label>
                      <select
                        value={ligne.categorie}
                        onChange={(e) => handleLigneChange(index, 'categorie', e.target.value)}
                        className="select select-bordered w-full select-sm"
                      >
                        <option value="">Sélectionner</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.code} - {c.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label text-xs font-medium text-gray-600">Montant prévu</label>
                      <input
                        type="number"
                        value={ligne.montant_prevu}
                        onChange={(e) => handleLigneChange(index, 'montant_prevu', e.target.value)}
                        className="input input-bordered w-full input-sm"
                        placeholder="0"
                        step="1000"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeLigne(index)}
                        className="btn btn-ghost btn-sm btn-circle text-error"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ======================================================
              BOUTONS
              ====================================================== */}
          <div className="w-full mt-6 flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate('/budgets')}
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
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isEdit ? 'Modifier' : 'Créer'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default BudgetForm;