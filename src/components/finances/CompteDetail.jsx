// src/components/finances/CompteDetail.jsx
// ============================================================
// VERSION COMPLÈTE CORRIGÉE - Avec ErrorBoundary intégré
// ============================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Edit, RefreshCw, Loader2,
  AlertCircle, Grid3x3, FileText,
  DollarSign, CheckCircle, X, AlertTriangle,
  RotateCcw
} from 'lucide-react';

// ============================================================
// ✅ ERROR BOUNDARY (évite les pages blanches)
// ============================================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ Erreur CompteDetail:', error);
    console.error('📍 Stack:', errorInfo?.componentStack);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6">
            <div className="flex items-center gap-3 mb-4 text-error">
              <AlertCircle className="w-8 h-8" />
              <h2 className="text-xl font-bold">
                Une erreur est survenue
              </h2>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-red-700 mb-1">
                Message :
              </p>
              <pre className="text-xs text-red-600 whitespace-pre-wrap break-all">
                {this.state.error?.toString()}
              </pre>
            </div>

            {this.state.errorInfo?.componentStack && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm font-semibold text-gray-700 mb-2">
                  📍 Stack trace (cliquer pour voir)
                </summary>
                <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-auto max-h-64 text-gray-700">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={this.handleReload}
                className="btn btn-primary gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Recharger
              </button>
              <button
                onClick={() => window.history.back()}
                className="btn btn-ghost gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================
// HELPERS
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
    });
  } catch {
    return '-';
  }
};

// ============================================================
// CONSTANTES
// ============================================================
const TYPE_BADGES = {
  actif: { label: 'Actif', className: 'badge-success' },
  passif: { label: 'Passif', className: 'badge-error' },
  capitaux: { label: 'Capitaux propres', className: 'badge-primary' },
  produits: { label: 'Produits', className: 'badge-info' },
  charges: { label: 'Charges', className: 'badge-warning' },
};

const CLASSE_LABELS = {
  '1': 'Classe 1 - Capital',
  '2': 'Classe 2 - Immobilisations',
  '3': 'Classe 3 - Stocks',
  '4': 'Classe 4 - Tiers',
  '5': 'Classe 5 - Trésorerie',
  '6': 'Classe 6 - Charges',
  '7': 'Classe 7 - Produits',
  '8': 'Classe 8 - Régularisation',
};

const STATUT_BADGES = {
  brouillon: { label: 'Brouillon', className: 'badge-ghost' },
  valide: { label: 'Validée', className: 'badge-success' },
  annulee: { label: 'Annulée', className: 'badge-error' },
};

