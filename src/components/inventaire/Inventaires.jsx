// src/pages/inventaires/Inventaires.jsx
// ============================================================
// VERSION COMPLÈTE CORRIGÉE - Sans boucle infinie
// ============================================================

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardList, Plus, Search, Filter, RefreshCw, Eye,
  PlayCircle, CheckCircle, AlertCircle, Warehouse, Calendar,
  TrendingUp, TrendingDown, Trash2, ChevronRight,
} from 'lucide-react';

// ✅ ADAPTER le chemin selon l'emplacement de AxiosInstance.jsx
import AxiosInstance from '../../components/AxiosInstance';

// ============================================================
// ERROR BOUNDARY
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
    console.error('❌ ErrorBoundary Inventaires:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-4 text-error">
              <AlertCircle className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Erreur dans la page Inventaires</h2>
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
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================
// UTILITAIRES
// ============================================================
const formatMoney = (v) => {
  const n = Number(v) || 0;
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
};

const getStatusBadge = (status) => {
  const config = {
    planned: { label: 'Planifié', className: 'badge-info' },
    in_progress: { label: 'En cours', className: 'badge-warning' },
    completed: { label: 'Terminé', className: 'badge-success' },
    cancelled: { label: 'Annulé', className: 'badge-error' },
    verified: { label: 'Vérifié', className: 'badge-primary' },
  };
  const c = config[status] || config.planned;
  return (
    <span className={`badge ${c.className} badge-sm font-medium`}>
      {c.label}
    </span>
  );
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('fr-FR');
  } catch {
    return '—';
  }
};

const normalizeData = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
};

const getPaginatedInfo = (data) => {
  if (Array.isArray(data)) {
    return { results: data, count: data.length };
  }
  if (data && typeof data === 'object') {
    return {
      results: Array.isArray(data.results) ? data.results : [],
      count: typeof data.count === 'number' ? data.count : 0,
    };
  }
  return { results: [], count: 0 };
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const InventairesContent = () => {
  const navigate = useNavigate();

  // ✅ Récupérer le token UNE SEULE FOIS
  const token = useMemo(() => localStorage.getItem('Token'), []);

  // ✅ Mémoïser les headers pour éviter la recréation
  const authHeaders = useMemo(
    () => ({ Authorization: `Token ${token}` }),
    [token]
  );

  // ✅ Utiliser useRef pour éviter les doubles appels (React 18 StrictMode)
  const hasFetchedRef = useRef(false);

  const [inventaires, setInventaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ✅ Stats globales
  const [stats, setStats] = useState({
    total: 0,
    planned: 0,
    inProgress: 0,
    completed: 0,
  });

  // ✅ Mémoïser showNotification
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  // ============================================================
  // CHARGEMENT DES INVENTAIRES
  // ============================================================
  const fetchInventaires = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await AxiosInstance.get('/inventories/', {
        headers: authHeaders,
      });

      const data = response.data;
      const { results } = getPaginatedInfo(data);

      setInventaires(results);

    } catch (err) {
      console.error('❌ Erreur chargement inventaires:', err);
      if (err.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Impossible de charger les inventaires.');
      }
      setInventaires([]);
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders, navigate, showNotification]);

  // ============================================================
  // CHARGEMENT DES STATS
  // ============================================================
  const fetchStats = useCallback(async () => {
    try {
      if (!token) return;

      // ✅ Utiliser le même endpoint (la limite de 1000 est gérée côté backend)
      const response = await AxiosInstance.get('/inventories/?page_size=1000', {
        headers: authHeaders,
      });

      const all = normalizeData(response.data);

      setStats({
        total: all.length,
        planned: all.filter((i) => i.status === 'planned').length,
        inProgress: all.filter((i) => i.status === 'in_progress').length,
        completed: all.filter((i) => i.status === 'completed').length,
      });

    } catch (err) {
      console.error('❌ Erreur fetchStats:', err);
    }
  }, [token, authHeaders]);

  // ============================================================
  // ✅ UN SEUL useEffect - évite la boucle infinie
  // ============================================================
  useEffect(() => {
    // ✅ Guard contre le double-mount React 18
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    console.log('🔍 Chargement initial des inventaires');
    fetchInventaires();
    fetchStats();
  }, [fetchInventaires, fetchStats]);

  // ============================================================
  // FILTRES (calculés localement, sans effet)
  // ============================================================
  const filtered = useMemo(() => {
    let result = [...inventaires];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (i) =>
          (i.name || '').toLowerCase().includes(q) ||
          (i.warehouse_name || '').toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      result = result.filter((i) => i.status === statusFilter);
    }

    return result;
  }, [searchTerm, statusFilter, inventaires]);

  // ============================================================
  // ACTIONS
  // ============================================================
  const handleRefresh = useCallback(() => {
    fetchInventaires();
    fetchStats();
  }, [fetchInventaires, fetchStats]);

  const handleStart = async (inv) => {
    if (!window.confirm(`Démarrer l'inventaire "${inv.name}" ?`)) return;
    try {
      await AxiosInstance.post(
        `/inventories/${inv.id}/start/`,
        {},
        { headers: authHeaders }
      );
      showNotification('Inventaire démarré');
      handleRefresh();
    } catch (err) {
      console.error('❌ Erreur démarrage:', err);
      showNotification('Erreur lors du démarrage', 'error');
    }
  };

  const handleComplete = async (inv) => {
    if (!window.confirm(`Terminer l'inventaire "${inv.name}" ?`)) return;
    try {
      await AxiosInstance.post(
        `/inventories/${inv.id}/complete/`,
        {},
        { headers: authHeaders }
      );
      showNotification('Inventaire terminé');
      handleRefresh();
    } catch (err) {
      console.error('❌ Erreur finalisation:', err);
      showNotification('Erreur lors de la clôture', 'error');
    }
  };

  const handleDelete = async (inv) => {
    if (!window.confirm(`Supprimer "${inv.name}" ?`)) return;
    try {
      await AxiosInstance.delete(`/inventories/${inv.id}/`, {
        headers: authHeaders,
      });
      showNotification('Inventaire supprimé');
      handleRefresh();
    } catch (err) {
      console.error('❌ Erreur suppression:', err);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  // ============================================================
  // RENDU
  // ============================================================
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50">
          <div
            className={`alert ${
              notification.type === 'error' ? 'alert-error' : 'alert-success'
            } shadow-lg max-w-md`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'error' ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-primary" />
            Inventaires
          </h1>
          <p className="text-base-content/60 text-sm mt-1">
            Suivi et ajustement des stocks — {stats.total} inventaire(s)
          </p>
        </div>
        <Link to="/inventaires/nouveau" className="btn btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Nouvel inventaire
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, icon: ClipboardList, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Planifiés', value: stats.planned, icon: Calendar, color: 'text-info', bg: 'bg-info/10' },
          { label: 'En cours', value: stats.inProgress, icon: PlayCircle, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Terminés', value: stats.completed, icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="card bg-base-100 shadow-sm border border-base-200"
            >
              <div className="card-body p-4 flex-row items-center gap-3">
                <div className={`p-2 rounded-lg ${s.bg}`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-base-content/60">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtres */}
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-base-content/60" />
              <span className="font-medium">Filtres</span>
            </div>
            <button
              onClick={handleRefresh}
              className="btn btn-sm btn-outline gap-1"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Recherche</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Nom ou entrepôt..."
                  className="input input-bordered w-full pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Statut</span>
              </label>
              <select
                className="select select-bordered"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                <option value="planned">Planifiés</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminés</option>
                <option value="cancelled">Annulés</option>
                <option value="verified">Vérifiés</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="alert alert-error shadow-lg mb-6">
          <AlertCircle className="w-6 h-6" />
          <span>{error}</span>
        </div>
      )}

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body text-center py-12">
            <ClipboardList className="w-16 h-16 mx-auto text-base-content/20 mb-4" />
            <h3 className="text-lg font-medium">Aucun inventaire trouvé</h3>
            <p className="text-base-content/60">
              {searchTerm || statusFilter
                ? 'Aucun résultat ne correspond à vos filtres'
                : 'Commencez par créer votre premier inventaire'}
            </p>
            <Link
              to="/inventaires/nouveau"
              className="btn btn-primary btn-sm w-fit mx-auto mt-4 gap-2"
            >
              <Plus className="w-4 h-4" /> Créer un inventaire
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((inv) => {
            const diff = Number(inv.total_difference) || 0;
            const isPositive = diff > 0;
            const isNeutral = diff === 0;

            return (
              <div
                key={inv.id}
                className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="card-body">
                  {/* En-tête */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h2 className="card-title text-lg truncate">
                        {inv.name}
                      </h2>
                      <p className="text-xs text-base-content/50 flex items-center gap-1 mt-1">
                        <Warehouse className="w-3 h-3" />
                        {inv.warehouse_name || 'N/A'}
                      </p>
                    </div>
                    {getStatusBadge(inv.status)}
                  </div>

                  {/* Infos */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-base-200 rounded-lg p-2">
                      <p className="text-xs text-base-content/60 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Début
                      </p>
                      <p className="text-sm font-medium mt-0.5">
                        {formatDate(inv.start_date)}
                      </p>
                    </div>
                    <div className="bg-base-200 rounded-lg p-2">
                      <p className="text-xs text-base-content/60 flex items-center gap-1">
                        <ClipboardList className="w-3 h-3" /> Lignes
                      </p>
                      <p className="text-sm font-medium mt-0.5">
                        {inv.lines_count_annotated ?? (Array.isArray(inv.lines) ? inv.lines.length : 0)}
                      </p>
                    </div>
                  </div>

                  {/* Valeurs */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-info/10 rounded-lg p-2">
                      <p className="text-xs text-info">Théorique</p>
                      <p className="text-sm font-bold text-info mt-0.5">
                        {formatMoney(inv.total_expected_value)} F
                      </p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-2">
                      <p className="text-xs text-primary">Réel</p>
                      <p className="text-sm font-bold text-primary mt-0.5">
                        {formatMoney(inv.total_actual_value)} F
                      </p>
                    </div>
                  </div>

                  {/* Écart */}
                  {!isNeutral && (
                    <div
                      className={`rounded-lg p-2 flex items-center justify-between mt-2 ${
                        isPositive ? 'bg-success/10' : 'bg-error/10'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {isPositive ? (
                          <TrendingUp className="w-4 h-4 text-success" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-error" />
                        )}
                        <span className="text-xs font-medium">Écart</span>
                      </div>
                      <span
                        className={`text-sm font-bold ${
                          isPositive ? 'text-success' : 'text-error'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {formatMoney(diff)} F
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="card-actions justify-between items-center mt-3 pt-3 border-t border-base-200">
                    <div className="flex gap-1">
                      {inv.status === 'planned' && (
                        <button
                          onClick={() => handleStart(inv)}
                          className="btn btn-xs btn-warning gap-1"
                        >
                          <PlayCircle className="w-3 h-3" /> Démarrer
                        </button>
                      )}
                      {inv.status === 'in_progress' && (
                        <button
                          onClick={() => handleComplete(inv)}
                          className="btn btn-xs btn-success gap-1"
                        >
                          <CheckCircle className="w-3 h-3" /> Terminer
                        </button>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Link
                        to={`/inventaires/${inv.id}`}
                        className="btn btn-xs btn-outline gap-1"
                      >
                        <Eye className="w-3 h-3" /> Ouvrir
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                      <button
                        onClick={() => handleDelete(inv)}
                        className="btn btn-xs btn-ghost text-error"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================
// WRAPPER avec ErrorBoundary
// ============================================================
const Inventaires = () => (
  <ErrorBoundary>
    <InventairesContent />
  </ErrorBoundary>
);

export default Inventaires;