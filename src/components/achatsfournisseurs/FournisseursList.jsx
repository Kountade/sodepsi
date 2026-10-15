// src/components/achats/FournisseursList.jsx
// ============================================================
// VERSION OPTIMISÉE - Pagination serveur + debounce + filtres
// ============================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, Truck,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter,
  ChevronLeft, ChevronRight, Grid3x3, List,
  Star, Building2, Phone, Mail, MapPin,
  Globe, Loader2, AlertTriangle
} from 'lucide-react';

// ============================================================
// CONSTANTES
// ============================================================
const DEBOUNCE_MS = 400;

const TYPE_LABELS = {
  local: 'Local',
  international: 'International',
  importateur: 'Importateur',
  distributeur: 'Distributeur',
  fabricant: 'Fabricant',
};

const TYPE_BADGES = {
  local: 'badge-info',
  international: 'badge-primary',
  importateur: 'badge-secondary',
  distributeur: 'badge-warning',
  fabricant: 'badge-success',
};

// ============================================================
// HELPERS
// ============================================================
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '0 FCFA';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0 FCFA';
  return `${num.toLocaleString('fr-FR')} FCFA`;
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const FournisseursList = () => {
  const navigate = useNavigate();

  // ----- Données -----
  const [suppliers, setSuppliers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ----- Filtres -----
  const [searchInput, setSearchInput] = useState('');     // valeur brute
  const [searchTerm, setSearchTerm] = useState('');       // valeur debouncée
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // ----- Pagination serveur -----
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isPaginated, setIsPaginated] = useState(true);

  // ----- Suppression -----
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);

  // ----- Notification -----
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  // ----- Vue -----
  const [viewMode, setViewMode] = useState('list');

  // ----- Abort -----
  const abortRef = useRef(null);

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  }, []);

  // ============================================================
  // DEBOUNCE RECHERCHE
  // ============================================================
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setCurrentPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ============================================================
  // FETCH FOURNISSEURS (avec pagination serveur)
  // ============================================================
  const fetchSuppliers = useCallback(async () => {
    // Annule la requête précédente
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const params = new URLSearchParams();

      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') {
        params.append('is_active', statusFilter === 'active' ? 'true' : 'false');
      }
      if (searchTerm) params.append('search', searchTerm);

      // ✅ Pagination serveur
      params.append('page', currentPage);
      params.append('page_size', itemsPerPage);

      const url = `/suppliers/?${params.toString()}`;

      const response = await AxiosInstance.get(url, {
        headers: { 'Authorization': `Token ${token}` },
        signal: controller.signal,
      });

      // ✅ Détection : réponse paginée DRF ou tableau brut
      const data = response.data;
      if (data && typeof data === 'object' && Array.isArray(data.results)) {
        setSuppliers(data.results);
        setTotalCount(data.count ?? data.results.length);
        setIsPaginated(true);
      } else if (Array.isArray(data)) {
        setSuppliers(data);
        setTotalCount(data.length);
        setIsPaginated(false);
      } else {
        setSuppliers([]);
        setTotalCount(0);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;

      console.error('❌ Erreur chargement fournisseurs :', err);

      let message = 'Erreur de chargement des fournisseurs';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        message = 'Le serveur met trop de temps à répondre. Réessayez.';
      } else if (err.response?.status === 401) {
        message = 'Session expirée. Veuillez vous reconnecter.';
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 403) {
        message = 'Accès refusé.';
      } else if (err.response?.data?.detail) {
        message = err.response.data.detail;
      }

      setError(message);
      showNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [
    typeFilter,
    statusFilter,
    searchTerm,
    currentPage,
    itemsPerPage,
    navigate,
    showNotification,
  ]);

  // ============================================================
  // DÉCLENCHEUR
  // ============================================================
  useEffect(() => {
    fetchSuppliers();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchSuppliers]);

  // Reset page si un filtre change (hors recherche déjà gérée)
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, statusFilter]);

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    if (!supplierToDelete) return;
    try {
      const token = localStorage.getItem('Token');
      await AxiosInstance.delete(`/suppliers/${supplierToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` },
      });
      showNotification('Fournisseur supprimé avec succès', 'success');
      setShowDeleteModal(false);
      setSupplierToDelete(null);
      fetchSuppliers();
    } catch (err) {
      console.error('❌ Erreur suppression :', err);
      const msg =
        err.response?.data?.detail ||
        'Erreur lors de la suppression du fournisseur';
      showNotification(msg, 'error');
    }
  };

  // ============================================================
  // PAGINATION SERVEUR
  // ============================================================
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + suppliers.length, totalCount);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  // ============================================================
  // BADGES & RENDU
  // ============================================================
  const getTypeBadge = (type) => {
    const label = TYPE_LABELS[type] || type;
    const className = TYPE_BADGES[type] || 'badge-ghost';
    return <span className={`badge ${className}`}>{label}</span>;
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`f-${i}`} className="w-3 h-3 text-warning fill-warning" />);
    }
    for (let i = 0; i < 5 - fullStars; i++) {
      stars.push(<Star key={`e-${i}`} className="w-3 h-3 text-gray-300" />);
    }
    return stars;
  };

  const resetFilters = () => {
    setSearchInput('');
    setTypeFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  // ============================================================
  // ÉCRAN DE CHARGEMENT INITIAL
  // ============================================================
  if (loading && suppliers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">
            Chargement des fournisseurs…
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* ---------- NOTIFICATION ---------- */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div
            className={`alert ${
              notification.type === 'success'
                ? 'alert-success'
                : notification.type === 'warning'
                ? 'alert-warning'
                : 'alert-error'
            } shadow-xl rounded-xl max-w-md`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : notification.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="font-medium text-sm">{notification.message}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() =>
                setNotification((prev) => ({ ...prev, show: false }))
              }
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ---------- MODAL SUPPRESSION ---------- */}
      {showDeleteModal && supplierToDelete && (
        <div className="modal modal-open z-50">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">
                Confirmer la suppression
              </h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">
                Voulez-vous vraiment supprimer ce fournisseur ?
              </p>
              <p className="font-semibold text-error mt-2">
                {supplierToDelete.name}
              </p>
              {supplierToDelete.total_purchases > 0 && (
                <p className="text-warning text-sm mt-2">
                  ⚠️ Total achats : {formatCurrency(supplierToDelete.total_purchases)}
                </p>
              )}
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button
                className="btn btn-ghost flex-1"
                onClick={() => setShowDeleteModal(false)}
              >
                Annuler
              </button>
              <button
                className="btn btn-error flex-1 gap-2"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- EN-TÊTE ---------- */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Truck className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Fournisseurs
              </h1>
              {loading && suppliers.length > 0 && (
                <Loader2 className="w-5 h-5 text-primary animate-spin ml-2" />
              )}
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Gérez votre base de fournisseurs •{' '}
              <strong>{totalCount.toLocaleString('fr-FR')}</strong> fournisseur(s)
              {!isPaginated && ' (total brut)'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchSuppliers}
              className="btn btn-sm sm:btn-md btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={() => navigate('/fournisseurs/nouveau')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" /> Nouveau fournisseur
            </button>
          </div>
        </div>
      </div>

      {/* ---------- FILTRES ---------- */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, code, email, téléphone…"
              className="input input-bordered w-full pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
                onClick={() => setSearchInput('')}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className="btn btn-outline btn-sm sm:hidden gap-2"
          >
            <Filter className="w-4 h-4" />{' '}
            {showFilters ? 'Masquer filtres' : 'Afficher filtres'}
          </button>

          <div
            className={`${
              showFilters ? 'grid' : 'hidden'
            } sm:grid grid-cols-1 sm:grid-cols-3 gap-3`}
          >
            <select
              className="select select-bordered w-full"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Tous les types</option>
              <option value="local">Locaux</option>
              <option value="international">Internationaux</option>
              <option value="importateur">Importateurs</option>
              <option value="distributeur">Distributeurs</option>
              <option value="fabricant">Fabricants</option>
            </select>

            <select
              className="select select-bordered w-full"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>

            <div className="flex gap-2">
              <button
                className="btn btn-outline gap-2 flex-1"
                onClick={resetFilters}
              >
                <RefreshCw className="w-4 h-4" /> Réinitialiser
              </button>
              <div className="join">
                <button
                  onClick={() => setViewMode('list')}
                  className={`join-item btn btn-sm ${
                    viewMode === 'list' ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`join-item btn btn-sm ${
                    viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- TABLEAU / GRILLE ---------- */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3">Fournisseur</th>
                  <th className="py-3 hidden md:table-cell">Contact</th>
                  <th className="py-3 hidden lg:table-cell">Ville</th>
                  <th className="py-3 text-center">Type</th>
                  <th className="py-3 text-center">Note</th>
                  <th className="py-3 text-center">Statut</th>
                  <th className="py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && suppliers.length > 0 && (
                  <tr>
                    <td colSpan="7" className="py-2 text-center text-xs text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Mise à jour…
                    </td>
                  </tr>
                )}

                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <Truck className="w-16 h-16 text-gray-300" />
                        <p className="text-gray-500 font-medium">
                          Aucun fournisseur trouvé
                        </p>
                        {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all') && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={resetFilters}
                          >
                            Réinitialiser les filtres
                          </button>
                        )}
                        <button
                          onClick={() => navigate('/fournisseurs/nouveau')}
                          className="btn btn-primary btn-sm gap-2"
                        >
                          <Plus className="w-4 h-4" /> Ajouter un fournisseur
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Truck className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{supplier.name}</p>
                            <p className="text-xs text-gray-500">{supplier.code}</p>
                            {supplier.is_preferred && (
                              <span className="badge badge-warning badge-xs mt-1">
                                Privilégié
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell">
                        <div className="space-y-1">
                          {supplier.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span>{supplier.phone}</span>
                            </div>
                          )}
                          {supplier.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span className="truncate max-w-[150px]">
                                {supplier.email}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{supplier.city || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="text-center">{getTypeBadge(supplier.type)}</td>
                      <td className="text-center">
                        <div className="flex justify-center gap-0.5">
                          {getRatingStars(supplier.rating)}
                        </div>
                      </td>
                      <td className="text-center">
                        {supplier.is_active ? (
                          <span className="badge badge-success">Actif</span>
                        ) : (
                          <span className="badge badge-error">Inactif</span>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => navigate(`/fournisseurs/${supplier.id}`)}
                            className="btn btn-ghost btn-sm btn-circle tooltip"
                            data-tip="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/fournisseurs/${supplier.id}/modifier`)
                            }
                            className="btn btn-ghost btn-sm btn-circle tooltip text-warning"
                            data-tip="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSupplierToDelete(supplier);
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
            {suppliers.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <Truck className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">
                  Aucun fournisseur trouvé
                </p>
              </div>
            ) : (
              suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Truck className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{supplier.name}</h3>
                          <p className="text-xs text-gray-500">{supplier.code}</p>
                        </div>
                      </div>
                      {supplier.is_preferred && (
                        <Star className="w-5 h-5 text-warning fill-warning" />
                      )}
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Type</span>
                        {getTypeBadge(supplier.type)}
                      </div>
                      {supplier.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="truncate">{supplier.email}</span>
                        </div>
                      )}
                      {supplier.city && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{supplier.city}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm pt-2 border-t">
                        <span className="text-gray-500">Note</span>
                        <div className="flex gap-0.5">
                          {getRatingStars(supplier.rating)}
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Statut</span>
                        {supplier.is_active ? (
                          <span className="badge badge-success">Actif</span>
                        ) : (
                          <span className="badge badge-error">Inactif</span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                      <button
                        onClick={() => navigate(`/fournisseurs/${supplier.id}`)}
                        className="btn btn-sm btn-ghost"
                      >
                        Détails
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/fournisseurs/${supplier.id}/modifier`)
                        }
                        className="btn btn-sm btn-primary"
                      >
                        Modifier
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ---------- PAGINATION SERVEUR ---------- */}
        {totalCount > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Affichage de <strong>{startIndex + 1}</strong> à{' '}
              <strong>{endIndex}</strong> sur <strong>{totalCount}</strong>
            </div>
            <div className="flex items-center gap-3">
              <select
                className="select select-bordered select-sm"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value, 10));
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
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1 || loading}
                >
                  «
                </button>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="join-item btn btn-sm btn-disabled">
                  Page {currentPage} / {totalPages || 1}
                </span>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages || loading}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage >= totalPages || loading}
                >
                  »
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ---------- BANDEAU ERREUR ---------- */}
      {error && suppliers.length > 0 && (
        <div className="alert alert-error shadow-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FournisseursList;