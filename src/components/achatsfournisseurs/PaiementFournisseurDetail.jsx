// src/components/achats/PaiementFournisseurDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, CreditCard, Calendar, DollarSign, Building2, 
  CheckCircle, X, Clock, Receipt, Banknote, Printer,
  QrCode, FileText, AlertCircle, RefreshCw, Download
} from 'lucide-react';

const PaiementFournisseurDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  useEffect(() => {
    const fetchPayment = async () => {
      setLoading(true);
      try {
        const response = await AxiosInstance.get(`/fournisseur-paiements/${id}/`);
        console.log('📦 Paiement:', response.data);
        setPayment(response.data);
      } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de chargement du paiement', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPayment();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    showNotification('Téléchargement en cours...', 'success');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { label: 'En attente', color: 'warning', icon: <Clock className="w-4 h-4" /> },
      'confirmed': { label: 'Confirmé', color: 'success', icon: <CheckCircle className="w-4 h-4" /> },
      'cancelled': { label: 'Annulé', color: 'error', icon: <X className="w-4 h-4" /> }
    };
    const s = statusMap[status] || { label: status, color: 'ghost', icon: null };
    return (
      <span className={`badge badge-${s.color} gap-1 text-sm px-3 py-1.5`}>
        {s.icon} {s.label}
      </span>
    );
  };

  const getMethodLabel = (method) => {
    const methods = {
      'especes': '💵 Espèces',
      'cheque': '📄 Chèque',
      'virement': '🏦 Virement bancaire',
      'transfert': '🔄 Transfert',
      'mobile_money': '📱 Mobile Money',
      'autre': '🔧 Autre'
    };
    return methods[method] || method;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement du paiement...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Paiement non trouvé</p>
          <button onClick={() => navigate('/paiements-fournisseurs')} className="btn btn-primary btn-sm mt-3">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </button>
        </div>
      </div>
    );
  }

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
          <button onClick={() => navigate('/paiements-fournisseurs')} className="btn btn-ghost btn-sm gap-2 mb-2">
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
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn btn-outline btn-sm gap-2">
            <Printer className="w-4 h-4" /> Imprimer
          </button>
          <button onClick={handleDownload} className="btn btn-outline btn-sm gap-2">
            <Download className="w-4 h-4" /> Télécharger
          </button>
        </div>
      </div>

      {/* Carte principale */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {/* En-tête coloré */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Référence</p>
              <p className="font-mono text-lg font-bold">{payment.reference}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Montant</p>
              <p className="text-2xl font-bold text-primary">{payment.amount?.toLocaleString()} FCFA</p>
            </div>
          </div>
        </div>

        {/* Grille d'informations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Building2 className="w-4 h-4" />
              <p className="text-sm">Fournisseur</p>
            </div>
            <p className="font-semibold text-lg">{payment.supplier_name}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Receipt className="w-4 h-4" />
              <p className="text-sm">Facture</p>
            </div>
            <p className="font-mono font-semibold">{payment.invoice_number || '-'}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Calendar className="w-4 h-4" />
              <p className="text-sm">Date de paiement</p>
            </div>
            <p className="font-semibold">{new Date(payment.payment_date).toLocaleDateString()}</p>
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
            <p className="text-sm">{new Date(payment.created_at).toLocaleString()}</p>
          </div>
        </div>

        {/* Destinations */}
        {(payment.caisse_destination_id || payment.compte_destination_id) && (
          <div className="px-6 pb-4">
            <h3 className="font-semibold text-gray-700 mb-2">Destination du paiement</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {payment.caisse_destination_id && (
                <div className="bg-success/10 rounded-lg p-3 border border-success/20">
                  <p className="text-xs text-gray-500">Caisse</p>
                  <p className="font-semibold">{payment.caisse_destination_nom || 'Caisse'}</p>
                </div>
              )}
              {payment.compte_destination_id && (
                <div className="bg-info/10 rounded-lg p-3 border border-info/20">
                  <p className="text-xs text-gray-500">Compte bancaire</p>
                  <p className="font-semibold">{payment.compte_destination_nom || 'Compte'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mouvement de trésorerie */}
        {payment.mouvement_reference && (
          <div className="px-6 pb-4">
            <h3 className="font-semibold text-gray-700 mb-2">Mouvement de trésorerie</h3>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-sm">
                <span className="text-gray-500">Référence:</span>{' '}
                <span className="font-mono font-semibold">{payment.mouvement_reference}</span>
              </p>
            </div>
          </div>
        )}

        {/* Notes */}
        {payment.notes && (
          <div className="px-6 pb-6">
            <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-600">{payment.notes}</p>
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