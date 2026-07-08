// src/components/finances/EcritureDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Edit, Trash2, RefreshCw, Loader2,
  AlertCircle, BookOpen, Calendar, User, Building2,
  DollarSign, FileText, Check, Ban, TrendingUp,
  TrendingDown, Clock, CheckCircle, XCircle
} from 'lucide-react';

const EcritureDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ecriture, setEcriture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const getToken = () => localStorage.getItem('Token');

  const fetchEcriture = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/ecritures/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setEcriture(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement de l\'écriture');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEcriture();
    }
  }, [id]);

  const handleValider = async () => {
    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(`/ecritures/${id}/valider/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      fetchEcriture();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAnnuler = async () => {
    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(`/ecritures/${id}/annuler/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      fetchEcriture();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette écriture ?')) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/ecritures/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      navigate('/ecritures');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 FCFA';
    return `${amount.toLocaleString('fr-FR')} FCFA`;
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

  const getTypeBadge = (type) => {
    const configs = {
      vente: { label: 'Vente', className: 'badge-success', icon: TrendingUp },
      achat: { label: 'Achat', className: 'badge-info', icon: TrendingDown },
      paiement_client: { label: 'Paiement Client', className: 'badge-primary', icon: User },
      paiement_fournisseur: { label: 'Paiement Fournisseur', className: 'badge-warning', icon: Building2 },
      recette: { label: 'Recette', className: 'badge-success', icon: DollarSign },
      depense: { label: 'Dépense', className: 'badge-error', icon: DollarSign },
      tresorerie: { label: 'Trésorerie', className: 'badge-secondary', icon: FileText },
      regularisation: { label: 'Régularisation', className: 'badge-ghost', icon: Clock },
      autre: { label: 'Autre', className: 'badge-ghost', icon: FileText }
    };
    const config = configs[type] || { label: type, className: 'badge-ghost', icon: FileText };
    const Icon = config.icon;
    return (
      <span className={`badge ${config.className} gap-1`}>
        <Icon className="w-3 h-3" /> {config.label}
      </span>
    );
  };

  const getStatutBadge = (statut) => {
    const configs = {
      brouillon: { label: 'Brouillon', className: 'badge-ghost', icon: Clock },
      valide: { label: 'Validée', className: 'badge-success', icon: CheckCircle },
      annulee: { label: 'Annulée', className: 'badge-error', icon: XCircle }
    };
    const config = configs[statut] || { label: statut, className: 'badge-ghost', icon: Clock };
    const Icon = config.icon;
    return (
      <span className={`badge ${config.className} gap-1 text-sm`}>
        <Icon className="w-4 h-4" /> {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement de l'écriture...</p>
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
          <button onClick={() => navigate('/ecritures')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  if (!ecriture) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-20 h-20 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Écriture non trouvée</h2>
          <button onClick={() => navigate('/ecritures')} className="btn btn-primary">
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
              onClick={() => navigate('/ecritures')}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {ecriture.numero}
                </h1>
                {getStatutBadge(ecriture.statut)}
              </div>
              <p className="text-sm text-gray-500 ml-1">
                {formatDate(ecriture.date_ecriture)} - {ecriture.description}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={fetchEcriture}
              className="btn btn-sm btn-outline gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            
            {ecriture.statut === 'brouillon' && (
              <>
                <button 
                  onClick={() => navigate(`/ecritures/${id}/modifier`)}
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
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            )}
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
              Détails de l'écriture
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-medium">Numéro</label>
                <p className="text-sm font-semibold text-gray-800">{ecriture.numero}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Type</label>
                <div className="mt-1">{getTypeBadge(ecriture.type)}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Date d'écriture</label>
                <p className="text-sm font-semibold text-gray-800">{formatDate(ecriture.date_ecriture)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Date comptable</label>
                <p className="text-sm font-semibold text-gray-800">{formatDate(ecriture.date_comptable)}</p>
              </div>
              {ecriture.date_echeance && (
                <div>
                  <label className="text-xs text-gray-500 font-medium">Date d'échéance</label>
                  <p className="text-sm font-semibold text-gray-800">{formatDate(ecriture.date_echeance)}</p>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 font-medium">Référence</label>
                <p className="text-sm font-semibold text-gray-800">{ecriture.reference || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Compte Débit</label>
                <p className="text-sm font-semibold text-error">
                  {ecriture.compte_debit_numero} - {ecriture.compte_debit_nom}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Compte Crédit</label>
                <p className="text-sm font-semibold text-success">
                  {ecriture.compte_credit_numero} - {ecriture.compte_credit_nom}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Montant</label>
                <p className="text-lg font-bold text-primary">{formatCurrency(ecriture.montant)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Taxe</label>
                <p className="text-sm font-semibold text-gray-800">{formatCurrency(ecriture.taxe)}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 font-medium">Total TTC</label>
                <p className="text-lg font-bold text-primary">{formatCurrency(ecriture.total)}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 font-medium">Description</label>
                <p className="text-sm text-gray-600">{ecriture.description}</p>
              </div>
              {ecriture.notes && (
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-500 font-medium">Notes</label>
                  <p className="text-sm text-gray-600">{ecriture.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Informations liées */}
          {(ecriture.client || ecriture.supplier || ecriture.vente || ecriture.facture) && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Link className="w-5 h-5 text-primary" />
                Éléments liés
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ecriture.client && (
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Client</label>
                    <p className="text-sm font-semibold text-primary">{ecriture.client_name}</p>
                  </div>
                )}
                {ecriture.supplier && (
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Fournisseur</label>
                    <p className="text-sm font-semibold text-primary">{ecriture.supplier_name}</p>
                  </div>
                )}
                {ecriture.vente && (
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Vente</label>
                    <p className="text-sm font-semibold text-primary">{ecriture.vente_number}</p>
                  </div>
                )}
                {ecriture.facture && (
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Facture</label>
                    <p className="text-sm font-semibold text-primary">{ecriture.facture_number}</p>
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
                <label className="text-xs text-gray-500 font-medium">Créé par</label>
                <p className="text-sm font-semibold text-gray-800">{ecriture.created_by_name || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Créé le</label>
                <p className="text-sm text-gray-600">{formatDate(ecriture.created_at)}</p>
              </div>
              {ecriture.validated_by_name && (
                <>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Validé par</label>
                    <p className="text-sm font-semibold text-gray-800">{ecriture.validated_by_name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Validé le</label>
                    <p className="text-sm text-gray-600">{formatDate(ecriture.validated_at)}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Actions</h2>
            <div className="flex flex-col gap-2">
              {ecriture.statut === 'brouillon' && (
                <>
                  <button 
                    onClick={() => navigate(`/ecritures/${id}/modifier`)}
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
                    Valider l'écriture
                  </button>
                </>
              )}
              {ecriture.statut === 'brouillon' && (
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
                  Annuler l'écriture
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcritureDetail;