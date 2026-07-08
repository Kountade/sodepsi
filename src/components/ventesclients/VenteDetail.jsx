// src/components/ventes/VenteDetail.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, ShoppingCart, User, Package, CreditCard,
  Truck, Calendar, DollarSign, FileText, Download,
  Edit, RefreshCw, CheckCircle, XCircle, AlertCircle,
  Loader2, Phone, Mail, MapPin, Printer,
  Send, Ban, Clock, Users, Building2
} from 'lucide-react';

const VenteDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [vente, setVente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchVente = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/sales/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setVente(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        showNotification('Vente non trouvée', 'error');
        setTimeout(() => navigate('/ventes'), 1500);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVente();
  }, [id]);

  const handleUpdateStatus = async (status) => {
    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(`/sales/${id}/update_status/`, 
        { status },
        { headers: { 'Authorization': `Token ${token}` } }
      );
      showNotification(`Statut mis à jour: ${status}`, 'success');
      fetchVente();
    } catch (error) {
      showNotification('Erreur lors de la mise à jour', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddPayment = async () => {
    // À implémenter
  };

  const handleDownloadPdf = () => {
    window.open(`/sales/${id}/pdf/`, '_blank');
  };

  const getStatusBadge = (status) => {
    const configs = {
      draft: { label: 'Brouillon', className: 'badge-ghost', icon: FileText },
      confirmed: { label: 'Confirmée', className: 'badge-info', icon: CheckCircle },
      paid: { label: 'Payée', className: 'badge-success', icon: CreditCard },
      delivered: { label: 'Livrée', className: 'badge-primary', icon: Truck },
      cancelled: { label: 'Annulée', className: 'badge-error', icon: Ban },
      returned: { label: 'Retournée', className: 'badge-warning', icon: AlertCircle }
    };
    const config = configs[status] || { label: status, className: 'badge-ghost', icon: FileText };
    const Icon = config.icon;
    return (
      <span className={`badge ${config.className} gap-1 text-sm`}>
        <Icon className="w-4 h-4" /> {config.label}
      </span>
    );
  };

  const getPaymentBadge = (status) => {
    const configs = {
      paid: { label: 'Payé', className: 'badge-success' },
      partial: { label: 'Partiel', className: 'badge-warning' },
      pending: { label: 'En attente', className: 'badge-error' }
    };
    const config = configs[status] || { label: status, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement de la vente...</p>
        </div>
      </div>
    );
  }

  if (!vente) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-lg">
          <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Vente non trouvée</h2>
          <button onClick={() => navigate('/ventes')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <button onClick={() => navigate('/ventes')} className="btn btn-ghost btn-sm gap-2">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/15 rounded-xl">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Vente {vente.invoice_number}
                  </h1>
                  <p className="text-sm text-gray-500">{vente.client_name}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={handleDownloadPdf} className="btn btn-primary btn-sm gap-2">
                <Download className="w-4 h-4" /> PDF
              </button>
              {vente.status === 'draft' && (
                <>
                  <button onClick={() => navigate(`/ventes/${id}/modifier`)} className="btn btn-outline btn-sm gap-2">
                    <Edit className="w-4 h-4" /> Modifier
                  </button>
                  <button onClick={() => handleUpdateStatus('confirmed')} className="btn btn-success btn-sm gap-2" disabled={actionLoading}>
                    <CheckCircle className="w-4 h-4" /> Confirmer
                  </button>
                </>
              )}
              {vente.status === 'confirmed' && (
                <button onClick={() => handleUpdateStatus('paid')} className="btn btn-success btn-sm gap-2" disabled={actionLoading}>
                  <CreditCard className="w-4 h-4" /> Marquer payée
                </button>
              )}
              {vente.status === 'confirmed' && (
                <button onClick={() => navigate(`/ventes/${id}/paiement`)} className="btn btn-info btn-sm gap-2">
                  <DollarSign className="w-4 h-4" /> Enregistrer paiement
                </button>
              )}
              {vente.status !== 'cancelled' && vente.status !== 'paid' && (
                <button onClick={() => handleUpdateStatus('cancelled')} className="btn btn-error btn-sm gap-2" disabled={actionLoading}>
                  <Ban className="w-4 h-4" /> Annuler
                </button>
              )}
              <button onClick={fetchVente} className="btn btn-ghost btn-sm btn-circle" title="Actualiser">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Cartes info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">N° Facture</p>
                <p className="font-semibold font-mono">{vente.invoice_number}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="font-bold text-lg text-primary">{formatCurrency(vente.total)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <Clock className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Statut</p>
                {getStatusBadge(vente.status)}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <CreditCard className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Paiement</p>
                {getPaymentBadge(vente.payment_status)}
                <p className="text-xs text-gray-400">Dû: {formatCurrency(vente.amount_due)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Détails */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" /> Produits
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-semibold">Produit</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Qté</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Prix unit.</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Remise</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {vente.lines?.map((line, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{line.product_name}</p>
                        <p className="text-xs text-gray-400">{line.product_code}</p>
                      </td>
                      <td className="px-4 py-3 text-center">{line.quantity}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(line.unit_price)}</td>
                      <td className="px-4 py-3 text-right text-error">{formatCurrency(line.discount)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(line.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="4" className="px-4 py-3 text-right font-semibold">Sous-total</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(vente.subtotal)}</td>
                  </tr>
                  {vente.discount_amount > 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-right">Remise</td>
                      <td className="px-4 py-3 text-right text-error">-{formatCurrency(vente.discount_amount)}</td>
                    </tr>
                  )}
                  {vente.tax_amount > 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-right">TVA ({vente.tax_rate}%)</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(vente.tax_amount)}</td>
                    </tr>
                  )}
                  {vente.shipping_fee > 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-right">Frais livraison</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(vente.shipping_fee)}</td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-primary">
                    <td colSpan="4" className="px-4 py-4 text-right font-bold text-lg">Total TTC</td>
                    <td className="px-4 py-4 text-right font-bold text-xl text-primary">{formatCurrency(vente.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            {/* Client */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Client
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <p className="font-semibold">{vente.client_name}</p>
                {vente.client_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{vente.client_phone}</span>
                  </div>
                )}
                {vente.client_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{vente.client_email}</span>
                  </div>
                )}
                {vente.client_address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>{vente.client_address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Paiements */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" /> Paiements
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Montant payé</span>
                    <span className="font-semibold text-success">{formatCurrency(vente.amount_paid)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Montant dû</span>
                    <span className="font-semibold text-error">{formatCurrency(vente.amount_due)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="text-gray-500">Méthode</span>
                    <span className="font-medium">{vente.payment_method || 'Non défini'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Échéance</span>
                    <span className="font-medium">{formatDate(vente.payment_due_date)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {vente.notes && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Notes
                  </h3>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 whitespace-pre-line">{vente.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenteDetail;