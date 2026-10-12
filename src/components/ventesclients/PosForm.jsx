// src/components/pos/PosForm.jsx
// ============================================================
// VERSION PROFESSIONNELLE COMPLÈTE - CORRIGÉE
// ============================================================

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Minus, Trash2, Search, RefreshCw, Filter,
  ShoppingCart, X, AlertCircle, CheckCircle,
  ChevronLeft, ChevronRight, ArrowUpDown, LayoutGrid, List,
  Package, AlertTriangle, Warehouse,
  User, Receipt, Loader,
  Check, Barcode,
  Save, Tag, Layers
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
    console.error('❌ ErrorBoundary PosForm:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-base-200 p-6 flex items-center justify-center">
          <div className="bg-base-100 rounded-2xl shadow-lg p-8 max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-4 text-error">
              <AlertCircle className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Erreur dans le point de vente</h2>
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
const PosFormContent = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const barcodeInputRef = useRef(null);
  const validateButtonRef = useRef(null);

  // ============================================================
  // ÉTATS
  // ============================================================
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [priceType, setPriceType] = useState('detail');
  const [barcodeValue, setBarcodeValue] = useState('');
  const [isBarcodeFocused, setIsBarcodeFocused] = useState(false);
  const [editingQuantity, setEditingQuantity] = useState(null);
  const [quantityInput, setQuantityInput] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // États pour la recherche client
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  // États pour la création rapide de client
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    type: 'particulier'
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const getToken = () => localStorage.getItem('Token');

  // ============================================================
  // ✅ NOTIFICATION (déclarée AVANT utilisation)
  // ============================================================
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 5000);
  }, []);

  // ============================================================
  // ✅ NORMALISATION DES RÉPONSES API
  // ============================================================
  const normalizeData = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  };

  // ============================================================
  // ✅ CALCUL PRIX DE GROS DISPONIBLES
  // ============================================================
  const hasWholesaleProducts = useMemo(() => {
    return products.some(p => (parseFloat(p.wholesale_price) || 0) > 0);
  }, [products]);

  const wholesaleProductsCount = useMemo(() => {
    return products.filter(p => (parseFloat(p.wholesale_price) || 0) > 0).length;
  }, [products]);

  // ============================================================
  // ✅ URL DES IMAGES
  // ============================================================
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

  // ============================================================
  // ✅ CHARGEMENT DES DONNÉES (sans dépendance cyclique)
  // ============================================================
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

      console.log('🔍 Chargement des données POS...');

      const [productsRes, categoriesRes, customersRes, warehousesRes] = await Promise.all([
        AxiosInstance.get('/products/?status=active', { headers }).catch(err => {
          console.warn('⚠️ Erreur products:', err.message);
          return { data: [] };
        }),
        AxiosInstance.get('/categories/', { headers }).catch(err => {
          console.warn('⚠️ Erreur categories:', err.message);
          return { data: [] };
        }),
        AxiosInstance.get('/clients/', { headers }).catch(err => {
          console.warn('⚠️ Erreur clients:', err.message);
          return { data: [] };
        }),
        AxiosInstance.get('/warehouses/?active=true', { headers }).catch(err => {
          console.warn('⚠️ Erreur warehouses:', err.message);
          return { data: [] };
        })
      ]);

      // ✅ Normalisation
      const productsData = normalizeData(productsRes.data);
      const categoriesData = normalizeData(categoriesRes.data);
      const customersData = normalizeData(customersRes.data);
      const warehousesData = normalizeData(warehousesRes.data);

      console.log('✅ Données chargées:', {
        products: productsData.length,
        categories: categoriesData.length,
        customers: customersData.length,
        warehouses: warehousesData.length
      });

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
      setCategories(categoriesData);
      setCustomers(customersData);
      setFilteredCustomers(customersData);
      setWarehouses(warehousesData);

      if (warehousesData.length > 0) {
        setSelectedWarehouse(warehousesData[0]);
      }

      setIsInitialized(true);

    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      showNotification('Erreur de chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  }, [getImageUrl, navigate, showNotification]);

  useEffect(() => {
    fetchData();
    const timer = setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // ============================================================
  // ✅ MISE À JOUR DES PRIX AFFICHÉS SELON LE MODE
  // ============================================================
  useEffect(() => {
    if (!isInitialized) return;
    setProducts(prevProducts =>
      prevProducts.map(product => ({
        ...product,
        display_price: priceType === 'gros'
          ? (product.wholesale_price || product.selling_price || 0)
          : (product.selling_price || 0)
      }))
    );
  }, [priceType, isInitialized]);

  // ============================================================
  // ✅ FORCER MODE DÉTAIL SI AUCUN PRIX DE GROS
  // ============================================================
  useEffect(() => {
    if (!isInitialized) return;
    if (!hasWholesaleProducts && priceType === 'gros') {
      setPriceType('detail');
      setCart(prevCart => {
        const hasGrosItems = prevCart.some(item => item.price_type === 'gros');
        if (hasGrosItems) {
          showNotification(
            'Mode Gros désactivé : aucun produit n\'a de prix de gros défini',
            'error'
          );
          return prevCart.filter(item => item.price_type !== 'gros');
        }
        return prevCart;
      });
    }
  }, [hasWholesaleProducts, priceType, isInitialized, showNotification]);

  // ============================================================
  // ✅ FILTRER LES CLIENTS SELON LA RECHERCHE
  // ============================================================
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

  // ============================================================
  // ✅ GESTION DU CODE-BARRES
  // ============================================================
  const handleBarcodeScan = useCallback((e) => {
    const value = e.target.value.trim();
    setBarcodeValue(value);

    if (value.length >= 8) {
      const product = products.find(p => p.barcode === value);

      if (product) {
        addToCart(product);
        setBarcodeValue('');
        e.target.value = '';
        showNotification(
          `${product.name} ajouté (${priceType === 'gros' ? 'Gros' : 'Détail'})`,
          'success'
        );
        if (navigator.vibrate) navigator.vibrate(100);
      } else {
        showNotification(`Code-barres "${value}" non trouvé`, 'error');
        setTimeout(() => {
          if (barcodeInputRef.current) barcodeInputRef.current.select();
        }, 100);
      }
    }
  }, [products, priceType, showNotification]);

  const handleBarcodeKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const value = e.target.value.trim();
      if (value.length >= 8) {
        handleBarcodeScan(e);
      } else if (value.length > 0) {
        showNotification('Code-barres trop court (minimum 8 caractères)', 'error');
      }
    }
  }, [handleBarcodeScan, showNotification]);

  // ============================================================
  // ✅ FILTRAGE ET TRI DES PRODUITS
  // ============================================================
  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        (p.name || '').toLowerCase().includes(term) ||
        (p.code || '').toLowerCase().includes(term) ||
        (p.barcode || '').toLowerCase().includes(term)
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === parseInt(selectedCategory));
    }
    return filtered;
  }, [products, searchTerm, selectedCategory]);

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    sorted.sort((a, b) => {
      let aVal = a[sortField] ?? '';
      let bVal = b[sortField] ?? '';

      if (['stock_quantity', 'selling_price', 'wholesale_price'].includes(sortField)) {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredProducts, sortField, sortDirection]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedProducts.length / itemsPerPage)),
    [sortedProducts.length, itemsPerPage]
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, sortedProducts.length);
    return sortedProducts.slice(start, end);
  }, [sortedProducts, currentPage, itemsPerPage]);

  // ============================================================
  // ✅ GESTION DU PANIER
  // ============================================================
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
        showNotification(
          `Stock insuffisant pour ${product.name} (${totalQty} demandé, ${product.stock_quantity} dispo)`,
          'error'
        );
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
      const product = item.product;

      if (qty > product.stock_quantity) {
        showNotification(
          `Stock insuffisant pour ${product.name} (${qty} demandé, ${product.stock_quantity} dispo)`,
          'error'
        );
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

      const product = newCart[itemIndex].product;
      if (newQty > product.stock_quantity) {
        showNotification(`Stock insuffisant pour ${product.name}`, 'error');
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

  // ============================================================
  // ✅ CALCUL DES TOTAUX
  // ============================================================
  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.total || 0), 0);
    const tax_amount = 0;
    const total = subtotal + tax_amount;
    return { subtotal, tax_amount, total };
  }, [cart]);

  // ============================================================
  // ✅ VALIDATION DE LA VENTE
  // ============================================================
  const validateSale = useCallback(async () => {
    if (barcodeInputRef.current) barcodeInputRef.current.blur();
    if (searchInputRef.current) searchInputRef.current.blur();

    if (cart.length === 0) {
      showNotification('Ajoutez au moins un produit au panier', 'error');
      return;
    }

    if (!selectedWarehouse) {
      showNotification('Sélectionnez un entrepôt', 'error');
      return;
    }

    if (priceType === 'gros') {
      const invalidGrosItems = cart.filter(item => {
        const wp = parseFloat(item.product.wholesale_price) || 0;
        return item.price_type === 'gros' && wp <= 0;
      });
      if (invalidGrosItems.length > 0) {
        showNotification(
          `Impossible : ${invalidGrosItems.length} produit(s) sans prix de gros. Repassez en Détail.`,
          'error'
        );
        return;
      }
    }

    const stockErrors = cart.filter(item => item.quantity > item.product.stock_quantity);
    if (stockErrors.length > 0) {
      const errorMsg = stockErrors
        .map(item => `${item.product.name}: ${item.quantity}/${item.product.stock_quantity}`)
        .join(', ');
      showNotification(`Stock insuffisant: ${errorMsg}`, 'error');
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
        notes: 'Vente POS',
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
        `Vente ${response.data.invoice_number || ''} enregistrée avec succès !`,
        'success'
      );

      setCart([]);
      setSelectedCustomer(null);

      setTimeout(() => {
        if (barcodeInputRef.current) barcodeInputRef.current.focus();
      }, 500);

    } catch (error) {
      console.error('❌ Erreur validation:', error);

      let errorMessage = 'Erreur lors de l\'enregistrement';
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') errorMessage = data;
        else if (data.lines && Array.isArray(data.lines)) errorMessage = data.lines[0];
        else if (data.detail) errorMessage = data.detail;
        else if (typeof data === 'object') {
          const errors = [];
          Object.entries(data).forEach(([key, value]) => {
            if (Array.isArray(value)) errors.push(`${key}: ${value.join(', ')}`);
            else if (typeof value === 'string') errors.push(`${key}: ${value}`);
          });
          if (errors.length > 0) errorMessage = errors.join('; ');
        }
      }
      showNotification(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [cart, selectedWarehouse, selectedCustomer, navigate, priceType, showNotification]);

  // ============================================================
  // ✅ CRÉATION RAPIDE DE CLIENT (adaptée au modèle 7 champs)
  // ============================================================
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
      showNotification(`Client ${createdCustomer.name} créé et sélectionné`, 'success');
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
            else if (typeof value === 'string') errors.push(`${key}: ${value}`);
          });
          if (errors.length > 0) errorMsg = errors.join('; ');
        }
      }
      showNotification(errorMsg, 'error');
    } finally {
      setCreatingCustomer(false);
    }
  }, [newCustomer, showNotification]);

  // ============================================================
  // ✅ FORMATAGE
  // ============================================================
  const formatPrice = useCallback((price) => {
    if (!price && price !== 0) return '0 FCFA';
    const num = parseFloat(price) || 0;
    return new Intl.NumberFormat('fr-FR').format(num) + ' FCFA';
  }, []);

  const getStatusBadge = useCallback((product) => {
    const stock = parseFloat(product.stock_quantity) || 0;

    if (stock <= 0) {
      return (
        <div className="badge badge-error gap-1 text-xs">
          <AlertTriangle className="w-3 h-3" /> Rupture
        </div>
      );
    }

    if (product.min_stock > 0 && stock <= product.min_stock) {
      return (
        <div className="badge badge-warning gap-1 text-xs">
          <AlertCircle className="w-3 h-3" /> Stock faible
        </div>
      );
    }

    return (
      <div className="badge badge-success gap-1 text-xs">
        <CheckCircle className="w-3 h-3" /> En stock
      </div>
    );
  }, []);

  // ============================================================
  // ✅ RENDU
  // ============================================================
  if (loading && !isInitialized) {
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
        <div className="fixed top-20 right-6 z-[999] animate-slideDown max-w-md">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-lg`}>
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{notification.message}</span>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => setNotification({ show: false, message: '', type: 'success' })}
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
          <h1 className="text-3xl lg:text-4xl font-black text-base-content bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Point de Vente
          </h1>
          <p className="text-sm text-base-content/60">Vente rapide - Scannez les produits</p>
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

      {/* Scanner + Sélecteur prix */}
      <div className="bg-base-100 rounded-xl shadow-md border border-base-300 p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Barcode className="w-5 h-5 text-primary" />
              </div>
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scanner un code-barres ici..."
                className="input input-bordered w-full pl-12 text-lg font-mono bg-base-200 border-2 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all h-14"
                value={barcodeValue}
                onChange={handleBarcodeScan}
                onKeyDown={handleBarcodeKeyDown}
                onFocus={() => setIsBarcodeFocused(true)}
                onBlur={() => setIsBarcodeFocused(false)}
                autoFocus
                disabled={loading}
              />
              {barcodeValue.length > 0 && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
                  onClick={() => {
                    setBarcodeValue('');
                    if (barcodeInputRef.current) {
                      barcodeInputRef.current.value = '';
                      barcodeInputRef.current.focus();
                    }
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-base-content/50">
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${isBarcodeFocused ? 'bg-success animate-pulse' : 'bg-base-content/20'}`}></span>
                {isBarcodeFocused ? 'Prêt à scanner' : 'Cliquez pour scanner'}
              </span>
              <span className="badge badge-ghost">Support lecteurs USB</span>
              <span className="badge badge-primary">Scan multiple autorisé</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
                <Tag className="w-4 h-4" /> Détail
              </button>

              {hasWholesaleProducts ? (
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
                    priceType === 'gros'
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setPriceType('gros')}
                  title={`${wholesaleProductsCount} produit(s) avec prix de gros`}
                >
                  <Layers className="w-4 h-4" /> Gros
                  <span className="badge badge-xs badge-primary ml-1">
                    {wholesaleProductsCount}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed flex items-center gap-1"
                  title="Aucun produit n'a de prix de gros"
                >
                  <Layers className="w-4 h-4" /> Gros
                  <span className="text-[10px] ml-1">(indispo)</span>
                </button>
              )}
            </div>
          </div>
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
            {!selectedWarehouse && !loading && (
              <span className="text-xs text-error">Requis</span>
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

      {/* Filtres */}
      <div className="bg-base-100 rounded-xl shadow-md border border-base-300 p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher par nom, code, code-barres..."
                className="input input-bordered w-full pl-12"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              className="select select-bordered min-w-[150px]"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Toutes catégories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <select
              className="select select-bordered min-w-[130px]"
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
            >
              <option value="name">Trier par nom</option>
              <option value="selling_price">Prix détail</option>
              {hasWholesaleProducts && (
                <option value="wholesale_price">Prix gros</option>
              )}
              <option value="stock_quantity">Stock</option>
            </select>

            <button
              className="btn btn-ghost"
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>

            <button
              className="btn btn-outline"
              onClick={() => {
                setSelectedCategory('');
                setSearchTerm('');
                setCurrentPage(1);
              }}
            >
              <Filter className="w-4 h-4" /> Réinitialiser
            </button>

            <div className="join">
              <button
                className={`join-item btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                className={`join-item btn ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Produits */}
        <div className="lg:col-span-3 bg-base-100 rounded-xl shadow-xl border border-base-300 overflow-hidden">
          <div className="p-3 bg-base-200 border-b border-base-300 flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-medium">
              <Tag className="w-4 h-4 inline mr-2 text-primary" />
              Prix affiché : <strong>{priceType === 'gros' ? 'Gros' : 'Détail'}</strong>
              <span className="ml-4 text-xs text-base-content/40">
                ({sortedProducts.length} produits)
              </span>
            </span>
            <span className="text-xs text-base-content/60">
              <Barcode className="w-3 h-3 inline mr-1" /> Scan rapide
            </span>
          </div>

          {paginatedProducts.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-20 h-20 mx-auto mb-4 text-base-content/20" />
              <p className="text-base-content/60 text-lg">Aucun produit trouvé</p>
              <button
                className="btn btn-primary mt-4"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  if (barcodeInputRef.current) barcodeInputRef.current.focus();
                }}
              >
                Voir tous les produits
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
              {paginatedProducts.map(product => (
                <div
                  key={product.id}
                  className="card bg-base-200 hover:shadow-lg transition-all duration-200 cursor-pointer border border-transparent hover:border-primary/30"
                  onClick={() => addToCart(product)}
                >
                  <div className="card-body p-3 text-center">
                    <div className="w-full h-24 bg-base-300 rounded-lg flex items-center justify-center mb-2 overflow-hidden relative">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-contain"
                          loading="lazy"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <Package className="w-12 h-12 text-base-content/30" />
                      )}
                      {product.barcode && (
                        <div className="absolute top-1 right-1 bg-primary/80 text-white text-[8px] px-1 rounded">
                          <Barcode className="w-3 h-3 inline" />
                        </div>
                      )}
                    </div>
                    <div className="font-medium text-sm truncate" title={product.name}>{product.name}</div>
                    <div className="text-xs text-base-content/40 truncate">{product.code}</div>

                    <div className="text-xs text-base-content/50 flex flex-wrap justify-center gap-1">
                      <span className={priceType === 'detail' ? 'font-bold text-primary' : ''}>
                        Détail: {formatPrice(product.selling_price)}
                      </span>
                      {product.wholesale_price > 0 && (
                        <span className={priceType === 'gros' ? 'font-bold text-primary' : ''}>
                          Gros: {formatPrice(product.wholesale_price)}
                        </span>
                      )}
                    </div>

                    <div className="text-lg font-bold text-primary">
                      {formatPrice(product.display_price)}
                    </div>

                    <div className="flex justify-center mt-1">
                      {product.wholesale_price > 0 ? (
                        <span className="badge badge-xs badge-primary gap-1">
                          <Layers className="w-2 h-2" /> Gros dispo
                        </span>
                      ) : (
                        <span className="badge badge-xs badge-ghost gap-1 text-base-content/40">
                          Détail uniquement
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
                      {getStatusBadge(product)}
                      <span className="text-xs text-base-content/40">{product.stock_quantity} u.</span>
                    </div>
                    <button
                      className="btn btn-primary btn-sm w-full mt-2 gap-1"
                      onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                      disabled={product.stock_quantity <= 0}
                    >
                      <Plus className="w-3 h-3" /> Ajouter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Code</th>
                    <th>Code-barres</th>
                    <th>Prix détail</th>
                    <th>Prix gros</th>
                    <th>Stock</th>
                    <th>Statut</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map(product => (
                    <tr key={product.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-base-300 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-full w-full object-contain"
                                loading="lazy"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <Package className="w-6 h-6 text-base-content/30" />
                            )}
                          </div>
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td>{product.code}</td>
                      <td>
                        {product.barcode ? (
                          <span className="badge badge-ghost gap-1 text-xs font-mono">
                            <Barcode className="w-3 h-3" /> {product.barcode}
                          </span>
                        ) : (
                          <span className="text-xs text-base-content/30">-</span>
                        )}
                      </td>
                      <td className="font-semibold">{formatPrice(product.selling_price)}</td>
                      <td className="font-semibold text-primary">
                        {product.wholesale_price > 0 ? (
                          formatPrice(product.wholesale_price)
                        ) : (
                          <span className="text-base-content/30 text-xs">Non défini</span>
                        )}
                      </td>
                      <td>{product.stock_quantity}</td>
                      <td>{getStatusBadge(product)}</td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm gap-1"
                          onClick={() => addToCart(product)}
                          disabled={product.stock_quantity <= 0}
                        >
                          <Plus className="w-3 h-3" /> Ajouter
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-base-300">
              <div className="text-sm text-base-content/60">
                {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, sortedProducts.length)} sur {sortedProducts.length}
              </div>
              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="join-item btn btn-sm btn-disabled">
                  {currentPage} / {totalPages}
                </span>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div>
                <select
                  className="select select-bordered select-sm"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value="8">8</option>
                  <option value="12">12</option>
                  <option value="24">24</option>
                  <option value="48">48</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Panier */}
        <div className="lg:col-span-1">
          <div className="bg-base-100 rounded-xl shadow-xl border border-base-300 p-4 flex flex-col h-[700px] lg:h-[calc(100vh-280px)] sticky top-24">
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
                      <ShoppingCart className="w-10 h-10 text-base-content/20" />
                    </div>
                  </div>
                  <p className="text-base-content/40 text-base">Panier vide</p>
                  <p className="text-xs text-base-content/30 mt-1">Scannez un produit</p>
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

                        <div className="flex items-center gap-2 mt-2">
                          <button
                            className="btn btn-ghost btn-xs btn-circle"
                            onClick={() => updateCartQuantity(item.id, -1)}
                            disabled={item.quantity <= 1}
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
                            >
                              {item.quantity}
                            </span>
                          )}

                          <button
                            className="btn btn-ghost btn-xs btn-circle"
                            onClick={() => updateCartQuantity(item.id, 1)}
                            disabled={item.quantity >= item.product.stock_quantity}
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
const PosForm = () => (
  <ErrorBoundary>
    <PosFormContent />
  </ErrorBoundary>
);

export default PosForm;