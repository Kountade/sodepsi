// src/components/achats/ReceptionForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Save, X, ClipboardList, RefreshCw, ArrowLeft, Truck,
  Package, CheckCircle, AlertCircle, Calendar, Building2,
  Warehouse
} from 'lucide-react';

const ReceptionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    purchase_order: '',
    expected_date: '',
    warehouse: '',
    delivery_note: '',
    invoice_number: '',
    notes: ''
  });
  
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderLines, setOrderLines] = useState([]);
  const [receptionLines, setReceptionLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  // Récupérer les commandes confirmées
  const fetchPurchaseOrders = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/purchase-orders/?status=confirmed', {
        headers: { Authorization: `Token ${token}` }
      });
      setPurchaseOrders(response.data);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
    }
  };

  // Récupérer les entrepôts
  const fetchWarehouses = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/warehouses/?is_active=true', {
        headers: { Authorization: `Token ${token}` }
      });
      setWarehouses(response.data);
    } catch (error) {
      console.error('Erreur chargement entrepôts:', error);
    }
  };

  // Récupérer les détails d'une commande
  const fetchOrderDetails = async (orderId) => {
    if (!orderId) return;
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/purchase-orders/${orderId}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setSelectedOrder(response.data);
      const lines = response.data.lines || [];
      setOrderLines(lines);
      
      // Initialiser les lignes de réception
      const initialLines = lines.map(line => ({
        po_line: line.id,
        quantity_received: '',
        quantity_damaged: '',
        lot_number: '',
        expiry_date: '',
        manufacturing_date: '',
        quality_status: 'pending',
        notes: ''
      }));
      setReceptionLines(initialLines);
    } catch (error) {
      console.error('Erreur chargement commande:', error);
      showNotification('Erreur chargement de la commande', 'error');
    }
  };

  // Charger une réception existante (mode édition)
  const loadReception = async () => {
    if (!isEditMode) {
      setFetching(false);
      return;
    }
    
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/receipts/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      const data = response.data;
      setFormData({
        purchase_order: data.purchase_order,
        expected_date: data.expected_date || '',
        warehouse: data.warehouse,
        delivery_note: data.delivery_note || '',
        invoice_number: data.invoice_number || '',
        notes: data.notes || ''
      });
      await fetchOrderDetails(data.purchase_order);
      
      if (data.lines && data.lines.length > 0) {
        const lines = data.lines.map(line => ({
          po_line: line.po_line,
          quantity_received: line.quantity_received || '',
          quantity_damaged: line.quantity_damaged || '',
          lot_number: line.lot_number || '',
          expiry_date: line.expiry_date || '',
          manufacturing_date: line.manufacturing_date || '',
          quality_status: line.quality_status || 'pending',
          notes: line.notes || ''
        }));
        setReceptionLines(lines);
      }
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Impossible de charger la réception', 'error');
      navigate('/receptions');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
    fetchWarehouses();
    loadReception();
  }, [id]);

  // Changement de commande
  const handleOrderChange = async (e) => {
    const orderId = e.target.value;
    setFormData(prev => ({ ...prev, purchase_order: orderId }));
    setFieldErrors({});
    if (orderId) {
      await fetchOrderDetails(orderId);
    } else {
      setSelectedOrder(null);
      setOrderLines([]);
      setReceptionLines([]);
    }
  };

  // Mettre à jour une ligne de réception
  const updateReceptionLine = (index, field, value) => {
    const updatedLines = [...receptionLines];
    updatedLines[index][field] = value;
    setReceptionLines(updatedLines);
  };

  // Valider le formulaire
  const validate = () => {
    const newFieldErrors = {};
    const newErrors = {};
    
    if (!formData.purchase_order) {
      newFieldErrors.purchase_order = 'La commande est requise';
    }
    if (!formData.expected_date) {
      newFieldErrors.expected_date = 'La date prévue est requise';
    }
    if (!formData.warehouse) {
      newFieldErrors.warehouse = 'L\'entrepôt est requis';
    }
    
    // Vérifier qu'au moins un produit a une quantité
    const hasQuantity = receptionLines.some(line => {
      const qty = parseInt(line.quantity_received);
      return !isNaN(qty) && qty > 0;
    });
    if (!hasQuantity) {
      newErrors.lines = 'Au moins un produit doit être réceptionné';
    }
    
    // Vérifier les quantités
    for (let i = 0; i < receptionLines.length; i++) {
      const line = receptionLines[i];
      const orderedQty = orderLines[i]?.quantity || 0;
      const receivedQty = parseInt(line.quantity_received);
      if (!isNaN(receivedQty) && receivedQty > orderedQty) {
        newFieldErrors[`line_${i}`] = `La quantité reçue (${receivedQty}) dépasse la quantité commandée (${orderedQty})`;
      }
    }
    
    setFieldErrors(newFieldErrors);
    setErrors(newErrors);
    return Object.keys(newFieldErrors).length === 0 && Object.keys(newErrors).length === 0;
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const token = getToken();
      const headers = { Authorization: `Token ${token}` };
      
      // Préparer les lignes - UNIQUEMENT les champs attendus par le backend
      const linesToSend = receptionLines
        .filter(line => {
          const qty = parseInt(line.quantity_received);
          return !isNaN(qty) && qty > 0;
        })
        .map(line => ({
          po_line: line.po_line,
          quantity_received: parseInt(line.quantity_received) || 0,
          quantity_damaged: parseInt(line.quantity_damaged) || 0,
          lot_number: line.lot_number || '',
          expiry_date: line.expiry_date || null,
          manufacturing_date: line.manufacturing_date || null,
          quality_status: line.quality_status || 'pending',
          notes: line.notes || ''
        }));
      
      const dataToSend = {
        purchase_order: parseInt(formData.purchase_order),
        expected_date: formData.expected_date,
        warehouse: parseInt(formData.warehouse),
        delivery_note: formData.delivery_note || '',
        invoice_number: formData.invoice_number || '',
        notes: formData.notes || '',
        lines: linesToSend
      };
      
      console.log('Envoi des données:', JSON.stringify(dataToSend, null, 2));
      
      if (isEditMode) {
        await AxiosInstance.patch(`/receipts/${id}/`, dataToSend, { headers });
        showNotification('Réception modifiée avec succès', 'success');
      } else {
        await AxiosInstance.post('/receipts/', dataToSend, { headers });
        showNotification('Réception créée avec succès', 'success');
      }
      
      setTimeout(() => navigate('/receptions'), 1500);
      
    } catch (error) {
      console.error('Erreur:', error);
      console.error('Response:', error.response?.data);
      
      if (error.response?.data) {
        const apiErrors = error.response.data;
        if (typeof apiErrors === 'object') {
          const newFieldErrors = {};
          Object.keys(apiErrors).forEach(key => {
            if (Array.isArray(apiErrors[key])) {
              newFieldErrors[key] = apiErrors[key][0];
            } else {
              newFieldErrors[key] = apiErrors[key];
            }
          });
          setFieldErrors(newFieldErrors);
        }
        showNotification(apiErrors.message || apiErrors.detail || 'Veuillez vérifier les champs', 'error');
      } else {
        showNotification('Une erreur est survenue', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-medium text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl min-w-[300px]`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification(null)}>
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* En-tête */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/receptions')} className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <ClipboardList className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">{isEditMode ? 'Modifier' : 'Nouvelle'} réception</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {isEditMode ? 'Modifiez les informations de la réception' : 'Enregistrez une réception de marchandises'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire principal */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="form-control">
                    <label className="label text-sm font-medium text-gray-700">
                      Bon de commande <span className="text-error">*</span>
                    </label>
                    <select
                      value={formData.purchase_order}
                      onChange={handleOrderChange}
                      className={`select select-bordered w-full ${fieldErrors.purchase_order ? 'select-error' : ''}`}
                      disabled={isEditMode}
                    >
                      <option value="">Sélectionner une commande</option>
                      {purchaseOrders.map(po => (
                        <option key={po.id} value={po.id}>
                          {po.po_number} - {po.supplier_name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.purchase_order && <span className="text-error text-xs mt-1">{fieldErrors.purchase_order}</span>}
                  </div>

                  <div className="form-control">
                    <label className="label text-sm font-medium text-gray-700">
                      Date prévue <span className="text-error">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.expected_date}
                      onChange={(e) => setFormData({...formData, expected_date: e.target.value})}
                      className={`input input-bordered w-full ${fieldErrors.expected_date ? 'input-error' : ''}`}
                    />
                    {fieldErrors.expected_date && <span className="text-error text-xs mt-1">{fieldErrors.expected_date}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="form-control">
                    <label className="label text-sm font-medium text-gray-700">
                      Entrepôt de destination <span className="text-error">*</span>
                    </label>
                    <select
                      value={formData.warehouse}
                      onChange={(e) => setFormData({...formData, warehouse: e.target.value})}
                      className={`select select-bordered w-full ${fieldErrors.warehouse ? 'select-error' : ''}`}
                    >
                      <option value="">Sélectionner un entrepôt</option>
                      {warehouses.map(wh => (
                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                      ))}
                    </select>
                    {fieldErrors.warehouse && <span className="text-error text-xs mt-1">{fieldErrors.warehouse}</span>}
                  </div>

                  <div className="form-control">
                    <label className="label text-sm font-medium text-gray-700">N° Bon de livraison</label>
                    <input
                      type="text"
                      value={formData.delivery_note}
                      onChange={(e) => setFormData({...formData, delivery_note: e.target.value})}
                      className="input input-bordered w-full"
                      placeholder="BL-001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="form-control">
                    <label className="label text-sm font-medium text-gray-700">N° Facture fournisseur</label>
                    <input
                      type="text"
                      value={formData.invoice_number}
                      onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                      className="input input-bordered w-full"
                      placeholder="FACT-001"
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="textarea textarea-bordered w-full"
                    rows="2"
                    placeholder="Informations supplémentaires..."
                  />
                </div>
              </div>
            </div>

            {/* Lignes de réception */}
            {selectedOrder && orderLines.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" /> Produits à réceptionner
                  </h3>
                </div>
                
                <div className="p-6 overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-3 py-2 text-left text-sm font-semibold">Produit</th>
                        <th className="px-3 py-2 text-center text-sm font-semibold">Cmd.</th>
                        <th className="px-3 py-2 text-center text-sm font-semibold">Reçu</th>
                        <th className="px-3 py-2 text-center text-sm font-semibold">Avarié</th>
                        <th className="px-3 py-2 text-left text-sm font-semibold">N° Lot</th>
                        <th className="px-3 py-2 text-center text-sm font-semibold">Expiration</th>
                        <th className="px-3 py-2 text-center text-sm font-semibold">Qualité</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderLines.map((line, index) => (
                        <tr key={line.id} className="border-b hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <div>
                              <p className="font-medium text-sm">{line.product_name}</p>
                              <p className="text-xs text-gray-400">{line.product_code}</p>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center">{line.quantity} </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={receptionLines[index]?.quantity_received || ''}
                              onChange={(e) => updateReceptionLine(index, 'quantity_received', e.target.value)}
                              className="input input-bordered input-sm w-20 text-center"
                              min="0"
                              max={line.quantity}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={receptionLines[index]?.quantity_damaged || ''}
                              onChange={(e) => updateReceptionLine(index, 'quantity_damaged', e.target.value)}
                              className="input input-bordered input-sm w-20 text-center"
                              min="0"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={receptionLines[index]?.lot_number || ''}
                              onChange={(e) => updateReceptionLine(index, 'lot_number', e.target.value)}
                              className="input input-bordered input-sm w-28"
                              placeholder="Lot"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="date"
                              value={receptionLines[index]?.expiry_date || ''}
                              onChange={(e) => updateReceptionLine(index, 'expiry_date', e.target.value)}
                              className="input input-bordered input-sm w-28"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={receptionLines[index]?.quality_status || 'pending'}
                              onChange={(e) => updateReceptionLine(index, 'quality_status', e.target.value)}
                              className="select select-bordered select-sm w-24"
                            >
                              <option value="pending">En attente</option>
                              <option value="passed">Approuvé</option>
                              <option value="failed">Refusé</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-gray-400 mt-2">* Les champs "Reçu" sont obligatoires pour valider la réception</p>
                  {errors.lines && <p className="text-error text-sm mt-2">{errors.lines}</p>}
                  {fieldErrors.lines && <p className="text-error text-sm mt-2">{fieldErrors.lines}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Résumé */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 sticky top-6">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-primary" /> Résumé
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {selectedOrder && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Commande</span>
                        <span className="font-medium">{selectedOrder.po_number}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Fournisseur</span>
                        <span className="font-medium">{selectedOrder.supplier_name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total commande</span>
                        <span className="font-medium">{selectedOrder.total?.toLocaleString()} FCFA</span>
                      </div>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-semibold">
                        <span>Total reçu</span>
                        <span className="text-primary">
                          {receptionLines.reduce((sum, line) => {
                            const qty = parseInt(line.quantity_received);
                            return sum + (isNaN(qty) ? 0 : qty);
                          }, 0)} / 
                          {orderLines.reduce((sum, line) => sum + line.quantity, 0)} unités
                        </span>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => navigate('/receptions')} 
                    className="btn btn-ghost flex-1" 
                    disabled={loading}
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    onClick={handleSubmit} 
                    className="btn btn-primary flex-1 gap-2" 
                    disabled={loading}
                  >
                    {loading ? <span className="loading loading-spinner loading-sm"></span> : <><Save className="w-4 h-4" /> Enregistrer</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionForm;