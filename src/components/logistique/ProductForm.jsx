// src/components/stock/ProductForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Save, X, Package, RefreshCw, ArrowLeft, Tag, DollarSign,
  CheckCircle, AlertCircle, Layers, Boxes, Clock, AlertTriangle,
  Barcode, Ruler, TrendingUp, TrendingDown, Calendar
} from 'lucide-react';

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    code: '',
    barcode: '',
    name: '',
    description: '',
    category: '',
    unit: '',
    type: 'standard',
    purchase_price: '',
    selling_price: '',
    wholesale_price: '',
    promo_price: '',
    tax_rate: 0,
    has_expiry: false,
    shelf_life_days: '',
    alert_days: 30,
    min_stock: 0,
    max_stock: 0,
    reorder_point: 0,
    reorder_quantity: 0,
    status: 'active',
    is_featured: false
  });
  
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const loadCategories = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/categories/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setCategories(response.data.filter(c => c.is_active));
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    }
  };

  const loadUnits = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/unit-measures/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setUnits(response.data.filter(u => u.is_active));
    } catch (error) {
      console.error('Erreur chargement unités:', error);
    }
  };

  const loadProduct = async () => {
    if (!isEditMode) {
      setFetching(false);
      return;
    }
    
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/products/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const product = response.data;
      setFormData({
        code: product.code || '',
        barcode: product.barcode || '',
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        unit: product.unit || '',
        type: product.type || 'standard',
        purchase_price: product.purchase_price || '',
        selling_price: product.selling_price || '',
        wholesale_price: product.wholesale_price || '',
        promo_price: product.promo_price || '',
        tax_rate: product.tax_rate || 0,
        has_expiry: product.has_expiry || false,
        shelf_life_days: product.shelf_life_days || '',
        alert_days: product.alert_days || 30,
        min_stock: product.min_stock || 0,
        max_stock: product.max_stock || 0,
        reorder_point: product.reorder_point || 0,
        reorder_quantity: product.reorder_quantity || 0,
        status: product.status || 'active',
        is_featured: product.is_featured || false
      });
    } catch (error) {
      console.error('Erreur chargement produit:', error);
      showNotification('Impossible de charger le produit', 'error');
      navigate('/produits');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadCategories();
      await loadUnits();
      await loadProduct();
    };
    init();
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
    const prefix = formData.name ? formData.name.substring(0, 3).toUpperCase() : 'PRD';
    const randomNum = Math.floor(Math.random() * 1000);
    const code = `${prefix}${randomNum}`;
    setFormData(prev => ({ ...prev, code }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.code.trim()) newErrors.code = 'Le code est requis';
    if (!formData.purchase_price) newErrors.purchase_price = 'Le prix d\'achat est requis';
    if (!formData.selling_price) newErrors.selling_price = 'Le prix de vente est requis';
    if (formData.has_expiry && !formData.shelf_life_days) {
      newErrors.shelf_life_days = 'La durée de conservation est requise';
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
      const dataToSend = { ...formData };
      if (!dataToSend.category) dataToSend.category = null;
      if (!dataToSend.unit) dataToSend.unit = null;
      
      const headers = { 'Authorization': `Token ${token}` };
      
      if (isEditMode) {
        await AxiosInstance.patch(`/products/${id}/`, dataToSend, { headers });
        showNotification('Produit modifié avec succès', 'success');
      } else {
        await AxiosInstance.post('/products/', dataToSend, { headers });
        showNotification('Produit créé avec succès', 'success');
      }
      
      setTimeout(() => navigate('/produits'), 1500);
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

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/produits')} className="btn btn-ghost btn-sm gap-2">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">{isEditMode ? 'Modifier le produit' : 'Nouveau produit'}</h1>
              </div>
              <p className="text-sm text-gray-500 mt-1 ml-1">
                {isEditMode ? 'Modifiez les informations du produit' : 'Créez un nouveau produit dans le catalogue'}
              </p>
            </div>
          </div>
          <div className="badge badge-primary badge-lg hidden sm:flex">
            {isEditMode ? 'Édition' : 'Création'}
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* SECTION 1: Informations générales */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-primary/5 to-transparent px-6 py-3 border-b border-gray-200">
                <h3 className="font-semibold flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  Informations générales
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Colonne gauche */}
                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label text-sm font-medium text-gray-700">
                        Nom du produit <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                        placeholder="Ex: Smartphone XYZ Pro"
                      />
                      {errors.name && <span className="text-error text-xs mt-1">{errors.name}</span>}
                    </div>

                    <div className="form-control">
                      <label className="label text-sm font-medium text-gray-700">
                        Code produit <span className="text-error">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="code"
                          value={formData.code}
                          onChange={handleChange}
                          className={`input input-bordered flex-1 ${errors.code ? 'input-error' : ''}`}
                          placeholder="Ex: PRD001"
                        />
                        <button type="button" onClick={generateCode} className="btn btn-outline gap-2" title="Générer un code automatique">
                          <RefreshCw className="w-4 h-4" /> Auto
                        </button>
                      </div>
                      {errors.code && <span className="text-error text-xs mt-1">{errors.code}</span>}
                    </div>

                    <div className="form-control">
                      <label className="label text-sm font-medium text-gray-700">
                        <Barcode className="w-3 h-3 mr-1" /> Code-barres (EAN-13)
                      </label>
                      <input
                        type="text"
                        name="barcode"
                        value={formData.barcode}
                        onChange={handleChange}
                        className="input input-bordered w-full"
                        placeholder="Ex: 1234567890123"
                      />
                    </div>
                  </div>

                  {/* Colonne droite */}
                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label text-sm font-medium text-gray-700">Catégorie</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="select select-bordered w-full"
                      >
                        <option value="">Sélectionner une catégorie</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-control">
                      <label className="label text-sm font-medium text-gray-700">
                        <Ruler className="w-3 h-3 mr-1" /> Unité de mesure
                      </label>
                      <select
                        name="unit"
                        value={formData.unit}
                        onChange={handleChange}
                        className="select select-bordered w-full"
                      >
                        <option value="">Sélectionner une unité</option>
                        {units.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-control">
                      <label className="label text-sm font-medium text-gray-700">Type de produit</label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="select select-bordered w-full"
                      >
                        <option value="standard">📦 Standard</option>
                        <option value="consignable">🔄 Consignable</option>
                        <option value="expirable">⏰ À durée limitée</option>
                        <option value="service">⚙️ Service</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-control mt-4">
                  <label className="label text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="textarea textarea-bordered w-full"
                    rows="3"
                    placeholder="Description détaillée du produit..."
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Prix et stocks */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-primary/5 to-transparent px-6 py-3 border-b border-gray-200">
                <h3 className="font-semibold flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Prix et stocks
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Colonne gauche - Prix */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label text-sm font-medium text-gray-700">
                          Prix d'achat <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">F</span>
                          <input
                            type="number"
                            name="purchase_price"
                            value={formData.purchase_price}
                            onChange={handleChange}
                            className={`input input-bordered w-full pl-8 ${errors.purchase_price ? 'input-error' : ''}`}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div className="form-control">
                        <label className="label text-sm font-medium text-gray-700">
                          Prix de vente <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">F</span>
                          <input
                            type="number"
                            name="selling_price"
                            value={formData.selling_price}
                            onChange={handleChange}
                            className={`input input-bordered w-full pl-8 ${errors.selling_price ? 'input-error' : ''}`}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label text-sm font-medium text-gray-700">Prix de gros</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">F</span>
                          <input
                            type="number"
                            name="wholesale_price"
                            value={formData.wholesale_price}
                            onChange={handleChange}
                            className="input input-bordered w-full pl-8"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div className="form-control">
                        <label className="label text-sm font-medium text-gray-700">Prix promotionnel</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">F</span>
                          <input
                            type="number"
                            name="promo_price"
                            value={formData.promo_price}
                            onChange={handleChange}
                            className="input input-bordered w-full pl-8"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label text-sm font-medium text-gray-700">Taux de TVA (%)</label>
                      <input
                        type="number"
                        name="tax_rate"
                        value={formData.tax_rate}
                        onChange={handleChange}
                        className="input input-bordered w-full"
                        placeholder="0"
                        step="0.1"
                      />
                    </div>
                  </div>

                  {/* Colonne droite - Seuils de stock */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label text-sm font-medium text-gray-700">
                          <TrendingDown className="w-3 h-3 mr-1 text-warning" /> Stock minimum
                        </label>
                        <input
                          type="number"
                          name="min_stock"
                          value={formData.min_stock}
                          onChange={handleChange}
                          className="input input-bordered w-full"
                          placeholder="0"
                        />
                      </div>
                      <div className="form-control">
                        <label className="label text-sm font-medium text-gray-700">
                          <TrendingUp className="w-3 h-3 mr-1 text-success" /> Stock maximum
                        </label>
                        <input
                          type="number"
                          name="max_stock"
                          value={formData.max_stock}
                          onChange={handleChange}
                          className="input input-bordered w-full"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label text-sm font-medium text-gray-700">
                          <AlertCircle className="w-3 h-3 mr-1 text-info" /> Point de commande
                        </label>
                        <input
                          type="number"
                          name="reorder_point"
                          value={formData.reorder_point}
                          onChange={handleChange}
                          className="input input-bordered w-full"
                          placeholder="0"
                        />
                      </div>
                      <div className="form-control">
                        <label className="label text-sm font-medium text-gray-700">
                          <Package className="w-3 h-3 mr-1" /> Qté de réappro
                        </label>
                        <input
                          type="number"
                          name="reorder_quantity"
                          value={formData.reorder_quantity}
                          onChange={handleChange}
                          className="input input-bordered w-full"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: Date d'expiration */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-primary/5 to-transparent px-6 py-3 border-b border-gray-200">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Date d'expiration
                </h3>
              </div>
              <div className="p-6">
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      name="has_expiry"
                      checked={formData.has_expiry}
                      onChange={handleChange}
                      className="checkbox checkbox-primary"
                    />
                    <span className="text-sm font-medium">Ce produit a une date d'expiration</span>
                  </label>
                </div>
                
                {formData.has_expiry && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-gray-100">
                    <div className="form-control">
                      <label className="label text-sm font-medium text-gray-700">
                        <Calendar className="w-3 h-3 mr-1" /> Durée de conservation (jours)
                      </label>
                      <input
                        type="number"
                        name="shelf_life_days"
                        value={formData.shelf_life_days}
                        onChange={handleChange}
                        className={`input input-bordered w-full ${errors.shelf_life_days ? 'input-error' : ''}`}
                        placeholder="Ex: 365"
                      />
                      {errors.shelf_life_days && <span className="text-error text-xs mt-1">{errors.shelf_life_days}</span>}
                    </div>
                    <div className="form-control">
                      <label className="label text-sm font-medium text-gray-700">
                        <AlertTriangle className="w-3 h-3 mr-1 text-warning" /> Jours d'alerte avant expiration
                      </label>
                      <input
                        type="number"
                        name="alert_days"
                        value={formData.alert_days}
                        onChange={handleChange}
                        className="input input-bordered w-full"
                        placeholder="30"
                      />
                      <p className="text-xs text-gray-400 mt-1">Une alerte sera déclenchée X jours avant l'expiration</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 4: Statut */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-primary/5 to-transparent px-6 py-3 border-b border-gray-200">
                <h3 className="font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  Statut et visibilité
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label text-sm font-medium text-gray-700">Statut du produit</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="select select-bordered w-full"
                    >
                      <option value="active">✅ Actif - Visible dans le catalogue</option>
                      <option value="inactive">❌ Inactif - Masqué du catalogue</option>
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3">
                      <input
                        type="checkbox"
                        name="is_featured"
                        checked={formData.is_featured}
                        onChange={handleChange}
                        className="checkbox checkbox-primary"
                      />
                      <span className="text-sm font-medium">⭐ Produit vedette (mis en avant sur la page d'accueil)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-3 pt-4 pb-8">
              <button
                type="button"
                onClick={() => navigate('/produits')}
                className="btn btn-ghost gap-2 px-6"
                disabled={loading}
              >
                <X className="w-4 h-4" /> Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary gap-2 px-8 min-w-[140px]"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <><Save className="w-4 h-4" /> {isEditMode ? 'Enregistrer' : 'Créer'}</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;