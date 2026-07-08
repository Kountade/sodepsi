// src/components/achats/PurchaseReturnDetails.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, ArrowLeftRight, Truck, Calendar, Package,
  CheckCircle, XCircle, RefreshCw, FileText, Building2,
  Clock, User, AlertCircle, Loader2, Download
} from 'lucide-react';

const PurchaseReturnDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [returnItem, setReturnItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getToken = () => localStorage.getItem('Token');

  const fetchReturnDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('Session expirée, veuillez vous reconnecter');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      const response = await AxiosInstance.get(`/purchase-returns/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setReturnItem(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 401) {
        setError('Session expirée, veuillez vous reconnecter');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        setError(`Le retour #${id} n'existe pas`);
      } else {
        setError(error.response?.data?.message || error.response?.data?.detail || 'Erreur de chargement des données');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchReturnDetails();
    } else {
      setError('ID de retour manquant');
      setLoading(false);
    }
  }, [id]);

  const approveReturn = async () => {
    try {
      const token = getToken();
      await AxiosInstance.post(`/purchase-returns/${id}/approve/`, {}, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Retour approuvé avec succès', 'success');
      fetchReturnDetails();
    } catch (error) {
      showNotification('Erreur lors de l\'approbation', 'error');
    }
  };

  const rejectReturn = async () => {
    try {
      const token = getToken();
      await AxiosInstance.post(`/purchase-returns/${id}/reject/`, {}, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Retour refusé', 'success');
      fetchReturnDetails();
    } catch (error) {
      showNotification('Erreur lors du refus', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'requested':
        return <span className="badge badge-warning gap-1"><Clock className="w-3 h-3" /> Demandé</span>;
      case 'approved':
        return <span className="badge badge-info gap-1"><CheckCircle className="w-3 h-3" /> Approuvé</span>;
      case 'shipped':
        return <span className="badge badge-primary gap-1"><Truck className="w-3 h-3" /> Expédié</span>;
      case 'refunded':
        return <span className="badge badge-success gap-1"><CheckCircle className="w-3 h-3" /> Remboursé</span>;
      case 'replaced':
        return <span className="badge badge-secondary gap-1"><RefreshCw className="w-3 h-3" /> Remplacé</span>;
      case 'rejected':
        return <span className="badge badge-error gap-1"><XCircle className="w-3 h-3" /> Refusé</span>;
      default:
        return <span className="badge badge-ghost">{status}</span>;
    }
  };

  const getReasonLabel = (reason) => {
    const map = {
      defective: 'Défectueux',
      wrong_product: 'Produit incorrect',
      expired: 'Expiré',
      damaged: 'Endommagé',
      other: 'Autre'
    };
    return map[reason] || reason;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('fr-FR');
    } catch {
      return '-';
    }
  };

  const showNotification = (message, type) => {
    // Simple notification via alert pour ce composant
    alert(message);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement du retour...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
          <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Erreur</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={() => navigate('/purchase-returns')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  if (!returnItem) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/purchase-returns')} className="btn btn-ghost btn-sm gap-2">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/15 rounded-xl">
                  <ArrowLeftRight className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Retour {returnItem.return_number}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Commande: {returnItem.po_number}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {returnItem.status === 'requested' && (
                <>
                  <button onClick={approveReturn} className="btn btn-success btn-sm gap-2">
                    <CheckCircle className="w-4 h-4" /> Approuver
                  </button>
                  <button onClick={rejectReturn} className="btn btn-error btn-sm gap-2">
                    <XCircle className="w-4 h-4" /> Refuser
                  </button>
                </>
              )}
              <button onClick={fetchReturnDetails} className="btn btn-ghost btn-sm btn-circle" title="Actualiser">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Cartes d'information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Date retour</p>
                <p className="font-semibold">{formatDate(returnItem.return_date)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Truck className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Commande</p>
                <p className="font-semibold">{returnItem.po_number}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Package className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Raison</p>
                <p className="font-semibold">{getReasonLabel(returnItem.reason)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Statut</p>
                {getStatusBadge(returnItem.status)}
              </div>
            </div>
          </div>
        </div>

        {/* Informations commande */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" /> Informations
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">N° retour</span>
                  <span className="font-mono font-medium">{returnItem.return_number}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Fournisseur</span>
                  <span className="font-medium">{returnItem.supplier_name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Réception associée</span>
                  <span className="font-mono">{returnItem.receipt_number || '-'}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Créé par</span>
                  <span className="font-medium">{returnItem.created_by_name || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Raison</span>
                  <span className="font-medium">{getReasonLabel(returnItem.reason)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Produits retournés */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> Produits retournés
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Produit</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Quantité</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Prix unitaire</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {returnItem.lines && returnItem.lines.length > 0 ? (
                  returnItem.lines.map((line, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm">{line.product_name}</p>
                        <p className="text-xs text-gray-400">{line.product_code}</p>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">{line.quantity}</td>
                      <td className="px-4 py-3 text-right">{line.unit_price?.toLocaleString()} F</td>
                      <td className="px-4 py-3 text-right font-semibold">{line.total?.toLocaleString()} F</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-500">
                      Aucun produit retourné
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        {returnItem.notes && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold mb-2 flex-items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Notes
            </h3>
            <p className="text-sm text-gray-600">{returnItem.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseReturnDetails;