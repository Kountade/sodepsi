// src/components/station/PrixCarburantList.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Search, RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Trash2, Edit, Filter, BadgeDollarSign, Fuel,
  Droplet, TrendingUp, TrendingDown, Clock, Calendar,
  Award, Server, Activity, ChevronLeft, ChevronRight
} from 'lucide-react';

const PrixCarburantList = () => {
  const navigate = useNavigate();

  // États
  const [prix, setPrix] = useState([]);
  const [cuves, setCuves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [cuveFilter, setCuveFilter] = useState('all');
  const [actifFilter, setActifFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [prixToDelete, setPrixToDelete] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    actifs: 0,
    inactifs: 0,
    prixMoyen: 0,
    prixMin: 0,
    prixMax: 0,
  });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');
  const formatNumber = (n) => new Intl.NumberFormat('fr-FR').format(parseFloat(n || 0));
  const formatCurrency = (n) => new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'XOF'
  }).format(parseFloat(n || 0)).replace('XOF', 'FCFA');
  const formatDate = (d) => d ? new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : '';
  const formatDateShort = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '';

  // Charger les cuves
  const fetchCuves = async () => {
    try {
      const token = getToken();
      const res = await AxiosInstance.get('/cuves/', {
        headers: { Authorization: `Token ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setCuves(data);
    } catch (e) { console.error(e); }
  };

  // Charger les prix
  const fetchPrix = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (cuveFilter !== 'all') params.append('cuve', cuveFilter);
      if (actifFilter === 'actif') params.append('est_actif', 'true');
      if (actifFilter === 'inactif') params.append('est_actif', 'false');

      let url = '/prix-carburant/';
      if (params.toString()) url += `?${params.toString()}`;

      const res = await AxiosInstance.get(url, {
        headers: { Authorization: `Token ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setPrix(data);

      // Stats
      const actifs = data.filter(p => p.est_actif);
      const prixValues = data.map(p => parseFloat(p.prix_litre || 0));
      setStats({
        total: data.length,
        actifs: actifs.length,
        inactifs: data.length - actifs.length,
        prixMoyen: prixValues.length > 0
          ? prixValues.reduce((a, b) => a + b, 0) / prixValues.length
          : 0,
        prixMin: prixValues.length > 0 ? Math.min(...prixValues) : 0,
        prixMax: prixValues.length > 0 ? Math.max(...prixValues) : 0,
      });
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCuves();
  }, []);

  useEffect(() => {
    fetchPrix();
    setCurrentPage(1);
  }, [cuveFilter, actifFilter]);

  // Recherche locale
  const filteredPrix = useMemo(() => {
    if (!searchTerm) return prix;
    const q = searchTerm.toLowerCase();
    return prix.filter(p => {
      const cuve = cuves.find(c => c.id === p.cuve);
      return (
        (cuve?.nom || '').toLowerCase().includes(q) ||
        (cuve?.code || '').toLowerCase().includes(q) ||
        (p.notes || '').toLowerCase().includes(q)
      );
    });
  }, [prix, cuves, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredPrix.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPrix = filteredPrix.slice(startIndex, startIndex + itemsPerPage);

  const getCuveInfo = (id) => cuves.find(c => c.id === id);

  const handleDelete = async () => {
    if (!prixToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/prix-carburant/${prixToDelete.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Prix supprimé', 'success');
      setShowDeleteModal(false);
      setPrixToDelete(null);
      fetchPrix();
    } catch (err) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const handleToggleActif = async (prixItem) => {
    try {
      const token = getToken();
      await AxiosInstance.patch(`/prix-carburant/${prixItem.id}/`, {
        est_actif: !prixItem.est_actif,
      }, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification(
        prixItem.est_actif ? 'Prix désactivé' : 'Prix activé',
        'success'
      );
      fetchPrix();
    } catch (err) {
      showNotification('Erreur lors de la mise à jour', 'error');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCuveFilter('all');
    setActifFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || cuveFilter !== 'all' || actifFilter !== 'all';

  return (
    <div className="space-y-4 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium text-sm">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification({ ...notification, show: false })}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {showDeleteModal && prixToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer ce prix ?</p>
              <p className="font-semibold text-error mt-2">
                {formatCurrency(prixToDelete.prix_litre)} / L
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Cuve : {getCuveInfo(prixToDelete.cuve)?.nom || '—'}
              </p>
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

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <BadgeDollarSign className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Gestion des Prix Carburant
              </h1>
              <p className="text-sm text-gray-500">
                Historique et configuration des prix par cuve – {stats.total} prix
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchPrix} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button
              onClick={() => navigate('/prix-carburant/nouveau')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" /> Nouveau prix
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total prix</p>
              <p className="text-xl font-bold text-primary">{stats.total}</p>
            </div>
            <BadgeDollarSign className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3 border-l-4 border-success">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Actifs</p>
              <p className="text-xl font-bold text-success">{stats.actifs}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3 border-l-4 border-info">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Prix moyen</p>
              <p className="text-lg font-bold text-info">
                {formatNumber(stats.prixMoyen)} FCFA
              </p>
            </div>
            <Activity className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3 border-l-4 border-warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Fourchette</p>
              <p className="text-sm font-bold text-warning">
                {formatNumber(stats.prixMin)} – {formatNumber(stats.prixMax)}
              </p>
              <p className="text-[10px] text-gray-500">FCFA/L</p>
            </div>
            <TrendingUp className="w-8 h-8 text-warning/20" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par cuve, code ou notes..."
                className="input input-bordered w-full pl-9"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'} gap-2 lg:hidden`}
            >
              <Filter className="w-4 h-4" />
              Filtres
              {hasActiveFilters && <span className="badge badge-error badge-xs">!</span>}
            </button>
          </div>

          <div className={`${showFilters ? 'grid' : 'hidden'} lg:grid grid-cols-1 sm:grid-cols-3 gap-3`}>
            <select
              className="select select-bordered w-full"
              value={cuveFilter}
              onChange={(e) => setCuveFilter(e.target.value)}
            >
              <option value="all">Toutes les cuves</option>
              {cuves.map(c => (
                <option key={c.id} value={c.id}>{c.nom} ({c.code})</option>
              ))}
            </select>

            <select
              className="select select-bordered w-full"
              value={actifFilter}
              onChange={(e) => setActifFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="actif">Actifs</option>
              <option value="inactif">Inactifs</option>
            </select>

            <button
              onClick={resetFilters}
              className="btn btn-outline gap-2"
              disabled={!hasActiveFilters}
            >
              <RefreshCw className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-gray-500 mt-4">Chargement des prix...</p>
          </div>
        ) : paginatedPrix.length === 0 ? (
          <div className="py-16 text-center">
            <BadgeDollarSign className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-2">Aucun prix trouvé</p>
            {hasActiveFilters ? (
              <button onClick={resetFilters} className="btn btn-sm btn-outline gap-2">
                <RefreshCw className="w-4 h-4" /> Réinitialiser
              </button>
            ) : (
              <button
                onClick={() => navigate('/prix-carburant/nouveau')}
                className="btn btn-primary btn-sm gap-2"
              >
                <Plus className="w-4 h-4" /> Nouveau prix
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th>Cuve</th>
                    <th className="text-center">Type carburant</th>
                    <th className="text-right">Prix / L</th>
                    <th className="hidden md:table-cell">Date d'application</th>
                    <th className="hidden lg:table-cell">Fin</th>
                    <th className="text-center">Statut</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPrix.map(p => {
                    const cuve = getCuveInfo(p.cuve);
                    return (
                      <tr key={p.id} className={`hover:bg-gray-50 ${p.est_actif ? '' : 'opacity-60'}`}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${p.est_actif ? 'bg-primary/10' : 'bg-gray-100'}`}>
                              <Fuel className={`w-5 h-5 ${p.est_actif ? 'text-primary' : 'text-gray-400'}`} />
                            </div>
                            <div>
                              <p className="font-semibold">{cuve?.nom || 'Cuve inconnue'}</p>
                              <p className="text-xs text-gray-500">{cuve?.code || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          {cuve ? (
                            <span className="badge badge-info badge-sm gap-1">
                              <Droplet className="w-3 h-3" />
                              {cuve.type_carburant_display}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="text-right">
                          <span className="font-bold text-primary text-lg">
                            {formatNumber(p.prix_litre)} FCFA
                          </span>
                        </td>
                        <td className="hidden md:table-cell text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {formatDate(p.date_application)}
                          </div>
                        </td>
                        <td className="hidden lg:table-cell text-sm text-gray-600">
                          {p.date_fin ? formatDate(p.date_fin) : (
                            <span className="badge badge-success badge-xs">En cours</span>
                          )}
                        </td>
                        <td className="text-center">
                          <button
                            onClick={() => handleToggleActif(p)}
                            className={`badge cursor-pointer transition-colors ${
                              p.est_actif
                                ? 'badge-success hover:badge-error'
                                : 'badge-ghost hover:badge-success'
                            }`}
                            title={p.est_actif ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}
                          >
                            {p.est_actif ? 'Actif' : 'Inactif'}
                          </button>
                        </td>
                        <td className="text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => navigate(`/prix-carburant/${p.id}`)}
                              className="btn btn-ghost btn-sm btn-circle"
                              title="Voir détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/prix-carburant/${p.id}/modifier`)}
                              className="btn btn-ghost btn-sm btn-circle"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setPrixToDelete(p); setShowDeleteModal(true); }}
                              className="btn btn-ghost btn-sm btn-circle text-error"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Affichage de <span className="font-medium">{startIndex + 1}</span> à{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredPrix.length)}
                </span>{' '}
                sur <span className="font-medium">{filteredPrix.length}</span> prix
              </div>

              <div className="flex items-center gap-3">
                <select
                  className="select select-bordered select-sm"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                >
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
                  <button className="join-item btn btn-sm no-animation">
                    {currentPage} / {totalPages || 1}
                  </button>
                  <button
                    className="join-item btn btn-sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PrixCarburantList;