// src/components/pos/PosScanSimple.jsx
// ============================================================
// VERSION OPTIMISEE - SANS AFFICHAGE DU NOMBRE DE PRODUITS
// Scan à gauche / Panier à droite - Chargement invisible
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Minus, Trash2, RefreshCw,
  ShoppingCart, X, AlertCircle, CheckCircle,
  User, Receipt, Loader, Barcode,
  Save, Tag, Layers, Warehouse, Package
} from 'lucide-react';

const PosScanSimple = () => {
  const navigate = useNavigate();
  const barcodeInputRef = useRef(null);
  const validateButtonRef = useRef(null);

  // États
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [priceType, setPriceType] = useState('detail');
  const [barcodeValue, setBarcodeValue] = useState('');
  const [isBarcodeFocused, setIsBarcodeFocused] = useState(false);
  const [lastBarcode, setLastBarcode] = useState('');
  const [editingQuantity, setEditingQuantity] = useState(null);
  const [quantityInput, setQuantityInput] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);

  const getToken = () => localStorage.getItem('Token');

  // ============================================================
  // 1. CHARGEMENT DES DONNEES - INVISIBLE POUR L'UTILISATEUR
  // ============================================================
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    if (imagePath.startsWith('/media/')) {
      return `http://127.0.0.1:8000${imagePath}`;
    }
    if (imagePath.startsWith('/')) {
      return `http://127.0.0.1:8000${imagePath}`;
    }
    return `http://127.0.0.1:8000/media/${imagePath}`;
  };

  const fetchData = async () => {
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const headers = { 'Authorization': `Token ${token}` };

      // Charger les produits en arrière-plan
      const [productsRes, customersRes, warehousesRes] = await Promise.all([
        AxiosInstance.get('/products/?status=active&limit=500', { headers }),
        AxiosInstance.get('/clients/?limit=100', { headers }),
        AxiosInstance.get('/warehouses/?active=true', { headers })
      ]);

      const productsWithData = (productsRes.data || []).map(product => ({
        ...product,
        image_url: product.image_url || getImageUrl(product.image),
        stock_quantity: product.current_stock || 0,
        selling_price: parseFloat(product.selling_price) || 0,
        wholesale_price: parseFloat(product.wholesale_price) || 0,
        barcode: product.barcode || '',
        display_price: priceType === 'gros' 
          ? (parseFloat(product.wholesale_price) || parseFloat(product.selling_price) || 0)
          : (parseFloat(product.selling_price) || 0)
      }));

      setProducts(productsWithData);
      setCustomers(customersRes.data || []);
      setWarehouses(warehousesRes.data || []);
      
      if (warehousesRes.data && warehousesRes.data.length > 0) {
        setSelectedWarehouse(warehousesRes.data[0]);
      }

      setDataLoaded(true);

    } catch (error) {
      console.error('Erreur chargement données:', error);
      showNotification('Erreur de chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Chargement immédiat
    fetchData();
    
    // Focus sur le champ scan après un court délai
    setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }, 300);
  }, []);

  useEffect(() => {
    // Mettre à jour les prix affichés
    setProducts(prevProducts => 
      prevProducts.map(product => ({
        ...product,
        display_price: priceType === 'gros'
          ? (product.wholesale_price || product.selling_price || 0)
          : (product.selling_price || 0)
      }))
    );
  }, [priceType]);

  // ============================================================
  // 2. GESTION DU CODE-BARRES - RECHERCHE RAPIDE
  // ============================================================
  const handleBarcodeScan = (e) => {
    const value = e.target.value.trim();
    setBarcodeValue(value);

    if (value.length >= 8) {
      if (value === lastBarcode) {
        return;
      }

      // Recherche rapide dans le cache local
      const product = products.find(p => p.barcode === value);
      
      if (product) {
        addToCart(product);
        setBarcodeValue('');
        e.target.value = '';
        setLastBarcode(value);
        showNotification(`${product.name} ajouté au panier`, 'success');
        
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        
        // Re-focus immédiat
        setTimeout(() => {
          if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
            barcodeInputRef.current.select();
          }
        }, 50);
      } else {
        showNotification(`Code-barres "${value}" non trouvé`, 'error');
        setTimeout(() => {
          setBarcodeValue('');
          e.target.value = '';
          if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
            barcodeInputRef.current.select();
          }
        }, 1000);
      }
    }
  };

  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      const value = e.target.value.trim();
      if (value.length >= 8) {
        handleBarcodeScan(e);
      } else if (value.length > 0) {
        showNotification('Code-barres trop court', 'error');
        setTimeout(() => {
          setBarcodeValue('');
          e.target.value = '';
          if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
            barcodeInputRef.current.select();
          }
        }, 800);
      }
      e.preventDefault();
    }
  };

  // ============================================================
  // 3. GESTION DU PANIER - RAPIDE ET FLUIDE
  // ============================================================
  const addToCart = (product, quantity = 1) => {
    if (product.stock_quantity <= 0) {
      showNotification(`Stock épuisé pour ${product.name}`, 'error');
      return;
    }

    const unitPrice = priceType === 'gros'
      ? (product.wholesale_price || product.selling_price || 0)
      : (product.selling_price || 0);

    if (unitPrice <= 0) {
      showNotification(`Prix non défini pour ${product.name}`, 'error');
      return;
    }

    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    let currentQty = 0;
    if (existingIndex !== -1) {
      currentQty = cart[existingIndex].quantity;
    }
    
    const totalQty = currentQty + quantity;
    if (totalQty > product.stock_quantity) {
      showNotification(`Stock insuffisant pour ${product.name}`, 'error');
      return;
    }

    if (existingIndex !== -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity = totalQty;
      newCart[existingIndex].unit_price = unitPrice;
      newCart[existingIndex].price_type = priceType;
      newCart[existingIndex].total = totalQty * unitPrice;
      setCart(newCart);
    } else {
      setCart([...cart, {
        id: Date.now(),
        product: product,
        quantity: quantity,
        unit_price: unitPrice,
        price_type: priceType,
        total: unitPrice * quantity
      }]);
    }
  };

  const updateCartQuantityDirect = (itemId, newQuantity) => {
    const itemIndex = cart.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    let qty = parseInt(newQuantity);
    if (isNaN(qty) || qty < 1) {
      qty = 1;
    }

    const product = cart[itemIndex].product;
    if (qty > product.stock_quantity) {
      showNotification(`Stock insuffisant pour ${product.name}`, 'error');
      return;
    }

    const newCart = [...cart];
    newCart[itemIndex].quantity = qty;
    newCart[itemIndex].total = qty * newCart[itemIndex].unit_price;
    setCart(newCart);
    setEditingQuantity(null);
    setQuantityInput('');
  };

  const updateCartQuantity = (itemId, delta) => {
    const itemIndex = cart.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;
    const newCart = [...cart];
    const newQty = newCart[itemIndex].quantity + delta;
    if (newQty < 1) {
      newCart.splice(itemIndex, 1);
      setCart(newCart);
      return;
    }
    const product = newCart[itemIndex].product;
    if (newQty > product.stock_quantity) {
      showNotification(`Stock insuffisant pour ${product.name}`, 'error');
      return;
    }
    newCart[itemIndex].quantity = newQty;
    newCart[itemIndex].total = newQty * newCart[itemIndex].unit_price;
    setCart(newCart);
  };

  const startQuantityEdit = (itemId, currentQuantity) => {
    setEditingQuantity(itemId);
    setQuantityInput(String(currentQuantity));
    setTimeout(() => {
      const input = document.getElementById(`qty-input-${itemId}`);
      if (input) {
        input.focus();
        input.select();
      }
    }, 50);
  };

  const handleQuantityKeyDown = (e, itemId) => {
    if (e.key === 'Enter') {
      updateCartQuantityDirect(itemId, e.target.value);
      e.preventDefault();
    }
    if (e.key === 'Escape') {
      setEditingQuantity(null);
      setQuantityInput('');
      e.preventDefault();
    }
  };

  const removeCartItem = (itemId) => {
    setCart(cart.filter(i => i.id !== itemId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Vider le panier ?')) {
      setCart([]);
      showNotification('Panier vidé', 'success');
    }
  };

  // ============================================================
  // 4. CALCUL DES TOTAUX - RAPIDE
  // ============================================================
  const totals = React.useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    return { subtotal, tax_amount: 0, total: subtotal };
  }, [cart]);

  // ============================================================
  // 5. VALIDATION DE LA VENTE
  // ============================================================
  const validateSale = async () => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.blur();
    }

    if (cart.length === 0) {
      showNotification('Ajoutez au moins un produit au panier', 'error');
      return;
    }

    if (!selectedWarehouse) {
      showNotification('Sélectionnez un entrepôt', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 30);
      
      const year = dueDate.getFullYear();
      const month = String(dueDate.getMonth() + 1).padStart(2, '0');
      const day = String(dueDate.getDate()).padStart(2, '0');
      const paymentDueDate = `${year}-${month}-${day}`;

      const dataToSend = {
        client: selectedCustomer?.id || null,
        warehouse: selectedWarehouse.id,
        delivery_date: null,
        payment_due_date: paymentDueDate,
        discount_type: 'percentage',
        discount_value: 0,
        tax_rate: 0,
        shipping_fee: 0,
        payment_method: 'credit',
        delivery_method: 'retrait',
        delivery_address: '',
        notes: 'Vente POS - Scan rapide',
        internal_notes: '',
        lines: cart.map(item => ({
          product: item.product.id,
          lot: null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: 0,
          tax_rate: 0,
          price_type: item.price_type || 'detail'
        }))
      };

      const response = await AxiosInstance.post('/sales/', dataToSend, {
        headers: { 'Authorization': `Token ${token}` }
      });

      showNotification(`Vente ${response.data.invoice_number} enregistrée !`, 'success');
      
      setCart([]);
      setSelectedCustomer(null);

      setTimeout(() => {
        navigate(`/ventes/${response.data.id}`);
      }, 1500);

    } catch (error) {
      console.error('Erreur validation:', error);
      
      let errorMessage = 'Erreur lors de l\'enregistrement';
      
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
      setSubmitting(false);
    } finally {
      setSubmitting(false);
      setTimeout(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      }, 300);
    }
  };

  // ============================================================
  // 6. GESTION DES CLIENTS
  // ============================================================
  const handleCreateCustomer = async () => {
    if (!newCustomer.first_name || !newCustomer.last_name) {
      showNotification('Nom et prénom requis', 'error');
      return;
    }

    try {
      const token = getToken();
      const response = await AxiosInstance.post('/clients/', {
        code: `CL-${Date.now().toString().slice(-6)}`,
        name: `${newCustomer.first_name} ${newCustomer.last_name}`,
        first_name: newCustomer.first_name,
        last_name: newCustomer.last_name,
        phone: newCustomer.phone || '',
        email: newCustomer.email || '',
        address: '',
        city: '',
        type: 'particulier',
        statut: 'actif'
      }, {
        headers: { 'Authorization': `Token ${token}` }
      });

      setCustomers([...customers, response.data]);
      setSelectedCustomer(response.data);
      setShowCustomerModal(false);
      setNewCustomer({ first_name: '', last_name: '', phone: '', email: '' });
      showNotification('Client créé avec succès', 'success');
    } catch (error) {
      console.error('Erreur création client:', error);
      showNotification('Erreur lors de la création du client', 'error');
    }
  };

  const [newCustomer, setNewCustomer] = useState({ first_name: '', last_name: '', phone: '', email: '' });

  // ============================================================
  // 7. NOTIFICATION
  // ============================================================
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  // ============================================================
  // 8. FORMATAGE
  // ============================================================
  const formatPrice = (price) => {
    if (!price) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  // ============================================================
  // 9. RENDU - SANS AFFICHAGE DU NOMBRE DE PRODUITS
  // ============================================================
  return (
    <div className="space-y-4 p-4 lg:p-6 bg-base-200 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-6 z-50 animate-slideDown max-w-md">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-lg`}>
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{notification.message}</span>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification({ ...notification, show: false })}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Client */}
      {showCustomerModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg mb-4">Sélectionner un client</h3>
            
            <div className="form-control mb-3">
              <label className="label label-text">Rechercher un client</label>
              <input
                type="text"
                className="input input-bordered"
                placeholder="Nom, téléphone..."
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
              {customers.map(customer => (
                <button
                  key={customer.id}
                  className="w-full text-left p-3 rounded-lg hover:bg-base-200 flex items-center gap-3"
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowCustomerModal(false);
                    showNotification(`Client ${customer.name} sélectionné`, 'success');
                  }}
                >
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-xs text-base-content/60">{customer.phone}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="divider">Créer un nouveau client</div>
            
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                className="input input-bordered"
                placeholder="Prénom"
                value={newCustomer.first_name}
                onChange={(e) => setNewCustomer({...newCustomer, first_name: e.target.value})}
              />
              <input
                type="text"
                className="input input-bordered"
                placeholder="Nom"
                value={newCustomer.last_name}
                onChange={(e) => setNewCustomer({...newCustomer, last_name: e.target.value})}
              />
              <input
                type="text"
                className="input input-bordered col-span-2"
                placeholder="Téléphone"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
              />
              <input
                type="email"
                className="input input-bordered col-span-2"
                placeholder="Email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
              />
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowCustomerModal(false)}>Fermer</button>
              <button className="btn btn-primary" onClick={handleCreateCustomer}>
                <User className="w-4 h-4" /> Créer le client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête - Sans compteur de produits */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-base-100 rounded-xl shadow-md border border-base-300 p-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-base-content bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Scan & Vente
          </h1>
          <p className="text-sm text-base-content/60">
            Scannez un code-barres pour ajouter au panier
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button onClick={fetchData} className="btn btn-outline gap-2" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button onClick={() => navigate('/ventes')} className="btn btn-primary gap-2">
            <ShoppingCart className="w-4 h-4" /> Voir les ventes
          </button>
        </div>
      </div>

      {/* LAYOUT DIVISE - Scan à gauche / Panier à droite */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLONNE GAUCHE - Scan et infos (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* SCANNER DE CODE-BARRES */}
          <div className="bg-base-100 rounded-xl shadow-xl border-2 border-primary/30 p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              <div className="flex-1 w-full">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Barcode className="w-6 h-6 text-primary" />
                  </div>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="Scanner un code-barres..."
                    className="input input-bordered w-full pl-12 text-xl font-mono bg-base-200 border-2 border-primary/30 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all h-16"
                    value={barcodeValue}
                    onChange={handleBarcodeScan}
                    onKeyDown={handleBarcodeKeyDown}
                    onFocus={() => setIsBarcodeFocused(true)}
                    onBlur={() => setIsBarcodeFocused(false)}
                    autoFocus
                    disabled={loading}
                  />
                  {loading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader className="w-5 h-5 text-primary animate-spin" />
                    </div>
                  )}
                  {barcodeValue.length > 0 && !loading && (
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle"
                      onClick={() => {
                        setBarcodeValue('');
                        if (barcodeInputRef.current) {
                          barcodeInputRef.current.value = '';
                          barcodeInputRef.current.focus();
                        }
                      }}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-base-content/50">
                  <span className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${isBarcodeFocused ? 'bg-success animate-pulse' : 'bg-base-content/20'}`}></span>
                    {isBarcodeFocused ? 'Prêt à scanner' : 'Cliquez pour scanner'}
                  </span>
                  <span className="badge badge-ghost">Support lecteurs USB</span>
                  <span className="badge badge-ghost">Entrée pour valider</span>
                  <span className="badge badge-primary">Scan automatique</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
                      priceType === 'detail'
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setPriceType('detail')}
                  >
                    <Tag className="w-4 h-4" />
                    Détail
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
                      priceType === 'gros'
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setPriceType('gros')}
                  >
                    <Layers className="w-4 h-4" />
                    Gros
                  </button>
                </div>
              </div>
            </div>

            {/* Indicateur de produits scannés */}
            <div className="mt-4 flex items-center justify-between border-t border-base-200 pt-4">
              <span className="text-sm text-base-content/60">
                <span className="font-bold text-primary">{cart.length}</span> produit(s) dans le panier
              </span>
              <span className="text-sm text-base-content/60">
                Total: <span className="font-bold text-primary">{formatPrice(totals.total)}</span>
              </span>
            </div>
          </div>

          {/* Sélection entrepôt et client */}
          <div className="bg-base-100 rounded-xl shadow-md border border-base-300 p-4 lg:p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 flex items-center gap-3">
                <Warehouse className="w-5 h-5 text-primary flex-shrink-0" />
                <select
                  className="select select-bordered flex-1 max-w-xs"
                  value={selectedWarehouse?.id || ''}
                  onChange={(e) => {
                    const warehouse = warehouses.find(w => w.id === parseInt(e.target.value));
                    setSelectedWarehouse(warehouse);
                  }}
                  disabled={loading}
                >
                  <option value="">Sélectionner un entrepôt</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
                {!selectedWarehouse && !loading && (
                  <span className="text-xs text-error">Entrepôt requis</span>
                )}
              </div>
              
              <div className="flex-1 flex items-center gap-3">
                <User className="w-5 h-5 text-primary flex-shrink-0" />
                <button
                  className="btn btn-outline flex-1 gap-2"
                  onClick={() => setShowCustomerModal(true)}
                  disabled={loading}
                >
                  {selectedCustomer ? (
                    <span>{selectedCustomer.name}</span>
                  ) : (
                    'Client anonyme'
                  )}
                </button>
                {selectedCustomer && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setSelectedCustomer(null)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Derniers produits scannés */}
          {cart.length > 0 && (
            <div className="bg-base-100 rounded-xl shadow-md border border-base-300 p-4">
              <h3 className="text-sm font-semibold text-base-content/60 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Derniers produits ajoutés
              </h3>
              <div className="flex flex-wrap gap-2">
                {cart.slice(-5).reverse().map((item, index) => (
                  <div key={index} className="badge badge-primary badge-lg gap-1 text-sm">
                    {item.product.name}
                    <span className="badge badge-ghost badge-xs">x{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* COLONNE DROITE - Panier (1/3) */}
        <div className="lg:col-span-1">
          <div className="bg-base-100 rounded-xl shadow-xl border border-base-300 p-4 flex flex-col h-[calc(100vh-300px)] lg:h-[calc(100vh-250px)] sticky top-24">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Panier
                <span className="badge badge-primary badge-sm">{cart.length}</span>
              </h2>
              <button 
                className="btn btn-ghost btn-sm text-error"
                onClick={clearCart}
                disabled={cart.length === 0}
              >
                <Trash2 className="w-4 h-4" /> Vider
              </button>
            </div>

            {/* Liste du panier avec scroll */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mb-4">
                      <Barcode className="w-10 h-10 text-base-content/20" />
                    </div>
                  </div>
                  <p className="text-base-content/40 text-base">Aucun produit scanné</p>
                  <p className="text-xs text-base-content/30 mt-1">Scannez un code-barres</p>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={item.id} className="bg-base-200 rounded-lg p-3 border border-base-300/50 hover:border-primary/30 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-base-content/40 font-mono">#{index + 1}</span>
                          <div className="font-medium text-sm truncate flex-1">{item.product.name}</div>
                        </div>
                        <div className="text-xs text-base-content/40 truncate">{item.product.code}</div>
                        <div className="text-xs flex items-center gap-2 flex-wrap mt-1">
                          <span className={`badge ${item.price_type === 'gros' ? 'badge-primary' : 'badge-ghost'} text-[10px]`}>
                            {item.price_type === 'gros' ? 'Gros' : 'Détail'}
                          </span>
                          <span className="font-semibold text-primary text-xs">
                            {formatPrice(item.unit_price)}/u
                          </span>
                        </div>
                        
                        {/* Contrôle de quantité */}
                        <div className="flex items-center gap-2 mt-2">
                          <button 
                            className="btn btn-ghost btn-xs btn-circle"
                            onClick={() => updateCartQuantity(item.id, -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          
                          {editingQuantity === item.id ? (
                            <input
                              id={`qty-input-${item.id}`}
                              type="number"
                              min="1"
                              max={item.product.stock_quantity}
                              className="input input-bordered input-xs w-14 text-center font-bold"
                              value={quantityInput}
                              onChange={(e) => setQuantityInput(e.target.value)}
                              onKeyDown={(e) => handleQuantityKeyDown(e, item.id)}
                              onBlur={() => {
                                if (quantityInput) {
                                  updateCartQuantityDirect(item.id, quantityInput);
                                } else {
                                  setEditingQuantity(null);
                                  setQuantityInput('');
                                }
                              }}
                            />
                          ) : (
                            <span 
                              className="font-bold w-10 text-center text-sm cursor-pointer hover:text-primary transition-colors"
                              onClick={() => startQuantityEdit(item.id, item.quantity)}
                              title="Cliquer pour modifier"
                            >
                              {item.quantity}
                            </span>
                          )}
                          
                          <button 
                            className="btn btn-ghost btn-xs btn-circle"
                            onClick={() => updateCartQuantity(item.id, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <div className="font-bold text-primary text-sm">{formatPrice(item.total)}</div>
                        <button 
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => removeCartItem(item.id)}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totaux et validation - fixé en bas */}
            <div className="border-t border-base-300 pt-4 mt-4 flex-shrink-0">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-base-content/60">Sous-total</span>
                  <span className="font-semibold">{formatPrice(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-base-content/60">TVA (0%)</span>
                  <span>{formatPrice(totals.tax_amount)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-primary border-t border-base-300 pt-2">
                  <span>Total</span>
                  <span>{formatPrice(totals.total)}</span>
                </div>
              </div>

              <button 
                ref={validateButtonRef}
                type="button"
                className="btn btn-primary w-full mt-4 h-14 text-lg gap-2"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  validateSale();
                }}
                disabled={cart.length === 0 || !selectedWarehouse || submitting || loading}
              >
                {submitting ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {submitting ? 'Enregistrement...' : `Valider ${formatPrice(totals.total)}`}
              </button>

              <button 
                type="button"
                className="btn btn-ghost w-full mt-2 h-10 text-sm gap-2"
                onClick={() => setShowCustomerModal(true)}
                disabled={loading}
              >
                <User className="w-4 h-4" />
                {selectedCustomer ? 'Changer de client' : 'Ajouter un client'}
              </button>

              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-base-content/30">
                <div className={`w-2 h-2 rounded-full ${isBarcodeFocused ? 'bg-success animate-pulse' : 'bg-base-content/20'}`}></div>
                <span>{isBarcodeFocused ? 'Prêt à scanner' : 'Cliquez sur le champ de scan'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Raccourcis clavier */}
      <div className="fixed bottom-4 right-4 bg-base-100/90 backdrop-blur rounded-2xl shadow-lg p-3 text-xs text-base-content/60 border border-base-300 hidden lg:block">
        <div className="flex items-center gap-4">
          <span><kbd className="px-2 py-1 bg-base-200 rounded">Barcode</kbd> Scan automatique</span>
          <span><kbd className="px-2 py-1 bg-base-200 rounded">Esc</kbd> Fermer</span>
          <span><kbd className="px-2 py-1 bg-base-200 rounded">Click quantité</kbd> Modifier</span>
        </div>
      </div>
    </div>
  );
};

export default PosScanSimple;