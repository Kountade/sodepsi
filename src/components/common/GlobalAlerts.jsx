// src/components/common/GlobalAlerts.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  AlertTriangle, AlertOctagon, Info, CheckCircle, X,
  Clock, Truck, Package, PackageCheck, DollarSign,
  FileText, RotateCcw, CreditCard, Calendar, Building2,
  TrendingUp, Award, UserPlus, UserX, FileWarning,
  ShoppingCart, CalendarClock, PackageX, Bell,
  RefreshCw, ChevronRight, Filter, Grid3x3, Users
} from 'lucide-react';

const GlobalAlerts = ({ onClose, onAlertCount, onStatsChange }) => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    error: 0,
    warning: 0,
    info: 0,
    byCategory: {}
  });

  const categoryLabels = {
    achats: 'Achats',
    stocks: 'Stocks',
    ventes: 'Ventes',
    finances: 'Finances',
    fournisseurs: 'Fournisseurs',
    livraisons: 'Livraisons',
    utilisateurs: 'Utilisateurs'
  };

  const categoryIcons = {
    achats: ShoppingCart,
    stocks: Package,
    ventes: CreditCard,
    finances: DollarSign,
    fournisseurs: Building2,
    livraisons: Truck,
    utilisateurs: Users
  };

  // Fonction pour charger les alertes
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        console.warn('Token non trouvé');
        setAlerts([]);
        setStats({ total: 0, error: 0, warning: 0, info: 0, byCategory: {} });
        setLoading(false);
        return;
      }

      // Appel vers le backend pour récupérer toutes les alertes
      const response = await AxiosInstance.get('/global-alerts/', {
        headers: { Authorization: `Token ${token}` }
      });
      
      const data = response.data || { alerts: [], stats: { total: 0, error: 0, warning: 0, info: 0, byCategory: {} } };
      setAlerts(data.alerts || []);
      setStats(data.stats || { total: 0, error: 0, warning: 0, info: 0, byCategory: {} });
      
      // Notifier le parent du nombre d'alertes
      if (onAlertCount) {
        onAlertCount(data.stats?.total || 0);
      }
      if (onStatsChange) {
        onStatsChange(data.stats || { total: 0, error: 0, warning: 0, info: 0 });
      }
      
    } catch (error) {
      console.error('Erreur chargement alertes globales:', error);
      
      // Données de test en cas d'erreur
      const mockAlerts = getMockAlerts();
      setAlerts(mockAlerts);
      const mockStats = {
        total: mockAlerts.length,
        error: mockAlerts.filter(a => a.level === 'error').length,
        warning: mockAlerts.filter(a => a.level === 'warning').length,
        info: mockAlerts.filter(a => a.level === 'info').length,
        byCategory: {
          achats: mockAlerts.filter(a => a.category === 'achats').length,
          stocks: mockAlerts.filter(a => a.category === 'stocks').length,
          ventes: mockAlerts.filter(a => a.category === 'ventes').length,
          finances: mockAlerts.filter(a => a.category === 'finances').length,
          fournisseurs: mockAlerts.filter(a => a.category === 'fournisseurs').length,
          livraisons: mockAlerts.filter(a => a.category === 'livraisons').length,
          utilisateurs: mockAlerts.filter(a => a.category === 'utilisateurs').length
        }
      };
      setStats(mockStats);
      
      if (onAlertCount) {
        onAlertCount(mockStats.total);
      }
      if (onStatsChange) {
        onStatsChange(mockStats);
      }
    } finally {
      setLoading(false);
    }
  };

  // Données de test
  const getMockAlerts = () => [
    { id: 1, type: 'overdue_order', level: 'error', category: 'achats', message: 'Commande PO-2024-001 en retard de 5 jours', order_id: 1, order_number: 'PO-2024-001', created_at: new Date().toISOString() },
    { id: 2, type: 'low_stock', level: 'warning', category: 'stocks', message: 'Stock bas pour Produit A (10 unités)', product_id: 1, product_name: 'Produit A', created_at: new Date().toISOString() },
    { id: 3, type: 'expired_lot', level: 'error', category: 'stocks', message: 'Lot LOT-2023-012 expiré depuis 3 jours', lot_id: 1, lot_number: 'LOT-2023-012', created_at: new Date().toISOString() },
    { id: 4, type: 'overdue_invoice', level: 'warning', category: 'finances', message: 'Facture INV-2024-001 en retard de 2 jours', invoice_id: 1, invoice_number: 'INV-2024-001', amount: '150000', created_at: new Date().toISOString() },
    { id: 5, type: 'pending_payment', level: 'info', category: 'ventes', message: 'Vente V-2024-001 en attente de paiement', sale_id: 1, created_at: new Date().toISOString() },
    { id: 6, type: 'pending_return', level: 'warning', category: 'achats', message: 'Retour RET-2024-001 en attente depuis 4 jours', return_id: 1, return_number: 'RET-2024-001', created_at: new Date().toISOString() }
  ];

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Obtenir l'icône selon le niveau
  const getLevelIcon = (level) => {
    switch(level) {
      case 'error': return <AlertOctagon className="w-5 h-5 text-error" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'info': return <Info className="w-5 h-5 text-info" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getLevelLabel = (level) => {
    const labels = { error: 'Urgent', warning: 'À surveiller', info: 'Information' };
    return labels[level] || level;
  };

  const getLevelBadgeColor = (level) => {
    return level === 'error' ? 'badge-error' : 
           level === 'warning' ? 'badge-warning' : 'badge-info';
  };

  // Rediriger vers la page appropriée
  const handleAlertClick = (alert) => {
    const pathMap = {
      overdue_order: `/commandes-fournisseurs/${alert.order_id}`,
      no_receipt: `/commandes-fournisseurs/${alert.order_id}`,
      upcoming_receipt: `/commandes-fournisseurs/${alert.order_id}`,
      overdue_invoice: `/factures/${alert.invoice_id}`,
      upcoming_invoice_due: `/factures/${alert.invoice_id}`,
      pending_return: `/purchase-returns/${alert.return_id}`,
      low_stock: `/produits/${alert.product_id}`,
      out_of_stock: `/produits/${alert.product_id}`,
      expiring_lot: `/lots/${alert.lot_id}`,
      expired_lot: `/lots/${alert.lot_id}`,
      pending_payment: `/ventes/${alert.sale_id}`,
      overdue_payment: `/ventes/${alert.sale_id}`,
      low_balance: '/tresorerie',
      overdue_expense: `/depenses/${alert.expense_id}`,
      supplier_low_rating: `/fournisseurs/${alert.supplier_id}`,
      supplier_high_delay: `/fournisseurs/${alert.supplier_id}`,
      delivery_delayed: `/livraisons/${alert.delivery_id}`,
      delivery_pending: `/livraisons/${alert.delivery_id}`
    };
    
    const path = pathMap[alert.type] || '/dashboard';
    if (onClose) onClose();
    navigate(path);
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter !== 'all' && alert.level !== filter) return false;
    if (categoryFilter !== 'all' && alert.category !== categoryFilter) return false;
    return true;
  });

  const uniqueCategories = [...new Set(alerts.map(a => a.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-base-100 rounded-xl shadow-2xl border border-primary/20 overflow-hidden">
      {/* En-tête */}
      <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-base-content">Alertes Système</h2>
              <p className="text-xs text-base-content/50">
                {stats.total} alerte(s) - {stats.error} urgentes, {stats.warning} à surveiller
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAlerts}
              className="btn btn-ghost btn-sm btn-square"
              title="Actualiser"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="btn btn-ghost btn-sm btn-square"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-4 gap-1 p-2 bg-base-200/50 border-b border-base-200">
        <div className="text-center p-1.5 rounded-lg bg-base-100">
          <p className="text-xs font-bold text-base-content">{stats.total}</p>
          <p className="text-[10px] text-base-content/40">Total</p>
        </div>
        <div className="text-center p-1.5 rounded-lg bg-error/10">
          <p className="text-xs font-bold text-error">{stats.error}</p>
          <p className="text-[10px] text-base-content/40">Urgentes</p>
        </div>
        <div className="text-center p-1.5 rounded-lg bg-warning/10">
          <p className="text-xs font-bold text-warning">{stats.warning}</p>
          <p className="text-[10px] text-base-content/40">À surveiller</p>
        </div>
        <div className="text-center p-1.5 rounded-lg bg-info/10">
          <p className="text-xs font-bold text-info">{stats.info}</p>
          <p className="text-[10px] text-base-content/40">Infos</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="p-2 border-b border-base-200 flex flex-wrap gap-2">
        <select
          className="select select-bordered select-xs flex-1 min-w-[100px]"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Tous niveaux</option>
          <option value="error">⚠️ Urgentes</option>
          <option value="warning">⚡ À surveiller</option>
          <option value="info">ℹ️ Informations</option>
        </select>
        <select
          className="select select-bordered select-xs flex-1 min-w-[100px]"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">Toutes catégories</option>
          {uniqueCategories.map(cat => (
            <option key={cat} value={cat}>
              {categoryLabels[cat] || cat}
            </option>
          ))}
        </select>
        {(filter !== 'all' || categoryFilter !== 'all') && (
          <button
            onClick={() => { setFilter('all'); setCategoryFilter('all'); }}
            className="btn btn-ghost btn-xs"
          >
            <X className="w-3 h-3" /> Réinitialiser
          </button>
        )}
      </div>

      {/* Liste des alertes */}
      <div className="flex-1 overflow-y-auto max-h-96">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-3">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <p className="text-base-content font-medium">Aucune alerte</p>
            <p className="text-sm text-base-content/40">Tout est sous contrôle ! 🎉</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const CategoryIcon = categoryIcons[alert.category] || Bell;
            const isUrgent = alert.level === 'error';
            
            return (
              <button
                key={alert.id}
                onClick={() => handleAlertClick(alert)}
                className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-primary/5 transition-colors text-left border-b border-base-200/50 ${
                  isUrgent ? 'border-l-4 border-l-error' : 
                  alert.level === 'warning' ? 'border-l-4 border-l-warning' : ''
                }`}
              >
                <div className={`p-2 rounded-lg flex-shrink-0 ${
                  alert.level === 'error' ? 'bg-error/20' :
                  alert.level === 'warning' ? 'bg-warning/20' : 'bg-info/20'
                }`}>
                  {getLevelIcon(alert.level)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`badge ${getLevelBadgeColor(alert.level)} badge-xs`}>
                      {getLevelLabel(alert.level)}
                    </span>
                    <span className="badge badge-ghost badge-xs">
                      <CategoryIcon className="w-3 h-3 mr-1" />
                      {categoryLabels[alert.category] || alert.category}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-base-content line-clamp-2">
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-base-content/40">
                    {alert.order_number && <span>Commande: {alert.order_number}</span>}
                    {alert.invoice_number && <span>Facture: {alert.invoice_number}</span>}
                    {alert.supplier_name && <span>Fournisseur: {alert.supplier_name}</span>}
                    {alert.product_name && <span>Produit: {alert.product_name}</span>}
                    {alert.days_late && (
                      <span className="text-error font-medium">+{alert.days_late}j</span>
                    )}
                    <span className="ml-auto text-[10px]">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <ChevronRight className="w-4 h-4 text-base-content/30 flex-shrink-0 mt-2" />
              </button>
            );
          })
        )}
      </div>

      {/* Pied */}
      <div className="p-2 border-t border-base-200 bg-base-100">
        <button
          onClick={() => {
            if (onClose) onClose();
            navigate('/dashboard/alerts');
          }}
          className="w-full text-center text-sm text-primary hover:text-primary/80 font-medium py-1.5 hover:bg-primary/5 rounded-lg transition-colors"
        >
          Voir toutes les alertes →
        </button>
      </div>
    </div>
  );
};

export default GlobalAlerts;