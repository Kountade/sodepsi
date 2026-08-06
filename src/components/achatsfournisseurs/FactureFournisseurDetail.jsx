// src/components/achats/FactureFournisseurDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Calendar, DollarSign, Clock, FileText,
  CreditCard, AlertTriangle, CheckCircle, X,
  Printer, Download, Edit, Save, FileCheck
} from 'lucide-react';

const FactureFournisseurDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    method: 'virement',
    payment_reference: '',
    notes: ''
  });
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/supplier-invoices/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setInvoice(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handleRegisterPayment = async () => {
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      showNotification('Veuillez saisir un montant valide', 'error');
      return;
    }

    if (parseFloat(paymentData.amount) > invoice.remaining_amount) {
      showNotification('Le montant dépasse le solde restant', 'error');
      return;
    }

    try {
      const token = getToken();
      await AxiosInstance.post(
        `/supplier-invoices/${id}/register_payment/`,
        {
          amount: parseFloat(paymentData.amount),
          payment_date: paymentData.payment_date,
          method: paymentData.method,
          payment_reference: paymentData.payment_reference,
          notes: paymentData.notes
        },
        { headers: { 'Authorization': `Token ${token}` } }
      );
      showNotification('Paiement enregistré avec succès', 'success');
      setShowPaymentModal(false);
      setPaymentData({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        method: 'virement',
        payment_reference: '',
        notes: ''
      });
      fetchInvoice();
    } catch (error) {
      console.error('Erreur:', error);
      showNotification(error.response?.data?.message || 'Erreur lors du paiement', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Facture non trouvée</p>
          <button onClick={() => navigate('/factures-fournisseurs')} className="btn btn-primary btn-sm mt-3">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'received': 'info',
      'verified': 'success',
      'paid': 'success',
      'partial': 'warning',
      'disputed': 'error'
    };
    return <span className={`badge badge-${statusMap[status] || 'ghost'}`}>{status}</span>;
  };

  const getPaiementStatusBadge = (status) => {
    const statusMap = {
      'unpaid': 'error',
      'partial': 'warning',
      'paid': 'success',
      'overdue': 'error'
    };
    return <span className={`badge badge-${statusMap[status] || 'ghost'}`}>{status}</span>;
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button onClick={() => navigate('/factures-fournisseurs')} className="btn btn-ghost btn-sm gap-2 mb-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Facture {invoice.invoice_number}</h1>
            <div className="flex gap-2">
              {getStatusBadge(invoice.status)}
              {getPaiementStatusBadge(invoice.paiement_status)}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.paiement_status !== 'paid' && (
            <button 
              onClick={() => setShowPaymentModal(true)} 
              className="btn bg-gradient-to-r from-success to-success/80 text-white border-none shadow-lg gap-2"
            >
              <CreditCard className="w-4 h-4" /> Enregistrer un paiement
            </button>
          )}
          <button className="btn btn-outline gap-2">
            <Printer className="w-4 h-4" /> Imprimer
          </button>
          <button className="btn btn-outline gap-2">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Informations principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">INFORMATIONS GÉNÉRALES</h3>
          <div className="space-y-2">
            <p><span className="text-gray-500">Fournisseur:</span> <span className="font-semibold">{invoice.supplier_name}</span></p>
            <p><span className="text-gray-500">Commande:</span> <span className="font-mono">{invoice.po_number || '-'}</span></p>
            <p><span className="text-gray-500">Date facture:</span> <span>{new Date(invoice.invoice_date).toLocaleDateString()}</span></p>
            <p><span className="text-gray-500">Échéance:</span> <span className={invoice.is_overdue ? 'text-error font-semibold' : ''}>
              {new Date(invoice.due_date).toLocaleDateString()}
              {invoice.is_overdue && ' 🔴 En retard'}
            </span></p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">MONTANTS</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Montant HT</span>
              <span className="font-semibold">{invoice.amount?.toLocaleString()} F</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">TVA</span>
              <span className="font-semibold">{invoice.tax_amount?.toLocaleString()} F</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-500 font-semibold">Total TTC</span>
              <span className="font-bold text-primary text-lg">{invoice.total_amount?.toLocaleString()} F</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">STATUT DE PAIEMENT</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Montant payé</span>
              <span className="font-semibold text-success">{invoice.amount_paid?.toLocaleString()} F</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Reste à payer</span>
              <span className="font-bold text-error text-lg">{invoice.remaining_amount?.toLocaleString()} F</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${((invoice.total_amount - invoice.remaining_amount) / invoice.total_amount * 100) || 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              {((invoice.total_amount - invoice.remaining_amount) / invoice.total_amount * 100 || 0).toFixed(1)}% payé
            </p>
          </div>
        </div>
      </div>

      {/* Historique des paiements */}
      {invoice.paiements && invoice.paiements.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="w-5 h-5" /> Historique des paiements
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Méthode</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {invoice.paiements.map((payment) => (
                  <tr key={payment.id}>
                    <td className="font-mono text-sm">{payment.reference}</td>
                    <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                    <td className="font-semibold">{payment.amount?.toLocaleString()} F</td>
                    <td>{payment.method}</td>
                    <td><span className="badge badge-success">Confirmé</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notes */}
      {invoice.notes && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold mb-2">Notes</h3>
          <p className="text-gray-600">{invoice.notes}</p>
        </div>
      )}

      {/* Modal de paiement */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-modalIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" /> Enregistrer un paiement
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Montant à payer *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">F</span>
                  <input
                    type="number"
                    className="input input-bordered w-full pl-8"
                    placeholder="Montant"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Reste à payer: {invoice.remaining_amount?.toLocaleString()} F</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Date de paiement</label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={paymentData.payment_date}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Méthode de paiement</label>
                <select
                  className="select select-bordered w-full"
                  value={paymentData.method}
                  onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                >
                  <option value="especes">Espèces</option>
                  <option value="cheque">Chèque</option>
                  <option value="virement">Virement bancaire</option>
                  <option value="transfert">Transfert</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Référence de paiement</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Référence..."
                  value={paymentData.payment_reference}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_reference: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Notes</label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows="2"
                  placeholder="Notes..."
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPaymentModal(false)} className="btn btn-ghost flex-1">
                Annuler
              </button>
              <button onClick={handleRegisterPayment} className="btn bg-gradient-to-r from-success to-success/80 text-white flex-1 gap-2">
                <Save className="w-4 h-4" /> Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FactureFournisseurDetail;