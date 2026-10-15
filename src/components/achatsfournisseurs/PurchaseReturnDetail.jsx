// src/components/achats/PurchaseReturnDetail.jsx
// ============================================================
// VERSION CORRIGÉE - Détails retour fournisseur
// ============================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, CheckCircle, AlertCircle, X, Package,
  Truck, DollarSign, FileText, QrCode, Printer, RefreshCw,
  ThumbsUp, ThumbsDown, Send, RotateCcw, Loader2, Building2
} from 'lucide-react';

// ============================================================
// HELPERS
// ============================================================
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '0 FCFA';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0 FCFA';
  return `${num.toLocaleString('fr-FR')} FCFA`;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('fr-FR');
  } catch {
    return '-';
  }
};

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('fr-FR');
  } catch {
    return '-';
  }
};

// ============================================================
// CONSTANTES
// ============================================================
const STATUS_LABELS = {
  requested: 'Demandé',
  approved: 'Approuvé',
  shipped: 'Expédié',
  refunded: 'Remboursé',
  replaced: 'Remplacé',
  rejected: 'Refusé',
};

const STATUS_BADGES = {
  requested: 'badge-warning',
  approved: 'badge-info',
  shipped: 'badge-primary',
  refunded: 'badge-success',
  replaced: 'badge-secondary',
  rejected: 'badge-error',
};

const REASON_LABELS = {
  defective: 'Produit défectueux',
  wrong_product: 'Produit incorrect',
  expired: 'Produit expiré',
  damaged: 'Produit endommagé',
  other: 'Autre',
};

const ACTION_LABELS = {
  approve: 'Approuver',
  reject: 'Refuser',
  ship: 'Marquer comme expédié',
  refund: 'Marquer comme remboursé',
  replace: 'Marquer comme remplacé',
};

// ============================================================
// COMPOSANT
// ============================================================
const PurchaseReturnDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [returnData, setReturnData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  const abortRef = useRef(null);

  const getToken = () => localStorage.getItem('Token');

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

  // ============================================================
  // CHARGEMENT
  // ============================================================
  const fetchReturn = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await AxiosInstance.get(`/purchase-returns/${id}/`, {
        headers: { Authorization: `Token ${token}` },
        signal: controller.signal,
      });
      setReturnData(response.data);
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;

      console.error('❌ Erreur chargement retour :', err);
      if (err.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 404) {
        setError('Retour introuvable');
        setTimeout(() => navigate('/retours-fournisseurs'), 1500);
      } else {
        setError(
          err.response?.data?.detail ||
            err.response?.data?.message ||
            'Erreur de chargement'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showNotification]);

  useEffect(() => {
    fetchReturn();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchReturn]);

  // ============================================================
  // ACTIONS STATUT
  // ============================================================
  const updateStatus = async (action) => {
    if (!window.confirm(`Confirmer : ${ACTION_LABELS[action]} ?`)) return;

    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(
        `/purchase-returns/${id}/${action}/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      showNotification(`✅ ${ACTION_LABELS[action]} effectué`, 'success');
      await fetchReturn();
    } catch (error) {
      console.error('❌ Erreur action:', error);
      const msg =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        `Erreur lors de l'action ${ACTION_LABELS[action]}`;
      showNotification(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // BADGES
  // ============================================================
  const getStatusLabel = (status) => STATUS_LABELS[status] || status;
  const getStatusBadge = (status) => STATUS_BADGES[status] || 'badge-ghost';
  const getReasonLabel = (reason) => REASON_LABELS[reason] || reason;

  const getAvailableActions = () => {
    if (!returnData) return [];
    const s = returnData.status;
    if (s === 'requested') {
      return [
        {
          label: 'Approuver',
          action: 'approve',
          icon: ThumbsUp,
          color: 'btn-success',
        },
        {
          label: 'Refuser',
          action: 'reject',
          icon: ThumbsDown,
          color: 'btn-error',
        },
      ];
    }
    if (s === 'approved') {
      return [
        {
          label: 'Marquer comme expédié',
          action: 'ship',
          icon: Send,
          color: 'btn-primary',
        },
        {
          label: 'Refuser',
          action: 'reject',
          icon: ThumbsDown,
          color: 'btn-error',
        },
      ];
    }
    if (s === 'shipped') {
      return [
        {
          label: 'Remboursé',
          action: 'refund',
          icon: DollarSign,
          color: 'btn-success',
        },
        {
          label: 'Remplacé',
          action: 'replace',
          icon: RotateCcw,
          color: 'btn-info',
        },
      ];
    }
    return [];
  };

  const handlePrint = () => navigate(`/retours-fournisseurs/${id}/pdf`);

  // ============================================================
  // CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">
            Chargement du retour…
          </p>
        </div>
      </div>
    );
  }

  if (error || !returnData) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
          <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {error || 'Retour introuvable'}
          </h2>
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={fetchReturn} className="btn btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Réessayer
            </button>
            <button
              onClick={() => navigate('/retours-fournisseurs')}
              className="btn btn-primary"
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  const actions = getAvailableActions();
  const total = parseFloat(returnData.total_amount || 0);

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown max-w-md">
          <div
            className={`alert ${
              notification.type === 'success'
                ? 'alert-success'
                : notification.type === 'warning'
                ? 'alert-warning'
                : 'alert-error'
            } shadow-xl rounded-xl`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
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
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Truck className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-primary font-mono">
                  {returnData.return_number}
                </h1>
                <p className="text-sm text-gray-500">Retour fournisseur</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchReturn}
              className="btn btn-sm btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              />{' '}
              Actualiser
            </button>
            <button
              onClick={handlePrint}
              className="btn btn-sm btn-outline gap-2"
            >
              <Printer className="w-4 h-4" /> PDF
            </button>
            <button
              onClick={() => setShowQrModal(true)}
              className="btn btn-sm btn-outline gap-2"
            >
              <QrCode className="w-4 h-4" /> QR Code
            </button>
            <button
              onClick={() => navigate('/retours-fournisseurs')}
              className="btn btn-sm btn-outline gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">
            Actions disponibles
          </h3>
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.action}
                  onClick={() => updateStatus(action.action)}
                  disabled={actionLoading}
                  className={`btn ${action.color} text-white gap-2`}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Cartes info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4 space-y-2">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <FileText className="w-4 h-4" /> Informations
          </div>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-gray-500">Statut :</span>{' '}
              <span className={`badge ${getStatusBadge(returnData.status)}`}>
                {getStatusLabel(returnData.status)}
              </span>
            </p>
            <p>
              <span className="text-gray-500">Raison :</span>{' '}
              {getReasonLabel(returnData.reason)}
            </p>
            <p>
              <span className="text-gray-500">Date :</span>{' '}
              {formatDateTime(returnData.return_date)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 space-y-2">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Building2 className="w-4 h-4" /> Fournisseur
          </div>
          <div className="space-y-1 text-sm">
            <p className="font-semibold">{returnData.supplier_name}</p>
            {returnData.supplier_code && (
              <p className="text-gray-500 font-mono text-xs">
                {returnData.supplier_code}
              </p>
            )}
            <p className="text-gray-500">
              Commande : <span className="font-mono">{returnData.po_number}</span>
            </p>
            {returnData.receipt_number && (
              <p className="text-gray-500">
                Réception :{' '}
                <span className="font-mono">{returnData.receipt_number}</span>
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 space-y-2">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <DollarSign className="w-4 h-4" /> Montant
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-primary">
              {total.toLocaleString('fr-FR')} FCFA
            </p>
            <p className="text-xs text-gray-500">
              {returnData.lines?.length || 0} produit(s)
            </p>
          </div>
        </div>
      </div>

      {/* Détails lignes */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50">
          <h2 className="font-bold text-gray-700 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" /> Produits retournés
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th>Produit</th>
                <th>N° Lot</th>
                <th className="text-center">Quantité</th>
                <th className="text-right">Prix unitaire</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {returnData.lines?.map((line, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td>
                    <div className="font-semibold">{line.product_name}</div>
                    <div className="text-xs text-gray-500 font-mono">
                      {line.product_code}
                    </div>
                  </td>
                  <td className="font-mono text-sm">
                    {line.lot_number || '—'}
                  </td>
                  <td className="text-center font-semibold">{line.quantity}</td>
                  <td className="text-right whitespace-nowrap">
                    {parseFloat(line.unit_price).toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="text-right font-bold whitespace-nowrap">
                    {parseFloat(line.total).toLocaleString('fr-FR')} FCFA
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan="4" className="text-right font-bold text-lg">
                  TOTAL
                </td>
                <td className="text-right font-black text-primary text-lg whitespace-nowrap">
                  {total.toLocaleString('fr-FR')} FCFA
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Notes */}
      {returnData.notes && (
        <div className="bg-white rounded-xl shadow-md p-5">
          <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Notes
          </h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {returnData.notes}
          </p>
        </div>
      )}

      {/* Modal QR Code */}
      {showQrModal && (
        <div className="modal modal-open z-50">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" /> QR Code du retour
            </h3>
            <div className="flex flex-col items-center gap-4">
              {returnData.qr_code_url ? (
                <img
                  src={returnData.qr_code_url}
                  alt="QR Code"
                  className="w-64 h-64 border-2 border-gray-200 rounded-xl p-2 bg-white"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-xl">
                  <p className="text-gray-400 text-sm">Aucun QR Code</p>
                </div>
              )}
              <div className="text-xs text-gray-500 text-center">
                <p className="font-mono">{returnData.return_number}</p>
              </div>
            </div>
            <div className="modal-action">
              <button
                onClick={() => setShowQrModal(false)}
                className="btn btn-outline"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseReturnDetail;