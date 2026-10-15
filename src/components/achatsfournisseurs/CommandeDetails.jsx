// src/components/achats/CommandeDetails.jsx
// ============================================================
// VERSION OPTIMISÉE - Détails commande fournisseur
// ============================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, ShoppingCart, Truck, Calendar, DollarSign,
  CheckCircle, XCircle, RefreshCw, FileText, Package,
  Download, Send, AlertCircle, Building2,
  Clock, User, Mail, Phone, MapPin, QrCode,
  ExternalLink, Printer, Loader2, AlertTriangle
} from 'lucide-react';
import QRCodeViewer from './QRCodeViewer';

// ============================================================
// HELPERS DE FORMATAGE
// ============================================================
const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '0 FCFA';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0 FCFA';
  return `${num.toLocaleString('fr-FR')} FCFA`;
};

// ============================================================
// CONFIG STATUTS
// ============================================================
const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: 'info', icon: FileText },
  sent: { label: 'Envoyé', color: 'primary', icon: Send },
  confirmed: { label: 'Confirmé', color: 'success', icon: CheckCircle },
  partial: { label: 'Partiel', color: 'warning', icon: Package },
  received: { label: 'Reçu', color: 'success', icon: Truck },
  cancelled: { label: 'Annulé', color: 'error', icon: XCircle },
};

