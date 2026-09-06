// src/components/finances/RapportFinancierDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, FilePieChart, Loader2, RefreshCw,
  X, CheckCircle, AlertCircle, Download,
  Calendar, FileText, FileSpreadsheet, Eye,
  TrendingUp, TrendingDown, Wallet, Building2,
  BarChart3, PieChart, ShoppingBag, Users,
  Printer, Share2, Clock, ChevronRight
} from 'lucide-react';

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const RapportFinancierDetail = () => {
  // ==========================================================
  // HOOKS
  // ==========================================================
  const navigate = useNavigate();
  const { id } = useParams();

  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [rapport, setRapport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  // ==========================================================
  // FONCTIONS UTILITAIRES
  // ==========================================================
  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
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

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 FCFA';
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  const getTypeBadge = (type) => {
    const configs = {
      bilan: { label: 'Bilan comptable', className: 'badge-primary', icon: BarChart3, color: 'text-primary' },
      compte_resultat: { label: 'Compte de résultat', className: 'badge-success', icon: TrendingUp, color: 'text-success' },
      tresorerie: { label: 'Tableau de trésorerie', className: 'badge-info', icon: Wallet, color: 'text-info' },
      budget: { label: 'Suivi budgétaire', className: 'badge-warning', icon: PieChart, color: 'text-warning' },
      ventes: { label: 'Rapport de ventes', className: 'badge-secondary', icon: TrendingUp, color: 'text-secondary' },
      depenses: { label: 'Rapport de dépenses', className: 'badge-error', icon: TrendingDown, color: 'text-error' },
      achats: { label: 'Rapport d\'achats', className: 'badge-ghost', icon: ShoppingBag, color: 'text-gray-600' },
      client: { label: 'Rapport client', className: 'badge-info', icon: Users, color: 'text-info' },
      fournisseur: { label: 'Rapport fournisseur', className: 'badge-warning', icon: Building2, color: 'text-warning' }
    };
    const config = configs[type] || { label: type, className: 'badge-ghost', icon: FileText, color: 'text-gray-600' };
    const Icon = config.icon;
    return (
      <span className={`badge ${config.className} gap-1 text-sm px-3 py-1.5`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
        {config.label}
      </span>
    );
  };

  const getFormatIcon = (format) => {
    if (format === 'pdf') return <FileText className="w-5 h-5" />;
    if (format === 'excel') return <FileSpreadsheet className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  // ==========================================================
  // REQUÊTES API
  // ==========================================================
  const fetchRapport = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await AxiosInstance.get(`/rapports-financiers/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      setRapport(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 404) {
        showNotification('Rapport non trouvé', 'error');
        setTimeout(() => navigate('/rapports-financiers'), 2000);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // ==========================================================
  // EFFETS
  // ==========================================================
  useEffect(() => {
    fetchRapport();
  }, [fetchRapport]);

  // ==========================================================
  // ACTIONS
  // ==========================================================
  const handleDownload = async () => {
    if (!rapport?.fichier) {
      showNotification('Aucun fichier disponible pour ce rapport', 'warning');
      return;
    }

    setDownloading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/rapports-financiers/${id}/download/`, {
        headers: { 'Authorization': `Token ${token}` },
        responseType: 'blob'
      });

      const extension = rapport.format === 'pdf' ? 'pdf' : 'xlsx';
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${rapport.nom || 'rapport'}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showNotification('Rapport téléchargé avec succès', 'success');
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors du téléchargement', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // ==========================================================
  // RENDU : CHARGEMENT
  // ==========================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 w-full">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-14 h-14 mx-auto" />
          <p className="text-lg font-medium text-gray-500">Chargement du rapport...</p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDU : NON TROUVÉ
  // ==========================================================
  if (!rapport) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 w-full">
        <div className="text-center space-y-4">
          <AlertCircle className="text-error w-14 h-14 mx-auto" />
          <p className="text-lg font-medium text-gray-700">Rapport non trouvé</p>
          <button onClick={() => navigate('/rapports-financiers')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDU : COMPOSANT PRINCIPAL - FULL WIDTH
  // ==========================================================
  return (
    <div className="w-full min-h-screen bg-gray-50">

      {/* ======================================================
          NOTIFICATION
          ====================================================== */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================
          EN-TÊTE
          ====================================================== */}
      <div className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/rapports-financiers')}
                className="btn btn-ghost btn-sm gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-xl">
                    <FilePieChart className="w-7 h-7 text-purple-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-800">
                      {rapport.nom}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      {getTypeBadge(rapport.type)}
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-500">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatDate(rapport.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={fetchRapport}
                className="btn btn-sm btn-outline gap-2"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
              </button>
              {rapport.fichier && (
                <button
                  onClick={handleDownload}
                  className="btn btn-sm btn-primary gap-2"
                  disabled={downloading}
                >
                  {downloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {downloading ? 'Téléchargement...' : 'Télécharger'}
                </button>
              )}
              <button
                onClick={handlePrint}
                className="btn btn-sm btn-outline gap-2"
              >
                <Printer className="w-4 h-4" /> Imprimer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          CONTENU - FULL WIDTH
          ====================================================== */}
      <div className="w-full px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ====================================================
              COLONNE GAUCHE - INFORMATIONS
              ==================================================== */}
          <div className="lg:col-span-1 space-y-6">

            {/* Carte Informations */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-5 py-3.5 border-b border-gray-200">
                <h3 className="font-semibold flex items-center gap-2 text-gray-700">
                  <FilePieChart className="w-5 h-5 text-purple-600" />
                  Informations
                </h3>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Nom</p>
                  <p className="font-medium text-gray-800">{rapport.nom}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <div className="mt-1">{getTypeBadge(rapport.type)}</div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Format</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getFormatIcon(rapport.format)}
                    <span className="font-medium text-gray-700">{rapport.format?.toUpperCase() || 'PDF'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Période</p>
                  <p className="text-gray-700">
                    {formatDate(rapport.date_debut)} → {formatDate(rapport.date_fin)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date de création</p>
                  <div className="flex items-center gap-1 text-gray-700">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {formatDateTime(rapport.created_at)}
                  </div>
                </div>
                {rapport.created_by_name && (
                  <div>
                    <p className="text-xs text-gray-500">Créé par</p>
                    <p className="text-gray-700">{rapport.created_by_name}</p>
                  </div>
                )}
                {rapport.fichier && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500">Fichier</p>
                    <div className="flex items-center gap-2 mt-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Disponible</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Carte Actions rapides */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-5 py-3.5 border-b border-gray-200">
                <h3 className="font-semibold flex items-center gap-2 text-gray-700">
                  <ChevronRight className="w-5 h-5 text-purple-600" />
                  Actions rapides
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {rapport.fichier && (
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-primary/5 transition-colors text-primary"
                    disabled={downloading}
                  >
                    {downloading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span className="font-medium">Télécharger le rapport</span>
                  </button>
                )}
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <Printer className="w-4 h-4" />
                  <span className="font-medium">Imprimer</span>
                </button>
                <button
                  onClick={() => navigate('/rapports-financiers/nouveau')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-purple-50 transition-colors text-purple-600"
                >
                  <FilePieChart className="w-4 h-4" />
                  <span className="font-medium">Générer un nouveau rapport</span>
                </button>
              </div>
            </div>
          </div>

          {/* ====================================================
              COLONNE DROITE - APERÇU DU RAPPORT
              ==================================================== */}
          <div className="lg:col-span-2">

            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2 text-gray-700">
                  <Eye className="w-5 h-5 text-purple-600" />
                  Aperçu du rapport
                </h3>
                <span className="text-xs text-gray-400">
                  {rapport.format?.toUpperCase() || 'PDF'}
                </span>
              </div>
              <div className="p-6">

                {rapport.contenu ? (
                  // Afficher le contenu du rapport s'il est disponible
                  <div className="space-y-6">
                    {/* En-tête du rapport */}
                    <div className="text-center border-b border-gray-200 pb-4">
                      <h2 className="text-2xl font-bold text-gray-800">{rapport.nom}</h2>
                      <p className="text-sm text-gray-500">
                        Période du {formatDate(rapport.date_debut)} au {formatDate(rapport.date_fin)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Généré le {formatDateTime(rapport.created_at)}
                      </p>
                    </div>

                    {/* Résumé des données - À adapter selon le type de rapport */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="text-xl font-bold text-primary">
                          {formatCurrency(rapport.contenu?.total || 0)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-500">Nombre</p>
                        <p className="text-xl font-bold text-gray-800">
                          {rapport.contenu?.count || 0}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-500">Moyenne</p>
                        <p className="text-xl font-bold text-info">
                          {formatCurrency(rapport.contenu?.average || 0)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-500">Statut</p>
                        <p className="text-xl font-bold text-success">
                          <CheckCircle className="w-5 h-5 inline" />
                        </p>
                      </div>
                    </div>

                    {/* Détails du contenu */}
                    {rapport.contenu?.details && rapport.contenu.details.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-gray-700 mb-3">Détails</h4>
                        <div className="overflow-x-auto">
                          <table className="table table-sm w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                {Object.keys(rapport.contenu.details[0] || {}).map((key) => (
                                  <th key={key} className="text-xs uppercase text-gray-500">
                                    {key.replace(/_/g, ' ')}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {rapport.contenu.details.slice(0, 10).map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  {Object.values(item).map((value, i) => (
                                    <td key={i} className="text-sm">
                                      {typeof value === 'number' ? formatCurrency(value) : value || '-'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {rapport.contenu.details.length > 10 && (
                            <p className="text-xs text-gray-400 mt-2 text-center">
                              Affichage des 10 premiers sur {rapport.contenu.details.length}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Pied du rapport */}
                    <div className="border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
                      <p>Rapport généré automatiquement - Tous droits réservés</p>
                    </div>
                  </div>
                ) : (
                  // Message si le contenu n'est pas disponible
                  <div className="text-center py-12">
                    <FilePieChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Aucun aperçu disponible</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {rapport.fichier ? (
                        'Téléchargez le fichier pour voir le contenu complet'
                      ) : (
                        'Le rapport est en cours de génération'
                      )}
                    </p>
                    {rapport.fichier && (
                      <button
                        onClick={handleDownload}
                        className="btn btn-primary mt-4 gap-2"
                        disabled={downloading}
                      >
                        {downloading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        Télécharger le rapport
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RapportFinancierDetail;