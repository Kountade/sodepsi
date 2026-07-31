// src/components/tresorerie/TresorerieJournaliereDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Calendar, DollarSign, TrendingUp, TrendingDown,
  RefreshCw, FileText, AlertCircle, CheckCircle, X
} from 'lucide-react';
import TresorerieJournalPdf from './TresorerieJournalPdf';

const TresorerieJournaliereDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warehouseName, setWarehouseName] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/tresorerie-journaliere/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setData(response.data);

      // Récupérer le nom de l'entrepôt
      try {
        const whResponse = await AxiosInstance.get(`/warehouses/${response.data.warehouse}/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        setWarehouseName(whResponse.data.name);
      } catch {
        setWarehouseName(response.data.warehouse);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Impossible de charger les détails de cette ligne.');
      showNotification('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return Number(num).toLocaleString();
  };

  const getVariationColor = (val) => {
    const v = parseFloat(val || 0);
    if (v > 0) return 'text-success';
    if (v < 0) return 'text-error';
    return 'text-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-error" />
          <p className="text-xl font-semibold text-gray-700">{error || 'Ligne non trouvée'}</p>
          <button onClick={() => navigate('/tresorerie-journaliere')} className="btn btn-primary gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour à la liste
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
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <button onClick={() => navigate('/tresorerie-journaliere')} className="btn btn-ghost btn-sm gap-2 mb-2">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Calendar className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-primary">Détail journalier</h1>
                <p className="text-sm text-gray-500">
                  {data.date} – {warehouseName}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchDetail} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            {/* Bouton PDF avec PDFDownloadLink */}
            <PDFDownloadLink
              document={<TresorerieJournalPdf data={data} warehouseName={warehouseName} />}
              fileName={`tresorerie_journaliere_${data.date}_${warehouseName}.pdf`}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              {({ loading }) => (
                <>
                  {loading ? <span className="loading loading-spinner loading-sm"></span> : <FileText className="w-4 h-4" />}
                  Exporter PDF
                </>
              )}
            </PDFDownloadLink>
          </div>
        </div>
      </div>

      {/* Cartes récapitulatives */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Solde d'ouverture</p>
              <p className="text-2xl font-bold">{formatNumber(data.solde_ouverture)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Solde de fermeture</p>
              <p className="text-2xl font-bold">{formatNumber(data.solde_fermeture)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Variation</p>
              <p className={`text-2xl font-bold ${getVariationColor(data.variation)}`}>
                {formatNumber(data.variation)}
              </p>
            </div>
            <TrendingUp className={`w-8 h-8 ${parseFloat(data.variation || 0) >= 0 ? 'text-success/20' : 'text-error/20'}`} />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Opérations</p>
              <p className="text-2xl font-bold">{data.nb_operations || 0}</p>
              <p className="text-xs text-gray-400">{data.nb_entrees || 0} entrées / {data.nb_sorties || 0} sorties</p>
            </div>
            <FileText className="w-8 h-8 text-primary/20" />
          </div>
        </div>
      </div>

      {/* Détail des flux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-xl p-5">
          <h2 className="text-lg font-bold text-success mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Entrées
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Total entrées</span>
              <span className="font-bold text-success">{formatNumber(data.total_entrees)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Ventes</span>
              <span>{formatNumber(data.entrees_ventes)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Règlements</span>
              <span>{formatNumber(data.entrees_reglements)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Autres entrées</span>
              <span>{formatNumber(data.entrees_autres)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-5">
          <h2 className="text-lg font-bold text-error mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5" /> Sorties
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Total sorties</span>
              <span className="font-bold text-error">{formatNumber(data.total_sorties)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Achats</span>
              <span>{formatNumber(data.sorties_achats)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Frais</span>
              <span>{formatNumber(data.sorties_frais)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Salaires</span>
              <span>{formatNumber(data.sorties_salaires)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Autres sorties</span>
              <span>{formatNumber(data.sorties_autres)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Métadonnées */}
      <div className="bg-white shadow-md rounded-xl p-5 text-sm text-gray-500">
        <div className="grid grid-cols-2 gap-4">
          <div><span className="font-semibold">Créé le :</span> {new Date(data.created_at).toLocaleString()}</div>
          <div><span className="font-semibold">Mis à jour :</span> {new Date(data.updated_at).toLocaleString()}</div>
          <div><span className="font-semibold">Entrepôt :</span> {warehouseName}</div>
          <div><span className="font-semibold">ID :</span> {data.id}</div>
        </div>
      </div>
    </div>
  );
};

export default TresorerieJournaliereDetail;