// src/components/finances/RapportFinancierDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Edit, Trash2, RefreshCw, Loader2,
  AlertCircle, Calendar, User, FileText,
  LineChart, Download, Eye,
  CheckCircle, XCircle, Clock, 
  BarChart3, TrendingUp, DollarSign, PieChart,
  Printer, FileSpreadsheet
} from 'lucide-react';

const RapportFinancierDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rapport, setRapport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const getToken = () => localStorage.getItem('Token');

  const fetchRapport = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('Session expirée');
        setLoading(false);
        return;
      }

      const response = await AxiosInstance.get(`/rapports/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setRapport(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 401) {
        setError('Session expirée');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        setError('Rapport non trouvé');
      } else {
        setError('Erreur lors du chargement du rapport');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRapport();
    }
  }, [id]);

  const handleGenerer = async () => {
    setGenerating(true);
    try {
      const token = getToken();
      await AxiosInstance.post(`/rapports/${id}/generer/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Rapport en cours de génération...', 'success');
      setTimeout(() => {
        fetchRapport();
      }, 3000);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors de la génération', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // ✅ Téléchargement via la route PDF (frontend)
  const handleDownloadPdf = () => {
    setDownloading(true);
    try {
      // Rediriger vers la page de génération PDF qui télécharge automatiquement
      navigate(`/rapports-financiers/${id}/pdf`);
      showNotification('Téléchargement du PDF en cours...', 'success');
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors du téléchargement', 'error');
    } finally {
      setTimeout(() => setDownloading(false), 1000);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce rapport ?')) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/rapports/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      navigate('/rapports-financiers');
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const showNotification = (message, type) => {
    // Vous pouvez implémenter votre propre système de notification
    alert(message);
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

  const getTypeBadge = (type) => {
    const configs = {
      bilan: { label: 'Bilan comptable', className: 'badge-primary', icon: BarChart3 },
      compte_resultat: { label: 'Compte de résultat', className: 'badge-success', icon: TrendingUp },
      tresorerie: { label: 'Tableau de trésorerie', className: 'badge-info', icon: DollarSign },
      budget: { label: 'Suivi budgétaire', className: 'badge-warning', icon: PieChart },
      ventes: { label: 'Rapport de ventes', className: 'badge-secondary', icon: TrendingUp },
      depenses: { label: 'Rapport de dépenses', className: 'badge-error', icon: FileText },
      achats: { label: "Rapport d'achats", className: 'badge-ghost', icon: FileText },
      client: { label: 'Rapport client', className: 'badge-info', icon: FileText },
      fournisseur: { label: 'Rapport fournisseur', className: 'badge-warning', icon: FileText }
    };
    const config = configs[type] || { label: type, className: 'badge-ghost', icon: FileText };
    const Icon = config.icon;
    return (
      <span className={`badge ${config.className} gap-1 text-sm`}>
        <Icon className="w-4 h-4" /> {config.label}
      </span>
    );
  };

  const getFormatBadge = (format) => {
    const configs = {
      pdf: { label: 'PDF', className: 'badge-error' },
      excel: { label: 'Excel', className: 'badge-success' },
      csv: { label: 'CSV', className: 'badge-info' }
    };
    const config = configs[format] || { label: format, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement du rapport...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Erreur</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={() => navigate('/rapports-financiers')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  if (!rapport) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-20 h-20 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Rapport non trouvé</h2>
          <button onClick={() => navigate('/rapports-financiers')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/rapports-financiers')}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <LineChart className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {rapport.nom}
                </h1>
                <span className="badge badge-ghost">
                  {rapport.fichier ? (
                    <span className="text-success flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Généré
                    </span>
                  ) : (
                    <span className="text-gray-400 flex items-center gap-1">
                      <Clock className="w-4 h-4" /> En attente
                    </span>
                  )}
                </span>
              </div>
              <p className="text-sm text-gray-500 ml-1">
                {getTypeBadge(rapport.type)} - {getFormatBadge(rapport.format)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={fetchRapport}
              className="btn btn-sm btn-outline gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            {!rapport.fichier && (
              <button 
                onClick={handleGenerer}
                className="btn btn-sm btn-primary gap-2"
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {generating ? 'Génération...' : 'Générer'}
              </button>
            )}
            {/* ✅ Télécharger PDF via RapportPdf */}
            <button 
              onClick={handleDownloadPdf}
              className={`btn btn-sm btn-success gap-2 ${downloading ? 'btn-disabled' : ''}`}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {downloading ? 'Téléchargement...' : 'Télécharger PDF'}
            </button>
            <button 
              onClick={() => navigate(`/rapports-financiers/${id}/modifier`)}
              className="btn btn-sm btn-warning gap-2"
            >
              <Edit className="w-4 h-4" /> Modifier
            </button>
            <button 
              onClick={handleDelete}
              className="btn btn-sm btn-error gap-2"
            >
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* Informations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte principale */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Détails du rapport
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-medium">Nom</label>
                <p className="text-sm font-semibold text-gray-800">{rapport.nom}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Type</label>
                <div className="mt-1">{getTypeBadge(rapport.type)}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Format</label>
                <div className="mt-1">{getFormatBadge(rapport.format)}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Statut</label>
                <p className="text-sm font-semibold text-gray-800">
                  {rapport.fichier ? (
                    <span className="text-success flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Généré
                    </span>
                  ) : (
                    <span className="text-gray-400 flex items-center gap-1">
                      <Clock className="w-4 h-4" /> En attente de génération
                    </span>
                  )}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Date début</label>
                <p className="text-sm font-semibold text-gray-800">{formatDate(rapport.date_debut)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Date fin</label>
                <p className="text-sm font-semibold text-gray-800">{formatDate(rapport.date_fin)}</p>
              </div>
              {rapport.contenu && Object.keys(rapport.contenu).length > 0 && (
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-500 font-medium">Contenu du rapport</label>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-auto">
                    <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(rapport.contenu, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Métadonnées */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Métadonnées
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Créé par</label>
                <p className="text-sm font-semibold text-gray-800">{rapport.created_by_name || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Créé le</label>
                <p className="text-sm text-gray-600">{formatDate(rapport.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Actions</h2>
            <div className="flex flex-col gap-2">
              {!rapport.fichier && (
                <button 
                  onClick={handleGenerer}
                  className="btn btn-primary btn-sm w-full gap-2 justify-start"
                  disabled={generating}
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {generating ? 'Génération...' : 'Générer le rapport'}
                </button>
              )}
              {/* ✅ Télécharger PDF via RapportPdf */}
              <button 
                onClick={handleDownloadPdf}
                className={`btn btn-success btn-sm w-full gap-2 justify-start ${downloading ? 'btn-disabled' : ''}`}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {downloading ? 'Téléchargement...' : 'Télécharger le rapport'}
              </button>
              <button 
                onClick={() => navigate(`/rapports-financiers/${id}/modifier`)}
                className="btn btn-warning btn-sm w-full gap-2 justify-start"
              >
                <Edit className="w-4 h-4" /> Modifier le rapport
              </button>
              <button 
                onClick={() => window.print()}
                className="btn btn-outline btn-sm w-full gap-2 justify-start"
              >
                <Printer className="w-4 h-4" /> Imprimer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RapportFinancierDetail;