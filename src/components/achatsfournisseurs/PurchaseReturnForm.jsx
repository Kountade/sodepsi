// src/components/achats/PurchaseReturnForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Save, X, ArrowLeftRight, RefreshCw, ArrowLeft, Truck,
  Package, CheckCircle, AlertCircle, Calendar, Building2,
  Plus, Trash2
} from 'lucide-react';

const PurchaseReturnForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    purchase_order: '',
    receipt: '',
    reason: '',
    notes: ''
  });
  
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [receiptLines, setReceiptLines] = useState([]);
  const [returnLines, setReturnLines] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchPurchaseOrders = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/purchase-orders/?status=received', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setPurchaseOrders(response.data);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
    }
  };

  const fetchReceiptsForOrder = async (orderId) => {
    if (!orderId) return;
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/purchase-orders/${orderId}/receipts/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setReceipts(response.data);
    } catch (error) {
      console.error('Erreur chargement réceptions:', error);
    }
  };

  const fetchReceiptLines = async (receiptId) => {
    if (!receiptId) return;
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/receipts/${receiptId}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setSelectedReceipt(response.data);
      const lines = response.data.lines || [];
      setReceiptLines(lines);
      
      // Initialiser les lignes de retour
      const initialLines = lines.map(line => ({
        receipt_line: line.id,
        product: line.product,
        product_name: line.product_name,
        product_code: line.product_code,
        quantity: '',
        unit_price: line.unit_price || 0,
        notes: ''
      }));
      setReturnLines(initialLines);
    } catch (error) {
      console.error('Erreur chargement réception:', error);
    }
  };

  const loadReturn = async () => {
    if (!isEditMode) {
      setFetching(false);
      return;
    }
    
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/purchase-returns/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = response.data;
      setFormData({
        purchase_order: data.purchase_order,
        receipt: data.receipt,
        reason: data.reason || '',
        notes: data.notes || ''
      });
      setSelectedOrder(data.purchase_order);
      await fetchReceiptsForOrder(data.purchase_order);
      await fetchReceiptLines(data.receipt);
      if (data.lines) {
        const lines = data.lines.map(line => ({
          receipt_line: line.receipt_line,
          product: line.product,
          product_name: line.product_name,
          product_code: line.product_code,
          quantity: line.quantity || '',
          unit_price: line.unit_price || 0,
          notes: line.notes || ''
        }));
        setReturnLines(lines);
      }
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Impossible de charger le retour', 'error');
      navigate('/purchase-returns');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
    loadReturn();
  }, [id]);

  const handleOrderChange = async (e) => {
    const orderId = e.target.value;
    setFormData(prev => ({ ...prev, purchase_order: orderId, receipt: '' }));
    setSelectedOrder(orderId);
    setReceipts([]);
    setReceiptLines([]);
    setReturnLines([]);
    if (orderId) {
      await fetchReceiptsForOrder(orderId);
    }
  };

  const handleReceiptChange = async (e) => {
    const receiptId = e.target.value;
    setFormData(prev => ({ ...prev, receipt: receiptId }));
    if (receiptId) {
      await fetchReceiptLines(receiptId);
    } else {
      setReceiptLines([]);
      setReturnLines([]);
    }
  };

  const updateReturnLine = (index, field, value) => {
    const updatedLines = [...returnLines];
    updatedLines[index][field] = value;
    setReturnLines(updatedLines);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.purchase_order) newErrors.purchase_order = 'La commande est requise';
    if (!formData.receipt) newErrors.receipt = 'La réception est requise';
    if (!formData.reason) newErrors.reason = 'La raison est requise';
    
    const hasQuantity = returnLines.some(line => (parseInt(line.quantity) || 0) > 0);
    if (!hasQuantity) newErrors.lines = 'Au moins un produit doit être retourné';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const token = getToken();
      const headers = { 'Authorization': `Token ${token}` };
      
      // Ne garder que les lignes avec quantité > 0
      const filteredReturnLines = returnLines.filter(line => (parseInt(line.quantity) || 0) > 0);
      
      if (filteredReturnLines.length === 0) {
        setErrors({ lines: 'Au moins un produit doit être retourné' });
        setLoading(false);
        return;
      }
      
      const linesToSend = filteredReturnLines.map(line => ({
        receipt_line: parseInt(line.receipt_line),
        quantity: parseInt(line.quantity) || 0,
        notes: line.notes || ''
      }));
      
      const dataToSend = {
        purchase_order: parseInt(formData.purchase_order),
        receipt: parseInt(formData.receipt),
        reason: formData.reason,
        notes: formData.notes || '',
        lines: linesToSend
      };
      
      console.log('Données envoyées:', JSON.stringify(dataToSend, null, 2));
      
      if (isEditMode) {
        await AxiosInstance.patch(`/purchase-returns/${id}/`, dataToSend, { headers });
        showNotification('Retour modifié avec succès', 'success');
      } else {
        await AxiosInstance.post('/purchase-returns/', dataToSend, { headers });
        showNotification('Retour créé avec succès', 'success');
      }
      
      setTimeout(() => navigate('/purchase-returns'), 1500);
      
    } catch (error) {
      console.error('Erreur complète:', error);
      console.error('Response:', error.response?.data);
      console.error('Status:', error.response?.status);
      
      if (error.response?.data) {
        const apiErrors = error.response.data;
        if (typeof apiErrors === 'object') {
          const newErrors = {};
          Object.keys(apiErrors).forEach(key => {
            if (Array.isArray(apiErrors[key])) {
              newErrors[key] = apiErrors[key][0];
            } else {
              newErrors[key] = apiErrors[key];
            }
          });
          setErrors(newErrors);
          showNotification('Veuillez vérifier les champs', 'error');
        } else {
          showNotification(apiErrors.message || apiErrors.detail || 'Erreur serveur', 'error');
        }
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
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/purchase-returns')} className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <ArrowLeftRight className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">{isEditMode ? 'Modifier' : 'Nouveau'} retour fournisseur</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {isEditMode ? 'Modifiez les informations du retour' : 'Enregistrez un retour de marchandises'}
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
                      className={`select select-bordered w-full ${errors.purchase_order ? 'select-error' : ''}`}
                      disabled={isEditMode}
                    >
                      <option value="">Sélectionner une commande</option>
                      {purchaseOrders.map(po => (
                        <option key={po.id} value={po.id}>{po.po_number} - {po.supplier_name}</option>
                      ))}
                    </select>
                    {errors.purchase_order && <span className="text-error text-xs mt-1">{errors.purchase_order}</span>}
                  </div>

                  <div className="form-control">
                    <label className="label text-sm font-medium text-gray-700">
                      Réception <span className="text-error">*</span>
                    </label>
                    <select
                      value={formData.receipt}
                      onChange={handleReceiptChange}
                      className={`select select-bordered w-full ${errors.receipt ? 'select-error' : ''}`}
                      disabled={isEditMode || !formData.purchase_order}
                    >
                      <option value="">Sélectionner une réception</option>
                      {receipts.map(rec => (
                        <option key={rec.id} value={rec.id}>{rec.receipt_number} - {new Date(rec.receipt_date).toLocaleDateString()}</option>
                      ))}
                    </select>
                    {errors.receipt && <span className="text-error text-xs mt-1">{errors.receipt}</span>}
                  </div>
                </div>

                <div className="form-control">
                  <label className="label text-sm font-medium text-gray-700">
                    Raison du retour <span className="text-error">*</span>
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    className={`select select-bordered w-full ${errors.reason ? 'select-error' : ''}`}
                  >
                    <option value="">Sélectionner une raison</option>
                    <option value="defective">Produit défectueux</option>
                    <option value="wrong_product">Produit incorrect</option>
                    <option value="expired">Produit expiré</option>
                    <option value="damaged">Produit endommagé</option>
                    <option value="other">Autre</option>
                  </select>
                  {errors.reason && <span className="text-error text-xs mt-1">{errors.reason}</span>}
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

            {/* Produits à retourner */}
            {selectedReceipt && receiptLines.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" /> Produits à retourner
                  </h3>
                </div>
                
                <div className="p-6 overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-3 py-2 text-left text-sm font-semibold">Produit</th>
                        <th className="px-3 py-2 text-center text-sm font-semibold">Reçu</th>
                        <th className="px-3 py-2 text-center text-sm font-semibold">À retourner</th>
                        <th className="px-3 py-2 text-right text-sm font-semibold">Prix unit.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiptLines.map((line, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <div>
                              <p className="font-medium text-sm">{line.product_name}</p>
                              <p className="text-xs text-gray-400">{line.product_code}</p>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center">{line.quantity_received || 0} </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={returnLines[index]?.quantity || ''}
                              onChange={(e) => updateReturnLine(index, 'quantity', e.target.value)}
                              className="input input-bordered input-sm w-20 text-center"
                              min="0"
                              max={line.quantity_received || 0}
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-medium">{line.unit_price?.toLocaleString()} F</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {errors.lines && <p className="text-error text-sm mt-2">{errors.lines}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Résumé */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 sticky top-6">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-primary" /> Résumé
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {selectedReceipt && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Commande</span>
                        <span className="font-medium">{selectedReceipt.po_number}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Fournisseur</span>
                        <span className="font-medium">{selectedReceipt.supplier_name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Réception</span>
                        <span className="font-medium">{selectedReceipt.receipt_number}</span>
                      </div>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-semibold">
                        <span>Total retour</span>
                        <span className="text-primary">
                          {returnLines.reduce((sum, line) => sum + (parseInt(line.quantity) || 0), 0)} unités
                        </span>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => navigate('/purchase-returns')} className="btn btn-ghost flex-1" disabled={loading}>
                    Annuler
                  </button>
                  <button type="submit" onClick={handleSubmit} className="btn btn-primary flex-1 gap-2" disabled={loading}>
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

export default PurchaseReturnForm;