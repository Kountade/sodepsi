import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import AxiosInstance from '../AxiosInstance';
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Package,
  Calendar, RefreshCw, AlertTriangle, Download, Filter,
  ChevronLeft, ChevronRight
} from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const Statistiques = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [purchaseData, setPurchaseData] = useState(null);
  const [cashflowData, setCashflowData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);

  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleApiError = (err, defaultMessage) => {
    console.error(`❌ ${defaultMessage}:`, err);
    if (err.response) {
      const data = err.response.data;
      const msg = data?.error || data?.detail || data?.message || `Erreur ${err.response.status}`;
      return `Erreur ${err.response.status}: ${msg}`;
    }
    return defaultMessage;
  };

  const fetchSalesStats = async () => {
    try {
      const params = new URLSearchParams();
      params.append('period', period);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      const response = await AxiosInstance.get(`/statistique/sales/?${params.toString()}`);
      setSalesData(response.data);
    } catch (err) {
      const msg = handleApiError(err, 'Erreur chargement stats ventes');
      setError(msg);
    }
  };

  const fetchPurchaseStats = async () => {
    try {
      const params = new URLSearchParams();
      params.append('period', period);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      const response = await AxiosInstance.get(`/statistique/purchases/?${params.toString()}`);
      setPurchaseData(response.data);
    } catch (err) {
      const msg = handleApiError(err, 'Erreur chargement stats achats');
      setError(msg);
    }
  };

  const fetchCashflowStats = async () => {
    try {
      const params = new URLSearchParams();
      params.append('period', period);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      const response = await AxiosInstance.get(`/statistique/cashflow/?${params.toString()}`);
      setCashflowData(response.data);
    } catch (err) {
      const msg = handleApiError(err, 'Erreur chargement flux de trésorerie');
      setError(msg);
    }
  };

  const fetchInventoryStats = async () => {
    try {
      const response = await AxiosInstance.get('/statistique/inventory/');
      setInventoryData(response.data);
    } catch (err) {
      const msg = handleApiError(err, 'Erreur chargement stats inventaire');
      setError(msg);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchSalesStats(),
        fetchPurchaseStats(),
        fetchCashflowStats(),
        fetchInventoryStats(),
      ]);
    } catch (err) {
      // les erreurs sont déjà gérées individuellement
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [period, startDate, endDate]);

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

  // Préparation des données pour le graphique circulaire des ventes par statut
  const getSalesPieData = () => {
    if (!salesData || !salesData.by_status || Object.keys(salesData.by_status).length === 0) {
      return null;
    }
    const labels = Object.keys(salesData.by_status);
    const data = Object.values(salesData.by_status);
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return {
      labels: labels.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
      datasets: [
        {
          label: 'Ventes par statut',
          data: data,
          backgroundColor: colors.slice(0, data.length),
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    };
  };

  const pieOptions = {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content/60">Chargement des statistiques...</p>
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
          <button className="btn btn-sm btn-ghost" onClick={loadAllData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-base-200 min-h-screen">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Statistiques
          </h1>
          <p className="text-base-content/60 text-sm mt-1">
            Analyse détaillée des performances
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-base-content/60" />
            <select
              className="select select-bordered select-sm"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="day">Jour</option>
              <option value="week">Semaine</option>
              <option value="month">Mois</option>
              <option value="year">Année</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="input input-bordered input-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-xs">à</span>
            <input
              type="date"
              className="input input-bordered input-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button onClick={loadAllData} className="btn btn-primary btn-sm gap-2">
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div className="tabs tabs-boxed bg-base-100 shadow-md mb-6">
        <button
          className={`tab ${activeTab === 'sales' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Ventes
        </button>
        <button
          className={`tab ${activeTab === 'purchases' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('purchases')}
        >
          <TrendingDown className="w-4 h-4 mr-2" />
          Achats
        </button>
        <button
          className={`tab ${activeTab === 'cashflow' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('cashflow')}
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Trésorerie
        </button>
        <button
          className={`tab ${activeTab === 'inventory' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <Package className="w-4 h-4 mr-2" />
          Inventaire
        </button>
      </div>

      {/* Contenu des onglets */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body p-5">
          {activeTab === 'sales' && salesData && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Statistiques des ventes</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="stat bg-primary/5 rounded-lg p-3">
                  <div className="stat-title text-xs">Période</div>
                  <div className="stat-value text-sm">{salesData.period}</div>
                </div>
                <div className="stat bg-success/5 rounded-lg p-3">
                  <div className="stat-title text-xs">Total ventes</div>
                  <div className="stat-value text-lg font-bold">{formatNumber(salesData.total_sales)}</div>
                </div>
                <div className="stat bg-success/5 rounded-lg p-3">
                  <div className="stat-title text-xs">Montant total</div>
                  <div className="stat-value text-lg font-bold text-success">{formatCurrency(salesData.total_amount)}</div>
                </div>
                <div className="stat bg-info/5 rounded-lg p-3">
                  <div className="stat-title text-xs">Panier moyen</div>
                  <div className="stat-value text-lg font-bold text-info">{formatCurrency(salesData.average_order)}</div>
                </div>
              </div>

              {/* Graphique circulaire des ventes par statut */}
              {getSalesPieData() && (
                <div className="mt-4 mb-4">
                  <h4 className="text-md font-medium mb-2">Répartition par statut</h4>
                  <div className="h-64 max-w-md mx-auto">
                    <Pie data={getSalesPieData()} options={pieOptions} />
                  </div>
                </div>
              )}

              {salesData.by_status && Object.keys(salesData.by_status).length > 0 && (
                <div>
                  <p className="font-medium text-sm text-base-content/60 mb-2">Détail par statut</p>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(salesData.by_status).map(([status, count]) => (
                      <span key={status} className="badge badge-ghost gap-1">
                        {status}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'purchases' && purchaseData && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Statistiques des achats</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="stat bg-primary/5 rounded-lg p-3">
                  <div className="stat-title text-xs">Période</div>
                  <div className="stat-value text-sm">{purchaseData.period}</div>
                </div>
                <div className="stat bg-info/5 rounded-lg p-3">
                  <div className="stat-title text-xs">Commandes</div>
                  <div className="stat-value text-lg font-bold">{formatNumber(purchaseData.total_orders)}</div>
                </div>
                <div className="stat bg-info/5 rounded-lg p-3">
                  <div className="stat-title text-xs">Montant total</div>
                  <div className="stat-value text-lg font-bold text-info">{formatCurrency(purchaseData.total_amount)}</div>
                </div>
              </div>

              {purchaseData.top_suppliers && purchaseData.top_suppliers.length > 0 && (
                <div>
                  <p className="font-medium text-sm text-base-content/60 mb-2">Top fournisseurs</p>
                  <div className="overflow-x-auto">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Fournisseur</th>
                          <th className="text-right">Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseData.top_suppliers.map((s, idx) => (
                          <tr key={idx}>
                            <td>{s.supplier__name}</td>
                            <td className="text-right font-semibold">{formatCurrency(s.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cashflow' && cashflowData && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Flux de trésorerie</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="stat bg-primary/5 rounded-lg p-3">
                  <div className="stat-title text-xs">Période</div>
                  <div className="stat-value text-sm">{cashflowData.period}</div>
                </div>
                <div className="stat bg-success/5 rounded-lg p-3">
                  <div className="stat-title text-xs">Entrées</div>
                  <div className="stat-value text-lg font-bold text-success">{formatCurrency(cashflowData.total_entries)}</div>
                </div>
                <div className="stat bg-error/5 rounded-lg p-3">
                  <div className="stat-title text-xs">Sorties</div>
                  <div className="stat-value text-lg font-bold text-error">{formatCurrency(cashflowData.total_exits)}</div>
                </div>
                <div className={`stat ${cashflowData.net_flow >= 0 ? 'bg-success/5' : 'bg-error/5'} rounded-lg p-3`}>
                  <div className="stat-title text-xs">Solde net</div>
                  <div className={`stat-value text-lg font-bold ${cashflowData.net_flow >= 0 ? 'text-success' : 'text-error'}`}>
                    {formatCurrency(cashflowData.net_flow)}
                  </div>
                </div>
              </div>

              {cashflowData.daily && cashflowData.daily.length > 0 && (
                <div>
                  <p className="font-medium text-sm text-base-content/60 mb-2">Évolution journalière</p>
                  <div className="overflow-x-auto">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th className="text-right">Entrées</th>
                          <th className="text-right">Sorties</th>
                          <th className="text-right">Solde</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cashflowData.daily.map((day, idx) => (
                          <tr key={idx}>
                            <td>{new Date(day.date).toLocaleDateString('fr-FR')}</td>
                            <td className="text-right text-success">{formatCurrency(day.entries)}</td>
                            <td className="text-right text-error">{formatCurrency(day.exits)}</td>
                            <td className={`text-right font-semibold ${day.balance >= 0 ? 'text-success' : 'text-error'}`}>
                              {formatCurrency(day.balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'inventory' && inventoryData && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Statistiques d'inventaire</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stat bg-primary/5 rounded-lg p-3">
                  <div className="stat-title text-xs">Produits actifs</div>
                  <div className="stat-value text-lg font-bold">{formatNumber(inventoryData.total_products)}</div>
                </div>
                <div className="stat bg-success/5 rounded-lg p-3">
                  <div className="stat-title text-xs">Valeur du stock</div>
                  <div className="stat-value text-lg font-bold text-success">{formatCurrency(inventoryData.total_stock_value)}</div>
                </div>
                <div className="stat bg-warning/5 rounded-lg p-3">
                  <div className="stat-title text-xs">Stock faible</div>
                  <div className="stat-value text-lg font-bold text-warning">{formatNumber(inventoryData.low_stock_items)}</div>
                </div>
                <div className="stat bg-error/5 rounded-lg p-3">
                  <div className="stat-title text-xs">Rupture</div>
                  <div className="stat-value text-lg font-bold text-error">{formatNumber(inventoryData.out_of_stock_items)}</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-base-content/60">
                Entrepôts: {formatNumber(inventoryData.warehouses_count)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Statistiques;