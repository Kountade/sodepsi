// src/components/tresorerie/PrevisionsForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, AlertCircle, CheckCircle,
  Target, Building2, DollarSign, Calendar,
  Hash, Loader2, Layers, Percent,
  TrendingUp, TrendingDown, Clock
} from 'lucide-react';

const PrevisionsForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [warehouses, setWarehouses] = useState([]);

  const [formData, setFormData] = useState({
    reference: '',
    titre: '',
    warehouse: '',
    type_prevision: 'entree',
    periode: 'mensuel',
    montant_prevu: '0',
    montant_reel: '0',
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: '',
    source_type: '',
    source_id: '',
    categorie: '',
    sous_categorie: '',
    statut: 'brouillon',
    probabilite: 50,
    notes: ''
  });
  const [errors, setErrors] = useState({});

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const generateReference = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/previsions/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      const previsions = response.data || [];
      const month = new Date().toISOString().slice(0, 7).replace('-', '');
      const filtered = previsions.filter(p => p.reference && p.reference.startsWith('PREV' + month));
      const maxNum = filtered.reduce((max, p) => {
        const num = parseInt(p.reference.replace('PREV' + month, ''), 10);
        return num > max ? num : max;
      }, 0);
      const nextNum = maxNum + 1;
      return `PREV${month}${String(nextNum).padStart(4, '0')}`;
    } catch {
      const month = new Date().toISOString().slice(0, 7).replace('-', '');
      return `PREV${month}0001`;
    }
  };

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

  const fetchPrevision = async () => {
    if (!isEdit) {
      const ref = await generateReference();
      setFormData(prev => ({ ...prev, reference: ref }));
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/previsions/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = response.data;
      setFormData({
        reference: data.reference || '',
        titre: data.titre || '',
        warehouse: data.warehouse || '',
        type_prevision: data.type_prevision || 'entree',
        periode: data.periode || 'mensuel',
        montant_prevu: data.montant_prevu || '0',
        montant_reel: data.montant_reel || '0',
        date_debut: data.date_debut || new Date().toISOString().split('T')[0],
        date_fin: data.date_fin || '',
        source_type: data.source_type || '',
        source_id: data.source_id || '',
        categorie: data.categorie || '',
        sous_categorie: data.sous_categorie || '',
        statut: data.statut || 'brouillon',
        probabilite: data.probabilite || 50,
        notes: data.notes || ''
      });
    } catch (error) {
      console.error('Erreur chargement prévision:', error);
      showNotification('Erreur de chargement des données', 'error');
      setTimeout(() => navigate('/previsions'), 2000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchPrevision();
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
    if (!formData.type_prevision) newErrors.type_prevision = 'Le type est requis';
    if (!formData.montant_prevu || parseFloat(formData.montant_prevu) <= 0) {
      newErrors.montant_prevu = 'Le montant prévu doit être supérieur à 0';
    }
    if (!formData.date_debut) newErrors.date_debut = 'La date de début est requise';
    if (!formData.date_fin) newErrors.date_fin = 'La date de fin est requise';
    else if (formData.date_fin && formData.date_debut && formData.date_fin < formData.date_debut) {
      newErrors.date_fin = 'La date de fin doit être postérieure à la date de début';
    }
    if (formData.probabilite < 0 || formData.probabilite > 100) {
      newErrors.probabilite = 'La probabilité doit être comprise entre 0 et 100';
    }

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
        montant_prevu: parseFloat(formData.montant_prevu) || 0,
        montant_reel: parseFloat(formData.montant_reel) || 0,
        source_id: formData.source_id || null,
        probabilite: parseInt(formData.probabilite) || 50,
      };

      const url = isEdit ? `/previsions/${id}/` : '/previsions/';
      const method = isEdit ? 'put' : 'post';

      const response = await AxiosInstance[method](url, dataToSend, {
        headers: { 'Authorization': `Token ${token}` }
      });

      showNotification(
        isEdit ? 'Prévision modifiée avec succès' : 'Prévision créée avec succès',
        'success'
      );

      setTimeout(() => {
        navigate(`/previsions/${response.data.id}`);
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

  // Options des sélecteurs
  const typeOptions = [
    { value: 'entree', label: 'Entrée prévue', icon: TrendingUp },
    { value: 'sortie', label: 'Sortie prévue', icon: TrendingDown }
  ];

  const periodeOptions = [
    { value: 'journalier', label: 'Journalier' },
    { value: 'hebdomadaire', label: 'Hebdomadaire' },
    { value: 'mensuel', label: 'Mensuel' },
    { value: 'trimestriel', label: 'Trimestriel' },
    { value: 'annuel', label: 'Annuel' }
  ];

  const statutOptions = [
    { value: 'brouillon', label: 'Brouillon' },
    { value: 'en_cours', label: 'En cours' },
    { value: 'valide', label: 'Validée' },
    { value: 'realise', label: 'Réalisé' },
    { value: 'annule', label: 'Annulé' },
    { value: 'ecart', label: 'Écart constaté' }
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
              <button onClick={() => navigate('/previsions')} className="btn btn-ghost btn-sm gap-2">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/15 rounded-xl">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {isEdit ? 'Modifier la prévision' : 'Nouvelle prévision'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isEdit ? 'Modifiez les informations de la prévision' : 'Planifiez une nouvelle prévision de trésorerie'}
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
                    placeholder="Ex: Prévision mensuelle des encaissements"
                  />
                  {errors.titre && <p className="text-error text-xs mt-1">{errors.titre}</p>}
                </div>

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
              </div>
            </div>
          </div>

          {/* Section 2 : Type et périodicité */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Type et périodicité
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Type de prévision <span className="text-error">*</span>
                  </label>
                  <select
                    name="type_prevision"
                    value={formData.type_prevision}
                    onChange={handleChange}
                    className={`select select-bordered w-full ${errors.type_prevision ? 'select-error' : ''}`}
                  >
                    {typeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {errors.type_prevision && <p className="text-error text-xs mt-1">{errors.type_prevision}</p>}
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Période
                  </label>
                  <select
                    name="periode"
                    value={formData.periode}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    {periodeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Probabilité (%) <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    name="probabilite"
                    value={formData.probabilite}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.probabilite ? 'input-error' : ''}`}
                    min="0"
                    max="100"
                  />
                  {errors.probabilite && <p className="text-error text-xs mt-1">{errors.probabilite}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 : Montants */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> Montants
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Montant prévu <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    name="montant_prevu"
                    value={formData.montant_prevu}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.montant_prevu ? 'input-error' : ''}`}
                    placeholder="0"
                    step="100"
                    min="0"
                  />
                  {errors.montant_prevu && <p className="text-error text-xs mt-1">{errors.montant_prevu}</p>}
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Montant réel (si connu)
                  </label>
                  <input
                    type="number"
                    name="montant_reel"
                    value={formData.montant_reel}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    placeholder="0"
                    step="100"
                    min="0"
                  />
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
                  >
                    {statutOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 : Dates */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Période de prévision
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Date début <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    name="date_debut"
                    value={formData.date_debut}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.date_debut ? 'input-error' : ''}`}
                  />
                  {errors.date_debut && <p className="text-error text-xs mt-1">{errors.date_debut}</p>}
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Date fin <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    name="date_fin"
                    value={formData.date_fin}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.date_fin ? 'input-error' : ''}`}
                  />
                  {errors.date_fin && <p className="text-error text-xs mt-1">{errors.date_fin}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Section 5 : Catégorisation et source */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Hash className="w-4 h-4 text-primary" /> Catégorisation et source
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Catégorie
                  </label>
                  <input
                    type="text"
                    name="categorie"
                    value={formData.categorie}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    placeholder="Ex: Ventes, Achats, Frais..."
                  />
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Sous-catégorie
                  </label>
                  <input
                    type="text"
                    name="sous_categorie"
                    value={formData.sous_categorie}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    placeholder="Ex: Produits alimentaires"
                  />
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Type source
                  </label>
                  <input
                    type="text"
                    name="source_type"
                    value={formData.source_type}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    placeholder="Ex: client, fournisseur..."
                  />
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    ID source (optionnel)
                  </label>
                  <input
                    type="number"
                    name="source_id"
                    value={formData.source_id}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    placeholder="ID de la source"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 6 : Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> Notes
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

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate('/previsions')}
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

export default PrevisionsForm;