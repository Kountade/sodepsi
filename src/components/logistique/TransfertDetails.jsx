// src/components/stock/TransfertDetails.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, MoveHorizontal, Package, Building2,
  Calendar, User, FileText, AlertCircle, ArrowRight,
  CheckCircle, XCircle, RefreshCw
} from 'lucide-react';

const TransfertDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchTransfertDetails = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/movements/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setTransfer(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        showNotification('Transfert non trouvé', 'error');
        setTimeout(() => navigate('/transferts'), 1500);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfertDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement du transfert...</p>
        </div>
      </div>
    );
  }

  if (!transfer) return null;

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/transferts')} className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <MoveHorizontal className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Détail du transfert</h1>
              <p className="text-sm text-gray-500">ID: {transfer.id}</p>
            </div>
          </div>
        </div>
        <button onClick={fetchTransfertDetails} className="btn btn-ghost btn-sm btn-circle">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Schéma du transfert */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center flex-1">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <p className="font-semibold mt-2">{transfer.from_warehouse_name || 'Entrepôt source'}</p>
            <p className="text-xs text-gray-500">Entrepôt source</p>
          </div>
          <div className="flex-1 text-center">
            <ArrowRight className="w-8 h-8 text-primary mx-auto" />
            <p className="text-sm font-semibold text-primary mt-2">{transfer.quantity} unités</p>
          </div>
          <div className="text-center flex-1">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <Building2 className="w-8 h-8 text-success" />
            </div>
            <p className="font-semibold mt-2">{transfer.to_warehouse_name || 'Entrepôt destination'}</p>
            <p className="text-xs text-gray-500">Entrepôt destination</p>
          </div>
        </div>
      </div>

      {/* Informations détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produit */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> Produit
            </h3>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-lg">{transfer.product_name}</p>
                <p className="text-sm text-gray-500">Code: {transfer.product_code}</p>
              </div>
            </div>
            {transfer.lot_number && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-gray-500">Lot</p>
                <p className="font-medium">{transfer.lot_number}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quantité */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <MoveHorizontal className="w-4 h-4 text-primary" /> Quantité transférée
            </h3>
          </div>
          <div className="p-6">
            <p className="text-3xl font-bold text-primary text-center">{transfer.quantity}</p>
            <p className="text-center text-gray-500 mt-1">unités</p>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Date
            </h3>
          </div>
          <div className="p-6">
            <p className="text-sm">
              <span className="text-gray-500">Date du transfert:</span>{' '}
              <span className="font-medium">{new Date(transfer.created_at).toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* Utilisateur */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Effectué par
            </h3>
          </div>
          <div className="p-6">
            <p className="text-sm">
              <span className="text-gray-500">Utilisateur:</span>{' '}
              <span className="font-medium">{transfer.created_by_name || 'N/A'}</span>
            </p>
          </div>
        </div>

        {/* Raison */}
        {transfer.reason && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Raison
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm">{transfer.reason}</p>
            </div>
          </div>
        )}

        {/* Notes */}
        {transfer.notes && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-primary" /> Notes
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600">{transfer.notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransfertDetails;