// src/components/achats/PaiementFournisseurDetail.jsx
// ============================================================
// VERSION CORRIGÉE - Détails paiement fournisseur
// ============================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, CreditCard, Calendar, Building2,
  CheckCircle, X, Clock, Receipt, Banknote, Printer,
  QrCode, FileText, AlertCircle, RefreshCw, Download,
  Loader2
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

const METHOD_LABELS = {
  especes: '💵 Espèces',
  cheque: '📄 Chèque',
  virement: '🏦 Virement bancaire',
  transfert: '🔄 Transfert',
  mobile_money: '📱 Mobile Money',
  autre: '🔧 Autre',
};

// ============================================================
// COMPOSANT
// ============================================================
const PaiementFournisseurDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  const fetchPayment = useCallback(async () => {
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

      const response = await AxiosInstance.get(
        `/fournisseur-paiements/${id}/`,
        {
          headers: { Authorization: `Token ${token}` },
          signal: controller.signal,
        }
      );
      setPayment(response.data);
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;

      console.error('❌ Erreur chargement paiement :', err);
      if (err.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 404) {
        setError('Paiement non trouvé');
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
    fetchPayment();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchPayment]);

  // ============================================================
  // ACTIONS
  // ============================================================
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    showNotification('Téléchargement en cours…', 'success');
  };

  // ============================================================
  // BADGES
  // ============================================================
  const getStatusBadge = (status) => {
    const map = {
      pending: {
        label: 'En attente',
        color: 'warning',
        icon: <Clock className="w-4 h-4" />,
      },
      confirmed: {
        label: 'Confirmé',
        color: 'success',
        icon: <CheckCircle className="w-4 h-4" />,
      },
      cancelled: {
        label: 'Annulé',
        color: 'error',
        icon: <X className="w-4 h-4" />,
      },
    };
    const s = map[status] || { label: status, color: 'ghost', icon: null };
    return (
      <span className={`badge badge-${s.color} gap-1 text-sm px-3 py-1.5`}>
        {s.icon} {s.label}
      </span>
    );
  };

  const getMethodLabel = (method) => {
    return METHOD_LABELS[method] || method;
  };

  // ============================================================
  // CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">
            Chargement du paiement…
          </p>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
          <CreditCard className="w-20 h-20 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {error || 'Paiement non trouvé'}
          </h2>
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={fetchPayment} className="btn btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Réessayer
            </button>
            <button
              onClick={() => navigate('/paiements-fournisseurs')}
              className="btn btn-primary"
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
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
                <AlertCircle className="w-4 h-4 shrink-0" />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => navigate('/paiements-fournisseurs')}
            className="btn btn-ghost btn-sm gap-2 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="p-2 bg-primary/10 rounded-xl">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">
              Paiement {payment.reference}
            </h1>
            {getStatusBadge(payment.status)}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handlePrint} className="btn btn-outline btn-sm gap-2">
            <Printer className="w-4 h-4" /> Imprimer
          </button>
          <button
            onClick={handleDownload}
            className="btn btn-outline btn-sm gap-2"
          >
            <Download className="w-4 h-4" /> Télécharger
          </button>
        </div>
      </div>

      {/* Carte principale */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {/* En-tête coloré */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Référence</p>
              <p className="font-mono text-lg font-bold">{payment.reference}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Montant</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(payment.amount)}
              </p>
            </div>
          </div>
        </div>

        {/* Grille info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Building2 className="w-4 h-4" />
              <p className="text-sm">Fournisseur</p>
            </div>
            <p className="font-semibold text-lg">
              {payment.supplier_name || '-'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Receipt className="w-4 h-4" />
              <p className="text-sm">Facture</p>
            </div>
            <p className="font-mono font-semibold">
              {payment.invoice_number || '-'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Calendar className="w-4 h-4" />
              <p className="text-sm">Date de paiement</p>
            </div>
            <p className="font-semibold">
              {formatDate(payment.payment_date)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Banknote className="w-4 h-4" />
              <p className="text-sm">Méthode</p>
            </div>
            <p className="font-semibold">{getMethodLabel(payment.method)}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <FileText className="w-4 h-4" />
              <p className="text-sm">Référence externe</p>
            </div>
            <p className="font-mono">{payment.reference_number || '-'}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Clock className="w-4 h-4" />
              <p className="text-sm">Créé le</p>
            </div>
            <p className="text-sm">{formatDateTime(payment.created_at)}</p>
          </div>
        </div>

        {/* Destinations */}
        {(payment.caisse_destination_id ||
          payment.compte_destination_id) && (
          <div className="px-6 pb-4">
            <h3 className="font-semibold text-gray-700 mb-2">
              Destination du paiement
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {payment.caisse_destination_id && (
                <div className="bg-success/10 rounded-lg p-3 border border-success/20">
                  <p className="text-xs text-gray-500">Caisse</p>
                  <p className="font-semibold">
                    {payment.caisse_destination_nom || 'Caisse'}
                  </p>
                </div>
              )}
              {payment.compte_destination_id && (
                <div className="bg-info/10 rounded-lg p-3 border border-info/20">
                  <p className="text-xs text-gray-500">Compte bancaire</p>
                  <p className="font-semibold">
                    {payment.compte_destination_nom || 'Compte'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mouvement trésorerie */}
        {payment.mouvement_reference && (
          <div className="px-6 pb-4">
            <h3 className="font-semibold text-gray-700 mb-2">
              Mouvement de trésorerie
            </h3>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-sm">
                <span className="text-gray-500">Référence :</span>{' '}
                <span className="font-mono font-semibold">
                  {payment.mouvement_reference}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Notes */}
        {payment.notes && (
          <div className="px-6 pb-6">
            <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-600 whitespace-pre-wrap">
                {payment.notes}
              </p>
            </div>
          </div>
        )}

        {/* QR Code */}
        {payment.qr_code && (
          <div className="px-6 pb-6">
            <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <QrCode className="w-4 h-4" /> QR Code
            </h3>
            <div className="flex justify-center">
              <img
                src={payment.qr_code}
                alt="QR Code"
                className="w-40 h-40 object-contain border rounded-lg p-2"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaiementFournisseurDetail;