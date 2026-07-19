// src/components/devis/DevisForm.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Plus, Trash2, Save, X, 
  User, Calendar, DollarSign, FileText,
  Loader2, AlertCircle, CheckCircle, Package,
  Percent, Truck, Receipt, Warehouse
} from 'lucide-react';

const DevisForm = () => {
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

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Charger les données initiales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken();
        if (!token) {
          showNotification('Session expirée', 'error');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const [clientsRes, productsRes, warehousesRes] = await Promise.all([
          AxiosInstance.get('/clients/', { headers: { 'Authorization': `Token ${token}` } }),
          AxiosInstance.get('/products/', { headers: { 'Authorization': `Token ${token}` } }),
          AxiosInstance.get('/warehouses/?active=true', { headers: { 'Authorization': `Token ${token}` } })
        ]);

        setClients(clientsRes.data);
        setProducts(productsRes.data);
        setWarehouses(warehousesRes.data);
      } catch (error) {
        console.error('Erreur chargement données:', error);
        showNotification('Erreur de chargement des données', 'error');
      }
    };

    fetchData();
  }, []);

  // Charger le devis si en mode édition
  useEffect(() => {
    if (isEdit && id) {
      const fetchDevis = async () => {
        setLoading(true);
        try {
          const token = getToken();
          const response = await AxiosInstance.get(`/devis/${id}/`, {
            headers: { 'Authorization': `Token ${token}` }
          });

          const data = response.data;
          setFormData({
            client: data.client?.id || '',
            warehouse: data.warehouse || '',
            valid_until: data.valid_until || '',
            discount_type: data.discount_type || 'percentage',
            discount_value: data.discount_value || 0,
            tax_rate: data.tax_rate || 0,
            shipping_fee: data.shipping_fee || 0,
            notes: data.notes || '',
            internal_notes: data.internal_notes || '',
            lines: data.lignes.map(line => ({
              id: line.id,
              product: line.product,
              product_name: line.product_name,
              quantity: line.quantity,
              unit_price: line.unit_price,
              discount: line.discount,
              tax_rate: line.tax_rate,
              total: line.total
            }))
          });
        } catch (error) {
          console.error('Erreur chargement devis:', error);
          showNotification('Erreur de chargement du devis', 'error');
          setTimeout(() => navigate('/devis'), 1500);
        } finally {
          setLoading(false);
        }
      };

      fetchDevis();
    }
  }, [id, isEdit]);

  // Calculer les totaux
  const calculateTotals = (lines) => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    lines.forEach(line => {
      const lineTotal = (line.quantity * line.unit_price) - line.discount;
      subtotal += lineTotal;
      totalDiscount += line.discount;
    });

    const discountAmount = formData.discount_type === 'percentage' 
      ? subtotal * (formData.discount_value / 100) 
      : formData.discount_value;

    const afterDiscount = subtotal - discountAmount;
    totalTax = afterDiscount * (formData.tax_rate / 100);
    const total = afterDiscount + totalTax + formData.shipping_fee;

    return { subtotal, discountAmount, totalTax, total };
  };

  const totals = calculateTotals(formData.lines);

  // Ajouter une ligne
  const addLine = () => {
    if (!lineForm.product) {
      showNotification('Veuillez sélectionner un produit', 'error');
      return;
    }

    if (lineForm.quantity <= 0) {
      showNotification('La quantité doit être supérieure à 0', 'error');
      return;
    }

    const product = products.find(p => p.id === parseInt(lineForm.product));
    if (!product) return;

    const newLine = {
      product: parseInt(lineForm.product),
      product_name: product.name,
      quantity: parseInt(lineForm.quantity),
      unit_price: parseFloat(lineForm.unit_price) || 0,
      discount: parseFloat(lineForm.discount) || 0,
      tax_rate: parseFloat(lineForm.tax_rate) || 0,
      total: (parseFloat(lineForm.quantity) * parseFloat(lineForm.unit_price)) - parseFloat(lineForm.discount)
    };

    setFormData({
      ...formData,
      lines: [...formData.lines, newLine]
    });

    // Réinitialiser le formulaire de ligne
    setLineForm({
      product: '',
      quantity: 1,
      unit_price: 0,
      discount: 0,
      tax_rate: 0
    });
  };

  // Supprimer une ligne
  const removeLine = (index) => {
    const newLines = formData.lines.filter((_, i) => i !== index);
    setFormData({ ...formData, lines: newLines });
  };

  // Mettre à jour une ligne
  const updateLine = (index, field, value) => {
    const newLines = [...formData.lines];
    newLines[index][field] = parseFloat(value) || 0;
    newLines[index].total = (newLines[index].quantity * newLines[index].unit_price) - newLines[index].discount;
    setFormData({ ...formData, lines: newLines });
  };

  // Sélectionner un produit
  const handleProductSelect = (productId) => {
    const product = products.find(p => p.id === parseInt(productId));
    if (product) {
      setLineForm({
        ...lineForm,
        product: productId,
        unit_price: product.selling_price || 0
      });
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      if (!formData.warehouse) {
        showNotification('Veuillez sélectionner un entrepôt', 'error');
        setSaving(false);
        return;
      }

      if (formData.lines.length === 0) {
        showNotification('Ajoutez au moins un produit', 'error');
        setSaving(false);
        return;
      }

      const dataToSend = {
        client: formData.client,
        warehouse: formData.warehouse,
        valid_until: formData.valid_until,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value) || 0,
        tax_rate: parseFloat(formData.tax_rate) || 0,
        shipping_fee: parseFloat(formData.shipping_fee) || 0,
        notes: formData.notes,
        internal_notes: formData.internal_notes,
        lignes: formData.lines.map(line => ({
          product: line.product,
          quantity: line.quantity,
          unit_price: line.unit_price,
          discount: line.discount,
          tax_rate: line.tax_rate
        }))
      };

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

      showNotification(isEdit ? 'Devis modifié avec succès' : 'Devis créé avec succès', 'success');
      setTimeout(() => navigate(`/devis/${response.data.id}`), 1500);

    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      showNotification('Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

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
                onChange={(e) => setLineForm({ ...lineForm, quantity: parseInt(e.target.value) || 0 })}
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
                {formData.lines.map((line, index) => (
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
                      {line.total.toLocaleString('fr-FR')} FCFA
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
                {formData.lines.length === 0 && (
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
          {formData.lines.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <div className="flex justify-end">
                <div className="w-72 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sous-total</span>
                    <span className="font-semibold">{totals.subtotal.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remise</span>
                    <span className="text-error font-semibold">-{totals.discountAmount.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">TVA ({formData.tax_rate}%)</span>
                    <span className="font-semibold">{totals.totalTax.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Frais de livraison</span>
                    <span className="font-semibold">{formData.shipping_fee.toLocaleString('fr-FR')} FCFA</span>
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
                <span className="label-text font-medium">Notes (visible sur le devis)</span>
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

export default DevisForm;