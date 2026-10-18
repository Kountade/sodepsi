// src/components/finances/EcritureDetail.jsx
// ============================================================
// VERSION CORRIGÉE - Détail écriture comptable
// ============================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Edit, Trash2, RefreshCw, Loader2,
  AlertCircle, BookOpen, Calendar, User, Building2,
  DollarSign, FileText, Check, Ban, TrendingUp,
  TrendingDown, Clock, CheckCircle, XCircle,
  Link as LinkIcon, AlertTriangle
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
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
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
const TYPE_CONFIG = {
  vente: { label: 'Vente', className: 'badge-success', icon: TrendingUp },
  achat: { label: 'Achat', className: 'badge-info', icon: TrendingDown },
  paiement_client: {
    label: 'Paiement Client',
    className: 'badge-primary',
    icon: User,
  },
  paiement_fournisseur: {
    label: 'Paiement Fournisseur',
    className: 'badge-warning',
    icon: Building2,
  },
  recette: { label: 'Recette', className: 'badge-success', icon: DollarSign },
  depense: { label: 'Dépense', className: 'badge-error', icon: DollarSign },
  tresorerie: {
    label: 'Trésorerie',
    className: 'badge-secondary',
    icon: FileText,
  },
  regularisation: {
    label: 'Régularisation',
    className: 'badge-ghost',
    icon: Clock,
  },
  autre: { label: 'Autre', className: 'badge-ghost', icon: FileText },
};

const STATUT_CONFIG = {
  brouillon: { label: 'Brouillon', className: 'badge-ghost', icon: Clock },
  valide: { label: 'Validée', className: 'badge-success', icon: CheckCircle },
  annulee: { label: 'Annulée', className: 'badge-error', icon: XCircle },
};

// ============================================================
// COMPOSANT
// ============================================================
const EcritureDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ecriture, setEcriture] = useState(null);
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
  const fetchEcriture = useCallback(async () => {
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

      // ✅ URL CORRIGÉE
      const response = await AxiosInstance.get(
        `/ecritures-comptables/${id}/`,
        {
          headers: { Authorization: `Token ${token}` },
          signal: controller.signal,
        }
      );
      setEcriture(response.data);
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;

      console.error('❌ Erreur chargement écriture:', err);
      if (err.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 404) {
        setError("Écriture introuvable");
      } else {
        setError(
          err.response?.data?.detail ||
            err.response?.data?.message ||
            "Erreur lors du chargement de l'écriture"
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showNotification]);

  useEffect(() => {
    if (id) fetchEcriture();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [id, fetchEcriture]);

  // ==========================================================
  // ACTIONS
  // ==========================================================
  const handleValider = async () => {
    if (!window.confirm("Confirmer la validation de cette écriture ?")) return;

    setActionLoading(true);
    try {
      const token = getToken();

      // ✅ URL CORRIGÉE
      await AxiosInstance.post(
        `/ecritures-comptables/${id}/valider/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );

      showNotification('Écriture validée avec succès', 'success');
      await fetchEcriture();
    } catch (err) {
      console.error('❌ Erreur validation:', err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Erreur lors de la validation';
      showNotification(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAnnuler = async () => {
    if (!window.confirm('Confirmer l\'annulation de cette écriture ?')) return;

    setActionLoading(true);
    try {
      const token = getToken();

      // ✅ URL CORRIGÉE
      await AxiosInstance.post(
        `/ecritures-comptables/${id}/annuler/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );

      showNotification('Écriture annulée', 'success');
      await fetchEcriture();
    } catch (err) {
      console.error('❌ Erreur annulation:', err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Erreur lors de l'annulation";
      showNotification(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        'Voulez-vous vraiment supprimer cette écriture ? Cette action est irréversible.'
      )
    )
      return;

    try {
      const token = getToken();

      // ✅ URL CORRIGÉE
      await AxiosInstance.delete(`/ecritures-comptables/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });

      showNotification('Écriture supprimée', 'success');
      setTimeout(() => navigate('/ecritures-comptables'), 800);
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
  const getTypeBadge = (type) => {
    const config = TYPE_CONFIG[type] || {
      label: type,
      className: 'badge-ghost',
      icon: FileText,
    };
    const Icon = config.icon;
    return (
      <span className={`badge ${config.className} gap-1`}>
        <Icon className="w-3 h-3" /> {config.label}
      </span>
    );
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
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">
            Chargement de l'écriture…
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
            <button onClick={fetchEcriture} className="btn btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Réessayer
            </button>
            <button
              onClick={() => navigate('/ecritures-comptables')}
              className="btn btn-primary"
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!ecriture) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
          <AlertCircle className="w-20 h-20 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Écriture non trouvée
          </h2>
          <button
            onClick={() => navigate('/ecritures-comptables')}
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
              onClick={() => navigate('/ecritures-comptables')}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 font-mono">
                  {ecriture.numero}
                </h1>
                {getStatutBadge(ecriture.statut)}
              </div>
              <p className="text-sm text-gray-500 ml-1">
                {formatDate(ecriture.date_ecriture)} — {ecriture.description}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchEcriture}
              className="btn btn-sm btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              />
              Actualiser
            </button>

            {ecriture.statut === 'brouillon' && (
              <>
                <button
                  onClick={() =>
                    navigate(`/ecritures-comptables/${id}/modifier`)
                  }
                  className="btn btn-sm btn-warning gap-2"
                >
                  <Edit className="w-4 h-4" /> Modifier
                </button>
                <button
                  onClick={handleValider}
                  className="btn btn-sm btn-success gap-2"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Valider
                </button>
                <button
                  onClick={handleAnnuler}
                  className="btn btn-sm btn-error gap-2"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Ban className="w-4 h-4" />
                  )}
                  Annuler
                </button>
              </>
            )}

            {ecriture.statut !== 'annulee' && (
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
          {/* Détails */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Détails de l'écriture
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Numéro
                </label>
                <p className="text-sm font-semibold text-gray-800 font-mono">
                  {ecriture.numero}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Type
                </label>
                <div className="mt-1">{getTypeBadge(ecriture.type)}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Date d'écriture
                </label>
                <p className="text-sm font-semibold text-gray-800">
                  {formatDate(ecriture.date_ecriture)}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Date comptable
                </label>
                <p className="text-sm font-semibold text-gray-800">
                  {formatDate(ecriture.date_comptable)}
                </p>
              </div>
              {ecriture.date_echeance && (
                <div>
                  <label className="text-xs text-gray-500 font-medium">
                    Date d'échéance
                  </label>
                  <p className="text-sm font-semibold text-gray-800">
                    {formatDate(ecriture.date_echeance)}
                  </p>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Référence
                </label>
                <p className="text-sm font-semibold text-gray-800 font-mono">
                  {ecriture.reference || '-'}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Compte Débit
                </label>
                <p className="text-sm font-semibold text-error">
                  {ecriture.compte_debit_numero} - {ecriture.compte_debit_nom}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Compte Crédit
                </label>
                <p className="text-sm font-semibold text-success">
                  {ecriture.compte_credit_numero} - {ecriture.compte_credit_nom}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Montant
                </label>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(ecriture.montant)}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Taxe
                </label>
                <p className="text-sm font-semibold text-gray-800">
                  {formatCurrency(ecriture.taxe)}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 font-medium">
                  Total TTC
                </label>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(ecriture.total)}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 font-medium">
                  Description
                </label>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {ecriture.description}
                </p>
              </div>
              {ecriture.notes && (
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-500 font-medium">
                    Notes
                  </label>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {ecriture.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Éléments liés */}
          {(ecriture.client_info ||
            ecriture.supplier_info ||
            ecriture.vente_info ||
            ecriture.facture_info ||
            ecriture.purchase_order_info) && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-primary" />
                Éléments liés
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ecriture.client_info && (
                  <div>
                    <label className="text-xs text-gray-500 font-medium">
                      Client
                    </label>
                    <p className="text-sm font-semibold text-primary">
                      {ecriture.client_info.name}
                    </p>
                    {ecriture.client_info.code && (
                      <p className="text-xs text-gray-400 font-mono">
                        {ecriture.client_info.code}
                      </p>
                    )}
                  </div>
                )}
                {ecriture.supplier_info && (
                  <div>
                    <label className="text-xs text-gray-500 font-medium">
                      Fournisseur
                    </label>
                    <p className="text-sm font-semibold text-primary">
                      {ecriture.supplier_info.name}
                    </p>
                    {ecriture.supplier_info.code && (
                      <p className="text-xs text-gray-400 font-mono">
                        {ecriture.supplier_info.code}
                      </p>
                    )}
                  </div>
                )}
                {ecriture.vente_info && (
                  <div>
                    <label className="text-xs text-gray-500 font-medium">
                      Vente
                    </label>
                    <p className="text-sm font-semibold text-primary font-mono">
                      {ecriture.vente_info.invoice_number}
                    </p>
                  </div>
                )}
                {ecriture.facture_info && (
                  <div>
                    <label className="text-xs text-gray-500 font-medium">
                      Facture
                    </label>
                    <p className="text-sm font-semibold text-primary font-mono">
                      {ecriture.facture_info.invoice_number}
                    </p>
                  </div>
                )}
                {ecriture.purchase_order_info && (
                  <div>
                    <label className="text-xs text-gray-500 font-medium">
                      Commande fournisseur
                    </label>
                    <p className="text-sm font-semibold text-primary font-mono">
                      {ecriture.purchase_order_info.po_number}
                    </p>
                  </div>
                )}
                {ecriture.supplier_invoice_info && (
                  <div>
                    <label className="text-xs text-gray-500 font-medium">
                      Facture fournisseur
                    </label>
                    <p className="text-sm font-semibold text-primary font-mono">
                      {ecriture.supplier_invoice_info.invoice_number}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Métadonnées */}
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
                  {ecriture.created_by_name || '-'}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Créé le
                </label>
                <p className="text-sm text-gray-600">
                  {formatDateTime(ecriture.created_at)}
                </p>
              </div>
              {ecriture.validated_by_name && (
                <>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">
                      Validé par
                    </label>
                    <p className="text-sm font-semibold text-gray-800">
                      {ecriture.validated_by_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">
                      Validé le
                    </label>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(ecriture.validated_at)}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Actions rapides
            </h2>
            <div className="flex flex-col gap-2">
              {ecriture.statut === 'brouillon' && (
                <>
                  <button
                    onClick={() =>
                      navigate(`/ecritures-comptables/${id}/modifier`)
                    }
                    className="btn btn-warning btn-sm w-full gap-2 justify-start"
                  >
                    <Edit className="w-4 h-4" /> Modifier l'écriture
                  </button>
                  <button
                    onClick={handleValider}
                    className="btn btn-success btn-sm w-full gap-2 justify-start"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Valider
                  </button>
                  <button
                    onClick={handleAnnuler}
                    className="btn btn-error btn-sm w-full gap-2 justify-start"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Ban className="w-4 h-4" />
                    )}
                    Annuler
                  </button>
                </>
              )}
              <button
                onClick={() => navigate('/ecritures-comptables')}
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

export default EcritureDetail;