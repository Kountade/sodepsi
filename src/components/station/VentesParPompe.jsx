// src/components/station/VentesParPompe.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, BarChart3, Server, Fuel, TrendingUp, TrendingDown,
  RefreshCw, Search, Filter, X, CheckCircle, AlertCircle,
  Gauge, Activity, Calendar, User, FileText, ChevronDown,
  ChevronUp, Droplet, Award, Eye, Plus
} from 'lucide-react';

const VentesParPompe = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // États principaux
  const [pompes, setPompes] = useState([]);
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [pompeFilter, setPompeFilter] = useState(searchParams.get('pompe') || 'all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Vue : 'grouped' (par pompe) ou 'list' (toutes les ventes)
  const [viewMode, setViewMode] = useState('grouped');

  // Pompes étendues
  const [expandedPompes, setExpandedPompes] = useState({});

  // Statistiques globales
  const [globalStats, setGlobalStats] = useState({
    totalVentes: 0,
    totalLitres: 0,
    totalMontant: 0,
    moyenneTicket: 0,
    meilleurePompe: null,
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

  // Charger les pompes
  const fetchPompes = async () => {
    try {
      const token = getToken();
      const res = await AxiosInstance.get('/pompes/', {
        headers: { Authorization: `Token ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setPompes(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Charger les ventes de carburant
  const fetchVentes = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (pompeFilter !== 'all') params.append('pompe', pompeFilter);
      if (dateFrom) params.append('date_debut', dateFrom);
      if (dateTo) params.append('date_fin', dateTo);

      let url = '/ventes-carburant/';
      if (params.toString()) url += `?${params.toString()}`;

      const res = await AxiosInstance.get(url, {
        headers: { Authorization: `Token ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setVentes(data);

      // Stats globales
      const totalVentes = data.length;
      const totalLitres = data.reduce((s, v) => s + parseFloat(v.quantite || 0), 0);
      const totalMontant = data.reduce((s, v) => s + parseFloat(v.montant_net || 0), 0);
      const moyenneTicket = totalVentes > 0 ? totalMontant / totalVentes : 0;

      setGlobalStats({
        totalVentes,
        totalLitres,
        totalMontant,
        moyenneTicket,
        meilleurePompe: null, // calculé après regroupement
      });
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement des ventes', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPompes();
  }, []);

  useEffect(() => {
    fetchVentes();
  }, [pompeFilter, dateFrom, dateTo]);

  // Regrouper les ventes par pompe
  const ventesParPompe = useMemo(() => {
    const grouped = {};
    pompes.forEach(p => {
      grouped[p.id] = {
        pompe: p,
        ventes: [],
        totalLitres: 0,
        totalMontant: 0,
        count: 0,
      };
    });

    ventes.forEach(v => {
      const pid = v.pompe;
      if (!grouped[pid]) {
        grouped[pid] = {
          pompe: { id: pid, nom: `Pompe #${pid}`, code: '—' },
          ventes: [],
          totalLitres: 0,
          totalMontant: 0,
          count: 0,
        };
      }
      grouped[pid].ventes.push(v);
      grouped[pid].totalLitres += parseFloat(v.quantite || 0);
      grouped[pid].totalMontant += parseFloat(v.montant_net || 0);
      grouped[pid].count += 1;
    });

    return Object.values(grouped)
      .filter(g => g.count > 0)
      .sort((a, b) => b.totalMontant - a.totalMontant);
  }, [pompes, ventes]);

  // Déterminer la meilleure pompe
  useEffect(() => {
    if (ventesParPompe.length > 0) {
      const best = ventesParPompe[0];
      setGlobalStats(prev => ({
        ...prev,
        meilleurePompe: {
          nom: best.pompe.nom,
          montant: best.totalMontant,
        },
      }));
    }
  }, [ventesParPompe]);

  // Ventes filtrées par recherche (sur toutes les ventes)
  const filteredVentes = useMemo(() => {
    if (!searchTerm) return ventes;
    const q = searchTerm.toLowerCase();
    return ventes.filter(v => {
      const pompe = pompes.find(p => p.id === v.pompe);
      return (
        (v.numero_vente || '').toLowerCase().includes(q) ||
        (pompe?.nom || '').toLowerCase().includes(q) ||
        (pompe?.code || '').toLowerCase().includes(q)
      );
    });
  }, [ventes, pompes, searchTerm]);

  // Filtre sur les groupes
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return ventesParPompe;
    const q = searchTerm.toLowerCase();
    return ventesParPompe.filter(g =>
      (g.pompe.nom || '').toLowerCase().includes(q) ||
      (g.pompe.code || '').toLowerCase().includes(q)
    );
  }, [ventesParPompe, searchTerm]);

  const togglePompe = (pompeId) => {
    setExpandedPompes(prev => ({
      ...prev,
      [pompeId]: !prev[pompeId],
    }));
  };

  const resetFilters = () => {
    setSearchTerm('');
    setPompeFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = searchTerm || pompeFilter !== 'all' || dateFrom || dateTo;

  // Calcul du pourcentage pour la barre de répartition
  const totalGlobal = ventesParPompe.reduce((s, g) => s + g.totalMontant, 0) || 1;

  if (loading && ventes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement des ventes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
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

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/pompes')} className="btn btn-ghost btn-circle">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="p-2 bg-info/10 rounded-xl">
              <BarChart3 className="w-7 h-7 text-info" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Ventes par Pompe</h1>
              <p className="text-sm text-gray-500">
                Analyse des ventes de carburant par pompe
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={fetchVentes} className="btn btn-sm btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button
              onClick={() => navigate('/ventes-carburant/nouveau')}
              className="btn btn-sm btn-success gap-2"
            >
              <Plus className="w-4 h-4" /> Nouvelle vente
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total ventes</p>
              <p className="text-xl font-bold text-primary">{globalStats.totalVentes}</p>
            </div>
            <Activity className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3 border-l-4 border-info">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Litres vendus</p>
              <p className="text-xl font-bold text-info">
                {formatNumber(globalStats.totalLitres)} L
              </p>
            </div>
            <Droplet className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3 border-l-4 border-success">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Chiffre d'affaires</p>
              <p className="text-lg font-bold text-success">
                {formatCurrency(globalStats.totalMontant)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3 border-l-4 border-warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Ticket moyen</p>
              <p className="text-lg font-bold text-warning">
                {formatCurrency(globalStats.moyenneTicket)}
              </p>
            </div>
            <Gauge className="w-8 h-8 text-warning/20" />
          </div>
        </div>
      </div>

      {/* Meilleure pompe */}
      {globalStats.meilleurePompe && (
        <div className="bg-gradient-to-r from-warning/10 via-warning/5 to-transparent rounded-xl p-4 border-l-4 border-warning">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
              <Award className="w-6 h-6 text-warning" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-medium">Meilleure pompe</p>
              <p className="text-lg font-bold text-warning">
                {globalStats.meilleurePompe.nom}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">CA</p>
              <p className="text-xl font-black text-warning">
                {formatCurrency(globalStats.meilleurePompe.montant)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une pompe ou un numéro de vente..."
                className="input input-bordered w-full pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                onClick={() => setViewMode('grouped')}
                className={`join-item btn btn-sm ${viewMode === 'grouped' ? 'btn-primary' : 'btn-ghost'}`}
                title="Vue groupée par pompe"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`join-item btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                title="Vue liste détaillée"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={`${showFilters ? 'grid' : 'hidden'} lg:grid grid-cols-1 sm:grid-cols-4 gap-3`}>
            <select
              className="select select-bordered w-full"
              value={pompeFilter}
              onChange={(e) => setPompeFilter(e.target.value)}
            >
              <option value="all">Toutes les pompes</option>
              {pompes.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nom} ({p.code})
                </option>
              ))}
            </select>

            <input
              type="date"
              className="input input-bordered w-full"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />

            <input
              type="date"
              className="input input-bordered w-full"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
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

      {/* Contenu */}
      {viewMode === 'grouped' ? (
        /* ============ VUE GROUPÉE ============ */
        <div className="space-y-3">
          {filteredGroups.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md py-16 text-center">
              <Server className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aucune vente à afficher</p>
              {hasActiveFilters && (
                <button onClick={resetFilters} className="btn btn-sm btn-outline gap-2 mt-3">
                  <RefreshCw className="w-4 h-4" /> Réinitialiser
                </button>
              )}
            </div>
          ) : (
            filteredGroups.map(group => {
              const isExpanded = expandedPompes[group.pompe.id];
              const pourcentage = (group.totalMontant / totalGlobal) * 100;
              const prixMoyen = group.totalLitres > 0
                ? group.totalMontant / group.totalLitres
                : 0;

              return (
                <div key={group.pompe.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                  {/* En-tête de la pompe */}
                  <button
                    onClick={() => togglePompe(group.pompe.id)}
                    className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Server className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">{group.pompe.nom}</p>
                          <p className="text-xs text-gray-500">
                            {group.pompe.code} · {group.count} vente(s)
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Litres</p>
                          <p className="font-bold text-info">
                            {formatNumber(group.totalLitres)} L
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">CA</p>
                          <p className="font-bold text-success">
                            {formatCurrency(group.totalMontant)}
                          </p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-gray-500">Prix moy.</p>
                          <p className="font-bold text-warning text-sm">
                            {formatNumber(prixMoyen)} FCFA/L
                          </p>
                        </div>
                        <div className="w-20">
                          <div className="text-xs text-gray-500 text-right mb-1">
                            {pourcentage.toFixed(1)}%
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{ width: `${Math.min(pourcentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-primary">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Détail des ventes */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {/* Mini stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-gray-50">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Ventes</p>
                          <p className="font-bold text-primary">{group.count}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Litres</p>
                          <p className="font-bold text-info">{formatNumber(group.totalLitres)} L</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">CA</p>
                          <p className="font-bold text-success">{formatCurrency(group.totalMontant)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Prix moyen</p>
                          <p className="font-bold text-warning">{formatNumber(prixMoyen)} FCFA/L</p>
                        </div>
                      </div>

                      {/* Tableau des ventes */}
                      <div className="overflow-x-auto">
                        <table className="table table-sm w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th>N° Vente</th>
                              <th>Date</th>
                              <th className="text-right">Quantité</th>
                              <th className="text-right">Prix/L</th>
                              <th className="text-right">Montant</th>
                              <th className="text-center">Paiement</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.ventes.slice(0, 10).map(v => (
                              <tr key={v.id} className="hover:bg-gray-50">
                                <td>
                                  <div className="flex items-center gap-1 text-sm">
                                    <FileText className="w-3 h-3 text-gray-400" />
                                    <span className="font-medium">{v.numero_vente}</span>
                                  </div>
                                </td>
                                <td className="text-sm text-gray-600">
                                  {formatDate(v.date_vente)}
                                </td>
                                <td className="text-right font-semibold text-info">
                                  {formatNumber(v.quantite)} L
                                </td>
                                <td className="text-right text-sm text-gray-600">
                                  {formatNumber(v.prix_unitaire)} FCFA
                                </td>
                                <td className="text-right font-bold text-success">
                                  {formatCurrency(v.montant_net)}
                                </td>
                                <td className="text-center">
                                  <span className={`badge badge-sm ${v.est_paye ? 'badge-success' : 'badge-warning'}`}>
                                    {v.est_paye ? 'Payé' : 'En attente'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {group.ventes.length > 10 && (
                        <div className="p-3 text-center bg-gray-50 border-t">
                          <button
                            onClick={() => navigate(`/ventes-carburant?pompe=${group.pompe.id}`)}
                            className="btn btn-sm btn-outline gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Voir les {group.ventes.length} ventes
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ============ VUE LISTE DÉTAILLÉE ============ */
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th>N° Vente</th>
                  <th>Pompe</th>
                  <th className="hidden md:table-cell">Date</th>
                  <th className="text-right">Quantité</th>
                  <th className="text-right hidden lg:table-cell">Prix/L</th>
                  <th className="text-right">Montant net</th>
                  <th className="text-center">Paiement</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVentes.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-16">
                      <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Aucune vente trouvée</p>
                    </td>
                  </tr>
                ) : (
                  filteredVentes.slice(0, 100).map(v => {
                    const pompe = pompes.find(p => p.id === v.pompe);
                    return (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td>
                          <div className="flex items-center gap-1">
                            <FileText className="w-3 h-3 text-gray-400" />
                            <span className="font-medium text-sm">{v.numero_vente}</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Server className="w-3 h-3 text-primary" />
                            <span className="text-sm">
                              {pompe?.nom || `Pompe #${v.pompe}`}
                            </span>
                          </div>
                        </td>
                        <td className="hidden md:table-cell text-sm text-gray-600">
                          {formatDate(v.date_vente)}
                        </td>
                        <td className="text-right font-semibold text-info">
                          {formatNumber(v.quantite)} L
                        </td>
                        <td className="text-right hidden lg:table-cell text-sm text-gray-600">
                          {formatNumber(v.prix_unitaire)} FCFA
                        </td>
                        <td className="text-right font-bold text-success">
                          {formatCurrency(v.montant_net)}
                        </td>
                        <td className="text-center">
                          <span className={`badge badge-sm ${v.est_paye ? 'badge-success' : 'badge-warning'}`}>
                            {v.est_paye ? 'Payé' : 'En attente'}
                          </span>
                        </td>
                        <td className="text-center">
                          <button
                            onClick={() => navigate(`/ventes-carburant/${v.id}`)}
                            className="btn btn-ghost btn-sm btn-circle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {filteredVentes.length > 100 && (
            <div className="p-3 text-center bg-gray-50 border-t text-sm text-gray-500">
              Affichage des 100 premières ventes sur {filteredVentes.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VentesParPompe;