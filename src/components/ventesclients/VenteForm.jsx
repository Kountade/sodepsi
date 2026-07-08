// src/components/ventes/VenteForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, AlertCircle, CheckCircle,
  ShoppingCart, Package, Plus, Trash2, Search,
  CreditCard, Truck, Calendar, DollarSign,
  Loader2, Users, FileText, Filter, ChevronDown
} from 'lucide-react';

const VenteForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    client: '',
    delivery_date: '',
    payment_due_date: '',
    discount_type: 'percentage',
    discount_value: 0,
    tax_rate: 0,
    shipping_fee: 0,
    payment_method: '',
    delivery_method: '',
    delivery_address: '',
    notes: '',
    internal_notes: ''
  });
  const [lines, setLines] = useState([]);
  const [errors, setErrors] = useState({});
  const [backendErrors, setBackendErrors] = useState({});
  
  // États pour la sélection de produits
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [lineQuantity, setLineQuantity] = useState(1);
  const [linePrice, setLinePrice] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Charger les clients
  const fetchClients = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await AxiosInstance.get('/clients/?statut=actif', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setClients(response.data || []);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    }
  };

  // Charger les catégories
  const fetchCategories = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await AxiosInstance.get('/categories/?active=true', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setCategories(response.data || []);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    }
  };

  // Charger les produits
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const token = getToken();
      if (!token) {
        setLoadingProducts(false);
        return;
      }
      
      let url = '/products/';
      if (selectedCategory) {
        url += `?category=${selectedCategory}`;
      }
      
      const response = await AxiosInstance.get(url, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      showNotification('Erreur de chargement des produits', 'error');
    } finally {
      setLoadingProducts(false);
    }
  };

  // Charger la vente si édition
  const fetchVente = async () => {
    if (!isEdit) return;
    
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      const response = await AxiosInstance.get(`/sales/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      const data = response.data;
      setFormData({
        client: data.client || '',
        delivery_date: data.delivery_date || '',
        payment_due_date: data.payment_due_date || '',
        discount_type: data.discount_type || 'percentage',
        discount_value: parseFloat(data.discount_value) || 0,
        tax_rate: parseFloat(data.tax_rate) || 0,
        shipping_fee: parseFloat(data.shipping_fee) || 0,
        payment_method: data.payment_method || '',
        delivery_method: data.delivery_method || '',
        delivery_address: data.delivery_address || '',
        notes: data.notes || '',
        internal_notes: data.internal_notes || ''
      });
      setLines(data.lines || []);
    } catch (error) {
      console.error('Erreur chargement vente:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement des données', 'error');
        setTimeout(() => navigate('/ventes'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Recharger les produits quand la catégorie change
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  useEffect(() => {
    fetchClients();
    fetchCategories();
    if (isEdit) {
      fetchVente();
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (backendErrors[name]) {
      setBackendErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Filtrer les produits par recherche
  const filteredProducts = (products || []).filter(p => {
    if (!productSearch || productSearch.length < 1) return true;
    const searchLower = productSearch.toLowerCase();
    return (p.name?.toLowerCase() || '').includes(searchLower) ||
           (p.code?.toLowerCase() || '').includes(searchLower) ||
           (p.barcode?.toLowerCase() || '').includes(searchLower);
  });

  // Sélectionner un produit
  const selectProduct = (product) => {
    setSelectedProduct(product);
    setProductSearch(product.name);
    setLinePrice(parseFloat(product.selling_price) || 0);
    setShowProductDropdown(false);
  };

  // Ajouter une ligne
  const addLine = () => {
    if (!selectedProduct) {
      showNotification('Veuillez sélectionner un produit', 'error');
      return;
    }
    if (lineQuantity <= 0) {
      showNotification('La quantité doit être supérieure à 0', 'error');
      return;
    }

    const existingLine = lines.find(l => l.product === selectedProduct.id);
    if (existingLine) {
      showNotification('Ce produit est déjà dans la liste', 'error');
      return;
    }

    const newLine = {
      product: selectedProduct.id,
      product_name: selectedProduct.name,
      product_code: selectedProduct.code,
      quantity: parseInt(lineQuantity),
      unit_price: parseFloat(linePrice) || parseFloat(selectedProduct.selling_price),
      discount: 0,
      tax_rate: parseFloat(formData.tax_rate) || 0,
      total: (parseInt(lineQuantity) * (parseFloat(linePrice) || parseFloat(selectedProduct.selling_price)))
    };

    setLines([...lines, newLine]);
    setSelectedProduct(null);
    setProductSearch('');
    setLineQuantity(1);
    setLinePrice(0);
  };

  const removeLine = (index) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = parseFloat(value) || 0;
    newLines[index].total = newLines[index].quantity * newLines[index].unit_price;
    setLines(newLines);
  };

  const calculateTotals = () => {
    const subtotal = lines.reduce((sum, line) => sum + (line.total || 0), 0);
    const discountAmount = formData.discount_type === 'percentage' 
      ? subtotal * (parseFloat(formData.discount_value) / 100)
      : parseFloat(formData.discount_value);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (parseFloat(formData.tax_rate) / 100);
    const total = afterDiscount + taxAmount + parseFloat(formData.shipping_fee || 0);
    return { subtotal, discountAmount, taxAmount, total };
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.client) newErrors.client = 'Le client est requis';
    if (!formData.payment_due_date) newErrors.payment_due_date = 'La date d\'échéance est requise';
    if (lines.length === 0) newErrors.lines = 'Au moins un produit est requis';
    
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
    setBackendErrors({});
    
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      const url = isEdit ? `/sales/${id}/` : '/sales/';
      const method = isEdit ? 'put' : 'post';
      
      // Préparer les données pour l'API
      const dataToSend = {
        client: parseInt(formData.client),
        payment_due_date: formData.payment_due_date,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value) || 0,
        tax_rate: parseFloat(formData.tax_rate) || 0,
        shipping_fee: parseFloat(formData.shipping_fee) || 0,
        delivery_date: formData.delivery_date || null,
        payment_method: formData.payment_method || '',
        delivery_method: formData.delivery_method || '',
        delivery_address: formData.delivery_address || '',
        notes: formData.notes || '',
        internal_notes: formData.internal_notes || '',
        lines: lines.map(({ product, quantity, unit_price, discount, tax_rate }) => ({
          product: parseInt(product),
          quantity: parseInt(quantity),
          unit_price: parseFloat(unit_price),
          discount: parseFloat(discount) || 0,
          tax_rate: parseFloat(tax_rate) || 0
        }))
      };
      
      console.log('Données envoyées:', dataToSend);
      
      const response = await AxiosInstance[method](url, dataToSend, {
        headers: { 'Authorization': `Token ${token}` }
      });

      showNotification(
        isEdit ? 'Vente modifiée avec succès' : 'Vente créée avec succès',
        'success'
      );

      setTimeout(() => {
        navigate(`/ventes/${response.data.id}`);
      }, 1500);

    } catch (error) {
      console.error('Erreur complète:', error);
      
      if (error.response?.status === 400) {
        const backendData = error.response.data;
        console.log('Erreurs backend:', backendData);
        
        if (typeof backendData === 'object') {
          setBackendErrors(backendData);
          
          let errorMessage = 'Erreur de validation: ';
          const errorList = [];
          Object.keys(backendData).forEach(key => {
            const msg = Array.isArray(backendData[key]) 
              ? backendData[key][0] 
              : backendData[key];
            errorList.push(`${key}: ${msg}`);
          });
          errorMessage += errorList.join(', ');
          showNotification(errorMessage, 'error');
        } else {
          showNotification(backendData || 'Erreur de validation des données', 'error');
        }
      } else if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification(error.response?.data?.message || 'Erreur réseau', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const { subtotal, discountAmount, taxAmount, total } = calculateTotals();

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
              <button onClick={() => navigate('/ventes')} className="btn btn-ghost btn-sm gap-2">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/15 rounded-xl">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {isEdit ? 'Modifier la vente' : 'Nouvelle vente'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isEdit ? 'Modifiez les informations de la vente' : 'Créez une nouvelle vente'}
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
          
          {/* Informations générales */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Informations générales
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Champ Client */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Client <span className="text-error">*</span>
                  </label>
                  <select
                    name="client"
                    value={formData.client}
                    onChange={handleChange}
                    className={`select select-bordered w-full ${errors.client || backendErrors.client ? 'select-error' : ''}`}
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.code} - {client.name}
                      </option>
                    ))}
                  </select>
                  {(errors.client || backendErrors.client) && (
                    <p className="text-error text-xs mt-1">{backendErrors.client || errors.client}</p>
                  )}
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Date d'échéance <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    name="payment_due_date"
                    value={formData.payment_due_date}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.payment_due_date || backendErrors.payment_due_date ? 'input-error' : ''}`}
                  />
                  {(errors.payment_due_date || backendErrors.payment_due_date) && (
                    <p className="text-error text-xs mt-1">{backendErrors.payment_due_date || errors.payment_due_date}</p>
                  )}
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Date de livraison
                  </label>
                  <input
                    type="datetime-local"
                    name="delivery_date"
                    value={formData.delivery_date}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Produits */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" /> Produits
              </h3>
            </div>
            <div className="p-6">
              {/* Filtres */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    <Filter className="w-4 h-4 inline mr-1" /> Catégorie
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedProduct(null);
                      setProductSearch('');
                    }}
                  >
                    <option value="">Toutes les catégories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    <Search className="w-4 h-4 inline mr-1" /> Rechercher un produit
                  </label>
                  <input
                    type="text"
                    placeholder="Nom, code ou code-barres..."
                    className="input input-bordered w-full"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductDropdown(true);
                      if (e.target.value === '') {
                        setSelectedProduct(null);
                      }
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    onBlur={() => {
                      setTimeout(() => setShowProductDropdown(false), 300);
                    }}
                  />
                </div>
              </div>

              {/* Sélection du produit */}
              <div className="mb-4">
                <label className="label text-sm font-medium text-gray-700">
                  Produit <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <div 
                    className={`select select-bordered w-full flex items-center justify-between cursor-pointer min-h-[48px] ${
                      selectedProduct ? 'border-primary' : ''
                    }`}
                    onClick={() => setShowProductDropdown(!showProductDropdown)}
                  >
                    <span className={selectedProduct ? 'text-primary font-medium' : 'text-gray-400'}>
                      {selectedProduct ? selectedProduct.name : 'Sélectionner un produit'}
                    </span>
                    {selectedProduct ? (
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs btn-square"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(null);
                          setProductSearch('');
                        }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                  
                  {showProductDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {loadingProducts ? (
                        <div className="p-4 text-center text-gray-500">
                          <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                          Chargement des produits...
                        </div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p>Aucun produit trouvé</p>
                          <p className="text-xs text-gray-400">
                            {productSearch ? 'Essayez un autre terme' : 'Aucun produit dans cette catégorie'}
                          </p>
                        </div>
                      ) : (
                        filteredProducts.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b last:border-b-0 transition-colors"
                            onClick={() => selectProduct(p)}
                          >
                            <div className="flex-1">
                              <span className="font-medium">{p.name}</span>
                              <p className="text-xs text-gray-400">{p.code}</p>
                              {p.category_name && (
                                <span className="text-xs text-gray-400">Cat: {p.category_name}</span>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <span className="text-sm font-semibold text-primary">
                                {parseFloat(p.selling_price || 0).toLocaleString()} F
                              </span>
                              <p className="text-xs text-gray-400">Stock: {p.current_stock || 0}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {backendErrors.lines && (
                  <p className="text-error text-xs mt-1">{backendErrors.lines}</p>
                )}
              </div>

              {/* Quantité et prix */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">Quantité</label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={lineQuantity}
                    onChange={(e) => setLineQuantity(parseInt(e.target.value) || 1)}
                    min="1"
                  />
                </div>
                <div>
                  <label className="label text-sm font-medium text-gray-700">Prix unitaire (FCFA)</label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={linePrice}
                    onChange={(e) => setLinePrice(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="100"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    className="btn btn-primary w-full gap-2"
                    onClick={addLine}
                    disabled={!selectedProduct}
                  >
                    <Plus className="w-4 h-4" /> Ajouter
                  </button>
                </div>
              </div>

              {/* Lignes */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left text-sm font-semibold">Produit</th>
                      <th className="px-4 py-2 text-center text-sm font-semibold">Qté</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold">Prix unit.</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold">Remise</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold">Total</th>
                      <th className="px-4 py-2 text-center text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <p className="font-medium">{line.product_name}</p>
                          <p className="text-xs text-gray-400">{line.product_code}</p>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="number"
                            className="input input-bordered input-sm w-20 text-center"
                            value={line.quantity}
                            onChange={(e) => updateLine(index, 'quantity', parseInt(e.target.value) || 1)}
                            min="1"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            className="input input-bordered input-sm w-32 text-right"
                            value={line.unit_price}
                            onChange={(e) => updateLine(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="100"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            className="input input-bordered input-sm w-32 text-right"
                            value={line.discount}
                            onChange={(e) => updateLine(index, 'discount', parseFloat(e.target.value) || 0)}
                            min="0"
                          />
                        </td>
                        <td className="px-4 py-2 text-right font-semibold">
                          {(line.quantity * line.unit_price - (line.discount || 0)).toLocaleString()} F
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm btn-square text-error"
                            onClick={() => removeLine(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {lines.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          Aucun produit ajouté
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Totaux */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> Totaux
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">Type de remise</label>
                  <select
                    name="discount_type"
                    value={formData.discount_type}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    <option value="percentage">Pourcentage</option>
                    <option value="amount">Montant fixe</option>
                  </select>
                </div>
                <div>
                  <label className="label text-sm font-medium text-gray-700">Valeur de la remise</label>
                  <input
                    type="number"
                    name="discount_value"
                    value={formData.discount_value}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    min="0"
                    step="100"
                  />
                </div>
                <div>
                  <label className="label text-sm font-medium text-gray-700">TVA (%)</label>
                  <input
                    type="number"
                    name="tax_rate"
                    value={formData.tax_rate}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="label text-sm font-medium text-gray-700">Frais de livraison</label>
                  <input
                    type="number"
                    name="shipping_fee"
                    value={formData.shipping_fee}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    min="0"
                    step="100"
                  />
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500">Sous-total</p>
                    <p className="text-lg font-bold text-primary">{subtotal.toLocaleString()} F</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Remise</p>
                    <p className="text-lg font-bold text-error">-{discountAmount.toLocaleString()} F</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">TVA</p>
                    <p className="text-lg font-bold text-info">{taxAmount.toLocaleString()} F</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total TTC</p>
                    <p className="text-lg font-bold text-success">{total.toLocaleString()} F</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate('/ventes')}
              className="btn btn-ghost gap-2"
              disabled={submitting}
            >
              <X className="w-4 h-4" /> Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isEdit ? 'Modifier' : 'Créer'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default VenteForm;