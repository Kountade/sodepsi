// src/components/finances/DashboardFinancier.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Wallet, TrendingUp, TrendingDown, DollarSign,
  AlertTriangle, Loader2, RefreshCw, X, CheckCircle,
  AlertCircle, FileText, Building2, Plus,
  Clock, XCircle
} from 'lucide-react';

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const DashboardFinancier = () => {
  // ==========================================================
  // HOOKS
  // ==========================================================
  const navigate = useNavigate();

  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  // ==========================================================
  // FONCTIONS UTILITAIRES
  // ==========================================================
  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 FCFA';
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  const formatPercentage = (value) => {
    if (!value) return '0%';
    return `${value.toFixed(1)}%`;
  };

  // ==========================================================
  // REQUÊTES API
  // ==========================================================
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await AxiosInstance.get('/dashboard-financier/statistics/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement des données financières', 'error');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ==========================================================
  // EFFETS
  // ==========================================================
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ==========================================================
  // RENDU : CHARGEMENT
  // ==========================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-14 h-14 mx-auto" />
          <p className="text-lg font-medium text-gray-500">Chargement des données financières...</p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDU : COMPOSANT PRINCIPAL
  // ==========================================================
  const KPI = [
    {
      label: 'Chiffre d\'affaires',
      value: stats?.total_ventes || 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-100'
    },
    {
      label: 'Dépenses',
      value: stats?.total_depenses || 0,
      icon: TrendingDown,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-100'
    },
    {
      label: 'Trésorerie',
      value: stats?.solde_tresorerie || 0,
      icon: Wallet,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100'
    },
    {
      label: 'Bénéfice',
      value: stats?.benefice || 0,
      icon: DollarSign,
      color: stats?.benefice >= 0 ? 'text-green-600' : 'text-red-600',
      bg: stats?.benefice >= 0 ? 'bg-green-50' : 'bg-red-50',
      border: stats?.benefice >= 0 ? 'border-green-100' : 'border-red-100'
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">

      {/* ======================================================
          NOTIFICATION
          ====================================================== */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================
          EN-TÊTE
          ====================================================== */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          {/* Titre */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Wallet className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Dashboard Financier
              </h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Vue d'ensemble de la santé financière
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchStats}
              className="btn btn-sm sm:btn-md btn-outline gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button
              onClick={() => navigate('/depenses/nouveau')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-error to-error/80 text-white border-none shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" /> Nouvelle dépense
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================
          KPI CARDS
          ====================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI.map((kpi, index) => (
          <div key={index} className={`bg-white shadow-md rounded-xl p-4 border ${kpi.border}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{kpi.label}</p>
                <p className="text-xl font-bold text-gray-800 mt-1">{formatCurrency(kpi.value)}</p>
              </div>
              <div className={`p-3 rounded-full ${kpi.bg}`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ======================================================
          DEUX COLONNES
          ====================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Alertes Budget */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-amber-50 px-5 py-3.5 border-b border-amber-100">
            <h3 className="font-semibold flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-5 h-5" />
              Alertes Budget
            </h3>
          </div>
          <div className="p-5">
            {stats?.alertes_budget && stats.alertes_budget.length > 0 ? (
              <div className="space-y-3">
                {stats.alertes_budget.map((alerte, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div>
                      <p className="font-medium text-amber-800">{alerte.budget}</p>
                      <p className="text-sm text-amber-600">
                        {formatCurrency(alerte.montant_utilise)} / {formatCurrency(alerte.montant_total)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${
                        alerte.pourcentage > 90 ? 'text-red-600' :
                        alerte.pourcentage > 80 ? 'text-amber-600' : 'text-green-600'
                      }`}>
                        {formatPercentage(alerte.pourcentage)}
                      </span>
                      <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            alerte.pourcentage > 90 ? 'bg-red-500' :
                            alerte.pourcentage > 80 ? 'bg-amber-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(alerte.pourcentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Aucune alerte budget</p>
                <p className="text-sm text-gray-400">Tous les budgets sont dans les limites</p>
              </div>
            )}
          </div>
        </div>

        {/* Factures */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-5 py-3.5 border-b border-gray-200">
            <h3 className="font-semibold flex items-center gap-2 text-gray-700">
              <FileText className="w-5 h-5 text-primary" />
              État des factures
            </h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center gap-3">
                  <XCircle className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-500">Impayées</p>
                    <p className="text-2xl font-bold text-red-600">{stats?.factures_impayees || 0}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-500">Échues</p>
                    <p className="text-2xl font-bold text-orange-600">{stats?.factures_echues || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500">Budget utilisé</p>
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(stats?.budget_utilise || 0)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Restant</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(stats?.budget_restant || 0)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ======================================================
          ACTIONS RAPIDES
          ====================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => navigate('/depenses/nouveau')}
          className="p-4 bg-white rounded-xl shadow-md border border-gray-200 hover:border-primary hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">Nouvelle dépense</p>
              <p className="text-xs text-gray-400">Enregistrer</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/comptes-comptables')}
          className="p-4 bg-white rounded-xl shadow-md border border-gray-200 hover:border-primary hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">Plan comptable</p>
              <p className="text-xs text-gray-400">Gérer les comptes</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/ecritures-comptables')}
          className="p-4 bg-white rounded-xl shadow-md border border-gray-200 hover:border-primary hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <FileText className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">Écritures</p>
              <p className="text-xs text-gray-400">Journal comptable</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/budgets')}
          className="p-4 bg-white rounded-xl shadow-md border border-gray-200 hover:border-primary hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Wallet className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">Budgets</p>
              <p className="text-xs text-gray-400">Planification</p>
            </div>
          </div>
        </button>
      </div>

    </div>
  );
};

export default DashboardFinancier;