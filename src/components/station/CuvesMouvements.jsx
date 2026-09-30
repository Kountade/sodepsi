// src/components/station/CuvesMouvements.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Activity, TrendingUp, TrendingDown, RefreshCw,
  Search, Filter, X, CheckCircle, AlertCircle, Fuel,
  Droplet, User, FileText, Calendar, ChevronLeft, ChevronRight,
  MoveHorizontal, AlertTriangle, BarChart3, Clock
} from 'lucide-react';

const CuvesMouvements = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // États principaux
  const [mouvements, setMouvements] = useState([]);
  const [cuves, setCuves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [cuveFilter, setCuveFilter] = useState(searchParams.get('cuve') || 'all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    approvisionnements: 0,
    ventes: 0,
    transferts: 0,
    ajustements: 0,
    fuites: 0,
    volumeTotal: 0,
  });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');
  const formatNumber = (n) => new Intl.NumberFormat('fr-FR').format(parseFloat(n || 0));
  const formatDate = (d) => d ? new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : '';

  // Charger les cuves pour le filtre
  const fetchCuves = async () => {
    try {
      const token = getToken();
      const res = await AxiosInstance.get('/cuves/', {
        headers: { Authorization: `Token ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setCuves(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Charger les mouvements avec filtres
  const fetchMouvements = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();

      if (cuveFilter !== 'all') params.append('cuve', cuveFilter);
      if (typeFilter !== 'all') params.append('type_mouvement', typeFilter);
      if (dateFrom) params.append('date_debut', dateFrom);
      if (dateTo) params.append('date_fin', dateTo);

      let url = '/mouvements-cuves/';
      if (params.toString()) url += `?${params.toString()}`;

      const res = await AxiosInstance.get(url, {
        headers: { Authorization: `Token ${token}` }
      });

      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setMouvements(data);

      // Calculer les statistiques
      const stats = data.reduce((acc, m) => {
        acc.total += 1;
        if (m.type_mouvement === 'approvisionnement') acc.approvisionnements += 1;
        else if (m.type_mouvement === 'vente') acc.ventes += 1;
        else if (m.type_mouvement === 'transfert') acc.transferts += 1;
        else if (m.type_mouvement === 'ajustement') acc.ajustements += 1;
        else if (m.type_mouvement === 'fuite') acc.fuites += 1;
        acc.volumeTotal += parseFloat(m.quantite || 0);
        return acc;
      }, {
        total: 0, approvisionnements: 0, ventes: 0,
        transferts: 0, ajustements: 0, fuites: 0, volumeTotal: 0
      });
      setStats(stats);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement des mouvements', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCuves();
  }, []);

  useEffect(() => {
    fetchMouvements();
    setCurrentPage(1);
  }, [cuveFilter, typeFilter, dateFrom, dateTo]);

  // Recherche locale (sur les données déjà chargées)
  const filteredMouvements = mouvements.filter(m => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (m.reference || '').toLowerCase().includes(q) ||
      (m.cuve_details?.nom || '').toLowerCase().includes(q) ||
      (m.cuve_details?.code || '').toLowerCase().includes(q) ||
      (m.created_by_details?.full_name || '').toLowerCase().includes(q) ||
      (m.notes || '').toLowerCase().includes(q)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredMouvements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMouvements = filteredMouvements.slice(startIndex, startIndex + itemsPerPage);

  // Configuration des types
  const getTypeConfig = (type) => {
    const configs = {
      approvisionnement: {
        label: 'Approvisionnement',
        cls: 'badge-success',
        bg: 'bg-success/10',
        border: 'border-success',
        icon: TrendingUp,
        color: 'text-success',
        sign: '+',
      },
      vente: {
        label: 'Vente',
        cls: 'badge-info',
        bg: 'bg-info/10',
        border: 'border-info',
        icon: TrendingDown,
        color: 'text-info',
        sign: '-',
      },
      transfert: {
        label: 'Transfert',
        cls: 'badge-warning',
        bg: 'bg-warning/10',
        border: 'border-warning',
        icon: MoveHorizontal,
        color: 'text-warning',
        sign: '↔',
      },
      ajustement: {
        label: 'Ajustement',
        cls: 'badge-secondary',
        bg: 'bg-secondary/10',
        border: 'border-secondary',
        icon: Activity,
        color: 'text-secondary',
        sign: '±',
      },
      fuite: {
        label: 'Fuite / Perte',
        cls: 'badge-error',
        bg: 'bg-error/10',
        border: 'border-error',
        icon: AlertTriangle,
        color: 'text-error',
        sign: '-',
      },
    };
    return configs[type] || {
      label: type,
      cls: 'badge-ghost',
      bg: 'bg-gray-100',
      border: 'border-gray-300',
      icon: Activity,
      color: 'text-gray-500',
      sign: '',
    };
  };

  const getTypeBadge = (type) => {
    const c = getTypeConfig(type);
    const Icon = c.icon;
    return (
      <span className={`badge ${c.cls} gap-1`}>
        <Icon className="w-3 h-3" />
        {c.label}
      </span>
    );
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCuveFilter('all');
    setTypeFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm || cuveFilter !== 'all' || typeFilter !== 'all' || dateFrom || dateTo;

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success'
                ? <CheckCircle className="w-4 h-4" />
                : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium text-sm">{notification.message}</span>
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

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/cuves')}
            className="btn btn-ghost btn-circle"
            title="Retour aux cuves"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2 bg-primary/10 rounded-xl">
            <Activity className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-primary">
              Mouvements des cuves
            </h1>
            <p className="text-sm text-gray-500">
              Historique complet des entrées et sorties
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { fetchCuves(); fetchMouvements(); }}
            className="btn btn-outline btn-sm gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
          <button
            onClick={() => navigate('/cuves/approvisionnement')}
            className="btn btn-success btn-sm gap-2"
          >
            <TrendingUp className="w-4 h-4" /> Approvisionner
          </button>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-white shadow-md rounded-xl p-3 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold text-primary">{stats.total}</p>
            </div>
            <Activity className="w-8 h-8 text-primary/20" />
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-3 border-l-4 border-success">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Approvisionnements</p>
              <p className="text-xl font-bold text-success">{stats.approvisionnements}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-success/20" />
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-3 border-l-4 border-info">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Ventes</p>
              <p className="text-xl font-bold text-info">{stats.ventes}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-info/20" />
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-3 border-l-4 border-warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Transferts</p>
              <p className="text-xl font-bold text-warning">{stats.transferts}</p>
            </div>
            <MoveHorizontal className="w-8 h-8 text-warning/20" />
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-3 border-l-4 border-secondary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Ajustements</p>
              <p className="text-xl font-bold text-secondary">{stats.ajustements}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-secondary/20" />
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-3 border-l-4 border-error">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Fuites / Pertes</p>
              <p className="text-xl font-bold text-error">{stats.fuites}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-error/20" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-4">
        <div className="flex flex-col gap-3">
          {/* Barre de recherche + bouton filtres mobile */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par référence, cuve, utilisateur, notes..."
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
              {hasActiveFilters && (
                <span className="badge badge-error badge-xs">!</span>
              )}
            </button>
          </div>

          {/* Filtres avancés */}
          <div className={`${showFilters ? 'grid' : 'hidden'} lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3`}>
            <select
              className="select select-bordered w-full"
              value={cuveFilter}
              onChange={(e) => setCuveFilter(e.target.value)}
            >
              <option value="all">Toutes les cuves</option>
              {cuves.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nom} ({c.code})
                </option>
              ))}
            </select>

            <select
              className="select select-bordered w-full"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Tous les types</option>
              <option value="approvisionnement">Approvisionnements</option>
              <option value="vente">Ventes</option>
              <option value="transfert">Transferts</option>
              <option value="ajustement">Ajustements</option>
              <option value="fuite">Fuites / Pertes</option>
            </select>

            <input
              type="date"
              className="input input-bordered w-full"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="Date de début"
            />

            <input
              type="date"
              className="input input-bordered w-full"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="Date de fin"
            />

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

      {/* Tableau des mouvements */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-gray-500 mt-4">Chargement des mouvements...</p>
          </div>
        ) : paginatedMouvements.length === 0 ? (
          <div className="py-16 text-center">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-2">
              Aucun mouvement trouvé
            </p>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="btn btn-sm btn-outline gap-2">
                <RefreshCw className="w-4 h-4" /> Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th>Date</th>
                    <th>Cuve</th>
                    <th className="text-center">Type</th>
                    <th className="text-right">Quantité</th>
                    <th className="text-right hidden md:table-cell">Avant</th>
                    <th className="text-right hidden md:table-cell">Après</th>
                    <th className="hidden lg:table-cell">Référence</th>
                    <th className="hidden lg:table-cell">Utilisateur</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMouvements.map(m => {
                    const cfg = getTypeConfig(m.type_mouvement);
                    return (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>{formatDate(m.created_at)}</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                              <Fuel className={`w-4 h-4 ${cfg.color}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">
                                {m.cuve_details?.nom || 'N/A'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {m.cuve_details?.code || '—'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="text-center">{getTypeBadge(m.type_mouvement)}</td>
                        <td className={`text-right font-bold ${cfg.color}`}>
                          {cfg.sign}{formatNumber(m.quantite)} L
                        </td>
                        <td className="text-right hidden md:table-cell text-gray-500 text-sm">
                          {formatNumber(m.ancien_niveau)} L
                        </td>
                        <td className="text-right hidden md:table-cell font-medium text-sm">
                          {formatNumber(m.nouveau_niveau)} L
                        </td>
                        <td className="hidden lg:table-cell">
                          {m.reference ? (
                            <div className="flex items-center gap-1 text-sm">
                              <FileText className="w-3 h-3 text-gray-400" />
                              <span className="truncate max-w-[150px]">
                                {m.reference}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="hidden lg:table-cell">
                          {m.created_by_details ? (
                            <div className="flex items-center gap-1 text-sm">
                              <User className="w-3 h-3 text-gray-400" />
                              <span>
                                {m.created_by_details.full_name ||
                                 m.created_by_details.username ||
                                 '—'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
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
                  {Math.min(currentPage * itemsPerPage, filteredMouvements.length)}
                </span>{' '}
                sur <span className="font-medium">{filteredMouvements.length}</span> mouvement(s)
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
                  <option value="100">100 lignes</option>
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

export default CuvesMouvements;