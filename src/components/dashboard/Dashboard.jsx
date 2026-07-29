// src/components/dashboard/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, TrendingDown, DollarSign,
  ShoppingCart, Users, Package, Truck, CreditCard,
  ArrowUp, ArrowDown, RefreshCw, Clock, AlertCircle,
  User, ChevronRight
} from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import PeriodSelector from './PeriodSelector';

const Dashboard = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardService.getDashboard(period);
      setData(result);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de charger le tableau de bord');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

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
        <AlertCircle className="w-16 h-16 text-error mb-4" />
        <p className="text-lg text-gray-600">{error}</p>
        <button onClick={loadDashboard} className="btn btn-primary mt-4">
          <RefreshCw className="w-4 h-4 mr-2" /> Réessayer
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  const { summary = {}, metrics = {}, stock = {}, cash = {}, recent_activities = {} } = data;

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '0';
    return value.toLocaleString();
  };

  const getChangeColor = (value) => {
    if (value === undefined || value === null) return 'text-gray-500';
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-error';
    return 'text-gray-500';
  };

  const getChangeIcon = (value) => {
    if (value === undefined || value === null) return null;
    if (value > 0) return <ArrowUp className="w-3 h-3" />;
    if (value < 0) return <ArrowDown className="w-3 h-3" />;
    return null;
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <LayoutDashboard className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Tableau de bord</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Vue d'ensemble de votre activité
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PeriodSelector currentPeriod={period} onPeriodChange={setPeriod} />
            <button
              onClick={loadDashboard}
              className="btn btn-ghost btn-sm btn-square"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Période */}
        {data.date_range && (
          <div className="text-sm text-gray-500 mb-6">
            <span className="font-medium">Période:</span> {data.date_range.start} - {data.date_range.end}
          </div>
        )}

        {/* Cartes de résumé */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Carte 1: Chiffre d'affaires */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5 hover:shadow-2xl transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Chiffre d'affaires</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(summary.total_revenue)} F</p>
                <div className="flex items-center mt-2 text-sm">
                  <span className={`${getChangeColor(summary.revenue_change)} flex items-center`}>
                    {getChangeIcon(summary.revenue_change)}
                    {Math.abs(summary.revenue_change || 0).toFixed(1)}%
                  </span>
                  <span className="text-gray-400 ml-2">vs période précédente</span>
                </div>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          {/* Carte 2: Bénéfice net */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5 hover:shadow-2xl transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Bénéfice net</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(summary.net_profit)} F</p>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-gray-500">Marge: {summary.profit_margin || 0}%</span>
                </div>
              </div>
              <div className="p-3 bg-success/10 rounded-xl">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>

          {/* Carte 3: Commandes */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5 hover:shadow-2xl transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Commandes</p>
                <p className="text-2xl font-bold mt-1">{summary.total_orders || 0}</p>
                <div className="flex items-center mt-2 text-sm">
                  <span className={`${getChangeColor(summary.orders_change)} flex items-center`}>
                    {getChangeIcon(summary.orders_change)}
                    {Math.abs(summary.orders_change || 0).toFixed(1)}%
                  </span>
                  <span className="text-gray-400 ml-2">vs précédent</span>
                </div>
              </div>
              <div className="p-3 bg-info/10 rounded-xl">
                <ShoppingCart className="w-6 h-6 text-info" />
              </div>
            </div>
          </div>

          {/* Carte 4: Trésorerie */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5 hover:shadow-2xl transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Trésorerie</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(cash.total)} F</p>
                <div className="flex items-center mt-2 text-sm gap-3">
                  <span className="text-gray-500">Caisse: {formatCurrency(cash.cash_balance)} F</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-500">Banque: {formatCurrency(cash.bank_balance)} F</span>
                </div>
              </div>
              <div className="p-3 bg-warning/10 rounded-xl">
                <CreditCard className="w-6 h-6 text-warning" />
              </div>
            </div>
          </div>
        </div>

        {/* Deuxième ligne de métriques */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Produits</p>
                <p className="text-xl font-bold">{metrics.products || 0}</p>
              </div>
              <Package className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Clients</p>
                <p className="text-xl font-bold">{metrics.clients || 0}</p>
              </div>
              <Users className="w-5 h-5 text-success" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Fournisseurs</p>
                <p className="text-xl font-bold">{metrics.suppliers || 0}</p>
              </div>
              <Truck className="w-5 h-5 text-info" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Employés</p>
                <p className="text-xl font-bold">{metrics.employees || 0}</p>
              </div>
              <User className="w-5 h-5 text-warning" />
            </div>
          </div>
        </div>

        {/* Alertes stock */}
        {(stock.low_stock > 0 || stock.out_of_stock > 0) && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5 mb-6">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-warning" /> Alertes stock
            </h3>
            <div className="flex flex-wrap gap-4">
              {stock.out_of_stock > 0 && (
                <div className="badge badge-error gap-2 p-4">
                  <span className="font-bold">{stock.out_of_stock}</span> produits en rupture
                </div>
              )}
              {stock.low_stock > 0 && (
                <div className="badge badge-warning gap-2 p-4">
                  <span className="font-bold">{stock.low_stock}</span> produits en stock faible
                </div>
              )}
              <div className="badge badge-info gap-2 p-4">
                <span className="font-bold">{formatCurrency(stock.total_value)}</span> valeur totale du stock
              </div>
            </div>
          </div>
        )}

        {/* Commandes en attente */}
        {(metrics.pending_orders > 0 || metrics.pending_purchase_orders > 0) && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5 mb-6">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-warning" /> En attente
            </h3>
            <div className="flex flex-wrap gap-4">
              {metrics.pending_orders > 0 && (
                <div className="badge badge-warning gap-2 p-4">
                  <span className="font-bold">{metrics.pending_orders}</span> commandes client en attente
                </div>
              )}
              {metrics.pending_purchase_orders > 0 && (
                <div className="badge badge-info gap-2 p-4">
                  <span className="font-bold">{metrics.pending_purchase_orders}</span> commandes fournisseur en attente
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activités récentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ventes récentes */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" /> Dernières ventes
              </h3>
              <button
                onClick={() => navigate('/ventes')}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Voir tout <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="p-4">
              {recent_activities.sales?.length > 0 ? (
                <div className="space-y-3">
                  {recent_activities.sales.map((sale, index) => (
                    <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition">
                      <div>
                        <p className="font-medium text-sm">{sale.client || 'Client inconnu'}</p>
                        <p className="text-xs text-gray-500">{sale.invoice_number || 'N/A'} • {sale.date || ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{formatCurrency(sale.total)} F</p>
                        <span className="badge badge-success badge-xs">Payée</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">Aucune vente récente</p>
              )}
            </div>
          </div>

          {/* Achats récents */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" /> Derniers achats
              </h3>
              <button
                onClick={() => navigate('/commandes-fournisseurs')}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Voir tout <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="p-4">
              {recent_activities.purchases?.length > 0 ? (
                <div className="space-y-3">
                  {recent_activities.purchases.map((purchase, index) => (
                    <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition">
                      <div>
                        <p className="font-medium text-sm">{purchase.supplier || 'Fournisseur inconnu'}</p>
                        <p className="text-xs text-gray-500">{purchase.po_number || 'N/A'} • {purchase.date || ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{formatCurrency(purchase.total)} F</p>
                        <span className="badge badge-info badge-xs">Reçue</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">Aucun achat récent</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;