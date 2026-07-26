// src/components/tresorerie/FraisForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, AlertCircle, CheckCircle,
  Receipt, Building2, User, DollarSign,
  Calendar, Hash, Loader2, CreditCard,
  FileText, Info, Layers, Tag
} from 'lucide-react';

const FraisForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [formData, setFormData] = useState({
    reference: '',
    titre: '',
    warehouse: '',
    categorie: 'autre',
    montant: '0',
    date_frais: new Date().toISOString().split('T')[0],
    date_paiement: '',
    beneficiaire: '',
    piece_justificative: '',
    mode_paiement: 'especes',
    supplier: '',
    status: 'brouillon',
    notes: ''
  });
  const [errors, setErrors] = useState({});

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Génération automatique de la référence (comme le backend)
  const generateReference = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/frais/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      const frais = response.data || [];
      const month = new Date().toISOString().slice(0, 7).replace('-', '');
      const filtered = frais.filter(f => f.reference && f.reference.startsWith('FRAIS' + month));
      const maxNum = filtered.reduce((max, f) => {
        const num = parseInt(f.reference.replace('FRAIS' + month, ''), 10);
        return num > max ? num : max;
      }, 0);
      const nextNum = maxNum + 1;
      return `FRAIS${month}${String(nextNum).padStart(4, '0')}`;
    } catch {
      const month = new Date().toISOString().slice(0, 7).replace('-', '');
      return `FRAIS${month}0001`;
    }
  };

  // Charger les entrepôts
  const fetchWarehouses = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/warehouses/?is_active=true', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setWarehouses(response.data || []);
    } catch (error) {
      console.error('Erreur chargement entrepôts:', error);
    }
  };

  // Charger les fournisseurs (optionnels)
  const fetchSuppliers = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/fournisseurs/?limit=50', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setSuppliers(response.data || []);
    } catch (error) {
      console.error('Erreur chargement fournisseurs:', error);
    }
  };

  // Charger les données du frais en édition
  const fetchFrais = async () => {
    if (!isEdit) {
      // Générer la référence pour un nouveau frais
      const ref = await generateReference();
      setFormData(prev => ({ ...prev, reference: ref }));
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/frais/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = response.data;
      setFormData({
        reference: data.reference || '',
        titre: data.titre || '',
        warehouse: data.warehouse || '',
        categorie: data.categorie || 'autre',
        montant: data.montant || '0',
        date_frais: data.date_frais || new Date().toISOString().split('T')[0],
        date_paiement: data.date_paiement || '',
        beneficiaire: data.beneficiaire || '',
        piece_justificative: data.piece_justificative || '',
        mode_paiement: data.mode_paiement || 'especes',
        supplier: data.supplier || '',
        status: data.status || 'brouillon',
        notes: data.notes || ''
      });
    } catch (error) {
      console.error('Erreur chargement frais:', error);
      showNotification('Erreur de chargement des données', 'error');
      setTimeout(() => navigate('/frais'), 2000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchSuppliers();
    fetchFrais();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.titre.trim()) newErrors.titre = 'Le titre est requis';
    if (!formData.warehouse) newErrors.warehouse = "L'entrepôt est requis";
    if (!formData.categorie) newErrors.categorie = 'La catégorie est requise';
    if (!formData.montant || parseFloat(formData.montant) <= 0) {
      newErrors.montant = 'Le montant doit être supérieur à 0';
    }
    if (!formData.beneficiaire.trim()) newErrors.beneficiaire = 'Le bénéficiaire est requis';
    if (!formData.date_frais) newErrors.date_frais = 'La date du frais est requise';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      showNotification('Veuillez corriger les erreurs', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const token = getToken();
      const dataToSend = {
        ...formData,
        montant: parseFloat(formData.montant) || 0,
        supplier: formData.supplier || null,
        date_paiement: formData.date_paiement || null,
      };

      const url = isEdit ? `/frais/${id}/` : '/frais/';
      const method = isEdit ? 'put' : 'post';

      const response = await AxiosInstance[method](url, dataToSend, {
        headers: { 'Authorization': `Token ${token}` }
      });

      showNotification(
        isEdit ? 'Frais modifié avec succès' : 'Frais créé avec succès',
        'success'
      );

      setTimeout(() => {
        navigate(`/frais/${response.data.id}`);
      }, 1500);

    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.data) {
        const backendErrors = error.response.data;
        const newErrors = {};
        Object.keys(backendErrors).forEach(key => {
          newErrors[key] = Array.isArray(backendErrors[key])
            ? backendErrors[key][0]
            : backendErrors[key];
        });
        setErrors(newErrors);
        showNotification('Erreur lors de l\'enregistrement', 'error');
      } else {
        showNotification('Erreur réseau', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Options pour les sélecteurs
  const categorieOptions = [
    { value: 'transport', label: 'Transport' },
    { value: 'restauration', label: 'Restauration' },
    { value: 'fournitures', label: 'Fournitures de bureau' },
    { value: 'communication', label: 'Communication' },
    { value: 'entretien', label: 'Entretien' },
    { value: 'formation', label: 'Formation' },
    { value: 'mission', label: 'Mission' },
    { value: 'representations', label: 'Représentation' },
    { value: 'assurances', label: 'Assurances' },
    { value: 'impots', label: 'Impôts et taxes' },
    { value: 'loyer', label: 'Loyer' },
    { value: 'services', label: 'Services' },
    { value: 'fournisseur', label: 'Paiement fournisseur' },
    { value: 'autre', label: 'Autre' }
  ];

  const modeOptions = [
    { value: 'especes', label: 'Espèces' },
    { value: 'carte', label: 'Carte bancaire' },
    { value: 'cheque', label: 'Chèque' },
    { value: 'virement', label: 'Virement' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'prelevement', label: 'Prélèvement' },
    { value: 'autre', label: 'Autre' }
  ];

  const statusOptions = [
    { value: 'brouillon', label: 'Brouillon' },
    { value: 'en_attente', label: 'En attente de validation' },
    { value: 'valide', label: 'Validé' },
    { value: 'paye', label: 'Payé' },
    { value: 'refuse', label: 'Refusé' },
    { value: 'annule', label: 'Annulé' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification(null)}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/frais')} className="btn btn-ghost btn-sm gap-2">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/15 rounded-xl">
                  <Receipt className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {isEdit ? 'Modifier le frais' : 'Nouveau frais'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isEdit ? 'Modifiez les informations du frais' : 'Enregistrez une nouvelle dépense'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Section 1 : Informations générales */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> Informations générales
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Référence */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Référence <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="reference"
                    value={formData.reference}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    readOnly
                  />
                </div>

                {/* Titre */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Titre <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="titre"
                    value={formData.titre}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.titre ? 'input-error' : ''}`}
                    placeholder="Ex: Achat fournitures bureau"
                  />
                  {errors.titre && <p className="text-error text-xs mt-1">{errors.titre}</p>}
                </div>

                {/* Catégorie */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Catégorie <span className="text-error">*</span>
                  </label>
                  <select
                    name="categorie"
                    value={formData.categorie}
                    onChange={handleChange}
                    className={`select select-bordered w-full ${errors.categorie ? 'select-error' : ''}`}
                  >
                    {categorieOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {errors.categorie && <p className="text-error text-xs mt-1">{errors.categorie}</p>}
                </div>

                {/* Entrepôt */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Entrepôt <span className="text-error">*</span>
                  </label>
                  <select
                    name="warehouse"
                    value={formData.warehouse}
                    onChange={handleChange}
                    className={`select select-bordered w-full ${errors.warehouse ? 'select-error' : ''}`}
                  >
                    <option value="">Sélectionner</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                  {errors.warehouse && <p className="text-error text-xs mt-1">{errors.warehouse}</p>}
                </div>

                {/* Bénéficiaire */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Bénéficiaire <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="beneficiaire"
                    value={formData.beneficiaire}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.beneficiaire ? 'input-error' : ''}`}
                    placeholder="Nom du bénéficiaire"
                  />
                  {errors.beneficiaire && <p className="text-error text-xs mt-1">{errors.beneficiaire}</p>}
                </div>

                {/* Fournisseur (optionnel) */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Fournisseur (optionnel)
                  </label>
                  <select
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    <option value="">Aucun</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 : Montant et paiement */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> Montant et paiement
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Montant */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Montant <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    name="montant"
                    value={formData.montant}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.montant ? 'input-error' : ''}`}
                    placeholder="0"
                    step="100"
                    min="0"
                  />
                  {errors.montant && <p className="text-error text-xs mt-1">{errors.montant}</p>}
                </div>

                {/* Mode de paiement */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Mode de paiement
                  </label>
                  <select
                    name="mode_paiement"
                    value={formData.mode_paiement}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    {modeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Statut */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Statut
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 : Dates et justificatif */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Dates et justificatif
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date du frais */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Date du frais <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    name="date_frais"
                    value={formData.date_frais}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.date_frais ? 'input-error' : ''}`}
                  />
                  {errors.date_frais && <p className="text-error text-xs mt-1">{errors.date_frais}</p>}
                </div>

                {/* Date de paiement */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Date de paiement
                  </label>
                  <input
                    type="date"
                    name="date_paiement"
                    value={formData.date_paiement}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                  />
                </div>

                {/* Pièce justificative */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Pièce justificative
                  </label>
                  <input
                    type="text"
                    name="piece_justificative"
                    value={formData.piece_justificative}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    placeholder="N° de pièce"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 : Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Notes
              </h3>
            </div>
            <div className="p-6">
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="textarea textarea-bordered w-full min-h-[80px]"
                placeholder="Informations complémentaires..."
              />
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate('/frais')}
              className="btn btn-ghost gap-2"
              disabled={submitting}
            >
              <X className="w-4 h-4" /> Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isEdit ? 'Modifier' : 'Créer'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default FraisForm;