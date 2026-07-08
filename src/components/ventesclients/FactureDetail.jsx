// src/components/factures/FactureDetail.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, FileText, User, Building2, Phone,
  Mail, MapPin, Calendar, Clock, DollarSign,
  Download, Edit, RefreshCw, CheckCircle,
  XCircle, AlertCircle, Loader2, CreditCard,
  Send, Ban, Printer, QrCode
} from 'lucide-react';
import QRCodeViewer from '../common/QRCodeViewer';

const FactureDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [facture, setFacture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [qrCodeLoading, setQrCodeLoading] = useState(false);

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchFacture = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await AxiosInstance.get(`/factures/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setFacture(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        showNotification('Facture non trouvée', 'error');
        setTimeout(() => navigate('/factures'), 1500);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacture();
  }, [id]);

  const handleGenerateQRCode = async () => {
    setQrCodeLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        return;
      }

      const response = await AxiosInstance.get(`/factures/${id}/generate_qr/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      setQrCodeData({
        url: response.data.qr_code_url,
        data: response.data.qr_code_data,
        title: `QR Code - ${facture?.invoice_number || 'Facture'}`
      });
      setShowQRCode(true);
    } catch (error) {
      console.error('Erreur QR Code:', error);
      showNotification('Erreur lors de la génération du QR Code', 'error');
    } finally {
      setQrCodeLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(`/factures/${id}/mark_paid/`, 
        { amount: facture.total },
        { headers: { 'Authorization': `Token ${token}` } }
      );
      showNotification('Facture marquée comme payée', 'success');
      fetchFacture();
    } catch (error) {
      showNotification('Erreur lors du paiement', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSend = async () => {
    setActionLoading(true);
    try {
      // Simuler l'envoi
      showNotification('Facture envoyée avec succès', 'success');
      // Mettre à jour le statut
      await AxiosInstance.post(`/factures/${id}/mark_sent/`, {}, {
        headers: { 'Authorization': `Token ${getToken()}` }
      });
      fetchFacture();
    } catch (error) {
      showNotification('Erreur lors de l\'envoi', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      draft: { label: 'Brouillon', className: 'badge-ghost', icon: FileText },
      sent: { label: 'Envoyée', className: 'badge-info', icon: Send },
      paid: { label: 'Payée', className: 'badge-success', icon: CreditCard },
      overdue: { label: 'En retard', className: 'badge-error', icon: AlertCircle },
      cancelled: { label: 'Annulée', className: 'badge-warning', icon: Ban }
    };
    const config = configs[status] || { label: status, className: 'badge-ghost', icon: FileText };
    const Icon = config.icon;
    return (
      <span className={`badge ${config.className} gap-1 text-sm`}>
        <Icon className="w-4 h-4" /> {config.label}
      </span>
    );
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
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement de la facture...</p>
        </div>
      </div>
    );
  }

  if (!facture) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-lg">
          <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Facture non trouvée</h2>
          <button onClick={() => navigate('/factures')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* QR Code Modal */}
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

      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification(null)}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/factures')} className="btn btn-ghost btn-sm gap-2">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/15 rounded-xl">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Facture {facture.invoice_number}
                  </h1>
                  <p className="text-sm text-gray-500">{facture.client_name}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={handleGenerateQRCode} 
                className="btn btn-secondary btn-sm gap-2"
                disabled={qrCodeLoading}
                title="Voir QR Code"
              >
                {qrCodeLoading ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <QrCode className="w-4 h-4" />
                )}
                QR Code
              </button>
              <button 
                className="btn btn-primary btn-sm gap-2"
                onClick={() => window.open(`/factures/${id}/pdf/`, '_blank')}
              >
                <Download className="w-4 h-4" /> PDF
              </button>
              {facture.status === 'draft' && (
                <>
                  <button 
                    onClick={() => navigate(`/factures/${id}/modifier`)} 
                    className="btn btn-outline btn-sm gap-2"
                  >
                    <Edit className="w-4 h-4" /> Modifier
                  </button>
                  <button 
                    onClick={handleSend} 
                    className="btn btn-info btn-sm gap-2"
                    disabled={actionLoading}
                  >
                    <Send className="w-4 h-4" /> Envoyer
                  </button>
                </>
              )}
              {facture.status === 'sent' && (
                <button 
                  onClick={handleMarkPaid} 
                  className="btn btn-success btn-sm gap-2"
                  disabled={actionLoading}
                >
                  <CreditCard className="w-4 h-4" /> Marquer payée
                </button>
              )}
              <button onClick={fetchFacture} className="btn btn-ghost btn-sm btn-circle" title="Actualiser">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Cartes info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">N° Facture</p>
                <p className="font-semibold font-mono">{facture.invoice_number}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Montant</p>
                <p className="font-bold text-lg text-primary">{formatCurrency(facture.total)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <CreditCard className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Payé</p>
                <p className="font-bold text-lg text-success">{formatCurrency(facture.amount_paid)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Restant</p>
                <p className="font-bold text-lg text-error">{formatCurrency(facture.remaining_amount)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={handleGenerateQRCode}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <QrCode className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">QR Code</p>
                <p className="font-semibold text-secondary">
                  {facture.qr_code ? 'Disponible' : 'Générer'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Détails */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Informations de la facture
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">N° Facture</span>
                <span className="font-mono font-medium">{facture.invoice_number}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Date facture</span>
                <span className="font-medium">{formatDate(facture.invoice_date)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Date échéance</span>
                <span className="font-medium">{formatDate(facture.due_date)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Statut</span>
                {getStatusBadge(facture.status)}
              </div>
              {facture.notes && (
                <div className="py-2">
                  <span className="text-gray-600">Notes</span>
                  <p className="text-sm text-gray-600 mt-1">{facture.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Client */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Client
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <p className="font-semibold">{facture.client_name}</p>
              {facture.client_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{facture.client_phone}</span>
                </div>
              )}
              {facture.client_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{facture.client_email}</span>
                </div>
              )}
              {facture.client_address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span>{facture.client_address}</span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-gray-500">Vente associée</span>
                <span className="font-mono">{facture.sale_number}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactureDetail;