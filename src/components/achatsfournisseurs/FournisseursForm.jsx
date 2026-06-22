// src/components/achats/FournisseursForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Save, X, Truck, RefreshCw, ArrowLeft, Building2,
  Phone, Mail, MapPin, User, Star, Globe,
  CheckCircle, AlertCircle, Trash2
} from 'lucide-react';

const FournisseursForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    commercial_name: '',
    type: 'local',
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
    payment_terms: '30',
    delivery_lead_time: 7,
    minimum_order: 0,
    is_active: true,
    is_preferred: false,
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const loadFournisseur = async () => {
    if (!isEditMode) {
      setFetching(false);
      return;
    }
    
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/suppliers/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = response.data;
      setFormData({
        code: data.code || '',
        name: data.name || '',
        commercial_name: data.commercial_name || '',
        type: data.type || 'local',
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
        payment_terms: data.payment_terms || '30',
        delivery_lead_time: data.delivery_lead_time || 7,
        minimum_order: data.minimum_order || 0,
        is_active: data.is_active !== undefined ? data.is_active : true,
        is_preferred: data.is_preferred || false,
        notes: data.notes || ''
      });
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Impossible de charger le fournisseur', 'error');
      navigate('/fournisseurs');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadFournisseur();
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

  const generateCode = () => {
    const prefix = formData.name ? formData.name.substring(0, 3).toUpperCase() : 'SUP';
    const randomNum = Math.floor(Math.random() * 1000);
    const code = `${prefix}${randomNum}`;
    setFormData(prev => ({ ...prev, code }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.code.trim()) newErrors.code = 'Le code est requis';
    if (!formData.phone) newErrors.phone = 'Le téléphone est requis';
    if (!formData.email) newErrors.email = 'L\'email est requis';
    if (!formData.address.trim()) newErrors.address = 'L\'adresse est requise';
    if (!formData.city.trim()) newErrors.city = 'La ville est requise';
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const token = getToken();
      const headers = { 'Authorization': `Token ${token}` };
      
      if (isEditMode) {
        await AxiosInstance.patch(`/suppliers/${id}/`, formData, { headers });
        showNotification('Fournisseur modifié avec succès', 'success');
      } else {
        await AxiosInstance.post('/suppliers/', formData, { headers });
        showNotification('Fournisseur créé avec succès', 'success');
      }
      
      setTimeout(() => navigate('/fournisseurs'), 1500);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.data) {
        setErrors(error.response.data);
        showNotification('Veuillez vérifier les champs', 'error');
      } else {
        showNotification('Une erreur est survenue', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = getToken();
      await AxiosInstance.delete(`/suppliers/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Fournisseur supprimé avec succès', 'success');
      setTimeout(() => navigate('/fournisseurs'), 1500);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
    setShowDeleteModal(false);
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification(prev => ({ ...prev, show: false }))}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer ce fournisseur ?</p>
              <p className="font-semibold text-error mt-2">{formData.name}</p>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button className="btn btn-ghost flex-1" onClick={() => setShowDeleteModal(false)}>Annuler</button>
              <button className="btn btn-error flex-1 gap-2" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/fournisseurs')} className="btn btn-ghost btn-sm gap-2">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Truck className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">{isEditMode ? 'Modifier' : 'Nouveau'} fournisseur</h1>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {isEditMode ? 'Modifiez les informations du fournisseur' : 'Ajoutez un nouveau fournisseur'}
              </p>
            </div>
          </div>
          {isEditMode && (
            <button onClick={() => setShowDeleteModal(true)} className="btn btn-error btn-sm gap-2">
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              {/* Section Identification */}
              <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Identification</p>
                    <p className="text-xl font-semibold text-primary">{formData.name || 'Nouveau fournisseur'}</p>
                  </div>
                </div>
              </div>

              {/* Informations générales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="form-control">
                  <label className="label text-sm font-medium text-gray-700">
                    Nom <span className="text-error">*</span>
                  </label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange}
                    className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                    placeholder="Ex: TechSARL" />
                  {errors.name && <span className="text-error text-xs mt-1">{errors.name}</span>}
                </div>

                <div className="form-control">
                  <label className="label text-sm font-medium text-gray-700">
                    Code <span className="text-error">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input type="text" name="code" value={formData.code} onChange={handleChange}
                      className={`input input-bordered flex-1 ${errors.code ? 'input-error' : ''}`}
                      placeholder="Ex: SUP001" />
                    <button type="button" onClick={generateCode} className="btn btn-outline gap-2">
                      <RefreshCw className="w-4 h-4" /> Auto
                    </button>
                  </div>
                  {errors.code && <span className="text-error text-xs mt-1">{errors.code}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="form-control">
                  <label className="label text-sm font-medium text-gray-700">Nom commercial</label>
                  <input type="text" name="commercial_name" value={formData.commercial_name} onChange={handleChange}
                    className="input input-bordered w-full" placeholder="Nom commercial (optionnel)" />
                </div>

                <div className="form-control">
                  <label className="label text-sm font-medium text-gray-700">Type</label>
                  <select name="type" value={formData.type} onChange={handleChange} className="select select-bordered w-full">
                    <option value="local">🏪 Local</option>
                    <option value="international">🌍 International</option>
                    <option value="importateur">📦 Importateur</option>
                    <option value="distributeur">🚚 Distributeur</option>
                    <option value="fabricant">🏭 Fabricant</option>
                  </select>
                </div>
              </div>

              {/* Contact */}
              <div className="border-t pt-5">
                <h3 className="text-md font-semibold mb-4 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" /> Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="form-control">
                    <label className="label text-sm font-medium text-gray-700">Personne de contact</label>
                    <input type="text" name="contact_person" value={formData.contact_person} onChange={handleChange}
                      className="input input-bordered w-full" placeholder="Nom du contact" />
                  </div>
                  <div className="form-control">
                    <label className="label text-sm font-medium text-gray-700">Téléphone <span className="text-error">*</span></label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange}
                      className={`input input-bordered w-full ${errors.phone ? 'input-error' : ''}`}
                      placeholder="+221 77 123 45 67" />
                    {errors.phone && <span className="text-error text-xs mt-1">{errors.phone}</span>}
                  </div>
                  <div className="form-control">
                    <label className="label text-sm font-medium text-gray-700">Mobile</label>
                    <input type="text" name="mobile" value={formData.mobile} onChange={handleChange}
                      className="input input-bordered w-full" placeholder="+221 78 123 45 67" />
                  </div>
                  <div className="form-control">
                    <label className="label text-sm font-medium text-gray-700">Email <span className="text-error">*</span></label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange}
                      className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
                      placeholder="contact@fournisseur.com" />
                    {errors.email && <span className="text-error text-xs mt-1">{errors.email}</span>}
                  </div>
                  <div className="form-control md:col-span-2">
                    <label className="label text-sm font-medium text-gray-700">Site web</label>
                    <input type="url" name="website" value={formData.website} onChange={handleChange}
                      className="input input-bordered w-full" placeholder="https://www.exemple.com" />
                  </div>
                </div>
              </div>

              {/* Adresse */}
              <div className="border-t pt-5">
                <h3 className="text-md font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Adresse
                </h3>
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label text-sm font-medium text-gray-700">Adresse <span className="text-error">*</span></label>
                    <textarea name="address" value={formData.address} onChange={handleChange}
                      className={`textarea textarea-bordered w-full ${errors.address ? 'textarea-error' : ''}`}
                      rows="2" placeholder="Adresse complète" />
                    {errors.address && <span className="text-error text-xs mt-1">{errors.address}</span>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control">
                      <label className="label text-sm font-medium text-gray-700">Ville <span className="text-error">*</span></label>
                      <input type="text" name="city" value={formData.city} onChange={handleChange}
                        className={`input input-bordered w-full ${errors.city ? 'input-error' : ''}`}
                        placeholder="Dakar" />
                      {errors.city && <span className="text-error text-xs mt-1">{errors.city}</span>}
                    </div>
                    <div className="form-control">
                      <label className="label text-sm font-medium text-gray-700">Pays</label>
                      <input type="text" name="country" value={formData.country} onChange={handleChange}
                        className="input input-bordered w-full" placeholder="Sénégal" />
                    </div>
                    <div className="form-control">
                      <label className="label text-sm font-medium text-gray-700">Code postal</label>
                      <input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange}
                        className="input input-bordered w-full" placeholder="BP 1234" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations commerciales */}
              <div className="border-t pt-5">
                <h3 className="text-md font-semibold mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" /> Conditions commerciales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="form-control">
                    <label className="label text-sm font-medium text-gray-700">Délai de paiement</label>
                    <select name="payment_terms" value={formData.payment_terms} onChange={handleChange} className="select select-bordered w-full">
                      <option value="cash">Comptant</option>
                      <option value="15">15 jours</option>
                      <option value="30">30 jours</option>
                      <option value="45">45 jours</option>
                      <option value="60">60 jours</option>
                      <option value="90">90 jours</option>
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label text-sm font-medium text-gray-700">Délai de livraison (jours)</label>
                    <input type="number" name="delivery_lead_time" value={formData.delivery_lead_time} onChange={handleChange}
                      className="input input-bordered w-full" />
                  </div>
                  <div className="form-control">
                    <label className="label text-sm font-medium text-gray-700">Commande minimum</label>
                    <input type="number" name="minimum_order" value={formData.minimum_order} onChange={handleChange}
                      className="input input-bordered w-full" />
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="border-t pt-5">
                <div className="space-y-3">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input type="checkbox" name="is_preferred" checked={formData.is_preferred} onChange={handleChange}
                      className="checkbox checkbox-warning" />
                    <div>
                      <span className="text-sm font-medium">Fournisseur privilégié</span>
                      <p className="text-xs text-gray-400">Prioritaire dans les commandes</p>
                    </div>
                  </label>
                  <label className="label cursor-pointer justify-start gap-3">
                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange}
                      className="checkbox checkbox-primary" />
                    <div>
                      <span className="text-sm font-medium">Fournisseur actif</span>
                      <p className="text-xs text-gray-400">Les fournisseurs inactifs ne seront pas disponibles</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div className="border-t pt-5">
                <div className="form-control">
                  <label className="label text-sm font-medium text-gray-700">Notes</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange}
                    className="textarea textarea-bordered w-full" rows="3"
                    placeholder="Informations supplémentaires..." />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t">
              <button type="button" onClick={() => navigate('/fournisseurs')} className="btn btn-ghost gap-2 px-6" disabled={loading}>
                <X className="w-4 h-4" /> Annuler
              </button>
              <button type="submit" className="btn btn-primary gap-2 px-8 min-w-[140px]" disabled={loading}>
                {loading ? <span className="loading loading-spinner loading-sm"></span> : <><Save className="w-4 h-4" /> {isEditMode ? 'Enregistrer' : 'Créer'}</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FournisseursForm;