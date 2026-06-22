// src/components/stock/EntrepotForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Save, X, Warehouse, RefreshCw, ArrowLeft, Building2,
  CheckCircle, AlertCircle, Trash2, Phone, Mail, MapPin,
  User, Percent, Package
} from 'lucide-react';

const EntrepotForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'warehouse',
    address: '',
    city: '',
    country: 'Sénégal',
    phone: '',
    email: '',
    manager: '',
    capacity: '',
    current_occupancy: 0,
    is_active: true,
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

  const loadEntrepot = async () => {
    if (!isEditMode) {
      setFetching(false);
      return;
    }
    
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/warehouses/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = response.data;
      setFormData({
        name: data.name || '',
        code: data.code || '',
        type: data.type || 'warehouse',
        address: data.address || '',
        city: data.city || '',
        country: data.country || 'Sénégal',
        phone: data.phone || '',
        email: data.email || '',
        manager: data.manager || '',
        capacity: data.capacity || '',
        current_occupancy: data.current_occupancy || 0,
        is_active: data.is_active !== undefined ? data.is_active : true,
        notes: data.notes || ''
      });
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Impossible de charger l\'entrepôt', 'error');
      navigate('/entrepots');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadEntrepot();
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
    const prefix = formData.name ? formData.name.substring(0, 3).toUpperCase() : 'WH';
    const randomNum = Math.floor(Math.random() * 1000);
    const code = `${prefix}${randomNum}`;
    setFormData(prev => ({ ...prev, code }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.code.trim()) newErrors.code = 'Le code est requis';
    if (!formData.address.trim()) newErrors.address = 'L\'adresse est requise';
    if (!formData.city.trim()) newErrors.city = 'La ville est requise';
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
      
      const dataToSend = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null
      };
      
      if (isEditMode) {
        await AxiosInstance.patch(`/warehouses/${id}/`, dataToSend, { headers });
        showNotification('Entrepôt modifié avec succès', 'success');
      } else {
        await AxiosInstance.post('/warehouses/', dataToSend, { headers });
        showNotification('Entrepôt créé avec succès', 'success');
      }
      
      setTimeout(() => navigate('/entrepots'), 1500);
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
      await AxiosInstance.delete(`/warehouses/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Entrepôt supprimé avec succès', 'success');
      setTimeout(() => navigate('/entrepots'), 1500);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
    setShowDeleteModal(false);
  };

  const getTypeLabel = () => {
    switch(formData.type) {
      case 'main': return 'Principal';
      case 'secondary': return 'Secondaire';
      case 'store': return 'Magasin';
      default: return 'Entrepôt';
    }
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
      {/* Notification */}
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

      {/* Modal Suppression */}
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
              <p className="text-gray-600">Voulez-vous vraiment supprimer cet entrepôt ?</p>
              <p className="font-semibold text-error mt-2">{formData.name}</p>
              {formData.current_occupancy > 0 && (
                <p className="text-warning text-sm mt-2">⚠️ Stock actuel: {formData.current_occupancy} unités</p>
              )}
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/entrepots')} className="btn btn-ghost btn-sm gap-2">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Warehouse className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">{isEditMode ? 'Modifier' : 'Nouvel'} entrepôt</h1>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {isEditMode ? 'Modifiez les informations de l\'entrepôt' : 'Créez un nouvel entrepôt ou magasin'}
              </p>
            </div>
          </div>
          {isEditMode && (
            <button onClick={() => setShowDeleteModal(true)} className="btn btn-error btn-sm gap-2">
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          )}
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              {/* Type d'entrepôt - Carte d'aperçu */}
              <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Warehouse className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type d'entrepôt</p>
                    <p className="text-xl font-semibold text-primary">{getTypeLabel()}</p>
                  </div>
                </div>
              </div>

              {/* Informations générales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="form-control">
                  <label className="label text-sm font-medium text-gray-700">
                    Nom <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                    placeholder="Ex: Entrepôt Principal"
                  />
                  {errors.name && <span className="text-error text-xs mt-1">{errors.name}</span>}
                </div>

                <div className="form-control">
                  <label className="label text-sm font-medium text-gray-700">
                    Code <span className="text-error">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      className={`input input-bordered flex-1 ${errors.code ? 'input-error' : ''}`}
                      placeholder="Ex: WH001"
                    />
                    <button type="button" onClick={generateCode} className="btn btn-outline gap-2" title="Générer un code">
                      <RefreshCw className="w-4 h-4" /> Auto
                    </button>
                  </div>
                  {errors.code && <span className="text-error text-xs mt-1">{errors.code}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="form-control">
                  <label className="label text-sm font-medium text-gray-700">Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    <option value="main">🏢 Principal</option>
                    <option value="secondary">🏭 Secondaire</option>
                    <option value="store">🏪 Magasin</option>
                    <option value="warehouse">📦 Entrepôt</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label text-sm font-medium text-gray-700">
                    <User className="w-3 h-3 mr-1" /> Responsable
                  </label>
                  <input
                    type="text"
                    name="manager"
                    value={formData.manager}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    placeholder="Nom du responsable"
                  />
                </div>
              </div>

              {/* Adresse */}
              <div className="border-t pt-5">
                <h3 className="text-md font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Adresse
                </h3>
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label text-sm font-medium text-gray-700">
                      Adresse <span className="text-error">*</span>
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={`textarea textarea-bordered w-full ${errors.address ? 'textarea-error' : ''}`}
                      rows="2"
                      placeholder="Adresse complète"
                    />
                    {errors.address && <span className="text-error text-xs mt-1">{errors.address}</span>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label text-sm font-medium text-gray-700">
                        Ville <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className={`input input-bordered w-full ${errors.city ? 'input-error' : ''}`}
                        placeholder="Ex: Dakar"
                      />
                      {errors.city && <span className="text-error text-xs mt-1">{errors.city}</span>}
                    </div>
                    <div className="form-control">
                      <label className="label text-sm font-medium text-gray-700">Pays</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="input input-bordered w-full"
                        placeholder="Ex: Sénégal"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="border-t pt-5">
                <h3 className="text-md font-semibold mb-4 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" /> Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="form-control">
                    <label className="label text-sm font-medium text-gray-700">Téléphone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="input input-bordered w-full pl-10"
                        placeholder="+221 77 123 45 67"
                      />
                    </div>
                  </div>
                  <div className="form-control">
                    <label className="label text-sm font-medium text-gray-700">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="input input-bordered w-full pl-10"
                        placeholder="contact@entrepot.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Capacité et occupation */}
              <div className="border-t pt-5">
                <h3 className="text-md font-semibold mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" /> Capacité et occupation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="form-control">
                    <label className="label text-sm font-medium text-gray-700">
                      Capacité maximale
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                      placeholder="Laissez vide pour illimité"
                    />
                    <p className="text-xs text-gray-400 mt-1">Nombre maximum d'unités</p>
                  </div>
                  <div className="form-control">
                    <label className="label text-sm font-medium text-gray-700">
                      Occupation actuelle
                    </label>
                    <input
                      type="number"
                      name="current_occupancy"
                      value={formData.current_occupancy}
                      onChange={handleChange}
                      className="input input-bordered w-full bg-gray-100"
                      readOnly={!isEditMode}
                    />
                    <p className="text-xs text-gray-400 mt-1">Mis à jour automatiquement</p>
                  </div>
                </div>
              </div>

              {/* Statut et notes */}
              <div className="border-t pt-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="checkbox checkbox-primary"
                      />
                      <span className="text-sm font-medium">Entrepôt actif</span>
                    </label>
                    <p className="text-xs text-gray-400 ml-8">Les entrepôts inactifs ne seront pas disponibles</p>
                  </div>
                </div>

                <div className="form-control mt-4">
                  <label className="label text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="textarea textarea-bordered w-full"
                    rows="3"
                    placeholder="Informations supplémentaires..."
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t">
              <button type="button" onClick={() => navigate('/entrepots')} className="btn btn-ghost gap-2 px-6" disabled={loading}>
                <X className="w-4 h-4" /> Annuler
              </button>
              <button type="submit" className="btn btn-primary gap-2 px-8 min-w-[140px]" disabled={loading}>
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <><Save className="w-4 h-4" /> {isEditMode ? 'Enregistrer' : 'Créer'}</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Information supplémentaire */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="p-1 bg-blue-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-800">Information</p>
              <p className="text-xs text-blue-600 mt-1">
                L'occupation actuelle est automatiquement calculée en fonction des stocks présents dans l'entrepôt.
                La capacité maximale vous permet de définir une limite de stockage.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntrepotForm;