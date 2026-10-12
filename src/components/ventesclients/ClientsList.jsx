// src/components/clients/ClientsList.jsx
// ============================================================
// VERSION CORRIGÉE - Compatible modèle Client (7 champs)
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, Users,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight,
  Grid3x3, List, User, Building2, Phone,
  MapPin, UserCheck, UserX, Store, Truck
} from 'lucide-react';

// ============================================================
// ✅ ERROR BOUNDARY (affiche l'erreur au lieu d'une page blanche)
// ============================================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-4 text-error">
              <AlertCircle className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Erreur dans la liste des clients</h2>
            </div>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-64 text-red-600">
              {this.state.error?.toString()}
            </pre>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary"
              >
                Recharger
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="btn btn-ghost"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const ClientsListContent = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statutFilter, setStatutFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [viewMode, setViewMode] = useState('list');

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  const showNotification = useCallback((message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  }, []);

  const getToken = () => localStorage.getItem('Token');

  // ============================================================
  // ✅ CHARGEMENT DES CLIENTS (avec pagination serveur optionnelle)
  // ============================================================
  const fetchClients = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statutFilter !== 'all') params.append('statut', statutFilter);
      if (searchTerm) params.append('search', searchTerm);

      // ✅ Pagination serveur (DRF)
      params.append('page', page);
      params.append('page_size', itemsPerPage);

      const url = `/clients/?${params.toString()}`;

      console.log('🔍 fetchClients:', url);

      const response = await AxiosInstance.get(url, {
        headers: { 'Authorization': `Token ${token}` }
      });

      const data = response.data;
      console.log('✅ Réponse API clients:', data);

      // ✅ GESTION ROBUSTE
      let results = [];
      let count = 0;

      if (Array.isArray(data)) {
        results = data;
        count = data.length;
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.results)) {
          results = data.results;
        }
        count = typeof data.count === 'number' ? data.count : results.length;
      }

      setClients(results);
      setTotalCount(count);
      setTotalPages(count > 0 ? Math.ceil(count / itemsPerPage) : 1);

    } catch (error) {
      console.error('❌ Erreur fetchClients:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
      setClients([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statutFilter, searchTerm, itemsPerPage, navigate, showNotification]);

  // ============================================================
  // EFFET DE CHARGEMENT
  // ============================================================
  useEffect(() => {
    fetchClients(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statutFilter, searchTerm, itemsPerPage, currentPage]);

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    if (!clientToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/clients/${clientToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Client supprimé', 'success');
      fetchClients(currentPage);
      setShowDeleteModal(false);
      setClientToDelete(null);
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  // ============================================================
  // PAGINATION CLIENT-SIDE (car le backend peut ne pas paginer)
  // ============================================================
  const filteredClients = (clients || []).filter(client => {
    if (!client) return false;
    const search = (searchTerm || '').toLowerCase();
    const matchesSearch = !search ||
      (client.name || '').toLowerCase().includes(search) ||
      (client.code || '').toLowerCase().includes(search) ||
      (client.phone || '').toLowerCase().includes(search);
    const matchesType = typeFilter === 'all' || client.type === typeFilter;
    const matchesStatut = statutFilter === 'all' || client.statut === statutFilter;
    return matchesSearch && matchesType && matchesStatut;
  });

  // ✅ Si le backend pagine déjà, on n'a pas besoin de re-paginer côté client
  // Sinon, on pagine côté client
  const isBackendPaginated = totalCount > clients.length && totalCount > 0;
  const paginatedClients = isBackendPaginated
    ? clients
    : filteredClients.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );

  const localTotalPages = isBackendPaginated
    ? totalPages
    : Math.ceil(filteredClients.length / itemsPerPage) || 1;

  const displayCount = isBackendPaginated ? totalCount : filteredClients.length;

  // ============================================================
  // STATISTIQUES (basées sur les 7 champs réels du Client)
  // ============================================================
  const stats = {
    total: clients.length,
    actifs: clients.filter(c => c.statut === 'actif').length,
    inactifs: clients.filter(c => c.statut === 'inactif').length,
    bloques: clients.filter(c => c.statut === 'bloque').length,
    particuliers: clients.filter(c => c.type === 'particulier').length,
    entreprises: clients.filter(c => c.type === 'entreprise').length,
    revendeurs: clients.filter(c => c.type === 'revendeur').length,
    grossistes: clients.filter(c => c.type === 'grossiste').length,
  };

  // ============================================================
  // BADGES
  // ============================================================
  const getStatutBadge = (statut) => {
    switch (statut) {
      case 'actif':
        return <span className="badge badge-success gap-1"><UserCheck className="w-3 h-3" /> Actif</span>;
      case 'inactif':
        return <span className="badge badge-error gap-1"><UserX className="w-3 h-3" /> Inactif</span>;
      case 'bloque':
        return <span className="badge badge-warning gap-1"><AlertCircle className="w-3 h-3" /> Bloqué</span>;
      default:
        return <span className="badge badge-ghost">{statut || '-'}</span>;
    }
  };

  const getTypeBadge = (type) => {
    const configs = {
      particulier: { label: 'Particulier', className: 'badge-info' },
      entreprise: { label: 'Entreprise', className: 'badge-primary' },
      revendeur: { label: 'Revendeur', className: 'badge-warning' },
      grossiste: { label: 'Grossiste', className: 'badge-success' }
    };
    const config = configs[type] || { label: type || 'N/A', className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'entreprise': return <Building2 className="w-5 h-5 text-primary" />;
      case 'revendeur': return <Store className="w-5 h-5 text-primary" />;
      case 'grossiste': return <Truck className="w-5 h-5 text-primary" />;
      default: return <User className="w-5 h-5 text-primary" />;
    }
  };

  // ============================================================
  // RENDU
  // ============================================================
  if (loading && clients.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-base font-semibold text-gray-500">Chargement des clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success'
                ? <CheckCircle className="w-4 h-4" />
                : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => setNotification({ ...notification, show: false })}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {showDeleteModal && clientToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer ce client ?</p>
              <p className="font-semibold text-error mt-2">{clientToDelete.name}</p>
              <p className="text-sm text-gray-500">{clientToDelete.code}</p>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button
                className="btn btn-ghost flex-1"
                onClick={() => setShowDeleteModal(false)}
              >
                Annuler
              </button>
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
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Clients</h1>
              {loading && (
                <RefreshCw className="w-5 h-5 text-primary animate-spin ml-2" />
              )}
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Gérez votre base de clients • {displayCount} client(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => fetchClients(currentPage)}
              className="btn btn-sm sm:btn-md btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
            </button>
            <button
              onClick={() => navigate('/clients/nouveau')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" /> Nouveau client
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold text-primary">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Actifs</p>
              <p className="text-xl font-bold text-success">{stats.actifs}</p>
            </div>
            <UserCheck className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Inactifs</p>
              <p className="text-xl font-bold text-error">{stats.inactifs}</p>
            </div>
            <UserX className="w-8 h-8 text-error/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Bloqués</p>
              <p className="text-xl font-bold text-warning">{stats.bloques}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Entreprises</p>
              <p className="text-xl font-bold text-info">{stats.entreprises}</p>
            </div>
            <Building2 className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Particuliers</p>
              <p className="text-xl font-bold text-secondary">{stats.particuliers}</p>
            </div>
            <User className="w-8 h-8 text-secondary/20" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, code ou téléphone..."
              className="input input-bordered w-full pl-9"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline btn-sm sm:hidden gap-2"
          >
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer' : 'Filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-3 gap-3`}>
            <select
              className="select select-bordered w-full"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tous les types</option>
              <option value="particulier">Particuliers</option>
              <option value="entreprise">Entreprises</option>
              <option value="revendeur">Revendeurs</option>
              <option value="grossiste">Grossistes</option>
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
              <option value="actif">Actifs</option>
              <option value="inactif">Inactifs</option>
              <option value="bloque">Bloqués</option>
            </select>
            <div className="flex gap-2">
              <button
                className="btn btn-outline gap-2 flex-1"
                onClick={() => {
                  setTypeFilter('all');
                  setStatutFilter('all');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
              >
                <RefreshCw className="w-4 h-4" /> Réinitialiser
              </button>
              <div className="join">
                <button
                  onClick={() => setViewMode('list')}
                  className={`join-item btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`join-item btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des clients */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3">Client</th>
                  <th className="py-3 hidden md:table-cell">Téléphone</th>
                  <th className="py-3 hidden lg:table-cell">Adresse</th>
                  <th className="py-3 text-center">Type</th>
                  <th className="py-3 text-center">Statut</th>
                  <th className="py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClients.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-16 h-16 text-gray-300" />
                        <p className="text-gray-500 font-medium">Aucun client trouvé</p>
                        <button
                          onClick={() => navigate('/clients/nouveau')}
                          className="btn btn-primary btn-sm gap-2"
                        >
                          <Plus className="w-4 h-4" /> Ajouter un client
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedClients.map(client => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            {getTypeIcon(client.type)}
                          </div>
                          <div>
                            <p className="font-semibold">{client.name}</p>
                            <p className="text-xs text-gray-500">{client.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{client.phone || '-'}</span>
                        </div>
                      </td>
                      <td className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="truncate max-w-[200px]">
                            {client.address || 'Non renseigné'}
                          </span>
                        </div>
                      </td>
                      <td className="text-center">{getTypeBadge(client.type)}</td>
                      <td className="text-center">{getStatutBadge(client.statut)}</td>
                      <td className="text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => navigate(`/clients/${client.id}`)}
                            className="btn btn-ghost btn-sm btn-circle tooltip"
                            data-tip="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/clients/${client.id}/modifier`)}
                            className="btn btn-ghost btn-sm btn-circle tooltip"
                            data-tip="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setClientToDelete(client);
                              setShowDeleteModal(true);
                            }}
                            className="btn btn-ghost btn-sm btn-circle tooltip text-error"
                            data-tip="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {paginatedClients.length === 0 ? (
              <div className="col-span-3 text-center py-16">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun client trouvé</p>
              </div>
            ) : (
              paginatedClients.map(client => (
                <div
                  key={client.id}
                  className="bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        {getTypeIcon(client.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{client.name}</h3>
                        <p className="text-xs text-gray-500">{client.code}</p>
                      </div>
                    </div>
                    {getStatutBadge(client.statut)}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span>{client.phone || 'Non renseigné'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="truncate">{client.address || 'Non renseigné'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-gray-500">Type</span>
                      {getTypeBadge(client.type)}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-3 pt-2 border-t">
                    <button
                      onClick={() => navigate(`/clients/${client.id}`)}
                      className="btn btn-sm btn-ghost"
                    >
                      Détails
                    </button>
                    <button
                      onClick={() => navigate(`/clients/${client.id}/modifier`)}
                      className="btn btn-sm btn-primary"
                    >
                      Modifier
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {displayCount > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Affichage de {Math.min((currentPage - 1) * itemsPerPage + 1, displayCount)} à {Math.min(currentPage * itemsPerPage, displayCount)} sur {displayCount}
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
                <option value="5">5 lignes</option>
                <option value="10">10 lignes</option>
                <option value="20">20 lignes</option>
                <option value="50">50 lignes</option>
              </select>
              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  «
                </button>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="join-item btn btn-sm btn-disabled">
                  Page {currentPage} / {Math.max(localTotalPages, 1)}
                </span>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(p => Math.min(localTotalPages, p + 1))}
                  disabled={currentPage >= localTotalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(localTotalPages)}
                  disabled={currentPage >= localTotalPages}
                >
                  »
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// WRAPPER avec ErrorBoundary
// ============================================================
const ClientsList = () => (
  <ErrorBoundary>
    <ClientsListContent />
  </ErrorBoundary>
);

export default ClientsList;