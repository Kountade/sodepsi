// src/components/dashboard/DashboardAchats.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import AxiosInstance from '../AxiosInstance';
import {
  Package, ShoppingCart, Truck, DollarSign, AlertTriangle,
  TrendingUp, TrendingDown, Users, Warehouse, Clock,
  RefreshCw, Eye, Calendar, CreditCard, FileText, Building2, Receipt
} from 'lucide-react';

// Enregistrement des composants Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

const DashboardAchats = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AxiosInstance.get('/dashboard-stats/statistics/');
      setStats(response.data);
    } catch (err) {
      console.error('Erreur chargement dashboard achats:', err);
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
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content/60">Chargement du tableau de bord achats...</p>
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
          <button className="btn btn-sm btn-ghost" onClick={fetchStats}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 text-center">
        <p className="text-base-content/60">Aucune donnée disponible</p>
      </div>
    );
  }

  const {
    orders = {},
    receipts = {},
    invoices = {},
    suppliers = {},
    alerts = {},
  } = stats;

  const formatCurrency = (num) => {
    if (num === undefined || num === null) return '0 FCFA';
    const value = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(value)) return '0 FCFA';
    return `${value.toLocaleString('fr-FR')} FCFA`;
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  // Données pour le graphique des commandes
  const ordersPieData = {
    labels: ['Brouillons', 'Envoyées', 'Confirmées', 'Reçues', 'Annulées'],
    datasets: [
      {
        label: 'Commandes',
        data: [
          orders.by_status?.draft || 0,
          orders.by_status?.sent || 0,
          orders.by_status?.confirmed || 0,
          orders.by_status?.received || 0,
          orders.by_status?.cancelled || 0,
        ],
        backgroundColor: ['#6b7280', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 2,
      },
    ],
  };

  const ordersPieOptions = {
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

  // Données pour le graphique des factures
  const invoicesPieData = {
    labels: ['Payées', 'Partielles', 'Impayées', 'En retard'],
    datasets: [
      {
        label: 'Factures',
        data: [
          (invoices.total || 0) - (invoices.unpaid || 0) - (invoices.overdue || 0),
          Math.max(0, (invoices.unpaid || 0) - (invoices.overdue || 0)),
          invoices.overdue || 0,
          0,
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 2,
      },
    ],
  };

  const invoicesPieOptions = {
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

  return (
    <div className="p-4 md:p-6 bg-base-200 min-h-screen">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Tableau de bord Achats
          </h1>
          <p className="text-base-content/60 text-sm mt-1">
            Vue d'ensemble des achats, fournisseurs et factures
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchStats} className="btn btn-outline gap-2">
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
          <button
            onClick={() => navigate('/commandes-fournisseurs/nouveau')}
            className="btn btn-primary gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Nouvelle commande
          </button>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Fournisseurs */}
        <div
          className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/fournisseurs')}
        >
          <div className="card-body p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/60 text-sm font-medium">Fournisseurs</p>
                <p className="text-2xl font-bold">{formatNumber(suppliers.total || 0)}</p>
                <div className="flex gap-3 text-xs mt-1">
                  <span className="text-primary">
                    Top: {formatNumber(suppliers.top?.length || 0)}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Commandes */}
        <div
          className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/commandes-fournisseurs')}
        >
          <div className="card-body p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/60 text-sm font-medium">Commandes</p>
                <p className="text-2xl font-bold">{formatNumber(orders.total || 0)}</p>
                <div className="flex flex-wrap gap-2 text-xs mt-1">
                  <span className="text-warning">
                    {formatNumber(orders.pending || 0)} en attente
                  </span>
                </div>
                <p className="text-xs text-success font-semibold mt-1">
                  {formatCurrency(orders.total_amount || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-warning" />
              </div>
            </div>
          </div>
        </div>

        {/* Réceptions */}
        <div
          className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/receptions')}
        >
          <div className="card-body p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/60 text-sm font-medium">Réceptions</p>
                <p className="text-2xl font-bold">{formatNumber(receipts.total || 0)}</p>
                <div className="flex flex-wrap gap-2 text-xs mt-1">
                  <span className="text-info">
                    {formatNumber(receipts.pending || 0)} en attente
                  </span>
                  {receipts.non_invoiced > 0 && (
                    <span className="text-warning">
                      {formatNumber(receipts.non_invoiced)} non facturées
                    </span>
                  )}
                </div>
                <p className="text-xs text-info font-semibold mt-1">
                  {formatCurrency(receipts.received_amount || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-info/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-info" />
              </div>
            </div>
          </div>
        </div>

        {/* Factures */}
        <div
          className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/factures-fournisseurs')}
        >
          <div className="card-body p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/60 text-sm font-medium">Factures</p>
                <p className="text-2xl font-bold">{formatNumber(invoices.total || 0)}</p>
                <div className="flex flex-wrap gap-2 text-xs mt-1">
                  <span className="text-error">
                    {formatNumber(invoices.unpaid || 0)} impayées
                  </span>
                  {invoices.overdue > 0 && (
                    <span className="text-error font-semibold">
                      {formatNumber(invoices.overdue)} en retard
                    </span>
                  )}
                </div>
                <p className="text-xs text-error font-semibold mt-1">
                  {formatCurrency(invoices.total_remaining_to_pay || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-error" />
              </div>
            </div>
          </div>
        </div>

        {/* Paiements */}
        <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow border-l-4 border-success">
          <div className="card-body p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/60 text-sm font-medium">Décaissements</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(invoices.total_paid || 0)}
                </p>
                <div className="flex flex-wrap gap-3 text-xs mt-1">
                  <span>
                    Facturé: {formatCurrency(invoices.total_invoiced || 0)}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques circulaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-5">
            <h3 className="text-lg font-semibold mb-2">État des commandes</h3>
            <div className="h-64">
              <Pie data={ordersPieData} options={ordersPieOptions} />
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-5">
            <h3 className="text-lg font-semibold mb-2">État des factures</h3>
            <div className="h-64">
              <Pie data={invoicesPieData} options={invoicesPieOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Alertes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          className="card bg-base-100 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/factures-fournisseurs?is_overdue=true')}
        >
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-error" />
              <div>
                <p className="text-sm font-medium">Factures en retard</p>
                <p className="text-xl font-bold text-error">
                  {formatNumber(alerts.overdue_invoices || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="card bg-base-100 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/receptions?status=pending')}
        >
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-warning" />
              <div>
                <p className="text-sm font-medium">Réceptions en attente</p>
                <p className="text-xl font-bold text-warning">
                  {formatNumber(alerts.pending_receipts || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="card bg-base-100 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/commandes-fournisseurs?status=draft')}
        >
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5 text-info" />
              <div>
                <p className="text-sm font-medium">Commandes en attente</p>
                <p className="text-xl font-bold text-info">
                  {formatNumber(alerts.pending_orders || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="card bg-base-100 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/receptions?is_invoiced=false')}
        >
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-warning" />
              <div>
                <p className="text-sm font-medium">Réceptions non facturées</p>
                <p className="text-xl font-bold text-warning">
                  {formatNumber(alerts.non_invoiced_receipts || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top fournisseurs */}
      {suppliers.top && suppliers.top.length > 0 && (
        <div className="card bg-base-100 shadow-md mb-6">
          <div className="card-body p-5">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              Top fournisseurs
              <span className="badge badge-primary badge-sm ml-2">
                {formatNumber(suppliers.top.length)}
              </span>
            </h3>
            <div className="divider my-1"></div>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th className="w-12">#</th>
                    <th>Fournisseur</th>
                    <th className="text-center">Commandes</th>
                    <th className="text-right">Montant total</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.top.map((supplier, idx) => (
                    <tr
                      key={supplier.id || idx}
                      className="hover cursor-pointer"
                      onClick={() => navigate(`/fournisseurs/${supplier.id}`)}
                    >
                      <td>
                        <span className="badge badge-ghost badge-sm">{idx + 1}</span>
                      </td>
                      <td className="font-medium">{supplier.name}</td>
                      <td className="text-center">
                        <span className="badge badge-primary badge-sm">
                          {supplier.total_orders}
                        </span>
                      </td>
                      <td className="text-right font-semibold text-primary">
                        {formatCurrency(supplier.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body p-5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Actions rapides
          </h2>
          <div className="divider my-2"></div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/commandes-fournisseurs/nouveau')}
              className="btn btn-primary gap-2"
            >
              <ShoppingCart className="w-4 h-4" /> Nouvelle commande
            </button>
            <button
              onClick={() => navigate('/receptions/nouveau')}
              className="btn btn-success gap-2"
            >
              <Package className="w-4 h-4" /> Nouvelle réception
            </button>
            <button
              onClick={() => navigate('/factures-fournisseurs/nouveau')}
              className="btn btn-warning gap-2"
            >
              <Receipt className="w-4 h-4" /> Nouvelle facture
            </button>
            <button
              onClick={() => navigate('/paiements-fournisseurs/nouveau')}
              className="btn btn-info gap-2"
            >
              <CreditCard className="w-4 h-4" /> Nouveau paiement
            </button>
            <button
              onClick={() => navigate('/fournisseurs/nouveau')}
              className="btn btn-outline gap-2"
            >
              <Building2 className="w-4 h-4" /> Nouveau fournisseur
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAchats;