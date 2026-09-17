// src/components/retours-clients/RetourClientDetail.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Undo2, User, FileText, DollarSign, Package,
  Download, Edit, RefreshCw, CheckCircle, AlertCircle,
  Loader2, Phone, Mail, MapPin, Ban, X, Calendar,
  CreditCard, AlertTriangle
} from 'lucide-react';

const RetourClientDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [avoir, setAvoir] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchAvoir = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await AxiosInstance.get(`/avoirs/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      setAvoir(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 404) {
        showNotification('Retour non trouvé', 'error');
        setTimeout(() => navigate('/retours-clients'), 1500);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchAvoir();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Supprimer définitivement ce retour ?')) return;

    try {
      const token = getToken();
      await AxiosInstance.delete(`/avoirs/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Retour supprimé', 'success');
      setTimeout(() => navigate('/retours-clients'), 1500);
    } catch (error) {
      console.error('Erreur suppression:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  // ============================================================
  // FORMATAGE
  // ============================================================
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '0 FCFA';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0 FCFA';
    return `${num.toLocaleString('fr-FR')} FCFA`;
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

  const getTypeBadge = (type) => {
    const configs = {
      refund: { label: '💸 Remboursement', className: 'badge-error' },
      return: { label: '📦 Retour', className: 'badge-warning' },
      discount: { label: '🏷️ Remise', className: 'badge-info' },
      error: { label: '⚠️ Erreur', className: 'badge-ghost' }
    };
    const config = configs[type] || { label: type, className: 'badge-ghost' };
    return <span className={`badge ${config.className} badge-lg gap-1`}>{config.label}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-warning w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement du retour...</p>
        </div>
      </div>
    );
  }

  if (!avoir) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-lg">
          <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Retour non trouvé</h2>
          <button onClick={() => navigate('/retours-clients')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
      <div className="bg-gradient-to-r from-warning/10 via-warning/5 to-transparent border-b border-warning/10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/retours-clients')} className="btn btn-ghost btn-sm gap-2">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-warning/15 rounded-xl">
                  <Undo2 className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {avoir.avoir_number}
                  </h1>
                  <p className="text-sm text-gray-500">{avoir.client_name}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate(`/retours-clients/${id}/pdf`)}
                className="btn btn-primary btn-sm gap-2"
              >
                <Download className="w-4 h-4" /> PDF
              </button>
              <button
                onClick={() => navigate(`/retours-clients/${id}/modifier`)}
                className="btn btn-outline btn-sm gap-2"
              >
                <Edit className="w-4 h-4" /> Modifier
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-error btn-sm gap-2"
              >
                <Ban className="w-4 h-4" /> Supprimer
              </button>
              <button onClick={fetchAvoir} className="btn btn-ghost btn-sm btn-circle">
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
                <p className="text-xs text-gray-500">N° Avoir</p>
                <p className="font-semibold font-mono">{avoir.avoir_number}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-error/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-error" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Montant</p>
                <p className="font-bold text-lg text-error">{formatCurrency(avoir.amount)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Type</p>
                {getTypeBadge(avoir.type)}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <Calendar className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-semibold text-sm">{formatDate(avoir.date)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Détails - Grille 2/3 + 1/3 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Raison et notes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Raison du retour
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Motif</p>
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {avoir.reason || 'Aucune raison spécifiée'}
                  </p>
                </div>
                {avoir.notes && (
                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-500 mb-1">Notes internes</p>
                    <p className="text-sm text-gray-600 whitespace-pre-line">
                      {avoir.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Vente associée */}
            {avoir.sale && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" /> Vente associée
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono font-semibold">{avoir.sale_number || avoir.sale}</p>
                      <p className="text-sm text-gray-500 mt-1">Vente d'origine</p>
                    </div>
                    <button
                      onClick={() => navigate(`/ventes/${avoir.sale}`)}
                      className="btn btn-sm btn-outline gap-2"
                    >
                      <Package className="w-4 h-4" /> Voir la vente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Colonne droite - 1/3 */}
          <div className="space-y-6">
            {/* Client */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Client
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <p className="font-semibold text-base">{avoir.client_name}</p>
                {avoir.client_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{avoir.client_phone}</span>
                  </div>
                )}
                {avoir.client?.id && (
                  <button
                    onClick={() => navigate(`/clients/${avoir.client.id}`)}
                    className="btn btn-ghost btn-sm w-full mt-2 gap-2"
                  >
                    <User className="w-4 h-4" /> Voir le client
                  </button>
                )}
              </div>
            </div>

            {/* Informations de création */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Informations
                </h3>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Créé par</span>
                  <span className="font-medium">{avoir.created_by_name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date de création</span>
                  <span className="font-medium text-xs">{formatDate(avoir.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetourClientDetail;