// src/components/stock/TransfertForm.jsx
// ============================================================
// VERSION COMPLÈTE CORRIGÉE - Compatible pagination DRF
// ============================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, Plus, Package, Building2,
  AlertCircle, CheckCircle, RefreshCw, Trash2
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
    console.error('❌ ErrorBoundary TransfertForm:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-4 text-error">
              <AlertCircle className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Erreur dans le formulaire de transfert</h2>
            </div>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-64 text-red-600">
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
                onClick={() => window.location.href = '/transferts'}
                className="btn btn-ghost"
              >
                Retour aux transferts
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
const TransfertFormContent = () => {
  const navigate = useNavigate();

  // ✅ Guard contre le double-mount React 18
  const hasFetchedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [stockMap, setStockMap] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const [formData, setFormData] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    items: [],
    reason: '',
    notes: '',
  });

  // ==========================================================
  // UTILITAIRES
  // ==========================================================
  const getToken = () => localStorage.getItem('Token');

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  }, []);

  // ✅ NORMALISATION
  const normalizeData = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  };

  // ==========================================================
  // CHARGEMENT DES DONNÉES INITIALES
  // ==========================================================
  useEffect(() => {
    // ✅ Guard contre le double-mount React 18
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    let isMounted = true;

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const token = getToken();
        if (!token) {
          showNotification('Session expirée', 'error');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const headers = { Authorization: `Token ${token}` };

        console.log('🔍 Chargement entrepôts + produits...');

        // ✅ Charger en parallèle avec .catch() pour éviter le crash global
        const [whRes, prodRes] = await Promise.all([
          AxiosInstance.get('/warehouses/?active=true', { headers }).catch(err => {
            console.warn('⚠️ Erreur warehouses:', err.message);
            return { data: [] };
          }),
          AxiosInstance.get('/products/?status=active&page_size=500', { headers }).catch(err => {
            console.warn('⚠️ Erreur products:', err.message);
            return { data: [] };
          }),
        ]);

        if (!isMounted) return;

        const warehousesData = normalizeData(whRes.data);
        const productsData = normalizeData(prodRes.data);

        console.log('✅ Données chargées:', {
          warehouses: warehousesData.length,
          products: productsData.length,
        });

        setWarehouses(warehousesData);
        setProducts(productsData);
        setLoading(false);

      } catch (error) {
        console.error('❌ Erreur chargement initial:', error);
        if (isMounted) {
          if (error.response?.status === 401) {
            showNotification('Session expirée', 'error');
            setTimeout(() => navigate('/login'), 2000);
          } else {
            showNotification('Erreur de chargement des données', 'error');
          }
          setLoading(false);
        }
      }
    };

    fetchInitialData();

    return () => { isMounted = false; };
  }, [navigate, showNotification]);

  // ==========================================================
  // CHARGEMENT DES STOCKS SELON L'ENTREPÔT SOURCE
  // ==========================================================
  useEffect(() => {
    let isMounted = true;

    const fetchStocks = async () => {
      if (!formData.fromWarehouseId) {
        setStockMap({});
        return;
      }

      try {
        const token = getToken();
        const headers = { Authorization: `Token ${token}` };

        const res = await AxiosInstance.get(
          `/stocks/?warehouse=${formData.fromWarehouseId}&page_size=1000`,
          { headers }
        );

        if (!isMounted) return;

        const stocksData = normalizeData(res.data);
        const map = {};

        stocksData.forEach(stock => {
          map[stock.product] = {
            quantity: stock.quantity || 0,
            available_quantity: stock.available_quantity || 0,
            product_name: stock.product_name,
            product_code: stock.product_code,
          };
        });

        setStockMap(map);
      } catch (error) {
        console.error('❌ Erreur chargement stocks:', error);
        if (isMounted) {
          showNotification('Erreur lors du chargement des stocks', 'error');
          setStockMap({});
        }
      }
    };

    fetchStocks();

    return () => { isMounted = false; };
  }, [formData.fromWarehouseId, showNotification]);

  // ==========================================================
  // HANDLERS
  // ==========================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addItem = () => {
    const newItem = {
      id: Date.now() + Math.random(),
      productId: '',
      quantity: 1,
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const removeItem = (itemId) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId),
    }));
  };

  const updateItem = (itemId, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    }));
  };

  // ==========================================================
  // HELPERS
  // ==========================================================
  const getAvailableStock = useCallback((productId) => {
    if (!formData.fromWarehouseId || !productId) return 0;
    const stock = stockMap[productId];
    return stock ? stock.available_quantity : 0;
  }, [formData.fromWarehouseId, stockMap]);

  const isProductSelectable = useCallback((productId) => {
    return getAvailableStock(productId) > 0;
  }, [getAvailableStock]);

  // ==========================================================
  // SOUMISSION
  // ==========================================================
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setNotification(prev => ({ ...prev, show: false }));

    // Validations
    if (!formData.fromWarehouseId || !formData.toWarehouseId) {
      showNotification('Veuillez sélectionner les entrepôts source et destination.', 'error');
      setSubmitting(false);
      return;
    }

    if (formData.fromWarehouseId === formData.toWarehouseId) {
      showNotification('Les entrepôts source et destination doivent être différents.', 'error');
      setSubmitting(false);
      return;
    }

    if (formData.items.length === 0) {
      showNotification('Ajoutez au moins un article à transférer.', 'error');
      setSubmitting(false);
      return;
    }

    for (const item of formData.items) {
      if (!item.productId) {
        showNotification('Tous les articles doivent avoir un produit sélectionné.', 'error');
        setSubmitting(false);
        return;
      }
      if (item.quantity <= 0) {
        showNotification('Les quantités doivent être supérieures à 0.', 'error');
        setSubmitting(false);
        return;
      }
      const available = getAvailableStock(item.productId);
      if (item.quantity > available) {
        const product = products.find(p => p.id === item.productId);
        showNotification(
          `Stock insuffisant pour ${product?.name || 'le produit'}. Disponible : ${available}`,
          'error'
        );
        setSubmitting(false);
        return;
      }
    }

    const payload = {
      from_warehouse_id: parseInt(formData.fromWarehouseId, 10),
      to_warehouse_id: parseInt(formData.toWarehouseId, 10),
      items: formData.items.map(item => ({
        product_id: parseInt(item.productId, 10),
        quantity: parseInt(item.quantity, 10),
      })),
      reason: formData.reason || '',
      notes: formData.notes || '',
    };

    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const headers = { Authorization: `Token ${token}` };
      const response = await AxiosInstance.post('/transfers/', payload, { headers });

      showNotification(
        response.data.message || 'Transfert effectué avec succès.',
        'success'
      );

      // Réinitialisation du formulaire
      setFormData(prev => ({
        ...prev,
        items: [],
        reason: '',
        notes: '',
      }));

      // ✅ Redirection après succès
      setTimeout(() => {
        navigate('/transferts');
      }, 2000);

    } catch (error) {
      console.error('❌ Erreur transfert:', error);

      let errorMessage = 'Erreur lors du transfert.';

      if (error.response?.data) {
        const data = error.response.data;

        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (typeof data === 'object') {
          const messages = [];
          Object.entries(data).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              messages.push(`${key}: ${value.join(', ')}`);
            } else if (typeof value === 'string') {
              messages.push(`${key}: ${value}`);
            }
          });
          if (messages.length > 0) {
            errorMessage = messages.join(' | ');
          }
        }
      }

      showNotification(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================================
  // RENDU : CHARGEMENT
  // ==========================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement du formulaire...</p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDU PRINCIPAL
  // ==========================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success'
                ? <CheckCircle className="w-4 h-4" />
                : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => navigate('/transferts')}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="p-2 bg-primary/10 rounded-xl">
                <Package className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Nouveau transfert
              </h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Transférez du stock d'un entrepôt à un autre
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sélection des entrepôts */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-primary" />
            Entrepôts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  Entrepôt source <span className="text-error">*</span>
                </span>
              </label>
              <select
                name="fromWarehouseId"
                value={formData.fromWarehouseId}
                onChange={handleChange}
                className="select select-bordered w-full"
                required
              >
                <option value="">-- Sélectionner --</option>
                {warehouses.map(wh => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
              {warehouses.length === 0 && (
                <p className="text-warning text-xs mt-1">⚠️ Aucun entrepôt actif</p>
              )}
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  Entrepôt destination <span className="text-error">*</span>
                </span>
              </label>
              <select
                name="toWarehouseId"
                value={formData.toWarehouseId}
                onChange={handleChange}
                className="select select-bordered w-full"
                required
              >
                <option value="">-- Sélectionner --</option>
                {warehouses
                  .filter(wh => String(wh.id) !== String(formData.fromWarehouseId))
                  .map(wh => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Liste des articles */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Articles à transférer
            </h3>
            <button
              type="button"
              onClick={addItem}
              className="btn btn-sm btn-primary gap-2"
              disabled={!formData.fromWarehouseId}
            >
              <Plus className="w-4 h-4" /> Ajouter un article
            </button>
          </div>

          {!formData.fromWarehouseId && (
            <div className="alert alert-info">
              <AlertCircle className="w-5 h-5" />
              <span>Sélectionnez d'abord un entrepôt source pour voir les produits disponibles.</span>
            </div>
          )}

          {formData.fromWarehouseId && formData.items.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Aucun article. Cliquez sur "Ajouter un article".</p>
            </div>
          )}

          {formData.items.length > 0 && (
            <div className="space-y-3">
              {formData.items.map((item) => {
                const available = getAvailableStock(item.productId);
                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-end gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1 min-w-[150px]">
                      <label className="label-text text-xs font-medium">
                        Produit <span className="text-error">*</span>
                      </label>
                      <select
                        value={item.productId}
                        onChange={(e) => updateItem(item.id, 'productId', e.target.value)}
                        className="select select-bordered w-full"
                        required
                      >
                        <option value="">-- Choisir --</option>
                        {products
                          .filter(p => isProductSelectable(p.id))
                          .map(p => (
                            <option key={p.id} value={p.id}>
                              {p.code} - {p.name} (stock: {getAvailableStock(p.id)})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="w-28">
                      <label className="label-text text-xs font-medium">
                        Qté <span className="text-error">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={available || undefined}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.id, 'quantity', parseInt(e.target.value, 10) || 0)
                        }
                        className="input input-bordered w-full"
                        required
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      {item.productId && (
                        <span
                          className={`text-xs ${
                            item.quantity > available ? 'text-error font-bold' : 'text-gray-500'
                          }`}
                        >
                          Dispo: {available}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="btn btn-ghost btn-sm btn-circle text-error"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Champs supplémentaires */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Motif</span>
              </label>
              <input
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                className="input input-bordered"
                placeholder="Ex: Réapprovisionnement magasin"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Notes</span>
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="textarea textarea-bordered"
                rows="2"
                placeholder="Informations complémentaires"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate('/transferts')}
            className="btn btn-ghost gap-2"
            disabled={submitting}
          >
            <X className="w-4 h-4" /> Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary gap-2"
            disabled={submitting || warehouses.length === 0}
          >
            {submitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Envoi...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Valider le transfert
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// ============================================================
// WRAPPER avec ErrorBoundary
// ============================================================
const TransfertForm = () => (
  <ErrorBoundary>
    <TransfertFormContent />
  </ErrorBoundary>
);

export default TransfertForm;