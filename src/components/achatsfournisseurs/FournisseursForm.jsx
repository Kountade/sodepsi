// src/components/achats/FactureFournisseurForm.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, CheckCircle, AlertCircle,
  FileText, Calendar, DollarSign, Building2, ShoppingBag,
  Receipt, Clock, Search, RefreshCw, AlertTriangle,
  Plus, Trash2
} from 'lucide-react';

const FactureFournisseurForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEdit);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [availableReceipts, setAvailableReceipts] = useState([]);
  const [selectedReceipts, setSelectedReceipts] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [searchOrder, setSearchOrder] = useState('');
  
  const [formData, setFormData] = useState({
    purchase_order: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    amount: '',
    tax_amount: '',
    total_amount: '',
    notes: '',
    receipt_ids: []
  });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // Récupérer les commandes reçues
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await AxiosInstance.get('/purchase-orders/', {
        params: { status: 'received,partial' }
      });
      
      console.log('📦 Commandes disponibles:', response.data);
      setPurchaseOrders(response.data || []);
      
      if (response.data?.length === 0) {
        showNotification('Aucune commande reçue disponible', 'warning');
      }
    } catch (error) {
      console.error('❌ Erreur chargement commandes:', error);
      showNotification('Erreur lors du chargement des commandes', 'error');
    } finally {
      setLoadingOrders(false);
    }
  };

  // Récupérer les réceptions disponibles pour une commande
  const fetchAvailableReceipts = async (orderId) => {
    if (!orderId) {
      setAvailableReceipts([]);
      return;
    }
    
    setLoadingReceipts(true);
    try {
      const response = await AxiosInstance.get('/receptions/available_for_invoice/', {
        params: { purchase_order: orderId }
      });
      
      console.log('📦 Réceptions disponibles:', response.data);
      setAvailableReceipts(response.data || []);
      
      if (response.data?.length === 0) {
        showNotification('Aucune réception disponible pour cette commande', 'warning');
      }
    } catch (error) {
      console.error('❌ Erreur chargement réceptions:', error);
      showNotification('Erreur lors du chargement des réceptions', 'error');
    } finally {
      setLoadingReceipts(false);
    }
  };

  // Récupérer la facture en modification
  const fetchInvoice = async () => {
    if (!isEdit) return;
    try {
      const response = await AxiosInstance.get(`/supplier-invoices/${id}/`);
      const data = response.data;
      setFormData({
        purchase_order: data.purchase_order?.id || '',
        invoice_number: data.invoice_number || '',
        invoice_date: data.invoice_date || '',
        due_date: data.due_date || '',
        amount: data.amount || '',
        tax_amount: data.tax_amount || '',
        total_amount: data.total_amount || '',
        notes: data.notes || '',
        receipt_ids: data.receipts?.map(r => r.id) || []
      });
      
      // Charger les réceptions associées
      if (data.receipts) {
        setSelectedReceipts(data.receipts);
      }
    } catch (error) {
      console.error('Erreur chargement facture:', error);
      showNotification('Erreur de chargement de la facture', 'error');
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    if (isEdit) {
      fetchInvoice();
    }
  }, [id]);

  // Charger les réceptions quand la commande change
  useEffect(() => {
    if (formData.purchase_order && !isEdit) {
      fetchAvailableReceipts(formData.purchase_order);
    } else if (!formData.purchase_order) {
      setAvailableReceipts([]);
    }
  }, [formData.purchase_order, isEdit]);

  // Calculer automatiquement le total TTC
  useEffect(() => {
    const amount = parseFloat(formData.amount) || 0;
    const tax = parseFloat(formData.tax_amount) || 0;
    const total = amount + tax;
    setFormData(prev => ({
      ...prev,
      total_amount: total > 0 ? total.toFixed(2) : ''
    }));
  }, [formData.amount, formData.tax_amount]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Si changement de commande, réinitialiser les réceptions
    if (name === 'purchase_order') {
      setSelectedReceipts([]);
    }
  };

  // Gestion des réceptions sélectionnées
  const toggleReceiptSelection = (receipt) => {
    setSelectedReceipts(prev => {
      const exists = prev.find(r => r.id === receipt.id);
      if (exists) {
        return prev.filter(r => r.id !== receipt.id);
      } else {
        return [...prev, receipt];
      }
    });
  };

  // Calculer le total des réceptions sélectionnées
  const calculateReceiptsTotal = () => {
    return selectedReceipts.reduce((sum, r) => sum + (r.total_received_amount || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.purchase_order) {
      showNotification('Veuillez sélectionner une commande', 'error');
      setLoading(false);
      return;
    }
    
    // ✅ Vérifier qu'au moins une réception est sélectionnée
    if (selectedReceipts.length === 0 && !isEdit) {
      showNotification('Veuillez sélectionner au moins une réception', 'error');
      setLoading(false);
      return;
    }

    if (!formData.invoice_number) {
      showNotification('Veuillez saisir le numéro de facture', 'error');
      setLoading(false);
      return;
    }
    if (!formData.invoice_date) {
      showNotification('Veuillez saisir la date de facture', 'error');
      setLoading(false);
      return;
    }
    if (!formData.due_date) {
      showNotification('Veuillez saisir la date d\'échéance', 'error');
      setLoading(false);
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showNotification('Veuillez saisir un montant valide', 'error');
      setLoading(false);
      return;
    }
    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      showNotification('Veuillez saisir un total TTC valide', 'error');
      setLoading(false);
      return;
    }

    try {
      const url = isEdit ? `/supplier-invoices/${id}/` : '/supplier-invoices/';
      const method = isEdit ? 'put' : 'post';

      const dataToSend = {
        purchase_order: parseInt(formData.purchase_order),
        invoice_number: formData.invoice_number,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date,
        amount: parseFloat(formData.amount),
        tax_amount: parseFloat(formData.tax_amount) || 0,
        total_amount: parseFloat(formData.total_amount),
        notes: formData.notes,
        receipt_ids: selectedReceipts.map(r => r.id)  // ✅ Envoyer les IDs des réceptions
      };

      console.log('📤 Envoi de la facture:', dataToSend);

      const response = await AxiosInstance({
        method: method,
        url: url,
        data: dataToSend
      });

      showNotification(
        isEdit ? 'Facture modifiée avec succès' : 'Facture créée avec succès',
        'success'
      );

      setTimeout(() => {
        navigate(`/factures-fournisseurs/${response.data.id}`);
      }, 1500);

    } catch (error) {
      console.error('❌ Erreur:', error);
      console.error('Détails:', error.response?.data);
      
      let errorMsg = 'Erreur lors de l\'enregistrement de la facture';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          const errors = error.response.data;
          if (errors.message) {
            errorMsg = errors.message;
          } else if (errors.detail) {
            errorMsg = errors.detail;
          } else if (errors.non_field_errors) {
            errorMsg = errors.non_field_errors.join(', ');
          } else {
            const firstError = Object.values(errors)[0];
            if (Array.isArray(firstError)) {
              errorMsg = firstError[0];
            } else if (typeof firstError === 'string') {
              errorMsg = firstError;
            }
          }
        } else if (typeof error.response.data === 'string') {
          errorMsg = error.response.data;
        }
      }
      
      showNotification(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/factures-fournisseurs');
  };

  // Filtrer les commandes par recherche
  const filteredOrders = purchaseOrders.filter(order => {
    const search = searchOrder.toLowerCase();
    return (order.po_number?.toLowerCase() || '').includes(search) ||
           (order.supplier_name?.toLowerCase() || '').includes(search);
  });

  // Récupérer le fournisseur d'une commande sélectionnée
  const getSelectedOrderSupplier = () => {
    const order = purchaseOrders.find(o => o.id === parseInt(formData.purchase_order));
    return order ? order.supplier_name : '';
  };

  const getSelectedOrderNumber = () => {
    const order = purchaseOrders.find(o => o.id === parseInt(formData.purchase_order));
    return order ? order.po_number : '';
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : notification.type === 'warning' ? 'alert-warning' : 'alert-error'} shadow-xl rounded-xl`}>
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

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={handleCancel} className="btn btn-ghost btn-sm btn-circle">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Receipt className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-primary">
                  {isEdit ? 'Modifier la facture' : 'Nouvelle facture fournisseur'}
                </h1>
              </div>
              <p className="text-sm text-gray-500 ml-1">
                {isEdit ? 'Modifiez les informations de la facture' : 'Sélectionnez une commande et ses réceptions pour créer une facture'}
              </p>
            </div>
          </div>
          <button onClick={fetchOrders} className="btn btn-sm btn-outline gap-2">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-xl shadow-xl p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Commande associée */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commande associée <span className="text-error">*</span>
              </label>
              
              {!isEdit && (
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    className="input input-bordered w-full pl-9"
                    placeholder="Rechercher une commande (numéro ou fournisseur)..."
                    value={searchOrder}
                    onChange={(e) => setSearchOrder(e.target.value)}
                  />
                  {loadingOrders && (
                    <span className="loading loading-spinner loading-sm absolute right-3 top-1/2 -translate-y-1/2"></span>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <select
                  name="purchase_order"
                  className={`select select-bordered flex-1 ${loadingOrders ? 'opacity-50' : ''}`}
                  value={formData.purchase_order}
                  onChange={handleChange}
                  disabled={isEdit || loadingOrders}
                >
                  <option value="">
                    {loadingOrders ? '⏳ Chargement...' : 
                     purchaseOrders.length === 0 ? '⚠️ Aucune commande reçue' : 
                     '📦 Sélectionner une commande reçue...'}
                  </option>
                  {filteredOrders.map(order => (
                    <option key={order.id} value={order.id}>
                      {order.po_number} - {order.supplier_name} 
                      ({order.total?.toLocaleString()} FCFA) 
                      [{order.status === 'received' ? '✅ Reçu' : '🔄 Partiel'}]
                    </option>
                  ))}
                </select>
                {isEdit && (
                  <span className="badge badge-info flex items-center gap-1 whitespace-nowrap">
                    <Clock className="w-3 h-3" /> Non modifiable
                  </span>
                )}
              </div>

              {formData.purchase_order && (
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> {getSelectedOrderSupplier()}
                  </span>
                  <span className="flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3" /> {getSelectedOrderNumber()}
                  </span>
                </div>
              )}
            </div>

            {/* ✅ Sélection des réceptions */}
            {formData.purchase_order && !isEdit && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Réceptions à facturer <span className="text-error">*</span>
                </label>
                
                {loadingReceipts ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="loading loading-spinner loading-md"></span>
                    <span className="ml-3 text-gray-500">Chargement des réceptions...</span>
                  </div>
                ) : availableReceipts.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-yellow-700">Aucune réception disponible</p>
                        <p className="text-xs text-yellow-600 mt-1">
                          Cette commande n'a pas de réception terminée non facturée.
                          {purchaseOrders.length > 0 && ' Vérifiez que les réceptions sont terminées et non facturées.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                    {availableReceipts.map(receipt => (
                      <label 
                        key={receipt.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          selectedReceipts.find(r => r.id === receipt.id)
                            ? 'bg-primary/10 border-2 border-primary'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary"
                          checked={!!selectedReceipts.find(r => r.id === receipt.id)}
                          onChange={() => toggleReceiptSelection(receipt)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-semibold">{receipt.receipt_number}</span>
                            <span className="badge badge-success badge-sm">Terminée</span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Montant: <span className="font-semibold text-gray-700">{receipt.total_received_amount?.toLocaleString()} FCFA</span>
                            <span className="mx-2">•</span>
                            Date: {new Date(receipt.receipt_date).toLocaleDateString()}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {selectedReceipts.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        <strong>{selectedReceipts.length}</strong> réception(s) sélectionnée(s)
                      </span>
                      <span className="text-sm font-semibold text-primary">
                        Total: {calculateReceiptsTotal().toLocaleString()} FCFA
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedReceipts([])}
                      className="btn btn-ghost btn-xs text-error gap-1 mt-1"
                    >
                      <Trash2 className="w-3 h-3" /> Tout désélectionner
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Réceptions déjà facturées (en modification) */}
            {isEdit && selectedReceipts.length > 0 && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Réceptions facturées
                </label>
                <div className="space-y-2">
                  {selectedReceipts.map(receipt => (
                    <div key={receipt.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <span className="font-mono font-semibold">{receipt.receipt_number}</span>
                        <span className="text-sm text-gray-500 ml-3">
                          {receipt.total?.toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Numéro de facture */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                N° Facture <span className="text-error">*</span>
              </label>
              <input
                type="text"
                name="invoice_number"
                className="input input-bordered w-full"
                placeholder="FAC-2026-0001"
                value={formData.invoice_number}
                onChange={handleChange}
                required
              />
            </div>

            {/* Date facture */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date facture <span className="text-error">*</span>
              </label>
              <input
                type="date"
                name="invoice_date"
                className="input input-bordered w-full"
                value={formData.invoice_date}
                onChange={handleChange}
                required
              />
            </div>

            {/* Date échéance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date d'échéance <span className="text-error">*</span>
              </label>
              <input
                type="date"
                name="due_date"
                className="input input-bordered w-full"
                value={formData.due_date}
                onChange={handleChange}
                required
              />
            </div>

            {/* Montant HT */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant HT <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">F</span>
                <input
                  type="number"
                  name="amount"
                  className="input input-bordered w-full pl-8"
                  placeholder="0"
                  value={formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              {selectedReceipts.length > 0 && !isEdit && (
                <p className="text-xs text-gray-400 mt-1">
                  💡 Suggéré: {calculateReceiptsTotal().toLocaleString()} FCFA
                </p>
              )}
            </div>

            {/* TVA */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TVA
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">F</span>
                <input
                  type="number"
                  name="tax_amount"
                  className="input input-bordered w-full pl-8"
                  placeholder="0"
                  value={formData.tax_amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Ex: 180000 pour 18%</p>
            </div>

            {/* Total TTC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total TTC <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">F</span>
                <input
                  type="number"
                  name="total_amount"
                  className="input input-bordered w-full pl-8 bg-gray-50"
                  placeholder="0"
                  value={formData.total_amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                  readOnly={!!formData.amount && !!formData.tax_amount}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {formData.amount && formData.tax_amount 
                  ? '✅ Calcul automatique (HT + TVA)' 
                  : 'Saisissez HT et TVA pour calcul auto'}
              </p>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                className="textarea textarea-bordered w-full"
                rows="3"
                placeholder="Notes supplémentaires..."
                value={formData.notes}
                onChange={handleChange}
              />
            </div>

            {/* Informations */}
            <div className="md:col-span-2 bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h4 className="font-semibold text-sm text-blue-700 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Informations
              </h4>
              <ul className="text-sm text-blue-600 space-y-1 mt-2">
                <li>• La facture doit correspondre à une commande <strong>reçue</strong> ou <strong>partiellement reçue</strong></li>
                <li>• Sélectionnez les <strong>réceptions</strong> que vous souhaitez facturer</li>
                <li>• Une réception ne peut être facturée qu'une seule fois</li>
                <li>• Le montant de la facture doit correspondre aux réceptions sélectionnées</li>
                <li>• La date d'échéance détermine le délai de paiement</li>
                <li>• 💡 Si aucune réception n'apparaît, vérifiez qu'elles sont terminées et non facturées</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-ghost flex-1 sm:flex-none order-2 sm:order-1"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn bg-gradient-to-r from-primary to-primary/80 text-white border-none flex-1 sm:flex-none order-1 sm:order-2 gap-2"
              disabled={loading || loadingOrders || (!isEdit && selectedReceipts.length === 0)}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  {isEdit ? 'Modification...' : 'Création...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEdit ? 'Modifier' : 'Créer la facture'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FactureFournisseurForm;