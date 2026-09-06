// src/components/finances/EcrituresList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  FileText, Plus, Search, Eye, Loader2,
  RefreshCw, X, CheckCircle, AlertCircle,
  Filter, ChevronLeft, ChevronRight,
  Calendar, Check, Ban, Clock
} from 'lucide-react';

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const EcrituresList = () => {
  // ==========================================================
  // HOOKS
  // ==========================================================
  const navigate = useNavigate();

  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [ecritures, setEcritures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statutFilter, setStatutFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  const [actionLoading, setActionLoading] = useState(false);

  // ==========================================================
  // FONCTIONS UTILITAIRES
  // ==========================================================
  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 FCFA';
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
      vente: { label: 'Vente', className: 'badge-success' },
      achat: { label: 'Achat', className: 'badge-primary' },
      paiement_client: { label: 'Paiement client', className: 'badge-info' },
      paiement_fournisseur: { label: 'Paiement fournisseur', className: 'badge-warning' },
      recette: { label: 'Recette', className: 'badge-success' },
      depense: { label: 'Dépense', className: 'badge-error' },
      tresorerie: { label: 'Trésorerie', className: 'badge-secondary' },
      regularisation: { label: 'Régularisation', className: 'badge-ghost' },
      autre: { label: 'Autre', className: 'badge-ghost' }
    };
    const config = configs[type] || { label: type, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  const getStatutBadge = (statut) => {
    const configs = {
      brouillon: { label: 'Brouillon', className: 'badge-ghost' },
      valide: { label: 'Validée', className: 'badge-success' },
      annulee: { label: 'Annulée', className: 'badge-error' }
    };
    const config = configs[statut] || { label: statut, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  // ==========================================================
  // REQUÊTES API
  // ==========================================================
  const fetchEcritures = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statutFilter !== 'all') params.append('statut', statutFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await AxiosInstance.get(`/ecritures-comptables/?${params.toString()}`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      setEcritures(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, typeFilter, statutFilter, dateFrom, dateTo, navigate]);

  // ==========================================================
  // EFFETS
  // ==========================================================
  useEffect(() => {
    fetchEcritures();
  }, [fetchEcritures]);

  // ==========================================================
  // ACTIONS
  // ==========================================================
  const handleValider = async (id) => {
    if (!window.confirm('Valider cette écriture ?')) return;
    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(`/ecritures-comptables/${id}/valider/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Écriture validée avec succès', 'success');
      fetchEcritures();
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors de la validation', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAnnuler = async (id) => {
    if (!window.confirm('Annuler cette écriture ?')) return;
    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(`/ecritures-comptables/${id}/annuler/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Écriture annulée avec succès', 'success');
      fetchEcritures();
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors de l\'annulation', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================================
  // FILTRES ET PAGINATION
  // ==========================================================
  const totalPages = Math.ceil(ecritures.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEcritures = ecritures.slice(startIndex, startIndex + itemsPerPage);

  // Statistiques
  const stats = {
    total: ecritures.length,
    brouillon: ecritures.filter(e => e.statut === 'brouillon').length,
    valide: ecritures.filter(e => e.statut === 'valide').length,
    annulee: ecritures.filter(e => e.statut === 'annulee').length
  };

  // ==========================================================
  // RENDU : CHARGEMENT
  // ==========================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-14 h-14 mx-auto" />
          <p className="text-lg font-medium text-gray-500">Chargement des écritures...</p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDU : COMPOSANT PRINCIPAL
  // ==========================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">

      {/* ======================================================
          NOTIFICATION
          ====================================================== */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================
          EN-TÊTE
          ====================================================== */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          {/* Titre */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Écritures comptables
              </h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Journal des écritures comptables –{' '}
              <span className="font-semibold text-gray-700">{stats.total}</span> écriture(s)
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchEcritures}
              className="btn btn-sm sm:btn-md btn-outline gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button
              onClick={() => navigate('/ecritures-comptables/nouveau')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" /> Nouvelle écriture
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================
          STATISTIQUES
          ====================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold text-primary">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Brouillon</p>
              <p className="text-xl font-bold text-warning">{stats.brouillon}</p>
            </div>
            <Clock className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Validées</p>
              <p className="text-xl font-bold text-success">{stats.valide}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Annulées</p>
              <p className="text-xl font-bold text-error">{stats.annulee}</p>
            </div>
            <Ban className="w-8 h-8 text-error/20" />
          </div>
        </div>
      </div>

      {/* ======================================================
          FILTRES
          ====================================================== */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col gap-3">

          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro ou description..."
              className="input input-bordered w-full pl-9"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              onKeyDown={(e) => e.key === 'Enter' && fetchEcritures()}
            />
          </div>

          {/* Bouton filtres mobile */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline btn-sm sm:hidden gap-2"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Masquer' : 'Filtres'}
          </button>

          {/* Filtres */}
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3`}>
            <select
              className="select select-bordered w-full"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tous les types</option>
              <option value="vente">Vente</option>
              <option value="achat">Achat</option>
              <option value="paiement_client">Paiement client</option>
              <option value="paiement_fournisseur">Paiement fournisseur</option>
              <option value="recette">Recette</option>
              <option value="depense">Dépense</option>
              <option value="tresorerie">Trésorerie</option>
              <option value="regularisation">Régularisation</option>
            </select>
            <select
              className="select select-bordered w-full"
              value={statutFilter}
              onChange={(e) => {
                setStatutFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="valide">Validée</option>
              <option value="annulee">Annulée</option>
            </select>
            <input
              type="date"
              className="input input-bordered w-full"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="Date début"
            />
            <input
              type="date"
              className="input input-bordered w-full"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="Date fin"
            />
          </div>
        </div>
      </div>

      {/* ======================================================
          TABLEAU
          ====================================================== */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4">N°</th>
                <th className="py-3 px-4 hidden lg:table-cell">Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 hidden md:table-cell">Type</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEcritures.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucune écriture trouvée</p>
                      <p className="text-sm text-gray-400">Ajustez vos filtres ou créez une écriture</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEcritures.map((ecriture) => (
                  <tr key={ecriture.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold">{ecriture.numero}</td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatDate(ecriture.date_ecriture)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-medium text-sm">{ecriture.description}</span>
                        {ecriture.reference && (
                          <p className="text-xs text-gray-400">Réf: {ecriture.reference}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">{getTypeBadge(ecriture.type)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-primary">
                      {formatCurrency(ecriture.montant)}
                    </td>
                    <td className="py-3 px-4 text-center">{getStatutBadge(ecriture.statut)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => navigate(`/ecritures-comptables/${ecriture.id}`)}
                          className="btn btn-ghost btn-sm btn-circle"
                          title="Voir"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {ecriture.statut === 'brouillon' && (
                          <>
                            <button
                              onClick={() => handleValider(ecriture.id)}
                              className="btn btn-ghost btn-sm btn-circle text-success"
                              title="Valider"
                              disabled={actionLoading}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAnnuler(ecriture.id)}
                              className="btn btn-ghost btn-sm btn-circle text-error"
                              title="Annuler"
                              disabled={actionLoading}
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ====================================================
            PAGINATION
            ==================================================== */}
        {ecritures.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Affichage de <span className="font-medium">{startIndex + 1}</span> à{' '}
              <span className="font-medium">{Math.min(currentPage * itemsPerPage, ecritures.length)}</span> sur{' '}
              <span className="font-medium">{ecritures.length}</span> écritures
            </div>
            <div className="flex items-center gap-3">
              <select
                className="select select-bordered select-sm"
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
              >
                <option value="5">5 lignes</option>
                <option value="10">10 lignes</option>
                <option value="20">20 lignes</option>
                <option value="50">50 lignes</option>
              </select>
              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="join-item btn btn-sm btn-disabled">
                  {currentPage} / {totalPages}
                </span>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EcrituresList;