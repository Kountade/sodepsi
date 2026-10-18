// src/components/finances/DepenseDetail.jsx
// ============================================================
// VERSION CORRIGÉE - Détail dépense
// ============================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Edit, Trash2, RefreshCw, Loader2,
  AlertCircle, FileText, Calendar, Clock, Check, Ban,
  CheckCircle, XCircle, Download, Eye, AlertTriangle, X
} from 'lucide-react';

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
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('fr-FR');
  } catch {
    return '-';
  }
};

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('fr-FR');
  } catch {
    return '-';
  }
};

// ============================================================
// CONSTANTES
// ============================================================
const CATEGORIE_LABELS = {
  fournitures: 'Fournitures de bureau',
  utilities: 'Services publics',
  loyer: 'Loyer',
  salaires: 'Salaires',
  marketing: 'Marketing',
  transport: 'Transport',
  maintenance: 'Maintenance',
  formation: 'Formation',
  informatique: 'Informatique',
  telecommunication: 'Télécommunication',
  frais_bancaires: 'Frais bancaires',
  impots: 'Impôts et taxes',
  assurance: 'Assurance',
  frais_professionnels: 'Frais professionnels',
  achat_stock: 'Achat de stock',
  autre: 'Autre',
};

const CATEGORIE_BADGES = {
  fournitures: 'badge-info',
  utilities: 'badge-warning',
  loyer: 'badge-primary',
  salaires: 'badge-success',
  marketing: 'badge-secondary',
  transport: 'badge-info',
  maintenance: 'badge-warning',
  formation: 'badge-primary',
  informatique: 'badge-secondary',
  telecommunication: 'badge-info',
  frais_bancaires: 'badge-error',
  impots: 'badge-error',
  assurance: 'badge-primary',
  frais_professionnels: 'badge-ghost',
  achat_stock: 'badge-success',
  autre: 'badge-ghost',
};

const STATUT_CONFIG = {
  en_attente: { label: 'En attente', className: 'badge-warning', icon: Clock },
  approuve: { label: 'Approuvé', className: 'badge-info', icon: Check },
  paye: { label: 'Payé', className: 'badge-success', icon: CheckCircle },
  annule: { label: 'Annulé', className: 'badge-error', icon: Ban },
  rejete: { label: 'Rejeté', className: 'badge-error', icon: XCircle },
};

// ============================================================
// COMPOSANT
// ============================================================
const DepenseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [depense, setDepense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  const abortRef = useRef(null);

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
  // CHARGEMENT
  // ==========================================================
  const fetchDepense = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await AxiosInstance.get(`/depenses/${id}/`, {
        headers: { Authorization: `Token ${token}` },
        signal: controller.signal,
      });
      setDepense(response.data);
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;

      console.error('❌ Erreur chargement dépense:', err);
      if (err.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 404) {
        setError('Dépense introuvable');
      } else {
        setError(
          err.response?.data?.detail ||
            err.response?.data?.message ||
            'Erreur lors du chargement de la dépense'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showNotification]);

  useEffect(() => {
    if (id) fetchDepense();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [id, fetchDepense]);

  // ==========================================================
  // ACTIONS
  // ==========================================================
  const handleApprouver = async () => {
    if (!window.confirm('Approuver cette dépense ?')) return;
    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(
        `/depenses/${id}/approuver/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      showNotification('Dépense approuvée avec succès', 'success');
      await fetchDepense();
    } catch (err) {
      console.error('❌ Erreur approbation:', err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Erreur lors de l'approbation";
      showNotification(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayer = async () => {
    if (!window.confirm('Marquer cette dépense comme payée ?')) return;
    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(
        `/depenses/${id}/payer/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      showNotification('Dépense marquée comme payée', 'success');
      await fetchDepense();
    } catch (err) {
      console.error('❌ Erreur paiement:', err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Erreur lors du paiement';
      showNotification(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejeter = async () => {
    if (!window.confirm('Rejeter cette dépense ?')) return;
    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(
        `/depenses/${id}/rejeter/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      showNotification('Dépense rejetée', 'success');
      await fetchDepense();
    } catch (err) {
      console.error('❌ Erreur rejet:', err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Erreur lors du rejet';
      showNotification(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        'Voulez-vous vraiment supprimer cette dépense ? Cette action est irréversible.'
      )
    )
      return;

    try {
      const token = getToken();
      await AxiosInstance.delete(`/depenses/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      showNotification('Dépense supprimée', 'success');
      setTimeout(() => navigate('/depenses'), 800);
    } catch (err) {
      console.error('❌ Erreur suppression:', err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Erreur lors de la suppression';
      showNotification(msg, 'error');
    }
  };

  // ==========================================================
  // BADGES
  // ==========================================================
  const getCategorieBadge = (categorie) => {
    const label = CATEGORIE_LABELS[categorie] || categorie;
    const className = CATEGORIE_BADGES[categorie] || 'badge-ghost';
    return <span className={`badge ${className}`}>{label}</span>;
  };

  const getStatutBadge = (statut) => {
    const config = STATUT_CONFIG[statut] || {
      label: statut,
      className: 'badge-ghost',
      icon: Clock,
    };
    const Icon = config.icon;
    return (
      <span className={`badge ${config.className} gap-1 text-sm`}>
        <Icon className="w-4 h-4" /> {config.label}
      </span>
    );
  };

  // ==========================================================
  // CHARGEMENT INITIAL
  // ==========================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-error w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">
            Chargement de la dépense…
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
            <button onClick={fetchDepense} className="btn btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Réessayer
            </button>
            <button
              onClick={() => navigate('/depenses')}
              className="btn btn-primary"
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!depense) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
          <AlertCircle className="w-20 h-20 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Dépense non trouvée
          </h2>
          <button
            onClick={() => navigate('/depenses')}
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
      <div className="relative overflow-hidden bg-gradient-to-r from-error/10 via-error/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/depenses')}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <div className="p-2 bg-error/10 rounded-xl">
                  <FileText className="w-6 h-6 text-error" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 font-mono">
                  {depense.reference}
                </h1>
                {getStatutBadge(depense.statut)}
              </div>
              <p className="text-sm text-gray-500 ml-1">
                {formatDate(depense.date_depense)} — {depense.description}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchDepense}
              className="btn btn-sm btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              />
              Actualiser
            </button>

            {depense.statut === 'en_attente' && (
              <>
                <button
                  onClick={() => navigate(`/depenses/${id}/modifier`)}
                  className="btn btn-sm btn-warning gap-2"
                >
                  <Edit className="w-4 h-4" /> Modifier
                </button>
                <button
                  onClick={handleApprouver}
                  className="btn btn-sm btn-info gap-2"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Approuver
                </button>
                <button
                  onClick={handleRejeter}
                  className="btn btn-sm btn-error gap-2"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Rejeter
                </button>
              </>
            )}

            {depense.statut === 'approuve' && (
              <button
                onClick={handlePayer}
                className="btn btn-sm btn-success gap-2"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Payer
              </button>
            )}

            {depense.statut !== 'paye' && depense.statut !== 'annule' && (
              <button
                onClick={handleDelete}
                className="btn btn-sm btn-error gap-2"
                disabled={actionLoading}
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Détails de la dépense
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Référence
                </label>
                <p className="text-sm font-semibold text-gray-800 font-mono">
                  {depense.reference}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Catégorie
                </label>
                <div className="mt-1">
                  {getCategorieBadge(depense.categorie)}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Date de la dépense
                </label>
                <p className="text-sm font-semibold text-gray-800">
                  {formatDate(depense.date_depense)}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Date d'échéance
                </label>
                <p className="text-sm font-semibold text-gray-800">
                  {formatDate(depense.date_echeance) || '-'}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Montant HT
                </label>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(depense.montant)}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Taxe (TVA)
                </label>
                <p className="text-sm font-semibold text-gray-800">
                  {formatCurrency(depense.taxe)}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 font-medium">
                  Total TTC
                </label>
                <p className="text-lg font-bold text-error">
                  {formatCurrency(depense.total)}
                </p>
              </div>
              {depense.supplier_name && (
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-500 font-medium">
                    Fournisseur
                  </label>
                  <p className="text-sm font-semibold text-gray-800">
                    {depense.supplier_name}
                  </p>
                </div>
              )}
              {depense.mode_paiement && (
                <div>
                  <label className="text-xs text-gray-500 font-medium">
                    Mode de paiement
                  </label>
                  <p className="text-sm font-semibold text-gray-800">
                    {depense.mode_paiement}
                  </p>
                </div>
              )}
              {depense.reference_paiement && (
                <div>
                  <label className="text-xs text-gray-500 font-medium">
                    Référence paiement
                  </label>
                  <p className="text-sm font-semibold text-gray-800">
                    {depense.reference_paiement}
                  </p>
                </div>
              )}
              {depense.date_paiement && (
                <div>
                  <label className="text-xs text-gray-500 font-medium">
                    Date de paiement
                  </label>
                  <p className="text-sm font-semibold text-gray-800">
                    {formatDate(depense.date_paiement)}
                  </p>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 font-medium">
                  Description
                </label>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {depense.description}
                </p>
              </div>
              {depense.notes && (
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-500 font-medium">
                    Notes
                  </label>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {depense.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Références associées */}
          {(depense.mouvement_reference ||
            depense.ecriture_numero ||
            depense.purchase_order_info) && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Éléments liés
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {depense.mouvement_reference && (
                  <div>
                    <label className="text-xs text-gray-500 font-medium">
                      Mouvement trésorerie
                    </label>
                    <p className="text-sm font-semibold text-primary font-mono">
                      {depense.mouvement_reference}
                    </p>
                    {depense.mouvement_date && (
                      <p className="text-xs text-gray-400">
                        {formatDate(depense.mouvement_date)}
                      </p>
                    )}
                  </div>
                )}
                {depense.ecriture_numero && (
                  <div>
                    <label className="text-xs text-gray-500 font-medium">
                      Écriture comptable
                    </label>
                    <p className="text-sm font-semibold text-primary font-mono">
                      {depense.ecriture_numero}
                    </p>
                    {depense.ecriture_date && (
                      <p className="text-xs text-gray-400">
                        {formatDate(depense.ecriture_date)}
                      </p>
                    )}
                  </div>
                )}
                {depense.purchase_order_info && (
                  <div>
                    <label className="text-xs text-gray-500 font-medium">
                      Bon de commande
                    </label>
                    <p className="text-sm font-semibold text-primary font-mono">
                      {depense.purchase_order_info.po_number}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Métadonnées
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Créé par
                </label>
                <p className="text-sm font-semibold text-gray-800">
                  {depense.created_by_name || '-'}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Créé le
                </label>
                <p className="text-sm text-gray-600">
                  {formatDateTime(depense.created_at)}
                </p>
              </div>
              {depense.approuve_par_name && (
                <>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">
                      Approuvé par
                    </label>
                    <p className="text-sm font-semibold text-gray-800">
                      {depense.approuve_par_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">
                      Approuvé le
                    </label>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(depense.approuve_le)}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Actions rapides
            </h2>
            <div className="flex flex-col gap-2">
              {depense.statut === 'en_attente' && (
                <>
                  <button
                    onClick={() => navigate(`/depenses/${id}/modifier`)}
                    className="btn btn-warning btn-sm w-full gap-2 justify-start"
                  >
                    <Edit className="w-4 h-4" /> Modifier la dépense
                  </button>
                  <button
                    onClick={handleApprouver}
                    className="btn btn-info btn-sm w-full gap-2 justify-start"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Approuver
                  </button>
                </>
              )}
              {depense.statut === 'approuve' && (
                <button
                  onClick={handlePayer}
                  className="btn btn-success btn-sm w-full gap-2 justify-start"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Payer la dépense
                </button>
              )}
              <button
                onClick={() => navigate('/depenses')}
                className="btn btn-outline btn-sm w-full gap-2 justify-start"
              >
                <ArrowLeft className="w-4 h-4" /> Retour à la liste
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepenseDetail;