// src/components/tresorerie/CompteBancaireForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, AlertCircle, CheckCircle,
  Building2, Banknote, User, DollarSign,
  CreditCard, Hash, Loader2, Layers, Calendar
} from 'lucide-react';

const CompteBancaireForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    banque: '',
    code: '',
    nom: '',
    type_compte: 'courant',
    warehouse: '',
    numero_compte: '',
    iban: '',
    bic: '',
    devise: 'XOF',
    solde_initial: '0',
    is_active: true,
    is_default: false,
    date_ouverture: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [errors, setErrors] = useState({});

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Générer un code automatique
  const generateCompteCode = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/comptes-bancaires/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      const comptes = response.data || [];
      const count = comptes.length + 1;
      return `CPT-${String(count).padStart(4, '0')}`;
    } catch {
      return `CPT-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    }
  };

  // Charger les entrepôts
  const fetchWarehouses = async () => {
    setLoadingWarehouses(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/warehouses/?is_active=true', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setWarehouses(response.data || []);
    } catch (error) {
      console.error('Erreur chargement entrepôts:', error);
      showNotification('Erreur de chargement des entrepôts', 'error');
    } finally {
      setLoadingWarehouses(false);
    }
  };

  // Charger le compte en édition
  const fetchCompte = async () => {
    if (!isEdit) {
      const code = await generateCompteCode();
      setFormData(prev => ({ ...prev, code }));
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/comptes-bancaires/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = response.data;
      setFormData({
        banque: data.banque || '',
        code: data.code || '',
        nom: data.nom || '',
        type_compte: data.type_compte || 'courant',
        warehouse: data.warehouse || '',
        numero_compte: data.numero_compte || '',
        iban: data.iban || '',
        bic: data.bic || '',
        devise: data.devise || 'XOF',
        solde_initial: data.solde_initial || '0',
        is_active: data.is_active !== undefined ? data.is_active : true,
        is_default: data.is_default || false,
        date_ouverture: data.date_ouverture || new Date().toISOString().split('T')[0],
        description: data.description || ''
      });
    } catch (error) {
      console.error('Erreur chargement compte:', error);
      showNotification('Erreur de chargement des données', 'error');
      setTimeout(() => navigate('/comptes-bancaires'), 2000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchCompte();
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
    if (!formData.banque.trim()) newErrors.banque = 'La banque est requise';
    if (!formData.code.trim()) newErrors.code = 'Le code est requis';
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.warehouse) newErrors.warehouse = "L'entrepôt est requis";
    if (!formData.numero_compte.trim()) newErrors.numero_compte = 'Le numéro de compte est requis';

    const soldeInitial = parseFloat(formData.solde_initial) || 0;
    if (soldeInitial < 0) newErrors.solde_initial = 'Le solde initial ne peut pas être négatif';

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
        solde_initial: parseFloat(formData.solde_initial) || 0,
      };

      const url = isEdit ? `/comptes-bancaires/${id}/` : '/comptes-bancaires/';
      const method = isEdit ? 'put' : 'post';

      const response = await AxiosInstance[method](url, dataToSend, {
        headers: { 'Authorization': `Token ${token}` }
      });

      showNotification(
        isEdit ? 'Compte modifié avec succès' : 'Compte créé avec succès',
        'success'
      );

      setTimeout(() => {
        navigate(`/comptes-bancaires/${response.data.id}`);
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

  const typeOptions = [
    { value: 'courant', label: 'Compte courant' },
    { value: 'epargne', label: 'Compte épargne' },
    { value: 'bloque', label: 'Compte bloqué' }
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

      {/* Header */}
      <div className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/comptes-bancaires')} className="btn btn-ghost btn-sm gap-2">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/15 rounded-xl">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {isEdit ? 'Modifier le compte bancaire' : 'Nouveau compte bancaire'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isEdit ? 'Modifiez les informations du compte' : 'Créez un nouveau compte bancaire'}
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
                    Code <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.code ? 'input-error' : ''}`}
                    readOnly={isEdit}
                  />
                  {errors.code && <p className="text-error text-xs mt-1">{errors.code}</p>}
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Banque <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="banque"
                    value={formData.banque}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.banque ? 'input-error' : ''}`}
                    placeholder="Ex: Société Générale"
                  />
                  {errors.banque && <p className="text-error text-xs mt-1">{errors.banque}</p>}
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Nom du compte <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.nom ? 'input-error' : ''}`}
                    placeholder="Ex: Compte Principal"
                  />
                  {errors.nom && <p className="text-error text-xs mt-1">{errors.nom}</p>}
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Type de compte <span className="text-error">*</span>
                  </label>
                  <select
                    name="type_compte"
                    value={formData.type_compte}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    {typeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
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
                    disabled={loadingWarehouses}
                  >
                    <option value="">Sélectionner un entrepôt</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                  {errors.warehouse && <p className="text-error text-xs mt-1">{errors.warehouse}</p>}
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Devise
                  </label>
                  <select
                    name="devise"
                    value={formData.devise}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    <option value="XOF">FCFA (XOF)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="USD">Dollar (USD)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 : Détails bancaires */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" /> Détails bancaires
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Numéro de compte <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="numero_compte"
                    value={formData.numero_compte}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.numero_compte ? 'input-error' : ''}`}
                    placeholder="Numéro de compte"
                  />
                  {errors.numero_compte && <p className="text-error text-xs mt-1">{errors.numero_compte}</p>}
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    IBAN
                  </label>
                  <input
                    type="text"
                    name="iban"
                    value={formData.iban}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    placeholder="IBAN (si disponible)"
                  />
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    BIC / SWIFT
                  </label>
                  <input
                    type="text"
                    name="bic"
                    value={formData.bic}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    placeholder="BIC/SWIFT"
                  />
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Date d'ouverture
                  </label>
                  <input
                    type="date"
                    name="date_ouverture"
                    value={formData.date_ouverture}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 : Solde et options */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> Solde et options
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Solde initial
                  </label>
                  <input
                    type="number"
                    name="solde_initial"
                    value={formData.solde_initial}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.solde_initial ? 'input-error' : ''}`}
                    placeholder="0"
                    step="100"
                  />
                  {errors.solde_initial && <p className="text-error text-xs mt-1">{errors.solde_initial}</p>}
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="checkbox checkbox-primary"
                  />
                  <label className="text-sm font-medium text-gray-700">Compte actif</label>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleChange}
                    className="checkbox checkbox-primary"
                  />
                  <label className="text-sm font-medium text-gray-700">Compte par défaut</label>
                </div>
              </div>

              <div className="mt-4">
                <label className="label text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="textarea textarea-bordered w-full min-h-[80px]"
                  placeholder="Description du compte..."
                />
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate('/comptes-bancaires')}
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

export default CompteBancaireForm;