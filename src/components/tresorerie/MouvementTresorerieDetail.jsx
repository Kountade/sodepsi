// src/components/tresorerie/MouvementTresorerieDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Edit, Loader2, AlertCircle, Ban,
  TrendingUp, TrendingDown, Repeat,
  DollarSign, Building2, Wallet, Calendar,
  Clock, Hash, FileText, Info, CheckCircle,
  XCircle, CreditCard, Layers
} from 'lucide-react';

const MouvementTresorerieDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [mouvement, setMouvement] = useState(null);
  const [error, setError] = useState(null);
  const [annulationEnCours, setAnnulationEnCours] = useState(false);

  const getToken = () => localStorage.getItem('Token');

  const fetchMouvement = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/mouvements/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setMouvement(response.data);
    } catch (err) {
      console.error('Erreur chargement mouvement:', err);
      setError(
        err.response?.status === 404
          ? 'Mouvement introuvable'
          : 'Erreur de chargement des données'
      );
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMouvement();
  }, [id, navigate]);

  const handleAnnuler = async () => {
    if (!window.confirm('Voulez-vous vraiment annuler ce mouvement ?')) return;
    setAnnulationEnCours(true);
    try {
      const token = getToken();
      await AxiosInstance.post(`/mouvements/${id}/annuler/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      // Recharger les données pour afficher le nouveau statut
      await fetchMouvement();
    } catch (error) {
      console.error('Erreur annulation:', error);
      alert('Erreur lors de l\'annulation du mouvement.');
    } finally {
      setAnnulationEnCours(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'encaissement': return <TrendingUp className="w-5 h-5 text-success" />;
      case 'decaissement': return <TrendingDown className="w-5 h-5 text-error" />;
      case 'transfert': return <Repeat className="w-5 h-5 text-primary" />;
      default: return <DollarSign className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type) => {
    const map = {
      'encaissement': 'Encaissement',
      'decaissement': 'Décaissement',
      'transfert': 'Transfert'
    };
    return map[type] || type;
  };

  const getTypeBadgeColor = (type) => {
    const map = {
      'encaissement': 'badge-success',
      'decaissement': 'badge-error',
      'transfert': 'badge-primary'
    };
    return map[type] || 'badge-ghost';
  };

  const getStatusBadge = (status) => {
    const map = {
      'planifie': { label: 'Planifié', color: 'badge-ghost' },
      'en_attente': { label: 'En attente', color: 'badge-warning' },
      'effectue': { label: 'Effectué', color: 'badge-success' },
      'annule': { label: 'Annulé', color: 'badge-error' },
      'rejete': { label: 'Rejeté', color: 'badge-error' }
    };
    const info = map[status] || { label: status, color: 'badge-ghost' };
    return <span className={`badge ${info.color} gap-1`}>{info.label}</span>;
  };

  const getModeLabel = (mode) => {
    const map = {
      'especes': 'Espèces',
      'carte': 'Carte bancaire',
      'cheque': 'Chèque',
      'virement': 'Virement',
      'mobile_money': 'Mobile Money',
      'prelevement': 'Prélèvement',
      'autre': 'Autre'
    };
    return map[mode] || mode;
  };

  const getSourceTypeLabel = (source) => {
    const map = {
      'vente': 'Vente',
      'achat': 'Achat',
      'facture_client': 'Facture client',
      'facture_fournisseur': 'Facture fournisseur',
      'paiement_client': 'Paiement client',
      'paiement_fournisseur': 'Paiement fournisseur',
      'salaire': 'Salaire',
      'frais': 'Frais',
      'caisse': 'Caisse',
      'compte_bancaire': 'Compte bancaire',
      'transfert_interne': 'Transfert interne',
      'autre': 'Autre'
    };
    return map[source] || source;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement du mouvement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <AlertCircle className="text-error w-16 h-16 mx-auto" />
          <p className="text-lg font-semibold text-error">{error}</p>
          <button
            onClick={() => navigate('/mouvements-tresorerie')}
            className="btn btn-primary gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  if (!mouvement) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header */}
      <div className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/mouvements-tresorerie')}
                className="btn btn-ghost btn-sm gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/15 rounded-xl">
                  {getTypeIcon(mouvement.type_mouvement)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {mouvement.reference}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {getTypeLabel(mouvement.type_mouvement)} • {mouvement.libelle}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/mouvements-tresorerie/modifier/${mouvement.id}`)}
                className="btn btn-primary btn-sm gap-2"
              >
                <Edit className="w-4 h-4" /> Modifier
              </button>
              {mouvement.status === 'effectue' && (
                <button
                  onClick={handleAnnuler}
                  className="btn btn-warning btn-sm gap-2"
                  disabled={annulationEnCours}
                >
                  {annulationEnCours ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Ban className="w-4 h-4" />
                  )}
                  Annuler
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">

          {/* Carte 1 : Informations générales */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> Informations générales
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Référence</p>
                  <p className="font-mono font-medium">{mouvement.reference}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium flex items-center gap-1">
                    {getTypeIcon(mouvement.type_mouvement)}
                    {getTypeLabel(mouvement.type_mouvement)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <p>{getStatusBadge(mouvement.status)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Entrepôt</p>
                  <p className="font-medium">
                    {mouvement.warehouse_name || mouvement.warehouse || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Source</p>
                  <p className="font-medium">
                    {getSourceTypeLabel(mouvement.source_type)}
                    {mouvement.source_reference && (
                      <span className="ml-1 text-gray-500 text-sm">
                        ({mouvement.source_reference})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Référence externe</p>
                  <p className="font-medium">{mouvement.reference_externe || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pièce justificative</p>
                  <p className="font-medium">{mouvement.piece_justificative || '-'}</p>
                </div>
                <div className="lg:col-span-2">
                  <p className="text-sm text-gray-500">Libellé</p>
                  <p className="font-medium">{mouvement.libelle}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Carte 2 : Montant et mode */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> Montant et mode de paiement
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Montant</p>
                  <p className={`text-2xl font-bold ${mouvement.type_mouvement === 'encaissement' ? 'text-success' : 'text-error'}`}>
                    {mouvement.type_mouvement === 'encaissement' ? '+' : '-'}
                    {Number(mouvement.montant).toLocaleString()} {mouvement.devise || 'XOF'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mode de paiement</p>
                  <p className="font-medium">{getModeLabel(mouvement.mode_paiement)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rapproché</p>
                  <p className="font-medium">
                    {mouvement.rapproche ? (
                      <span className="badge badge-success gap-1">
                        <CheckCircle className="w-3 h-3" /> Oui
                      </span>
                    ) : (
                      <span className="badge badge-ghost gap-1">
                        <XCircle className="w-3 h-3" /> Non
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Carte 3 : Caisse / Compte bancaire */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" /> Caisse ou compte bancaire
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mouvement.caisse ? (
                  <div>
                    <p className="text-sm text-gray-500">Caisse</p>
                    <p className="font-medium flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-primary" />
                      {mouvement.caisse.nom || mouvement.caisse}
                    </p>
                  </div>
                ) : mouvement.compte_bancaire ? (
                  <div>
                    <p className="text-sm text-gray-500">Compte bancaire</p>
                    <p className="font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      {mouvement.compte_bancaire.nom || mouvement.compte_bancaire}
                    </p>
                  </div>
                ) : (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Aucune caisse ou compte associé</p>
                    <p className="text-gray-400">-</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Carte 4 : Dates */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Dates
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date du mouvement</p>
                  <p className="font-medium">{formatDate(mouvement.date_mouvement)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date de valeur</p>
                  <p className="font-medium">{formatDateShort(mouvement.date_valeur)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date prévue</p>
                  <p className="font-medium">{formatDateShort(mouvement.date_prevue) || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Carte 5 : Liens vers les entités */}
          { (mouvement.vente || mouvement.purchase_order || mouvement.facture_vente || mouvement.paiement) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Entités liées
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {mouvement.vente && (
                    <div>
                      <p className="text-sm text-gray-500">Vente</p>
                      <p className="font-medium">{mouvement.vente.reference || mouvement.vente}</p>
                    </div>
                  )}
                  {mouvement.purchase_order && (
                    <div>
                      <p className="text-sm text-gray-500">Commande fournisseur</p>
                      <p className="font-medium">{mouvement.purchase_order.reference || mouvement.purchase_order}</p>
                    </div>
                  )}
                  {mouvement.facture_vente && (
                    <div>
                      <p className="text-sm text-gray-500">Facture vente</p>
                      <p className="font-medium">{mouvement.facture_vente.numero || mouvement.facture_vente}</p>
                    </div>
                  )}
                  {mouvement.paiement && (
                    <div>
                      <p className="text-sm text-gray-500">Paiement</p>
                      <p className="font-medium">{mouvement.paiement.reference || mouvement.paiement}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Carte 6 : Métadonnées et notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Métadonnées
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Créé le</p>
                  <p className="font-medium">{formatDate(mouvement.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dernière modification</p>
                  <p className="font-medium">{formatDate(mouvement.updated_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Créé par</p>
                  <p className="font-medium">{mouvement.created_by || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Validé par</p>
                  <p className="font-medium">{mouvement.valide_par || '-'}</p>
                </div>
                {mouvement.date_validation && (
                  <div>
                    <p className="text-sm text-gray-500">Date de validation</p>
                    <p className="font-medium">{formatDate(mouvement.date_validation)}</p>
                  </div>
                )}
                {mouvement.date_rapprochement && (
                  <div>
                    <p className="text-sm text-gray-500">Date de rapprochement</p>
                    <p className="font-medium">{formatDateShort(mouvement.date_rapprochement)}</p>
                  </div>
                )}
              </div>
              {mouvement.notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="font-medium whitespace-pre-wrap">{mouvement.notes}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MouvementTresorerieDetail;