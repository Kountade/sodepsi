// src/components/station/ServicesList.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, RefreshCw, X, CheckCircle,
  AlertCircle, Eye, Filter, ChevronLeft, ChevronRight,
  Wrench, Droplet, Car, Timer, DollarSign, Award,
  TrendingUp, Grid3x3, List, Sparkles, Clock,
  Activity, Zap, Shield
} from 'lucide-react';

const ServicesList = () => {
  const navigate = useNavigate();

  // États
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [actifFilter, setActifFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    actifs: 0,
    inactifs: 0,
    prixMoyen: 0,
    dureeMoyenne: 0,
    parType: {},
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

  // Configuration des types
  const TYPE_CONFIG = {
    lavage_manuel: {
      label: 'Lavage manuel',
      icon: Droplet,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500',
      badge: 'badge-info',
    },
    lavage_auto: {
      label: 'Lavage auto',
      icon: Sparkles,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500',
      badge: 'badge-secondary',
    },
    gonflage: {
      label: 'Gonflage',
      icon: Zap,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500',
      badge: 'badge-warning',
    },
    vidange: {
      label: 'Vidange',
      icon: Droplet,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      border: 'border-green-500',
      badge: 'badge-success',
    },
    graissage: {
      label: 'Graissage',
      icon: Wrench,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500',
      badge: 'badge-accent',
    },
    autre: {
      label: 'Autre',
      icon: Activity,
      color: 'text-gray-500',
      bg: 'bg-gray-500/10',
      border: 'border-gray-500',
      badge: 'badge-ghost',
    },
  };

  const getTypeConfig = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.autre;

  const getTypeBadge = (type) => {
    const c = getTypeConfig(type);
    const Icon = c.icon;
    return (
      <span className={`badge ${c.badge} gap-1`}>
        <Icon className="w-3 h-3" />
        {c.label}
      </span>
    );
  };

  // Charger les services
  const fetchServices = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();

      if (typeFilter !== 'all') params.append('type_service', typeFilter);
      if (actifFilter === 'actif') params.append('est_actif', 'true');
      if (actifFilter === 'inactif') params.append('est_actif', 'false');
      if (searchTerm) params.append('search', searchTerm);

      let url = '/services/';
      if (params.toString()) url += `?${params.toString()}`;

      const res = await AxiosInstance.get(url, {
        headers: { Authorization: `Token ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setServices(data);

      // Calcul stats
      const actifs = data.filter(s => s.est_actif);
      const prixValues = data.map(s => parseFloat(s.prix || 0));
      const dureeValues = data.map(s => parseFloat(s.duree_estimee || 0));

      const parType = {};
      data.forEach(s => {
        parType[s.type_service] = (parType[s.type_service] || 0) + 1;
      });

      setStats({
        total: data.length,
        actifs: actifs.length,
        inactifs: data.length - actifs.length,
        prixMoyen: prixValues.length > 0
          ? prixValues.reduce((a, b) => a + b, 0) / prixValues.length
          : 0,
        dureeMoyenne: dureeValues.length > 0
          ? dureeValues.reduce((a, b) => a + b, 0) / dureeValues.length
          : 0,
        parType,
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
    fetchServices();
    setCurrentPage(1);
  }, [typeFilter, actifFilter]);

  useEffect(() => {
    const t = setTimeout(() => fetchServices(), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Pagination
  const totalPages = Math.ceil(services.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedServices = services.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async () => {
    if (!serviceToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/services/${serviceToDelete.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Service supprimé', 'success');
      setShowDeleteModal(false);
      setServiceToDelete(null);
      fetchServices();
    } catch (err) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const handleToggleActif = async (service) => {
    try {
      const token = getToken();
      await AxiosInstance.patch(`/services/${service.id}/`, {
        est_actif: !service.est_actif,
      }, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification(
        service.est_actif ? 'Service désactivé' : 'Service activé',
        'success'
      );
      fetchServices();
    } catch (err) {
      showNotification('Erreur lors de la mise à jour', 'error');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setActifFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || typeFilter !== 'all' || actifFilter !== 'all';

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
      {showDeleteModal && serviceToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer ce service ?</p>
              <p className="font-semibold text-error mt-2">{serviceToDelete.nom}</p>
              <p className="text-sm text-gray-500 mt-1">Code : {serviceToDelete.code}</p>
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
              <Wrench className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Services Station
              </h1>
              <p className="text-sm text-gray-500">
                Lavage, gonflage, vidange et autres services – {stats.total} service(s)
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchServices} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button
              onClick={() => navigate('/services/nouveau')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" /> Nouveau service
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total services</p>
              <p className="text-xl font-bold text-primary">{stats.total}</p>
            </div>
            <Wrench className="w-8 h-8 text-primary/20" />
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
            <DollarSign className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3 border-l-4 border-warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Durée moyenne</p>
              <p className="text-lg font-bold text-warning">
                {Math.round(stats.dureeMoyenne)} min
              </p>
            </div>
            <Clock className="w-8 h-8 text-warning/20" />
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
                placeholder="Rechercher un service..."
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
            {/* Toggle vue */}
            <div className="join hidden lg:flex">
              <button
                onClick={() => setViewMode('grid')}
                className={`join-item btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                title="Vue grille"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`join-item btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                title="Vue liste"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={`${showFilters ? 'grid' : 'hidden'} lg:grid grid-cols-1 sm:grid-cols-3 gap-3`}>
            <select
              className="select select-bordered w-full"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Tous les types</option>
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
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

      {/* Contenu */}
      {loading ? (
        <div className="py-16 text-center bg-white rounded-xl shadow-md">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-gray-500 mt-4">Chargement des services...</p>
        </div>
      ) : paginatedServices.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl shadow-md">
          <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium mb-2">Aucun service trouvé</p>
          {hasActiveFilters ? (
            <button onClick={resetFilters} className="btn btn-sm btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Réinitialiser
            </button>
          ) : (
            <button
              onClick={() => navigate('/services/nouveau')}
              className="btn btn-primary btn-sm gap-2"
            >
              <Plus className="w-4 h-4" /> Nouveau service
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ============ VUE GRILLE ============ */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedServices.map(service => {
            const cfg = getTypeConfig(service.type_service);
            const Icon = cfg.icon;
            return (
              <div
                key={service.id}
                className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden border-t-4 ${cfg.border} ${
                  service.est_actif ? '' : 'opacity-60'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                      <Icon className={`w-7 h-7 ${cfg.color}`} />
                    </div>
                    <button
                      onClick={() => handleToggleActif(service)}
                      className={`badge cursor-pointer transition-colors ${
                        service.est_actif
                          ? 'badge-success hover:badge-error'
                          : 'badge-ghost hover:badge-success'
                      }`}
                      title={service.est_actif ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}
                    >
                      {service.est_actif ? 'Actif' : 'Inactif'}
                    </button>
                  </div>

                  <h3 className="font-bold text-lg mb-1 line-clamp-1">{service.nom}</h3>
                  <p className="text-xs text-gray-500 mb-3">{service.code}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Type</span>
                      {getTypeBadge(service.type_service)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Prix</span>
                      <span className="font-bold text-primary">
                        {formatNumber(service.prix)} FCFA
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Durée</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="font-medium">{service.duree_estimee} min</span>
                      </div>
                    </div>
                  </div>

                  {service.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                      {service.description}
                    </p>
                  )}

                  <div className="flex justify-end gap-1 pt-3 border-t">
                    <button
                      onClick={() => navigate(`/services/${service.id}`)}
                      className="btn btn-ghost btn-sm btn-circle"
                      title="Voir"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/services/${service.id}/modifier`)}
                      className="btn btn-ghost btn-sm btn-circle"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setServiceToDelete(service); setShowDeleteModal(true); }}
                      className="btn btn-ghost btn-sm btn-circle text-error"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ============ VUE LISTE ============ */
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th>Service</th>
                  <th className="text-center">Type</th>
                  <th className="text-right">Prix</th>
                  <th className="text-center hidden md:table-cell">Durée</th>
                  <th className="hidden lg:table-cell">Description</th>
                  <th className="text-center">Statut</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedServices.map(service => {
                  const cfg = getTypeConfig(service.type_service);
                  const Icon = cfg.icon;
                  return (
                    <tr key={service.id} className={`hover:bg-gray-50 ${service.est_actif ? '' : 'opacity-60'}`}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${cfg.color}`} />
                          </div>
                          <div>
                            <p className="font-semibold">{service.nom}</p>
                            <p className="text-xs text-gray-500">{service.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">{getTypeBadge(service.type_service)}</td>
                      <td className="text-right font-bold text-primary">
                        {formatNumber(service.prix)} FCFA
                      </td>
                      <td className="text-center hidden md:table-cell">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>{service.duree_estimee} min</span>
                        </div>
                      </td>
                      <td className="hidden lg:table-cell">
                        <p className="text-sm text-gray-600 line-clamp-1 max-w-xs">
                          {service.description || '—'}
                        </p>
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => handleToggleActif(service)}
                          className={`badge cursor-pointer transition-colors ${
                            service.est_actif
                              ? 'badge-success hover:badge-error'
                              : 'badge-ghost hover:badge-success'
                          }`}
                        >
                          {service.est_actif ? 'Actif' : 'Inactif'}
                        </button>
                      </td>
                      <td className="text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => navigate(`/services/${service.id}`)}
                            className="btn btn-ghost btn-sm btn-circle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/services/${service.id}/modifier`)}
                            className="btn btn-ghost btn-sm btn-circle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setServiceToDelete(service); setShowDeleteModal(true); }}
                            className="btn btn-ghost btn-sm btn-circle text-error"
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
        </div>
      )}

      {/* Pagination */}
      {!loading && paginatedServices.length > 0 && (
        <div className="bg-white rounded-xl shadow-md px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            Affichage de <span className="font-medium">{startIndex + 1}</span> à{' '}
            <span className="font-medium">
              {Math.min(currentPage * itemsPerPage, services.length)}
            </span>{' '}
            sur <span className="font-medium">{services.length}</span> service(s)
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
              <option value="8">8 / page</option>
              <option value="12">12 / page</option>
              <option value="24">24 / page</option>
              <option value="48">48 / page</option>
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
      )}
    </div>
  );
};

export default ServicesList;