// src/components/ventes/VenteForm.jsx
// ============================================================
// VERSION COMPLÈTE AVEC GESTION AUTOMATIQUE DES LOTS (comme PosForm)
// ET SUPPRESSION DE LA DATE DE LIVRAISON
// ============================================================

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Plus, Trash2, Save, X,
  User, Calendar, DollarSign, FileText,
  Loader2, AlertCircle, CheckCircle, Package,
  Percent, Truck, ShoppingCart, Warehouse,
  Tag, Layers, Edit3, Eye
} from 'lucide-react';

const VenteForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  // ============================================================
  // ÉTATS
  // ============================================================
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [lots, setLots] = useState([]);
  const [notification, setNotification] = useState(null);

  // Formulaire principal - ✅ SUPPRESSION DE delivery_date
  const [formData, setFormData] = useState({
    client: '',
    warehouse: '',
    payment_due_date: '',
    discount_type: 'percentage',
    discount_value: 0,
    tax_rate: 0,
    shipping_fee: 0,
    payment_method: '',
    delivery_method: '',
    delivery_address: '',
    notes: '',
    internal_notes: '',
    lines: []
  });

  // Formulaire de ligne
  const [lineForm, setLineForm] = useState({
    product: '',
    quantity: 1,
    unit_price: 0,
    discount: 0,
    tax_rate: 0,
    price_type: 'detail'
  });

  // ============================================================
  // FONCTIONS UTILITAIRES
  // ============================================================
  
  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ============================================================
  // CHARGEMENT DES DONNÉES INITIALES
  // ============================================================
  
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
          AxiosInstance.get('/clients/', { 
            headers: { 'Authorization': `Token ${token}` } 
          }),
          AxiosInstance.get('/products/?status=active', { 
            headers: { 'Authorization': `Token ${token}` } 
          }),
          AxiosInstance.get('/warehouses/?active=true', { 
            headers: { 'Authorization': `Token ${token}` } 
          })
        ]);

        setClients(clientsRes.data || []);
        
        const productsData = productsRes.data || [];
        console.log('Produits chargés:', productsData.map(p => ({
          id: p.id,
          name: p.name,
          selling_price: p.selling_price,
          wholesale_price: p.wholesale_price,
          current_stock: p.current_stock
        })));
        
        setProducts(productsData);

        const warehousesData = warehousesRes.data || [];
        setWarehouses(warehousesData);

        // Sélection automatique de l'entrepôt
        if (warehousesData.length === 1) {
          setFormData(prev => ({
            ...prev,
            warehouse: warehousesData[0].id
          }));
        }

      } catch (error) {
        console.error('Erreur chargement données:', error);
        showNotification('Erreur de chargement des données', 'error');
      }
    };

    fetchData();
  }, []);

  // ============================================================
  // CHARGEMENT DES LOTS PAR ENTREPÔT
  // ============================================================
  
  useEffect(() => {
    if (formData.warehouse) {
      const fetchLots = async () => {
        try {
          const token = getToken();
          const response = await AxiosInstance.get(
            `/lots/?warehouse=${formData.warehouse}&available=true`,
            { headers: { 'Authorization': `Token ${token}` } }
          );
          setLots(response.data || []);
        } catch (error) {
          console.error('Erreur chargement lots:', error);
          setLots([]);
        }
      };
      fetchLots();
    } else {
      setLots([]);
    }
  }, [formData.warehouse]);

  // ============================================================
  // CHARGEMENT DE LA VENTE EN MODIFICATION
  // ============================================================
  
  useEffect(() => {
    if (isEdit && id) {
      const fetchVente = async () => {
        setLoading(true);
        try {
          const token = getToken();
          const response = await AxiosInstance.get(`/sales/${id}/`, {
            headers: { 'Authorization': `Token ${token}` }
          });

          const data = response.data;
          setFormData({
            client: data.client?.id || '',
            warehouse: data.warehouse || '',
            payment_due_date: data.payment_due_date || '',
            discount_type: data.discount_type || 'percentage',
            discount_value: data.discount_value || 0,
            tax_rate: data.tax_rate || 0,
            shipping_fee: data.shipping_fee || 0,
            payment_method: data.payment_method || '',
            delivery_method: data.delivery_method || '',
            delivery_address: data.delivery_address || '',
            notes: data.notes || '',
            internal_notes: data.internal_notes || '',
            lines: (data.lines || []).map(line => ({
              id: line.id,
              product: line.product,
              product_name: line.product_name || '',
              lot: line.lot || '',
              lot_number: line.lot_number || '',
              quantity: line.quantity || 0,
              unit_price: line.unit_price || 0,
              discount: line.discount || 0,
              tax_rate: line.tax_rate || 0,
              total: line.total || 0,
              price_type: line.price_type || 'detail'
            }))
          });
        } catch (error) {
          console.error('Erreur chargement vente:', error);
          showNotification('Erreur de chargement de la vente', 'error');
          setTimeout(() => navigate('/ventes'), 1500);
        } finally {
          setLoading(false);
        }
      };

      fetchVente();
    }
  }, [id, isEdit]);

  // ============================================================
  // CALCUL DES TOTAUX
  // ============================================================
  
  const calculateTotals = useCallback((lines) => {
    let subtotal = 0;
    let totalDiscount = 0;

    (lines || []).forEach(line => {
      const lineTotal = (line.quantity * line.unit_price) - line.discount;
      subtotal += lineTotal;
      totalDiscount += line.discount;
    });

    const discountAmount = formData.discount_type === 'percentage'
      ? subtotal * (formData.discount_value / 100)
      : formData.discount_value;

    const afterDiscount = subtotal - discountAmount;
    const totalTax = afterDiscount * (formData.tax_rate / 100);
    const total = afterDiscount + totalTax + formData.shipping_fee;

    return { subtotal, discountAmount, totalTax, total };
  }, [formData.discount_type, formData.discount_value, formData.tax_rate, formData.shipping_fee]);

  const totals = useMemo(() => calculateTotals(formData.lines), [calculateTotals, formData.lines]);

  // ============================================================
  // GESTION DES PRODUITS ET PRIX
  // ============================================================
  
  const getProductPrices = (productId) => {
    const product = products.find(p => p.id === parseInt(productId));
    if (!product) {
      return { selling_price: 0, wholesale_price: 0 };
    }
    return {
      selling_price: parseFloat(product.selling_price) || 0,
      wholesale_price: parseFloat(product.wholesale_price) || 0
    };
  };

  const getPriceByType = (productId, priceType) => {
    const prices = getProductPrices(productId);
    if (priceType === 'gros') {
      return prices.wholesale_price > 0 ? prices.wholesale_price : prices.selling_price;
    }
    return prices.selling_price;
  };

  const hasWholesalePrice = (productId) => {
    const prices = getProductPrices(productId);
    return prices.wholesale_price > 0;
  };

  const getProductById = (productId) => {
    return products.find(p => p.id === parseInt(productId)) || null;
  };

  // ============================================================
  // GESTION AUTOMATIQUE DES LOTS (comme PosForm)
  // ============================================================
  
  const getAvailableLotsForProduct = (productId) => {
    if (!productId || !formData.warehouse) return [];
    return (lots || []).filter(lot =>
      lot.product === parseInt(productId) &&
      (lot.available_quantity || 0) > 0
    );
  };

  const getBestLotForProduct = (productId, quantity) => {
    const availableLots = getAvailableLotsForProduct(productId);
    if (availableLots.length === 0) return null;
    
    // Tri FIFO par date d'expiration
    const sortedLots = [...availableLots].sort((a, b) => {
      if (a.expiry_date && b.expiry_date) {
        return new Date(a.expiry_date) - new Date(b.expiry_date);
      }
      if (a.expiry_date) return -1;
      if (b.expiry_date) return 1;
      return a.id - b.id;
    });
    
    // Trouver un lot avec assez de stock
    for (const lot of sortedLots) {
      if (lot.available_quantity >= quantity) {
        return lot;
      }
    }
    
    // Si aucun lot n'a assez de stock, prendre celui avec le plus grand stock
    return sortedLots.reduce((best, current) => 
      current.available_quantity > best.available_quantity ? current : best
    );
  };

  // VÉRIFICATION DU STOCK DISPONIBLE
  const checkStockAvailability = (productId, quantity) => {
    const product = getProductById(productId);
    if (!product) return { available: false, message: 'Produit non trouvé' };
    
    const availableStock = product.current_stock || 0;
    if (availableStock < quantity) {
      return { 
        available: false, 
        message: `Stock insuffisant pour ${product.name}. Disponible: ${availableStock}, Demandé: ${quantity}`
      };
    }
    
    // Vérifier les lots disponibles
    const availableLots = getAvailableLotsForProduct(productId);
    if (availableLots.length === 0) {
      return { 
        available: false, 
        message: `Aucun lot disponible pour ${product.name}`
      };
    }
    
    // Vérifier si la quantité totale est disponible dans les lots
    const totalAvailableInLots = availableLots.reduce((sum, lot) => sum + lot.available_quantity, 0);
    if (totalAvailableInLots < quantity) {
      return { 
        available: false, 
        message: `Stock insuffisant dans les lots pour ${product.name}. Disponible: ${totalAvailableInLots}, Demandé: ${quantity}`
      };
    }
    
    return { available: true };
  };

  // ============================================================
  // GESTION DES LIGNES
  // ============================================================
  
  const addLine = () => {
    if (adding) return;

    if (!lineForm.product) {
      showNotification('Veuillez sélectionner un produit', 'error');
      return;
    }

    const quantity = parseInt(lineForm.quantity) || 0;
    if (quantity <= 0) {
      showNotification('La quantité doit être supérieure à 0', 'error');
      return;
    }

    const productId = parseInt(lineForm.product);
    const product = getProductById(productId);
    if (!product) {
      showNotification('Produit non trouvé', 'error');
      return;
    }

    // VÉRIFICATION DU STOCK
    const stockCheck = checkStockAvailability(productId, quantity);
    if (!stockCheck.available) {
      showNotification(stockCheck.message, 'error');
      return;
    }

    // Vérification des doublons
    const productExists = formData.lines.some(
      line => parseInt(line.product) === productId
    );
    
    if (productExists) {
      showNotification(`Le produit "${product.name}" est déjà dans la liste`, 'warning');
      return;
    }

    // SÉLECTION AUTOMATIQUE DU MEILLEUR LOT
    const bestLot = getBestLotForProduct(productId, quantity);
    const lotId = bestLot?.id || null;
    const lotNumber = bestLot?.lot_number || '';

    // Gestion du prix
    const priceType = lineForm.price_type || 'detail';
    let unitPrice = parseFloat(lineForm.unit_price) || 0;
    
    if (unitPrice <= 0) {
      unitPrice = getPriceByType(productId, priceType);
    }
    
    if (unitPrice <= 0) {
      showNotification('Le prix unitaire doit être supérieur à 0', 'error');
      return;
    }

    if (priceType === 'gros' && !hasWholesalePrice(productId)) {
      showNotification(`Le produit "${product.name}" n'a pas de prix de gros défini. Utilisation du prix de détail.`, 'warning');
      unitPrice = getPriceByType(productId, 'detail');
    }

    const discount = parseFloat(lineForm.discount) || 0;
    const taxRate = parseFloat(lineForm.tax_rate) || 0;
    const total = (quantity * unitPrice) - discount;

    const newLine = {
      product: productId,
      product_name: product.name || 'Produit',
      lot: lotId,
      lot_number: lotNumber,
      quantity: quantity,
      unit_price: unitPrice,
      discount: discount,
      tax_rate: taxRate,
      total: total,
      price_type: priceType
    };

    setAdding(true);

    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, newLine]
    }));

    setLineForm({
      product: '',
      quantity: 1,
      unit_price: 0,
      discount: 0,
      tax_rate: 0,
      price_type: 'detail'
    });

    setTimeout(() => setAdding(false), 300);
  };

  const removeLine = (index) => {
    const newLines = (formData.lines || []).filter((_, i) => i !== index);
    setFormData({ ...formData, lines: newLines });
  };

  const updateLine = (index, field, value) => {
    const newLines = [...(formData.lines || [])];
    const newValue = parseFloat(value) || 0;

    if (field === 'quantity' || field === 'unit_price' || field === 'discount') {
      newLines[index][field] = newValue;
      newLines[index].total = (newLines[index].quantity * newLines[index].unit_price) - newLines[index].discount;
    } else {
      newLines[index][field] = newValue;
    }

    setFormData({ ...formData, lines: newLines });
  };

  // ============================================================
  // GESTION DU FORMULAIRE DE LIGNE
  // ============================================================
  
  const handleProductSelect = (productId) => {
    const id = parseInt(productId);
    const defaultPrice = getPriceByType(id, lineForm.price_type);
    
    setLineForm({
      ...lineForm,
      product: productId,
      unit_price: defaultPrice
    });
  };

  const handlePriceTypeChange = (type) => {
    const productId = lineForm.product ? parseInt(lineForm.product) : null;
    let newUnitPrice = lineForm.unit_price;
    
    if (productId) {
      newUnitPrice = getPriceByType(productId, type);
    }
    
    setLineForm({
      ...lineForm,
      price_type: type,
      unit_price: newUnitPrice
    });
  };

  const selectedProduct = lineForm.product ? getProductById(lineForm.product) : null;
  
  const availableLotsInfo = selectedProduct 
    ? getAvailableLotsForProduct(selectedProduct.id)
    : [];
  const totalLotsStock = availableLotsInfo.reduce((sum, lot) => sum + lot.available_quantity, 0);

  // ============================================================
  // SOUMISSION DU FORMULAIRE
  // ============================================================
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
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

      if (!formData.lines || formData.lines.length === 0) {
        showNotification('Ajoutez au moins un produit', 'error');
        setSaving(false);
        return;
      }

      // VÉRIFICATION GLOBALE DU STOCK
      for (const line of formData.lines) {
        const stockCheck = checkStockAvailability(line.product, line.quantity);
        if (!stockCheck.available) {
          showNotification(stockCheck.message, 'error');
          setSaving(false);
          return;
        }
      }

      // Date d'échéance automatique (30 jours)
      let paymentDueDate = formData.payment_due_date;
      if (!paymentDueDate) {
        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + 30);
        const year = dueDate.getFullYear();
        const month = String(dueDate.getMonth() + 1).padStart(2, '0');
        const day = String(dueDate.getDate()).padStart(2, '0');
        paymentDueDate = `${year}-${month}-${day}`;
      }

      const dataToSend = {
        client: formData.client || null,
        warehouse: formData.warehouse,
        delivery_date: null, // ✅ Toujours null
        payment_due_date: paymentDueDate,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value) || 0,
        tax_rate: parseFloat(formData.tax_rate) || 0,
        shipping_fee: parseFloat(formData.shipping_fee) || 0,
        payment_method: formData.payment_method || 'credit',
        delivery_method: formData.delivery_method || 'retrait',
        delivery_address: formData.delivery_address || '',
        notes: formData.notes || '',
        internal_notes: formData.internal_notes || '',
        lines: (formData.lines || []).map(line => ({
          product: line.product,
          lot: line.lot || null,
          quantity: line.quantity,
          unit_price: line.unit_price,
          discount: line.discount,
          tax_rate: line.tax_rate,
          price_type: line.price_type || 'detail'
        }))
      };

      let response;
      if (isEdit) {
        response = await AxiosInstance.put(`/sales/${id}/`, dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
      } else {
        response = await AxiosInstance.post('/sales/', dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
      }

      showNotification(isEdit ? 'Vente modifiée avec succès' : 'Vente créée avec succès', 'success');
      setTimeout(() => navigate(`/ventes/${response.data.id}`), 1500);

    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      
      let errorMessage = 'Erreur lors de la sauvegarde';
      
      if (error.response?.data) {
        const data = error.response.data;
        
        if (data.lines && Array.isArray(data.lines)) {
          errorMessage = data.lines[0] || 'Erreur de validation des produits';
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (typeof data === 'object') {
          const firstError = Object.values(data).flat()[0];
          if (firstError) {
            errorMessage = firstError;
          }
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
          <p className="text-base font-medium text-gray-500">Chargement de la vente...</p>
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
            <button onClick={() => navigate('/ventes')} className="btn btn-ghost btn-sm gap-2">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                {isEdit ? 'Modifier la vente' : 'Nouvelle vente'}
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
        {/* ========================================================== */}
        {/* INFORMATIONS GÉNÉRALES - ✅ SUPPRESSION DE LA DATE DE LIVRAISON */}
        {/* ========================================================== */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Informations générales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Client</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
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

            {/* ✅ Seulement la date d'échéance - La date de livraison est supprimée */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Date d'échéance paiement <span className="text-gray-400 text-xs">(optionnel - défaut 30 jours)</span></span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={formData.payment_due_date}
                onChange={(e) => setFormData({ ...formData, payment_due_date: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* PRODUITS - AVEC GESTION AUTOMATIQUE DES LOTS */}
        {/* ========================================================== */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" /> Produits
          </h2>

          {/* Affichage du stock et des lots disponibles */}
          {selectedProduct && (
            <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-700">Stock total:</span>
                <span className={`font-bold ${(selectedProduct.current_stock || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedProduct.current_stock || 0} unités
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-700">Lots disponibles:</span>
                <span className="font-bold text-blue-600">
                  {availableLotsInfo.length} lot(s)
                  {availableLotsInfo.length > 0 && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({totalLotsStock} unités)
                    </span>
                  )}
                </span>
              </div>
              {availableLotsInfo.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Meilleur lot:</span>
                  <span className="badge badge-primary badge-sm">
                    {availableLotsInfo[0]?.lot_number} 
                    (Dispo: {availableLotsInfo[0]?.available_quantity})
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <Tag className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-700">Prix détail:</span>
                <span className="font-bold text-blue-600">
                  {selectedProduct.selling_price?.toLocaleString('fr-FR') || 0} FCFA
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-green-600" />
                <span className="font-medium text-gray-700">Prix gros:</span>
                <span className={`font-bold ${selectedProduct.wholesale_price > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {selectedProduct.wholesale_price > 0 
                    ? selectedProduct.wholesale_price.toLocaleString('fr-FR') + ' FCFA'
                    : 'Non défini'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Prix sélectionné:</span>
                <span className="font-bold text-primary">
                  {lineForm.unit_price.toLocaleString('fr-FR') || 0} FCFA
                </span>
                <span className={`badge ${lineForm.price_type === 'gros' ? 'badge-primary' : 'badge-ghost'}`}>
                  {lineForm.price_type === 'gros' ? 'Gros' : 'Détail'}
                </span>
              </div>
            </div>
          )}

          {/* Formulaire d'ajout de ligne */}
          <div className="grid grid-cols-2 md:grid-cols-8 gap-3 mb-4 p-4 bg-gray-50 rounded-xl">
            {/* Produit */}
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
                    {product.current_stock !== undefined && ` (Stock: ${product.current_stock})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantité */}
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

            {/* TYPE DE PRIX - DÉTAIL / GROS */}
            <div className="col-span-2">
              <div className="flex rounded-lg border border-gray-200 overflow-hidden h-[42px]">
                <button
                  type="button"
                  className={`flex-1 px-3 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                    lineForm.price_type === 'detail'
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => handlePriceTypeChange('detail')}
                >
                  <Tag className="w-4 h-4" />
                  Détail
                  {selectedProduct && (
                    <span className="text-xs opacity-75">
                      ({selectedProduct.selling_price?.toLocaleString('fr-FR') || 0} FCFA)
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  className={`flex-1 px-3 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                    lineForm.price_type === 'gros'
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => handlePriceTypeChange('gros')}
                >
                  <Layers className="w-4 h-4" />
                  Gros
                  {selectedProduct && selectedProduct.wholesale_price > 0 && (
                    <span className="text-xs opacity-75">
                      ({selectedProduct.wholesale_price?.toLocaleString('fr-FR') || 0} FCFA)
                    </span>
                  )}
                  {selectedProduct && (!selectedProduct.wholesale_price || selectedProduct.wholesale_price <= 0) && (
                    <span className="text-xs text-warning">(Prix détail utilisé)</span>
                  )}
                </button>
              </div>
            </div>

            {/* Prix unitaire */}
            <div>
              <input
                type="number"
                placeholder="Prix unit."
                className="input input-bordered w-full"
                value={lineForm.unit_price}
                onChange={(e) => setLineForm({ ...lineForm, unit_price: parseFloat(e.target.value) || 0 })}
                step="0.01"
              />
            </div>

            {/* Remise */}
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

            {/* Bouton Ajouter */}
            <div>
              <button
                type="button"
                onClick={addLine}
                className="btn btn-primary w-full gap-2 h-[42px]"
                disabled={adding}
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {adding ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </div>

          {/* Liste des lignes */}
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left">Produit</th>
                  <th className="text-center">Lot</th>
                  <th className="text-center">Type</th>
                  <th className="text-center">Qté</th>
                  <th className="text-right">Prix unit.</th>
                  <th className="text-right">Remise</th>
                  <th className="text-right">Total</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(formData.lines || []).map((line, index) => {
                  const product = getProductById(line.product);
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td>
                        <span className="font-medium">{line.product_name}</span>
                      </td>
                      <td className="text-center">
                        <span className="text-sm text-gray-500">{line.lot_number || '-'}</span>
                        {line.lot_number && (
                          <span className="text-xs text-success ml-1">✅</span>
                        )}
                      </td>
                      <td className="text-center">
                        <span className={`badge ${line.price_type === 'gros' ? 'badge-primary' : 'badge-ghost'}`}>
                          {line.price_type === 'gros' ? 'Gros' : 'Détail'}
                        </span>
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
                  );
                })}
                {(!formData.lines || formData.lines.length === 0) && (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-400">
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
                <div className="w-80 space-y-2">
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

        {/* ========================================================== */}
        {/* REMISES ET TAXES */}
        {/* ========================================================== */}
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

        {/* ========================================================== */}
        {/* LIVRAISON ET PAIEMENT */}
        {/* ========================================================== */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" /> Livraison et paiement
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Méthode de livraison</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={formData.delivery_method}
                onChange={(e) => setFormData({ ...formData, delivery_method: e.target.value })}
              >
                <option value="">Sélectionner</option>
                <option value="retrait">Retrait en magasin</option>
                <option value="livraison">Livraison à domicile</option>
                <option value="transporteur">Transporteur</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Méthode de paiement</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              >
                <option value="">Sélectionner</option>
                <option value="cash">Espèces</option>
                <option value="card">Carte bancaire</option>
                <option value="check">Chèque</option>
                <option value="transfer">Virement</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="credit">Crédit</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Adresse de livraison</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={formData.delivery_address}
                onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                placeholder="Adresse complète"
              />
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* NOTES */}
        {/* ========================================================== */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Notes
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Notes</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes sur la vente"
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

        {/* ========================================================== */}
        {/* ACTIONS */}
        {/* ========================================================== */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/ventes')}
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
            {saving ? 'Enregistrement...' : 'Enregistrer la vente'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VenteForm;