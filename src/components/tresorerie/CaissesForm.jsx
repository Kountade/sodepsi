// src/components/tresorerie/CaissesForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, AlertCircle, CheckCircle,
  Banknote, Building2, User, DollarSign,
  AlertTriangle, Shield, Layers, Hash, Loader2
} from 'lucide-react';

const CaissesForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [users, setUsers] = useState([]);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    type_caisse: 'principale',
    warehouse: '',
    responsable: '',
    solde_initial: 0,
    seuil_min: 0,
    seuil_max: 0,
    devise: 'XOF',
    is_active: true,
    is_default: false,
    description: ''
  });
  const [errors, setErrors] = useState({});

  const getToken = () => localStorage.getItem('Token');
  const getUser = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Charger les utilisateurs avec gestion d'erreur
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = getToken();
      // Essayer plusieurs endpoints possibles
      let response;
      try {
        response = await AxiosInstance.get('/users/?is_active=true', {
          headers: { 'Authorization': `Token ${token}` }
        });
        setUsers(response.data || []);
      } catch (e) {
        console.warn('Endpoint /users/ non disponible, utilisation de l\'utilisateur connecté');
        // Fallback: utiliser l'utilisateur connecté uniquement
        const user = getUser();
        if (user) {
          setUsers([user]);
        } else {
          setUsers([]);
        }
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
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

  // Générer un code automatique en création
  const generateCaisseCode = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/caisses/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      const caisses = response.data || [];
      const count = caisses.length + 1;
      return `CAISSE-${String(count).padStart(4, '0')}`;
    } catch {
      return `CAISSE-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    }
  };

  // Charger la caisse en édition
  const fetchCaisse = async () => {
    if (!isEdit) {
      const code = await generateCaisseCode();
      setFormData(prev => ({ ...prev, code }));
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/caisses/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      const data = response.data;
      setFormData({
        code: data.code || '',
        nom: data.nom || '',
        type_caisse: data.type_caisse || 'principale',
        warehouse: data.warehouse || '',
        responsable: data.responsable || '',
        solde_initial: data.solde_initial || 0,
        seuil_min: data.seuil_min || 0,
        seuil_max: data.seuil_max || 0,
        devise: data.devise || 'XOF',
        is_active: data.is_active !== undefined ? data.is_active : true,
        is_default: data.is_default || false,
        description: data.description || ''
      });
    } catch (error) {
      console.error('Erreur chargement caisse:', error);
      showNotification('Erreur de chargement des données', 'error');
      setTimeout(() => navigate('/caisses'), 2000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchUsers();
    fetchCaisse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? (value === '' ? '' : parseFloat(value) || 0) : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.code || !formData.code.trim()) {
      newErrors.code = 'Le code est requis';
    }
    
    if (!formData.nom || !formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }
    
    if (!formData.warehouse) {
      newErrors.warehouse = "L'entrepôt est requis";
    }

    const soldeInitial = parseFloat(formData.solde_initial) || 0;
    if (soldeInitial < 0) {
      newErrors.solde_initial = 'Le solde initial ne peut pas être négatif';
    }

    const seuilMin = parseFloat(formData.seuil_min) || 0;
    const seuilMax = parseFloat(formData.seuil_max) || 0;
    if (seuilMin < 0) {
      newErrors.seuil_min = 'Le seuil minimum ne peut pas être négatif';
    }
    if (seuilMax < 0) {
      newErrors.seuil_max = 'Le seuil maximum ne peut pas être négatif';
    }
    if (seuilMin > seuilMax && seuilMax > 0) {
      newErrors.seuil_min = 'Le seuil minimum ne peut pas être supérieur au maximum';
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
      const user = getUser();
      
      // Préparer les données à envoyer
      const dataToSend = {
        code: formData.code.trim(),
        nom: formData.nom.trim(),
        type_caisse: formData.type_caisse,
        warehouse: parseInt(formData.warehouse),
        responsable: formData.responsable ? parseInt(formData.responsable) : null,
        solde_initial: parseFloat(formData.solde_initial) || 0,
        seuil_min: parseFloat(formData.seuil_min) || 0,
        seuil_max: parseFloat(formData.seuil_max) || 0,
        devise: formData.devise,
        is_active: formData.is_active,
        is_default: formData.is_default,
        description: formData.description || '',
      };

      // Ajouter created_by si disponible
      if (user && user.id) {
        dataToSend.created_by = user.id;
      }

      console.log('Données envoyées:', dataToSend);

      const url = isEdit ? `/caisses/${id}/` : '/caisses/';
      const method = isEdit ? 'put' : 'post';

      const response = await AxiosInstance[method](url, dataToSend, {
        headers: { 'Authorization': `Token ${token}` }
      });

      showNotification(
        isEdit ? 'Caisse modifiée avec succès' : 'Caisse créée avec succès',
        'success'
      );

      setTimeout(() => {
        navigate(`/caisses/${response.data.id}`);
      }, 1500);

    } catch (error) {
      console.error('Erreur complète:', error);
      console.error('Response data:', error.response?.data);
      
      if (error.response?.data) {
        const backendErrors = error.response.data;
        const newErrors = {};
        
        if (typeof backendErrors === 'string') {
          showNotification(backendErrors, 'error');
        } else if (Array.isArray(backendErrors)) {
          backendErrors.forEach(err => {
            if (typeof err === 'string') {
              showNotification(err, 'error');
            }
          });
        } else {
          Object.keys(backendErrors).forEach(key => {
            const value = backendErrors[key];
            if (Array.isArray(value)) {
              newErrors[key] = value[0];
            } else if (typeof value === 'string') {
              newErrors[key] = value;
            } else if (typeof value === 'object' && value !== null) {
              Object.keys(value).forEach(subKey => {
                const subValue = value[subKey];
                if (Array.isArray(subValue)) {
                  newErrors[`${key}.${subKey}`] = subValue[0];
                } else if (typeof subValue === 'string') {
                  newErrors[`${key}.${subKey}`] = subValue;
                }
              });
            }
          });
        }
        
        setErrors(newErrors);
        showNotification('Erreur lors de l\'enregistrement', 'error');
      } else {
        showNotification('Erreur de connexion au serveur', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const typeOptions = [
    { value: 'principale', label: 'Principale' },
    { value: 'secondaire', label: 'Secondaire' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'virtuelle', label: 'Virtuelle' }
  ];

  const deviseOptions = [
    { value: 'XOF', label: 'FCFA (XOF)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'USD', label: 'Dollar (USD)' }
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
              <button 
                onClick={() => navigate('/caisses')} 
                className="btn btn-ghost btn-sm gap-2"
                disabled={submitting}
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/15 rounded-xl">
                  <Banknote className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {isEdit ? 'Modifier la caisse' : 'Nouvelle caisse'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isEdit ? 'Modifiez les informations de la caisse' : 'Créez une nouvelle caisse'}
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

          {/* SECTION : Informations générales */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> Informations générales
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Code */}
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
                    disabled={submitting}
                  />
                  {errors.code && <p className="text-error text-xs mt-1">{errors.code}</p>}
                </div>

                {/* Nom */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Nom <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.nom ? 'input-error' : ''}`}
                    disabled={submitting}
                    placeholder="Nom de la caisse"
                  />
                  {errors.nom && <p className="text-error text-xs mt-1">{errors.nom}</p>}
                </div>

                {/* Type */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Type <span className="text-error">*</span>
                  </label>
                  <select
                    name="type_caisse"
                    value={formData.type_caisse}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                    disabled={submitting}
                  >
                    {typeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
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
                    disabled={loadingWarehouses || submitting}
                  >
                    <option value="">Sélectionner un entrepôt</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                  {errors.warehouse && <p className="text-error text-xs mt-1">{errors.warehouse}</p>}
                </div>

                {/* Responsable */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Responsable
                  </label>
                  <select
                    name="responsable"
                    value={formData.responsable}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                    disabled={loadingUsers || submitting}
                  >
                    <option value="">Sélectionner un responsable</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username} {user.first_name && `(${user.first_name} ${user.last_name})`}
                      </option>
                    ))}
                  </select>
                  {errors.responsable && <p className="text-error text-xs mt-1">{errors.responsable}</p>}
                </div>

                {/* Devise */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Devise
                  </label>
                  <select
                    name="devise"
                    value={formData.devise}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                    disabled={submitting}
                  >
                    {deviseOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION : Paramètres financiers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> Paramètres financiers
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Solde initial */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Solde initial
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <DollarSign className="w-4 h-4" />
                    </span>
                    <input
                      type="number"
                      name="solde_initial"
                      value={formData.solde_initial}
                      onChange={handleChange}
                      className={`input input-bordered w-full pl-9 ${errors.solde_initial ? 'input-error' : ''}`}
                      placeholder="0"
                      step="100"
                      min="0"
                      disabled={submitting}
                    />
                  </div>
                  {errors.solde_initial && <p className="text-error text-xs mt-1">{errors.solde_initial}</p>}
                </div>

                {/* Seuil minimum */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Seuil minimum (alerte)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <input
                      type="number"
                      name="seuil_min"
                      value={formData.seuil_min}
                      onChange={handleChange}
                      className={`input input-bordered w-full pl-9 ${errors.seuil_min ? 'input-error' : ''}`}
                      placeholder="0"
                      step="100"
                      min="0"
                      disabled={submitting}
                    />
                  </div>
                  {errors.seuil_min && <p className="text-error text-xs mt-1">{errors.seuil_min}</p>}
                </div>

                {/* Seuil maximum */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Seuil maximum (plafond)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Shield className="w-4 h-4" />
                    </span>
                    <input
                      type="number"
                      name="seuil_max"
                      value={formData.seuil_max}
                      onChange={handleChange}
                      className={`input input-bordered w-full pl-9 ${errors.seuil_max ? 'input-error' : ''}`}
                      placeholder="0"
                      step="100"
                      min="0"
                      disabled={submitting}
                    />
                  </div>
                  {errors.seuil_max && <p className="text-error text-xs mt-1">{errors.seuil_max}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION : Options et description */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Hash className="w-4 h-4 text-primary" /> Options
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="checkbox checkbox-primary"
                    disabled={submitting}
                  />
                  <label className="text-sm font-medium text-gray-700">Caisse active</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleChange}
                    className="checkbox checkbox-primary"
                    disabled={submitting}
                  />
                  <label className="text-sm font-medium text-gray-700">Caisse par défaut</label>
                </div>
              </div>

              <div>
                <label className="label text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="textarea textarea-bordered w-full min-h-[80px]"
                  placeholder="Description de la caisse..."
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate('/caisses')}
              className="btn btn-ghost gap-2"
              disabled={submitting}
            >
              <X className="w-4 h-4" /> Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2 min-w-[120px]"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEdit ? 'Modifier' : 'Créer'}
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CaissesForm;