// ============================================================
// COMPOSANT
// ============================================================
const CommandeDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // ----- Données -----
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  // ----- QR Code -----
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [qrCodeLoading, setQrCodeLoading] = useState(false);

  const abortRef = useRef(null);

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const getToken = () => localStorage.getItem('Token');

  // ============================================================
  // CHARGEMENT DÉTAILS
  // ============================================================
  const fetchOrderDetails = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await AxiosInstance.get(`/purchase-orders/${id}/`, {
        headers: { Authorization: `Token ${token}` },
        signal: controller.signal,
      });
      setOrder(response.data);
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') return;

      console.error('❌ Erreur chargement commande:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        showNotification('Commande non trouvée', 'error');
        setTimeout(() => navigate('/commandes-fournisseurs'), 1500);
      } else {
        showNotification('Erreur de chargement des données', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showNotification]);

  useEffect(() => {
    fetchOrderDetails();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchOrderDetails]);

  // ============================================================
  // GÉNÉRATION QR CODE
  // ============================================================
  const handleGenerateQRCode = useCallback(async () => {
    setQrCodeLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(
        `/purchase-orders/${id}/generate_qr/`,
        { headers: { Authorization: `Token ${token}` } }
      );

      setQrCodeData({
        url: response.data.qr_code_url,
        data: response.data.qr_code_data,
        title: `QR Code - ${order?.po_number || 'Commande'}`,
      });
      setShowQRCode(true);
    } catch (error) {
      console.error('❌ Erreur QR Code:', error);
      showNotification('Erreur lors de la génération du QR Code', 'error');
    } finally {
      setQrCodeLoading(false);
    }
  }, [id, order, showNotification]);

  // ============================================================
  // TÉLÉCHARGEMENT PDF
  // ============================================================
  const handleDownloadPdf = useCallback(() => {
    navigate(`/commandes-fournisseurs/${id}/pdf`);
  }, [id, navigate]);

  // ============================================================
  // APPROUVER
  // ============================================================
  const approveOrder = useCallback(async () => {
    if (!window.confirm(`Approuver la commande ${order?.po_number} ?`)) return;

    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(
        `/purchase-orders/${id}/approve/`,
        { approved: true },
        { headers: { Authorization: `Token ${token}` } }
      );
      showNotification('Commande approuvée avec succès', 'success');
      await fetchOrderDetails();
    } catch (error) {
      console.error('❌ Erreur approbation:', error);
      showNotification(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Erreur lors de l'approbation",
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  }, [id, order, fetchOrderDetails, showNotification]);

  // ============================================================
  // ANNULER
  // ============================================================
  const cancelOrder = useCallback(async () => {
    if (!window.confirm(`Annuler la commande ${order?.po_number} ?`)) return;

    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(
        `/purchase-orders/${id}/cancel/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      showNotification('Commande annulée avec succès', 'success');
      await fetchOrderDetails();
    } catch (error) {
      console.error('❌ Erreur annulation:', error);
      showNotification(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Erreur lors de l'annulation",
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  }, [id, order, fetchOrderDetails, showNotification]);

  // ============================================================
  // TÉLÉCHARGEMENT QR CODE
  // ============================================================
  const handleDownloadQRCode = useCallback(() => {
    if (!order?.qr_code_url && !order?.qr_code) return;
    const url =
      order.qr_code_url || `http://127.0.0.1:8000${order.qr_code}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr_${order.po_number}.png`;
    link.click();
  }, [order]);

  // ============================================================
  // RENDU CONDITIONNEL - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">
            Chargement de la commande…
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Commande non trouvée
          </h2>
          <p className="text-gray-500 mb-6">
            La commande que vous recherchez n'existe pas ou a été supprimée.
          </p>
          <button
            onClick={() => navigate('/commandes-fournisseurs')}
            className="btn btn-primary"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  const statusConfig =
    STATUS_CONFIG[order.status] || STATUS_CONFIG.draft;
  const StatusIcon = statusConfig.icon;

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ---------- MODAL QR CODE ---------- */}
      {showQRCode && qrCodeData && (
        <QRCodeViewer
          qrCodeUrl={qrCodeData.url}
          qrCodeData={qrCodeData.data}
          title={qrCodeData.title}
          onClose={() => {
            setShowQRCode(false);
            setQrCodeData(null);
          }}
        />
      )}

      {/* ---------- NOTIFICATION ---------- */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div
            className={`alert ${
              notification.type === 'success'
                ? 'alert-success'
                : notification.type === 'warning'
                ? 'alert-warning'
                : 'alert-error'
            } shadow-xl rounded-xl min-w-[300px] max-w-md`}
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
              onClick={() => setNotification(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ---------- EN-TÊTE ---------- */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/commandes-fournisseurs')}
                className="btn btn-ghost btn-sm gap-2"
                disabled={actionLoading}
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/15 rounded-xl">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Commande {order.po_number}
                  </h1>
                  <p className="text-sm text-gray-500">{order.supplier_name}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleGenerateQRCode}
                className="btn btn-secondary btn-sm gap-2"
                disabled={qrCodeLoading}
              >
                {qrCodeLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <QrCode className="w-4 h-4" />
                )}
                QR Code
              </button>

              <button
                onClick={handleDownloadPdf}
                className="btn btn-primary btn-sm gap-2"
              >
                <Download className="w-4 h-4" /> PDF
              </button>

              {order.status === 'draft' && (
                <>
                  <button
                    onClick={approveOrder}
                    className="btn btn-success btn-sm gap-2"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Approuver
                  </button>
                  <button
                    onClick={cancelOrder}
                    className="btn btn-error btn-sm gap-2"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    Annuler
                  </button>
                </>
              )}

              <button
                onClick={fetchOrderDetails}
                className="btn btn-ghost btn-sm btn-circle"
                disabled={actionLoading}
                title="Actualiser"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- CONTENU ---------- */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Cartes statut */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Date commande</p>
                <p className="font-semibold">{formatDate(order.order_date)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Truck className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Livraison prévue</p>
                <p className="font-semibold">
                  {formatDate(order.expected_delivery_date)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Montant total</p>
                <p className="font-bold text-lg text-primary">
                  {formatCurrency(order.total)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-${statusConfig.color}/10 rounded-lg`}>
                <StatusIcon className={`w-5 h-5 text-${statusConfig.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Statut</p>
                <span className={`badge badge-${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
            </div>
          </div>
          <div
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={handleGenerateQRCode}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <QrCode className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">QR Code</p>
                <p className="font-semibold text-secondary">
                  {order.qr_code ? 'Disponible' : 'Générer'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="border-b border-gray-100">
            <nav
              className="flex gap-1 px-4 overflow-x-auto"
              aria-label="Tabs"
            >
              <button
                onClick={() => setActiveTab('details')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'details'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4" /> Détails
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'products'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="w-4 h-4" /> Produits
              </button>
              <button
                onClick={() => setActiveTab('supplier')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'supplier'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building2 className="w-4 h-4" /> Fournisseur
              </button>
              <button
                onClick={() => {
                  setActiveTab('qr');
                  if (!order.qr_code) handleGenerateQRCode();
                }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'qr'
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <QrCode className="w-4 h-4" /> QR Code
              </button>
            </nav>
          </div>

          {/* Contenu des onglets */}
          <div className="p-4 sm:p-6">
            {/* ---------- DÉTAILS ---------- */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">
                      Informations générales
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">N° commande</span>
                        <span className="font-mono font-medium">
                          {order.po_number}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">
                          Référence fournisseur
                        </span>
                        <span className="font-medium">
                          {order.supplier_reference || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Date de création</span>
                        <span className="font-medium">
                          {formatDateTime(order.created_at)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Créé par</span>
                        <span className="font-medium">
                          {order.created_by_name || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">
                      Livraison
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">
                          Date livraison prévue
                        </span>
                        <span className="font-medium">
                          {formatDate(order.expected_delivery_date)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">
                          Date livraison réelle
                        </span>
                        <span className="font-medium">
                          {order.actual_delivery_date
                            ? formatDate(order.actual_delivery_date)
                            : 'Non livrée'}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">N° de suivi</span>
                        <span className="font-medium">
                          {order.tracking_number || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {(order.notes || order.internal_notes) && (
                  <div className="border-t border-gray-100 pt-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">
                      Notes
                    </h4>
                    {order.notes && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">{order.notes}</p>
                      </div>
                    )}
                    {order.internal_notes && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 italic">
                          {order.internal_notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ---------- PRODUITS ---------- */}
            {activeTab === 'products' && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Produit
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                        Qté
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                        Reçue
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                        Prix unit.
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                        Remise
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.lines && order.lines.length > 0 ? (
                      order.lines.map((line, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800">
                              {line.product_name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {line.product_code}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-center font-medium">
                            {line.quantity}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {line.quantity_received > 0 ? (
                              <span className="text-success font-medium">
                                {line.quantity_received}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatCurrency(line.unit_price)}
                          </td>
                          <td className="px-4 py-3 text-right text-error">
                            {line.discount > 0
                              ? formatCurrency(line.discount)
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {formatCurrency(
                              line.quantity * line.unit_price - line.discount
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-12 text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          Aucun produit dans cette commande
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr className="border-t border-gray-200">
                      <td
                        colSpan="5"
                        className="px-4 py-3 text-right font-semibold"
                      >
                        Sous-total
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(order.subtotal)}
                      </td>
                    </tr>
                    {order.discount_amount > 0 && (
                      <tr>
                        <td colSpan="5" className="px-4 py-3 text-right">
                          Remise
                        </td>
                        <td className="px-4 py-3 text-right text-error">
                          -{formatCurrency(order.discount_amount)}
                        </td>
                      </tr>
                    )}
                    {order.tax_amount > 0 && (
                      <tr>
                        <td colSpan="5" className="px-4 py-3 text-right">
                          TVA ({order.tax_rate}%)
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(order.tax_amount)}
                        </td>
                      </tr>
                    )}
                    {order.shipping_cost > 0 && (
                      <tr>
                        <td colSpan="5" className="px-4 py-3 text-right">
                          Frais de livraison
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(order.shipping_cost)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-gray-200">
                      <td
                        colSpan="5"
                        className="px-4 py-4 text-right font-bold text-lg"
                      >
                        Total
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-xl text-primary">
                        {formatCurrency(order.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* ---------- FOURNISSEUR ---------- */}
            {activeTab === 'supplier' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">
                      Informations générales
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="flex-1 text-gray-600">
                          Raison sociale
                        </span>
                        <span className="font-medium">
                          {order.supplier_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="flex-1 text-gray-600">Email</span>
                        <span className="font-medium">
                          {order.supplier_email || '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="flex-1 text-gray-600">Téléphone</span>
                        <span className="font-medium">
                          {order.supplier_phone || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">
                      Adresse
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 py-2 border-b border-gray-100">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="flex-1 text-gray-600 whitespace-pre-line">
                          {order.supplier_address || 'Adresse non renseignée'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---------- QR CODE ---------- */}
            {activeTab === 'qr' && (
              <div className="flex flex-col items-center justify-center py-8">
                {order.qr_code ? (
                  <div className="text-center">
                    <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 inline-block">
                      <img
                        src={
                          order.qr_code_url ||
                          `http://127.0.0.1:8000${order.qr_code}`
                        }
                        alt="QR Code"
                        className="w-64 h-64 object-contain"
                      />
                    </div>
                    <div className="mt-6 space-y-2">
                      <p className="text-sm text-gray-500">
                        Scannez ce QR Code pour accéder aux détails de la
                        commande
                      </p>
                      <div className="flex gap-3 justify-center flex-wrap">
                        <button
                          onClick={() => {
                            window.open(
                              order.qr_code_url ||
                                `http://127.0.0.1:8000${order.qr_code}`,
                              '_blank'
                            );
                          }}
                          className="btn btn-primary btn-sm gap-2"
                        >
                          <ExternalLink className="w-4 h-4" /> Ouvrir
                        </button>
                        <button
                          onClick={handleDownloadQRCode}
                          className="btn btn-secondary btn-sm gap-2"
                        >
                          <Download className="w-4 h-4" /> Télécharger
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="btn btn-outline btn-sm gap-2"
                        >
                          <Printer className="w-4 h-4" /> Imprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-32 h-32 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                      <QrCode className="w-16 h-16 text-secondary" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      QR Code non généré
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Cliquez sur le bouton ci-dessous pour générer le QR Code
                      de cette commande
                    </p>
                    <button
                      onClick={handleGenerateQRCode}
                      className="btn btn-secondary gap-2"
                      disabled={qrCodeLoading}
                    >
                      {qrCodeLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <QrCode className="w-4 h-4" />
                      )}
                      Générer le QR Code
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandeDetails;