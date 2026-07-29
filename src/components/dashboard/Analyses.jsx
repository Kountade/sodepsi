// src/components/dashboard/Analyses.jsx
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, RefreshCw, BarChart2, 
  PieChart as PieChartIcon, Users, Truck, Package,
  DollarSign, Building, CreditCard, AlertTriangle,
  ArrowUp, ArrowDown, ChevronRight, Target
} from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';

const Analyses = () => {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const periods = [
    { value: 'today', label: 'Aujourd\'hui' },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'quarter', label: 'Ce trimestre' },
    { value: 'year', label: 'Cette année' }
  ];

  useEffect(() => {
    loadAnalyses();
  }, [period]);

  const loadAnalyses = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardService.getAnalyses(period);
      setData(result);
    } catch (err) {
      setError('Impossible de charger les analyses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-lg text-gray-600">{error}</p>
        <button onClick={loadAnalyses} className="btn btn-primary mt-4">
          <RefreshCw className="w-4 h-4 mr-2" /> Réessayer
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { 
    margin_analysis, 
    monthly_trend, 
    cash_flow, 
    client_analysis, 
    supplier_analysis, 
    stock_analysis,
    period_comparison 
  } = data;

  // Couleurs pour les variations
  const getChangeColor = (value) => {
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-error';
    return 'text-gray-500';
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Analyses</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Analyses approfondies et comparaisons
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="select select-bordered select-sm"
            >
              {periods.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <button onClick={loadAnalyses} className="btn btn-ghost btn-sm btn-square">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Période */}
        <div className="text-sm text-gray-500 mb-6">
          <span className="font-medium">Période:</span> {data.date_range.start} - {data.date_range.end}
        </div>

        {/* Analyse de la marge */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-primary" /> Analyse de la marge
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Chiffre d'affaires</p>
              <p className="text-xl font-bold text-primary">{margin_analysis.revenue.toLocaleString()} F</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Coût</p>
              <p className="text-xl font-bold text-error">{margin_analysis.cost.toLocaleString()} F</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Marge brute</p>
              <p className={`text-xl font-bold ${margin_analysis.gross_margin >= 0 ? 'text-success' : 'text-error'}`}>
                {margin_analysis.gross_margin.toLocaleString()} F
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Taux de marge</p>
              <p className={`text-xl font-bold ${margin_analysis.margin_rate >= 20 ? 'text-success' : margin_analysis.margin_rate >= 10 ? 'text-warning' : 'text-error'}`}>
                {margin_analysis.margin_rate}%
              </p>
            </div>
          </div>
        </div>

        {/* Tendance mensuelle */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" /> Tendance mensuelle
          </h3>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th>Mois</th>
                  <th className="text-right">Ventes</th>
                  <th className="text-right">Nb ventes</th>
                  <th className="text-right">Achats</th>
                  <th className="text-right">Bénéfice</th>
                </tr>
              </thead>
              <tbody>
                {monthly_trend.map((item, index) => (
                  <tr key={index} className={item.profit >= 0 ? 'hover:bg-success/5' : 'hover:bg-error/5'}>
                    <td className="font-medium">{item.month}</td>
                    <td className="text-right">{item.sales_amount.toLocaleString()} F</td>
                    <td className="text-right">{item.sales_count}</td>
                    <td className="text-right">{item.purchases_amount.toLocaleString()} F</td>
                    <td className={`text-right font-bold ${item.profit >= 0 ? 'text-success' : 'text-error'}`}>
                      {item.profit.toLocaleString()} F
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Flux de trésorerie */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-success" /> Entrées
            </h3>
            <p className="text-3xl font-bold text-success">{cash_flow.inflows.toLocaleString()} F</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-error" /> Sorties
            </h3>
            <p className="text-3xl font-bold text-error">{cash_flow.outflows.toLocaleString()} F</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-primary" /> Solde
            </h3>
            <p className={`text-3xl font-bold ${cash_flow.balance >= 0 ? 'text-success' : 'text-error'}`}>
              {cash_flow.balance.toLocaleString()} F
            </p>
          </div>
        </div>

        {/* Analyse clients et fournisseurs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Analyse clients */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-primary" /> Analyse clients
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-xl font-bold">{client_analysis.total_clients}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-500">Actifs</p>
                <p className="text-xl font-bold text-success">{client_analysis.active_clients}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-500">Nouveaux</p>
                <p className="text-xl font-bold text-info">{client_analysis.new_clients}</p>
              </div>
            </div>
            <h4 className="font-medium text-sm text-gray-500 mb-2">Top clients</h4>
            <div className="space-y-2">
              {client_analysis.top_clients.map((client, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-primary badge-sm">{index + 1}</span>
                    <span className="font-medium text-sm">{client.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{client.purchases.toLocaleString()} F</p>
                    <p className="text-xs text-gray-500">{client.orders} commandes</p>
                  </div>
                </div>
              ))}
              {client_analysis.top_clients.length === 0 && (
                <p className="text-gray-500 text-sm">Aucun client</p>
              )}
            </div>
          </div>

          {/* Analyse fournisseurs */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Truck className="w-4 h-4 text-primary" /> Analyse fournisseurs
            </h3>
            <div className="mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-500">Total fournisseurs</p>
                <p className="text-2xl font-bold">{supplier_analysis.total_suppliers}</p>
              </div>
            </div>
            <h4 className="font-medium text-sm text-gray-500 mb-2">Top fournisseurs</h4>
            <div className="space-y-2">
              {supplier_analysis.top_suppliers.map((supplier, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-primary badge-sm">{index + 1}</span>
                    <span className="font-medium text-sm">{supplier.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{supplier.purchases.toLocaleString()} F</p>
                    <p className="text-xs text-gray-500">{supplier.orders} commandes</p>
                  </div>
                </div>
              ))}
              {supplier_analysis.top_suppliers.length === 0 && (
                <p className="text-gray-500 text-sm">Aucun fournisseur</p>
              )}
            </div>
          </div>
        </div>

        {/* Analyse du stock */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-primary" /> Analyse du stock
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Total produits</p>
              <p className="text-xl font-bold">{stock_analysis.total_products}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Valeur totale</p>
              <p className="text-xl font-bold text-primary">{stock_analysis.total_value.toLocaleString()} F</p>
            </div>
          </div>
          <h4 className="font-medium text-sm text-gray-500 mb-2">Valeur par catégorie</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stock_analysis.by_category || {}).map(([category, value]) => (
              <div key={category} className="badge badge-lg p-3 bg-gray-50">
                {category}: {value.toLocaleString()} F
              </div>
            ))}
            {Object.keys(stock_analysis.by_category || {}).length === 0 && (
              <p className="text-gray-500 text-sm">Aucune catégorie</p>
            )}
          </div>
        </div>

        {/* Comparaison des périodes */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-primary" /> Comparaison des périodes
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(period_comparison).map(([key, value]) => {
              const labels = {
                today: 'Aujourd\'hui',
                this_week: 'Cette semaine',
                this_month: 'Ce mois',
                last_month: 'Mois dernier',
                this_quarter: 'Ce trimestre',
                this_year: 'Cette année'
              };
              return (
                <div key={key} className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-sm font-medium text-gray-600">{labels[key] || key}</p>
                  <p className="text-lg font-bold text-primary">{value.revenue.toLocaleString()} F</p>
                  <p className="text-xs text-gray-500">{value.count} ventes</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analyses;