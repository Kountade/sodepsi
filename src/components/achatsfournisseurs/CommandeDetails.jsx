// src/components/achats/CommandeDetails.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, ShoppingCart, Truck, Calendar, DollarSign,
  CheckCircle, XCircle, RefreshCw, FileText, Package,
  Printer, Download, Send, AlertCircle, Building2,
  Clock, User, Mail, Phone, MapPin, CreditCard, TrendingUp
} from 'lucide-react';

const CommandeDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchOrderDetails = useCallback(async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/purchase-orders/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setOrder(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée, veuillez vous reconnecter', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        showNotification('Commande non trouvée', 'error');
        setTimeout(() => navigate('/commandes-fournisseurs'), 1500);
      } else {
        showNotification('Erreur de chargement des données', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const approveOrder = async () => {
    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(`/purchase-orders/${id}/approve/`, 
        { approved: true }, 
        { headers: { Authorization: `Token ${token}` } }
      );
      
      showNotification('Commande approuvée avec succès', 'success');
      await fetchOrderDetails();
      
    } catch (error) {
      console.error('Erreur approbation:', error);
      showNotification(error.response?.data?.message || 'Erreur lors de l\'approbation', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const cancelOrder = async () => {
    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(`/purchase-orders/${id}/cancel/`, 
        {}, 
        { headers: { Authorization: `Token ${token}` } }
      );
      
      showNotification('Commande annulée avec succès', 'success');
      await fetchOrderDetails();
      
    } catch (error) {
      console.error('Erreur annulation:', error);
      showNotification(error.response?.data?.message || 'Erreur lors de l\'annulation', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      draft: { label: 'Brouillon', color: 'info', icon: FileText },
      sent: { label: 'Envoyé', color: 'primary', icon: Send },
      confirmed: { label: 'Confirmé', color: 'success', icon: CheckCircle },
      partial: { label: 'Partiellement reçu', color: 'warning', icon: Package },
      received: { label: 'Reçu', color: 'success', icon: Truck },
      cancelled: { label: 'Annulé', color: 'error', icon: XCircle }
    };
    return configs[status] || { label: status, color: 'ghost', icon: Package };
  };

  const statusConfig = order ? getStatusConfig(order.status) : { label: '', color: 'ghost', icon: Package };
  const StatusIcon = statusConfig.icon;

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 FCFA';
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-medium text-gray-500">Chargement de la commande...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Commande non trouvée</h2>
          <p className="text-gray-500 mb-6">La commande que vous recherchez n'existe pas ou a été supprimée.</p>
          <button onClick={() => navigate('/commandes-fournisseurs')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl min-w-[300px]`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification(null)}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header avec gradient */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Navigation et titre */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/commandes-fournisseurs')} 
                className="btn btn-ghost btn-sm gap-2"
                disabled={actionLoading}
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/15 rounded-xl">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Commande {order.po_number}</h1>
                  <p className="text-sm text-gray-500">{order.supplier_name}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {order.status === 'draft' && (
                <>
                  <button 
                    onClick={approveOrder} 
                    className="btn btn-success btn-sm gap-2"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Approuver
                  </button>
                  <button 
                    onClick={cancelOrder} 
                    className="btn btn-error btn-sm gap-2"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    Annuler
                  </button>
                </>
              )}
              <button 
                onClick={fetchOrderDetails} 
                className="btn btn-ghost btn-sm btn-circle"
                disabled={actionLoading}
                title="Actualiser"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button className="btn btn-ghost btn-sm btn-circle" title="Imprimer">
                <Printer className="w-4 h-4" />
              </button>
              <button className="btn btn-ghost btn-sm btn-circle" title="Télécharger">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Cartes de statut */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Date commande</p>
                <p className="font-semibold">{formatDate(order.order_date)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Truck className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Livraison prévue</p>
                <p className="font-semibold">{formatDate(order.expected_delivery_date)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Montant total</p>
                <p className="font-bold text-lg text-primary">{formatCurrency(order.total)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-${statusConfig.color}/10 rounded-lg`}>
                <StatusIcon className={`w-5 h-5 text-${statusConfig.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Statut</p>
                <span className={`badge badge-${statusConfig.color}`}>{statusConfig.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="border-b border-gray-100">
            <nav className="flex gap-1 px-4" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === 'details'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4" />
                Détails
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === 'products'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="w-4 h-4" />
                Produits
              </button>
              <button
                onClick={() => setActiveTab('supplier')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === 'supplier'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Fournisseur
              </button>
            </nav>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Informations générales</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">N° commande</span>
                        <span className="font-mono font-medium">{order.po_number}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Référence fournisseur</span>
                        <span className="font-medium">{order.supplier_reference || '—'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Date de création</span>
                        <span className="font-medium">{formatDateTime(order.created_at)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Créé par</span>
                        <span className="font-medium">{order.created_by_name || '—'}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Livraison</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Date livraison prévue</span>
                        <span className="font-medium">{formatDate(order.expected_delivery_date)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Date livraison réelle</span>
                        <span className="font-medium">{formatDate(order.actual_delivery_date) || 'Non livrée'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">N° de suivi</span>
                        <span className="font-medium">{order.tracking_number || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {(order.notes || order.internal_notes) && (
                  <div className="border-t border-gray-100 pt-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Notes</h4>
                    {order.notes && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">{order.notes}</p>
                      </div>
                    )}
                    {order.internal_notes && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 italic">{order.internal_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'products' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Produit</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Quantité</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Reçue</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Prix unitaire</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Remise</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.lines && order.lines.length > 0 ? (
                      order.lines.map((line, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800">{line.product_name}</p>
                            <p className="text-xs text-gray-400">{line.product_code}</p>
                          </td>
                          <td className="px-4 py-3 text-center font-medium">{line.quantity}</td>
                          <td className="px-4 py-3 text-center">
                            {line.quantity_received > 0 ? (
                              <span className="text-success font-medium">{line.quantity_received}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">{formatCurrency(line.unit_price)}</td>
                          <td className="px-4 py-3 text-right text-error">{formatCurrency(line.discount)}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatCurrency(line.quantity * line.unit_price - line.discount)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-12 text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          Aucun produit dans cette commande
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr className="border-t border-gray-200">
                      <td colSpan="5" className="px-4 py-3 text-right font-semibold">Sous-total</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(order.subtotal)}</td>
                    </tr>
                    {order.discount_amount > 0 && (
                      <tr>
                        <td colSpan="5" className="px-4 py-3 text-right">Remise</td>
                        <td className="px-4 py-3 text-right text-error">-{formatCurrency(order.discount_amount)}</td>
                      </tr>
                    )}
                    {order.tax_amount > 0 && (
                      <tr>
                        <td colSpan="5" className="px-4 py-3 text-right">TVA ({order.tax_rate}%)</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(order.tax_amount)}</td>
                      </tr>
                    )}
                    {order.shipping_cost > 0 && (
                      <tr>
                        <td colSpan="5" className="px-4 py-3 text-right">Frais de livraison</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(order.shipping_cost)}</td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-gray-200">
                      <td colSpan="5" className="px-4 py-4 text-right font-bold text-lg">Total</td>
                      <td className="px-4 py-4 text-right font-bold text-xl text-primary">{formatCurrency(order.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {activeTab === 'supplier' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Informations générales</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="flex-1 text-gray-600">Raison sociale</span>
                        <span className="font-medium">{order.supplier_name}</span>
                      </div>
                      <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="flex-1 text-gray-600">Email</span>
                        <span className="font-medium">{order.supplier_email || '—'}</span>
                      </div>
                      <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="flex-1 text-gray-600">Téléphone</span>
                        <span className="font-medium">{order.supplier_phone || '—'}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Adresse</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 py-2 border-b border-gray-100">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="flex-1 text-gray-600 whitespace-pre-line">
                          {order.supplier_address || 'Adresse non renseignée'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandeDetails;