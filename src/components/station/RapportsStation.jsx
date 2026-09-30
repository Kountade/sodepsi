// src/components/station/RapportsStation.jsx
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
  FileSpreadsheet, Printer, Download, Calendar, RefreshCw,
  Fuel, Wrench, Droplet, DollarSign, TrendingUp, Award,
  CheckCircle, AlertCircle, X, Server, Clock, Users,
  BarChart3, FileText, Filter, Eye, Building2, Target
} from 'lucide-react';

ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Filler
);

const RapportsStation = () => {
  const navigate = useNavigate();

  // États principaux
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [reportType, setReportType] = useState('journalier'); // journalier, hebdo, mensuel, personnalise

  // Dates
  const today = new Date().toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);

  // Données
  const [ventesCarburant, setVentesCarburant] = useState([]);
  const [ventesServices, setVentesServices] = useState([]);
  const [mouvementsCuves, setMouvementsCuves] = useState([]);
  const [mouvementsPompes, setMouvementsPompes] = useState([]);
  const [cuves, setCuves] = useState([]);
  const [pompes, setPompes] = useState([]);
  const [services, setServices] = useState([]);

  const getToken = () => localStorage.getItem('Token');
  const formatNumber = (n) => new Intl.NumberFormat('fr-FR').format(parseFloat(n || 0));
  const formatCurrency = (n) => new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'XOF'
  }).format(parseFloat(n || 0)).replace('XOF', 'FCFA');
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '';
  const formatDateLong = (d) => d ? new Date(d).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }) : '';

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // Calculer la plage de dates selon le type
  const applyPeriod = (type) => {
    const now = new Date();
    const to = now.toISOString().split('T')[0];
    let from;

    switch (type) {
      case 'journalier':
        from = to;
        break;
      case 'hebdo':
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 6);
        from = weekAgo.toISOString().split('T')[0];
        break;
      case 'mensuel':
        const monthAgo = new Date(now);
        monthAgo.setDate(now.getDate() - 29);
        from = monthAgo.toISOString().split('T')[0];
        break;
      default:
        return;
    }
    setDateFrom(from);
    setDateTo(to);
    setReportType(type);
  };

  // Charger toutes les données
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const headers = { Authorization: `Token ${token}` };
      const dateParams = `date_debut=${dateFrom}&date_fin=${dateTo}`;

      const results = await Promise.allSettled([
        AxiosInstance.get(`/ventes-carburant/?${dateParams}`, { headers }),
        AxiosInstance.get(`/ventes-services/?${dateParams}`, { headers }),
        AxiosInstance.get(`/mouvements-cuves/?${dateParams}`, { headers }),
        AxiosInstance.get(`/mouvements-pompes/?${dateParams}`, { headers }),
        AxiosInstance.get('/cuves/', { headers }),
        AxiosInstance.get('/pompes/', { headers }),
        AxiosInstance.get('/services/', { headers }),
      ]);

      const extract = (result) => {
        if (result.status !== 'fulfilled') return [];
        const data = result.value.data;
        return Array.isArray(data) ? data : (data.results || []);
      };

      setVentesCarburant(extract(results[0]));
      setVentesServices(extract(results[1]));
      setMouvementsCuves(extract(results[2]));
      setMouvementsPompes(extract(results[3]));
      setCuves(extract(results[4]));
      setPompes(extract(results[5]));
      setServices(extract(results[6]));
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
    fetchAllData();
  }, [dateFrom, dateTo]);

  // ==================== CALCULS ====================

  // Total carburant
  const totalCarburant = useMemo(() => {
    return ventesCarburant.reduce((s, v) => s + parseFloat(v.montant_net || 0), 0);
  }, [ventesCarburant]);

  const totalLitres = useMemo(() => {
    return ventesCarburant.reduce((s, v) => s + parseFloat(v.quantite || 0), 0);
  }, [ventesCarburant]);

  // Total services
  const totalServices = useMemo(() => {
    return ventesServices.reduce((s, v) => s + parseFloat(v.montant_net || 0), 0);
  }, [ventesServices]);

  const totalCA = totalCarburant + totalServices;
  const nbVentesCarb = ventesCarburant.length;
  const nbVentesServ = ventesServices.length;
  const ticketMoyen = (nbVentesCarb + nbVentesServ) > 0
    ? totalCA / (nbVentesCarb + nbVentesServ)
    : 0;

  // Ventes par pompe
  const ventesParPompe = useMemo(() => {
    const map = {};
    ventesCarburant.forEach(v => {
      const pid = v.pompe;
      if (!map[pid]) {
        const pompeInfo = pompes.find(p => p.id === pid);
        map[pid] = {
          id: pid,
          nom: pompeInfo?.nom || `Pompe #${pid}`,
          code: pompeInfo?.code || '—',
          litres: 0,
          montant: 0,
          count: 0,
        };
      }
      map[pid].litres += parseFloat(v.quantite || 0);
      map[pid].montant += parseFloat(v.montant_net || 0);
      map[pid].count += 1;
    });
    return Object.values(map).sort((a, b) => b.montant - a.montant);
  }, [ventesCarburant, pompes]);

  // Ventes par service
  const ventesParService = useMemo(() => {
    const map = {};
    ventesServices.forEach(v => {
      const sid = v.service;
      if (!map[sid]) {
        const serviceInfo = services.find(s => s.id === sid);
        map[sid] = {
          id: sid,
          nom: serviceInfo?.nom || v.service_details?.nom || `Service #${sid}`,
          code: serviceInfo?.code || '—',
          count: 0,
          montant: 0,
        };
      }
      map[sid].count += 1;
      map[sid].montant += parseFloat(v.montant_net || 0);
    });
    return Object.values(map).sort((a, b) => b.montant - a.montant);
  }, [ventesServices, services]);

  // Répartition par mode de paiement
  const repartitionPaiement = useMemo(() => {
    const map = {};
    [...ventesCarburant, ...ventesServices].forEach(v => {
      const key = v.type_paiement || 'cash';
      if (!map[key]) map[key] = { count: 0, montant: 0 };
      map[key].count += 1;
      map[key].montant += parseFloat(v.montant_net || 0);
    });
    return map;
  }, [ventesCarburant, ventesServices]);

  // Mouvements cuves (appro + ventes)
  const mouvementsCuvesStats = useMemo(() => {
    const appro = mouvementsCuves.filter(m => m.type_mouvement === 'approvisionnement');
    const ventes = mouvementsCuves.filter(m => m.type_mouvement === 'vente');
    return {
      totalAppro: appro.reduce((s, m) => s + parseFloat(m.quantite || 0), 0),
      totalVentes: ventes.reduce((s, m) => s + parseFloat(m.quantite || 0), 0),
      countAppro: appro.length,
      countVentes: ventes.length,
    };
  }, [mouvementsCuves]);

  // ==== Graphiques ====
  const repartitionCAData = {
    labels: ['Carburant', 'Services'],
    datasets: [{
      data: [totalCarburant, totalServices],
      backgroundColor: ['#3b82f6', '#8b5cf6'],
      borderColor: ['#ffffff', '#ffffff'],
      borderWidth: 2,
    }],
  };

  const topPompesData = {
    labels: ventesParPompe.slice(0, 10).map(p => p.nom),
    datasets: [{
      label: 'CA (FCFA)',
      data: ventesParPompe.slice(0, 10).map(p => p.montant),
      backgroundColor: 'rgba(59, 130, 246, 0.7)',
      borderRadius: 6,
    }],
  };

  const topServicesData = {
    labels: ventesParService.slice(0, 10).map(s => s.nom),
    datasets: [{
      label: 'CA (FCFA)',
      data: ventesParService.slice(0, 10).map(s => s.montant),
      backgroundColor: 'rgba(139, 92, 246, 0.7)',
      borderRadius: 6,
    }],
  };

  const barHorizontalOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => formatCurrency(ctx.parsed.x),
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { callback: (v) => formatNumber(v) + ' F', font: { size: 10 } },
      },
      y: { ticks: { font: { size: 10 } } },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 8 } },
    },
  };

  // Export CSV
  const handleExportCSV = () => {
    const lines = [];
    lines.push('RAPPORT STATION');
    lines.push(`Période;${dateFrom} au ${dateTo}`);
    lines.push('');
    lines.push('SYNTHÈSE');
    lines.push(`Carburant;${totalCarburant}`);
    lines.push(`Services;${totalServices}`);
    lines.push(`CA total;${totalCA}`);
    lines.push(`Litres vendus;${totalLitres}`);
    lines.push(`Ventes carburant;${nbVentesCarb}`);
    lines.push(`Ventes services;${nbVentesServ}`);
    lines.push(`Ticket moyen;${ticketMoyen}`);
    lines.push('');
    lines.push('VENTES PAR POMPE');
    lines.push('Pompe;Code;Litres;CA;Nb ventes');
    ventesParPompe.forEach(p => {
      lines.push(`${p.nom};${p.code};${p.litres};${p.montant};${p.count}`);
    });
    lines.push('');
    lines.push('VENTES PAR SERVICE');
    lines.push('Service;Code;Nb ventes;CA');
    ventesParService.forEach(s => {
      lines.push(`${s.nom};${s.code};${s.count};${s.montant}`);
    });

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-station-${dateFrom}-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Rapport CSV téléchargé', 'success');
  };

  // Impression
  const handlePrint = () => window.print();

  // ==================== RENDU ====================
  return (
    <div className="space-y-4 p-4 sm:p-6 bg-gray-50 min-h-screen">

      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 print:hidden">
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <FileSpreadsheet className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-primary">
              Rapports Station
            </h1>
            <p className="text-sm text-gray-500">
              Générez et imprimez vos rapports d'activité
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={fetchAllData} className="btn btn-sm btn-outline gap-2">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
          <button onClick={handleExportCSV} className="btn btn-sm btn-primary gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={handlePrint} className="btn btn-sm btn-info gap-2">
            <Printer className="w-4 h-4" /> Imprimer
          </button>
        </div>
      </div>

      {/* Sélection de la période */}
      <div className="bg-white rounded-xl shadow-md p-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold">Période :</span>
          </div>

          <div className="join">
            <button
              onClick={() => applyPeriod('journalier')}
              className={`join-item btn btn-sm ${reportType === 'journalier' ? 'btn-primary' : 'btn-ghost'}`}
            >
              Journalier
            </button>
            <button
              onClick={() => applyPeriod('hebdo')}
              className={`join-item btn btn-sm ${reportType === 'hebdo' ? 'btn-primary' : 'btn-ghost'}`}
            >
              7 derniers jours
            </button>
            <button
              onClick={() => applyPeriod('mensuel')}
              className={`join-item btn btn-sm ${reportType === 'mensuel' ? 'btn-primary' : 'btn-ghost'}`}
            >
              30 derniers jours
            </button>
            <button
              onClick={() => setReportType('personnalise')}
              className={`join-item btn btn-sm ${reportType === 'personnalise' ? 'btn-primary' : 'btn-ghost'}`}
            >
              Personnalisé
            </button>
          </div>

          {(reportType === 'personnalise' || reportType === 'journalier') && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="input input-bordered input-sm"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setReportType('personnalise'); }}
              />
              <span className="text-gray-400">→</span>
              <input
                type="date"
                className="input input-bordered input-sm"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setReportType('personnalise'); }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ============ EN-TÊTE DU RAPPORT (pour impression) ============ */}
      <div className="hidden print:block mb-6">
        <div className="text-center border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold">RAPPORT D'ACTIVITÉ - STATION SERVICES</h1>
          <p className="text-sm mt-1">
            Période : {formatDateLong(dateFrom)} au {formatDateLong(dateTo)}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Généré le {new Date().toLocaleString('fr-FR')}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center bg-white rounded-xl shadow-md">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-gray-500 mt-4">Chargement des données...</p>
        </div>
      ) : (
        <>
          {/* ============ SYNTHÈSE ============ */}
          <div className="bg-white rounded-xl shadow-md p-5">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Synthèse de la période
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-xl p-4 border-l-4 border-success">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 font-medium">CA total</span>
                  <DollarSign className="w-4 h-4 text-success" />
                </div>
                <p className="text-lg font-black text-success">
                  {formatCurrency(totalCA)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border-l-4 border-primary">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 font-medium">Carburant</span>
                  <Fuel className="w-4 h-4 text-primary" />
                </div>
                <p className="text-base font-black text-primary">
                  {formatCurrency(totalCarburant)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl p-4 border-l-4 border-secondary">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 font-medium">Services</span>
                  <Wrench className="w-4 h-4 text-secondary" />
                </div>
                <p className="text-base font-black text-secondary">
                  {formatCurrency(totalServices)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-info/10 to-info/5 rounded-xl p-4 border-l-4 border-info">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 font-medium">Litres</span>
                  <Droplet className="w-4 h-4 text-info" />
                </div>
                <p className="text-lg font-black text-info">
                  {formatNumber(totalLitres)} L
                </p>
              </div>

              <div className="bg-gradient-to-br from-warning/10 to-warning/5 rounded-xl p-4 border-l-4 border-warning">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 font-medium">Ventes</span>
                  <TrendingUp className="w-4 h-4 text-warning" />
                </div>
                <p className="text-lg font-black text-warning">
                  {nbVentesCarb + nbVentesServ}
                </p>
                <p className="text-[10px] text-gray-500">
                  {nbVentesCarb} carb + {nbVentesServ} serv
                </p>
              </div>

              <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl p-4 border-l-4 border-accent">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 font-medium">Ticket moyen</span>
                  <Award className="w-4 h-4 text-accent" />
                </div>
                <p className="text-base font-black text-accent">
                  {formatCurrency(ticketMoyen)}
                </p>
              </div>
            </div>
          </div>

          {/* ============ GRAPHIQUES ============ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 print:hidden">

            {/* Répartition CA */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Répartition du CA
              </h3>
              {totalCA === 0 ? (
                <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
                  Aucune vente
                </div>
              ) : (
                <div className="h-56">
                  <Doughnut data={repartitionCAData} options={doughnutOptions} />
                </div>
              )}
            </div>

            {/* Top pompes */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Server className="w-5 h-5 text-primary" />
                Top pompes
              </h3>
              {ventesParPompe.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
                  Aucune vente
                </div>
              ) : (
                <div className="h-56">
                  <Bar data={topPompesData} options={barHorizontalOptions} />
                </div>
              )}
            </div>

            {/* Top services */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-secondary" />
                Top services
              </h3>
              {ventesParService.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
                  Aucune vente
                </div>
              ) : (
                <div className="h-56">
                  <Bar data={topServicesData} options={barHorizontalOptions} />
                </div>
              )}
            </div>
          </div>

          {/* ============ DÉTAIL CARBURANT ============ */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fuel className="w-5 h-5 text-primary" />
                <h2 className="font-bold">Ventes de carburant par pompe</h2>
              </div>
              <span className="badge badge-primary">
                {ventesParPompe.length} pompe(s)
              </span>
            </div>

            {ventesParPompe.length === 0 ? (
              <div className="py-12 text-center">
                <Server className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Aucune vente de carburant sur cette période</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th>Pompe</th>
                      <th className="hidden md:table-cell">Code</th>
                      <th className="text-right">Litres vendus</th>
                      <th className="text-right">Nb ventes</th>
                      <th className="text-right">CA carburant</th>
                      <th className="text-right hidden lg:table-cell">Prix moyen/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventesParPompe.map(p => {
                      const prixMoyen = p.litres > 0 ? p.montant / p.litres : 0;
                      return (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Server className="w-4 h-4 text-primary" />
                              </div>
                              <span className="font-semibold text-sm">{p.nom}</span>
                            </div>
                          </td>
                          <td className="hidden md:table-cell text-sm text-gray-500">{p.code}</td>
                          <td className="text-right font-semibold text-info">
                            {formatNumber(p.litres)} L
                          </td>
                          <td className="text-right">
                            <span className="badge badge-sm">{p.count}</span>
                          </td>
                          <td className="text-right font-bold text-primary">
                            {formatCurrency(p.montant)}
                          </td>
                          <td className="text-right hidden lg:table-cell text-sm text-gray-600">
                            {formatNumber(prixMoyen)} FCFA/L
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-primary/5 font-bold">
                    <tr>
                      <td colSpan="2" className="text-right">TOTAL</td>
                      <td className="text-right text-info">
                        {formatNumber(totalLitres)} L
                      </td>
                      <td className="text-right">{nbVentesCarb}</td>
                      <td className="text-right text-primary">
                        {formatCurrency(totalCarburant)}
                      </td>
                      <td className="hidden lg:table-cell"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* ============ DÉTAIL SERVICES ============ */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-secondary" />
                <h2 className="font-bold">Ventes de services</h2>
              </div>
              <span className="badge badge-secondary">
                {ventesParService.length} service(s)
              </span>
            </div>

            {ventesParService.length === 0 ? (
              <div className="py-12 text-center">
                <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Aucune vente de service sur cette période</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th>Service</th>
                      <th className="hidden md:table-cell">Code</th>
                      <th className="text-right">Nb ventes</th>
                      <th className="text-right">CA service</th>
                      <th className="text-right hidden lg:table-cell">Prix moyen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventesParService.map(s => {
                      const prixMoyen = s.count > 0 ? s.montant / s.count : 0;
                      return (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                                <Wrench className="w-4 h-4 text-secondary" />
                              </div>
                              <span className="font-semibold text-sm">{s.nom}</span>
                            </div>
                          </td>
                          <td className="hidden md:table-cell text-sm text-gray-500">{s.code}</td>
                          <td className="text-right">
                            <span className="badge badge-sm">{s.count}</span>
                          </td>
                          <td className="text-right font-bold text-secondary">
                            {formatCurrency(s.montant)}
                          </td>
                          <td className="text-right hidden lg:table-cell text-sm text-gray-600">
                            {formatCurrency(prixMoyen)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-secondary/5 font-bold">
                    <tr>
                      <td colSpan="2" className="text-right">TOTAL</td>
                      <td className="text-right">{nbVentesServ}</td>
                      <td className="text-right text-secondary">
                        {formatCurrency(totalServices)}
                      </td>
                      <td className="hidden lg:table-cell"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* ============ MOUVEMENTS CUVES ============ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-5 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-info" />
                  <h2 className="font-bold">Mouvements des cuves</h2>
                </div>
                <span className="badge badge-info">{mouvementsCuves.length}</span>
              </div>

              {mouvementsCuves.length === 0 ? (
                <div className="py-12 text-center">
                  <Fuel className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Aucun mouvement</p>
                </div>
              ) : (
                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-center p-3 bg-success/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-success" />
                      <span className="text-sm font-medium">Approvisionnements</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-success">
                        +{formatNumber(mouvementsCuvesStats.totalAppro)} L
                      </p>
                      <p className="text-xs text-gray-500">
                        {mouvementsCuvesStats.countAppro} mouvement(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary rotate-180" />
                      <span className="text-sm font-medium">Sorties (ventes)</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        -{formatNumber(mouvementsCuvesStats.totalVentes)} L
                      </p>
                      <p className="text-xs text-gray-500">
                        {mouvementsCuvesStats.countVentes} mouvement(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg border-t-2 border-gray-300">
                    <span className="text-sm font-bold">Variation nette</span>
                    <span className={`font-bold ${
                      (mouvementsCuvesStats.totalAppro - mouvementsCuvesStats.totalVentes) >= 0
                        ? 'text-success' : 'text-error'
                    }`}>
                      {(mouvementsCuvesStats.totalAppro - mouvementsCuvesStats.totalVentes) >= 0 ? '+' : ''}
                      {formatNumber(mouvementsCuvesStats.totalAppro - mouvementsCuvesStats.totalVentes)} L
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Répartition par paiement */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-5 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-success" />
                  <h2 className="font-bold">Répartition par paiement</h2>
                </div>
                <span className="badge badge-success">
                  {Object.keys(repartitionPaiement).length} mode(s)
                </span>
              </div>

              {Object.keys(repartitionPaiement).length === 0 ? (
                <div className="py-12 text-center">
                  <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Aucun paiement</p>
                </div>
              ) : (
                <div className="p-5 space-y-2">
                  {Object.entries(repartitionPaiement)
                    .sort((a, b) => b[1].montant - a[1].montant)
                    .map(([mode, data]) => {
                      const pct = totalCA > 0 ? (data.montant / totalCA) * 100 : 0;
                      return (
                        <div key={mode} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-semibold capitalize">
                              {mode.replace('_', ' ')}
                            </span>
                            <span className="text-sm font-bold text-success">
                              {formatCurrency(data.montant)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full bg-success"
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500 w-12 text-right">
                              {pct.toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {data.count} vente(s)
                          </p>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Pied de rapport (impression) */}
          <div className="hidden print:block text-center text-xs text-gray-500 pt-6 border-t mt-6">
            <p>Rapport généré automatiquement par SODEPCI ERP</p>
            <p>{new Date().toLocaleString('fr-FR')}</p>
          </div>
        </>
      )}

      {/* Styles d'impression */}
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:shadow-md { box-shadow: none !important; }
          .print\\:rounded-xl { border-radius: 0 !important; }
          .print\\:border { border-width: 1px !important; }
          .print\\:border-black { border-color: black !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>
    </div>
  );
};

export default RapportsStation;