// src/components/pos/PosForm.jsx
// ============================================================
// VERSION AVEC GESTION DES PRIX DÉTAIL/GROS
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Minus, Trash2, Search, RefreshCw, Filter,
  ShoppingCart, X, AlertCircle, CheckCircle, Eye,
  ChevronLeft, ChevronRight, ArrowUpDown, LayoutGrid, List,
  Package, AlertTriangle, Clock, DollarSign, Warehouse,
  User, CreditCard, Phone, Receipt, Loader,
  Check, Box, Settings, LogOut, Percent, Barcode,
  Save, Tag, Layers
} from 'lucide-react';

const PosForm = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  // États
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
  const [newCustomer, setNewCustomer] = useState({ first_name: '', last_name: '', phone: '', email: '' });
  
  // ✅ NOUVEAU : Type de prix par défaut pour le POS
  const [priceType, setPriceType] = useState('detail'); // 'detail' ou 'gros'

  const getToken = () => localStorage.getItem('Token');

  // ============================================================
  // 1. Chargement des données
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
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const headers = { 'Authorization': `Token ${token}` };

      const [productsRes, categoriesRes, customersRes, warehousesRes] = await Promise.all([
        AxiosInstance.get('/products/?status=active', { headers }),
        AxiosInstance.get('/categories/', { headers }),
        AxiosInstance.get('/clients/', { headers }),
        AxiosInstance.get('/warehouses/?active=true', { headers })
      ]);

      // ✅ Récupérer tous les prix : selling_price ET wholesale_price
      const productsWithData = (productsRes.data || []).map(product => ({
        ...product,
        image_url: product.image_url || getImageUrl(product.image),
        stock_quantity: product.current_stock || 0,
        selling_price: parseFloat(product.selling_price) || 0,
        wholesale_price: parseFloat(product.wholesale_price) || 0,
        // Prix affiché selon le type sélectionné
        display_price: priceType === 'gros' 
          ? (parseFloat(product.wholesale_price) || parseFloat(product.selling_price) || 0)
          : (parseFloat(product.selling_price) || 0)
      }));

      setProducts(productsWithData);
      setCategories(categoriesRes.data || []);
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

  useEffect(() => {
    fetchData();
    setTimeout(() => searchInputRef.current?.focus(), 500);
  }, []);

  // ✅ Mettre à jour l'affichage quand le type de prix change
  useEffect(() => {
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
  // 2. Filtrage et tri des produits
  // ============================================================
  const filteredProducts = React.useMemo(() => {
    let filtered = products;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.code?.toLowerCase().includes(term) ||
        p.barcode?.toLowerCase().includes(term)
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === parseInt(selectedCategory));
    }
    return filtered;
  }, [products, searchTerm, selectedCategory]);

  const sortedProducts = React.useMemo(() => {
    const sorted = [...filteredProducts];
    sorted.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      
      if (sortField === 'stock_quantity' || sortField === 'selling_price' || sortField === 'wholesale_price') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredProducts, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ============================================================
  // 3. Gestion du panier
  // ============================================================
  const addToCart = (product, quantity = 1) => {
    if (product.stock_quantity <= 0) {
      showNotification(`Stock épuisé pour ${product.name}`, 'error');
      return;
    }

    // ✅ Utiliser le bon prix selon le type sélectionné
    const unitPrice = priceType === 'gros'
      ? (product.wholesale_price || product.selling_price || 0)
      : (product.selling_price || 0);

    if (unitPrice <= 0) {
      showNotification(`Prix non défini pour ${product.name}`, 'error');
      return;
    }

    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    if (existingIndex !== -1) {
      const newCart = [...cart];
      const newQty = newCart[existingIndex].quantity + quantity;
      if (newQty > product.stock_quantity) {
        showNotification(`Stock insuffisant pour ${product.name}`, 'error');
        return;
      }
      newCart[existingIndex].quantity = newQty;
      newCart[existingIndex].unit_price = unitPrice;
      newCart[existingIndex].total = newQty * unitPrice;
      setCart(newCart);
    } else {
      setCart([...cart, {
        id: Date.now(),
        product: product,
        quantity: quantity,
        unit_price: unitPrice,
        price_type: priceType, // ✅ Stocker le type de prix utilisé
        total: unitPrice * quantity
      }]);
    }
    showNotification(`${product.name} ajouté au panier (${priceType === 'gros' ? 'Gros' : 'Détail'})`, 'success');
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

  const removeCartItem = (itemId) => {
    setCart(cart.filter(i => i.id !== itemId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Vider le panier ?')) {
      setCart([]);
    }
  };

  // ============================================================
  // 4. Calcul des totaux
  // ============================================================
  const totals = React.useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const tax_amount = 0;
    const total = subtotal + tax_amount;
    return { subtotal, tax_amount, total };
  }, [cart]);

  // ============================================================
  // 5. VALIDER LA VENTE - AVEC PRICE_TYPE
  // ============================================================
  const validateSale = async () => {
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
        notes: 'Vente POS',
        internal_notes: '',
        lines: cart.map(item => ({
          product: item.product.id,
          lot: null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: 0,
          tax_rate: 0,
          price_type: item.price_type || 'detail' // ✅ Envoyer le type de prix
        }))
      };

      console.log('📤 Données POS (validation):', dataToSend);

      const response = await AxiosInstance.post('/sales/', dataToSend, {
        headers: { 'Authorization': `Token ${token}` }
      });

      showNotification(`Vente ${response.data.invoice_number} enregistrée avec succès !`, 'success');
      
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
    }
  };

  // ============================================================
  // 6. Gestion des clients
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

  // ============================================================
  // 7. Notification
  // ============================================================
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 5000);
  };

  // ============================================================
  // 8. Formatage
  // ============================================================
  const formatPrice = (price) => {
    if (!price) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const getStatusBadge = (product) => {
    const stock = parseFloat(product.stock_quantity) || 0;
    
    if (stock <= 0) {
      return (
        <div className="badge badge-error gap-1 text-xs">
          <AlertTriangle className="w-3 h-3" />
          Rupture
        </div>
      );
    }
    
    if (product.min_stock > 0 && stock <= product.min_stock) {
      return (
        <div className="badge badge-warning gap-1 text-xs">
          <AlertCircle className="w-3 h-3" />
          Stock faible
        </div>
      );
    }
    
    return (
      <div className="badge badge-success gap-1 text-xs">
        <CheckCircle className="w-3 h-3" />
        En stock
      </div>
    );
  };

  // ============================================================
  // 9. Rendu
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
                  const filtered = customers.filter(c => 
                    c.name?.toLowerCase().includes(term) ||
                    c.phone?.includes(term)
                  );
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
            Point de Vente
          </h1>
          <p className="text-base text-base-content/60">Vente rapide et intuitive</p>
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

      {/* Sélecteur d'entrepôt et client + TYPE DE PRIX */}
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
              <span className="text-xs text-error">⚠️ Entrepôt requis</span>
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

          {/* ✅ SÉLECTEUR DE TYPE DE PRIX - NOUVEAU */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                type="button"
                className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
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
                className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
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
      </div>

      {/* Filtres et recherche */}
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
              <option value="selling_price">Trier par prix détail</option>
              <option value="wholesale_price">Trier par prix gros</option>
              <option value="stock_quantity">Trier par stock</option>
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
              <Filter className="w-4 h-4" />
              Réinitialiser
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

      {/* Contenu principal - Panier et produits */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Produits */}
        <div className="lg:col-span-3 bg-base-100 rounded-xl shadow-xl border border-base-300 overflow-hidden">
          {/* ✅ AFFICHAGE DU TYPE DE PRIX ACTIF */}
          <div className="p-3 bg-base-200 border-b border-base-300 flex items-center justify-between">
            <span className="text-sm font-medium">
              <Tag className="w-4 h-4 inline mr-2 text-primary" />
              Prix affiché : <strong>{priceType === 'gros' ? 'Gros' : 'Détail'}</strong>
            </span>
            <span className="text-xs text-base-content/60">
              {sortedProducts.length} produits disponibles
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
                  className="card bg-base-200 hover:shadow-lg transition-all duration-200 cursor-pointer"
                  onClick={() => addToCart(product)}
                >
                  <div className="card-body p-3 text-center">
                    <div className="w-full h-24 bg-base-300 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Package className="w-12 h-12 text-base-content/30" />
                      )}
                    </div>
                    <div className="font-medium text-sm truncate">{product.name}</div>
                    <div className="text-xs text-base-content/40 truncate">{product.code}</div>
                    
                    {/* ✅ AFFICHAGE DES DEUX PRIX */}
                    <div className="text-xs text-base-content/50">
                      <span className="line-through">{formatPrice(product.selling_price)}</span>
                      {product.wholesale_price > 0 && (
                        <span className="ml-2 text-primary font-medium">{formatPrice(product.wholesale_price)}</span>
                      )}
                    </div>
                    
                    {/* ✅ PRIX AFFICHÉ SELON LE TYPE */}
                    <div className="text-lg font-bold text-primary">
                      {formatPrice(product.display_price)}
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 mt-1">
                      {getStatusBadge(product)}
                      <span className="text-xs text-base-content/40">{product.stock_quantity} unités</span>
                    </div>
                    <button 
                      className="btn btn-primary btn-sm w-full mt-2 gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
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
                          <div className="w-10 h-10 bg-base-300 rounded-lg flex items-center justify-center overflow-hidden">
                            {product.image_url ? (
                              <img 
                                src={product.image_url} 
                                alt={product.name} 
                                className="h-full w-full object-contain"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <Package className="w-6 h-6 text-base-content/30" />
                            )}
                          </div>
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td>{product.code}</td>
                      <td className="font-semibold">{formatPrice(product.selling_price)}</td>
                      <td className="font-semibold text-primary">
                        {product.wholesale_price > 0 ? formatPrice(product.wholesale_price) : '-'}
                      </td>
                      <td>{product.stock_quantity}</td>
                      <td>{getStatusBadge(product)}</td>
                      <td>
                        <button 
                          className="btn btn-primary btn-sm gap-1"
                          onClick={() => addToCart(product)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-base-300">
              <div className="text-sm text-base-content/60">
                Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, sortedProducts.length)} sur {sortedProducts.length}
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
        <div className="lg:col-span-1 bg-base-100 rounded-xl shadow-xl border border-base-300 p-4 flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-4">
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
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Liste du panier */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {cart.map(item => (
              <div key={item.id} className="bg-base-200 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-sm truncate">{item.product.name}</div>
                    <div className="text-xs text-base-content/40">{item.product.code}</div>
                    {/* ✅ AFFICHAGE DU TYPE DE PRIX DANS LE PANIER */}
                    <div className="text-xs">
                      <span className={`badge ${item.price_type === 'gros' ? 'badge-primary' : 'badge-ghost'}`}>
                        {item.price_type === 'gros' ? 'Gros' : 'Détail'}
                      </span>
                      <span className="ml-2 font-semibold text-primary">
                        {formatPrice(item.unit_price)}/unité
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <button 
                        className="btn btn-ghost btn-xs btn-circle"
                        onClick={() => updateCartQuantity(item.id, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold w-6 text-center text-sm">{item.quantity}</span>
                      <button 
                        className="btn btn-ghost btn-xs btn-circle"
                        onClick={() => updateCartQuantity(item.id, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
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
            ))}
            
            {cart.length === 0 && (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-base-content/20" />
                <p className="text-base-content/40">Panier vide</p>
                <p className="text-xs text-base-content/30">Ajoutez des produits</p>
              </div>
            )}
          </div>

          {/* Totaux et validation */}
          <div className="border-t border-base-300 pt-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-base-content/60">Sous-total</span>
                <span>{formatPrice(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-base-content/60">TVA (0%)</span>
                <span>{formatPrice(totals.tax_amount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-primary border-t border-base-300 pt-2">
                <span>Total</span>
                <span>{formatPrice(totals.total)}</span>
              </div>
            </div>

            <button 
              className="btn btn-primary w-full mt-4 h-14 text-lg gap-2"
              onClick={validateSale}
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
              className="btn btn-ghost w-full mt-2 h-12 text-base gap-2"
              onClick={() => setShowCustomerModal(true)}
            >
              <User className="w-4 h-4" />
              {selectedCustomer ? 'Changer de client' : 'Ajouter un client'}
            </button>
          </div>
        </div>
      </div>

      {/* Raccourcis clavier */}
      <div className="fixed bottom-4 right-4 bg-base-100/90 backdrop-blur rounded-2xl shadow-lg p-3 text-xs text-base-content/60 border border-base-300 hidden lg:block">
        <div className="flex items-center gap-4">
          <span><kbd className="px-2 py-1 bg-base-200 rounded">Esc</kbd> Fermer</span>
          <span><kbd className="px-2 py-1 bg-base-200 rounded">Ctrl+Shift+P</kbd> Recherche</span>
          <span><kbd className="px-2 py-1 bg-base-200 rounded">Enter</kbd> Valider</span>
        </div>
      </div>
    </div>
  );
};

export default PosForm;