// src/components/pos/PosScanSimple.jsx
// ============================================================
// VERSION COMPLÈTE CORRIGÉE - Compatible pagination DRF
// ============================================================

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Minus, Trash2, RefreshCw,
  ShoppingCart, X, AlertCircle, CheckCircle,
  User, Receipt, Loader, Barcode,
  Save, Tag, Layers, Warehouse, Package,
  Search, Check
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
    console.error('❌ ErrorBoundary PosScanSimple:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-base-200 p-6 flex items-center justify-center">
          <div className="bg-base-100 rounded-2xl shadow-lg p-8 max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-4 text-error">
              <AlertCircle className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Erreur dans le POS Scan</h2>
            </div>
            <pre className="bg-base-200 p-4 rounded-lg text-sm overflow-auto max-h-64 text-red-600">
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
                onClick={() => window.location.href = '/dashboard'}
                className="btn btn-ghost"
              >
                Dashboard
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
const PosScanSimpleContent = () => {
  const navigate = useNavigate();
  const barcodeInputRef = useRef(null);
  const validateButtonRef = useRef(null);
  const hasFetchedRef = useRef(false);  // ✅ Guard contre double-mount

  // ==========================================================
  // ÉTATS
  // ==========================================================
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
  const [editingQuantity, setEditingQuantity] = useState(null);
  const [quantityInput, setQuantityInput] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);

  // ✅ États pour la recherche client
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  // ✅ États pour création rapide client
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    type: 'particulier'
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // ==========================================================
  // UTILITAIRES
  // ==========================================================
  const getToken = () => localStorage.getItem('Token');

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  }, []);

  // ✅ NORMALISATION DES RÉPONSES API (pagination DRF)
  const normalizeData = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  };

  // ✅ URL des images
  const getImageUrl = useCallback((imagePath) => {
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
  }, []);

  // ==========================================================
  // CHARGEMENT DES DONNÉES
  // ==========================================================
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const headers = { 'Authorization': `Token ${token}` };

      console.log('🔍 Chargement des données POS Scan...');

      // ✅ Utiliser page_size (pas limit) + .catch() sur chaque appel
      const [productsRes, customersRes, warehousesRes] = await Promise.all([
        AxiosInstance.get('/products/?status=active&page_size=500', { headers })
          .catch(err => {
            console.warn('⚠️ Erreur products:', err.message);
            return { data: [] };
          }),
        AxiosInstance.get('/clients/?page_size=100', { headers })
          .catch(err => {
            console.warn('⚠️ Erreur clients:', err.message);
            return { data: [] };
          }),
        AxiosInstance.get('/warehouses/?active=true', { headers })
          .catch(err => {
            console.warn('⚠️ Erreur warehouses:', err.message);
            return { data: [] };
          })
      ]);

      // ✅ NORMALISATION (gère [] ET {results: []})
      const productsData = normalizeData(productsRes.data);
      const customersData = normalizeData(customersRes.data);
      const warehousesData = normalizeData(warehousesRes.data);

      console.log('✅ Données chargées:', {
        products: productsData.length,
        customers: customersData.length,
        warehouses: warehousesData.length
      });

      // ✅ Transformation des produits
      const productsWithData = productsData.map(product => ({
        ...product,
        image_url: product.image_url || getImageUrl(product.image),
        stock_quantity: parseFloat(product.current_stock) || 0,
        selling_price: parseFloat(product.selling_price) || 0,
        wholesale_price: parseFloat(product.wholesale_price) || 0,
        barcode: product.barcode || '',
        display_price: parseFloat(product.selling_price) || 0
      }));

      setProducts(productsWithData);
      setCustomers(customersData);
      setFilteredCustomers(customersData);
      setWarehouses(warehousesData);

      if (warehousesData.length > 0) {
        setSelectedWarehouse(warehousesData[0]);
      }

      setDataLoaded(true);

    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      showNotification('Erreur de chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  }, [navigate, showNotification, getImageUrl]);

  // ==========================================================
  // CHARGEMENT INITIAL
  // ==========================================================
  useEffect(() => {
    // ✅ Guard contre le double-mount React 18
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    fetchData();

    const timer = setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchData]);

  // ==========================================================
  // MISE À JOUR DES PRIX SELON LE MODE
  // ==========================================================
  useEffect(() => {
    if (!dataLoaded) return;
    setProducts(prevProducts =>
      prevProducts.map(product => ({
        ...product,
        display_price: priceType === 'gros'
          ? (product.wholesale_price || product.selling_price || 0)
          : (product.selling_price || 0)
      }))
    );
  }, [priceType, dataLoaded]);

  // ==========================================================
  // FILTRAGE DES CLIENTS
  // ==========================================================
  useEffect(() => {
    if (!customerSearchTerm.trim()) {
      setFilteredCustomers(customers);
    } else {
      const term = customerSearchTerm.toLowerCase();
      const filtered = customers.filter(c =>
        (c.name || '').toLowerCase().includes(term) ||
        (c.phone || '').includes(term) ||
        (c.code || '').toLowerCase().includes(term)
      );
      setFilteredCustomers(filtered);
    }
  }, [customerSearchTerm, customers]);

  // ==========================================================
  // GESTION DU CODE-BARRES
  // ==========================================================
  const handleBarcodeScan = useCallback((e) => {
    const value = e.target.value.trim();
    setBarcodeValue(value);

    if (value.length >= 8) {
      const product = products.find(p => p.barcode === value);

      if (product) {
        addToCart(product);
        setBarcodeValue('');
        e.target.value = '';
        showNotification(`${product.name} ajouté`, 'success');

        if (navigator.vibrate) {
          navigator.vibrate(50);
        }

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
  }, [products, showNotification]);

  const handleBarcodeKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
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
          }
        }, 800);
      }
    }
  }, [handleBarcodeScan, showNotification]);

  // ==========================================================
  // GESTION DU PANIER
  // ==========================================================
  const addToCart = useCallback((product, quantity = 1) => {
    if (product.stock_quantity <= 0) {
      showNotification(`Stock épuisé pour ${product.name}`, 'error');
      return;
    }

    const wholesalePrice = parseFloat(product.wholesale_price) || 0;
    const sellingPrice = parseFloat(product.selling_price) || 0;

    // Si mode Gros demandé mais produit sans prix de gros
    if (priceType === 'gros' && wholesalePrice <= 0) {
      showNotification(
        `${product.name} n'a pas de prix de gros. Ajouté au prix de détail.`,
        'error'
      );

      if (sellingPrice <= 0) {
        showNotification(`Prix non défini pour ${product.name}`, 'error');
        return;
      }

      setCart(prevCart => {
        const existingIndex = prevCart.findIndex(item => item.product.id === product.id);
        const currentQty = existingIndex !== -1 ? prevCart[existingIndex].quantity : 0;
        const totalQty = currentQty + quantity;

        if (totalQty > product.stock_quantity) {
          showNotification(`Stock insuffisant pour ${product.name}`, 'error');
          return prevCart;
        }

        if (existingIndex !== -1) {
          const newCart = [...prevCart];
          newCart[existingIndex] = {
            ...newCart[existingIndex],
            quantity: totalQty,
            unit_price: sellingPrice,
            price_type: 'detail',
            total: totalQty * sellingPrice
          };
          return newCart;
        } else {
          return [...prevCart, {
            id: Date.now() + Math.random(),
            product: product,
            quantity: quantity,
            unit_price: sellingPrice,
            price_type: 'detail',
            total: sellingPrice * quantity
          }];
        }
      });
      return;
    }

    // Cas normal
    const unitPrice = priceType === 'gros'
      ? (wholesalePrice || sellingPrice || 0)
      : (sellingPrice || 0);

    if (unitPrice <= 0) {
      showNotification(`Prix non défini pour ${product.name}`, 'error');
      return;
    }

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.product.id === product.id);
      const currentQty = existingIndex !== -1 ? prevCart[existingIndex].quantity : 0;
      const totalQty = currentQty + quantity;

      if (totalQty > product.stock_quantity) {
        showNotification(`Stock insuffisant pour ${product.name}`, 'error');
        return prevCart;
      }

      if (existingIndex !== -1) {
        const newCart = [...prevCart];
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: totalQty,
          unit_price: unitPrice,
          price_type: priceType,
          total: totalQty * unitPrice
        };
        return newCart;
      } else {
        return [...prevCart, {
          id: Date.now() + Math.random(),
          product: product,
          quantity: quantity,
          unit_price: unitPrice,
          price_type: priceType,
          total: unitPrice * quantity
        }];
      }
    });
  }, [priceType, showNotification]);

  const updateCartQuantityDirect = useCallback((itemId, newQuantity) => {
    const qty = Math.max(1, parseInt(newQuantity) || 1);

    setCart(prevCart => {
      const itemIndex = prevCart.findIndex(i => i.id === itemId);
      if (itemIndex === -1) return prevCart;

      const item = prevCart[itemIndex];
      if (qty > item.product.stock_quantity) {
        showNotification(`Stock insuffisant`, 'error');
        return prevCart;
      }

      const newCart = [...prevCart];
      newCart[itemIndex] = {
        ...newCart[itemIndex],
        quantity: qty,
        total: qty * newCart[itemIndex].unit_price
      };
      return newCart;
    });

    setEditingQuantity(null);
    setQuantityInput('');
  }, [showNotification]);

  const updateCartQuantity = useCallback((itemId, delta) => {
    setCart(prevCart => {
      const itemIndex = prevCart.findIndex(i => i.id === itemId);
      if (itemIndex === -1) return prevCart;

      const newCart = [...prevCart];
      const newQty = newCart[itemIndex].quantity + delta;

      if (newQty < 1) {
        newCart.splice(itemIndex, 1);
        return newCart;
      }

      if (newQty > newCart[itemIndex].product.stock_quantity) {
        showNotification('Stock insuffisant', 'error');
        return prevCart;
      }

      newCart[itemIndex] = {
        ...newCart[itemIndex],
        quantity: newQty,
        total: newQty * newCart[itemIndex].unit_price
      };
      return newCart;
    });
  }, [showNotification]);

  const removeCartItem = useCallback((itemId) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    if (cart.length === 0) return;
    if (window.confirm('Vider le panier ?')) {
      setCart([]);
      showNotification('Panier vidé', 'success');
    }
  }, [cart.length, showNotification]);

  const startQuantityEdit = useCallback((itemId, currentQuantity) => {
    setEditingQuantity(itemId);
    setQuantityInput(String(currentQuantity));
    setTimeout(() => {
      const input = document.getElementById(`qty-input-${itemId}`);
      if (input) {
        input.focus();
        input.select();
      }
    }, 50);
  }, []);

  const handleQuantityKeyDown = useCallback((e, itemId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      updateCartQuantityDirect(itemId, e.target.value);
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setEditingQuantity(null);
      setQuantityInput('');
    }
  }, [updateCartQuantityDirect]);

  // ==========================================================
  // CALCUL DES TOTAUX
  // ==========================================================
  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.total || 0), 0);
    return {
      subtotal,
      tax_amount: 0,
      total: subtotal
    };
  }, [cart]);

  // ==========================================================
  // VALIDATION DE LA VENTE
  // ==========================================================
  const validateSale = useCallback(async () => {
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

      showNotification(
        `Vente ${response.data.invoice_number || ''} enregistrée !`,
        'success'
      );

      setCart([]);
      setSelectedCustomer(null);

      setTimeout(() => {
        navigate(`/ventes/${response.data.id}`);
      }, 1500);

    } catch (error) {
      console.error('❌ Erreur validation:', error);

      let errorMessage = 'Erreur lors de l\'enregistrement';

      if (error.response?.data) {
        const data = error.response.data;

        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.lines && Array.isArray(data.lines)) {
          errorMessage = data.lines[0] || 'Erreur de validation des produits';
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (typeof data === 'object') {
          const firstError = Object.values(data).flat()[0];
          if (firstError) errorMessage = firstError;
        }
      }

      showNotification(errorMessage, 'error');
    } finally {
      setSubmitting(false);
      setTimeout(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      }, 300);
    }
  }, [cart, selectedWarehouse, selectedCustomer, navigate, showNotification]);

  // ==========================================================
  // CRÉATION RAPIDE DE CLIENT (7 champs)
  // ==========================================================
  const handleCreateCustomer = useCallback(async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      showNotification('Nom et téléphone requis', 'error');
      return;
    }

    setCreatingCustomer(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.post('/clients/', {
        code: `CL-${Date.now().toString().slice(-6)}`,
        name: newCustomer.name,
        phone: newCustomer.phone,
        type: newCustomer.type || 'particulier',
        address: '',
        statut: 'actif',
        notes: ''
      }, {
        headers: { 'Authorization': `Token ${token}` }
      });

      const createdCustomer = response.data;
      setCustomers(prev => [...prev, createdCustomer]);
      setFilteredCustomers(prev => [...prev, createdCustomer]);
      setSelectedCustomer(createdCustomer);
      setShowCustomerModal(false);
      setNewCustomer({ name: '', phone: '', type: 'particulier' });
      setCustomerSearchTerm('');
      showNotification(`Client ${createdCustomer.name} créé`, 'success');
    } catch (error) {
      console.error('❌ Erreur création client:', error);
      let errorMsg = 'Erreur lors de la création du client';
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') errorMsg = data;
        else if (data.detail) errorMsg = data.detail;
        else if (typeof data === 'object') {
          const errors = [];
          Object.entries(data).forEach(([key, value]) => {
            if (Array.isArray(value)) errors.push(`${key}: ${value.join(', ')}`);
          });
          if (errors.length > 0) errorMsg = errors.join('; ');
        }
      }
      showNotification(errorMsg, 'error');
    } finally {
      setCreatingCustomer(false);
    }
  }, [newCustomer, showNotification]);

  // ==========================================================
  // FORMATAGE
  // ==========================================================
  const formatPrice = useCallback((price) => {
    const num = parseFloat(price) || 0;
    return new Intl.NumberFormat('fr-FR').format(num) + ' FCFA';
  }, []);

  // ==========================================================
  // RENDU : CHARGEMENT
  // ==========================================================
  if (loading && !dataLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-200">
        <div className="text-center space-y-4">
          <Loader className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-base-content/60">Chargement du POS Scan...</p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDU PRINCIPAL
  // ==========================================================
  return (
    <div className="space-y-4 p-4 lg:p-6 bg-base-200 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-6 z-50 max-w-md">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-lg`}>
            {notification.type === 'success'
              ? <CheckCircle className="w-5 h-5" />
              : <AlertCircle className="w-5 h-5" />}
            <span>{notification.message}</span>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => setNotification({ ...notification, show: false })}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Client */}
      {showCustomerModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Sélectionner un client</h3>
              <button
                className="btn btn-ghost btn-sm btn-circle"
                onClick={() => {
                  setShowCustomerModal(false);
                  setCustomerSearchTerm('');
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="form-control mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                  type="text"
                  className="input input-bordered w-full pl-10"
                  placeholder="Rechercher par nom, téléphone, code..."
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  autoFocus
                />
                {customerSearchTerm && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
                    onClick={() => setCustomerSearchTerm('')}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              {customerSearchTerm && (
                <label className="label">
                  <span className="label-text-alt text-base-content/50">
                    {filteredCustomers.length} résultat(s)
                  </span>
                </label>
              )}
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-8 text-base-content/50">
                  <User className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucun client trouvé</p>
                </div>
              ) : (
                filteredCustomers.map(customer => (
                  <button
                    key={customer.id}
                    className={`w-full text-left p-3 rounded-lg hover:bg-base-200 flex items-center gap-3 transition-colors ${
                      selectedCustomer?.id === customer.id ? 'bg-primary/10 border border-primary/30' : ''
                    }`}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setShowCustomerModal(false);
                      setCustomerSearchTerm('');
                      showNotification(`Client ${customer.name} sélectionné`, 'success');
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{customer.name}</div>
                      <div className="text-xs text-base-content/60 truncate">
                        {customer.phone || customer.code || 'Aucun contact'}
                      </div>
                    </div>
                    {selectedCustomer?.id === customer.id && (
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="divider text-xs text-base-content/50">Créer un nouveau client</div>

            <div className="space-y-2 mb-3">
              <input
                type="text"
                className="input input-bordered input-sm w-full"
                placeholder="Nom / Raison sociale *"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              />
              <input
                type="text"
                className="input input-bordered input-sm w-full"
                placeholder="Téléphone *"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              />
              <select
                className="select select-bordered select-sm w-full"
                value={newCustomer.type}
                onChange={(e) => setNewCustomer({ ...newCustomer, type: e.target.value })}
              >
                <option value="particulier">Particulier</option>
                <option value="entreprise">Entreprise</option>
                <option value="revendeur">Revendeur</option>
                <option value="grossiste">Grossiste</option>
              </select>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowCustomerModal(false);
                  setCustomerSearchTerm('');
                }}
              >
                Fermer
              </button>
              {selectedCustomer && (
                <button
                  className="btn btn-error btn-outline gap-2"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setShowCustomerModal(false);
                    setCustomerSearchTerm('');
                    showNotification('Client retiré', 'success');
                  }}
                >
                  <X className="w-4 h-4" /> Retirer
                </button>
              )}
              <button
                className="btn btn-primary gap-2"
                onClick={handleCreateCustomer}
                disabled={creatingCustomer || !newCustomer.name || !newCustomer.phone}
              >
                {creatingCustomer ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                {creatingCustomer ? 'Création...' : 'Créer le client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-base-100 rounded-xl shadow-md border border-base-300 p-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Scan & Vente
          </h1>
          <p className="text-sm text-base-content/60">
            Scannez un code-barres pour ajouter au panier
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={fetchData}
            className="btn btn-outline gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={() => navigate('/ventes')}
            className="btn btn-primary gap-2"
          >
            <ShoppingCart className="w-4 h-4" /> Voir les ventes
          </button>
        </div>
      </div>

      {/* Layout divisé */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLONNE GAUCHE */}
        <div className="lg:col-span-2 space-y-4">

          {/* Scanner */}
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
                    className="input input-bordered w-full pl-12 text-xl font-mono bg-base-200 border-2 border-primary/30 h-16"
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
                  <span className="badge badge-primary">Scan automatique</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium flex items-center gap-1 ${
                      priceType === 'detail'
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setPriceType('detail')}
                  >
                    <Tag className="w-4 h-4" /> Détail
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium flex items-center gap-1 ${
                      priceType === 'gros'
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setPriceType('gros')}
                  >
                    <Layers className="w-4 h-4" /> Gros
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-base-200 pt-4">
              <span className="text-sm text-base-content/60">
                <span className="font-bold text-primary">{cart.length}</span> produit(s) dans le panier
              </span>
              <span className="text-sm text-base-content/60">
                Total: <span className="font-bold text-primary">{formatPrice(totals.total)}</span>
              </span>
            </div>
          </div>

          {/* Entrepôt + Client */}
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
                {!selectedWarehouse && !loading && warehouses.length > 0 && (
                  <span className="text-xs text-error">Entrepôt requis</span>
                )}
                {!loading && warehouses.length === 0 && (
                  <span className="text-xs text-warning">Aucun entrepôt actif</span>
                )}
              </div>

              <div className="flex-1 flex items-center gap-3">
                <User className="w-5 h-5 text-primary flex-shrink-0" />
                <button
                  className="btn btn-outline flex-1 gap-2"
                  onClick={() => setShowCustomerModal(true)}
                  disabled={loading}
                >
                  {selectedCustomer ? selectedCustomer.name : 'Client anonyme'}
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

          {/* Derniers produits */}
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

        {/* COLONNE DROITE - Panier */}
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
                  <div key={item.id} className="bg-base-200 rounded-lg p-3 border border-base-300/50">
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
                              className="font-bold w-10 text-center text-sm cursor-pointer hover:text-primary"
                              onClick={() => startQuantityEdit(item.id, item.quantity)}
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
          <span><kbd className="px-2 py-1 bg-base-200 rounded">Barcode</kbd> Scan auto</span>
          <span><kbd className="px-2 py-1 bg-base-200 rounded">Esc</kbd> Fermer</span>
          <span><kbd className="px-2 py-1 bg-base-200 rounded">Click qté</kbd> Modifier</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// WRAPPER avec ErrorBoundary
// ============================================================
const PosScanSimple = () => (
  <ErrorBoundary>
    <PosScanSimpleContent />
  </ErrorBoundary>
);

export default PosScanSimple;