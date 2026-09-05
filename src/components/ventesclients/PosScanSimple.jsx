// src/components/pos/PosScanSimple.jsx
// ============================================================
// VERSION SIMPLIFIEE - SCAN UNIQUEMENT
// Pas de liste de produits, seulement le scan et le panier
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
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
  const [isScanning, setIsScanning] = useState(false);

  const getToken = () => localStorage.getItem('Token');

  // Chargement des données minimales (clients, entrepôts)
  useEffect(() => {
    fetchData();
    setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }, 500);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const headers = { 'Authorization': `Token ${token}` };

      const [customersRes, warehousesRes] = await Promise.all([
        AxiosInstance.get('/clients/', { headers }),
        AxiosInstance.get('/warehouses/?active=true', { headers })
      ]);

      setCustomers(customersRes.data || []);
      setWarehouses(warehousesRes.data || []);
      
      if (warehousesRes.data && warehousesRes.data.length > 0) {
        setSelectedWarehouse(warehousesRes.data[0]);
      }

    } catch (error) {
      console.error('Erreur chargement données:', error);
      showNotification('Erreur de chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // SCAN DU CODE-BARRES - Ajout direct au panier
  // ============================================================
  const handleBarcodeScan = async (e) => {
    const value = e.target.value.trim();
    setBarcodeValue(value);

    if (value.length >= 8) {
      if (value === lastBarcode) {
        return;
      }

      setIsScanning(true);
      
      try {
        const token = getToken();
        if (!token) {
          showNotification('Session expirée', 'error');
          return;
        }

        // Recherche du produit par code-barres
        const response = await AxiosInstance.get(`/products/?barcode=${value}`, {
          headers: { 'Authorization': `Token ${token}` }
        });

        const products = response.data || [];
        
        if (products.length > 0) {
          const product = products[0];
          
          // Vérifier le stock
          const stock = product.current_stock || 0;
          if (stock <= 0) {
            showNotification(`Stock épuisé pour ${product.name}`, 'error');
            setBarcodeValue('');
            e.target.value = '';
            setIsScanning(false);
            return;
          }

          // Ajouter au panier
          addToCart(product);
          
          // Effacer le champ
          setBarcodeValue('');
          e.target.value = '';
          setLastBarcode(value);
          
          // Feedback haptique
          if (navigator.vibrate) {
            navigator.vibrate(100);
          }
          
          // Re-focus sur le champ scan
          setTimeout(() => {
            if (barcodeInputRef.current) {
              barcodeInputRef.current.focus();
              barcodeInputRef.current.select();
            }
          }, 100);
          
        } else {
          showNotification(`Code-barres "${value}" non trouvé`, 'error');
          setTimeout(() => {
            setBarcodeValue('');
            e.target.value = '';
            if (barcodeInputRef.current) {
              barcodeInputRef.current.focus();
              barcodeInputRef.current.select();
            }
          }, 1500);
        }
      } catch (error) {
        console.error('Erreur recherche produit:', error);
        showNotification('Erreur lors de la recherche du produit', 'error');
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      const value = e.target.value.trim();
      if (value.length >= 8) {
        handleBarcodeScan(e);
      } else if (value.length > 0) {
        showNotification('Code-barres trop court (minimum 8 caractères)', 'error');
        setTimeout(() => {
          setBarcodeValue('');
          e.target.value = '';
          if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
            barcodeInputRef.current.select();
          }
        }, 1000);
      }
      e.preventDefault();
    }
  };

  // ============================================================
  // GESTION DU PANIER
  // ============================================================
  const addToCart = (product, quantity = 1) => {
    const stock = product.current_stock || 0;
    
    if (stock <= 0) {
      showNotification(`Stock épuisé pour ${product.name}`, 'error');
      return;
    }

    const unitPrice = priceType === 'gros'
      ? (parseFloat(product.wholesale_price) || parseFloat(product.selling_price) || 0)
      : (parseFloat(product.selling_price) || 0);

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
    if (totalQty > stock) {
      showNotification(`Stock insuffisant pour ${product.name} (${stock} disponibles)`, 'error');
      return;
    }

    if (existingIndex !== -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity = totalQty;
      newCart[existingIndex].unit_price = unitPrice;
      newCart[existingIndex].price_type = priceType;
      newCart[existingIndex].total = totalQty * unitPrice;
      setCart(newCart);
      showNotification(`${product.name} - Quantité mise à jour (${totalQty})`, 'success');
    } else {
      setCart([...cart, {
        id: Date.now(),
        product: product,
        quantity: quantity,
        unit_price: unitPrice,
        price_type: priceType,
        total: unitPrice * quantity
      }]);
      showNotification(`${product.name} ajouté au panier (${priceType === 'gros' ? 'Gros' : 'Détail'})`, 'success');
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
    if (qty > (product.current_stock || 0)) {
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
    if (newQty > (product.current_stock || 0)) {
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
    showNotification('Produit retiré du panier', 'success');
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Vider le panier ?')) {
      setCart([]);
      showNotification('Panier vidé', 'success');
    }
  };

  // ============================================================
  // CALCUL DES TOTAUX
  // ============================================================
  const totals = React.useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const tax_amount = 0;
    const total = subtotal + tax_amount;
    return { subtotal, tax_amount, total };
  }, [cart]);

  // ============================================================
  // VALIDATION DE LA VENTE
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

      showNotification(`Vente ${response.data.invoice_number} enregistrée avec succès !`, 'success');
      
      setCart([]);
      setSelectedCustomer(null);

      setTimeout(() => {
        navigate(`/ventes/${response.data.id}`);
      }, 2000);

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
      // Re-focus sur le scan après validation
      setTimeout(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      }, 500);
    }
  };

  // ============================================================
  // GESTION DES CLIENTS
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
  // NOTIFICATION
  // ============================================================
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 5000);
  };

  // ============================================================
  // FORMATAGE
  // ============================================================
  const formatPrice = (price) => {
    if (!price) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  // ============================================================
  // RENDU
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)] bg-base-200">
        <div className="text-center space-y-6">
          <div className="loading loading-spinner loading-lg text-primary w-16 h-16"></div>
          <p className="text-xl font-semibold text-base-content/70 animate-pulse">
            Chargement du point de vente...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-base-200 min-h-screen">
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
                onChange={(e) => {
                  const term = e.target.value.toLowerCase();
                  // Filtrage des clients
                }}
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

      {/* En-tête */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-base-content bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Scan & Vente
          </h1>
          <p className="text-base text-base-content/60">Scannez les produits - Ajout automatique au panier</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button onClick={fetchData} className="btn btn-outline gap-2">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
          <button onClick={() => navigate('/ventes')} className="btn btn-primary gap-2">
            <ShoppingCart className="w-4 h-4" /> Voir les ventes
          </button>
        </div>
      </div>

      {/* SCANNER DE CODE-BARRES - Principal */}
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
                disabled={isScanning}
              />
              {isScanning && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Loader className="w-6 h-6 text-primary animate-spin" />
                </div>
              )}
              {barcodeValue.length > 0 && !isScanning && (
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
            <div className="mt-3 flex items-center gap-4 text-sm text-base-content/50">
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
            <Warehouse className="w-5 h-5 text-primary" />
            <select
              className="select select-bordered flex-1 max-w-xs"
              value={selectedWarehouse?.id || ''}
              onChange={(e) => {
                const warehouse = warehouses.find(w => w.id === parseInt(e.target.value));
                setSelectedWarehouse(warehouse);
              }}
            >
              <option value="">Sélectionner un entrepôt</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
            {!selectedWarehouse && (
              <span className="text-xs text-error">Entrepôt requis</span>
            )}
          </div>
          
          <div className="flex-1 flex items-center gap-3">
            <User className="w-5 h-5 text-primary" />
            <button
              className="btn btn-outline flex-1 gap-2"
              onClick={() => setShowCustomerModal(true)}
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

      {/* Panier - Pleine largeur */}
      <div className="bg-base-100 rounded-xl shadow-xl border border-base-300 p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Panier
            <span className="badge badge-primary badge-sm">{cart.length}</span>
          </h2>
          <div className="flex gap-2">
            <button 
              className="btn btn-ghost btn-sm text-error"
              onClick={clearCart}
              disabled={cart.length === 0}
            >
              <Trash2 className="w-4 h-4" /> Vider
            </button>
          </div>
        </div>

        {/* Liste du panier */}
        {cart.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mb-4">
                <Barcode className="w-12 h-12 text-base-content/20" />
              </div>
            </div>
            <p className="text-base-content/40 text-lg">Aucun produit scanné</p>
            <p className="text-sm text-base-content/30">Scannez un code-barres pour ajouter un produit</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Code</th>
                  <th>Prix unitaire</th>
                  <th>Quantité</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="font-medium">{item.product.name}</div>
                        <span className={`badge ${item.price_type === 'gros' ? 'badge-primary' : 'badge-ghost'} text-[10px]`}>
                          {item.price_type === 'gros' ? 'Gros' : 'Détail'}
                        </span>
                      </div>
                    </td>
                    <td className="font-mono text-xs">{item.product.code}</td>
                    <td className="font-semibold">{formatPrice(item.unit_price)}</td>
                    <td>
                      <div className="flex items-center gap-2">
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
                            max={item.product.current_stock || 0}
                            className="input input-bordered input-xs w-16 text-center font-bold"
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
                            className="font-bold w-12 text-center text-sm cursor-pointer hover:text-primary transition-colors"
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
                    </td>
                    <td className="font-bold text-primary">{formatPrice(item.total)}</td>
                    <td>
                      <button 
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => removeCartItem(item.id)}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totaux et validation */}
        <div className="border-t border-base-300 pt-4 mt-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex justify-between gap-8 text-sm">
                <span className="text-base-content/60">Sous-total</span>
                <span className="font-semibold">{formatPrice(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between gap-8 text-sm">
                <span className="text-base-content/60">TVA (0%)</span>
                <span>{formatPrice(totals.tax_amount)}</span>
              </div>
              <div className="flex justify-between gap-8 text-2xl font-bold text-primary">
                <span>Total</span>
                <span>{formatPrice(totals.total)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button 
                ref={validateButtonRef}
                type="button"
                className="btn btn-primary h-14 text-lg gap-2 flex-1"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  validateSale();
                }}
                disabled={cart.length === 0 || !selectedWarehouse || submitting}
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
                className="btn btn-outline h-14 text-base gap-2 flex-1"
                onClick={() => setShowCustomerModal(true)}
              >
                <User className="w-4 h-4" />
                {selectedCustomer ? 'Changer de client' : 'Ajouter un client'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Raccourcis clavier */}
      <div className="fixed bottom-4 right-4 bg-base-100/90 backdrop-blur rounded-2xl shadow-lg p-3 text-xs text-base-content/60 border border-base-300 hidden lg:block">
        <div className="flex items-center gap-4">
          <span><kbd className="px-2 py-1 bg-base-200 rounded">Scan</kbd> Ajout automatique</span>
          <span><kbd className="px-2 py-1 bg-base-200 rounded">Click quantité</kbd> Modifier</span>
          <span><kbd className="px-2 py-1 bg-base-200 rounded">Esc</kbd> Annuler</span>
        </div>
      </div>
    </div>
  );
};

export default PosScanSimple;