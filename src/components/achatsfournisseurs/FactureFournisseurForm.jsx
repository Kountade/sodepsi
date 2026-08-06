// src/components/achats/FactureFournisseurForm.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, CheckCircle, AlertCircle,
  FileText, Calendar, DollarSign, Building2, ShoppingBag,
  Receipt, Clock, Search, RefreshCw, AlertTriangle
} from 'lucide-react';

const FactureFournisseurForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEdit);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
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
    notes: ''
  });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // Récupérer TOUTES les commandes et filtrer
  const fetchAllOrders = async () => {
    setLoadingOrders(true);
    try {
      // Récupérer toutes les commandes
      const response = await AxiosInstance.get('/purchase-orders/');
      
      console.log('📦 Toutes les commandes:', response.data);
      setAllOrders(response.data || []);
      
      // Filtrer celles qui sont reçues ou partielles
      const available = (response.data || []).filter(
        order => order.status === 'received' || order.status === 'partial'
      );
      
      console.log('✅ Commandes disponibles (received/partial):', available);
      setPurchaseOrders(available);
      
      if (available.length === 0) {
        // Afficher les statuts disponibles
        const statuses = [...new Set((response.data || []).map(o => o.status))];
        showNotification(
          `Aucune commande reçue. Statuts disponibles: ${statuses.join(', ')}`,
          'warning'
        );
      }
    } catch (error) {
      console.error('❌ Erreur chargement commandes:', error);
      showNotification('Erreur lors du chargement des commandes', 'error');
    } finally {
      setLoadingOrders(false);
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
        notes: data.notes || ''
      });
    } catch (error) {
      console.error('Erreur chargement facture:', error);
      showNotification('Erreur de chargement de la facture', 'error');
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
    if (isEdit) {
      fetchInvoice();
    }
  }, [id]);

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
        notes: formData.notes
      };

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
      console.error('Erreur:', error);
      const errorMsg = error.response?.data?.message || 
                       error.response?.data?.detail ||
                       'Erreur lors de l\'enregistrement de la facture';
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

  // Compter les statuts
  const getStatusCount = () => {
    const counts = {};
    allOrders.forEach(order => {
      counts[order.status] = (counts[order.status] || 0) + 1;
    });
    return counts;
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
                {isEdit ? 'Modifiez les informations de la facture' : 'Créez une nouvelle facture à partir d\'une commande reçue'}
              </p>
            </div>
          </div>
          <button onClick={fetchAllOrders} className="btn btn-sm btn-outline gap-2">
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
              
              {/* Affichage des informations */}
              {!isEdit && !loadingOrders && (
                <div className="mt-2">
                  {purchaseOrders.length === 0 ? (
                    <div className="text-sm text-warning">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      Aucune commande avec le statut "Reçu" ou "Partiel"
                      {allOrders.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          Commandes existantes : {allOrders.length} 
                          ({Object.entries(getStatusCount()).map(([status, count]) => 
                            `${status}: ${count}`
                          ).join(', ')})
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">
                      {purchaseOrders.length} commande(s) disponible(s) pour facturation
                      {allOrders.length > purchaseOrders.length && 
                        ` (${allOrders.length - purchaseOrders.length} non disponibles)`
                      }
                    </div>
                  )}
                  <button 
                    type="button"
                    onClick={fetchAllOrders}
                    className="text-xs text-primary hover:underline mt-1"
                  >
                    🔄 Rafraîchir la liste
                  </button>
                </div>
              )}

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
                <li>• Vérifiez que le montant total correspond à la facture papier</li>
                <li>• La date d'échéance détermine le délai de paiement</li>
                <li>• 💡 Si aucune commande n'apparaît, vérifiez le statut de vos commandes</li>
                <li>• 📊 Statuts acceptés: <span className="badge badge-success">received</span> <span className="badge badge-warning">partial</span></li>
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
              disabled={loading || loadingOrders || purchaseOrders.length === 0}
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