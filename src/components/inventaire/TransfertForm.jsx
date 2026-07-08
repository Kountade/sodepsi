// src/components/stocks/TransfertForm.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, CheckCircle, AlertCircle,
  Loader2, Warehouse, Plus, Trash2, Search, CheckSquare, Square
} from 'lucide-react';

const TransfertForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]); // IDs des produits sélectionnés
  const [productQuantities, setProductQuantities] = useState({}); // { productId: quantity }
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    from_warehouse_id: '',
    to_warehouse_id: '',
    reason: '',
    notes: '',
    items: [] // { product_id, product_name, quantity, max_quantity }
  });

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [errors, setErrors] = useState({});

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const fetchWarehouses = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/warehouses/?active=true', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setWarehouses(response.data || []);
    } catch (error) {
      showNotification('Erreur chargement entrepôts', 'error');
    }
  };

  const fetchProducts = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/products/?status=active', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setAllProducts(response.data || []);
    } catch (error) {
      showNotification('Erreur chargement produits', 'error');
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Sélection / désélection d'un produit
  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
    // Initialiser la quantité à 1 si pas encore définie
    if (!productQuantities[productId]) {
      setProductQuantities(prev => ({ ...prev, [productId]: 1 }));
    }
  };

  // Sélectionner / désélectionner tous
  const toggleSelectAll = () => {
    const filteredIds = filteredProducts.map(p => p.id);
    if (selectedProducts.length === filteredIds.length && filteredIds.length > 0) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredIds);
      // Initialiser les quantités pour tous
      const qtyMap = {};
      filteredIds.forEach(id => { qtyMap[id] = productQuantities[id] || 1; });
      setProductQuantities(prev => ({ ...prev, ...qtyMap }));
    }
  };

  // Mettre à jour la quantité pour un produit
  const handleQuantityChange = (productId, value) => {
    const qty = parseInt(value) || 0;
    setProductQuantities(prev => ({ ...prev, [productId]: qty }));
  };

  // Ajouter les produits sélectionnés au panier (items)
  const addSelectedToCart = () => {
    if (selectedProducts.length === 0) {
      showNotification('Aucun produit sélectionné', 'error');
      return;
    }

    // Filtrer ceux qui ont une quantité > 0
    const newItems = selectedProducts
      .filter(id => (productQuantities[id] || 0) > 0)
      .map(id => {
        const product = allProducts.find(p => p.id === id);
        return {
          product_id: id,
          product_name: product ? product.name : '',
          quantity: productQuantities[id] || 0,
          max_quantity: product ? product.current_stock || 0 : 0
        };
      });

    if (newItems.length === 0) {
      showNotification('Aucun produit avec quantité > 0 sélectionné', 'error');
      return;
    }

    // Fusionner avec les items existants (si déjà dans le panier, on cumule ? ou on écrase ?)
    // Ici, on ajoute simplement, mais on pourrait vérifier les doublons.
    // On va éviter les doublons en supprimant les anciens items du même produit.
    const existingProductIds = formData.items.map(item => item.product_id);
    const itemsToAdd = newItems.filter(item => !existingProductIds.includes(item.product_id));

    if (itemsToAdd.length === 0) {
      showNotification('Ces produits sont déjà dans le panier', 'info');
      return;
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, ...itemsToAdd]
    }));

    // Désélectionner les produits ajoutés
    const addedIds = itemsToAdd.map(item => item.product_id);
    setSelectedProducts(prev => prev.filter(id => !addedIds.includes(id)));
    showNotification(`${itemsToAdd.length} produit(s) ajouté(s) au panier`, 'success');
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemQuantityChange = (index, value) => {
    const qty = parseInt(value) || 0;
    const items = [...formData.items];
    items[index].quantity = qty;
    setFormData(prev => ({ ...prev, items }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.from_warehouse_id) newErrors.from_warehouse_id = 'Entrepôt source requis';
    if (!formData.to_warehouse_id) newErrors.to_warehouse_id = 'Entrepôt destination requis';
    if (formData.from_warehouse_id === formData.to_warehouse_id) {
      newErrors.to_warehouse_id = 'Les entrepôts doivent être différents';
    }
    if (formData.items.length === 0) newErrors.items = 'Ajoutez au moins un produit à transférer';
    for (let item of formData.items) {
      if (item.quantity <= 0 || item.quantity > item.max_quantity) {
        newErrors.items = `Quantité invalide pour ${item.product_name}`;
        break;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const token = getToken();
      const payload = {
        from_warehouse_id: parseInt(formData.from_warehouse_id),
        to_warehouse_id: parseInt(formData.to_warehouse_id),
        items: formData.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        })),
        reason: formData.reason,
        notes: formData.notes
      };

      await AxiosInstance.post('/transfers/', payload, {
        headers: { 'Authorization': `Token ${token}` }
      });

      showNotification('Transfert effectué avec succès', 'success');
      setTimeout(() => navigate('/transferts'), 2000);
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
        const msg = error.response.data.error || error.response.data.message || 'Erreur lors du transfert';
        showNotification(msg, 'error');
        if (error.response.data.errors) {
          setErrors(error.response.data.errors);
        }
      } else {
        showNotification('Erreur réseau', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrer les produits pour la liste
  const filteredProducts = allProducts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculer le nombre de produits sélectionnés
  const selectedCount = selectedProducts.length;

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification({ ...notification, show: false })}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/transferts')} className="btn btn-ghost btn-sm btn-square">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Transfert entre entrepôts</h1>
            <p className="text-sm text-gray-500">Déplacez des produits d'un entrepôt à un autre</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-6xl mx-auto space-y-6">
        {/* Entrepôts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control w-full">
            <label className="label"><span className="label-text font-medium">Entrepôt source *</span></label>
            <select
              name="from_warehouse_id"
              value={formData.from_warehouse_id}
              onChange={handleChange}
              className={`select select-bordered w-full ${errors.from_warehouse_id ? 'select-error' : ''}`}
            >
              <option value="">Sélectionner</option>
              {warehouses.map(wh => (
                <option key={wh.id} value={wh.id}>{wh.name}</option>
              ))}
            </select>
            {errors.from_warehouse_id && <span className="text-error text-sm mt-1">{errors.from_warehouse_id}</span>}
          </div>
          <div className="form-control w-full">
            <label className="label"><span className="label-text font-medium">Entrepôt destination *</span></label>
            <select
              name="to_warehouse_id"
              value={formData.to_warehouse_id}
              onChange={handleChange}
              className={`select select-bordered w-full ${errors.to_warehouse_id ? 'select-error' : ''}`}
            >
              <option value="">Sélectionner</option>
              {warehouses.map(wh => (
                <option key={wh.id} value={wh.id}>{wh.name}</option>
              ))}
            </select>
            {errors.to_warehouse_id && <span className="text-error text-sm mt-1">{errors.to_warehouse_id}</span>}
          </div>
        </div>

        {/* Sélection de produits avec cases à cocher */}
        <div className="form-control w-full">
          <label className="label"><span className="label-text font-medium">Sélectionner les produits à transférer</span></label>
          <div className="flex flex-wrap gap-2 mb-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filtrer les produits..."
                className="input input-bordered w-full pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={toggleSelectAll}>
              {selectedCount === filteredProducts.length && filteredProducts.length > 0 ? 'Désélectionner tout' : 'Tout sélectionner'}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm gap-1"
              onClick={addSelectedToCart}
              disabled={selectedCount === 0}
            >
              <Plus className="w-4 h-4" />
              Ajouter les sélectionnés ({selectedCount})
            </button>
          </div>

          {/* Liste des produits avec cases à cocher */}
          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left w-10">
                    <input
                      type="checkbox"
                      checked={selectedCount === filteredProducts.length && filteredProducts.length > 0}
                      onChange={toggleSelectAll}
                      className="checkbox checkbox-sm"
                    />
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold">Code</th>
                  <th className="px-3 py-2 text-left text-sm font-semibold">Nom</th>
                  <th className="px-3 py-2 text-center text-sm font-semibold">Stock disponible</th>
                  <th className="px-3 py-2 text-center text-sm font-semibold">Quantité à transférer</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-gray-500">Aucun produit trouvé</td>
                  </tr>
                ) : (
                  filteredProducts.map(product => {
                    const isChecked = selectedProducts.includes(product.id);
                    const qty = productQuantities[product.id] || 1;
                    const maxStock = product.current_stock || 0;
                    return (
                      <tr key={product.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleProductSelection(product.id)}
                            className="checkbox checkbox-sm"
                          />
                        </td>
                        <td className="px-3 py-2 text-sm">{product.code}</td>
                        <td className="px-3 py-2">{product.name}</td>
                        <td className="px-3 py-2 text-center">{maxStock}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            max={maxStock}
                            value={qty}
                            onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                            disabled={!isChecked}
                            className={`input input-bordered input-sm w-20 text-center ${!isChecked ? 'opacity-50' : ''}`}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {errors.items && <span className="text-error text-sm mt-1">{errors.items}</span>}
        </div>

        {/* Panier : Liste des produits sélectionnés à transférer */}
        {formData.items.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold text-gray-700 mb-2">Produits à transférer ({formData.items.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Produit</th>
                    <th className="px-4 py-2 text-center text-sm font-semibold">Quantité disponible</th>
                    <th className="px-4 py-2 text-center text-sm font-semibold">Quantité à transférer</th>
                    <th className="px-4 py-2 text-center text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, idx) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="px-4 py-2">{item.product_name}</td>
                      <td className="px-4 py-2 text-center">{item.max_quantity}</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="1"
                          max={item.max_quantity}
                          value={item.quantity}
                          onChange={(e) => handleItemQuantityChange(idx, e.target.value)}
                          className="input input-bordered input-sm w-24 text-center"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button type="button" className="btn btn-ghost btn-sm btn-square text-error" onClick={() => removeItem(idx)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Raison et notes */}
        <div className="form-control w-full">
          <label className="label"><span className="label-text font-medium">Raison</span></label>
          <input
            type="text"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            placeholder="Ex: Réapprovisionnement magasin principal"
            className="input input-bordered w-full"
          />
        </div>
        <div className="form-control w-full">
          <label className="label"><span className="label-text font-medium">Notes</span></label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="textarea textarea-bordered w-full h-20"
            placeholder="Informations complémentaires..."
          />
        </div>

        {/* Boutons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
          <button type="button" className="btn btn-ghost flex-1" onClick={() => navigate('/transferts')} disabled={submitting}>
            Annuler
          </button>
          <button type="submit" className="btn btn-primary flex-1 gap-2" disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {submitting ? 'Transfert en cours...' : 'Effectuer le transfert'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransfertForm;