// src/components/tresorerie/FraisDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Edit, Loader2, AlertCircle,
  Receipt, Building2, User, DollarSign,
  Calendar, Clock, FileText, CheckCircle,
  XCircle, CreditCard, Tag, Layers, Info,
  Link
} from 'lucide-react';

const FraisDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [frais, setFrais] = useState(null);
  const [error, setError] = useState(null);

  const getToken = () => localStorage.getItem('Token');

  useEffect(() => {
    const fetchFrais = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        const response = await AxiosInstance.get(`/frais/${id}/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        setFrais(response.data);
      } catch (err) {
        console.error('Erreur chargement frais:', err);
        setError(
          err.response?.status === 404
            ? 'Frais introuvable'
            : 'Erreur de chargement des données'
        );
        if (err.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFrais();
  }, [id, navigate]);

  // Helper pour le libellé des catégories
  const getCategorieLabel = (cat) => {
    const map = {
      'transport': 'Transport',
      'restauration': 'Restauration',
      'fournitures': 'Fournitures de bureau',
      'communication': 'Communication',
      'entretien': 'Entretien',
      'formation': 'Formation',
      'mission': 'Mission',
      'representations': 'Représentation',
      'assurances': 'Assurances',
      'impots': 'Impôts et taxes',
      'loyer': 'Loyer',
      'services': 'Services',
      'fournisseur': 'Paiement fournisseur',
      'autre': 'Autre'
    };
    return map[cat] || cat;
  };

  // Helper pour le badge de statut
  const getStatusBadge = (status) => {
    const map = {
      'brouillon': { label: 'Brouillon', color: 'badge-ghost' },
      'en_attente': { label: 'En attente', color: 'badge-warning' },
      'valide': { label: 'Validé', color: 'badge-info' },
      'paye': { label: 'Payé', color: 'badge-success' },
      'refuse': { label: 'Refusé', color: 'badge-error' },
      'annule': { label: 'Annulé', color: 'badge-error' }
    };
    const info = map[status] || { label: status, color: 'badge-ghost' };
    return <span className={`badge ${info.color} gap-1`}>{info.label}</span>;
  };

  // Helper pour le mode de paiement
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

  // Formatage des dates
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement du frais...</p>
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
            onClick={() => navigate('/frais')}
            className="btn btn-primary gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  if (!frais) {
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
                onClick={() => navigate('/frais')}
                className="btn btn-ghost btn-sm gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/15 rounded-xl">
                  <Receipt className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {frais.titre}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {frais.reference} • {getCategorieLabel(frais.categorie)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/frais/modifier/${frais.id}`)}
                className="btn btn-primary btn-sm gap-2"
              >
                <Edit className="w-4 h-4" /> Modifier
              </button>
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
                  <p className="font-mono font-medium">{frais.reference}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Titre</p>
                  <p className="font-medium">{frais.titre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Catégorie</p>
                  <p className="font-medium">
                    <span className="flex items-center gap-1">
                      <Tag className="w-4 h-4 text-primary" />
                      {getCategorieLabel(frais.categorie)}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Entrepôt</p>
                  <p className="font-medium">
                    {frais.warehouse_name || frais.warehouse || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bénéficiaire</p>
                  <p className="font-medium flex items-center gap-1">
                    <User className="w-4 h-4 text-gray-400" />
                    {frais.beneficiaire}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <p>{getStatusBadge(frais.status)}</p>
                </div>
                {frais.supplier && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <p className="text-sm text-gray-500">Fournisseur</p>
                    <p className="font-medium">
                      <Building2 className="w-4 h-4 inline mr-1 text-gray-400" />
                      {frais.supplier.name || frais.supplier}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Carte 2 : Montant et paiement */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> Montant et paiement
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Montant</p>
                  <p className="text-2xl font-bold text-error">
                    {Number(frais.montant).toLocaleString()} XOF
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mode de paiement</p>
                  <p className="font-medium flex items-center gap-1">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    {getModeLabel(frais.mode_paiement)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pièce justificative</p>
                  <p className="font-medium">{frais.piece_justificative || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Carte 3 : Dates */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Dates
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date du frais</p>
                  <p className="font-medium">{formatDate(frais.date_frais)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date de paiement</p>
                  <p className="font-medium">{formatDate(frais.date_paiement) || '-'}</p>
                </div>
                {frais.mouvement && (
                  <div>
                    <p className="text-sm text-gray-500">Mouvement associé</p>
                    <p className="font-medium">
                      <Link className="w-4 h-4 inline mr-1 text-primary" />
                      <span
                        className="text-primary hover:underline cursor-pointer"
                        onClick={() => navigate(`/mouvements-tresorerie/${frais.mouvement}`)}
                      >
                        {frais.mouvement.reference || frais.mouvement}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Carte 4 : Métadonnées et notes */}
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
                  <p className="font-medium">{formatDateTime(frais.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dernière modification</p>
                  <p className="font-medium">{formatDateTime(frais.updated_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Créé par</p>
                  <p className="font-medium">{frais.created_by || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Validé par</p>
                  <p className="font-medium">{frais.valide_par || '-'}</p>
                </div>
                {frais.date_validation && (
                  <div>
                    <p className="text-sm text-gray-500">Date de validation</p>
                    <p className="font-medium">{formatDateTime(frais.date_validation)}</p>
                  </div>
                )}
              </div>
              {frais.notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="font-medium whitespace-pre-wrap">{frais.notes}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FraisDetail;