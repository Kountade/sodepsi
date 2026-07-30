import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import AxiosInstance from '../AxiosInstance';
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Package,
  Users, Truck, Calendar, RefreshCw, AlertTriangle, Download,
  Award, Star, Crown, Filter
} from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const Analyses = () => {
  const [activeTab, setActiveTab] = useState('top-products');
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const [topProducts, setTopProducts] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [topSuppliers, setTopSuppliers] = useState([]);
  const [trends, setTrends] = useState([]);
  const [financialHealth, setFinancialHealth] = useState(null);

  const [limit, setLimit] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleApiError = (err, key, defaultMessage) => {
    console.error(`❌ ${defaultMessage}:`, err);
    let msg = defaultMessage;
    if (err.response) {
      const data = err.response.data;
      if (data && typeof data === 'object') {
        msg = data.error || data.detail || data.message || `Erreur ${err.response.status}`;
      } else if (typeof data === 'string') {
        msg = data;
      }
    } else if (err.request) {
      msg = 'Aucune réponse du serveur. Vérifiez votre connexion.';
    } else {
      msg = err.message;
    }
    setErrors(prev => ({ ...prev, [key]: msg }));
    return msg;
  };

  const fetchTopProducts = async () => {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      const response = await AxiosInstance.get(`/analyse/top-products/?${params.toString()}`);
      setTopProducts(response.data);
      setErrors(prev => ({ ...prev, topProducts: null }));
    } catch (err) {
      handleApiError(err, 'topProducts', 'Erreur chargement top produits');
    }
  };

  const fetchTopClients = async () => {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      const response = await AxiosInstance.get(`/analyse/top-clients/?${params.toString()}`);
      setTopClients(response.data);
      setErrors(prev => ({ ...prev, topClients: null }));
    } catch (err) {
      handleApiError(err, 'topClients', 'Erreur chargement top clients');
    }
  };

  const fetchTopSuppliers = async () => {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      const response = await AxiosInstance.get(`/analyse/top-suppliers/?${params.toString()}`);
      setTopSuppliers(response.data);
      setErrors(prev => ({ ...prev, topSuppliers: null }));
    } catch (err) {
      handleApiError(err, 'topSuppliers', 'Erreur chargement top fournisseurs');
    }
  };

  const fetchTrends = async () => {
    try {
      const response = await AxiosInstance.get('/analyse/trends/');
      setTrends(response.data);
      setErrors(prev => ({ ...prev, trends: null }));
    } catch (err) {
      handleApiError(err, 'trends', 'Erreur chargement tendances');
    }
  };

  const fetchFinancialHealth = async () => {
    try {
      const response = await AxiosInstance.get('/analyse/financial-health/');
      setFinancialHealth(response.data);
      setErrors(prev => ({ ...prev, financialHealth: null }));
    } catch (err) {
      handleApiError(err, 'financialHealth', 'Erreur chargement santé financière');
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    setErrors({});
    try {
      await Promise.all([
        fetchTopProducts(),
        fetchTopClients(),
        fetchTopSuppliers(),
        fetchTrends(),
        fetchFinancialHealth(),
      ]);
    } catch (err) {
      // les erreurs sont déjà gérées individuellement
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [limit, startDate, endDate]);

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

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="w-4 h-4 text-yellow-500" />;
    if (index === 1) return <Award className="w-4 h-4 text-gray-400" />;
    if (index === 2) return <Star className="w-4 h-4 text-amber-600" />;
    return <span className="text-xs text-base-content/40">{index + 1}</span>;
  };

  // Données pour le graphique des top produits (quantités)
  const getTopProductsPieData = () => {
    if (!topProducts || topProducts.length === 0) return null;
    const labels = topProducts.map(p => p.product_name);
    const data = topProducts.map(p => p.quantity_sold);
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];
    return {
      labels: labels,
      datasets: [
        {
          label: 'Quantités vendues',
          data: data,
          backgroundColor: colors.slice(0, data.length),
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    };
  };

  // Données pour le graphique des top clients (montants)
  const getTopClientsPieData = () => {
    if (!topClients || topClients.length === 0) return null;
    const labels = topClients.map(c => c.client_name);
    const data = topClients.map(c => c.total_purchases);
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];
    return {
      labels: labels,
      datasets: [
        {
          label: 'Montant total',
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
          font: { size: 11 },
        },
      },
    },
    maintainAspectRatio: false,
  };

  const getActiveTabError = () => {
    switch (activeTab) {
      case 'top-products': return errors.topProducts;
      case 'top-clients': return errors.topClients;
      case 'top-suppliers': return errors.topSuppliers;
      case 'trends': return errors.trends;
      case 'financial-health': return errors.financialHealth;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content/60">Chargement des analyses...</p>
        </div>
      </div>
    );
  }

  const activeError = getActiveTabError();
  if (activeError) {
    return (
      <div className="p-6">
        <div className="alert alert-warning shadow-lg">
          <AlertTriangle className="w-6 h-6" />
          <span>{activeError}</span>
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
            Analyses avancées
          </h1>
          <p className="text-base-content/60 text-sm mt-1">
            Performances, tendances et indicateurs clés
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm">Top</label>
            <select
              className="select select-bordered select-sm"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
          <input
            type="date"
            className="input input-bordered input-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            className="input input-bordered input-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button onClick={loadAllData} className="btn btn-primary btn-sm gap-2">
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div className="tabs tabs-boxed bg-base-100 shadow-md mb-6">
        <button
          className={`tab ${activeTab === 'top-products' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('top-products')}
        >
          <Package className="w-4 h-4 mr-2" />
          Top produits
        </button>
        <button
          className={`tab ${activeTab === 'top-clients' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('top-clients')}
        >
          <Users className="w-4 h-4 mr-2" />
          Top clients
        </button>
        <button
          className={`tab ${activeTab === 'top-suppliers' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('top-suppliers')}
        >
          <Truck className="w-4 h-4 mr-2" />
          Top fournisseurs
        </button>
        <button
          className={`tab ${activeTab === 'trends' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Tendances
        </button>
        <button
          className={`tab ${activeTab === 'financial-health' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('financial-health')}
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Santé financière
        </button>
      </div>

      {/* Contenu */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body p-5">
          {activeTab === 'top-products' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Produits les plus vendus</h3>
              {topProducts && topProducts.length > 0 ? (
                <>
                  {/* Graphique circulaire */}
                  <div className="h-64 max-w-md mx-auto mb-6">
                    <Pie data={getTopProductsPieData()} options={pieOptions} />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="table table-zebra">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Produit</th>
                          <th className="text-right">Quantité</th>
                          <th className="text-right">Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProducts.map((item, idx) => (
                          <tr key={item.product_id}>
                            <td>{getRankIcon(idx)}</td>
                            <td className="font-medium">{item.product_name}</td>
                            <td className="text-right font-semibold">{formatNumber(item.quantity_sold)}</td>
                            <td className="text-right text-success font-semibold">{formatCurrency(item.total_amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-center text-base-content/40 py-4">Aucune donnée</p>
              )}
            </div>
          )}

          {activeTab === 'top-clients' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Meilleurs clients</h3>
              {topClients && topClients.length > 0 ? (
                <>
                  {/* Graphique circulaire */}
                  <div className="h-64 max-w-md mx-auto mb-6">
                    <Pie data={getTopClientsPieData()} options={pieOptions} />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="table table-zebra">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Client</th>
                          <th className="text-right">Commandes</th>
                          <th className="text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topClients.map((item, idx) => (
                          <tr key={item.client_id}>
                            <td>{getRankIcon(idx)}</td>
                            <td className="font-medium">{item.client_name}</td>
                            <td className="text-right">{formatNumber(item.total_orders)}</td>
                            <td className="text-right text-success font-semibold">{formatCurrency(item.total_purchases)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-center text-base-content/40 py-4">Aucune donnée</p>
              )}
            </div>
          )}

          {activeTab === 'top-suppliers' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Meilleurs fournisseurs</h3>
              {topSuppliers && topSuppliers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Fournisseur</th>
                        <th className="text-right">Commandes</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topSuppliers.map((item, idx) => (
                        <tr key={idx}>
                          <td>{getRankIcon(idx)}</td>
                          <td className="font-medium">{item.supplier__name}</td>
                          <td className="text-right">{formatNumber(item.total_orders)}</td>
                          <td className="text-right text-info font-semibold">{formatCurrency(item.total_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-base-content/40 py-4">Aucune donnée</p>
              )}
            </div>
          )}

          {activeTab === 'trends' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Tendances mensuelles</h3>
              {trends && trends.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Mois</th>
                        <th className="text-right">Ventes (montant)</th>
                        <th className="text-right">Ventes (nb)</th>
                        <th className="text-right">Achats</th>
                        <th className="text-right">Flux de trésorerie</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trends.map((item, idx) => (
                        <tr key={idx}>
                          <td className="font-medium">{item.month}</td>
                          <td className="text-right text-success">{formatCurrency(item.sales_amount)}</td>
                          <td className="text-right">{formatNumber(item.sales_count)}</td>
                          <td className="text-right text-info">{formatCurrency(item.purchase_amount)}</td>
                          <td className={`text-right font-semibold ${item.cash_flow >= 0 ? 'text-success' : 'text-error'}`}>
                            {formatCurrency(item.cash_flow)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-base-content/40 py-4">Aucune donnée</p>
              )}
            </div>
          )}

          {activeTab === 'financial-health' && financialHealth && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Indicateurs de santé financière</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stat bg-primary/5 rounded-lg p-4">
                  <div className="stat-title text-sm">Ventes du mois</div>
                  <div className="stat-value text-xl text-success">{formatCurrency(financialHealth.monthly_sales)}</div>
                </div>
                <div className="stat bg-info/5 rounded-lg p-4">
                  <div className="stat-title text-sm">Achats du mois</div>
                  <div className="stat-value text-xl text-info">{formatCurrency(financialHealth.monthly_purchases)}</div>
                </div>
                <div className="stat bg-success/5 rounded-lg p-4">
                  <div className="stat-title text-sm">Trésorerie disponible</div>
                  <div className="stat-value text-xl text-success">{formatCurrency(financialHealth.cash_balance)}</div>
                </div>
                <div className="stat bg-warning/5 rounded-lg p-4">
                  <div className="stat-title text-sm">Créances clients</div>
                  <div className="stat-value text-xl text-warning">{formatCurrency(financialHealth.receivables)}</div>
                </div>
                <div className="stat bg-error/5 rounded-lg p-4">
                  <div className="stat-title text-sm">Dettes fournisseurs</div>
                  <div className="stat-value text-xl text-error">{formatCurrency(financialHealth.payables)}</div>
                </div>
                <div className={`stat ${financialHealth.net_cash_position >= 0 ? 'bg-success/10' : 'bg-error/10'} rounded-lg p-4`}>
                  <div className="stat-title text-sm">Position nette</div>
                  <div className={`stat-value text-xl ${financialHealth.net_cash_position >= 0 ? 'text-success' : 'text-error'}`}>
                    {formatCurrency(financialHealth.net_cash_position)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analyses;