// src/components/devis/DevisForm.jsx
// ============================================================
// VERSION COMPLÈTE CORRIGÉE - Compatible API DRF
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Plus, Trash2, Save, X,
  User, Calendar, DollarSign, FileText,
  Loader2, AlertCircle, CheckCircle, Package,
  Percent, Truck, Receipt, Warehouse
} from 'lucide-react';

// ============================================================
// ✅ ERROR BOUNDARY
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
    console.error('❌ ErrorBoundary DevisForm:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-4 text-error">
              <AlertCircle className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Erreur dans le formulaire de devis</h2>
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
                onClick={() => window.location.href = '/devis'}
                className="btn btn-ghost"
              >
                Retour aux devis
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
const DevisFormContent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    client: '',
    warehouse: '',
    valid_until: '',
    discount_type: 'percentage',
    discount_value: 0,
    tax_rate: 0,
    shipping_fee: 0,
    notes: '',
    internal_notes: '',
    lines: []
  });

  const [lineForm, setLineForm] = useState({
    product: '',
    quantity: 1,
    unit_price: 0,
    discount: 0,
    tax_rate: 0
  });

  // ============================================================
  // UTILITAIRES
  // ============================================================
  const getToken = () => localStorage.getItem('Token');

  const showNotification = useCallback((message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // ✅ Normalisation des réponses API
  const normalizeData = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  };

  // ============================================================
  // CHARGEMENT DES DONNÉES INITIALES
  // ============================================================
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const token = getToken();
        if (!token) {
          showNotification('Session expirée', 'error');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        console.log('🔍 Chargement des données DevisForm...');

        const [clientsRes, productsRes, warehousesRes] = await Promise.all([
          AxiosInstance.get('/clients/', {
            headers: { 'Authorization': `Token ${token}` }
          }).catch(err => {
            console.warn('⚠️ Erreur clients:', err.message);
            return { data: [] };
          }),
          AxiosInstance.get('/products/', {
            headers: { 'Authorization': `Token ${token}` }
          }).catch(err => {
            console.warn('⚠️ Erreur products:', err.message);
            return { data: [] };
          }),
          AxiosInstance.get('/warehouses/?active=true', {
            headers: { 'Authorization': `Token ${token}` }
          }).catch(err => {
            console.warn('⚠️ Erreur warehouses:', err.message);
            return { data: [] };
          })
        ]);

        if (!isMounted) return;

        const clientsData = normalizeData(clientsRes.data);
        const productsData = normalizeData(productsRes.data);
        const warehousesData = normalizeData(warehousesRes.data);

        console.log('✅ Données chargées:', {
          clients: clientsData.length,
          products: productsData.length,
          warehouses: warehousesData.length
        });

        setClients(clientsData);
        setProducts(productsData);
        setWarehouses(warehousesData);

        // Sélection automatique de l'entrepôt si un seul
        if (warehousesData.length === 1) {
          setFormData(prev => ({
            ...prev,
            warehouse: warehousesData[0].id
          }));
        }

      } catch (error) {
        console.error('❌ Erreur chargement données:', error);
        if (isMounted) {
          showNotification('Erreur de chargement des données', 'error');
        }
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, [navigate, showNotification]);

  // ============================================================
  // CHARGEMENT DU DEVIS EN MODE ÉDITION
  // ============================================================
  useEffect(() => {
    if (!isEdit || !id) return;

    let isMounted = true;

    const fetchDevis = async () => {
      setLoading(true);
      try {
        const token = getToken();
        if (!token) {
          showNotification('Session expirée', 'error');
          return;
        }

        const response = await AxiosInstance.get(`/devis/${id}/`, {
          headers: { 'Authorization': `Token ${token}` }
        });

        if (!isMounted) return;

        const data = response.data || {};

        // ✅ Normaliser les lignes
        const lignesData = normalizeData(data.lignes);

        setFormData({
          client: data.client?.id || data.client || '',
          warehouse: data.warehouse || '',
          valid_until: data.valid_until || '',
          discount_type: data.discount_type || 'percentage',
          discount_value: parseFloat(data.discount_value) || 0,
          tax_rate: parseFloat(data.tax_rate) || 0,
          shipping_fee: parseFloat(data.shipping_fee) || 0,
          notes: data.notes || '',
          internal_notes: data.internal_notes || '',
          lines: lignesData.map(line => ({
            id: line.id,
            product: line.product,
            product_name: line.product_name || '',
            quantity: parseInt(line.quantity) || 0,
            unit_price: parseFloat(line.unit_price) || 0,
            discount: parseFloat(line.discount) || 0,
            tax_rate: parseFloat(line.tax_rate) || 0,
            total: parseFloat(line.total) || 0
          }))
        });

      } catch (error) {
        console.error('❌ Erreur chargement devis:', error);
        if (isMounted) {
          showNotification('Erreur de chargement du devis', 'error');
          setTimeout(() => navigate('/devis'), 1500);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDevis();

    return () => { isMounted = false; };
  }, [id, isEdit, navigate, showNotification]);

  // ============================================================
  // CALCUL DES TOTAUX
  // ============================================================
  const calculateTotals = (lines) => {
    let subtotal = 0;

    (lines || []).forEach(line => {
      const qty = parseFloat(line.quantity) || 0;
      const price = parseFloat(line.unit_price) || 0;
      const disc = parseFloat(line.discount) || 0;
      subtotal += (qty * price) - disc;
    });

    const discountValue = parseFloat(formData.discount_value) || 0;
    const discountAmount = formData.discount_type === 'percentage'
      ? subtotal * (discountValue / 100)
      : discountValue;

    const afterDiscount = subtotal - discountAmount;
    const taxRate = parseFloat(formData.tax_rate) || 0;
    const totalTax = afterDiscount * (taxRate / 100);
    const shippingFee = parseFloat(formData.shipping_fee) || 0;
    const total = afterDiscount + totalTax + shippingFee;

    return {
      subtotal: isFinite(subtotal) ? subtotal : 0,
      discountAmount: isFinite(discountAmount) ? discountAmount : 0,
      totalTax: isFinite(totalTax) ? totalTax : 0,
      total: isFinite(total) ? total : 0
    };
  };

  const totals = calculateTotals(formData.lines);

  // ============================================================
  // AJOUTER UNE LIGNE
  // ============================================================
  const addLine = () => {
    if (!lineForm.product) {
      showNotification('Veuillez sélectionner un produit', 'error');
      return;
    }

    if (lineForm.quantity <= 0) {
      showNotification('La quantité doit être supérieure à 0', 'error');
      return;
    }

    const productId = parseInt(lineForm.product);
    const product = products.find(p => p.id === productId);
    if (!product) {
      showNotification('Produit non trouvé', 'error');
      return;
    }

    // Vérifier les doublons
    const productExists = formData.lines.some(
      line => parseInt(line.product) === productId
    );
    if (productExists) {
      showNotification(`Le produit "${product.name}" est déjà dans la liste`, 'warning');
      return;
    }

    const quantity = parseInt(lineForm.quantity) || 0;
    const unitPrice = parseFloat(lineForm.unit_price) || 0;
    const discount = parseFloat(lineForm.discount) || 0;
    const taxRate = parseFloat(lineForm.tax_rate) || 0;
    const total = (quantity * unitPrice) - discount;

    const newLine = {
      product: productId,
      product_name: product.name,
      quantity: quantity,
      unit_price: unitPrice,
      discount: discount,
      tax_rate: taxRate,
      total: total
    };

    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, newLine]
    }));

    // Réinitialiser le formulaire de ligne
    setLineForm({
      product: '',
      quantity: 1,
      unit_price: 0,
      discount: 0,
      tax_rate: 0
    });
  };

  // ============================================================
  // SUPPRIMER UNE LIGNE
  // ============================================================
  const removeLine = (index) => {
    const newLines = (formData.lines || []).filter((_, i) => i !== index);
    setFormData({ ...formData, lines: newLines });
  };

  // ============================================================
  // METTRE À JOUR UNE LIGNE
  // ============================================================
  const updateLine = (index, field, value) => {
    const newLines = [...formData.lines];
    const numericFields = ['quantity', 'unit_price', 'discount', 'tax_rate'];
    const newValue = numericFields.includes(field)
      ? (parseFloat(value) || 0)
      : value;

    newLines[index][field] = newValue;
    newLines[index].total =
      (parseFloat(newLines[index].quantity) || 0) *
      (parseFloat(newLines[index].unit_price) || 0) -
      (parseFloat(newLines[index].discount) || 0);

    setFormData({ ...formData, lines: newLines });
  };

  // ============================================================
  // SÉLECTIONNER UN PRODUIT
  // ============================================================
  const handleProductSelect = (productId) => {
    const id = parseInt(productId);
    const product = products.find(p => p.id === id);

    if (product) {
      setLineForm({
        ...lineForm,
        product: productId,
        unit_price: parseFloat(product.selling_price) || 0
      });
    } else {
      setLineForm({
        ...lineForm,
        product: productId,
        unit_price: 0
      });
    }
  };

  // ============================================================
  // SOUMISSION DU FORMULAIRE
  // ============================================================
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (saving) return;
    setSaving(true);

    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      if (!formData.client) {
        showNotification('Veuillez sélectionner un client', 'error');
        setSaving(false);
        return;
      }

      if (!formData.warehouse) {
        showNotification('Veuillez sélectionner un entrepôt', 'error');
        setSaving(false);
        return;
      }

      if (!formData.valid_until) {
        showNotification('Veuillez définir la date de validité', 'error');
        setSaving(false);
        return;
      }

      if (!formData.lines || formData.lines.length === 0) {
        showNotification('Ajoutez au moins un produit', 'error');
        setSaving(false);
        return;
      }

      const dataToSend = {
        client: formData.client || null,
        warehouse: formData.warehouse,
        valid_until: formData.valid_until,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value) || 0,
        tax_rate: parseFloat(formData.tax_rate) || 0,
        shipping_fee: parseFloat(formData.shipping_fee) || 0,
        notes: formData.notes || '',
        internal_notes: formData.internal_notes || '',
        lignes: (formData.lines || []).map(line => ({
          product: line.product,
          quantity: line.quantity,
          unit_price: line.unit_price,
          discount: line.discount,
          tax_rate: line.tax_rate
        }))
      };

      console.log('📤 Envoi devis:', dataToSend);

      let response;
      if (isEdit) {
        response = await AxiosInstance.put(`/devis/${id}/`, dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
      } else {
        response = await AxiosInstance.post('/devis/', dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
      }

      showNotification(
        isEdit ? 'Devis modifié avec succès' : 'Devis créé avec succès',
        'success'
      );
      setTimeout(() => navigate(`/devis/${response.data.id}`), 1500);

    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);

      let errorMessage = 'Erreur lors de la sauvegarde';

      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.lignes && Array.isArray(data.lignes)) {
          errorMessage = data.lignes[0];
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (typeof data === 'object') {
          const errors = [];
          Object.entries(data).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              errors.push(`${key}: ${value.join(', ')}`);
            } else if (typeof value === 'string') {
              errors.push(`${key}: ${value}`);
            }
          });
          if (errors.length > 0) errorMessage = errors.join('; ');
        }
      }

      showNotification(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // RENDU
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement du devis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown max-w-md w-full">
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/devis')} className="btn btn-ghost btn-sm gap-2">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                {isEdit ? 'Modifier le devis' : 'Nouveau devis'}
              </h1>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            className="btn btn-primary gap-2"
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations générales */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" /> Informations générales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Client <span className="text-error">*</span></span>
              </label>
              <select
                className="select select-bordered w-full"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                required
              >
                <option value="">Sélectionner un client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.code} - {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Entrepôt <span className="text-error">*</span></span>
              </label>
              <select
                className="select select-bordered w-full"
                value={formData.warehouse}
                onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                required
              >
                <option value="">Sélectionner un entrepôt</option>
                {warehouses.map(wh => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} - {wh.code}
                  </option>
                ))}
              </select>
              {warehouses.length === 1 && (
                <span className="text-xs text-success mt-1">✅ Entrepôt sélectionné automatiquement</span>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Valable jusqu'au <span className="text-error">*</span></span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        {/* Lignes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" /> Produits
          </h2>

          {/* Formulaire d'ajout de ligne */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4 p-4 bg-gray-50 rounded-xl">
            <div className="col-span-2">
              <select
                className="select select-bordered w-full"
                value={lineForm.product}
                onChange={(e) => handleProductSelect(e.target.value)}
              >
                <option value="">Produit</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.code} - {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <input
                type="number"
                placeholder="Qté"
                className="input input-bordered w-full"
                value={lineForm.quantity}
                onChange={(e) => setLineForm({ ...lineForm, quantity: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Prix"
                className="input input-bordered w-full"
                value={lineForm.unit_price}
                onChange={(e) => setLineForm({ ...lineForm, unit_price: parseFloat(e.target.value) || 0 })}
                step="0.01"
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Remise"
                className="input input-bordered w-full"
                value={lineForm.discount}
                onChange={(e) => setLineForm({ ...lineForm, discount: parseFloat(e.target.value) || 0 })}
                step="0.01"
              />
            </div>
            <div>
              <button
                type="button"
                onClick={addLine}
                className="btn btn-primary w-full gap-2"
              >
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>
          </div>

          {/* Liste des lignes */}
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left">Produit</th>
                  <th className="text-center">Qté</th>
                  <th className="text-right">Prix unit.</th>
                  <th className="text-right">Remise</th>
                  <th className="text-right">Total</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(formData.lines || []).map((line, index) => (
                  <tr key={index} className="border-b">
                    <td>
                      <span className="font-medium">{line.product_name}</span>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input input-bordered input-sm w-16 text-center"
                        value={line.quantity}
                        onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                        min="1"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input input-bordered input-sm w-24 text-right"
                        value={line.unit_price}
                        onChange={(e) => updateLine(index, 'unit_price', e.target.value)}
                        step="0.01"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input input-bordered input-sm w-20 text-right"
                        value={line.discount}
                        onChange={(e) => updateLine(index, 'discount', e.target.value)}
                        step="0.01"
                      />
                    </td>
                    <td className="text-right font-semibold text-primary">
                      {(parseFloat(line.total) || 0).toLocaleString('fr-FR')} FCFA
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
                {(!formData.lines || formData.lines.length === 0) && (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-400">
                      Aucun produit ajouté
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totaux */}
          {formData.lines && formData.lines.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <div className="flex justify-end">
                <div className="w-72 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sous-total</span>
                    <span className="font-semibold">{totals.subtotal.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remise</span>
                    <span className="text-error font-semibold">
                      -{totals.discountAmount.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">TVA ({formData.tax_rate}%)</span>
                    <span className="font-semibold">{totals.totalTax.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Frais de livraison</span>
                    <span className="font-semibold">
                      {(parseFloat(formData.shipping_fee) || 0).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total TTC</span>
                    <span className="text-primary">{totals.total.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Remises et taxes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" /> Remises et taxes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Type de remise</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={formData.discount_type}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
              >
                <option value="percentage">Pourcentage</option>
                <option value="amount">Montant</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Valeur remise</span>
              </label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                step="0.01"
                min="0"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">TVA (%)</span>
              </label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                step="0.01"
                min="0"
                max="100"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Frais de livraison</span>
              </label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={formData.shipping_fee}
                onChange={(e) => setFormData({ ...formData, shipping_fee: parseFloat(e.target.value) || 0 })}
                step="0.01"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Notes
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Notes (visibles sur le devis)</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Conditions de paiement, délais de livraison, etc."
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Notes internes</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                rows="2"
                value={formData.internal_notes}
                onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                placeholder="Notes pour usage interne uniquement"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/devis')}
            className="btn btn-ghost"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary gap-2"
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Enregistrement...' : 'Enregistrer le devis'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ============================================================
// WRAPPER avec ErrorBoundary
// ============================================================
const DevisForm = () => (
  <ErrorBoundary>
    <DevisFormContent />
  </ErrorBoundary>
);

export default DevisForm;