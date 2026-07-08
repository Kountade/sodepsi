// src/components/clients/ClientForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, AlertCircle, CheckCircle,
  User, Building2, Phone, Mail, MapPin,
  CreditCard, FileText, Loader2, Users,
  Star, Globe, Award
} from 'lucide-react';

const ClientForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    commercial_name: '',
    type: 'particulier',
    contact_person: '',
    phone: '',
    mobile: '',
    email: '',
    website: '',
    address: '',
    city: '',
    country: 'Sénégal',
    postal_code: '',
    tax_id: '',
    registration_number: '',
    payment_terms: 'cash',
    credit_limit: 0,
    statut: 'actif',
    is_favorite: false,
    notes: ''
  });
  const [errors, setErrors] = useState({});

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const generateClientCode = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/clients/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      const clients = response.data || [];
      const count = clients.length + 1;
      return `CLT-${String(count).padStart(4, '0')}`;
    } catch {
      return `CLT-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    }
  };

  const fetchClient = async () => {
    if (!isEdit) {
      const code = await generateClientCode();
      setFormData(prev => ({ ...prev, code }));
      return;
    }
    
    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/clients/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      const data = response.data;
      setFormData({
        code: data.code || '',
        name: data.name || '',
        commercial_name: data.commercial_name || '',
        type: data.type || 'particulier',
        contact_person: data.contact_person || '',
        phone: data.phone || '',
        mobile: data.mobile || '',
        email: data.email || '',
        website: data.website || '',
        address: data.address || '',
        city: data.city || '',
        country: data.country || 'Sénégal',
        postal_code: data.postal_code || '',
        tax_id: data.tax_id || '',
        registration_number: data.registration_number || '',
        payment_terms: data.payment_terms || 'cash',
        credit_limit: data.credit_limit || 0,
        statut: data.statut || 'actif',
        is_favorite: data.is_favorite || false,
        notes: data.notes || ''
      });
    } catch (error) {
      console.error('Erreur chargement client:', error);
      showNotification('Erreur de chargement des données', 'error');
      setTimeout(() => navigate('/clients'), 2000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
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
    if (!formData.code.trim()) newErrors.code = 'Le code est requis';
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.phone.trim()) newErrors.phone = 'Le téléphone est requis';
    if (!formData.email.trim()) newErrors.email = 'L\'email est requis';
    if (!formData.address.trim()) newErrors.address = 'L\'adresse est requise';
    if (!formData.city.trim()) newErrors.city = 'La ville est requise';
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    
    if (formData.credit_limit < 0) {
      newErrors.credit_limit = 'La limite de crédit ne peut pas être négative';
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
      const url = isEdit ? `/clients/${id}/` : '/clients/';
      const method = isEdit ? 'put' : 'post';
      
      const response = await AxiosInstance[method](url, formData, {
        headers: { 'Authorization': `Token ${token}` }
      });

      showNotification(
        isEdit ? 'Client modifié avec succès' : 'Client créé avec succès',
        'success'
      );

      setTimeout(() => {
        navigate(`/clients/${response.data.id}`);
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
              <button onClick={() => navigate('/clients')} className="btn btn-ghost btn-sm gap-2">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/15 rounded-xl">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {isEdit ? 'Modifier le client' : 'Nouveau client'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isEdit ? 'Modifiez les informations du client' : 'Créez un nouveau client'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire - 100% largeur avec 3 colonnes */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Informations générales - 3 colonnes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Informations générales
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Code */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Code client <span className="text-error">*</span>
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

                {/* Nom */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Nom / Raison sociale <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                  />
                  {errors.name && <p className="text-error text-xs mt-1">{errors.name}</p>}
                </div>

                {/* Nom commercial */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Nom commercial
                  </label>
                  <input
                    type="text"
                    name="commercial_name"
                    value={formData.commercial_name}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Type <span className="text-error">*</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    <option value="particulier">Particulier</option>
                    <option value="entreprise">Entreprise</option>
                    <option value="revendeur">Revendeur</option>
                    <option value="grossiste">Grossiste</option>
                  </select>
                </div>

                {/* Personne de contact */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Personne de contact
                  </label>
                  <input
                    type="text"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                  />
                </div>

                {/* Statut */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Statut <span className="text-error">*</span>
                  </label>
                  <select
                    name="statut"
                    value={formData.statut}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                    <option value="bloque">Bloqué</option>
                  </select>
                </div>

                {/* Client favori */}
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    name="is_favorite"
                    checked={formData.is_favorite}
                    onChange={handleChange}
                    className="checkbox checkbox-primary"
                  />
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Star className="w-4 h-4 text-warning" /> Client favori
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Contacts - 3 colonnes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" /> Contacts
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Téléphone <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.phone ? 'input-error' : ''}`}
                  />
                  {errors.phone && <p className="text-error text-xs mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Mobile
                  </label>
                  <input
                    type="text"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                  />
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Email <span className="text-error">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
                  />
                  {errors.email && <p className="text-error text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Site web
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Adresse - 3 colonnes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Adresse
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-3">
                  <label className="label text-sm font-medium text-gray-700">
                    Adresse <span className="text-error">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`textarea textarea-bordered w-full ${errors.address ? 'textarea-error' : ''}`}
                    rows="2"
                  />
                  {errors.address && <p className="text-error text-xs mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Ville <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.city ? 'input-error' : ''}`}
                  />
                  {errors.city && <p className="text-error text-xs mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Pays
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                  />
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Code postal
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Informations fiscales - 3 colonnes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Informations fiscales
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    N° Identification fiscale
                  </label>
                  <input
                    type="text"
                    name="tax_id"
                    value={formData.tax_id}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                  />
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    N° Registre de commerce
                  </label>
                  <input
                    type="text"
                    name="registration_number"
                    value={formData.registration_number}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Conditions commerciales - 3 colonnes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" /> Conditions commerciales
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Délai de paiement
                  </label>
                  <select
                    name="payment_terms"
                    value={formData.payment_terms}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    <option value="cash">Comptant</option>
                    <option value="15">15 jours</option>
                    <option value="30">30 jours</option>
                    <option value="45">45 jours</option>
                    <option value="60">60 jours</option>
                  </select>
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Limite de crédit (FCFA)
                  </label>
                  <input
                    type="number"
                    name="credit_limit"
                    value={formData.credit_limit}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.credit_limit ? 'input-error' : ''}`}
                    min="0"
                    step="1000"
                  />
                  {errors.credit_limit && <p className="text-error text-xs mt-1">{errors.credit_limit}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Notes - 3 colonnes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Notes
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Notes supplémentaires..."
                    className="textarea textarea-bordered w-full min-h-[80px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate('/clients')}
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

export default ClientForm;