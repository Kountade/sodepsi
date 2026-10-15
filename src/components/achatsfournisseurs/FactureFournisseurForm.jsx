// src/components/achats/FactureFournisseurForm.jsx
// ============================================================
// VERSION CORRIGÉE - Formulaire facture fournisseur
// ============================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, CheckCircle, AlertCircle,
  FileText, Building2, ShoppingBag,
  Receipt, Clock, Search, RefreshCw, AlertTriangle,
  Check, Loader2
} from 'lucide-react';

// ============================================================
// CONSTANTES
// ============================================================
const DEBOUNCE_MS = 400;

// ============================================================
// COMPOSANT
// ============================================================
const FactureFournisseurForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  // ----- États -----
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEdit);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  // ----- Commandes & réceptions -----
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [availableReceipts, setAvailableReceipts] = useState([]);
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [existingReceipt, setExistingReceipt] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingReceipts, setLoadingReceipts] = useState(false);

  // ----- Recherche -----
  const [searchOrder, setSearchOrder] = useState('');
  const [debouncedSearchOrder, setDebouncedSearchOrder] = useState('');
  const [searchReceipt, setSearchReceipt] = useState('');

  // ----- Formulaire -----
  const [formData, setFormData] = useState({
    purchase_order: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    amount: '',
    tax_amount: '',
    total_amount: '',
    notes: '',
    receipt_id: null,
  });

  const abortOrdersRef = useRef(null);
  const abortReceiptsRef = useRef(null);

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  }, []);

  const getToken = () => localStorage.getItem('Token');

  // ============================================================
  // CHARGEMENT COMMANDES
  // ============================================================
  const fetchOrders = useCallback(async (search = '') => {
    if (abortOrdersRef.current) abortOrdersRef.current.abort();
    const controller = new AbortController();
    abortOrdersRef.current = controller;

    setLoadingOrders(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      params.append('status', 'received,partial');
      params.append('page_size', '100');
      if (search) params.append('search', search);

      const response = await AxiosInstance.get(
        `/purchase-orders/?${params.toString()}`,
        {
          headers: { Authorization: `Token ${token}` },
          signal: controller.signal,
        }
      );

      const data = response.data;
      const results = Array.isArray(data) ? data : data.results || [];
      setPurchaseOrders(results);
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') return;
      console.error('❌ Erreur chargement commandes:', error);
      showNotification('Erreur lors du chargement des commandes', 'error');
    } finally {
      setLoadingOrders(false);
    }
  }, [showNotification]);

  // ============================================================
  // CHARGEMENT RÉCEPTIONS DISPONIBLES
  // ============================================================
  const fetchAvailableReceipts = useCallback(async (orderId) => {
    if (!orderId) {
      setAvailableReceipts([]);
      setSelectedReceiptId(null);
      setSelectedReceipt(null);
      return;
    }

    if (abortReceiptsRef.current) abortReceiptsRef.current.abort();
    const controller = new AbortController();
    abortReceiptsRef.current = controller;

    setLoadingReceipts(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(
        '/receipts/available_for_invoice/',
        {
          params: { purchase_order: orderId, page_size: 50 },
          headers: { Authorization: `Token ${token}` },
          signal: controller.signal,
        }
      );

      const data = response.data;
      const results = Array.isArray(data) ? data : data.results || [];
      setAvailableReceipts(results);

      // Si une seule réception, la sélectionner automatiquement
      if (results.length === 1) {
        const receipt = results[0];
        setSelectedReceiptId(receipt.id);
        setSelectedReceipt(receipt);
        setFormData((prev) => ({
          ...prev,
          amount: receipt.total_received_amount?.toString() || '',
          total_amount: (
            parseFloat(receipt.total_received_amount) +
            (parseFloat(prev.tax_amount) || 0)
          ).toString(),
        }));
      } else if (results.length === 0) {
        showNotification(
          'Aucune réception disponible pour cette commande',
          'warning'
        );
        setSelectedReceiptId(null);
        setSelectedReceipt(null);
      }
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') return;
      console.error('❌ Erreur chargement réceptions:', error);
      showNotification('Erreur lors du chargement des réceptions', 'error');
    } finally {
      setLoadingReceipts(false);
    }
  }, [showNotification]);

  // ============================================================
  // CHARGEMENT FACTURE (mode édition)
  // ============================================================
  const fetchInvoice = useCallback(async () => {
    if (!isEdit) return;
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/supplier-invoices/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = response.data;
      const receipt = data.receipt;

      setFormData({
        purchase_order: data.purchase_order?.id || data.purchase_order || '',
        invoice_number: data.invoice_number || '',
        invoice_date: data.invoice_date || '',
        due_date: data.due_date || '',
        amount: data.amount || '',
        tax_amount: data.tax_amount || '',
        total_amount: data.total_amount || '',
        notes: data.notes || '',
        receipt_id: receipt?.id || null,
      });

      if (receipt) {
        setExistingReceipt(receipt);
        setSelectedReceiptId(receipt.id);
        setSelectedReceipt(receipt);
      }
    } catch (error) {
      console.error('❌ Erreur chargement facture:', error);
      showNotification('Erreur de chargement de la facture', 'error');
    } finally {
      setFetchingData(false);
    }
  }, [id, isEdit, showNotification]);

  // ============================================================
  // EFFETS
  // ============================================================
  useEffect(() => {
    fetchOrders();
    if (isEdit) fetchInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedSearchOrder(searchOrder),
      DEBOUNCE_MS
    );
    return () => clearTimeout(t);
  }, [searchOrder]);

  useEffect(() => {
    if (debouncedSearchOrder !== undefined) {
      fetchOrders(debouncedSearchOrder);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchOrder]);

  useEffect(() => {
    if (formData.purchase_order && !isEdit) {
      fetchAvailableReceipts(formData.purchase_order);
    } else if (!formData.purchase_order) {
      setAvailableReceipts([]);
      setSelectedReceiptId(null);
      setSelectedReceipt(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.purchase_order, isEdit]);

  // Calcul auto total TTC
  useEffect(() => {
    const amount = parseFloat(formData.amount) || 0;
    const tax = parseFloat(formData.tax_amount) || 0;
    const total = amount + tax;
    setFormData((prev) => ({
      ...prev,
      total_amount: total > 0 ? total.toFixed(2) : '',
    }));
  }, [formData.amount, formData.tax_amount]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'purchase_order') {
      setSelectedReceiptId(null);
      setSelectedReceipt(null);
      setAvailableReceipts([]);
    }
  };

  const handleSelectReceipt = (receipt) => {
    setSelectedReceiptId(receipt.id);
    setSelectedReceipt(receipt);
    setFormData((prev) => ({
      ...prev,
      amount: receipt.total_received_amount?.toString() || '',
      total_amount: (
        parseFloat(receipt.total_received_amount) +
        (parseFloat(prev.tax_amount) || 0)
      ).toString(),
    }));
  };

  const handleCancel = () => {
    navigate('/factures-fournisseurs');
  };

  // ============================================================
  // SOUMISSION
  // ============================================================
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Validations
    if (!formData.purchase_order) {
      showNotification('Veuillez sélectionner une commande', 'error');
      return;
    }
    if (!isEdit && !selectedReceiptId) {
      showNotification('Veuillez sélectionner une réception', 'error');
      return;
    }
    if (!formData.invoice_number) {
      showNotification('Veuillez saisir le numéro de facture', 'error');
      return;
    }
    if (!formData.invoice_date) {
      showNotification('Veuillez saisir la date de facture', 'error');
      return;
    }
    if (!formData.due_date) {
      showNotification("Veuillez saisir la date d'échéance", 'error');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showNotification('Veuillez saisir un montant valide', 'error');
      return;
    }
    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      showNotification('Veuillez saisir un total TTC valide', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      const url = isEdit
        ? `/supplier-invoices/${id}/`
        : '/supplier-invoices/';
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
        receipt_id: isEdit ? null : selectedReceiptId,
      };

      const response = await AxiosInstance({
        method,
        url,
        data: dataToSend,
        headers: { Authorization: `Token ${token}` },
      });

      showNotification(
        isEdit
          ? 'Facture modifiée avec succès'
          : 'Facture créée avec succès',
        'success'
      );

      setTimeout(() => {
        navigate(`/factures-fournisseurs/${response.data.id}`);
      }, 1500);
    } catch (error) {
      console.error('❌ Erreur:', error);
      let errorMsg = "Erreur lors de l'enregistrement de la facture";

      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'object') {
          if (data.message) errorMsg = data.message;
          else if (data.detail) errorMsg = data.detail;
          else if (data.non_field_errors)
            errorMsg = data.non_field_errors.join(', ');
          else {
            const firstError = Object.values(data)[0];
            if (Array.isArray(firstError)) errorMsg = firstError[0];
            else if (typeof firstError === 'string') errorMsg = firstError;
          }
        } else if (typeof data === 'string') {
          errorMsg = data;
        }
      }

      showNotification(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FILTRES
  // ============================================================
  const filteredOrders = purchaseOrders.filter((order) => {
    const search = searchOrder.toLowerCase();
    return (
      (order.po_number?.toLowerCase() || '').includes(search) ||
      (order.supplier_name?.toLowerCase() || '').includes(search)
    );
  });

  const filteredReceipts = availableReceipts.filter((receipt) => {
    const search = searchReceipt.toLowerCase();
    return (
      (receipt.receipt_number?.toLowerCase() || '').includes(search) ||
      (receipt.po_number?.toLowerCase() || '').includes(search)
    );
  });

  const getSelectedOrderSupplier = () => {
    const order = purchaseOrders.find(
      (o) => o.id === parseInt(formData.purchase_order)
    );
    return order ? order.supplier_name : '';
  };

  const getSelectedOrderNumber = () => {
    const order = purchaseOrders.find(
      (o) => o.id === parseInt(formData.purchase_order)
    );
    return order ? order.po_number : '';
  };

  // ============================================================
  // CHARGEMENT
  // ============================================================
  if (fetchingData) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement…</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div
            className={`alert ${
              notification.type === 'success'
                ? 'alert-success'
                : notification.type === 'warning'
                ? 'alert-warning'
                : 'alert-error'
            } shadow-xl rounded-xl max-w-md`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : notification.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="font-medium text-sm">{notification.message}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() =>
                setNotification((prev) => ({ ...prev, show: false }))
              }
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Receipt className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-primary">
                  {isEdit
                    ? 'Modifier la facture'
                    : 'Nouvelle facture fournisseur'}
                </h1>
              </div>
              <p className="text-sm text-gray-500 ml-1">
                {isEdit
                  ? 'Modifiez les informations de la facture'
                  : 'Sélectionnez une réception non facturée pour créer une facture'}
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchOrders()}
            className="btn btn-sm btn-outline gap-2"
            disabled={loadingOrders}
          >
            <RefreshCw
              className={`w-4 h-4 ${loadingOrders ? 'animate-spin' : ''}`}
            />
            Rafraîchir
          </button>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-xl shadow-xl p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Commande */}
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
                    placeholder="Rechercher une commande (numéro ou fournisseur)…"
                    value={searchOrder}
                    onChange={(e) => setSearchOrder(e.target.value)}
                  />
                  {loadingOrders && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>
              )}

              <select
                name="purchase_order"
                className="select select-bordered w-full"
                value={formData.purchase_order}
                onChange={handleChange}
                disabled={isEdit || loadingOrders}
              >
                <option value="">
                  {loadingOrders
                    ? '⏳ Chargement…'
                    : purchaseOrders.length === 0
                    ? '⚠️ Aucune commande reçue'
                    : '📦 Sélectionner une commande reçue…'}
                </option>
                {filteredOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.po_number} - {order.supplier_name} (
                    {order.total?.toLocaleString('fr-FR')} FCFA) [
                    {order.status === 'received' ? '✅ Reçu' : '🔄 Partiel'}]
                  </option>
                ))}
              </select>

              {formData.purchase_order && (
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />{' '}
                    {getSelectedOrderSupplier()}
                  </span>
                  <span className="flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3" />{' '}
                    {getSelectedOrderNumber()}
                  </span>
                </div>
              )}
            </div>

            {/* Sélection de la réception (création) */}
            {formData.purchase_order && !isEdit && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Réception à facturer <span className="text-error">*</span>
                </label>

                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    className="input input-bordered w-full pl-9"
                    placeholder="Rechercher une réception (numéro ou commande)…"
                    value={searchReceipt}
                    onChange={(e) => setSearchReceipt(e.target.value)}
                  />
                  {loadingReceipts && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>

                {loadingReceipts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-3 text-gray-500">
                      Chargement des réceptions…
                    </span>
                  </div>
                ) : availableReceipts.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-yellow-700">
                          Aucune réception disponible
                        </p>
                        <p className="text-xs text-yellow-600 mt-1">
                          Cette commande n'a pas de réception terminée non
                          facturée.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto border rounded-lg p-3">
                    {filteredReceipts.map((receipt, index) => (
                      <div
                        key={receipt.id}
                        onClick={() => handleSelectReceipt(receipt)}
                        className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all ${
                          selectedReceiptId === receipt.id
                            ? 'bg-primary/10 border-2 border-primary'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex-shrink-0">
                          {selectedReceiptId === receipt.id ? (
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                              <span className="text-xs text-gray-400">
                                {index + 1}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-mono font-semibold">
                              {receipt.receipt_number}
                            </span>
                            <span className="badge badge-success badge-sm">
                              ✅ Terminée
                            </span>
                            <span className="badge badge-info badge-sm">
                              {receipt.po_number}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-4">
                            <span>
                              Montant:{' '}
                              <span className="font-semibold text-gray-700">
                                {receipt.total_received_amount?.toLocaleString(
                                  'fr-FR'
                                )}{' '}
                                FCFA
                              </span>
                            </span>
                            <span>•</span>
                            <span>
                              Date :{' '}
                              {new Date(
                                receipt.receipt_date
                              ).toLocaleDateString('fr-FR')}
                            </span>
                            <span>•</span>
                            <span>
                              Fournisseur :{' '}
                              <span className="font-semibold">
                                {receipt.supplier_name}
                              </span>
                            </span>
                          </div>
                        </div>
                        {selectedReceiptId === receipt.id && (
                          <div className="flex-shrink-0">
                            <span className="badge badge-primary">
                              Sélectionnée
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {selectedReceipt && (
                  <div className="mt-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-sm font-semibold text-green-700 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Réception sélectionnée
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedReceipt.receipt_number} -{' '}
                          {selectedReceipt.po_number}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Montant total</p>
                        <p className="text-lg font-bold text-primary">
                          {selectedReceipt.total_received_amount?.toLocaleString(
                            'fr-FR'
                          )}{' '}
                          FCFA
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReceiptId(null);
                        setSelectedReceipt(null);
                        setFormData((prev) => ({
                          ...prev,
                          amount: '',
                          total_amount: '',
                        }));
                      }}
                      className="btn btn-ghost btn-xs text-error gap-1 mt-2"
                    >
                      <X className="w-3 h-3" /> Désélectionner
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Réception facturée (édition) */}
            {isEdit && existingReceipt && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Réception facturée
                </label>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <span className="font-mono font-semibold">
                      {existingReceipt.receipt_number}
                    </span>
                    <span className="text-sm text-gray-500 ml-3">
                      {existingReceipt.total?.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  <span className="badge badge-success ml-auto">
                    ✅ Facturée
                  </span>
                </div>
              </div>
            )}

            {/* Champs facture */}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant HT <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  F
                </span>
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
              {selectedReceipt && !isEdit && (
                <p className="text-xs text-gray-400 mt-1">
                  💡 Montant suggéré :{' '}
                  {selectedReceipt.total_received_amount?.toLocaleString(
                    'fr-FR'
                  )}{' '}
                  FCFA
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TVA
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  F
                </span>
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total TTC <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  F
                </span>
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                className="textarea textarea-bordered w-full"
                rows="3"
                placeholder="Notes supplémentaires…"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>

            {/* Aide */}
            <div className="md:col-span-2 bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h4 className="font-semibold text-sm text-blue-700 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Informations
              </h4>
              <ul className="text-sm text-blue-600 space-y-1 mt-2">
                <li>
                  • La facture doit correspondre à <strong>UNE</strong>{' '}
                  réception terminée
                </li>
                <li>• La réception ne doit pas être déjà facturée</li>
                <li>
                  • Le montant doit correspondre au total de la réception
                </li>
                <li>
                  • Une réception ne peut être facturée qu'
                  <strong>UNE SEULE</strong> fois
                </li>
                <li>• La date d'échéance détermine le délai de paiement</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-ghost flex-1 sm:flex-none order-2 sm:order-1"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn bg-gradient-to-r from-primary to-primary/80 text-white border-none flex-1 sm:flex-none order-1 sm:order-2 gap-2"
              disabled={
                loading ||
                loadingOrders ||
                (!isEdit && !selectedReceiptId)
              }
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEdit ? 'Modification…' : 'Création…'}
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