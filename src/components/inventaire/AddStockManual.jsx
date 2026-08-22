// src/components/products/AddStockManual.jsx
import React, { useState, useEffect } from 'react';
import AxiosInstance from '../AxiosInstance';
import { useNavigate } from 'react-router-dom';
import {
  PackagePlus, Save, X, AlertCircle, CheckCircle,
  Package, Warehouse, Calendar, DollarSign, FileText,
  Loader2, ArrowLeft, Tag, Hash,
  BadgeDollarSign, PenLine, PlusCircle
} from 'lucide-react';

const AddStockManual = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('Token');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    product_id: '',
    warehouse_id: '',
    quantity: '',
    lot_number: '',
    batch_number: '',
    expiry_date: '',
    purchase_price: '',
    selling_price: '',
    notes: '',
    reason: 'Ajout manuel'
  });
  const [errors, setErrors] = useState({});

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Charger les produits et entrepôts
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [productsRes, warehousesRes] = await Promise.all([
          AxiosInstance.get('/products/', {
            headers: { Authorization: `Token ${token}` }
          }),
          AxiosInstance.get('/warehouses/', {
            headers: { Authorization: `Token ${token}` }
          })
        ]);
        setProducts(productsRes.data || []);
        setWarehouses(warehousesRes.data || []);
      } catch (error) {
        console.error('Erreur chargement données:', error);
        showNotification('Erreur de chargement des données', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [token]);

  // Mettre à jour le produit sélectionné
  useEffect(() => {
    if (formData.product_id) {
      const product = products.find(p => p.id === parseInt(formData.product_id));
      setSelectedProduct(product);
      if (product) {
        setFormData(prev => ({
          ...prev,
          purchase_price: prev.purchase_price || product.purchase_price || '',
          selling_price: prev.selling_price || product.selling_price || '',
        }));
      }
    } else {
      setSelectedProduct(null);
    }
  }, [formData.product_id, products]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.product_id) newErrors.product_id = 'Veuillez sélectionner un produit';
    if (!formData.warehouse_id) newErrors.warehouse_id = 'Veuillez sélectionner un entrepôt';
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = 'La quantité doit être supérieure à 0';
    }
    if (selectedProduct?.has_expiry && !formData.expiry_date) {
      newErrors.expiry_date = 'Ce produit a une date d\'expiration obligatoire';
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
      const response = await AxiosInstance.post('/products/add_stock_manual/', formData, {
        headers: { Authorization: `Token ${token}` }
      });

      showNotification(response.data.message || 'Stock ajouté avec succès', 'success');
      setTimeout(() => {
        navigate('/stocks');
      }, 2000);

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
        showNotification('Erreur lors de l\'ajout', 'error');
      } else {
        showNotification('Erreur réseau', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-50 overflow-hidden">
      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl max-w-md`}>
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

      {/* Header compact */}
      <div className="w-full bg-gradient-to-r from-success/10 via-success/5 to-transparent border-b border-success/10 py-2 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/stocks')} className="btn btn-ghost btn-sm gap-1">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-success/15 rounded-lg">
                <PackagePlus className="w-5 h-5 text-success" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Ajout manuel de stock</h1>
                <p className="text-xs text-gray-500">Ajouter du stock sans commande fournisseur</p>
              </div>
            </div>
          </div>
          <span className="badge badge-success badge-md gap-1">
            <PlusCircle className="w-3 h-3" /> Ajout direct
          </span>
        </div>
      </div>

      {/* Formulaire - 100% de la hauteur restante, pas de scroll */}
      <div className="w-full h-[calc(100%-56px)] overflow-hidden">
        <form onSubmit={handleSubmit} className="h-full w-full flex flex-col">
          
          {/* Contenu du formulaire - prend tout l'espace disponible */}
          <div className="flex-1 w-full overflow-hidden p-4">
            <div className="grid grid-cols-4 gap-4 h-full">
              
              {/* Colonne 1: Produit & Entrepôt */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h3 className="font-semibold flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-primary" /> Produit & Entrepôt
                  </h3>
                </div>
                <div className="flex-1 p-4 space-y-3 overflow-hidden">
                  <div>
                    <label className="label text-xs font-medium text-gray-700">
                      Produit <span className="text-error">*</span>
                    </label>
                    <select
                      name="product_id"
                      value={formData.product_id}
                      onChange={handleChange}
                      className={`select select-bordered w-full text-sm h-10 ${errors.product_id ? 'select-error' : ''}`}
                    >
                      <option value="">Sélectionner un produit</option>
                      {products.filter(p => p.status === 'active').map(product => (
                        <option key={product.id} value={product.id}>
                          {product.code} - {product.name} (Stock: {product.current_stock || 0})
                        </option>
                      ))}
                    </select>
                    {errors.product_id && <p className="text-error text-xs mt-1">{errors.product_id}</p>}
                    {selectedProduct && (
                      <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                        <p><Tag className="w-3 h-3 inline mr-1" /> Code: {selectedProduct.code}</p>
                        <p><Calendar className="w-3 h-3 inline mr-1" /> Expiration: {selectedProduct.has_expiry ? 'Oui' : 'Non'}</p>
                        <p><BadgeDollarSign className="w-3 h-3 inline mr-1" /> Prix achat: {selectedProduct.purchase_price?.toLocaleString()} FCFA</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="label text-xs font-medium text-gray-700">
                      Entrepôt <span className="text-error">*</span>
                    </label>
                    <select
                      name="warehouse_id"
                      value={formData.warehouse_id}
                      onChange={handleChange}
                      className={`select select-bordered w-full text-sm h-10 ${errors.warehouse_id ? 'select-error' : ''}`}
                    >
                      <option value="">Sélectionner un entrepôt</option>
                      {warehouses.filter(w => w.is_active).map(warehouse => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name} ({warehouse.code})
                        </option>
                      ))}
                    </select>
                    {errors.warehouse_id && <p className="text-error text-xs mt-1">{errors.warehouse_id}</p>}
                  </div>
                </div>
              </div>

              {/* Colonne 2: Quantité & Lot */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h3 className="font-semibold flex items-center gap-2 text-sm">
                    <Hash className="w-4 h-4 text-primary" /> Quantité & Lot
                  </h3>
                </div>
                <div className="flex-1 p-4 space-y-3 overflow-hidden">
                  <div>
                    <label className="label text-xs font-medium text-gray-700">
                      Quantité <span className="text-error">*</span>
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      className={`input input-bordered w-full text-sm h-10 ${errors.quantity ? 'input-error' : ''}`}
                      placeholder="100"
                      min="1"
                    />
                    {errors.quantity && <p className="text-error text-xs mt-1">{errors.quantity}</p>}
                    {selectedProduct && (
                      <p className="text-xs text-gray-400 mt-1">
                        Stock actuel: {selectedProduct.current_stock || 0} unités
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="label text-xs font-medium text-gray-700">
                      Numéro de lot
                    </label>
                    <input
                      type="text"
                      name="lot_number"
                      value={formData.lot_number}
                      onChange={handleChange}
                      className="input input-bordered w-full text-sm h-10"
                      placeholder="Auto-généré si vide"
                    />
                    <p className="text-xs text-gray-400 mt-1">Laissez vide pour génération automatique</p>
                  </div>
                  <div>
                    <label className="label text-xs font-medium text-gray-700">
                      Numéro de batch
                    </label>
                    <input
                      type="text"
                      name="batch_number"
                      value={formData.batch_number}
                      onChange={handleChange}
                      className="input input-bordered w-full text-sm h-10"
                      placeholder="BATCH-001"
                    />
                  </div>
                  <div>
                    <label className="label text-xs font-medium text-gray-700">
                      Date d'expiration {selectedProduct?.has_expiry && <span className="text-error">*</span>}
                    </label>
                    <input
                      type="date"
                      name="expiry_date"
                      value={formData.expiry_date}
                      onChange={handleChange}
                      className={`input input-bordered w-full text-sm h-10 ${errors.expiry_date ? 'input-error' : ''}`}
                    />
                    {errors.expiry_date && <p className="text-error text-xs mt-1">{errors.expiry_date}</p>}
                  </div>
                </div>
              </div>

              {/* Colonne 3: Prix */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h3 className="font-semibold flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-primary" /> Prix
                  </h3>
                </div>
                <div className="flex-1 p-4 space-y-3 overflow-hidden">
                  <div>
                    <label className="label text-xs font-medium text-gray-700">
                      Prix d'achat (FCFA)
                    </label>
                    <input
                      type="number"
                      name="purchase_price"
                      value={formData.purchase_price}
                      onChange={handleChange}
                      className="input input-bordered w-full text-sm h-10"
                      placeholder="0"
                      step="0.01"
                    />
                    <p className="text-xs text-gray-400 mt-1">Laissez vide pour utiliser le prix du produit</p>
                  </div>
                  <div>
                    <label className="label text-xs font-medium text-gray-700">
                      Prix de vente (FCFA)
                    </label>
                    <input
                      type="number"
                      name="selling_price"
                      value={formData.selling_price}
                      onChange={handleChange}
                      className="input input-bordered w-full text-sm h-10"
                      placeholder="0"
                      step="0.01"
                    />
                    <p className="text-xs text-gray-400 mt-1">Laissez vide pour utiliser le prix du produit</p>
                  </div>
                </div>
              </div>

              {/* Colonne 4: Notes et Résumé */}
              <div className="flex flex-col gap-4 h-full">
                {/* Notes */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1">
                  <div className="bg-gray-50 px-4 py-2 border-b">
                    <h3 className="font-semibold flex items-center gap-2 text-sm">
                      <PenLine className="w-4 h-4 text-primary" /> Notes
                    </h3>
                  </div>
                  <div className="p-4 space-y-3 h-[calc(100%-40px)]">
                    <div>
                      <label className="label text-xs font-medium text-gray-700">
                        Raison de l'ajout
                      </label>
                      <input
                        type="text"
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        className="input input-bordered w-full text-sm h-9"
                        placeholder="Ajout manuel, retour, ajustement..."
                      />
                    </div>
                    <div className="flex-1">
                      <label className="label text-xs font-medium text-gray-700">
                        Notes <span className="text-gray-400 text-xs">(observations)</span>
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        className="textarea textarea-bordered w-full h-[calc(100%-28px)] min-h-[60px] text-sm"
                        placeholder="Informations sur le lot, qualité, fournisseur..."
                      />
                    </div>
                  </div>
                </div>

                {/* Résumé compact */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-1.5 border-b">
                    <h3 className="font-semibold flex items-center gap-2 text-xs">
                      <CheckCircle className="w-3 h-3 text-success" /> Résumé
                    </h3>
                  </div>
                  <div className="p-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Produit</p>
                        <p className="font-medium truncate">{selectedProduct?.name || 'Non sélectionné'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Entrepôt</p>
                        <p className="font-medium truncate">
                          {warehouses.find(w => w.id === parseInt(formData.warehouse_id))?.name || 'Non sélectionné'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Quantité</p>
                        <p className="font-medium text-success">{formData.quantity || '0'} unités</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Lot</p>
                        <p className="font-medium truncate">{formData.lot_number || 'Auto-généré'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Boutons - fixes en bas */}
          <div className="w-full px-4 py-3 bg-white border-t border-gray-200 flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate('/stocks')}
              className="btn btn-ghost gap-2 text-sm"
              disabled={submitting}
            >
              <X className="w-4 h-4" /> Annuler
            </button>
            <button
              type="submit"
              className="btn btn-success gap-2 min-w-[130px] text-sm"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {submitting ? 'Ajout en cours...' : 'Ajouter au stock'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddStockManual;