// src/components/devis/DevisDetail.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, FileText, User, Package, Calendar,
  DollarSign, Download, Edit, RefreshCw,
  CheckCircle, XCircle, AlertCircle, Loader2,
  Phone, Mail, MapPin, Send, Ban, Clock,
  FileCheck, FileX, Printer, X
} from 'lucide-react';

const DevisDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [devis, setDevis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchDevis = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await AxiosInstance.get(`/devis/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      setDevis(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        showNotification('Devis non trouvé', 'error');
        setTimeout(() => navigate('/devis'), 1500);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDevis();
    }
  }, [id]);

  const handleUpdateStatus = async (status) => {
    if (!devis) return;
    
    setActionLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        return;
      }

      await AxiosInstance.post(
        `/devis/${id}/update_status/`,
        { status },
        { headers: { 'Authorization': `Token ${token}` } }
      );
      showNotification(`Statut mis à jour: ${status}`, 'success');
      await fetchDevis();
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      showNotification('Erreur lors de la mise à jour', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToSale = async () => {
    if (!devis) return;
    
    setActionLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        return;
      }

      const response = await AxiosInstance.post(
        `/devis/${id}/convert_to_sale/`,
        {},
        { headers: { 'Authorization': `Token ${token}` } }
      );
      
      showNotification('Devis converti en vente avec succès', 'success');
      
      // Rediriger vers la vente créée
      if (response.data.sale) {
        setTimeout(() => navigate(`/ventes/${response.data.sale.id}`), 1500);
      } else {
        await fetchDevis();
      }
    } catch (error) {
      console.error('Erreur conversion:', error);
      showNotification('Erreur lors de la conversion', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    window.open(`/devis/${id}/pdf/`, '_blank');
  };

  const getStatusBadge = (status) => {
    const configs = {
      draft: { label: 'Brouillon', className: 'badge-ghost', icon: FileText },
      sent: { label: 'Envoyé', className: 'badge-info', icon: Send },
      accepted: { label: 'Accepté', className: 'badge-success', icon: CheckCircle },
      refused: { label: 'Refusé', className: 'badge-error', icon: FileX },
      expired: { label: 'Expiré', className: 'badge-warning', icon: Clock },
      converted: { label: 'Converti en vente', className: 'badge-primary', icon: FileCheck }
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
    if (amount === null || amount === undefined) return '0 FCFA';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '0 FCFA';
    return `${numAmount.toLocaleString('fr-FR')} FCFA`;
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

  const isExpired = () => {
    if (!devis?.valid_until) return false;
    const validUntil = new Date(devis.valid_until);
    const today = new Date();
    return validUntil < today && devis.status !== 'accepted' && devis.status !== 'converted';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement du devis...</p>
        </div>
      </div>
    );
  }

  if (!devis) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-lg">
          <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Devis non trouvé</h2>
          <p className="text-gray-500 mb-6">Le devis que vous recherchez n'existe pas ou a été supprimé.</p>
          <button onClick={() => navigate('/devis')} className="btn btn-primary">
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
        <div className="fixed top-20 right-4 z-50 animate-slideDown max-w-md w-full">
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
              <button onClick={() => navigate('/devis')} className="btn btn-ghost btn-sm gap-2">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/15 rounded-xl">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Devis {devis.devis_number}
                  </h1>
                  <p className="text-sm text-gray-500">{devis.client_name}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={handleDownloadPdf} className="btn btn-primary btn-sm gap-2">
                <Download className="w-4 h-4" /> PDF
              </button>
              
              {devis.status === 'draft' && (
                <>
                  <button onClick={() => navigate(`/devis/${id}/modifier`)} className="btn btn-outline btn-sm gap-2">
                    <Edit className="w-4 h-4" /> Modifier
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus('sent')} 
                    className="btn btn-info btn-sm gap-2" 
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Envoyer
                  </button>
                </>
              )}

              {devis.status === 'sent' && (
                <>
                  <button 
                    onClick={() => handleUpdateStatus('accepted')} 
                    className="btn btn-success btn-sm gap-2" 
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Accepter
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus('refused')} 
                    className="btn btn-error btn-sm gap-2" 
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileX className="w-4 h-4" />}
                    Refuser
                  </button>
                </>
              )}

              {devis.status === 'accepted' && (
                <button 
                  onClick={handleConvertToSale} 
                  className="btn btn-success btn-sm gap-2" 
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                  Convertir en vente
                </button>
              )}

              <button onClick={fetchDevis} className="btn btn-ghost btn-sm btn-circle" title="Actualiser">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
                <p className="text-xs text-gray-500">N° Devis</p>
                <p className="font-semibold font-mono">{devis.devis_number}</p>
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
                <p className="font-bold text-lg text-primary">{formatCurrency(devis.total)}</p>
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
                {getStatusBadge(devis.status)}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Calendar className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Valable jusqu'au</p>
                <p className="font-semibold">{formatDate(devis.valid_until)}</p>
                {isExpired() && (
                  <p className="text-xs text-error">⚠️ Expiré</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Détails */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Tableau des produits - 2/3 */}
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
                  {devis.lignes && devis.lignes.length > 0 ? (
                    devis.lignes.map((line, index) => (
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                        <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        Aucun produit dans ce devis
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan="4" className="px-4 py-3 text-right font-semibold">Sous-total</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(devis.subtotal)}</td>
                  </tr>
                  {(devis.discount_amount || 0) > 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-right text-gray-600">Remise</td>
                      <td className="px-4 py-3 text-right text-error">-{formatCurrency(devis.discount_amount)}</td>
                    </tr>
                  )}
                  {(devis.tax_amount || 0) > 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-right text-gray-600">TVA ({devis.tax_rate || 0}%)</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(devis.tax_amount)}</td>
                    </tr>
                  )}
                  {(devis.shipping_fee || 0) > 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-right text-gray-600">Frais livraison</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(devis.shipping_fee)}</td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-primary bg-primary/5">
                    <td colSpan="4" className="px-4 py-4 text-right font-bold text-lg">Total TTC</td>
                    <td className="px-4 py-4 text-right font-bold text-xl text-primary">{formatCurrency(devis.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Panneau droit - 1/3 */}
          <div className="space-y-6">
            {/* Client */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Client
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <p className="font-semibold text-base">{devis.client_name || 'Client inconnu'}</p>
                {devis.client_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{devis.client_phone}</span>
                  </div>
                )}
                {devis.client_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{devis.client_email}</span>
                  </div>
                )}
                {devis.client_address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="line-clamp-2">{devis.client_address}</span>
                  </div>
                )}
                {devis.client && devis.client.id && (
                  <button 
                    onClick={() => navigate(`/clients/${devis.client.id}`)} 
                    className="btn btn-ghost btn-sm w-full mt-2 gap-2"
                  >
                    <User className="w-4 h-4" /> Voir le client
                  </button>
                )}
              </div>
            </div>

            {/* Informations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Informations
                </h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date de création</span>
                  <span className="font-medium">{formatDate(devis.devis_date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Valable jusqu'au</span>
                  <span className="font-medium">{formatDate(devis.valid_until)}</span>
                </div>
                {devis.sale && (
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="text-gray-500">Vente associée</span>
                    <span className="font-medium text-primary">
                      <button 
                        onClick={() => navigate(`/ventes/${devis.sale.id}`)}
                        className="link link-primary"
                      >
                        {devis.sale.invoice_number}
                      </button>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {devis.notes && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Notes
                  </h3>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 whitespace-pre-line">{devis.notes}</p>
                </div>
              </div>
            )}

            {/* QR Code */}
            {devis.qr_code_url && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="2" width="7" height="7" rx="1"/>
                      <rect x="15" y="2" width="7" height="7" rx="1"/>
                      <rect x="2" y="15" width="7" height="7" rx="1"/>
                      <rect x="15" y="15" width="3" height="3" rx="1"/>
                      <rect x="19" y="15" width="3" height="3" rx="1"/>
                      <rect x="15" y="19" width="3" height="3" rx="1"/>
                    </svg>
                    QR Code
                  </h3>
                </div>
                <div className="p-4 flex justify-center">
                  <img 
                    src={devis.qr_code_url} 
                    alt="QR Code du devis" 
                    className="w-32 h-32 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<p class="text-gray-400 text-sm">QR Code non disponible</p>';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevisDetail;