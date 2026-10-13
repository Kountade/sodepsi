// src/components/ventes/VenteForm.jsx
// ============================================================
// VERSION FINALE — Sélecteur intelligent + modification fiable
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
    console.error('❌ ErrorBoundary a capturé:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-4 text-error">
              <AlertCircle className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Erreur dans le formulaire</h2>
            </div>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-64 text-red-600">
              {this.state.error?.toString()}
            </pre>
            <div className="mt-6 flex gap-3">
              <button onClick={() => window.location.reload()} className="btn btn-primary">
                Recharger la page
              </button>
              <button onClick={() => window.location.href = '/ventes'} className="btn btn-ghost">
                Retour aux ventes
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
const VenteFormContent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  // ============================================================
  // ÉTATS
  // ============================================================
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [lots, setLots] = useState([]);
  const [notification, setNotification] = useState(null);
  const [loadingVente, setLoadingVente] = useState(false);

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

  const [lineForm, setLineForm] = useState({
    product: '',
    quantity: 1,
    unit_price: 0,
    discount: 0,
    tax_rate: 0,
    price_type: 'detail',
    lot: null
  });

  // ============================================================
  // UTILITAIRES
  // ============================================================
  const getToken = () => localStorage.getItem('Token');

  const showNotification = useCallback((message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const normalize = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  };

  // ============================================================
  // ✅ CHARGEMENT DES DONNÉES INITIALES
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

        console.log('🔍 Chargement des données initiales...');

        const [clientsRes, warehousesRes, productsRes] = await Promise.all([
          AxiosInstance.get('/clients/?page_size=2000', {
            headers: { 'Authorization': `Token ${token}` }
          }).catch(err => {
            console.warn('⚠️ Erreur clients:', err.message);
            return { data: [] };
          }),
          AxiosInstance.get('/warehouses/?active=true', {
            headers: { 'Authorization': `Token ${token}` }
          }).catch(err => {
            console.warn('⚠️ Erreur warehouses:', err.message);
            return { data: [] };
          }),
          // ✅ CHARGER TOUS LES PRODUITS D'UN COUP
          AxiosInstance.get('/products/?status=active&page_size=5000', {
            headers: { 'Authorization': `Token ${token}` }
          }).catch(err => {
            console.warn('⚠️ Erreur products:', err.message);
            return { data: [] };
          })
        ]);

        if (!isMounted) return;

        const clientsData = normalize(clientsRes.data);
        const warehousesData = normalize(warehousesRes.data);
        const productsData = normalize(productsRes.data);

        console.log('✅ Données chargées:', {
          clients: clientsData.length,
          products: productsData.length,
          warehouses: warehousesData.length
        });

        setClients(clientsData);
        setProducts(productsData);
        setWarehouses(warehousesData);

        // Sélection automatique de l'entrepôt
        if (warehousesData.length === 1 && !isEdit) {
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
  }, [navigate, showNotification, isEdit]);

  // ============================================================
  // ✅ CHARGEMENT DES LOTS
  // ============================================================
  useEffect(() => {
    if (!formData.warehouse) {
      setLots([]);
      return;
    }

    let isMounted = true;

    const fetchLots = async () => {
      try {
        const token = getToken();
        if (!token) return;

        const response = await AxiosInstance.get(
          `/lots/?warehouse=${formData.warehouse}&page_size=5000`,
          { headers: { 'Authorization': `Token ${token}` } }
        );

        if (!isMounted) return;

        const lotsData = normalize(response.data);
        setLots(lotsData);
      } catch (error) {
        console.error('❌ Erreur chargement lots:', error);
        if (isMounted) setLots([]);
      }
    };

    fetchLots();

    return () => { isMounted = false; };
  }, [formData.warehouse]);

  // ============================================================
  // ✅ CHARGEMENT DE LA VENTE EN MODIFICATION
  // ============================================================
  useEffect(() => {
    if (!isEdit || !id) return;

    let isMounted = true;

    const fetchVente = async () => {
      setLoadingVente(true);
      try {
        const token = getToken();
        if (!token) {
          showNotification('Session expirée', 'error');
          return;
        }

        const response = await AxiosInstance.get(`/sales/${id}/`, {
          headers: { 'Authorization': `Token ${token}` }
        });

        if (!isMounted) return;

        const data = response.data || {};
        console.log('📥 Vente chargée:', data);

        setFormData({
          client: data.client?.id || data.client_id || data.client || '',
          warehouse: data.warehouse || data.warehouse_id || '',
          payment_due_date: data.payment_due_date || '',
          discount_type: data.discount_type || 'percentage',
          discount_value: parseFloat(data.discount_value) || 0,
          tax_rate: parseFloat(data.tax_rate) || 0,
          shipping_fee: parseFloat(data.shipping_fee) || 0,
          payment_method: data.payment_method || '',
          delivery_method: data.delivery_method || '',
          delivery_address: data.delivery_address || '',
          notes: data.notes || '',
          internal_notes: data.internal_notes || '',
          lines: (data.lines || []).map(line => ({
            id: line.id,
            product: line.product,
            product_name: line.product_name || '',
            product_code: line.product_code || '',
            lot: line.lot || null,
            lot_number: line.lot_number || '',
            quantity: line.quantity || 1,
            unit_price: parseFloat(line.unit_price) || 0,
            discount: parseFloat(line.discount) || 0,
            tax_rate: parseFloat(line.tax_rate) || 0,
            total: parseFloat(line.total) || 0,
            price_type: line.price_type || 'detail'
          }))
        });

        // ✅ Charger les produits manquants (au cas où ils n'auraient pas été chargés)
        const lineProductIds = (data.lines || [])
          .map(l => l.product)
          .filter(Boolean);

        if (lineProductIds.length > 0) {
          const missingIds = lineProductIds.filter(
            pid => !products.some(p => p.id === pid)
          );

          if (missingIds.length > 0) {
            console.log('📦 Chargement des produits manquants:', missingIds);
            const missingProductsRes = await Promise.all(
              missingIds.map(pid =>
                AxiosInstance.get(`/products/${pid}/`, {
                  headers: { 'Authorization': `Token ${token}` }
                }).catch(() => null)
              )
            );

            const missingProducts = missingProductsRes
              .filter(r => r && r.data)
              .map(r => r.data);

            if (missingProducts.length > 0 && isMounted) {
              setProducts(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const newOnes = missingProducts.filter(p => !existingIds.has(p.id));
                return [...prev, ...newOnes];
              });
            }
          }
        }
      } catch (error) {
        console.error('❌ Erreur chargement vente:', error);
        if (isMounted) {
          showNotification('Erreur de chargement de la vente', 'error');
          setTimeout(() => navigate('/ventes'), 1500);
        }
      } finally {
        if (isMounted) setLoadingVente(false);
      }
    };

    fetchVente();

    return () => { isMounted = false; };
  }, [id, isEdit, navigate, showNotification, products]);

  // ============================================================
  // ✅ CALCUL DES TOTAUX
  // ============================================================
  const totals = useMemo(() => {
    let subtotal = 0;
    const lines = formData.lines || [];

    lines.forEach(line => {
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
  }, [formData.lines, formData.discount_type, formData.discount_value, formData.tax_rate, formData.shipping_fee]);

  // ============================================================
  // ✅ GESTION DES PRODUITS
  // ============================================================
  const getProductById = useCallback((productId) => {
    if (!productId) return null;
    const idNum = parseInt(productId);
    return products.find(p => p.id === idNum) || null;
  }, [products]);

  const getProductPrices = useCallback((productId) => {
    const product = getProductById(productId);
    if (!product) return { selling_price: 0, wholesale_price: 0 };
    return {
      selling_price: parseFloat(product.selling_price) || 0,
      wholesale_price: parseFloat(product.wholesale_price) || 0
    };
  }, [getProductById]);

  const getPriceByType = useCallback((productId, priceType) => {
    const prices = getProductPrices(productId);
    if (priceType === 'gros') {
      return prices.wholesale_price > 0 ? prices.wholesale_price : prices.selling_price;
    }
    return prices.selling_price;
  }, [getProductPrices]);

  const hasWholesalePrice = useCallback((productId) => {
    return getProductPrices(productId).wholesale_price > 0;
  }, [getProductPrices]);

  // ============================================================
  // ✅ GESTION DES LOTS
  // ============================================================
  const getAvailableLotsForProduct = useCallback((productId) => {
    if (!productId || !formData.warehouse) return [];
    const idNum = parseInt(productId);
    return (lots || []).filter(lot =>
      lot.product === idNum &&
      (parseFloat(lot.available_quantity) || 0) > 0
    );
  }, [lots, formData.warehouse]);

  const getBestLotForProduct = useCallback((productId, quantity) => {
    const availableLots = getAvailableLotsForProduct(productId);
    if (availableLots.length === 0) return null;

    const sortedLots = [...availableLots].sort((a, b) => {
      if (a.expiry_date && b.expiry_date) {
        return new Date(a.expiry_date) - new Date(b.expiry_date);
      }
      if (a.expiry_date) return -1;
      if (b.expiry_date) return 1;
      return a.id - b.id;
    });

    for (const lot of sortedLots) {
      if ((parseFloat(lot.available_quantity) || 0) >= quantity) return lot;
    }

    return sortedLots.reduce((best, current) =>
      (parseFloat(current.available_quantity) || 0) > (parseFloat(best.available_quantity) || 0)
        ? current : best
    );
  }, [getAvailableLotsForProduct]);

  const checkStockAvailability = useCallback((productId, quantity) => {
    const product = getProductById(productId);
    if (!product) return { available: false, message: 'Produit non trouvé' };

    const availableStock = parseFloat(product.current_stock) || 0;
    if (availableStock < quantity) {
      return {
        available: false,
        message: `Stock insuffisant pour ${product.name}. Disponible: ${availableStock}, Demandé: ${quantity}`
      };
    }

    return { available: true };
  }, [getProductById]);

  // ============================================================
  // ✅ AJOUTER UNE LIGNE
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

    const stockCheck = checkStockAvailability(productId, quantity);
    if (!stockCheck.available) {
      showNotification(stockCheck.message, 'error');
      return;
    }

    const productExists = formData.lines.some(
      line => parseInt(line.product) === productId
    );
    if (productExists) {
      showNotification(`Le produit "${product.name}" est déjà dans la liste`, 'warning');
      return;
    }

    // ✅ Sélection automatique du meilleur lot
    let lotId = lineForm.lot;
    let lotNumber = '';

    if (!lotId) {
      const bestLot = getBestLotForProduct(productId, quantity);
      lotId = bestLot?.id || null;
      lotNumber = bestLot?.lot_number || '';
    } else {
      const selectedLot = lots.find(l => l.id === parseInt(lotId));
      lotNumber = selectedLot?.lot_number || '';
    }

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
      showNotification(`Le produit "${product.name}" n'a pas de prix de gros. Utilisation du prix détail.`, 'warning');
      unitPrice = getPriceByType(productId, 'detail');
    }

    const discount = parseFloat(lineForm.discount) || 0;
    const taxRate = parseFloat(lineForm.tax_rate) || 0;
    const total = (quantity * unitPrice) - discount;

    const newLine = {
      product: productId,
      product_name: product.name || 'Produit',
      product_code: product.code || '',
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
    setFormData(prev => ({ ...prev, lines: [...prev.lines, newLine] }));
    setLineForm({
      product: '',
      quantity: 1,
      unit_price: 0,
      discount: 0,
      tax_rate: 0,
      price_type: 'detail',
      lot: null
    });
    setTimeout(() => setAdding(false), 300);
  };

  const removeLine = (index) => {
    const newLines = (formData.lines || []).filter((_, i) => i !== index);
    setFormData({ ...formData, lines: newLines });
  };

  // ✅ Modification corrigée
  const updateLine = (index, field, value) => {
    const newLines = [...(formData.lines || [])];
    const line = { ...newLines[index] };

    if (field === 'quantity' || field === 'unit_price' || field === 'discount') {
      const newValue = parseFloat(value) || 0;
      line[field] = newValue;

      // Recalcul du total
      line.total = (parseFloat(line.quantity) || 0) * (parseFloat(line.unit_price) || 0)
        - (parseFloat(line.discount) || 0);

      // Si la quantité change, réassigner le lot si nécessaire
      if (field === 'quantity') {
        const availableLots = getAvailableLotsForProduct(line.product);
        const currentLot = availableLots.find(l => l.id === line.lot);

        if (!currentLot || (parseFloat(currentLot.available_quantity) || 0) < newValue) {
          const bestLot = getBestLotForProduct(line.product, newValue);
          if (bestLot) {
            line.lot = bestLot.id;
            line.lot_number = bestLot.lot_number || '';
          }
        }
      }
    } else {
      line[field] = value;
    }

    newLines[index] = line;
    setFormData({ ...formData, lines: newLines });
  };

  // ✅ Modifier le type de prix d'une ligne
  const updateLinePriceType = (index, newPriceType) => {
    const newLines = [...(formData.lines || [])];
    const line = { ...newLines[index] };

    const prices = getProductPrices(line.product);
    if (newPriceType === 'gros' && prices.wholesale_price <= 0) {
      showNotification(`Ce produit n'a pas de prix de gros`, 'error');
      return;
    }

    line.price_type = newPriceType;
    line.unit_price = newPriceType === 'gros' ? prices.wholesale_price : prices.selling_price;
    line.total = (parseFloat(line.quantity) || 0) * line.unit_price
      - (parseFloat(line.discount) || 0);

    newLines[index] = line;
    setFormData({ ...formData, lines: newLines });
  };

  // ============================================================
  // ✅ GESTION DU FORMULAIRE DE LIGNE
  // ============================================================
  const handleProductSelect = (productId) => {
    const idNum = productId ? parseInt(productId) : null;

    let defaultPrice = 0;
    let lotId = null;

    if (idNum) {
      defaultPrice = getPriceByType(idNum, lineForm.price_type);

      const bestLot = getBestLotForProduct(idNum, lineForm.quantity || 1);
      if (bestLot) {
        lotId = bestLot.id;
      }
    }

    setLineForm({
      ...lineForm,
      product: productId,
      unit_price: defaultPrice,
      lot: lotId
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
  const totalLotsStock = availableLotsInfo.reduce(
    (sum, lot) => sum + (parseFloat(lot.available_quantity) || 0), 0
  );

  // ============================================================
  // ✅ SOUMISSION
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

      for (const line of formData.lines) {
        const stockCheck = checkStockAvailability(line.product, line.quantity);
        if (!stockCheck.available) {
          showNotification(stockCheck.message, 'error');
          setSaving(false);
          return;
        }
      }

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
          quantity: parseInt(line.quantity),
          unit_price: parseFloat(line.unit_price),
          discount: parseFloat(line.discount) || 0,
          tax_rate: parseFloat(line.tax_rate) || 0,
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

      showNotification(isEdit ? '✅ Vente modifiée' : '✅ Vente créée', 'success');
      setTimeout(() => navigate(`/ventes/${response.data.id}`), 1500);

    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      let errorMessage = 'Erreur lors de la sauvegarde';

      if (error.response?.data) {
        const data = error.response.data;
        if (data.lines && Array.isArray(data.lines)) {
          errorMessage = data.lines[0] || 'Erreur de validation';
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (typeof data === 'object') {
          const firstError = Object.values(data).flat()[0];
          if (firstError) errorMessage = String(firstError);
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
      }
      showNotification(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // ✅ RENDU
  // ============================================================
  if (loadingVente && isEdit) {
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
        {/* INFOS GÉNÉRALES */}
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
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Date d'échéance (défaut 30j)</span>
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

        {/* PRODUITS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> Produits
            </h2>
            <span className="text-sm text-gray-500">
              {products.length} produit(s) disponible(s) — tapez une lettre dans la liste pour y accéder directement
            </span>
          </div>

          {selectedProduct && (
            <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Stock:</span>
                <span className={`font-bold ${(selectedProduct.current_stock || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedProduct.current_stock || 0} unités
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Lots:</span>
                <span className="font-bold text-blue-600">
                  {availableLotsInfo.length} ({totalLotsStock} unités)
                </span>
              </div>
            </div>
          )}

          {/* ✅ Barre d'ajout - SANS CHAMP DE RECHERCHE */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-4 p-4 bg-gray-50 rounded-xl">
            {/* ✅ SELECTEUR INTELLIGENT : tapez une lettre pour naviguer */}
            <div className="col-span-2">
              <label className="label-text text-xs text-gray-500 mb-1 block">
                💡 Tapez une lettre pour sauter au produit
              </label>
              <select
                className="select select-bordered w-full"
                value={lineForm.product}
                onChange={(e) => handleProductSelect(e.target.value)}
                size="1"
              >
                <option value="">-- Sélectionner un produit --</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-text text-xs text-gray-500 mb-1 block">Quantité</label>
              <input
                type="number"
                placeholder="Qté"
                className="input input-bordered w-full"
                value={lineForm.quantity}
                onChange={(e) => setLineForm({ ...lineForm, quantity: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>

            <div className="col-span-2">
              <label className="label-text text-xs text-gray-500 mb-1 block">Type de prix</label>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden h-[42px]">
                <button
                  type="button"
                  className={`flex-1 px-3 py-2 text-sm font-medium ${lineForm.price_type === 'detail' ? 'bg-primary text-white' : 'bg-white text-gray-600'}`}
                  onClick={() => handlePriceTypeChange('detail')}
                >
                  <Tag className="w-3 h-3 inline mr-1" /> Détail
                </button>
                <button
                  type="button"
                  className={`flex-1 px-3 py-2 text-sm font-medium ${lineForm.price_type === 'gros' ? 'bg-primary text-white' : 'bg-white text-gray-600'}`}
                  onClick={() => handlePriceTypeChange('gros')}
                >
                  <Layers className="w-3 h-3 inline mr-1" /> Gros
                </button>
              </div>
            </div>

            <div>
              <label className="label-text text-xs text-gray-500 mb-1 block">Prix</label>
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
              <label className="label-text text-xs text-gray-500 mb-1 block">Remise</label>
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
              <label className="label-text text-xs text-gray-500 mb-1 block">&nbsp;</label>
              <button
                type="button"
                onClick={addLine}
                className="btn btn-primary w-full gap-2 h-[42px]"
                disabled={adding}
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Ajouter
              </button>
            </div>
          </div>

          {/* Table des lignes */}
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th>Produit</th>
                  <th className="text-center">Lot</th>
                  <th className="text-center">Type prix</th>
                  <th className="text-center">Qté</th>
                  <th className="text-right">Prix</th>
                  <th className="text-right">Remise</th>
                  <th className="text-right">Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(formData.lines || []).map((line, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td>
                      <div className="font-medium">{line.product_name}</div>
                      <div className="text-xs text-gray-400">{line.product_code}</div>
                    </td>
                    <td className="text-center text-sm text-gray-500">
                      {line.lot_number || '-'}
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        className={`badge cursor-pointer ${line.price_type === 'gros' ? 'badge-primary' : 'badge-ghost'}`}
                        onClick={() => updateLinePriceType(index, line.price_type === 'gros' ? 'detail' : 'gros')}
                        title="Cliquer pour changer le type de prix"
                      >
                        {line.price_type === 'gros' ? 'Gros' : 'Détail'}
                      </button>
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
                    <span>Sous-total</span>
                    <span className="font-semibold">{totals.subtotal.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Remise</span>
                    <span className="text-error">-{totals.discountAmount.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>TVA ({formData.tax_rate}%)</span>
                    <span>{totals.totalTax.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Livraison</span>
                    <span>{(parseFloat(formData.shipping_fee) || 0).toLocaleString('fr-FR')} FCFA</span>
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

        {/* REMISES ET TAXES */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" /> Remises et taxes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Type de remise</span></label>
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
              <label className="label"><span className="label-text font-medium">Valeur remise</span></label>
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
              <label className="label"><span className="label-text font-medium">TVA (%)</span></label>
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
              <label className="label"><span className="label-text font-medium">Frais livraison</span></label>
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

        {/* LIVRAISON ET PAIEMENT */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" /> Livraison et paiement
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Méthode de livraison</span></label>
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
              <label className="label"><span className="label-text font-medium">Méthode de paiement</span></label>
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
              <label className="label"><span className="label-text font-medium">Adresse de livraison</span></label>
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

        {/* NOTES */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Notes
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Notes</span></label>
              <textarea
                className="textarea textarea-bordered w-full"
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes sur la vente"
              />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Notes internes</span></label>
              <textarea
                className="textarea textarea-bordered w-full"
                rows="2"
                value={formData.internal_notes}
                onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                placeholder="Notes pour usage interne"
              />
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/ventes')} className="btn btn-ghost">
            Annuler
          </button>
          <button type="submit" className="btn btn-primary gap-2" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Enregistrement...' : isEdit ? 'Enregistrer les modifications' : 'Créer la vente'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ============================================================
// WRAPPER
// ============================================================
const VenteForm = () => (
  <ErrorBoundary>
    <VenteFormContent />
  </ErrorBoundary>
);

export default VenteForm;