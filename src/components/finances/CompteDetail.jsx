// src/components/finances/CompteDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Edit, Trash2, RefreshCw, Loader2,
  AlertCircle, Grid3x3, Building2, Wallet,
  TrendingUp, TrendingDown, DollarSign,
  Calendar, User, FileText, Eye
} from 'lucide-react';

const CompteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [compte, setCompte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ecritures, setEcritures] = useState([]);
  const [loadingEcritures, setLoadingEcritures] = useState(false);

  const getToken = () => localStorage.getItem('Token');

  const fetchCompte = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/comptes/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setCompte(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement du compte');
    } finally {
      setLoading(false);
    }
  };

  const fetchEcritures = async () => {
    setLoadingEcritures(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/comptes/${id}/ecritures/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setEcritures(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoadingEcritures(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCompte();
      fetchEcritures();
    }
  }, [id]);

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
      actif: { label: 'Actif', className: 'badge-success' },
      passif: { label: 'Passif', className: 'badge-error' },
      capitaux: { label: 'Capitaux propres', className: 'badge-primary' },
      produits: { label: 'Produits', className: 'badge-info' },
      charges: { label: 'Charges', className: 'badge-warning' }
    };
    const config = configs[type] || { label: type, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  const getStatutBadge = (isActive) => {
    return (
      <span className={`badge ${isActive ? 'badge-success' : 'badge-ghost'}`}>
        {isActive ? 'Actif' : 'Inactif'}
      </span>
    );
  };

  const getClasseLabel = (classe) => {
    const map = {
      '1': 'Classe 1 - Capital',
      '2': 'Classe 2 - Immobilisations',
      '3': 'Classe 3 - Stocks',
      '4': 'Classe 4 - Tiers',
      '5': 'Classe 5 - Trésorerie',
      '6': 'Classe 6 - Charges',
      '7': 'Classe 7 - Produits',
      '8': 'Classe 8 - Régularisation'
    };
    return map[classe] || classe;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement du compte...</p>
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
          <button onClick={() => navigate('/comptes')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  if (!compte) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-20 h-20 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Compte non trouvé</h2>
          <button onClick={() => navigate('/comptes')} className="btn btn-primary">
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
              onClick={() => navigate('/comptes')}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Grid3x3 className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {compte.numero} - {compte.nom}
                </h1>
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
            >
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button 
              onClick={() => navigate(`/comptes/${id}/modifier`)}
              className="btn btn-sm btn-warning gap-2"
            >
              <Edit className="w-4 h-4" /> Modifier
            </button>
          </div>
        </div>
      </div>

      {/* Informations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations générales */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Informations du compte
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-medium">Numéro</label>
                <p className="text-sm font-semibold text-gray-800">{compte.numero}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Nom</label>
                <p className="text-sm font-semibold text-gray-800">{compte.nom}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Nom complet</label>
                <p className="text-sm text-gray-600">{compte.nom_complet || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Type</label>
                <div className="mt-1">{getTypeBadge(compte.type)}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Classe</label>
                <p className="text-sm font-semibold text-gray-800">{getClasseLabel(compte.classe)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Statut</label>
                <div className="mt-1">{getStatutBadge(compte.is_active)}</div>
              </div>
              {compte.parent_nom && (
                <div>
                  <label className="text-xs text-gray-500 font-medium">Compte parent</label>
                  <p className="text-sm font-semibold text-primary">{compte.parent_nom}</p>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 font-medium">Solde</label>
                <p className="text-lg font-bold text-primary">{formatCurrency(compte.solde)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Solde initial</label>
                <p className="text-sm font-semibold text-gray-800">{formatCurrency(compte.solde_initial)}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 font-medium">Notes</label>
                <p className="text-sm text-gray-600">{compte.notes || 'Aucune note'}</p>
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
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            {loadingEcritures ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-primary w-8 h-8" />
              </div>
            ) : ecritures.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucune écriture pour ce compte</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-sm">
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
                    {ecritures.slice(0, 10).map(ecriture => (
                      <tr key={ecriture.id} className="hover:bg-gray-50">
                        <td className="font-mono text-sm">{ecriture.numero}</td>
                        <td className="text-sm">{formatDate(ecriture.date_ecriture)}</td>
                        <td className="text-sm">{ecriture.description}</td>
                        <td className="text-right text-sm font-semibold text-success">
                          {ecriture.compte_debit === compte.id ? formatCurrency(ecriture.montant) : '-'}
                        </td>
                        <td className="text-right text-sm font-semibold text-error">
                          {ecriture.compte_credit === compte.id ? formatCurrency(ecriture.montant) : '-'}
                        </td>
                        <td>
                          <span className={`badge badge-sm ${ecriture.statut === 'valide' ? 'badge-success' : 'badge-ghost'}`}>
                            {ecriture.statut || 'Brouillon'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {ecritures.length > 10 && (
                  <div className="text-center mt-2">
                    <button className="btn btn-ghost btn-sm text-primary">
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
              <p className="text-3xl font-bold text-primary">{formatCurrency(compte.solde)}</p>
              <p className="text-xs text-gray-400 mt-1">Solde actuel</p>
              <div className="divider my-3"></div>
              <div className="flex justify-around">
                <div>
                  <p className="text-sm text-gray-500">Débit</p>
                  <p className="text-sm font-semibold text-success">+{formatCurrency(compte.solde)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Crédit</p>
                  <p className="text-sm font-semibold text-error">-{formatCurrency(compte.solde)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Actions</h2>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => navigate(`/comptes/${id}/modifier`)}
                className="btn btn-warning btn-sm w-full gap-2 justify-start"
              >
                <Edit className="w-4 h-4" /> Modifier le compte
              </button>
              <button 
                onClick={() => navigate(`/comptes/ecritures?compte=${id}`)}
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

export default CompteDetail;