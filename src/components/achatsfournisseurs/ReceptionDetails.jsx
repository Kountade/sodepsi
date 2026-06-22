// src/components/achats/ReceptionDetails.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, ClipboardList, Truck, Calendar, Package,
  CheckCircle, XCircle, RefreshCw, FileText, Building2,
  Clock, User, Warehouse, AlertCircle, Loader2
} from 'lucide-react';

const ReceptionDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getToken = () => localStorage.getItem('Token');

  const fetchReceiptDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('Session expirée, veuillez vous reconnecter');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      console.log('Fetching receipt ID:', id);
      const response = await AxiosInstance.get(`/receipts/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      console.log('Receipt data:', response.data);
      setReceipt(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      
      if (error.response?.status === 401) {
        setError('Session expirée, veuillez vous reconnecter');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        setError(`La réception #${id} n'existe pas`);
      } else {
        setError(error.response?.data?.message || error.response?.data?.detail || 'Erreur de chargement des données');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchReceiptDetails();
    } else {
      setError('ID de réception manquant');
      setLoading(false);
    }
  }, [id]);

  const getStatusBadge = (status) => {
    if (!status) return <span className="badge badge-ghost">Inconnu</span>;
    switch(status) {
      case 'pending':
        return <span className="badge badge-warning gap-1"><Clock className="w-3 h-3" /> En attente</span>;
      case 'in_progress':
        return <span className="badge badge-info gap-1"><Truck className="w-3 h-3" /> En cours</span>;
      case 'completed':
        return <span className="badge badge-success gap-1"><CheckCircle className="w-3 h-3" /> Terminée</span>;
      case 'cancelled':
        return <span className="badge badge-error gap-1"><XCircle className="w-3 h-3" /> Annulée</span>;
      default:
        return <span className="badge badge-ghost">{status}</span>;
    }
  };

  const getQualityBadge = (qualityStatus) => {
    if (!qualityStatus) return <span className="badge badge-warning">En attente</span>;
    switch(qualityStatus) {
      case 'passed':
        return <span className="badge badge-success">Approuvé</span>;
      case 'failed':
        return <span className="badge badge-error">Refusé</span>;
      default:
        return <span className="badge badge-warning">En attente</span>;
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement de la réception...</p>
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
          <div className="flex gap-3 justify-center">
            <button onClick={fetchReceiptDetails} className="btn btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Réessayer
            </button>
            <button onClick={() => navigate('/receptions')} className="btn btn-primary">
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
          <ClipboardList className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Aucune donnée</h2>
          <p className="text-gray-500 mb-6">Aucune réception trouvée pour l'ID {id}</p>
          <button onClick={() => navigate('/receptions')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/receptions')} className="btn btn-ghost btn-sm gap-2">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/15 rounded-xl">
                  <ClipboardList className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Réception {receipt.receipt_number || 'N/A'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Commande: {receipt.po_number || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchReceiptDetails} className="btn btn-ghost btn-sm btn-circle" title="Actualiser">
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
                <p className="text-xs text-gray-500">Date réception</p>
                <p className="font-semibold">{formatDate(receipt.receipt_date)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Truck className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Date prévue</p>
                <p className="font-semibold">{formatDate(receipt.expected_date)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Warehouse className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Entrepôt</p>
                <p className="font-semibold">{receipt.warehouse_name || 'N/A'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <Package className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Statut</p>
                {getStatusBadge(receipt.status)}
              </div>
            </div>
          </div>
        </div>

        {/* Informations commande */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" /> Informations commande
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">N° commande</span>
                  <span className="font-mono font-medium">{receipt.po_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Fournisseur</span>
                  <span className="font-medium">{receipt.supplier_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">N° Bon de livraison</span>
                  <span className="font-medium">{receipt.delivery_note || '-'}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">N° Facture</span>
                  <span className="font-medium">{receipt.invoice_number || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Réceptionné par</span>
                  <span className="font-medium">{receipt.created_by_name || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Produits reçus */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> Produits reçus
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Produit</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Qté Cmd</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Qté Reçue</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Avarié</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">N° Lot</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Expiration</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Qualité</th>
                </tr>
              </thead>
              <tbody>
                {receipt.lines && receipt.lines.length > 0 ? (
                  receipt.lines.map((line, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm">{line.product_name}</p>
                        <p className="text-xs text-gray-400">{line.product_code}</p>
                      </td>
                      <td className="px-4 py-3 text-center">{line.quantity_ordered || 0} </td>
                      <td className="px-4 py-3 text-center font-semibold text-success">{line.quantity_received || 0}</td>
                      <td className="px-4 py-3 text-center">{line.quantity_damaged > 0 ? line.quantity_damaged : '-'}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm">{line.lot_number || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {line.expiry_date ? formatDate(line.expiry_date) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getQualityBadge(line.quality_status)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-b">
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      Aucun produit trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        {receipt.notes && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold mb-2 flex-items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Notes
            </h3>
            <p className="text-sm text-gray-600">{receipt.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceptionDetails;