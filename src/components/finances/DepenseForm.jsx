// src/components/finances/DepenseForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, TrendingDown, Loader2,
  CheckCircle, AlertCircle, Upload, Building2,
  Calendar, FileText, Plus, Trash2
} from 'lucide-react';

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const DepenseForm = () => {
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
  const [fournisseurs, setFournisseurs] = useState([]);
  const [comptes, setComptes] = useState([]);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
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
  const fetchFournisseurs = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await AxiosInstance.get('/fournisseurs/', {
        headers: { 'Authorization': `Token ${token}` },
        params: { is_active: 'true' }
      });
      setFournisseurs(response.data || []);
    } catch (error) {
      console.error('Erreur chargement fournisseurs:', error);
    }
  }, []);

  const fetchComptes = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await AxiosInstance.get('/comptes-comptables/', {
        headers: { 'Authorization': `Token ${token}` },
        params: { is_active: 'true', type: 'charges' }
      });
      setComptes(response.data || []);
    } catch (error) {
      console.error('Erreur chargement comptes:', error);
    }
  }, []);

  const fetchDepense = useCallback(async () => {
    if (!isEdit) return;

    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await AxiosInstance.get(`/depenses/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
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
        notes: data.notes || ''
      });
      if (data.piece_jointe) {
        setFilePreview(data.piece_jointe);
      }
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
    fetchFournisseurs();
    fetchComptes();
    if (isEdit) fetchDepense();
  }, [fetchFournisseurs, fetchComptes, fetchDepense, isEdit]);

  // ==========================================================
  // GESTIONNAIRES
  // ==========================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showNotification('Le fichier est trop volumineux (max 2 Mo)', 'error');
      return;
    }

    setFile(file);
    setFilePreview(URL.createObjectURL(file));
  };

  const handleSupplierChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      supplier_id: value,
      supplier_name: value ? '' : prev.supplier_name
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.date_depense) newErrors.date_depense = 'La date est requise';
    if (!formData.description) newErrors.description = 'La description est requise';
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

      const dataToSend = new FormData();
      dataToSend.append('categorie', formData.categorie);
      dataToSend.append('description', formData.description);
      dataToSend.append('montant', parseFloat(formData.montant));
      dataToSend.append('taxe', parseFloat(formData.taxe) || 0);
      dataToSend.append('date_depense', formData.date_depense);
      if (formData.date_echeance) dataToSend.append('date_echeance', formData.date_echeance);
      if (formData.mode_paiement) dataToSend.append('mode_paiement', formData.mode_paiement);
      if (formData.supplier_id) dataToSend.append('supplier_id', formData.supplier_id);
      if (formData.supplier_name) dataToSend.append('supplier_name', formData.supplier_name);
      if (formData.notes) dataToSend.append('notes', formData.notes);
      if (file) dataToSend.append('piece_jointe', file);

      if (isEdit) {
        await AxiosInstance.put(`/depenses/${id}/`, dataToSend, {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        showNotification('Dépense modifiée avec succès', 'success');
      } else {
        await AxiosInstance.post('/depenses/', dataToSend, {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        showNotification('Dépense créée avec succès', 'success');
      }

      setTimeout(() => navigate('/depenses'), 1500);

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
  const categorieOptions = [
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
    { value: 'autre', label: 'Autre' }
  ];

  const modePaiementOptions = [
    { value: 'cash', label: 'Espèces' },
    { value: 'card', label: 'Carte bancaire' },
    { value: 'check', label: 'Chèque' },
    { value: 'transfer', label: 'Virement bancaire' },
    { value: 'mobile_money', label: 'Mobile Money' }
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
          EN-TÊTE - FULL WIDTH
          ====================================================== */}
      <div className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/depenses')}
                className="btn btn-ghost btn-sm gap-2"
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
                      {isEdit ? 'Modifiez les informations de la dépense' : 'Enregistrez une nouvelle dépense'}
                    </p>
                  </div>
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
                <FileText className="w-5 h-5 text-error" />
                Informations de la dépense
              </h3>
            </div>
            <div className="w-full p-6 space-y-4">

              {/* Catégorie et Date - 2 colonnes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Catégorie <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="categorie"
                    value={formData.categorie}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    {categorieOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                    className={`input input-bordered w-full ${errors.date_depense ? 'input-error' : ''}`}
                  />
                  {errors.date_depense && <p className="text-red-500 text-xs mt-1">{errors.date_depense}</p>}
                </div>
              </div>

              {/* Description - Pleine largeur */}
              <div>
                <label className="label text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={`textarea textarea-bordered w-full min-h-[80px] ${errors.description ? 'textarea-error' : ''}`}
                  placeholder="Description de la dépense..."
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>

              {/* Montant, Taxe et Échéance - 3 colonnes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
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
                  {formData.montant && !errors.montant && parseFloat(formData.montant) > 0 && (
                    <p className="text-green-600 text-xs mt-1">
                      {formatCurrency(parseFloat(formData.montant))}
                    </p>
                  )}
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

              {/* Fournisseur - 2 colonnes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div>
                  <label className="label text-sm font-medium text-gray-700">Fournisseur</label>
                  <select
                    name="supplier_id"
                    value={formData.supplier_id}
                    onChange={handleSupplierChange}
                    className="select select-bordered w-full"
                  >
                    <option value="">Sélectionner un fournisseur</option>
                    {fournisseurs.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.code} - {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-sm font-medium text-gray-700">Nom du fournisseur</label>
                  <input
                    type="text"
                    name="supplier_name"
                    value={formData.supplier_name}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    placeholder="Nom du fournisseur"
                    disabled={!!formData.supplier_id}
                  />
                </div>
              </div>

              {/* Mode de paiement - Pleine largeur */}
              <div>
                <label className="label text-sm font-medium text-gray-700">Mode de paiement</label>
                <select
                  name="mode_paiement"
                  value={formData.mode_paiement}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                >
                  <option value="">Sélectionner un mode</option>
                  {modePaiementOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Pièce jointe - Pleine largeur */}
              <div>
                <label className="label text-sm font-medium text-gray-700">Pièce jointe</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="file-input file-input-bordered w-full"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                  </div>
                  {filePreview && !file && (
                    <span className="text-sm text-green-600 flex items-center gap-1 whitespace-nowrap">
                      <CheckCircle className="w-4 h-4" /> Fichier existant
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-xs mt-1">PDF, JPG, PNG, DOC (max 2 Mo)</p>
              </div>

              {/* Notes - Pleine largeur */}
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

          {/* ======================================================
              BOUTONS - FULL WIDTH
              ====================================================== */}
          <div className="w-full mt-6 flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate('/depenses')}
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
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isEdit ? 'Modifier' : 'Créer'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default DepenseForm;