// src/components/dashboard/Statistiques.jsx
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, RefreshCw, BarChart2, 
  PieChart as PieChartIcon, CreditCard, Package, DollarSign
} from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';

const Statistiques = () => {
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
    loadStatistiques();
  }, [period]);

  const loadStatistiques = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardService.getStatistiques(period);
      setData(result);
    } catch (err) {
      setError('Impossible de charger les statistiques');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Trouver la valeur maximale pour les barres
  const getMaxValue = (data, key) => {
    if (!data || data.length === 0) return 1;
    const max = Math.max(...data.map(item => item[key] || 0));
    return max || 1;
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
        <button onClick={loadStatistiques} className="btn btn-primary mt-4">
          <RefreshCw className="w-4 h-4 mr-2" /> Réessayer
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { charts, top_products, statistics } = data;

  // Préparer les données pour les graphiques CSS
  const salesData = charts.sales_chart.labels.map((label, index) => ({
    name: label,
    ventes: charts.sales_chart.datasets[0]?.data[index] || 0,
    chiffreAffaires: charts.sales_chart.datasets[1]?.data[index] || 0
  }));

  const maxSales = getMaxValue(salesData, 'ventes');
  const maxRevenue = getMaxValue(salesData, 'chiffreAffaires');

  const revenueData = charts.revenue_chart.labels.map((label, index) => ({
    name: label,
    revenus: charts.revenue_chart.datasets[0]?.data[index] || 0,
    depenses: charts.revenue_chart.datasets[1]?.data[index] || 0,
    benefice: charts.revenue_chart.datasets[2]?.data[index] || 0
  }));

  const maxRevenueData = getMaxValue(revenueData, 'revenus');
  const maxExpensesData = getMaxValue(revenueData, 'depenses');
  const maxTotal = Math.max(maxRevenueData, maxExpensesData) || 1;

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <BarChart2 className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Statistiques</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Graphiques et distributions détaillées
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
            <button onClick={loadStatistiques} className="btn btn-ghost btn-sm btn-square">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Période */}
        <div className="text-sm text-gray-500 mb-6">
          <span className="font-medium">Période:</span> {data.date_range.start} - {data.date_range.end}
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Total ventes</p>
            <p className="text-2xl font-bold">{statistics.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Montant total</p>
            <p className="text-2xl font-bold">{statistics.total_amount.toLocaleString()} F</p>
          </div>
          <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Moyenne</p>
            <p className="text-2xl font-bold">{statistics.average_amount.toLocaleString()} F</p>
          </div>
          <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Min / Max</p>
            <p className="text-lg font-bold">
              {statistics.min_amount.toLocaleString()} - {statistics.max_amount.toLocaleString()} F
            </p>
          </div>
        </div>

        {/* Graphique des ventes - CSS */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" /> Évolution des ventes
          </h3>
          <div className="space-y-3">
            {/* Barres pour les ventes */}
            <div className="space-y-1">
              <p className="text-sm text-gray-500 font-medium">Nombre de ventes</p>
              <div className="flex items-end gap-1 h-32">
                {salesData.map((item, index) => {
                  const height = (item.ventes / maxSales) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-primary rounded-t transition-all duration-500 hover:bg-primary/80"
                        style={{ height: `${height || 2}%` }}
                      />
                      <p className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                        {item.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Barres pour le CA */}
            <div className="space-y-1 pt-4 border-t">
              <p className="text-sm text-gray-500 font-medium">Chiffre d'affaires (FCFA)</p>
              <div className="flex items-end gap-1 h-32">
                {salesData.map((item, index) => {
                  const height = (item.chiffreAffaires / maxRevenue) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-secondary rounded-t transition-all duration-500 hover:bg-secondary/80"
                        style={{ height: `${height || 2}%` }}
                      />
                      <p className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                        {item.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Revenus vs Dépenses - CSS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4 text-primary" /> Revenus vs Dépenses
            </h3>
            <div className="space-y-3">
              {revenueData.map((item, index) => {
                const revenueHeight = (item.revenus / maxTotal) * 100;
                const expenseHeight = (item.depenses / maxTotal) * 100;
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-500">
                        {item.revenus.toLocaleString()} / {item.depenses.toLocaleString()} F
                      </span>
                    </div>
                    <div className="flex gap-1 h-6">
                      <div 
                        className="bg-primary rounded-l transition-all duration-500"
                        style={{ width: `${Math.max(revenueHeight, 2)}%` }}
                      />
                      <div 
                        className="bg-error rounded-r transition-all duration-500"
                        style={{ width: `${Math.max(expenseHeight, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-primary rounded" /> Revenus
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-error rounded" /> Dépenses
              </span>
            </div>
          </div>

          {/* Top produits */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-primary" /> Top produits
            </h3>
            <div className="space-y-3">
              {top_products.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition">
                  <div className="flex items-center gap-3">
                    <div className="badge badge-primary badge-lg">{index + 1}</div>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{product.revenue.toLocaleString()} F</p>
                    <p className="text-xs text-gray-500">{product.quantity_sold} vendus</p>
                  </div>
                </div>
              ))}
              {top_products.length === 0 && (
                <p className="text-center text-gray-500 py-4">Aucun produit vendu</p>
              )}
            </div>
          </div>
        </div>

        {/* Distribution par catégorie - CSS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <PieChartIcon className="w-4 h-4 text-primary" /> Ventes par catégorie
            </h3>
            <div className="space-y-2">
              {charts.category_distribution.length > 0 ? (
                charts.category_distribution.map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-gray-500">{item.value.toLocaleString()} F ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="h-3 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${item.percentage}%`,
                          backgroundColor: item.color || `hsl(${index * 45}, 70%, 50%)`
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
              )}
            </div>
          </div>

          {/* Distribution des paiements - CSS */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4 text-primary" /> Modes de paiement
            </h3>
            <div className="space-y-2">
              {charts.payment_distribution.length > 0 ? (
                charts.payment_distribution.map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-gray-500">{item.value.toLocaleString()} F ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="h-3 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${item.percentage}%`,
                          backgroundColor: item.color || `hsl(${index * 60 + 120}, 70%, 50%)`
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
              )}
            </div>
          </div>
        </div>

        {/* Statistiques détaillées */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h3 className="font-semibold mb-3">Par statut</h3>
            <div className="space-y-2">
              {Object.entries(statistics.by_status || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="capitalize">{key}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
              {Object.keys(statistics.by_status || {}).length === 0 && (
                <p className="text-gray-500 text-sm">Aucune donnée</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h3 className="font-semibold mb-3">Par statut de paiement</h3>
            <div className="space-y-2">
              {Object.entries(statistics.by_payment_status || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="capitalize">{key.replace('_', ' ')}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
              {Object.keys(statistics.by_payment_status || {}).length === 0 && (
                <p className="text-gray-500 text-sm">Aucune donnée</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistiques;