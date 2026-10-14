// src/components/products/AddStockManual.jsx
// ============================================================
// AJOUT MANUEL DE STOCK - VERSION CORRIGEE
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import AxiosInstance from '../AxiosInstance';
import { useNavigate } from 'react-router-dom';
import {
  PackagePlus, Save, X, AlertCircle, CheckCircle,
  Package, Warehouse, Calendar, DollarSign, FileText,
  Loader2, ArrowLeft, Tag, Hash,
  BadgeDollarSign, PenLine, PlusCircle, Building2,
  Box, Layers, Clock, Info, Shield, Check
} from 'lucide-react';

// ============================================================
// ERROR BOUNDARY
// ============================================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary AddStockManual:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-4 text-error">
              <AlertCircle className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Erreur dans le formulaire d'ajout</h2>
            </div>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-64 text-red-600">
              {this.state.error?.toString()}
            </pre>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary"
              >
                Recharger
              </button>
              <button
                onClick={() => window.location.href = '/stocks'}
                className="btn btn-ghost"
              >
                Retour aux stocks
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const AddStockManualContent = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('Token');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [notification, setNotification] = useState(null);
  const [errors, setErrors] = useState({});

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

  // ============================================================
  // NORMALISATION DES REPONSES
  // ============================================================
  const normalizeData = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  };

  // ============================================================
  // NOTIFICATION
  // ============================================================
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // ============================================================
  // CHARGEMENT DES DONNEES
  // ============================================================
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!token) {
        showNotification('Session expiree', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      setLoading(true);
      try {
        console.log('Chargement produits + entrepots...');

        const [productsRes, warehousesRes] = await Promise.all([
          // Charger TOUS les produits actifs
          AxiosInstance.get('/products/?status=active&page_size=5000', {
            headers: { Authorization: `Token ${token}` }
          }).catch(err => {
            console.warn('Erreur products:', err.message);
            return { data: [] };
          }),
          // Charger tous les entrepots
          AxiosInstance.get('/warehouses/?active=true&page_size=5000', {
            headers: { Authorization: `Token ${token}` }
          }).catch(err => {
            console.warn('Erreur warehouses:', err.message);
            return { data: [] };
          })
        ]);

        if (!isMounted) return;

        const productsData = normalizeData(productsRes.data);
        const warehousesData = normalizeData(warehousesRes.data);

        console.log('Donnees chargees:', {
          products: productsData.length,
          warehouses: warehousesData.length
        });

        setProducts(productsData);
        setWarehouses(warehousesData);

      } catch (error) {
        console.error('Erreur chargement donnees:', error);
        if (isMounted) {
          showNotification('Erreur de chargement des donnees', 'error');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => { isMounted = false; };
  }, [token, navigate, showNotification]);

  // ============================================================
  // MISE A JOUR DU PRODUIT SELECTIONNE
  // ============================================================
  useEffect(() => {
    if (!formData.product_id) {
      setSelectedProduct(null);
      return;
    }

    const productId = parseInt(formData.product_id);
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product || null);

    if (product) {
      setFormData(prev => ({
        ...prev,
        purchase_price: prev.purchase_price || product.purchase_price || '',
        selling_price: prev.selling_price || product.selling_price || '',
      }));
    }
  }, [formData.product_id, products]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ============================================================
  // VALIDATION
  // ============================================================
  const validate = () => {
    const newErrors = {};
    if (!formData.product_id) newErrors.product_id = 'Veuillez selectionner un produit';
    if (!formData.warehouse_id) newErrors.warehouse_id = 'Veuillez selectionner un entrepot';
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = 'La quantite doit etre superieure a 0';
    }
    if (selectedProduct?.has_expiry && !formData.expiry_date) {
      newErrors.expiry_date = 'Ce produit a une date d\'expiration obligatoire';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================================
  // SOUMISSION
  // ============================================================
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (submitting) return;

    if (!validate()) {
      showNotification('Veuillez corriger les erreurs', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Preparer les donnees (enlever les champs vides)
      const payload = {
        product_id: parseInt(formData.product_id),
        warehouse_id: parseInt(formData.warehouse_id),
        quantity: parseInt(formData.quantity),
        reason: formData.reason || 'Ajout manuel',
      };

      if (formData.lot_number?.trim()) payload.lot_number = formData.lot_number.trim();
      if (formData.batch_number?.trim()) payload.batch_number = formData.batch_number.trim();
      if (formData.expiry_date) payload.expiry_date = formData.expiry_date;
      if (formData.purchase_price) payload.purchase_price = parseFloat(formData.purchase_price);
      if (formData.selling_price) payload.selling_price = parseFloat(formData.selling_price);
      if (formData.notes?.trim()) payload.notes = formData.notes.trim();

      console.log('Envoi add_stock_manual:', payload);

      const response = await AxiosInstance.post(
        '/products/add_stock_manual/',
        payload,
        { headers: { Authorization: `Token ${token}` } }
      );

      console.log('Reponse:', response.data);

      showNotification(
        response.data.message || 'Stock ajoute avec succes',
        'success'
      );

      setTimeout(() => navigate('/stocks'), 2000);

    } catch (error) {
      console.error('Erreur soumission:', error);

      let errorMessage = 'Erreur lors de l\'ajout';

      if (error.response?.data) {
        const data = error.response.data;

        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (typeof data === 'object') {
          const newErrors = {};
          const messages = [];
          Object.keys(data).forEach(key => {
            const val = Array.isArray(data[key]) ? data[key][0] : data[key];
            newErrors[key] = val;
            messages.push(`${key}: ${val}`);
          });
          setErrors(newErrors);
          if (messages.length > 0) errorMessage = messages.join(' | ');
        }
      }

      showNotification(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // RENDU
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-14 h-14 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement des donnees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-50 overflow-hidden">
      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50">
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

      {/* Header */}
      <div className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/20 py-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/stocks')}
              className="btn btn-ghost btn-sm gap-2 hover:bg-primary/10"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/15 rounded-xl">
                <PackagePlus className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Ajout manuel de stock</h1>
                <p className="text-sm text-gray-500">Ajouter du stock sans commande fournisseur</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge badge-primary badge-lg gap-2 px-4 py-2.5">
              <PlusCircle className="w-4 h-4" /> Ajout direct
            </span>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="w-full h-[calc(100%-80px)] overflow-hidden">
        <form onSubmit={handleSubmit} className="h-full w-full flex flex-col">

          {/* Contenu du formulaire */}
          <div className="flex-1 w-full overflow-hidden p-6">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-full">

              {/* Colonne 1: Produit & Entrepot */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col">
                <div className="bg-primary/5 px-5 py-3 border-b border-primary/10">
                  <h3 className="font-semibold flex items-center gap-2 text-base">
                    <Package className="w-5 h-5 text-primary" /> Produit & Entrepot
                  </h3>
                </div>
                <div className="flex-1 p-5 space-y-4 overflow-y-auto">
                  <div>
                    <label className="label text-sm font-medium text-gray-700">
                      Produit <span className="text-error">*</span>
                    </label>
                    <select
                      name="product_id"
                      value={formData.product_id}
                      onChange={handleChange}
                      className={`select select-bordered w-full text-base h-12 ${errors.product_id ? 'select-error' : ''}`}
                    >
                      <option value="">Selectionner un produit ({products.length} disponibles)</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.code} - {product.name} (Stock: {product.current_stock || 0})
                        </option>
                      ))}
                    </select>
                    {errors.product_id && <p className="text-error text-sm mt-1">{errors.product_id}</p>}
                    {products.length === 0 && (
                      <p className="text-warning text-sm mt-2">
                        Aucun produit actif disponible
                      </p>
                    )}
                    {selectedProduct && (
                      <div className="mt-3 p-3 bg-primary/5 rounded-xl space-y-1.5">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Tag className="w-4 h-4 text-primary" /> Code: <span className="font-medium">{selectedProduct.code}</span>
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" /> Expiration: <span className="font-medium">{selectedProduct.has_expiry ? 'Oui' : 'Non'}</span>
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <BadgeDollarSign className="w-4 h-4 text-primary" /> Prix achat: <span className="font-medium">{(parseFloat(selectedProduct.purchase_price) || 0).toLocaleString('fr-FR')} FCFA</span>
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="label text-sm font-medium text-gray-700">
                      Entrepot <span className="text-error">*</span>
                    </label>
                    <select
                      name="warehouse_id"
                      value={formData.warehouse_id}
                      onChange={handleChange}
                      className={`select select-bordered w-full text-base h-12 ${errors.warehouse_id ? 'select-error' : ''}`}
                    >
                      <option value="">Selectionner un entrepot ({warehouses.length} disponibles)</option>
                      {warehouses.map(warehouse => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name} ({warehouse.code})
                        </option>
                      ))}
                    </select>
                    {errors.warehouse_id && <p className="text-error text-sm mt-1">{errors.warehouse_id}</p>}
                    {warehouses.length === 0 && (
                      <p className="text-warning text-sm mt-2">
                        Aucun entrepot actif disponible
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Colonne 2: Quantite & Lot */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col">
                <div className="bg-primary/5 px-5 py-3 border-b border-primary/10">
                  <h3 className="font-semibold flex items-center gap-2 text-base">
                    <Hash className="w-5 h-5 text-primary" /> Quantite & Lot
                  </h3>
                </div>
                <div className="flex-1 p-5 space-y-4 overflow-y-auto">
                  <div>
                    <label className="label text-sm font-medium text-gray-700">
                      Quantite <span className="text-error">*</span>
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      className={`input input-bordered w-full text-base h-12 ${errors.quantity ? 'input-error' : ''}`}
                      placeholder="100"
                      min="1"
                    />
                    {errors.quantity && <p className="text-error text-sm mt-1">{errors.quantity}</p>}
                    {selectedProduct && (
                      <p className="text-sm text-gray-400 mt-1.5 flex items-center gap-2">
                        <Box className="w-4 h-4" /> Stock actuel: <span className="font-medium">{selectedProduct.current_stock || 0}</span> unites
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="label text-sm font-medium text-gray-700">
                      Numero de lot
                    </label>
                    <input
                      type="text"
                      name="lot_number"
                      value={formData.lot_number}
                      onChange={handleChange}
                      className="input input-bordered w-full text-base h-12"
                      placeholder="Auto-genere si vide"
                    />
                    <p className="text-sm text-gray-400 mt-1.5 flex items-center gap-2">
                      <Info className="w-4 h-4" /> Laissez vide pour generation automatique
                    </p>
                  </div>
                  <div>
                    <label className="label text-sm font-medium text-gray-700">
                      Numero de batch
                    </label>
                    <input
                      type="text"
                      name="batch_number"
                      value={formData.batch_number}
                      onChange={handleChange}
                      className="input input-bordered w-full text-base h-12"
                      placeholder="BATCH-001"
                    />
                  </div>
                  <div>
                    <label className="label text-sm font-medium text-gray-700">
                      Date d'expiration {selectedProduct?.has_expiry && <span className="text-error">*</span>}
                    </label>
                    <input
                      type="date"
                      name="expiry_date"
                      value={formData.expiry_date}
                      onChange={handleChange}
                      className={`input input-bordered w-full text-base h-12 ${errors.expiry_date ? 'input-error' : ''}`}
                    />
                    {errors.expiry_date && <p className="text-error text-sm mt-1">{errors.expiry_date}</p>}
                  </div>
                </div>
              </div>

              {/* Colonne 3: Prix */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col">
                <div className="bg-primary/5 px-5 py-3 border-b border-primary/10">
                  <h3 className="font-semibold flex items-center gap-2 text-base">
                    <DollarSign className="w-5 h-5 text-primary" /> Prix
                  </h3>
                </div>
                <div className="flex-1 p-5 space-y-4 overflow-y-auto">
                  <div>
                    <label className="label text-sm font-medium text-gray-700">
                      Prix d'achat (FCFA)
                    </label>
                    <input
                      type="number"
                      name="purchase_price"
                      value={formData.purchase_price}
                      onChange={handleChange}
                      className="input input-bordered w-full text-base h-12"
                      placeholder="0"
                      step="0.01"
                    />
                    <p className="text-sm text-gray-400 mt-1.5 flex items-center gap-2">
                      <Info className="w-4 h-4" /> Laissez vide pour utiliser le prix du produit
                    </p>
                  </div>
                  <div>
                    <label className="label text-sm font-medium text-gray-700">
                      Prix de vente (FCFA)
                    </label>
                    <input
                      type="number"
                      name="selling_price"
                      value={formData.selling_price}
                      onChange={handleChange}
                      className="input input-bordered w-full text-base h-12"
                      placeholder="0"
                      step="0.01"
                    />
                    <p className="text-sm text-gray-400 mt-1.5 flex items-center gap-2">
                      <Info className="w-4 h-4" /> Laissez vide pour utiliser le prix du produit
                    </p>
                  </div>
                </div>
              </div>

              {/* Colonne 4: Notes & Resume */}
              <div className="flex flex-col gap-4 h-full">
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex-1">
                  <div className="bg-primary/5 px-5 py-3 border-b border-primary/10">
                    <h3 className="font-semibold flex items-center gap-2 text-base">
                      <PenLine className="w-5 h-5 text-primary" /> Notes
                    </h3>
                  </div>
                  <div className="p-5 space-y-4 h-[calc(100%-52px)]">
                    <div>
                      <label className="label text-sm font-medium text-gray-700">
                        Raison de l'ajout
                      </label>
                      <input
                        type="text"
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        className="input input-bordered w-full text-base h-12"
                        placeholder="Ajout manuel, retour, ajustement..."
                      />
                    </div>
                    <div className="flex-1">
                      <label className="label text-sm font-medium text-gray-700">
                        Notes <span className="text-gray-400 text-xs">(observations)</span>
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        className="textarea textarea-bordered w-full h-[calc(100%-60px)] min-h-[80px] text-base resize-none"
                        placeholder="Informations sur le lot, qualite, fournisseur..."
                      />
                    </div>
                  </div>
                </div>

                {/* Resume */}
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl border border-primary/20 overflow-hidden">
                  <div className="bg-primary/10 px-5 py-2.5 border-b border-primary/10">
                    <h3 className="font-semibold flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary" /> Resume de l'operation
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white/50 rounded-lg p-3">
                        <p className="text-gray-500 text-xs">Produit</p>
                        <p className="font-medium truncate text-primary">
                          {selectedProduct?.name || 'Non selectionne'}
                        </p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-3">
                        <p className="text-gray-500 text-xs">Entrepot</p>
                        <p className="font-medium truncate">
                          {warehouses.find(w => w.id === parseInt(formData.warehouse_id))?.name || 'Non selectionne'}
                        </p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-3">
                        <p className="text-gray-500 text-xs">Quantite</p>
                        <p className="font-medium text-success text-lg">
                          {formData.quantity || '0'} <span className="text-xs text-gray-400">unites</span>
                        </p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-3">
                        <p className="text-gray-500 text-xs">Lot</p>
                        <p className="font-medium truncate">{formData.lot_number || 'Auto-genere'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="w-full px-6 py-4 bg-white border-t border-gray-200 flex flex-col sm:flex-row gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate('/stocks')}
              className="btn btn-ghost gap-2 text-base px-6 h-12 hover:bg-gray-100"
              disabled={submitting}
            >
              <X className="w-5 h-5" /> Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2 min-w-[180px] text-base px-8 h-12 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
              disabled={submitting || products.length === 0 || warehouses.length === 0}
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {submitting ? 'Ajout en cours...' : 'Ajouter au stock'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

// ============================================================
// WRAPPER avec ErrorBoundary
// ============================================================
const AddStockManual = () => (
  <ErrorBoundary>
    <AddStockManualContent />
  </ErrorBoundary>
);

export default AddStockManual;