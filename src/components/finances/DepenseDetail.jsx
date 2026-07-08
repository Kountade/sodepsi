// src/components/finances/DepenseDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Edit, Trash2, RefreshCw, Loader2,
  AlertCircle, FileText, Calendar, User, Building2,
  DollarSign, Clock, Check, Ban, CheckCircle,
  XCircle, TrendingUp, TrendingDown, Download,
  Printer, Send, Plus
} from 'lucide-react';

const DepenseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [depense, setDepense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const getToken = () => localStorage.getItem('Token');

  const fetchDepense = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/depenses/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setDepense(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement de la dépense');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDepense();
    }
  }, [id]);

  const handleApprouver = async () => {
    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(`/depenses/${id}/approuver/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      fetchDepense();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayer = async () => {
    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(`/depenses/${id}/payer/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      fetchDepense();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejeter = async () => {
    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(`/depenses/${id}/rejeter/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      fetchDepense();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette dépense ?')) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/depenses/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      navigate('/depenses');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/depenses/${id}/pdf/`, {
        headers: { 'Authorization': `Token ${token}` },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `depense_${depense.reference}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
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

  const getCategorieBadge = (categorie) => {
    const configs = {
      fournitures: { label: 'Fournitures de bureau', className: 'badge-info' },
      utilities: { label: 'Services publics', className: 'badge-warning' },
      loyer: { label: 'Loyer', className: 'badge-primary' },
      salaires: { label: 'Salaires', className: 'badge-success' },
      marketing: { label: 'Marketing', className: 'badge-secondary' },
      transport: { label: 'Transport', className: 'badge-info' },
      maintenance: { label: 'Maintenance', className: 'badge-warning' },
      formation: { label: 'Formation', className: 'badge-primary' },
      informatique: { label: 'Informatique', className: 'badge-secondary' },
      telecommunication: { label: 'Télécommunication', className: 'badge-info' },
      frais_bancaires: { label: 'Frais bancaires', className: 'badge-error' },
      impots: { label: 'Impôts et taxes', className: 'badge-error' },
      assurance: { label: 'Assurance', className: 'badge-primary' },
      frais_professionnels: { label: 'Frais professionnels', className: 'badge-ghost' },
      achat_stock: { label: 'Achat de stock', className: 'badge-success' },
      autre: { label: 'Autre', className: 'badge-ghost' }
    };
    const config = configs[categorie] || { label: categorie, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  const getStatutBadge = (statut) => {
    const configs = {
      en_attente: { label: 'En attente', className: 'badge-ghost', icon: Clock },
      approuve: { label: 'Approuvé', className: 'badge-info', icon: Check },
      paye: { label: 'Payé', className: 'badge-success', icon: CheckCircle },
      annule: { label: 'Annulé', className: 'badge-error', icon: Ban },
      rejete: { label: 'Rejeté', className: 'badge-error', icon: XCircle }
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
          <p className="text-base font-medium text-gray-500">Chargement de la dépense...</p>
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
          <button onClick={() => navigate('/depenses')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  if (!depense) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-20 h-20 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Dépense non trouvée</h2>
          <button onClick={() => navigate('/depenses')} className="btn btn-primary">
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
              onClick={() => navigate('/depenses')}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {depense.reference}
                </h1>
                {getStatutBadge(depense.statut)}
              </div>
              <p className="text-sm text-gray-500 ml-1">
                {formatDate(depense.date_depense)} - {depense.description}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={fetchDepense}
              className="btn btn-sm btn-outline gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button 
              onClick={handleDownloadPdf}
              className="btn btn-sm btn-outline gap-2 text-primary"
            >
              <Download className="w-4 h-4" /> PDF
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
              Détails de la dépense
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-medium">Référence</label>
                <p className="text-sm font-semibold text-gray-800">{depense.reference}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Catégorie</label>
                <div className="mt-1">{getCategorieBadge(depense.categorie)}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Date de la dépense</label>
                <p className="text-sm font-semibold text-gray-800">{formatDate(depense.date_depense)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Date d'échéance</label>
                <p className="text-sm font-semibold text-gray-800">{formatDate(depense.date_echeance) || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Montant</label>
                <p className="text-lg font-bold text-primary">{formatCurrency(depense.montant)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Taxe (TVA)</label>
                <p className="text-sm font-semibold text-gray-800">{formatCurrency(depense.taxe)}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 font-medium">Total TTC</label>
                <p className="text-lg font-bold text-primary">{formatCurrency(depense.total)}</p>
              </div>
              {depense.supplier_name && (
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-500 font-medium">Fournisseur</label>
                  <p className="text-sm font-semibold text-gray-800">
                    {depense.supplier_name}
                    {depense.supplier && (
                      <span className="text-xs text-gray-400 block">ID: {depense.supplier}</span>
                    )}
                  </p>
                </div>
              )}
              {depense.mode_paiement && (
                <div>
                  <label className="text-xs text-gray-500 font-medium">Mode de paiement</label>
                  <p className="text-sm font-semibold text-gray-800">{depense.mode_paiement}</p>
                </div>
              )}
              {depense.reference_paiement && (
                <div>
                  <label className="text-xs text-gray-500 font-medium">Référence paiement</label>
                  <p className="text-sm font-semibold text-gray-800">{depense.reference_paiement}</p>
                </div>
              )}
              {depense.date_paiement && (
                <div>
                  <label className="text-xs text-gray-500 font-medium">Date de paiement</label>
                  <p className="text-sm font-semibold text-gray-800">{formatDate(depense.date_paiement)}</p>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 font-medium">Description</label>
                <p className="text-sm text-gray-600">{depense.description}</p>
              </div>
              {depense.notes && (
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-500 font-medium">Notes</label>
                  <p className="text-sm text-gray-600">{depense.notes}</p>
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
              <Clock className="w-5 h-5 text-primary" />
              Métadonnées
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Créé par</label>
                <p className="text-sm font-semibold text-gray-800">{depense.created_by_name || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Créé le</label>
                <p className="text-sm text-gray-600">{formatDate(depense.created_at)}</p>
              </div>
              {depense.approuve_par_name && (
                <>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Approuvé par</label>
                    <p className="text-sm font-semibold text-gray-800">{depense.approuve_par_name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Approuvé le</label>
                    <p className="text-sm text-gray-600">{formatDate(depense.approuve_le)}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Actions</h2>
            <div className="flex flex-col gap-2">
              {depense.tresorerie && (
                <button 
                  onClick={() => navigate(`/tresorerie/${depense.tresorerie}`)}
                  className="btn btn-outline btn-sm w-full gap-2 justify-start"
                >
                  <Eye className="w-4 h-4" /> Voir la trésorerie
                </button>
              )}
              {depense.purchase_order && (
                <button 
                  onClick={() => navigate(`/commandes-fournisseurs/${depense.purchase_order}`)}
                  className="btn btn-outline btn-sm w-full gap-2 justify-start"
                >
                  <Eye className="w-4 h-4" /> Voir le bon de commande
                </button>
              )}
              {depense.ecriture && (
                <button 
                  onClick={() => navigate(`/ecritures/${depense.ecriture}`)}
                  className="btn btn-outline btn-sm w-full gap-2 justify-start"
                >
                  <Eye className="w-4 h-4" /> Voir l'écriture comptable
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepenseDetail;