// src/components/station/StatistiquesStation.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import AxiosInstance from '../AxiosInstance';
import {
  BarChart3, TrendingUp, TrendingDown, Fuel, Wrench,
  Droplet, DollarSign, Calendar, RefreshCw, Download,
  AlertCircle, CheckCircle, X, Award, Target, Activity,
  ArrowUpRight, ArrowDownRight, Clock, Users, Server,
  Printer, Filter, Eye
} from 'lucide-react';

// Enregistrement Chart.js
ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Filler
);

const StatistiquesStation = () => {
  const navigate = useNavigate();

  // États
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Filtres période
  const [period, setPeriod] = useState('30'); // 7, 30, 90, 365, custom
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Données calculées
  const [totaux, setTotaux] = useState({
    carburant: 0, litres: 0, services: 0, ca: 0,
    nbVentesCarb: 0, nbVentesServ: 0,
  });

  const getToken = () => localStorage.getItem('Token');
  const formatNumber = (n) => new Intl.NumberFormat('fr-FR').format(parseFloat(n || 0));
  const formatCurrency = (n) => new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'XOF'
  }).format(parseFloat(n || 0)).replace('XOF', 'FCFA');
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '';
  const formatDateShort = (d) => d ? new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short'
  }) : '';

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // Calculer les dates selon la période
  const getDateRange = () => {
    if (period === 'custom') {
      return { from: dateFrom, to: dateTo };
    }
    const today = new Date();
    const to = today.toISOString().split('T')[0];
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(period));
    const from = fromDate.toISOString().split('T')[0];
    return { from, to };
  };

  // Charger les stats
  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const { from, to } = getDateRange();

      const params = new URLSearchParams();
      if (from) params.append('date__gte', from);
      if (to) params.append('date__lte', to);

      let url = '/statistiques/';
      if (params.toString()) url += `?${params.toString()}`;

      const res = await AxiosInstance.get(url, {
        headers: { Authorization: `Token ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      // Trier par date croissante
      const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setStats(sorted);

      // Calcul totaux
      const totauxCalc = sorted.reduce((acc, s) => {
        acc.carburant += parseFloat(s.total_ventes_carburant || 0);
        acc.litres += parseFloat(s.total_litres_vendus || 0);
        acc.services += parseFloat(s.total_ventes_services || 0);
        acc.ca += parseFloat(s.total_ca || 0);
        acc.nbVentesCarb += parseInt(s.nb_ventes_carburant || 0);
        acc.nbVentesServ += parseInt(s.nb_ventes_services || 0);
        return acc;
      }, {
        carburant: 0, litres: 0, services: 0, ca: 0,
        nbVentesCarb: 0, nbVentesServ: 0,
      });

      setTotaux(totauxCalc);
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
    fetchStats();
  }, [period, dateFrom, dateTo]);

  // Recalculer une statistique du jour
  const handleCalculer = async () => {
    try {
      const token = getToken();
      await AxiosInstance.post('/statistiques/calculer/', {
        date: new Date().toISOString().split('T')[0]
      }, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Statistiques du jour actualisées', 'success');
      fetchStats();
    } catch (err) {
      showNotification('Erreur lors du calcul', 'error');
    }
  };

  // ==== Graphiques ====

  // Labels communs
  const labels = stats.map(s => formatDateShort(s.date));

  // Graphique CA (Line)
  const caLineData = {
    labels,
    datasets: [
      {
        label: 'Carburant',
        data: stats.map(s => parseFloat(s.total_ventes_carburant || 0)),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: 'Services',
        data: stats.map(s => parseFloat(s.total_ventes_services || 0)),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };

  // Graphique Litres (Bar)
  const litresBarData = {
    labels,
    datasets: [
      {
        label: 'Litres vendus',
        data: stats.map(s => parseFloat(s.total_litres_vendus || 0)),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderRadius: 6,
      },
    ],
  };

  // Graphique répartition (Doughnut)
  const repartitionData = {
    labels: ['Carburant', 'Services'],
    datasets: [{
      data: [totaux.carburant, totaux.services],
      backgroundColor: ['#3b82f6', '#8b5cf6'],
      borderColor: ['#ffffff', '#ffffff'],
      borderWidth: 2,
    }],
  };

  // Graphique nb transactions (Bar empilé)
  const transactionsBarData = {
    labels,
    datasets: [
      {
        label: 'Ventes carburant',
        data: stats.map(s => parseInt(s.nb_ventes_carburant || 0)),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderRadius: 6,
      },
      {
        label: 'Ventes services',
        data: stats.map(s => parseInt(s.nb_ventes_services || 0)),
        backgroundColor: 'rgba(139, 92, 246, 0.7)',
        borderRadius: 6,
      },
    ],
  };

  // Options
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (v) => formatNumber(v) + ' F',
          font: { size: 10 },
        },
      },
      x: { ticks: { font: { size: 10 } } },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${formatNumber(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { font: { size: 10 } } },
      x: { ticks: { font: { size: 10 } } },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 8 } },
    },
  };

  // Moyennes
  const moyennes = useMemo(() => {
    if (stats.length === 0) return { ca: 0, litres: 0, ventes: 0 };
    return {
      ca: totaux.ca / stats.length,
      litres: totaux.litres / stats.length,
      ventes: (totaux.nbVentesCarb + totaux.nbVentesServ) / stats.length,
    };
  }, [stats, totaux]);

  // Meilleur jour
  const meilleurJour = useMemo(() => {
    if (stats.length === 0) return null;
    return stats.reduce((best, s) => {
      return parseFloat(s.total_ca || 0) > parseFloat(best.total_ca || 0) ? s : best;
    }, stats[0]);
  }, [stats]);

  // Export CSV
  const handleExportCSV = () => {
    if (stats.length === 0) {
      showNotification('Aucune donnée à exporter', 'warning');
      return;
    }
    const headers = ['Date', 'Ventes carburant', 'Litres vendus', 'Ventes services', 'CA total', 'Nb ventes carb.', 'Nb ventes serv.'];
    const rows = stats.map(s => [
      s.date,
      s.total_ventes_carburant || 0,
      s.total_litres_vendus || 0,
      s.total_ventes_services || 0,
      s.total_ca || 0,
      s.nb_ventes_carburant || 0,
      s.nb_ventes_services || 0,
    ]);
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistiques-station-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Export CSV téléchargé', 'success');
  };

  return (
    <div className="space-y-4 p-4 sm:p-6 bg-gray-50 min-h-screen">

      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : notification.type === 'warning' ? 'alert-warning' : 'alert-error'} shadow-xl rounded-xl max-w-md`}>
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
            <div className="p-2 bg-primary/10 rounded-xl">
              <BarChart3 className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Statistiques Station
              </h1>
              <p className="text-sm text-gray-500">
                Analyse détaillée des ventes – {stats.length} jour(s) de données
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={fetchStats} className="btn btn-sm btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={handleCalculer} className="btn btn-sm btn-info gap-2">
              <Activity className="w-4 h-4" /> Recalculer aujourd'hui
            </button>
            <button onClick={handleExportCSV} className="btn btn-sm btn-primary gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={() => window.print()} className="btn btn-sm btn-ghost gap-2">
              <Printer className="w-4 h-4" /> Imprimer
            </button>
          </div>
        </div>
      </div>

      {/* Filtres période */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold">Période :</span>
          </div>

          <div className="join">
            {[
              { value: '7', label: '7 jours' },
              { value: '30', label: '30 jours' },
              { value: '90', label: '90 jours' },
              { value: '365', label: '1 an' },
            ].map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`join-item btn btn-sm ${period === p.value ? 'btn-primary' : 'btn-ghost'}`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setPeriod('custom')}
              className={`join-item btn btn-sm ${period === 'custom' ? 'btn-primary' : 'btn-ghost'}`}
            >
              Personnalisé
            </button>
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                className="input input-bordered input-sm"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <span className="text-gray-400">→</span>
              <input
                type="date"
                className="input input-bordered input-sm"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* ============ KPI TOTAUX ============ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-success">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">CA total</span>
            <DollarSign className="w-4 h-4 text-success" />
          </div>
          <p className="text-xl font-black text-success">
            {formatCurrency(totaux.ca)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-primary">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">Carburant</span>
            <Fuel className="w-4 h-4 text-primary" />
          </div>
          <p className="text-lg font-black text-primary">
            {formatCurrency(totaux.carburant)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-secondary">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">Services</span>
            <Wrench className="w-4 h-4 text-secondary" />
          </div>
          <p className="text-lg font-black text-secondary">
            {formatCurrency(totaux.services)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-info">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">Litres vendus</span>
            <Droplet className="w-4 h-4 text-info" />
          </div>
          <p className="text-xl font-black text-info">
            {formatNumber(totaux.litres)} L
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-warning">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">Ventes carb.</span>
            <Activity className="w-4 h-4 text-warning" />
          </div>
          <p className="text-xl font-black text-warning">
            {formatNumber(totaux.nbVentesCarb)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-accent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">Ventes serv.</span>
            <Wrench className="w-4 h-4 text-accent" />
          </div>
          <p className="text-xl font-black text-accent">
            {formatNumber(totaux.nbVentesServ)}
          </p>
        </div>
      </div>

      {/* ============ MOYENNES + MEILLEUR JOUR ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-gray-300">
          <p className="text-xs text-gray-500 font-medium mb-1">CA moyen / jour</p>
          <p className="text-lg font-bold text-gray-700">
            {formatCurrency(moyennes.ca)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-gray-300">
          <p className="text-xs text-gray-500 font-medium mb-1">Litres moyens / jour</p>
          <p className="text-lg font-bold text-gray-700">
            {formatNumber(moyennes.litres)} L
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-gray-300">
          <p className="text-xs text-gray-500 font-medium mb-1">Ventes moy. / jour</p>
          <p className="text-lg font-bold text-gray-700">
            {formatNumber(moyennes.ventes)}
          </p>
        </div>
        {meilleurJour && (
          <div className="bg-gradient-to-br from-warning/10 to-warning/5 rounded-xl shadow-md p-4 border-l-4 border-warning">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500 font-medium">Meilleur jour</p>
              <Award className="w-4 h-4 text-warning" />
            </div>
            <p className="text-lg font-bold text-warning">
              {formatDate(meilleurJour.date)}
            </p>
            <p className="text-xs text-gray-500">
              {formatCurrency(meilleurJour.total_ca)}
            </p>
          </div>
        )}
      </div>

      {/* ============ GRAPHIQUES ============ */}

      {/* Graphique CA (Line) */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Évolution du chiffre d'affaires</h3>
        </div>
        {stats.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
            Aucune donnée sur la période
          </div>
        ) : (
          <div className="h-72">
            <Line data={caLineData} options={lineOptions} />
          </div>
        )}
      </div>

      {/* 2 colonnes : Litres + Répartition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Litres (Bar) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center gap-2 mb-3">
            <Droplet className="w-5 h-5 text-info" />
            <h3 className="font-bold">Litres vendus par jour</h3>
          </div>
          {stats.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
              Aucune donnée
            </div>
          ) : (
            <div className="h-72">
              <Bar data={litresBarData} options={barOptions} />
            </div>
          )}
        </div>

        {/* Répartition */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-bold">Répartition du CA</h3>
          </div>
          {totaux.ca === 0 ? (
            <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
              Aucune donnée
            </div>
          ) : (
            <>
              <div className="h-56">
                <Doughnut data={repartitionData} options={doughnutOptions} />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-center">
                <div className="bg-primary/5 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Carburant</p>
                  <p className="font-bold text-primary text-sm">
                    {formatCurrency(totaux.carburant)}
                  </p>
                </div>
                <div className="bg-secondary/5 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Services</p>
                  <p className="font-bold text-secondary text-sm">
                    {formatCurrency(totaux.services)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Transactions (Bar empilé) */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-warning" />
          <h3 className="font-bold">Nombre de transactions par jour</h3>
        </div>
        {stats.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
            Aucune donnée
          </div>
        ) : (
          <div className="h-72">
            <Bar data={transactionsBarData} options={barOptions} />
          </div>
        )}
      </div>

      {/* ============ TABLEAU DÉTAILLÉ ============ */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-bold">Détail par jour</h3>
          </div>
          <span className="badge badge-primary">{stats.length}</span>
        </div>

        {stats.length === 0 ? (
          <div className="py-12 text-center">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="table table-sm w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th>Date</th>
                  <th className="text-right">Carburant</th>
                  <th className="text-right hidden md:table-cell">Litres</th>
                  <th className="text-right">Services</th>
                  <th className="text-right">CA total</th>
                  <th className="text-center hidden lg:table-cell">Ventes carb.</th>
                  <th className="text-center hidden lg:table-cell">Ventes serv.</th>
                </tr>
              </thead>
              <tbody>
                {[...stats].reverse().map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="font-medium text-sm">
                          {formatDate(s.date)}
                        </span>
                      </div>
                    </td>
                    <td className="text-right font-medium text-primary">
                      {formatCurrency(s.total_ventes_carburant)}
                    </td>
                    <td className="text-right hidden md:table-cell text-info font-semibold">
                      {formatNumber(s.total_litres_vendus)} L
                    </td>
                    <td className="text-right font-medium text-secondary">
                      {formatCurrency(s.total_ventes_services)}
                    </td>
                    <td className="text-right font-bold text-success">
                      {formatCurrency(s.total_ca)}
                    </td>
                    <td className="text-center hidden lg:table-cell">
                      <span className="badge badge-primary badge-sm">
                        {s.nb_ventes_carburant}
                      </span>
                    </td>
                    <td className="text-center hidden lg:table-cell">
                      <span className="badge badge-secondary badge-sm">
                        {s.nb_ventes_services}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatistiquesStation;