import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import AxiosInstance from '../AxiosInstance';
import {
  Package, ShoppingBag, Truck, DollarSign, AlertTriangle,
  TrendingUp, TrendingDown, Users, Warehouse, Clock,
  RefreshCw, Eye, Calendar, CreditCard, FileText
} from 'lucide-react';

// Enregistrement des composants Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AxiosInstance.get('/dashboard/summary/');
      setSummary(response.data);
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
      let errorMessage = 'Impossible de charger les données du tableau de bord';
      if (err.response) {
        const data = err.response.data;
        errorMessage = data.error || data.detail || data.message || `Erreur ${err.response.status}`;
        setError(`Erreur ${err.response.status}: ${errorMessage}`);
      } else if (err.request) {
        setError('Aucune réponse du serveur. Vérifiez votre connexion.');
      } else {
        setError(`Erreur: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content/60">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="alert alert-error shadow-lg">
          <AlertTriangle className="w-6 h-6" />
          <span>{error}</span>
          <button className="btn btn-sm btn-ghost" onClick={fetchSummary}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6 text-center">
        <p className="text-base-content/60">Aucune donnée disponible</p>
      </div>
    );
  }

  const { products, sales, purchases, cash, alerts, recent_activities } = summary;

  const formatCurrency = (num) => {
    if (num === undefined || num === null) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' })
      .format(num)
      .replace('XOF', 'FCFA');
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Données pour le graphique des produits
  const productPieData = {
    labels: ['Normal', 'Stock faible', 'Rupture'],
    datasets: [
      {
        label: 'Produits',
        data: [
          products.total - products.low_stock - products.out_of_stock,
          products.low_stock,
          products.out_of_stock
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 2,
      },
    ],
  };

  const productPieOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#6b7280',
          font: { size: 12 },
        },
      },
    },
    maintainAspectRatio: false,
  };

  // Données pour le graphique des alertes
  const alertPieData = {
    labels: ['Stock faible', 'Lots expirant', 'Factures en retard'],
    datasets: [
      {
        label: 'Alertes',
        data: [alerts.low_stock, alerts.expiring_lots, alerts.overdue_invoices],
        backgroundColor: ['#f59e0b', '#ef4444', '#8b5cf6'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 2,
      },
    ],
  };

  const alertPieOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#6b7280',
          font: { size: 12 },
        },
      },
    },
    maintainAspectRatio: false,
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'vente': return <ShoppingBag className="w-4 h-4 text-success" />;
      case 'achat': return <Truck className="w-4 h-4 text-info" />;
      case 'mouvement': return <DollarSign className="w-4 h-4 text-warning" />;
      default: return <Clock className="w-4 h-4 text-base-content/40" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'vente': return 'border-l-success';
      case 'achat': return 'border-l-info';
      case 'mouvement': return 'border-l-warning';
      default: return 'border-l-base-300';
    }
  };

  return (
    <div className="p-4 md:p-6 bg-base-200 min-h-screen">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Tableau de bord
          </h1>
          <p className="text-base-content/60 text-sm mt-1">
            Vue d'ensemble de l'activité du magasin
          </p>
        </div>
        <button onClick={fetchSummary} className="btn btn-primary gap-2">
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/60 text-sm font-medium">Produits</p>
                <p className="text-2xl font-bold">{formatNumber(products.total)}</p>
                <div className="flex gap-3 text-xs mt-1">
                  <span className="text-error">Rupture: {formatNumber(products.out_of_stock)}</span>
                  <span className="text-warning">Stock faible: {formatNumber(products.low_stock)}</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/60 text-sm font-medium">Ventes (mois)</p>
                <p className="text-2xl font-bold">{formatNumber(sales.total_count)}</p>
                <p className="text-sm text-success font-semibold">{formatCurrency(sales.total_amount)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/60 text-sm font-medium">Achats (mois)</p>
                <p className="text-2xl font-bold">{formatNumber(purchases.total_count)}</p>
                <p className="text-sm text-info font-semibold">{formatCurrency(purchases.total_amount)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-info/10 flex items-center justify-center">
                <Truck className="w-6 h-6 text-info" />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/60 text-sm font-medium">Trésorerie</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(cash.total_available)}</p>
                <div className="flex gap-3 text-xs mt-1">
                  <span>Espèces: {formatCurrency(cash.total_cash)}</span>
                  <span>Banque: {formatCurrency(cash.total_bank)}</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques circulaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-5">
            <h3 className="text-lg font-semibold mb-2">État des produits</h3>
            <div className="h-64">
              <Pie data={productPieData} options={productPieOptions} />
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-5">
            <h3 className="text-lg font-semibold mb-2">Répartition des alertes</h3>
            <div className="h-64">
              <Pie data={alertPieData} options={alertPieOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Alertes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <div>
                <p className="text-sm font-medium">Alertes stock</p>
                <p className="text-xl font-bold text-warning">{formatNumber(alerts.low_stock)}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-error" />
              <div>
                <p className="text-sm font-medium">Lots expirant</p>
                <p className="text-xl font-bold text-error">{formatNumber(alerts.expiring_lots)}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-error" />
              <div>
                <p className="text-sm font-medium">Factures en retard</p>
                <p className="text-xl font-bold text-error">{formatNumber(alerts.overdue_invoices)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activités récentes */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body p-5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Activités récentes
          </h2>
          <div className="divider my-2"></div>
          <div className="space-y-3">
            {recent_activities && recent_activities.length > 0 ? (
              recent_activities.map((activity, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${getActivityColor(activity.type)} bg-base-200/50`}
                >
                  <div className="mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium capitalize">
                        {activity.type} - {activity.reference}
                      </span>
                      <span className="text-xs text-base-content/40">
                        {formatDate(activity.date)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-base-content/60">
                      {activity.amount && (
                        <span className="font-semibold text-success">
                          {formatCurrency(activity.amount)}
                        </span>
                      )}
                      {activity.user && (
                        <span>Par: {activity.user}</span>
                      )}
                      {activity.info && (
                        <span>{activity.info}</span>
                      )}
                    </div>
                  </div>
                  <Eye className="w-4 h-4 text-base-content/30 cursor-pointer hover:text-primary" />
                </div>
              ))
            ) : (
              <p className="text-center text-base-content/40 py-4">Aucune activité récente</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;