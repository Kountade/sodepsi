// src/components/stock/TransfertForm.jsx
// Version avec redirection automatique vers /transferts après succès

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, Plus, Package, Building2,
  AlertCircle, CheckCircle, RefreshCw, Trash2
} from 'lucide-react';

const TransfertForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [stockMap, setStockMap] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Données du formulaire
  const [formData, setFormData] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    items: [],
    reason: '',
    notes: '',
  });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const token = getToken();
        const headers = { Authorization: `Token ${token}` };

        const whRes = await AxiosInstance.get('/warehouses/?active=true', { headers });
        setWarehouses(whRes.data);

        const prodRes = await AxiosInstance.get('/products/?status=active', { headers });
        setProducts(prodRes.data);

        setLoading(false);
      } catch (error) {
        console.error('Erreur chargement initial:', error);
        if (error.response?.status === 401) {
          showNotification('Session expirée', 'error');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          showNotification('Erreur de chargement des données', 'error');
        }
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [navigate]);

  useEffect(() => {
    const fetchStocks = async () => {
      if (!formData.fromWarehouseId) {
        setStockMap({});
        return;
      }
      try {
        const token = getToken();
        const headers = { Authorization: `Token ${token}` };
        const res = await AxiosInstance.get(`/stocks/?warehouse=${formData.fromWarehouseId}`, { headers });
        const map = {};
        res.data.forEach(stock => {
          map[stock.product] = {
            quantity: stock.quantity,
            available_quantity: stock.available_quantity,
            product_name: stock.product_name,
            product_code: stock.product_code,
          };
        });
        setStockMap(map);
      } catch (error) {
        console.error('Erreur chargement stocks:', error);
        showNotification('Erreur lors du chargement des stocks', 'error');
      }
    };
    fetchStocks();
  }, [formData.fromWarehouseId]);

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

  const getAvailableStock = (productId) => {
    if (!formData.fromWarehouseId) return 0;
    const stock = stockMap[productId];
    return stock ? stock.available_quantity : 0;
  };

  const isProductSelectable = (productId) => {
    return getAvailableStock(productId) > 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        showNotification(`Stock insuffisant pour ${product?.name || 'le produit'}. Disponible : ${available}`, 'error');
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
      reason: formData.reason,
      notes: formData.notes,
    };

    try {
      const token = getToken();
      const headers = { Authorization: `Token ${token}` };
      const response = await AxiosInstance.post('/transfers/', payload, { headers });

      // Notification de succès
      showNotification(response.data.message || 'Transfert effectué avec succès.', 'success');

      // Redirection vers la liste des transferts après un court délai
      setTimeout(() => {
        navigate('/transferts');
      }, 2000);

      // Réinitialisation partielle du formulaire (optionnel, car on quitte la page)
      setFormData(prev => ({
        ...prev,
        items: [],
        reason: '',
        notes: '',
      }));

    } catch (error) {
      console.error('Erreur transfert:', error);
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'object') {
          const messages = Object.values(data).flat().join(' ');
          showNotification(messages || 'Erreur lors du transfert.', 'error');
        } else {
          showNotification(data.message || data.detail || 'Erreur lors du transfert.', 'error');
        }
      } else {
        showNotification('Erreur réseau. Veuillez réessayer.', 'error');
      }
      setSubmitting(false);
    } finally {
      // Si la requête échoue, on réactive le bouton
      // Si elle réussit, le setSubmitting(false) n'est pas appelé immédiatement
      // car la redirection se fait après 2s, mais on peut le mettre ici
      // Cependant, pour éviter que l'utilisateur clique à nouveau pendant la redirection,
      // on ne désactive pas le bouton immédiatement après le succès (on garde l'état submitting)
      // On peut le remettre à false avant la redirection ou après, mais ce n'est pas critique.
      // Pour plus de sécurité, on le remet à false après le setTimeout.
      // On va gérer cela dans le bloc try après le setTimeout.
    }
  };

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

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification({ ...notification, show: false })}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête avec retour */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => navigate('/transferts')} className="btn btn-ghost btn-sm btn-circle">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="p-2 bg-primary/10 rounded-xl">
                <Package className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Nouveau transfert</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">Transférez du stock d'un entrepôt à un autre</p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sélection des entrepôts */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Entrepôt source *</span>
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
                  <option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</option>
                ))}
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Entrepôt destination *</span>
              </label>
              <select
                name="toWarehouseId"
                value={formData.toWarehouseId}
                onChange={handleChange}
                className="select select-bordered w-full"
                required
              >
                <option value="">-- Sélectionner --</option>
                {warehouses.map(wh => (
                  <option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</option>
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
            <button type="button" onClick={addItem} className="btn btn-sm btn-primary gap-2" disabled={!formData.fromWarehouseId}>
              <Plus className="w-4 h-4" /> Ajouter un article
            </button>
          </div>

          {formData.items.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Aucun article. Cliquez sur "Ajouter un article".</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.items.map((item) => {
                const available = getAvailableStock(item.productId);
                return (
                  <div key={item.id} className="flex flex-wrap items-end gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1 min-w-[150px]">
                      <label className="label-text text-xs font-medium">Produit *</label>
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
                              {p.code} - {p.name} (stock: {available})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="w-28">
                      <label className="label-text text-xs font-medium">Qté *</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value, 10) || 0)}
                        className="input input-bordered w-full"
                        required
                      />
                    </div>
                    <div className="flex items-center">
                      {item.productId && (
                        <span className="text-xs text-gray-500 mr-2">Dispo: {available}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="btn btn-ghost btn-sm btn-circle text-error"
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
              <label className="label"><span className="label-text font-semibold">Motif</span></label>
              <input
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                className="input input-bordered"
                placeholder="Ex: Réapprovisionnement magasin"
              />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">Notes</span></label>
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
          <button type="button" onClick={() => navigate('/transferts')} className="btn btn-ghost gap-2">
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary gap-2"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span> Envoi...
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

export default TransfertForm;