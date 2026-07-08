// src/components/finances/TresorerieDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Edit, Trash2, RefreshCw, Loader2,
  AlertCircle, Wallet, Building2, CreditCard,
  Landmark, Smartphone, DollarSign, TrendingUp,
  TrendingDown, Calendar, User, FileText, Eye,
  CheckCircle, XCircle, Plus, Send, Receipt
} from 'lucide-react';

const TresorerieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tresorerie, setTresorerie] = useState(null);
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMouvements, setLoadingMouvements] = useState(false);
  const [error, setError] = useState(null);

  const getToken = () => localStorage.getItem('Token');

  const fetchTresorerie = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/tresorerie/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setTresorerie(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement de la trésorerie');
    } finally {
      setLoading(false);
    }
  };

  const fetchMouvements = async () => {
    setLoadingMouvements(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/tresorerie/${id}/mouvements/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setMouvements(response.data.slice(0, 10));
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoadingMouvements(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTresorerie();
      fetchMouvements();
    }
  }, [id]);

  const handleUpdateSolde = async () => {
    try {
      const token = getToken();
      await AxiosInstance.post(`/tresorerie/${id}/update_solde/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      fetchTresorerie();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette trésorerie ?')) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/tresorerie/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      navigate('/tresorerie');
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
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  const getTypeBadge = (type) => {
    const configs = {
      banque: { label: 'Banque', className: 'badge-primary', icon: Landmark },
      caisse: { label: 'Caisse', className: 'badge-success', icon: Wallet },
      especes: { label: 'Espèces', className: 'badge-warning', icon: DollarSign },
      mobile_money: { label: 'Mobile Money', className: 'badge-secondary', icon: Smartphone },
      virement: { label: 'Virement', className: 'badge-info', icon: CreditCard }
    };
    const config = configs[type] || { label: type, className: 'badge-ghost', icon: Wallet };
    const Icon = config.icon;
    return (
      <span className={`badge ${config.className} gap-1 text-sm`}>
        <Icon className="w-4 h-4" /> {config.label}
      </span>
    );
  };

  const getMouvementTypeBadge = (type) => {
    if (type === 'entree') {
      return <span className="badge badge-success gap-1"><TrendingUp className="w-3 h-3" /> Entrée</span>;
    }
    return <span className="badge badge-error gap-1"><TrendingDown className="w-3 h-3" /> Sortie</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement de la trésorerie...</p>
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
          <button onClick={() => navigate('/tresorerie')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  if (!tresorerie) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-20 h-20 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Trésorerie non trouvée</h2>
          <button onClick={() => navigate('/tresorerie')} className="btn btn-primary">
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
              onClick={() => navigate('/tresorerie')}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {tresorerie.nom}
                </h1>
                <span className={`badge ${tresorerie.is_active ? 'badge-success' : 'badge-ghost'}`}>
                  {tresorerie.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <p className="text-sm text-gray-500 ml-1">
                {tresorerie.code} - {getTypeBadge(tresorerie.type)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={fetchTresorerie}
              className="btn btn-sm btn-outline gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button 
              onClick={handleUpdateSolde}
              className="btn btn-sm btn-outline gap-2 text-info"
            >
              <RefreshCw className="w-4 h-4" /> Mettre à jour solde
            </button>
            <button 
              onClick={() => navigate(`/tresorerie/${id}/modifier`)}
              className="btn btn-sm btn-warning gap-2"
            >
              <Edit className="w-4 h-4" /> Modifier
            </button>
            <button 
              onClick={() => navigate(`/mouvements-tresorerie/nouveau?tresorerie=${id}`)}
              className="btn btn-sm btn-primary gap-2"
            >
              <Plus className="w-4 h-4" /> Nouveau mouvement
            </button>
          </div>
        </div>
      </div>

      {/* Solde */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-primary/5 rounded-xl">
            <p className="text-xs text-gray-500">Solde actuel</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(tresorerie.solde_actuel)}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">Solde initial</p>
            <p className="text-lg font-semibold text-gray-800">{formatCurrency(tresorerie.solde_initial)}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">Solde minimum</p>
            <p className="text-lg font-semibold text-gray-800">{formatCurrency(tresorerie.solde_minimum)}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">Statut</p>
            <p className="text-lg font-semibold">
              {tresorerie.solde_actuel > tresorerie.solde_minimum ? (
                <span className="text-success">✅ Sain</span>
              ) : (
                <span className="text-error">⚠️ Alerte</span>
              )}
            </p>
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
              Détails de la trésorerie
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-medium">Nom</label>
                <p className="text-sm font-semibold text-gray-800">{tresorerie.nom}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Code</label>
                <p className="text-sm font-semibold text-gray-800">{tresorerie.code}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Type</label>
                <div className="mt-1">{getTypeBadge(tresorerie.type)}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Banque</label>
                <p className="text-sm font-semibold text-gray-800">{tresorerie.banque || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Titulaire</label>
                <p className="text-sm font-semibold text-gray-800">{tresorerie.titulaire || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">IBAN</label>
                <p className="text-sm font-semibold text-gray-800">{tresorerie.iban || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">BIC/SWIFT</label>
                <p className="text-sm font-semibold text-gray-800">{tresorerie.bic || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Par défaut</label>
                <p className="text-sm font-semibold text-gray-800">{tresorerie.is_default ? '✅ Oui' : '❌ Non'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 font-medium">Notes</label>
                <p className="text-sm text-gray-600">{tresorerie.notes || 'Aucune note'}</p>
              </div>
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
                <p className="text-sm font-semibold text-gray-800">{tresorerie.created_by_name || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Créé le</label>
                <p className="text-sm text-gray-600">{formatDate(tresorerie.created_at)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Dernière mise à jour</label>
                <p className="text-sm text-gray-600">{formatDate(tresorerie.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Actions</h2>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => navigate(`/mouvements-tresorerie?tresorerie=${id}`)}
                className="btn btn-outline btn-sm w-full gap-2 justify-start"
              >
                <Eye className="w-4 h-4" /> Voir tous les mouvements
              </button>
              <button 
                onClick={() => navigate(`/mouvements-tresorerie/nouveau?tresorerie=${id}`)}
                className="btn btn-primary btn-sm w-full gap-2 justify-start"
              >
                <Plus className="w-4 h-4" /> Ajouter un mouvement
              </button>
              <button 
                onClick={handleDelete}
                className="btn btn-error btn-sm w-full gap-2 justify-start"
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Derniers mouvements */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Derniers mouvements
          </h2>
          <button 
            onClick={() => navigate(`/mouvements-tresorerie?tresorerie=${id}`)}
            className="btn btn-ghost btn-sm text-primary"
          >
            Voir tout →
          </button>
        </div>
        {loadingMouvements ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-primary w-8 h-8" />
          </div>
        ) : mouvements.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucun mouvement pour cette trésorerie</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Catégorie</th>
                  <th className="text-right">Montant</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {mouvements.map(mouvement => (
                  <tr key={mouvement.id} className="hover:bg-gray-50">
                    <td className="text-sm">{formatDate(mouvement.date_mouvement)}</td>
                    <td>{getMouvementTypeBadge(mouvement.type)}</td>
                    <td className="text-sm">{mouvement.categorie || '-'}</td>
                    <td className={`text-right font-semibold ${mouvement.type === 'entree' ? 'text-success' : 'text-error'}`}>
                      {mouvement.type === 'entree' ? '+' : '-'} {formatCurrency(mouvement.montant)}
                    </td>
                    <td className="text-sm">{mouvement.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TresorerieDetail;