// ============================================================
// ✅ COMPOSANT CONTENU (le vrai)
// ============================================================
const CompteDetailContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  console.log('🔵 CompteDetail monté - ID:', id);

  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [compte, setCompte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [ecritures, setEcritures] = useState([]);
  const [loadingEcritures, setLoadingEcritures] = useState(false);

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  const abortCompteRef = useRef(null);
  const abortEcrituresRef = useRef(null);

  const getToken = () => localStorage.getItem('Token');

  // ==========================================================
  // NOTIFICATIONS
  // ==========================================================
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  }, []);

  // ==========================================================
  // CHARGEMENT COMPTE
  // ==========================================================
  const fetchCompte = useCallback(async () => {
    if (!id) {
      console.warn('⚠️ Pas d\'ID fourni');
      setError('ID manquant dans l\'URL');
      setLoading(false);
      return;
    }

    if (abortCompteRef.current) abortCompteRef.current.abort();
    const controller = new AbortController();
    abortCompteRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      console.log('🔍 Chargement compte:', id);

      // ✅ URL CORRIGÉE
      const response = await AxiosInstance.get(
        `/comptes-comptables/${id}/`,
        {
          headers: { Authorization: `Token ${token}` },
          signal: controller.signal,
        }
      );

      console.log('✅ Compte chargé:', response.data);
      setCompte(response.data);
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;

      console.error('❌ Erreur chargement compte:', err);
      if (err.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 404) {
        setError('Compte introuvable');
      } else {
        setError(
          err.response?.data?.detail ||
            err.response?.data?.message ||
            'Erreur lors du chargement du compte'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showNotification]);

  // ==========================================================
  // CHARGEMENT ÉCRITURES
  // ==========================================================
  const fetchEcritures = useCallback(async () => {
    if (!id) return;

    if (abortEcrituresRef.current) abortEcrituresRef.current.abort();
    const controller = new AbortController();
    abortEcrituresRef.current = controller;

    setLoadingEcritures(true);
    try {
      const token = getToken();
      if (!token) return;

      const response = await AxiosInstance.get(
        `/comptes-comptables/${id}/ecritures/?page_size=20`,
        {
          headers: { Authorization: `Token ${token}` },
          signal: controller.signal,
        }
      );

      const data = response.data;
      const results = Array.isArray(data) ? data : data.results || [];
      setEcritures(results);
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      console.error('❌ Erreur chargement écritures:', err);
    } finally {
      setLoadingEcritures(false);
    }
  }, [id]);

  // ==========================================================
  // EFFETS
  // ==========================================================
  useEffect(() => {
    if (id) {
      fetchCompte();
      fetchEcritures();
    }
    return () => {
      if (abortCompteRef.current) abortCompteRef.current.abort();
      if (abortEcrituresRef.current) abortEcrituresRef.current.abort();
    };
  }, [id, fetchCompte, fetchEcritures]);

  // ==========================================================
  // BADGES
  // ==========================================================
  const getTypeBadge = (type) => {
    const config = TYPE_BADGES[type] || {
      label: type || 'Inconnu',
      className: 'badge-ghost',
    };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  const getStatutBadge = (isActive) => {
    return (
      <span className={`badge ${isActive ? 'badge-success' : 'badge-ghost'}`}>
        {isActive ? 'Actif' : 'Inactif'}
      </span>
    );
  };

  const getEcritureStatutBadge = (statut) => {
    const config = STATUT_BADGES[statut] || {
      label: statut || 'Brouillon',
      className: 'badge-ghost',
    };
    return (
      <span className={`badge badge-sm ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getClasseLabel = (classe) => CLASSE_LABELS[classe] || classe;

  // ==========================================================
  // CHARGEMENT INITIAL
  // ==========================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">
            Chargement du compte…
          </p>
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
            <button onClick={fetchCompte} className="btn btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Réessayer
            </button>
            <button
              onClick={() => navigate('/comptes-comptables')}
              className="btn btn-primary"
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!compte) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
          <AlertCircle className="w-20 h-20 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Compte non trouvé
          </h2>
          <p className="text-gray-500 mb-6">
            Aucun compte avec l'ID {id}
          </p>
          <button
            onClick={() => navigate('/comptes-comptables')}
            className="btn btn-primary"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDU
  // ==========================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown max-w-md">
          <div
            className={`alert ${
              notification.type === 'success'
                ? 'alert-success'
                : notification.type === 'warning'
                ? 'alert-warning'
                : 'alert-error'
            } shadow-xl rounded-xl`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : notification.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="font-medium text-sm">{notification.message}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() =>
                setNotification((prev) => ({ ...prev, show: false }))
              }
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/comptes-comptables')}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Grid3x3 className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {compte.numero} - {compte.nom}
                </h1>
                {getTypeBadge(compte.type)}
                {getStatutBadge(compte.is_active)}
              </div>
              <p className="text-sm text-gray-500 ml-1">
                {compte.full_path || 'Compte principal'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchCompte}
              className="btn btn-sm btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              />
              Actualiser
            </button>
            <button
              onClick={() => navigate(`/comptes-comptables/${id}/modifier`)}
              className="btn btn-sm btn-warning gap-2"
            >
              <Edit className="w-4 h-4" /> Modifier
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations générales */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Informations du compte
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Numéro
                </label>
                <p className="text-sm font-semibold text-gray-800 font-mono">
                  {compte.numero}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Nom</label>
                <p className="text-sm font-semibold text-gray-800">
                  {compte.nom}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Nom complet
                </label>
                <p className="text-sm text-gray-600">
                  {compte.nom_complet || '-'}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Type
                </label>
                <div className="mt-1">{getTypeBadge(compte.type)}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Classe
                </label>
                <p className="text-sm font-semibold text-gray-800">
                  {getClasseLabel(compte.classe)}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Statut
                </label>
                <div className="mt-1">{getStatutBadge(compte.is_active)}</div>
              </div>
              {compte.parent_nom && (
                <div>
                  <label className="text-xs text-gray-500 font-medium">
                    Compte parent
                  </label>
                  <p className="text-sm font-semibold text-primary">
                    {compte.parent_nom}
                  </p>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Solde
                </label>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(compte.solde)}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Solde initial
                </label>
                <p className="text-sm font-semibold text-gray-800">
                  {formatCurrency(compte.solde_initial)}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 font-medium">
                  Notes
                </label>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {compte.notes || 'Aucune note'}
                </p>
              </div>
            </div>
          </div>

          {/* Écritures */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Écritures ({ecritures.length})
              </h2>
              <button
                onClick={fetchEcritures}
                className="btn btn-ghost btn-sm btn-circle"
                title="Actualiser"
                disabled={loadingEcritures}
              >
                <RefreshCw
                  className={`w-4 h-4 ${
                    loadingEcritures ? 'animate-spin' : ''
                  }`}
                />
              </button>
            </div>

            {loadingEcritures ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-primary w-8 h-8" />
              </div>
            ) : ecritures.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">
                  Aucune écriture pour ce compte
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr>
                      <th>N°</th>
                      <th>Date</th>
                      <th>Description</th>
                      <th className="text-right">Débit</th>
                      <th className="text-right">Crédit</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ecritures.map((ecriture) => (
                      <tr key={ecriture.id} className="hover:bg-gray-50">
                        <td className="font-mono text-sm">
                          {ecriture.numero}
                        </td>
                        <td className="text-sm">
                          {formatDate(ecriture.date_ecriture)}
                        </td>
                        <td className="text-sm max-w-xs truncate">
                          {ecriture.description}
                        </td>
                        <td className="text-right text-sm font-semibold text-success whitespace-nowrap">
                          {ecriture.compte_debit === compte.id
                            ? formatCurrency(ecriture.montant)
                            : '-'}
                        </td>
                        <td className="text-right text-sm font-semibold text-error whitespace-nowrap">
                          {ecriture.compte_credit === compte.id
                            ? formatCurrency(ecriture.montant)
                            : '-'}
                        </td>
                        <td>{getEcritureStatutBadge(ecriture.statut)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {ecritures.length > 0 && (
                  <div className="text-center mt-3">
                    <button
                      onClick={() =>
                        navigate(`/ecritures-comptables?compte=${id}`)
                      }
                      className="btn btn-ghost btn-sm text-primary gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Voir toutes les écritures
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Solde */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Solde
            </h2>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(compte.solde)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Solde actuel</p>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Actions rapides
            </h2>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate(`/comptes-comptables/${id}/modifier`)}
                className="btn btn-warning btn-sm w-full gap-2 justify-start"
              >
                <Edit className="w-4 h-4" /> Modifier le compte
              </button>
              <button
                onClick={() =>
                  navigate(`/ecritures-comptables?compte=${id}`)
                }
                className="btn btn-outline btn-sm w-full gap-2 justify-start"
              >
                <FileText className="w-4 h-4" /> Voir les écritures
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ✅ WRAPPER AVEC ERROR BOUNDARY
// ============================================================
const CompteDetail = () => (
  <ErrorBoundary>
    <CompteDetailContent />
  </ErrorBoundary>
);

export default CompteDetail;