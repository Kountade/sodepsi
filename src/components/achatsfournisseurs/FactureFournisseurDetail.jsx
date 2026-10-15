// src/components/achats/FactureFournisseurDetail.jsx
// ============================================================
// VERSION CORRIGÉE - Détails facture fournisseur
// ============================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, DollarSign, Clock, FileText,
  CreditCard, AlertTriangle, CheckCircle, X,
  Printer, Download, Edit,
  Building2, HandCoins, TrendingUp, Loader2
} from 'lucide-react';

// ============================================================
// HELPERS
// ============================================================
const formatAmount = (amount) => {
  if (amount === undefined || amount === null) return '0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  return num.toLocaleString('fr-FR');
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

// ============================================================
// COMPOSANT
// ============================================================
const FactureFournisseurDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
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
  const fetchInvoice = useCallback(async () => {
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

      const response = await AxiosInstance.get(`/supplier-invoices/${id}/`, {
        headers: { Authorization: `Token ${token}` },
        signal: controller.signal,
      });
      setInvoice(response.data);
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;

      console.error('❌ Erreur chargement facture :', err);
      if (err.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 404) {
        setError('Facture non trouvée');
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
    fetchInvoice();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchInvoice]);

  // ============================================================
  // ACTIONS
  // ============================================================
  const handleRegisterPayment = () => {
    navigate(`/paiements-fournisseurs/nouveau?facture=${id}`);
  };

  const handleEdit = () => {
    navigate(`/factures-fournisseurs/${id}/modifier`);
  };

  // ============================================================
  // BADGES
  // ============================================================
  const getStatusBadge = (status) => {
    const map = {
      received: { label: 'Reçue', color: 'info' },
      verified: { label: 'Vérifiée', color: 'success' },
      paid: { label: 'Payée', color: 'success' },
      partial: { label: 'Partielle', color: 'warning' },
      disputed: { label: 'Contestée', color: 'error' },
    };
    const s = map[status] || { label: status, color: 'ghost' };
    return <span className={`badge badge-${s.color}`}>{s.label}</span>;
  };

  const getPaiementStatusBadge = (status) => {
    const map = {
      unpaid: {
        label: 'Non payée',
        color: 'error',
        icon: <AlertTriangle className="w-3 h-3" />,
      },
      partial: {
        label: 'Partielle',
        color: 'warning',
        icon: <Clock className="w-3 h-3" />,
      },
      paid: {
        label: 'Payée',
        color: 'success',
        icon: <CheckCircle className="w-3 h-3" />,
      },
      overdue: {
        label: 'En retard',
        color: 'error',
        icon: <AlertTriangle className="w-3 h-3" />,
      },
    };
    const s = map[status] || { label: status, color: 'ghost', icon: null };
    return (
      <span className={`badge badge-${s.color} gap-1`}>
        {s.icon} {s.label}
      </span>
    );
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
            Chargement de la facture…
          </p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
          <FileText className="w-20 h-20 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {error || 'Facture non trouvée'}
          </h2>
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={fetchInvoice}
              className="btn btn-outline gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Réessayer
            </button>
            <button
              onClick={() => navigate('/factures-fournisseurs')}
              className="btn btn-primary"
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  const paidPercentage =
    invoice.total_amount > 0
      ? (invoice.amount_paid / invoice.total_amount) * 100
      : 0;

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
              onClick={() => navigate('/factures-fournisseurs')}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <FileText className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-primary">
                  {invoice.invoice_number}
                </h1>
                <div className="flex gap-2 flex-wrap">
                  {getStatusBadge(invoice.status)}
                  {getPaiementStatusBadge(invoice.paiement_status)}
                </div>
              </div>
              <p className="text-sm text-gray-500 ml-1">
                <Building2 className="w-3 h-3 inline mr-1" />
                {invoice.supplier_name}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {invoice.paiement_status !== 'paid' && (
              <button
                onClick={handleRegisterPayment}
                className="btn btn-sm sm:btn-md bg-gradient-to-r from-success to-success/80 text-white border-none shadow-lg gap-2"
              >
                <HandCoins className="w-4 h-4" /> Enregistrer un paiement
              </button>
            )}
            <button
              onClick={handleEdit}
              className="btn btn-sm sm:btn-md btn-outline gap-2"
            >
              <Edit className="w-4 h-4" /> Modifier
            </button>
            <button className="btn btn-sm sm:btn-md btn-outline gap-2">
              <Printer className="w-4 h-4" /> Imprimer
            </button>
            <button className="btn btn-sm sm:btn-md btn-outline gap-2">
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Cartes info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Infos générales */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Informations
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">Fournisseur</span>
              <span className="font-semibold">{invoice.supplier_name}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">Commande</span>
              <span className="font-mono text-sm">
                {invoice.po_number || '-'}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">Date facture</span>
              <span>{formatDate(invoice.invoice_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Échéance</span>
              <span
                className={
                  invoice.is_overdue ? 'text-error font-semibold' : ''
                }
              >
                {formatDate(invoice.due_date)}
                {invoice.is_overdue && ' 🔴'}
              </span>
            </div>
          </div>
        </div>

        {/* Montants */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Montants
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">Montant HT</span>
              <span className="font-semibold">
                {formatAmount(invoice.amount)} FCFA
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">TVA</span>
              <span className="font-semibold">
                {formatAmount(invoice.tax_amount)} FCFA
              </span>
            </div>
            <div className="flex justify-between border-t-2 border-primary/20 pt-2">
              <span className="text-gray-700 font-semibold">Total TTC</span>
              <span className="font-bold text-primary text-lg">
                {formatAmount(invoice.total_amount)} FCFA
              </span>
            </div>
          </div>
        </div>

        {/* Paiement */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Paiement
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">Montant payé</span>
              <span className="font-semibold text-success">
                {formatAmount(invoice.amount_paid)} FCFA
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">Reste à payer</span>
              <span className="font-bold text-error text-lg">
                {formatAmount(invoice.remaining_amount)} FCFA
              </span>
            </div>
            <div className="pt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Progression</span>
                <span className="font-semibold">
                  {paidPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    paidPercentage >= 100
                      ? 'bg-success'
                      : paidPercentage >= 50
                      ? 'bg-warning'
                      : 'bg-error'
                  }`}
                  style={{ width: `${Math.min(paidPercentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-400 text-center mt-1">
                {invoice.paiement_status === 'paid'
                  ? '✅ Entièrement payée'
                  : invoice.paiement_status === 'partial'
                  ? '🔄 Partiellement payée'
                  : '⏳ En attente de paiement'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historique paiements */}
      {invoice.paiements && invoice.paiements.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" /> Historique des
              paiements
            </h3>
            <span className="text-sm text-gray-500">
              {invoice.paiements.length} paiement(s)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th>Référence</th>
                  <th>Date</th>
                  <th className="text-right">Montant</th>
                  <th>Méthode</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {invoice.paiements.map((payment, index) => (
                  <tr key={payment.id || index} className="hover:bg-gray-50">
                    <td className="font-mono text-sm">
                      {payment.reference || '-'}
                    </td>
                    <td>{formatDate(payment.payment_date)}</td>
                    <td className="text-right font-semibold">
                      {formatAmount(payment.amount)} FCFA
                    </td>
                    <td>
                      <span className="badge badge-ghost">
                        {payment.method}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-success gap-1">
                        <CheckCircle className="w-3 h-3" /> Confirmé
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td colSpan="2" className="text-right">
                    Total payé :
                  </td>
                  <td className="text-right text-success">
                    {formatAmount(invoice.amount_paid)} FCFA
                  </td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Notes */}
      {invoice.notes && (
        <div className="bg-white rounded-xl shadow-md p-5">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" /> Notes
          </h3>
          <p className="text-gray-600 text-sm whitespace-pre-wrap">
            {invoice.notes}
          </p>
        </div>
      )}

      {/* Actions rapides */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-400" /> Actions rapides
        </h3>
        <div className="flex flex-wrap gap-3">
          {invoice.paiement_status !== 'paid' && (
            <button
              onClick={handleRegisterPayment}
              className="btn btn-success gap-2"
            >
              <HandCoins className="w-4 h-4" /> Enregistrer un paiement
            </button>
          )}
          <button
            onClick={handleEdit}
            className="btn btn-outline gap-2"
          >
            <Edit className="w-4 h-4" /> Modifier la facture
          </button>
          <button className="btn btn-outline gap-2">
            <Printer className="w-4 h-4" /> Imprimer
          </button>
          <button className="btn btn-outline gap-2">
            <Download className="w-4 h-4" /> Télécharger PDF
          </button>
        </div>
      </div>

      {/* Bouton flottant mobile */}
      {invoice.paiement_status !== 'paid' && (
        <div className="fixed bottom-6 right-6 z-40 sm:hidden">
          <button
            onClick={handleRegisterPayment}
            className="btn btn-circle btn-lg bg-gradient-to-r from-success to-success/80 text-white border-none shadow-2xl"
            title="Enregistrer un paiement"
          >
            <HandCoins className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FactureFournisseurDetail;