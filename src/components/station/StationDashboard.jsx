// src/components/station/StationDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, PointElement, LineElement, BarElement, Title, Filler } from 'chart.js';
import { Pie, Line, Bar, Doughnut } from 'react-chartjs-2';
import AxiosInstance from '../AxiosInstance';
import {
  Fuel, Server, Droplet, Wrench, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, RefreshCw, Plus, Eye,
  DollarSign, BarChart3, Activity, Award, Clock,
  Zap, Gauge, Car, Sparkles, Wallet, Users, Calendar,
  ArrowUpRight, ArrowDownRight, Target, Star
} from 'lucide-react';

// Enregistrement Chart.js
ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Title, Filler
);

const StationDashboard = () => {
  const navigate = useNavigate();

  // États
  const [dashboard, setDashboard] = useState(null);
  const [cuves, setCuves] = useState([]);
  const [pompes, setPompes] = useState([]);
  const [ventesCarburant, setVentesCarburant] = useState([]);
  const [ventesServices, setVentesServices] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [topPompes, setTopPompes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const formatNumber = (n) => new Intl.NumberFormat('fr-FR').format(parseFloat(n || 0));
  const formatCurrency = (n) => new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'XOF'
  }).format(parseFloat(n || 0)).replace('XOF', 'FCFA');
  const formatDate = (d) => d ? new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit'
  }) : '';

  // Charger toutes les données
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const headers = { Authorization: `Token ${token}` };

      // Appels en parallèle
      const [
        dashboardRes,
        cuvesRes,
        pompesRes,
        ventesCarbRes,
        ventesServRes,
      ] = await Promise.all([
        AxiosInstance.get('/statistiques/dashboard/', { headers }).catch(e => { throw e; }),
        AxiosInstance.get('/cuves/', { headers }).catch(() => ({ data: [] })),
        AxiosInstance.get('/pompes/', { headers }).catch(() => ({ data: [] })),
        AxiosInstance.get('/ventes-carburant/?limit=10', { headers }).catch(() => ({ data: [] })),
        AxiosInstance.get('/ventes-services/?limit=10', { headers }).catch(() => ({ data: [] })),
      ]);

      setDashboard(dashboardRes.data);

      const cuvesData = Array.isArray(cuvesRes.data) ? cuvesRes.data : (cuvesRes.data.results || []);
      const pompesData = Array.isArray(pompesRes.data) ? pompesRes.data : (pompesRes.data.results || []);
      const ventesCarbData = Array.isArray(ventesCarbRes.data) ? ventesCarbRes.data : (ventesCarbRes.data.results || []);
      const ventesServData = Array.isArray(ventesServRes.data) ? ventesServRes.data : (ventesServRes.data.results || []);

      setCuves(cuvesData);
      setPompes(pompesData);
      setVentesCarburant(ventesCarbData);
      setVentesServices(ventesServData);

      // Top 5 services (par CA)
      const servicesMap = {};
      ventesServData.forEach(v => {
        if (v.service_details) {
          const sid = v.service;
          if (!servicesMap[sid]) {
            servicesMap[sid] = {
              id: sid,
              nom: v.service_details.nom,
              type: v.service_details.type_service,
              count: 0,
              montant: 0,
            };
          }
          servicesMap[sid].count += 1;
          servicesMap[sid].montant += parseFloat(v.montant_net || 0);
        }
      });
      setTopServices(
        Object.values(servicesMap)
          .sort((a, b) => b.montant - a.montant)
          .slice(0, 5)
      );

      // Top 5 pompes (par litres)
      const pompesMap = {};
      ventesCarbData.forEach(v => {
        const pid = v.pompe;
        if (!pompesMap[pid]) {
          const pompeInfo = pompesData.find(p => p.id === pid);
          pompesMap[pid] = {
            id: pid,
            nom: pompeInfo?.nom || `Pompe #${pid}`,
            code: pompeInfo?.code || '—',
            litres: 0,
            montant: 0,
            count: 0,
          };
        }
        pompesMap[pid].litres += parseFloat(v.quantite || 0);
        pompesMap[pid].montant += parseFloat(v.montant_net || 0);
        pompesMap[pid].count += 1;
      });
      setTopPompes(
        Object.values(pompesMap)
          .sort((a, b) => b.litres - a.litres)
          .slice(0, 5)
      );
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Impossible de charger les données du tableau de bord');
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // ==== Loading ====
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">
            Chargement du tableau de bord...
          </p>
        </div>
      </div>
    );
  }

  // ==== Error ====
  if (error) {
    return (
      <div className="p-6">
        <div className="alert alert-error shadow-lg max-w-2xl mx-auto">
          <AlertTriangle className="w-6 h-6" />
          <span>{error}</span>
          <button className="btn btn-sm btn-ghost" onClick={fetchAllData}>
            <RefreshCw className="w-4 h-4 mr-2" /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  // ==== Extraction des données ====
  const d = dashboard || {};
  const ventesCarbJour = d.ventes_carburant_jour || {};
  const ventesServJour = d.ventes_services_jour || {};
  const ventesCarbMois = d.ventes_carburant_mois || {};

  const caJour = parseFloat(d.ca_jour || 0);
  const litresJour = parseFloat(ventesCarbJour.litres || 0);
  const montantCarbJour = parseFloat(ventesCarbJour.total || 0);
  const montantServJour = parseFloat(ventesServJour.total || 0);
  const litresMois = parseFloat(ventesCarbMois.litres || 0);
  const montantCarbMois = parseFloat(ventesCarbMois.total || 0);

  const nbVentesCarbJour = ventesCarbJour.nb || 0;
  const nbVentesServJour = ventesServJour.nb || 0;
  const nbVentesJour = nbVentesCarbJour + nbVentesServJour;

  const cuvesAlerte = d.cuves_en_alerte || 0;
  const pompesDispo = d.pompes_disponibles || 0;
  const totalPompes = pompes.length;
  const totalCuves = cuves.length;

  // Graphique : Répartition des cuves
  const cuvesNormales = cuves.filter(c => !c.est_en_alerte).length;

  const cuvesPieData = {
    labels: ['Normales', 'En alerte'],
    datasets: [{
      data: [cuvesNormales, cuvesAlerte],
      backgroundColor: ['#10b981', '#ef4444'],
      borderColor: ['#ffffff', '#ffffff'],
      borderWidth: 2,
    }],
  };

  // Graphique : Statut des pompes
  const pompesActives = pompes.filter(p => p.statut === 'active').length;
  const pompesMaintenance = pompes.filter(p => p.statut === 'maintenance').length;
  const pompesPanne = pompes.filter(p => p.statut === 'panne').length;
  const pompesInactives = pompes.filter(p => p.statut === 'inactive').length;

  const pompesPieData = {
    labels: ['Actives', 'Maintenance', 'En panne', 'Inactives'],
    datasets: [{
      data: [pompesActives, pompesMaintenance, pompesPanne, pompesInactives],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#6b7280'],
      borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
      borderWidth: 2,
    }],
  };

  // Graphique : Répartition CA (Carburant vs Services)
  const caPieData = {
    labels: ['Carburant', 'Services'],
    datasets: [{
      data: [montantCarbJour, montantServJour],
      backgroundColor: ['#3b82f6', '#8b5cf6'],
      borderColor: ['#ffffff', '#ffffff'],
      borderWidth: 2,
    }],
  };

  // Graphique : Cuves niveaux (bar)
  const cuvesBarData = {
    labels: cuves.slice(0, 8).map(c => c.nom),
    datasets: [
      {
        label: 'Niveau actuel (L)',
        data: cuves.slice(0, 8).map(c => parseFloat(c.niveau_actuel || 0)),
        backgroundColor: cuves.slice(0, 8).map(c =>
          c.est_en_alerte ? '#ef4444' : '#10b981'
        ),
        borderRadius: 6,
      },
      {
        label: 'Capacité max (L)',
        data: cuves.slice(0, 8).map(c => parseFloat(c.capacite_max || 0)),
        backgroundColor: 'rgba(148, 163, 184, 0.3)',
        borderRadius: 6,
      },
    ],
  };

  const cuvesBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${formatNumber(ctx.parsed.y)} L`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (v) => formatNumber(v) + ' L',
          font: { size: 10 },
        },
      },
      x: { ticks: { font: { size: 10 } } },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 8 } },
    },
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen space-y-4">

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <BarChart3 className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-primary">
              Tableau de bord Station
            </h1>
            <p className="text-sm text-gray-500">
              Vue d'ensemble de l'activité – {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={fetchAllData} className="btn btn-outline btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
          <button
            onClick={() => navigate('/ventes-carburant/nouveau')}
            className="btn btn-primary btn-sm gap-2"
          >
            <Plus className="w-4 h-4" /> Nouvelle vente
          </button>
        </div>
      </div>

      {/* ============ CARTES KPI ============ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">

        {/* CA du jour */}
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-success">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">CA du jour</span>
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <p className="text-xl font-black text-success">
            {formatCurrency(caJour)}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            {nbVentesJour} vente(s)
          </p>
        </div>

        {/* Litres vendus */}
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-info">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">Litres du jour</span>
            <Droplet className="w-4 h-4 text-info" />
          </div>
          <p className="text-xl font-black text-info">
            {formatNumber(litresJour)} L
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            {nbVentesCarbJour} vente(s) carb.
          </p>
        </div>

        {/* Ventes carburant */}
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-primary">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">Carburant jour</span>
            <Fuel className="w-4 h-4 text-primary" />
          </div>
          <p className="text-lg font-black text-primary">
            {formatCurrency(montantCarbJour)}
          </p>
        </div>

        {/* Ventes services */}
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-secondary">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">Services jour</span>
            <Wrench className="w-4 h-4 text-secondary" />
          </div>
          <p className="text-lg font-black text-secondary">
            {formatCurrency(montantServJour)}
          </p>
        </div>

        {/* Cuves en alerte */}
        <div className={`bg-white rounded-xl shadow-md p-4 border-l-4 ${cuvesAlerte > 0 ? 'border-error' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">Cuves alerte</span>
            {cuvesAlerte > 0 ? (
              <AlertTriangle className="w-4 h-4 text-error animate-pulse" />
            ) : (
              <CheckCircle className="w-4 h-4 text-success" />
            )}
          </div>
          <p className={`text-xl font-black ${cuvesAlerte > 0 ? 'text-error' : 'text-success'}`}>
            {cuvesAlerte}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            sur {totalCuves} cuve(s)
          </p>
        </div>

        {/* Pompes disponibles */}
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-warning">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">Pompes dispo.</span>
            <Server className="w-4 h-4 text-warning" />
          </div>
          <p className="text-xl font-black text-warning">
            {pompesDispo}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            sur {totalPompes} pompe(s)
          </p>
        </div>
      </div>

      {/* ============ ALERTES ============ */}
      {cuvesAlerte > 0 && (
        <div className="bg-error/5 border-l-4 border-error rounded-xl p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-error/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-error animate-pulse" />
              </div>
              <div>
                <p className="font-bold text-error">
                  {cuvesAlerte} cuve(s) en alerte
                </p>
                <p className="text-xs text-gray-600">
                  Niveau inférieur au seuil critique
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/cuves/alertes')}
              className="btn btn-error btn-sm gap-2"
            >
              <Eye className="w-4 h-4" /> Voir les cuves
            </button>
          </div>
        </div>
      )}

      {/* ============ GRAPHIQUES (2 cols) ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Répartition CA */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-primary" />
            <h3 className="font-bold">Répartition CA du jour</h3>
          </div>
          <div className="h-64">
            {caJour > 0 ? (
              <Doughnut data={caPieData} options={pieOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Aucune vente aujourd'hui
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3 text-center">
            <div className="bg-primary/5 rounded-lg p-2">
              <p className="text-xs text-gray-500">Carburant</p>
              <p className="font-bold text-primary text-sm">
                {formatCurrency(montantCarbJour)}
              </p>
            </div>
            <div className="bg-secondary/5 rounded-lg p-2">
              <p className="text-xs text-gray-500">Services</p>
              <p className="font-bold text-secondary text-sm">
                {formatCurrency(montantServJour)}
              </p>
            </div>
          </div>
        </div>

        {/* État des cuves */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center gap-2 mb-3">
            <Fuel className="w-5 h-5 text-primary" />
            <h3 className="font-bold">État des cuves</h3>
          </div>
          <div className="h-64">
            {totalCuves > 0 ? (
              <Doughnut data={cuvesPieData} options={pieOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Aucune cuve
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3 text-center">
            <div className="bg-success/5 rounded-lg p-2">
              <p className="text-xs text-gray-500">Normales</p>
              <p className="font-bold text-success text-sm">{cuvesNormales}</p>
            </div>
            <div className="bg-error/5 rounded-lg p-2">
              <p className="text-xs text-gray-500">En alerte</p>
              <p className="font-bold text-error text-sm">{cuvesAlerte}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============ GRAPHIQUE BARRES : Niveaux des cuves ============ */}
      {cuves.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-primary" />
              <h3 className="font-bold">Niveaux des cuves</h3>
            </div>
            <button
              onClick={() => navigate('/cuves')}
              className="btn btn-ghost btn-sm gap-1"
            >
              Voir tout <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="h-72">
            <Bar data={cuvesBarData} options={cuvesBarOptions} />
          </div>
        </div>
      )}

      {/* ============ TOP POMPES + TOP SERVICES ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Top pompes */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-5 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-warning" />
              <h3 className="font-bold">Top pompes (litres vendus)</h3>
            </div>
            <button
              onClick={() => navigate('/pompes/ventes')}
              className="btn btn-ghost btn-sm gap-1"
            >
              Voir tout <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {topPompes.length === 0 ? (
            <div className="py-12 text-center">
              <Server className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aucune vente récente</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {topPompes.map((p, idx) => {
                const maxLitres = topPompes[0]?.litres || 1;
                const pct = (p.litres / maxLitres) * 100;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => navigate(`/pompes/${p.id}`)}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      idx === 0 ? 'bg-warning/20 text-warning' :
                      idx === 1 ? 'bg-gray-300/40 text-gray-600' :
                      idx === 2 ? 'bg-orange-300/40 text-orange-700' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm truncate">{p.nom}</p>
                        <span className="text-xs font-bold text-info">
                          {formatNumber(p.litres)} L
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-info"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-gray-500">
                        <span>{p.count} vente(s)</span>
                        <span>{formatCurrency(p.montant)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top services */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-5 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-secondary" />
              <h3 className="font-bold">Top services (CA)</h3>
            </div>
            <button
              onClick={() => navigate('/ventes-services')}
              className="btn btn-ghost btn-sm gap-1"
            >
              Voir tout <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {topServices.length === 0 ? (
            <div className="py-12 text-center">
              <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aucune vente récente</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {topServices.map((s, idx) => {
                const maxMontant = topServices[0]?.montant || 1;
                const pct = (s.montant / maxMontant) * 100;
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => navigate(`/services/${s.id}`)}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      idx === 0 ? 'bg-warning/20 text-warning' :
                      idx === 1 ? 'bg-gray-300/40 text-gray-600' :
                      idx === 2 ? 'bg-orange-300/40 text-orange-700' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm truncate">{s.nom}</p>
                        <span className="text-xs font-bold text-secondary">
                          {formatCurrency(s.montant)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-secondary"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-gray-500">
                        <span>{s.count} vente(s)</span>
                        <span>Moy: {formatCurrency(s.montant / s.count)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============ DERNIÈRES VENTES ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Dernières ventes carburant */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-5 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fuel className="w-5 h-5 text-info" />
              <h3 className="font-bold">Dernières ventes carburant</h3>
            </div>
            <button
              onClick={() => navigate('/ventes-carburant')}
              className="btn btn-ghost btn-sm gap-1"
            >
              Voir tout <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {ventesCarburant.length === 0 ? (
            <div className="py-12 text-center">
              <Fuel className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aucune vente</p>
            </div>
          ) : (
            <div className="divide-y">
              {ventesCarburant.slice(0, 5).map(v => (
                <div
                  key={v.id}
                  onClick={() => navigate(`/ventes-carburant/${v.id}`)}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
                      <Fuel className="w-5 h-5 text-info" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{v.numero_vente}</p>
                      <p className="text-xs text-gray-500">
                        {formatNumber(v.quantite)} L · {formatDate(v.date_vente)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-success text-sm">
                      {formatCurrency(v.montant_net)}
                    </p>
                    <span className={`badge badge-xs ${v.est_paye ? 'badge-success' : 'badge-warning'}`}>
                      {v.est_paye ? 'Payé' : 'Attente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dernières ventes services */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-5 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-secondary" />
              <h3 className="font-bold">Dernières ventes services</h3>
            </div>
            <button
              onClick={() => navigate('/ventes-services')}
              className="btn btn-ghost btn-sm gap-1"
            >
              Voir tout <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {ventesServices.length === 0 ? (
            <div className="py-12 text-center">
              <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aucune vente</p>
            </div>
          ) : (
            <div className="divide-y">
              {ventesServices.slice(0, 5).map(v => (
                <div
                  key={v.id}
                  onClick={() => navigate(`/ventes-services/${v.id}`)}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{v.numero_vente}</p>
                      <p className="text-xs text-gray-500">
                        {v.service_details?.nom || 'Service'} · {formatDate(v.date_vente)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-success text-sm">
                      {formatCurrency(v.montant_net)}
                    </p>
                    <span className={`badge badge-xs ${v.est_paye ? 'badge-success' : 'badge-warning'}`}>
                      {v.est_paye ? 'Payé' : 'Attente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============ STATS MOIS ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl shadow-md p-5 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Carburant ce mois</p>
              <p className="text-2xl font-black text-primary mt-1">
                {formatNumber(litresMois)} L
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {formatCurrency(montantCarbMois)}
              </p>
            </div>
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <Fuel className="w-7 h-7 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl shadow-md p-5 border-l-4 border-secondary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Services ce mois</p>
              <p className="text-2xl font-black text-secondary mt-1">
                {formatNumber(ventesServices.length)} vente(s)
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {formatCurrency(
                  ventesServices.reduce((s, v) => s + parseFloat(v.montant_net || 0), 0)
                )}
              </p>
            </div>
            <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center">
              <Wrench className="w-7 h-7 text-secondary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StationDashboard;