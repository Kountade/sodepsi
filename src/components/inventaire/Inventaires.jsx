// src/pages/inventaires/Inventaires.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardList, Plus, Search, Filter, RefreshCw, Eye,
  PlayCircle, CheckCircle, AlertCircle, Warehouse, Calendar,
  TrendingUp, TrendingDown, Trash2, ChevronRight,
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

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

// ============================================================
// COMPOSANT
// ============================================================
const Inventaires = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('Token');
  const authHeaders = { Authorization: `Token ${token}` };

  const [inventaires, setInventaires] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // ============================================================
  // CHARGEMENT
  // ============================================================
  const fetchInventaires = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AxiosInstance.get('/inventories/', {
        headers: authHeaders,
      });
      setInventaires(response.data || []);
      setFiltered(response.data || []);
    } catch (err) {
      console.error('Erreur chargement inventaires:', err);
      setError('Impossible de charger les inventaires.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventaires();
  }, []);

  // ============================================================
  // FILTRES
  // ============================================================
  useEffect(() => {
    let result = [...inventaires];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (i) =>
          i.name?.toLowerCase().includes(q) ||
          i.warehouse_name?.toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      result = result.filter((i) => i.status === statusFilter);
    }

    setFiltered(result);
  }, [searchTerm, statusFilter, inventaires]);

  // ============================================================
  // ACTIONS
  // ============================================================
  const handleStart = async (inv) => {
    if (!window.confirm(`Démarrer l'inventaire "${inv.name}" ?`)) return;
    try {
      await AxiosInstance.post(
        `/inventories/${inv.id}/start/`,
        {},
        { headers: authHeaders }
      );
      showNotification('Inventaire démarré');
      fetchInventaires();
    } catch (err) {
      console.error(err);
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
      fetchInventaires();
    } catch (err) {
      console.error(err);
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
      fetchInventaires();
    } catch (err) {
      console.error(err);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  // ============================================================
  // STATS
  // ============================================================
  const stats = {
    total: inventaires.length,
    planned: inventaires.filter((i) => i.status === 'planned').length,
    inProgress: inventaires.filter((i) => i.status === 'in_progress').length,
    completed: inventaires.filter((i) => i.status === 'completed').length,
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
            Suivi et ajustement des stocks
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
              onClick={fetchInventaires}
              className="btn btn-sm btn-outline gap-1"
            >
              <RefreshCw className="w-4 h-4" /> Actualiser
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
                        {inv.warehouse_name}
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
                        {inv.start_date
                          ? new Date(inv.start_date).toLocaleDateString('fr-FR')
                          : '—'}
                      </p>
                    </div>
                    <div className="bg-base-200 rounded-lg p-2">
                      <p className="text-xs text-base-content/60 flex items-center gap-1">
                        <ClipboardList className="w-3 h-3" /> Lignes
                      </p>
                      <p className="text-sm font-medium mt-0.5">
                        {inv.lines?.length || 0}
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

export default Inventaires;