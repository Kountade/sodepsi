// src/components/dashboard/DashboardAchats.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  TrendingUp, ShoppingCart, Package, DollarSign,
  AlertCircle, CheckCircle, Clock, FileText,
  Receipt, CreditCard, Building2, X, RefreshCw
} from 'lucide-react';

const DashboardAchats = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 5000);
  };

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      
      if (!token) {
        setError('Session expirée. Veuillez vous reconnecter.');
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        setLoading(false);
        return;
      }

      console.log('📤 Chargement des statistiques...');
      
      // ✅ Tester les deux URLs possibles
      let response;
      try {
        // Essayer d'abord avec dashboard-stats
        response = await AxiosInstance.get('/dashboard-stats/statistics/', {
          headers: { 
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (firstError) {
        console.log('⚠️ URL /dashboard-stats/statistics/ échouée, essai avec /achats-dashboard-stats/statistics/');
        // Si la première URL échoue, essayer avec achats-dashboard-stats
        response = await AxiosInstance.get('/achats-dashboard-stats/statistics/', {
          headers: { 
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      console.log('✅ Statistiques reçues:', response.data);
      setStats(response.data);
      
    } catch (error) {
      console.error('❌ Erreur chargement dashboard:', error);
      console.error('Détails:', error.response?.data);
      console.error('Status:', error.response?.status);
      
      let errorMsg = 'Erreur de chargement des statistiques';
      
      if (error.response?.status === 401) {
        errorMsg = 'Session expirée. Veuillez vous reconnecter.';
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        errorMsg = 'Service de statistiques non disponible. Vérifiez que le backend est démarré.';
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.data?.detail) {
        errorMsg = error.response.data.detail;
      }
      
      setError(errorMsg);
      showNotification(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 FCFA';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0 FCFA';
    return `${num.toLocaleString('fr-FR')} FCFA`;
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    return num.toLocaleString('fr-FR');
  };

  // Données de test en cas d'erreur
  const mockStats = {
    orders: { total: 0, pending: 0, this_month: 0, total_amount: 0, amount_this_month: 0 },
    receipts: { total: 0, pending: 0, non_invoiced: 0, received_amount: 0, remaining_to_receive: 0 },
    invoices: { total: 0, unpaid: 0, overdue: 0, total_invoiced: 0, total_paid: 0, total_remaining_to_pay: 0 },
    suppliers: { total: 0, top: [] },
    alerts: { overdue_invoices: 0, pending_receipts: 0, pending_orders: 0, non_invoiced_receipts: 0 }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-medium text-gray-500">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  const displayStats = stats || mockStats;

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown max-w-md">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification({ ...notification, show: false })}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <TrendingUp className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Dashboard Achats</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Vue d'ensemble de vos achats et fournisseurs
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchStats} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button 
              onClick={() => navigate('/commandes-fournisseurs/nouveau')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              <ShoppingCart className="w-4 h-4" /> Nouvelle commande
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning shadow-lg rounded-xl">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cartes principales */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-5 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/commandes-fournisseurs')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Commandes</p>
              <p className="text-2xl font-bold mt-1">{displayStats.orders.total}</p>
              <p className="text-xs text-gray-400 mt-1">{formatCurrency(displayStats.orders.total_amount)} au total</p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <ShoppingCart className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/receptions')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Réceptions</p>
              <p className="text-2xl font-bold mt-1">{displayStats.receipts.total}</p>
              <p className="text-xs text-gray-400 mt-1">{formatNumber(displayStats.receipts.pending)} en attente</p>
            </div>
            <div className="p-3 rounded-xl bg-success/10 text-success">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/factures-fournisseurs')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Factures</p>
              <p className="text-2xl font-bold mt-1">{displayStats.invoices.total}</p>
              <p className="text-xs text-gray-400 mt-1">{formatNumber(displayStats.invoices.unpaid)} non payées</p>
            </div>
            <div className="p-3 rounded-xl bg-warning/10 text-warning">
              <Receipt className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/fournisseurs')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Fournisseurs</p>
              <p className="text-2xl font-bold mt-1">{displayStats.suppliers.total}</p>
              <p className="text-xs text-gray-400 mt-1">{formatNumber(displayStats.suppliers.top?.length || 0)} actifs</p>
            </div>
            <div className="p-3 rounded-xl bg-info/10 text-info">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Alertes */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-warning" />
          Alertes et actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div 
            className="border rounded-xl p-4 bg-red-50 border-red-200 text-red-700 cursor-pointer hover:shadow-md transition-all"
            onClick={() => navigate('/factures-fournisseurs?status=overdue')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Factures en retard</p>
                  <p className="text-sm opacity-80">{displayStats.alerts.overdue_invoices || 0} élément(s)</p>
                </div>
              </div>
              {(displayStats.alerts.overdue_invoices || 0) > 0 && (
                <span className="badge badge-error">{displayStats.alerts.overdue_invoices}</span>
              )}
            </div>
          </div>

          <div 
            className="border rounded-xl p-4 bg-yellow-50 border-yellow-200 text-yellow-700 cursor-pointer hover:shadow-md transition-all"
            onClick={() => navigate('/receptions?status=pending')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Réceptions en attente</p>
                  <p className="text-sm opacity-80">{displayStats.alerts.pending_receipts || 0} élément(s)</p>
                </div>
              </div>
              {(displayStats.alerts.pending_receipts || 0) > 0 && (
                <span className="badge badge-error">{displayStats.alerts.pending_receipts}</span>
              )}
            </div>
          </div>

          <div 
            className="border rounded-xl p-4 bg-blue-50 border-blue-200 text-blue-700 cursor-pointer hover:shadow-md transition-all"
            onClick={() => navigate('/commandes-fournisseurs?status=draft')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Commandes en attente</p>
                  <p className="text-sm opacity-80">{displayStats.alerts.pending_orders || 0} élément(s)</p>
                </div>
              </div>
              {(displayStats.alerts.pending_orders || 0) > 0 && (
                <span className="badge badge-error">{displayStats.alerts.pending_orders}</span>
              )}
            </div>
          </div>

          <div 
            className="border rounded-xl p-4 bg-yellow-50 border-yellow-200 text-yellow-700 cursor-pointer hover:shadow-md transition-all"
            onClick={() => navigate('/receptions?is_invoiced=false')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Réceptions non facturées</p>
                  <p className="text-sm opacity-80">{displayStats.alerts.non_invoiced_receipts || 0} élément(s)</p>
                </div>
              </div>
              {(displayStats.alerts.non_invoiced_receipts || 0) > 0 && (
                <span className="badge badge-error">{displayStats.alerts.non_invoiced_receipts}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Actions rapides
        </h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate('/commandes-fournisseurs/nouveau')} className="btn btn-primary gap-2">
            <ShoppingCart className="w-4 h-4" /> Nouvelle commande
          </button>
          <button onClick={() => navigate('/receptions/nouveau')} className="btn btn-success gap-2">
            <Package className="w-4 h-4" /> Nouvelle réception
          </button>
          <button onClick={() => navigate('/factures-fournisseurs/nouveau')} className="btn btn-warning gap-2">
            <Receipt className="w-4 h-4" /> Nouvelle facture
          </button>
          <button onClick={() => navigate('/paiements-fournisseurs/nouveau')} className="btn btn-info gap-2">
            <CreditCard className="w-4 h-4" /> Nouveau paiement
          </button>
          <button onClick={() => navigate('/fournisseurs/nouveau')} className="btn btn-outline gap-2">
            <Building2 className="w-4 h-4" /> Nouveau fournisseur
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardAchats;