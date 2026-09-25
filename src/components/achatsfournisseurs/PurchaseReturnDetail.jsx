// src/components/achats/PurchaseReturnDetail.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, CheckCircle, AlertCircle, X, Package,
  Truck, DollarSign, FileText, QrCode, Printer, RefreshCw,
  ThumbsUp, ThumbsDown, Send, RotateCcw, Loader2
} from 'lucide-react';

const PurchaseReturnDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [returnData, setReturnData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [showQrModal, setShowQrModal] = useState(false);

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchReturn = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(
        `/purchase-returns/${id}/`,
        { headers: { 'Authorization': `Token ${token}` } }
      );
      setReturnData(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement', 'error');
      if (error.response?.status === 404) {
        setTimeout(() => navigate('/retours-fournisseurs'), 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const actionLabels = {
    approve: 'Approuver',
    reject: 'Refuser',
    ship: 'Marquer comme expédié',
    refund: 'Marquer comme remboursé',
    replace: 'Marquer comme remplacé'
  };

  const updateStatus = async (action) => {
    if (!window.confirm(`Confirmer : ${actionLabels[action]} ?`)) return;

    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(
        `/purchase-returns/${id}/${action}/`,
        {},
        { headers: { 'Authorization': `Token ${token}` } }
      );
      showNotification(`✅ ${actionLabels[action]} effectué`, 'success');
      await fetchReturn();
    } catch (error) {
      console.error('Erreur:', error);
      const msg = error.response?.data?.error
        || `Erreur lors de l'action ${actionLabels[action]}`;
      showNotification(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    const map = {
      requested: 'Demandé',
      approved: 'Approuvé',
      shipped: 'Expédié',
      refunded: 'Remboursé',
      replaced: 'Remplacé',
      rejected: 'Refusé'
    };
    return map[status] || status;
  };

  const getStatusBadge = (status) => {
    const map = {
      requested: 'badge-warning',
      approved: 'badge-info',
      shipped: 'badge-primary',
      refunded: 'badge-success',
      replaced: 'badge-secondary',
      rejected: 'badge-error'
    };
    return map[status] || 'badge-ghost';
  };

  const getReasonLabel = (reason) => {
    const map = {
      defective: 'Produit défectueux',
      wrong_product: 'Produit incorrect',
      expired: 'Produit expiré',
      damaged: 'Produit endommagé',
      other: 'Autre'
    };
    return map[reason] || reason;
  };

  const getAvailableActions = () => {
    if (!returnData) return [];
    const s = returnData.status;
    if (s === 'requested') {
      return [
        { label: 'Approuver', action: 'approve', icon: ThumbsUp, color: 'btn-success' },
        { label: 'Refuser', action: 'reject', icon: ThumbsDown, color: 'btn-error' }
      ];
    }
    if (s === 'approved') {
      return [
        { label: 'Marquer comme expédié', action: 'ship', icon: Send, color: 'btn-primary' },
        { label: 'Refuser', action: 'reject', icon: ThumbsDown, color: 'btn-error' }
      ];
    }
    if (s === 'shipped') {
      return [
        { label: 'Remboursé', action: 'refund', icon: DollarSign, color: 'btn-success' },
        { label: 'Remplacé', action: 'replace', icon: RotateCcw, color: 'btn-info' }
      ];
    }
    return [];
  };

  const handlePrint = () => navigate(`/retours-fournisseurs/${id}/pdf`);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-base font-semibold text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!returnData) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-error mx-auto" />
          <p className="text-lg font-semibold text-gray-700">Retour introuvable</p>
          <button
            onClick={() => navigate('/retours-fournisseurs')}
            className="btn btn-primary gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  const actions = getAvailableActions();
  const total = parseFloat(returnData.total_amount || 0);

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
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => setNotification({ ...notification, show: false })}
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
            <button onClick={fetchReturn} className="btn btn-sm btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={handlePrint} className="btn btn-sm btn-outline gap-2">
              <Printer className="w-4 h-4" /> Imprimer PDF
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

      {/* Actions de changement de statut */}
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

      {/* Cartes d'information */}
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
              {new Date(returnData.return_date).toLocaleString('fr-FR')}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 space-y-2">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Truck className="w-4 h-4" /> Fournisseur
          </div>
          <div className="space-y-1 text-sm">
            <p className="font-semibold">{returnData.supplier_name}</p>
            {returnData.supplier_code && (
              <p className="text-gray-500 font-mono text-xs">
                {returnData.supplier_code}
              </p>
            )}
            <p className="text-gray-500">Commande : {returnData.po_number}</p>
            {returnData.receipt_number && (
              <p className="text-gray-500">
                Réception : {returnData.receipt_number}
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

      {/* Détails des lignes */}
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
                  <td className="font-mono text-sm">{line.lot_number || '—'}</td>
                  <td className="text-center font-semibold">{line.quantity}</td>
                  <td className="text-right">
                    {parseFloat(line.unit_price).toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="text-right font-bold">
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
                <td className="text-right font-black text-primary text-lg">
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
        <div className="modal modal-open">
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
          <div
            className="modal-backdrop bg-black/50"
            onClick={() => setShowQrModal(false)}
          ></div>
        </div>
      )}
    </div>
  );
};

export default PurchaseReturnDetail;