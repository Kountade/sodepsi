// src/components/tresorerie/PrevisionsDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Edit, Loader2, AlertCircle,
  Target, Building2, DollarSign, Calendar,
  Clock, Layers, Hash, CheckCircle, XCircle,
  TrendingUp, TrendingDown, Percent, BarChart3,
  Info, Trash2
} from 'lucide-react';

const PrevisionsDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [prevision, setPrevision] = useState(null);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const getToken = () => localStorage.getItem('Token');

  const fetchPrevision = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/previsions/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setPrevision(response.data);
    } catch (err) {
      console.error('Erreur chargement prévision:', err);
      setError(
        err.response?.status === 404
          ? 'Prévision introuvable'
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
    fetchPrevision();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette prévision ?')) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/previsions/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      navigate('/previsions');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  // --- Utilitaires sécurisés ---
  const getTypeLabel = (type) => (type === 'entree' ? 'Entrée prévue' : 'Sortie prévue');
  const getTypeBadge = (type) => {
    const map = { 'entree': 'badge-success', 'sortie': 'badge-error' };
    return <span className={`badge ${map[type] || 'badge-ghost'}`}>{getTypeLabel(type)}</span>;
  };

  const getPeriodeLabel = (periode) => {
    const map = {
      'journalier': 'Journalier',
      'hebdomadaire': 'Hebdomadaire',
      'mensuel': 'Mensuel',
      'trimestriel': 'Trimestriel',
      'annuel': 'Annuel'
    };
    return map[periode] || periode;
  };

  const getStatutBadge = (statut) => {
    const map = {
      'brouillon': { label: 'Brouillon', color: 'badge-ghost' },
      'en_cours': { label: 'En cours', color: 'badge-warning' },
      'valide': { label: 'Validée', color: 'badge-info' },
      'realise': { label: 'Réalisé', color: 'badge-success' },
      'annule': { label: 'Annulé', color: 'badge-error' },
      'ecart': { label: 'Écart constaté', color: 'badge-error' }
    };
    const info = map[statut] || { label: statut, color: 'badge-ghost' };
    return <span className={`badge ${info.color}`}>{info.label}</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  // --- Rendu de chargement ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement de la prévision...</p>
        </div>
      </div>
    );
  }

  // --- Rendu d'erreur ---
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <AlertCircle className="text-error w-16 h-16 mx-auto" />
          <p className="text-lg font-semibold text-error">{error}</p>
          <button
            onClick={() => navigate('/previsions')}
            className="btn btn-primary gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  // --- Sécurité si prevision est null ---
  if (!prevision) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  // --- Rendu principal ---
  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header */}
      <div className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/previsions')}
                className="btn btn-ghost btn-sm gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/15 rounded-xl">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {prevision.titre || 'Sans titre'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {prevision.reference || 'N/A'} • {getTypeLabel(prevision.type_prevision)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/previsions/modifier/${prevision.id}`)}
                className="btn btn-primary btn-sm gap-2"
              >
                <Edit className="w-4 h-4" /> Modifier
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-error btn-sm gap-2"
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de suppression */}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer cette prévision ?</p>
              <p className="font-semibold text-error mt-2">{prevision.titre || 'Sans titre'}</p>
              <p className="text-sm text-gray-500 mt-1">{prevision.reference || 'N/A'}</p>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button className="btn btn-ghost flex-1" onClick={() => setShowDeleteModal(false)}>Annuler</button>
              <button className="btn btn-error flex-1 gap-2" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <p className="font-mono font-medium">{prevision.reference || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Titre</p>
                  <p className="font-medium">{prevision.titre || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{getTypeBadge(prevision.type_prevision)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Période</p>
                  <p className="font-medium">{getPeriodeLabel(prevision.periode)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Entrepôt</p>
                  <p className="font-medium">
                    {prevision.warehouse_name || prevision.warehouse || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <p>{getStatutBadge(prevision.statut)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Probabilité</p>
                  <p className="font-medium">
                    <span className="flex items-center gap-1">
                      <Percent className="w-4 h-4 text-primary" />
                      {prevision.probabilite || 0}%
                    </span>
                  </p>
                </div>
                {prevision.categorie && (
                  <div>
                    <p className="text-sm text-gray-500">Catégorie</p>
                    <p className="font-medium">{prevision.categorie}</p>
                  </div>
                )}
                {prevision.sous_categorie && (
                  <div>
                    <p className="text-sm text-gray-500">Sous-catégorie</p>
                    <p className="font-medium">{prevision.sous_categorie}</p>
                  </div>
                )}
                {prevision.source_type && (
                  <div>
                    <p className="text-sm text-gray-500">Source</p>
                    <p className="font-medium">
                      {prevision.source_type}
                      {prevision.source_id && ` #${prevision.source_id}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Carte 2 : Montants et écart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> Montants et écart
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Montant prévu</p>
                  <p className="text-xl font-bold text-primary">
                    {Number(prevision.montant_prevu || 0).toLocaleString()} XOF
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Montant réel</p>
                  <p className="text-xl font-bold text-info">
                    {Number(prevision.montant_reel || 0).toLocaleString()} XOF
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Écart</p>
                  <p className={`text-xl font-bold ${(prevision.ecart || 0) >= 0 ? 'text-success' : 'text-error'}`}>
                    {(prevision.ecart || 0) >= 0 ? '+' : ''}{Number(prevision.ecart || 0).toLocaleString()} XOF
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pourcentage d'écart</p>
                  <p className={`text-xl font-bold ${(prevision.pourcentage_ecart || 0) >= 0 ? 'text-success' : 'text-error'}`}>
                    {(prevision.pourcentage_ecart || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Info className="w-4 h-4" />
                  <span>
                    {(prevision.ecart || 0) >= 0
                      ? 'Réalisé supérieur au prévu (bonne performance)'
                      : 'Réalisé inférieur au prévu (écart négatif)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Carte 3 : Période */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Période de prévision
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date début</p>
                  <p className="font-medium">{formatDate(prevision.date_debut)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date fin</p>
                  <p className="font-medium">{formatDate(prevision.date_fin)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Durée</p>
                  <p className="font-medium">
                    {prevision.date_debut && prevision.date_fin
                      ? `${Math.ceil((new Date(prevision.date_fin) - new Date(prevision.date_debut)) / (1000 * 60 * 60 * 24))} jours`
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Carte 4 : Métadonnées */}
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
                  <p className="font-medium">{formatDateTime(prevision.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dernière modification</p>
                  <p className="font-medium">{formatDateTime(prevision.updated_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Créé par</p>
                  <p className="font-medium">{prevision.created_by || '-'}</p>
                </div>
                {prevision.notes && (
                  <div className="lg:col-span-2">
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="font-medium whitespace-pre-wrap">{prevision.notes}</p>
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

export default PrevisionsDetail;