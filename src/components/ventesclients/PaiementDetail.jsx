// src/components/ventesclients/PaiementDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, CreditCard, Calendar, User, FileText, 
  DollarSign, Phone, Mail, Loader2, AlertCircle,
  Download, Printer, CheckCircle, Clock, Building2,
  QrCode, Eye, Trash2, Edit
} from 'lucide-react';
import QRCodeViewer from '../common/QRCodeViewer';

const PaiementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paiement, setPaiement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchPaiement = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        setError('Session expirée');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await AxiosInstance.get(`/payments/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setPaiement(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 401) {
        setError('Session expirée');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        setError('Paiement non trouvé');
      } else {
        setError('Erreur lors du chargement du paiement');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPaiement();
    }
  }, [id]);

  const handleDownloadPdf = () => {
    if (!paiement) return;
    setDownloading(true);
    try {
      // Rediriger vers la page de génération PDF
      navigate(`/paiements/${id}/pdf`);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      showNotification('Erreur lors du téléchargement du PDF', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 FCFA';
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  const getMethodBadge = (method) => {
    const configs = {
      cash: { label: 'Espèces', className: 'badge-success', icon: <DollarSign className="w-3 h-3" /> },
      card: { label: 'Carte bancaire', className: 'badge-info', icon: <CreditCard className="w-3 h-3" /> },
      check: { label: 'Chèque', className: 'badge-warning', icon: <FileText className="w-3 h-3" /> },
      transfer: { label: 'Virement', className: 'badge-primary', icon: <Building2 className="w-3 h-3" /> },
      mobile_money: { label: 'Mobile Money', className: 'badge-secondary', icon: <Phone className="w-3 h-3" /> },
      credit: { label: 'Crédit', className: 'badge-error', icon: <CreditCard className="w-3 h-3" /> }
    };
    const config = configs[method] || { label: method, className: 'badge-ghost', icon: null };
    return (
      <span className={`badge ${config.className} gap-1`}>
        {config.icon} {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement du paiement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Erreur</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={() => navigate('/paiements')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  if (!paiement) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-20 h-20 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Paiement non trouvé</h2>
          <button onClick={() => navigate('/paiements')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

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
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification({ ...notification, show: false })}>
              <span className="text-xl">×</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal QR Code */}
      {showQRCode && paiement.qr_code_url && (
        <QRCodeViewer
          qrCodeUrl={paiement.qr_code_url}
          qrCodeData={paiement.qr_code_data}
          title={`QR Code - Paiement #${paiement.id}`}
          onClose={() => setShowQRCode(false)}
        />
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/paiements')}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Paiement #{paiement.id}
                </h1>
              </div>
              <p className="text-sm text-gray-500 ml-1">
                {formatDate(paiement.payment_date)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={fetchPaiement}
              className="btn btn-sm btn-outline gap-2"
            >
              <Loader2 className="w-4 h-4" /> Actualiser
            </button>
            {paiement.qr_code_url && (
              <button 
                onClick={() => setShowQRCode(true)}
                className="btn btn-sm btn-outline gap-2 text-primary"
              >
                <QrCode className="w-4 h-4" /> QR Code
              </button>
            )}
            <button 
              onClick={handlePrint}
              className="btn btn-sm btn-outline gap-2"
            >
              <Printer className="w-4 h-4" /> Imprimer
            </button>
            <button 
              onClick={handleDownloadPdf}
              className={`btn btn-sm gap-2 ${downloading ? 'btn-primary loading' : 'btn-primary'}`}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Télécharger PDF
            </button>
          </div>
        </div>
      </div>

      {/* Grille d'informations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations générales */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Informations du paiement
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-medium">ID Paiement</label>
                <p className="text-sm font-semibold text-gray-800">#{paiement.id}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Date</label>
                <p className="text-sm font-semibold text-gray-800">{formatDate(paiement.payment_date)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Montant</label>
                <p className="text-lg font-bold text-primary">{formatCurrency(paiement.amount)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Méthode</label>
                <div className="mt-1">{getMethodBadge(paiement.method)}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Référence</label>
                <p className="text-sm font-semibold text-gray-800">{paiement.reference || 'Non spécifiée'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Facture</label>
                <p className="text-sm font-semibold text-primary">{paiement.facture_number || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 font-medium">Notes</label>
                <p className="text-sm text-gray-600">{paiement.notes || 'Aucune note'}</p>
              </div>
            </div>
          </div>

          {/* Détails de la facture */}
          {paiement.facture && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Détails de la facture
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-medium">N° Facture</label>
                  <p className="text-sm font-semibold text-primary cursor-pointer hover:underline" 
                     onClick={() => navigate(`/factures/${paiement.facture}`)}>
                    {paiement.facture_number || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Total Facture</label>
                  <p className="text-sm font-semibold text-gray-800">{formatCurrency(paiement.facture_total)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Reste à payer</label>
                  <p className="text-sm font-semibold text-error">{formatCurrency(paiement.remaining_amount)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Informations client */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Client
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Nom</label>
                <p className="text-sm font-semibold text-gray-800">{paiement.client_name || '-'}</p>
              </div>
              {paiement.client_phone && (
                <div>
                  <label className="text-xs text-gray-500 font-medium">Téléphone</label>
                  <p className="text-sm flex items-center gap-2">
                    <Phone className="w-3 h-3 text-gray-400" />
                    {paiement.client_phone}
                  </p>
                </div>
              )}
              {paiement.client_email && (
                <div>
                  <label className="text-xs text-gray-500 font-medium">Email</label>
                  <p className="text-sm flex items-center gap-2">
                    <Mail className="w-3 h-3 text-gray-400" />
                    {paiement.client_email}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Reçu par */}
          {paiement.received_by_name && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Reçu par
              </h2>
              <p className="text-sm font-semibold text-gray-800">{paiement.received_by_name}</p>
            </div>
          )}

          {/* Actions rapides */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Actions</h2>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => navigate(`/factures/${paiement.facture}`)}
                className="btn btn-outline btn-sm w-full gap-2 justify-start"
                disabled={!paiement.facture}
              >
                <Eye className="w-4 h-4" /> Voir la facture
              </button>
              <button 
                onClick={handleDownloadPdf}
                className="btn btn-primary btn-sm w-full gap-2 justify-start"
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Télécharger le reçu
              </button>
              {paiement.qr_code_url && (
                <button 
                  onClick={() => setShowQRCode(true)}
                  className="btn btn-outline btn-sm w-full gap-2 justify-start text-primary"
                >
                  <QrCode className="w-4 h-4" /> Voir QR Code
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pied de page */}
      <div className="text-center text-xs text-gray-400 py-4">
        Document généré automatiquement - {new Date().toLocaleString('fr-FR')}
      </div>
    </div>
  );
};

export default PaiementDetail;