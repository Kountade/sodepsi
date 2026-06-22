// src/components/stock/TransfertForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Save, X, MoveHorizontal, ArrowLeft, Building2, Package,
  CheckCircle, AlertCircle, RefreshCw, Warehouse, ArrowRight
} from 'lucide-react';

const TransfertForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    product: '',
    lot: '',
    from_warehouse: '',
    to_warehouse: '',
    quantity: '',
    reason: '',
    notes: ''
  });
  
  const [products, setProducts] = useState([]);
  const [lots, setLots] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [availableQuantity, setAvailableQuantity] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchProducts = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/products/?status=active', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/warehouses/?active=true', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setWarehouses(response.data);
    } catch (error) {
      console.error('Erreur chargement entrepôts:', error);
    }
  };

  const fetchLotsForProduct = async (productId, warehouseId) => {
    if (!productId || !warehouseId) return;
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/lots/?product=${productId}&warehouse=${warehouseId}&available=true`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setLots(response.data);
      
      // Calculer la quantité totale disponible
      const totalAvailable = response.data.reduce((sum, lot) => sum + (lot.available_quantity || lot.current_quantity), 0);
      setAvailableQuantity(totalAvailable);
    } catch (error) {
      console.error('Erreur chargement lots:', error);
    }
  };

  const loadTransfert = async () => {
    if (!isEditMode) {
      setFetching(false);
      return;
    }
    
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/movements/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = response.data;
      setFormData({
        product: data.product || '',
        lot: data.lot || '',
        from_warehouse: data.from_warehouse || '',
        to_warehouse: data.to_warehouse || '',
        quantity: data.quantity || '',
        reason: data.reason || '',
        notes: data.notes || ''
      });
      if (data.product) {
        await fetchLotsForProduct(data.product, data.from_warehouse);
      }
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Impossible de charger le transfert', 'error');
      navigate('/transferts');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchWarehouses();
    loadTransfert();
  }, [id]);

  useEffect(() => {
    if (formData.product && formData.from_warehouse) {
      fetchLotsForProduct(formData.product, formData.from_warehouse);
    }
  }, [formData.product, formData.from_warehouse]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Réinitialiser le lot quand le produit ou l'entrepôt change
    if (name === 'product' || name === 'from_warehouse') {
      setFormData(prev => ({ ...prev, lot: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.product) newErrors.product = 'Le produit est requis';
    if (!formData.from_warehouse) newErrors.from_warehouse = 'L\'entrepôt source est requis';
    if (!formData.to_warehouse) newErrors.to_warehouse = 'L\'entrepôt destination est requis';
    if (formData.from_warehouse === formData.to_warehouse) {
      newErrors.to_warehouse = 'L\'entrepôt destination doit être différent de l\'entrepôt source';
    }
    if (!formData.quantity) newErrors.quantity = 'La quantité est requise';
    if (formData.quantity && parseInt(formData.quantity) <= 0) {
      newErrors.quantity = 'La quantité doit être supérieure à 0';
    }
    if (formData.quantity && parseInt(formData.quantity) > availableQuantity) {
      newErrors.quantity = `Quantité insuffisante. Disponible: ${availableQuantity}`;
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
      
      const dataToSend = {
        product: parseInt(formData.product),
        lot: formData.lot ? parseInt(formData.lot) : null,
        from_warehouse: parseInt(formData.from_warehouse),
        to_warehouse: parseInt(formData.to_warehouse),
        movement_type: 'transfer_out',
        quantity: parseInt(formData.quantity),
        reason: formData.reason || 'Transfert entre entrepôts',
        notes: formData.notes
      };
      
      await AxiosInstance.post('/movements/create_movement/', dataToSend, { headers });
      showNotification('Transfert effectué avec succès', 'success');
      setTimeout(() => navigate('/transferts'), 1500);
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

  const getProductName = (productId) => {
    const product = products.find(p => p.id === parseInt(productId));
    return product ? product.name : '';
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* En-tête */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/transferts')} className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <MoveHorizontal className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Nouveau transfert</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">Transférer du stock entre entrepôts</p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              {/* Illustration */}
              <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-xl p-4">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <Building2 className="w-8 h-8 text-primary mx-auto" />
                    <p className="text-xs text-gray-500 mt-1">Entrepôt source</p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-primary" />
                  <div className="text-center">
                    <Building2 className="w-8 h-8 text-success mx-auto" />
                    <p className="text-xs text-gray-500 mt-1">Entrepôt destination</p>
                  </div>
                </div>
              </div>

              {/* Produit */}
              <div className="form-control">
                <label className="label text-sm font-medium text-gray-700">
                  Produit <span className="text-error">*</span>
                </label>
                <select
                  name="product"
                  value={formData.product}
                  onChange={handleChange}
                  className={`select select-bordered w-full ${errors.product ? 'select-error' : ''}`}
                  disabled={isEditMode}
                >
                  <option value="">Sélectionner un produit</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.code} - {product.name}
                    </option>
                  ))}
                </select>
                {errors.product && <span className="text-error text-xs mt-1">{errors.product}</span>}
              </div>

              {/* Entrepôt source et destination */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="form-control">
                  <label className="label text-sm font-medium text-gray-700">
                    Entrepôt source <span className="text-error">*</span>
                  </label>
                  <select
                    name="from_warehouse"
                    value={formData.from_warehouse}
                    onChange={handleChange}
                    className={`select select-bordered w-full ${errors.from_warehouse ? 'select-error' : ''}`}
                    disabled={isEditMode}
                  >
                    <option value="">Sélectionner</option>
                    {warehouses.filter(w => w.is_active).map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                  </select>
                  {errors.from_warehouse && <span className="text-error text-xs mt-1">{errors.from_warehouse}</span>}
                </div>

                <div className="form-control">
                  <label className="label text-sm font-medium text-gray-700">
                    Entrepôt destination <span className="text-error">*</span>
                  </label>
                  <select
                    name="to_warehouse"
                    value={formData.to_warehouse}
                    onChange={handleChange}
                    className={`select select-bordered w-full ${errors.to_warehouse ? 'select-error' : ''}`}
                  >
                    <option value="">Sélectionner</option>
                    {warehouses.filter(w => w.is_active && w.id !== parseInt(formData.from_warehouse)).map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                  </select>
                  {errors.to_warehouse && <span className="text-error text-xs mt-1">{errors.to_warehouse}</span>}
                </div>
              </div>

              {/* Lot et quantité */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="form-control">
                  <label className="label text-sm font-medium text-gray-700">Lot (optionnel)</label>
                  <select
                    name="lot"
                    value={formData.lot}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                    disabled={!formData.product || !formData.from_warehouse}
                  >
                    <option value="">Tous les lots (FIFO)</option>
                    {lots.map(lot => (
                      <option key={lot.id} value={lot.id}>
                        {lot.lot_number} - {lot.available_quantity || lot.current_quantity} disponibles
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label text-sm font-medium text-gray-700">
                    Quantité <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.quantity ? 'input-error' : ''}`}
                    placeholder="0"
                  />
                  {errors.quantity && <span className="text-error text-xs mt-1">{errors.quantity}</span>}
                  {availableQuantity > 0 && (
                    <p className="text-xs text-gray-400 mt-1">Disponible: {availableQuantity} unités</p>
                  )}
                </div>
              </div>

              {/* Raison et notes */}
              <div className="form-control">
                <label className="label text-sm font-medium text-gray-700">Raison du transfert</label>
                <input
                  type="text"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Ex: Réapprovisionnement, Rotation stock..."
                />
              </div>

              <div className="form-control">
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

            {/* Actions */}
            <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t">
              <button type="button" onClick={() => navigate('/transferts')} className="btn btn-ghost gap-2 px-6" disabled={loading}>
                <X className="w-4 h-4" /> Annuler
              </button>
              <button type="submit" className="btn btn-primary gap-2 px-8 min-w-[140px]" disabled={loading}>
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <><MoveHorizontal className="w-4 h-4" /> Transférer</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Information */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Information</p>
              <p className="text-xs text-blue-600 mt-1">
                Le transfert déplace le stock d'un entrepôt à un autre. 
                Si aucun lot n'est sélectionné, le système utilisera la méthode FIFO 
                (premier expiré, premier sorti) pour prendre les produits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransfertForm;