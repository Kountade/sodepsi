// src/components/achats/CommandeForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Save, X, ShoppingCart, RefreshCw, ArrowLeft, Truck,
  Plus, Trash2, CheckCircle, AlertCircle, DollarSign, Calendar
} from 'lucide-react';

const CommandeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    supplier: '',
    expected_delivery_date: '',
    discount_type: 'amount',
    discount_value: 0,
    tax_rate: 0,
    shipping_cost: 0,
    notes: '',
    internal_notes: '',
    shipping_address: ''
  });
  
  const [lines, setLines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedUnitPrice, setSelectedUnitPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchSuppliers = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/suppliers/?is_active=true', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setSuppliers(response.data);
    } catch (error) {
      console.error('Erreur chargement fournisseurs:', error);
    }
  };

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

  const loadCommande = async () => {
    if (!isEditMode) {
      setFetching(false);
      return;
    }
    
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/purchase-orders/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
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
        shipping_address: data.shipping_address || ''
      });
      setLines(data.lines || []);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Impossible de charger la commande', 'error');
      navigate('/commandes-fournisseurs');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
    loadCommande();
  }, [id]);

  const addLine = () => {
    if (!selectedProduct) {
      showNotification('Sélectionnez un produit', 'error');
      return;
    }
    if (selectedQuantity <= 0) {
      showNotification('La quantité doit être supérieure à 0', 'error');
      return;
    }
    
    const product = products.find(p => p.id === parseInt(selectedProduct));
    const existingLine = lines.find(l => l.product === parseInt(selectedProduct));
    
    if (existingLine) {
      setLines(lines.map(l => 
        l.product === parseInt(selectedProduct) 
          ? { ...l, quantity: l.quantity + selectedQuantity }
          : l
      ));
    } else {
      setLines([...lines, {
        product: parseInt(selectedProduct),
        product_name: product.name,
        product_code: product.code,
        quantity: selectedQuantity,
        unit_price: selectedUnitPrice || product.purchase_price,
        discount: 0,
        tax_rate: formData.tax_rate,
        notes: ''
      }]);
    }
    
    setSelectedProduct('');
    setSelectedQuantity(1);
    setSelectedUnitPrice(0);
  };

  const removeLine = (index) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index, field, value) => {
    const updatedLines = [...lines];
    updatedLines[index][field] = value;
    setLines(updatedLines);
  };

  const calculateSubtotal = () => {
    return lines.reduce((sum, line) => sum + (line.quantity * line.unit_price), 0);
  };

  const calculateDiscount = (subtotal) => {
    if (formData.discount_type === 'percentage') {
      return subtotal * (formData.discount_value / 100);
    }
    return formData.discount_value;
  };

  const calculateTax = (subtotal, discountAmount) => {
    return (subtotal - discountAmount) * (formData.tax_rate / 100);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscount(subtotal);
    const taxAmount = calculateTax(subtotal, discountAmount);
    return subtotal - discountAmount + taxAmount + formData.shipping_cost;
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.supplier) newErrors.supplier = 'Le fournisseur est requis';
    if (!formData.expected_delivery_date) newErrors.expected_delivery_date = 'La date de livraison est requise';
    if (lines.length === 0) newErrors.lines = 'Ajoutez au moins un produit';
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
        lines: lines.map(line => ({
          product: line.product,
          quantity: line.quantity,
          unit_price: line.unit_price,
          discount: line.discount || 0,
          tax_rate: line.tax_rate || formData.tax_rate,
          notes: line.notes || ''
        }))
      };
      
      if (isEditMode) {
        await AxiosInstance.patch(`/purchase-orders/${id}/`, dataToSend, { headers });
        showNotification('Commande modifiée avec succès', 'success');
      } else {
        await AxiosInstance.post('/purchase-orders/', dataToSend, { headers });
        showNotification('Commande créée avec succès', 'success');
      }
      
      setTimeout(() => navigate('/commandes-fournisseurs'), 1500);
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

  const subtotal = calculateSubtotal();
  const discountAmount = calculateDiscount(subtotal);
  const taxAmount = calculateTax(subtotal, discountAmount);
  const total = calculateTotal();

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

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/commandes-fournisseurs')} className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">{isEditMode ? 'Modifier' : 'Nouvelle'} commande</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {isEditMode ? 'Modifiez les informations de la commande' : 'Créez un bon de commande fournisseur'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire principal */}
          <div className="lg:col-span-2 space-y-6">
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
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                      className={`select select-bordered w-full ${errors.supplier ? 'select-error' : ''}`}
                    >
                      <option value="">Sélectionner un fournisseur</option>
                      {suppliers.map(sup => (
                        <option key={sup.id} value={sup.id}>{sup.name}</option>
                      ))}
                    </select>
                    {errors.supplier && <span className="text-error text-xs mt-1">{errors.supplier}</span>}
                  </div>

                  <div className="form-control">
                    <label className="label text-sm font-medium text-gray-700">
                      Date livraison prévue <span className="text-error">*</span>
                    </label>
                    <input
                      type="date"
                      name="expected_delivery_date"
                      value={formData.expected_delivery_date}
                      onChange={(e) => setFormData({...formData, expected_delivery_date: e.target.value})}
                      className={`input input-bordered w-full ${errors.expected_delivery_date ? 'input-error' : ''}`}
                    />
                    {errors.expected_delivery_date && <span className="text-error text-xs mt-1">{errors.expected_delivery_date}</span>}
                  </div>
                </div>

                <div className="form-control">
                  <label className="label text-sm font-medium text-gray-700">Adresse de livraison</label>
                  <textarea
                    name="shipping_address"
                    value={formData.shipping_address}
                    onChange={(e) => setFormData({...formData, shipping_address: e.target.value})}
                    className="textarea textarea-bordered w-full"
                    rows="2"
                    placeholder="Adresse de livraison (si différente)"
                  />
                </div>

                <div className="form-control">
                  <label className="label text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="textarea textarea-bordered w-full"
                    rows="2"
                    placeholder="Notes publiques (visibles sur la commande)"
                  />
                </div>

                <div className="form-control">
                  <label className="label text-sm font-medium text-gray-700">Notes internes</label>
                  <textarea
                    name="internal_notes"
                    value={formData.internal_notes}
                    onChange={(e) => setFormData({...formData, internal_notes: e.target.value})}
                    className="textarea textarea-bordered w-full"
                    rows="2"
                    placeholder="Notes internes (non visibles par le fournisseur)"
                  />
                </div>
              </div>
            </div>

            {/* Lignes de commande */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" /> Lignes de commande
                </h3>
              </div>
              
              <div className="p-6">
                {/* Ajout de ligne */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
                  <select
                    value={selectedProduct}
                    onChange={(e) => {
                      setSelectedProduct(e.target.value);
                      const product = products.find(p => p.id === parseInt(e.target.value));
                      if (product) setSelectedUnitPrice(product.purchase_price);
                    }}
                    className="select select-bordered"
                  >
                    <option value="">Sélectionner un produit</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Quantité"
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(parseInt(e.target.value))}
                    className="input input-bordered"
                  />
                  <input
                    type="number"
                    placeholder="Prix unitaire"
                    value={selectedUnitPrice}
                    onChange={(e) => setSelectedUnitPrice(parseFloat(e.target.value))}
                    className="input input-bordered"
                  />
                  <button type="button" onClick={addLine} className="btn btn-primary gap-2">
                    <Plus className="w-4 h-4" /> Ajouter
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
                                <p className="text-xs text-gray-500">{line.product_code}</p>
                              </div>
                            </td>
                            <td className="text-center">
                              <input
                                type="number"
                                value={line.quantity}
                                onChange={(e) => updateLine(index, 'quantity', parseInt(e.target.value))}
                                className="input input-bordered input-sm w-24 text-center"
                              />
                            </td>
                            <td className="text-right">
                              <input
                                type="number"
                                value={line.unit_price}
                                onChange={(e) => updateLine(index, 'unit_price', parseFloat(e.target.value))}
                                className="input input-bordered input-sm w-28 text-right"
                              />
                            </td>
                            <td className="text-right font-semibold">
                              {(line.quantity * line.unit_price).toLocaleString()} F
                            </td>
                            <td className="text-center">
                              <button type="button" onClick={() => removeLine(index)} className="btn btn-ghost btn-sm btn-circle text-error">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {errors.lines && <p className="text-error text-sm mt-2">{errors.lines}</p>}
              </div>
            </div>
          </div>

          {/* Résumé */}
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
                    <span className="font-medium">{subtotal.toLocaleString()} F</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Remise</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={formData.discount_value}
                        onChange={(e) => setFormData({...formData, discount_value: parseFloat(e.target.value)})}
                        className="input input-bordered input-sm w-20 text-right"
                      />
                      <select
                        value={formData.discount_type}
                        onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                        className="select select-bordered select-sm w-24"
                      >
                        <option value="amount">FCFA</option>
                        <option value="percentage">%</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end text-xs text-gray-400">
                    - {discountAmount.toLocaleString()} F
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">TVA ({formData.tax_rate}%)</span>
                    <span className="font-medium">{taxAmount.toLocaleString()} F</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Frais de livraison</span>
                    <input
                      type="number"
                      value={formData.shipping_cost}
                      onChange={(e) => setFormData({...formData, shipping_cost: parseFloat(e.target.value)})}
                      className="input input-bordered input-sm w-28 text-right"
                    />
                  </div>

                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">{total.toLocaleString()} F</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => navigate('/commandes-fournisseurs')} className="btn btn-ghost flex-1" disabled={loading}>
                    Annuler
                  </button>
                  <button type="submit" onClick={handleSubmit} className="btn btn-primary flex-1 gap-2" disabled={loading}>
                    {loading ? <span className="loading loading-spinner loading-sm"></span> : <><Save className="w-4 h-4" /> Enregistrer</>}
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