// src/components/achats/CommandeForm.jsx
// ============================================================
// VERSION CORRIGÉE - Formulaire bon de commande
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Save, X, ShoppingCart, RefreshCw, ArrowLeft, Truck,
  Plus, Trash2, CheckCircle, AlertCircle, DollarSign,
  Calendar, Loader2, AlertTriangle, Search, Package
} from 'lucide-react';

// ============================================================
// CONSTANTES
// ============================================================
const DEBOUNCE_MS = 400;

// ============================================================
// HELPERS
// ============================================================
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '0 FCFA';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0 FCFA';
  return `${num.toLocaleString('fr-FR')} FCFA`;
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const CommandeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // ----- Formulaire -----
  const [formData, setFormData] = useState({
    supplier: '',
    expected_delivery_date: '',
    discount_type: 'amount',
    discount_value: 0,
    tax_rate: 0,
    shipping_cost: 0,
    notes: '',
    internal_notes: '',
    shipping_address: '',
  });

  // ----- Lignes -----
  const [lines, setLines] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedUnitPrice, setSelectedUnitPrice] = useState(0);

  // ----- Listes -----
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  // ----- États -----
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  const abortRef = useRef(null);

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  }, []);

  const getToken = () => localStorage.getItem('Token');

  // ============================================================
  // CHARGEMENT FOURNISSEURS
  // ============================================================
  const fetchSuppliers = useCallback(async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get(
        '/suppliers/?is_active=true&page_size=200',
        { headers: { 'Authorization': `Token ${token}` } }
      );
      const data = response.data;
      const results = Array.isArray(data) ? data : data.results || [];
      setSuppliers(results);
    } catch (error) {
      console.error('❌ Erreur chargement fournisseurs:', error);
    }
  }, []);

  // ============================================================
  // CHARGEMENT PRODUITS (avec debounce)
  // ============================================================
  const fetchProducts = useCallback(async (search = '') => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoadingProducts(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      params.append('status', 'active');
      params.append('page_size', '50');
      if (search) params.append('search', search);

      const response = await AxiosInstance.get(
        `/products/?${params.toString()}`,
        {
          headers: { 'Authorization': `Token ${token}` },
          signal: controller.signal,
        }
      );

      const data = response.data;
      const results = Array.isArray(data) ? data : data.results || [];
      setProducts(results);
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') return;
      console.error('❌ Erreur chargement produits:', error);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // ============================================================
  // CHARGEMENT COMMANDE (mode édition)
  // ============================================================
  const loadCommande = useCallback(async () => {
    if (!isEditMode) {
      setFetching(false);
      return;
    }

    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/purchase-orders/${id}/`, {
        headers: { 'Authorization': `Token ${token}` },
      });

      const data = response.data;
      setFormData({
        supplier: data.supplier || '',
        expected_delivery_date: data.expected_delivery_date || '',
        discount_type: data.discount_type || 'amount',
        discount_value: data.discount_value || 0,
        tax_rate: data.tax_rate || 0,
        shipping_cost: data.shipping_cost || 0,
        notes: data.notes || '',
        internal_notes: data.internal_notes || '',
        shipping_address: data.shipping_address || '',
      });
      setLines(data.lines || []);
    } catch (error) {
      console.error('❌ Erreur chargement commande:', error);
      showNotification('Impossible de charger la commande', 'error');
      navigate('/commandes-fournisseurs');
    } finally {
      setFetching(false);
    }
  }, [id, isEditMode, navigate, showNotification]);

  // ============================================================
  // EFFETS
  // ============================================================
  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
    loadCommande();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Debounce recherche produit
  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedProductSearch(productSearch),
      DEBOUNCE_MS
    );
    return () => clearTimeout(t);
  }, [productSearch]);

  // Recharger produits quand la recherche change
  useEffect(() => {
    if (debouncedProductSearch !== undefined) {
      fetchProducts(debouncedProductSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedProductSearch]);

  // ============================================================
  // GESTION DES LIGNES
  // ============================================================
  const addLine = () => {
    if (!selectedProduct) {
      showNotification('Sélectionnez un produit', 'error');
      return;
    }
    if (selectedQuantity <= 0) {
      showNotification('La quantité doit être supérieure à 0', 'error');
      return;
    }

    const product = products.find((p) => p.id === parseInt(selectedProduct));
    if (!product) {
      showNotification('Produit introuvable', 'error');
      return;
    }

    const existingLine = lines.find(
      (l) => l.product === parseInt(selectedProduct)
    );

    if (existingLine) {
      setLines(
        lines.map((l) =>
          l.product === parseInt(selectedProduct)
            ? { ...l, quantity: l.quantity + selectedQuantity }
            : l
        )
      );
    } else {
      setLines([
        ...lines,
        {
          product: parseInt(selectedProduct),
          product_name: product.name,
          product_code: product.code,
          quantity: selectedQuantity,
          unit_price: selectedUnitPrice || product.purchase_price || 0,
          discount: 0,
          tax_rate: formData.tax_rate,
          notes: '',
        },
      ]);
    }

    setSelectedProduct('');
    setSelectedQuantity(1);
    setSelectedUnitPrice(0);
    setErrors((prev) => ({ ...prev, lines: '' }));
  };

  const removeLine = (index) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index, field, value) => {
    const updatedLines = [...lines];
    updatedLines[index][field] = value;
    setLines(updatedLines);
  };

  // ============================================================
  // CALCULS
  // ============================================================
  const calculateSubtotal = () => {
    return lines.reduce(
      (sum, line) => sum + (line.quantity || 0) * (line.unit_price || 0),
      0
    );
  };

  const calculateDiscount = (subtotal) => {
    if (formData.discount_type === 'percentage') {
      return subtotal * (formData.discount_value / 100);
    }
    return parseFloat(formData.discount_value) || 0;
  };

  const calculateTax = (subtotal, discountAmount) => {
    return (subtotal - discountAmount) * (formData.tax_rate / 100);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscount(subtotal);
    const taxAmount = calculateTax(subtotal, discountAmount);
    return (
      subtotal - discountAmount + taxAmount + (parseFloat(formData.shipping_cost) || 0)
    );
  };

  const subtotal = calculateSubtotal();
  const discountAmount = calculateDiscount(subtotal);
  const taxAmount = calculateTax(subtotal, discountAmount);
  const total = calculateTotal();

  // ============================================================
  // VALIDATION
  // ============================================================
  const validate = () => {
    const newErrors = {};
    if (!formData.supplier) newErrors.supplier = 'Le fournisseur est requis';
    if (!formData.expected_delivery_date)
      newErrors.expected_delivery_date = 'La date de livraison est requise';
    if (lines.length === 0) newErrors.lines = 'Ajoutez au moins un produit';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================================
  // SOUMISSION
  // ============================================================
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) {
      showNotification('Veuillez corriger les erreurs du formulaire', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      const headers = { 'Authorization': `Token ${token}` };

      const dataToSend = {
        ...formData,
        discount_value: parseFloat(formData.discount_value) || 0,
        tax_rate: parseFloat(formData.tax_rate) || 0,
        shipping_cost: parseFloat(formData.shipping_cost) || 0,
        lines: lines.map((line) => ({
          product: line.product,
          quantity: line.quantity,
          unit_price: line.unit_price,
          discount: line.discount || 0,
          tax_rate: line.tax_rate || formData.tax_rate || 0,
          notes: line.notes || '',
        })),
      };

      if (isEditMode) {
        await AxiosInstance.patch(
          `/purchase-orders/${id}/`,
          dataToSend,
          { headers }
        );
        showNotification('Commande modifiée avec succès', 'success');
      } else {
        await AxiosInstance.post('/purchase-orders/', dataToSend, { headers });
        showNotification('Commande créée avec succès', 'success');
      }

      setTimeout(() => navigate('/commandes-fournisseurs'), 1500);
    } catch (error) {
      console.error('❌ Erreur:', error);
      if (error.response?.data) {
        const apiErrors = error.response.data;
        setErrors(apiErrors);
        const messages = Object.keys(apiErrors).map(
          (key) => `${key}: ${apiErrors[key]}`
        );
        showNotification(messages.join(' | '), 'error');
      } else {
        showNotification('Une erreur est survenue', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ÉCRAN DE CHARGEMENT
  // ============================================================
  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">
            {isEditMode ? 'Chargement de la commande…' : 'Préparation du formulaire…'}
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* ---------- NOTIFICATION ---------- */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div
            className={`alert ${
              notification.type === 'success'
                ? 'alert-success'
                : notification.type === 'warning'
                ? 'alert-warning'
                : 'alert-error'
            } shadow-xl rounded-xl max-w-md`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : notification.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="font-medium text-sm">{notification.message}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() =>
                setNotification((prev) => ({ ...prev, show: false }))
              }
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ---------- EN-TÊTE ---------- */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/commandes-fournisseurs')}
            className="btn btn-ghost btn-sm gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">
                {isEditMode ? 'Modifier' : 'Nouvelle'} commande
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {isEditMode
                ? 'Modifiez les informations de la commande'
                : 'Créez un bon de commande fournisseur'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ---------- COLONNE GAUCHE ---------- */}
          <div className="lg:col-span-2 space-y-6">
            {/* Infos principales */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="form-control">
                    <label className="label text-sm font-medium text-gray-700">
                      Fournisseur <span className="text-error">*</span>
                    </label>
                    <select
                      name="supplier"
                      value={formData.supplier}
                      onChange={(e) =>
                        setFormData({ ...formData, supplier: e.target.value })
                      }
                      className={`select select-bordered w-full ${
                        errors.supplier ? 'select-error' : ''
                      }`}
                    >
                      <option value="">Sélectionner un fournisseur</option>
                      {suppliers.map((sup) => (
                        <option key={sup.id} value={sup.id}>
                          {sup.name}
                        </option>
                      ))}
                    </select>
                    {errors.supplier && (
                      <span className="text-error text-xs mt-1">
                        {errors.supplier}
                      </span>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label text-sm font-medium text-gray-700">
                      Date livraison prévue <span className="text-error">*</span>
                    </label>
                    <input
                      type="date"
                      name="expected_delivery_date"
                      value={formData.expected_delivery_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expected_delivery_date: e.target.value,
                        })
                      }
                      className={`input input-bordered w-full ${
                        errors.expected_delivery_date ? 'input-error' : ''
                      }`}
                    />
                    {errors.expected_delivery_date && (
                      <span className="text-error text-xs mt-1">
                        {errors.expected_delivery_date}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-control">
                  <label className="label text-sm font-medium text-gray-700">
                    Adresse de livraison
                  </label>
                  <textarea
                    name="shipping_address"
                    value={formData.shipping_address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shipping_address: e.target.value,
                      })
                    }
                    className="textarea textarea-bordered w-full"
                    rows="2"
                    placeholder="Adresse de livraison (si différente)"
                  />
                </div>

                <div className="form-control">
                  <label className="label text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="textarea textarea-bordered w-full"
                    rows="2"
                    placeholder="Notes publiques (visibles sur la commande)"
                  />
                </div>

                <div className="form-control">
                  <label className="label text-sm font-medium text-gray-700">
                    Notes internes
                  </label>
                  <textarea
                    name="internal_notes"
                    value={formData.internal_notes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        internal_notes: e.target.value,
                      })
                    }
                    className="textarea textarea-bordered w-full"
                    rows="2"
                    placeholder="Notes internes (non visibles par le fournisseur)"
                  />
                </div>
              </div>
            </div>

            {/* Lignes de commande */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" /> Lignes de commande
                </h3>
                <span className="badge badge-primary">{lines.length} ligne(s)</span>
              </div>

              <div className="p-6">
                {/* Ajout de ligne */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un produit…"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="input input-bordered w-full pl-9"
                    />
                    {loadingProducts && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  <select
                    value={selectedProduct}
                    onChange={(e) => {
                      setSelectedProduct(e.target.value);
                      const product = products.find(
                        (p) => p.id === parseInt(e.target.value)
                      );
                      if (product)
                        setSelectedUnitPrice(product.purchase_price || 0);
                    }}
                    className="select select-bordered"
                  >
                    <option value="">Sélectionner un produit</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Quantité"
                    min="1"
                    value={selectedQuantity}
                    onChange={(e) =>
                      setSelectedQuantity(parseInt(e.target.value) || 1)
                    }
                    className="input input-bordered"
                  />
                  <input
                    type="number"
                    placeholder="Prix unitaire"
                    min="0"
                    step="0.01"
                    value={selectedUnitPrice}
                    onChange={(e) =>
                      setSelectedUnitPrice(parseFloat(e.target.value) || 0)
                    }
                    className="input input-bordered"
                  />
                  <button
                    type="button"
                    onClick={addLine}
                    className="btn btn-primary gap-2 md:col-span-4"
                  >
                    <Plus className="w-4 h-4" /> Ajouter le produit
                  </button>
                </div>

                {/* Tableau des lignes */}
                {lines.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Aucun produit ajouté</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th>Produit</th>
                          <th className="text-center">Quantité</th>
                          <th className="text-right">Prix unitaire</th>
                          <th className="text-right">Total</th>
                          <th className="text-center"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((line, index) => (
                          <tr key={index}>
                            <td>
                              <div>
                                <p className="font-medium">{line.product_name}</p>
                                <p className="text-xs text-gray-500">
                                  {line.product_code}
                                </p>
                              </div>
                            </td>
                            <td className="text-center">
                              <input
                                type="number"
                                min="1"
                                value={line.quantity}
                                onChange={(e) =>
                                  updateLine(
                                    index,
                                    'quantity',
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="input input-bordered input-sm w-24 text-center"
                              />
                            </td>
                            <td className="text-right">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={line.unit_price}
                                onChange={(e) =>
                                  updateLine(
                                    index,
                                    'unit_price',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="input input-bordered input-sm w-28 text-right"
                              />
                            </td>
                            <td className="text-right font-semibold">
                              {formatCurrency(
                                (line.quantity || 0) * (line.unit_price || 0)
                              )}
                            </td>
                            <td className="text-center">
                              <button
                                type="button"
                                onClick={() => removeLine(index)}
                                className="btn btn-ghost btn-sm btn-circle text-error"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {errors.lines && (
                  <p className="text-error text-sm mt-2">{errors.lines}</p>
                )}
              </div>
            </div>
          </div>

          {/* ---------- COLONNE DROITE - RÉSUMÉ ---------- */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 sticky top-6">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" /> Résumé
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Sous-total</span>
                    <span className="font-medium">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500">Remise</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.discount_value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discount_value: e.target.value,
                          })
                        }
                        className="input input-bordered input-sm w-20 text-right"
                      />
                      <select
                        value={formData.discount_type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discount_type: e.target.value,
                          })
                        }
                        className="select select-bordered select-sm w-24"
                      >
                        <option value="amount">FCFA</option>
                        <option value="percentage">%</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end text-xs text-gray-400">
                    - {formatCurrency(discountAmount)}
                  </div>

                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500">TVA</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.tax_rate}
                        onChange={(e) =>
                          setFormData({ ...formData, tax_rate: e.target.value })
                        }
                        className="input input-bordered input-sm w-20 text-right"
                      />
                      <span className="text-sm text-gray-400">%</span>
                    </div>
                  </div>
                  <div className="flex justify-end text-xs text-gray-400">
                    + {formatCurrency(taxAmount)}
                  </div>

                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500">Frais de livraison</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.shipping_cost}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shipping_cost: e.target.value,
                        })
                      }
                      className="input input-bordered input-sm w-28 text-right"
                    />
                  </div>

                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/commandes-fournisseurs')}
                    className="btn btn-ghost flex-1"
                    disabled={loading}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="btn btn-primary flex-1 gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enregistrement…
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Enregistrer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandeForm;