// src/services/AlertService.js
import AxiosInstance from '../AxiosInstance';

class AlertService {
  // Types d'alertes disponibles
  static ALERT_TYPES = {
    // Achats
    PURCHASE_OVERDUE_ORDER: 'overdue_order',
    PURCHASE_UPCOMING_RECEIPT: 'upcoming_receipt',
    PURCHASE_NO_RECEIPT: 'no_receipt',
    PURCHASE_OVERDUE_INVOICE: 'overdue_invoice',
    PURCHASE_UPCOMING_INVOICE_DUE: 'upcoming_invoice_due',
    PURCHASE_PENDING_RETURN: 'pending_return',
    PURCHASE_ALERT: 'purchase_alert',
    
    // Stocks
    STOCK_LOW: 'low_stock',
    STOCK_OUT: 'out_of_stock',
    STOCK_EXPIRING: 'expiring_lot',
    STOCK_EXPIRED: 'expired_lot',
    
    // Ventes
    SALE_PENDING_PAYMENT: 'pending_payment',
    SALE_OVERDUE_PAYMENT: 'overdue_payment',
    SALE_ORDER_PENDING: 'order_pending',
    
    // Finances
    FINANCE_LOW_BALANCE: 'low_balance',
    FINANCE_OVERDUE_EXPENSE: 'overdue_expense',
    FINANCE_UPCOMING_EXPENSE: 'upcoming_expense',
    
    // Fournisseurs
    SUPPLIER_LOW_RATING: 'supplier_low_rating',
    SUPPLIER_HIGH_DELAY: 'supplier_high_delay',
    SUPPLIER_INACTIVE: 'supplier_inactive',
    
    // Livraisons
    DELIVERY_DELAYED: 'delivery_delayed',
    DELIVERY_PENDING: 'delivery_pending',
    
    // Utilisateurs
    USER_PENDING_APPROVAL: 'user_pending_approval',
    USER_INACTIVE: 'user_inactive'
  };

  // Configuration des couleurs par type
  static getAlertColor(level) {
    const colors = {
      error: 'error',
      warning: 'warning',
      info: 'info',
      success: 'success'
    };
    return colors[level] || 'info';
  }

  // Configuration des icônes par type
  static getAlertIcon(type) {
    const icons = {
      // Achats
      overdue_order: 'Clock',
      upcoming_receipt: 'Truck',
      no_receipt: 'PackageCheck',
      overdue_invoice: 'DollarSign',
      upcoming_invoice_due: 'FileText',
      pending_return: 'RotateCcw',
      purchase_alert: 'AlertTriangle',
      
      // Stocks
      low_stock: 'Package',
      out_of_stock: 'PackageX',
      expiring_lot: 'Calendar',
      expired_lot: 'AlertOctagon',
      
      // Ventes
      pending_payment: 'CreditCard',
      overdue_payment: 'AlertCircle',
      order_pending: 'ShoppingCart',
      
      // Finances
      low_balance: 'DollarSign',
      overdue_expense: 'FileWarning',
      upcoming_expense: 'CalendarClock',
      
      // Fournisseurs
      supplier_low_rating: 'Award',
      supplier_high_delay: 'TrendingUp',
      supplier_inactive: 'Building2',
      
      // Livraisons
      delivery_delayed: 'Clock',
      delivery_pending: 'Truck',
      
      // Utilisateurs
      user_pending_approval: 'UserPlus',
      user_inactive: 'UserX'
    };
    return icons[type] || 'Bell';
  }

  // Configuration des pages de redirection
  static getRedirectPath(alert) {
    const pathMap = {
      // Achats
      overdue_order: `/commandes-fournisseurs/${alert.order_id}`,
      upcoming_receipt: `/commandes-fournisseurs/${alert.order_id}`,
      no_receipt: `/commandes-fournisseurs/${alert.order_id}`,
      overdue_invoice: `/factures/${alert.invoice_id}`,
      upcoming_invoice_due: `/factures/${alert.invoice_id}`,
      pending_return: `/purchase-returns/${alert.return_id}`,
      purchase_alert: '/purchase-alerts',
      
      // Stocks
      low_stock: `/produits/${alert.product_id}`,
      out_of_stock: `/produits/${alert.product_id}`,
      expiring_lot: `/lots/${alert.lot_id}`,
      expired_lot: `/lots/${alert.lot_id}`,
      
      // Ventes
      pending_payment: `/ventes/${alert.sale_id}`,
      overdue_payment: `/ventes/${alert.sale_id}`,
      order_pending: `/ventes/${alert.order_id}`,
      
      // Finances
      low_balance: '/tresorerie',
      overdue_expense: `/depenses/${alert.expense_id}`,
      upcoming_expense: `/depenses/${alert.expense_id}`,
      
      // Fournisseurs
      supplier_low_rating: `/fournisseurs/${alert.supplier_id}`,
      supplier_high_delay: `/fournisseurs/${alert.supplier_id}`,
      supplier_inactive: `/fournisseurs/${alert.supplier_id}`,
      
      // Livraisons
      delivery_delayed: `/livraisons/${alert.delivery_id}`,
      delivery_pending: `/livraisons/${alert.delivery_id}`,
      
      // Utilisateurs
      user_pending_approval: '/utilisateurs',
      user_inactive: '/utilisateurs'
    };
    
    return pathMap[alert.type] || '/dashboard';
  }

  // Récupérer toutes les alertes
  static async getAllAlerts() {
    try {
      const token = localStorage.getItem('Token');
      
      // Appels parallèles vers tous les endpoints d'alertes
      const [
        purchaseRes,
        stockRes,
        salesRes,
        financeRes,
        supplierRes,
        deliveryRes,
        userRes
      ] = await Promise.all([
        AxiosInstance.get('/purchase-alerts/', { 
          headers: { Authorization: `Token ${token}` } 
        }).catch(() => ({ data: { alerts: [] } })),
        
        AxiosInstance.get('/stock-alerts/', { 
          headers: { Authorization: `Token ${token}` } 
        }).catch(() => ({ data: { alerts: [] } })),
        
        AxiosInstance.get('/sales-alerts/', { 
          headers: { Authorization: `Token ${token}` } 
        }).catch(() => ({ data: { alerts: [] } })),
        
        AxiosInstance.get('/finance-alerts/', { 
          headers: { Authorization: `Token ${token}` } 
        }).catch(() => ({ data: { alerts: [] } })),
        
        AxiosInstance.get('/supplier-alerts/', { 
          headers: { Authorization: `Token ${token}` } 
        }).catch(() => ({ data: { alerts: [] } })),
        
        AxiosInstance.get('/delivery-alerts/', { 
          headers: { Authorization: `Token ${token}` } 
        }).catch(() => ({ data: { alerts: [] } })),
        
        AxiosInstance.get('/user-alerts/', { 
          headers: { Authorization: `Token ${token}` } 
        }).catch(() => ({ data: { alerts: [] } }))
      ]);
      
      // Fusionner toutes les alertes
      const allAlerts = [
        ...(purchaseRes.data?.alerts || []).map(a => ({ ...a, category: 'achats' })),
        ...(stockRes.data?.alerts || []).map(a => ({ ...a, category: 'stocks' })),
        ...(salesRes.data?.alerts || []).map(a => ({ ...a, category: 'ventes' })),
        ...(financeRes.data?.alerts || []).map(a => ({ ...a, category: 'finances' })),
        ...(supplierRes.data?.alerts || []).map(a => ({ ...a, category: 'fournisseurs' })),
        ...(deliveryRes.data?.alerts || []).map(a => ({ ...a, category: 'livraisons' })),
        ...(userRes.data?.alerts || []).map(a => ({ ...a, category: 'utilisateurs' }))
      ];
      
      // Ajouter un ID unique
      allAlerts.forEach((alert, index) => {
        alert.id = `alert_${Date.now()}_${index}`;
        alert.created_at = alert.created_at || new Date().toISOString();
      });
      
      // Trier par date et niveau
      allAlerts.sort((a, b) => {
        // D'abord par niveau (error > warning > info)
        const levelOrder = { error: 0, warning: 1, info: 2 };
        if (levelOrder[a.level] !== levelOrder[b.level]) {
          return levelOrder[a.level] - levelOrder[b.level];
        }
        // Puis par date (plus récent en premier)
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      return allAlerts;
      
    } catch (error) {
      console.error('Erreur chargement alertes:', error);
      return [];
    }
  }

  // Récupérer les statistiques des alertes
  static async getAlertStats() {
    const alerts = await this.getAllAlerts();
    return {
      total: alerts.length,
      error: alerts.filter(a => a.level === 'error').length,
      warning: alerts.filter(a => a.level === 'warning').length,
      info: alerts.filter(a => a.level === 'info').length,
      byCategory: {
        achats: alerts.filter(a => a.category === 'achats').length,
        stocks: alerts.filter(a => a.category === 'stocks').length,
        ventes: alerts.filter(a => a.category === 'ventes').length,
        finances: alerts.filter(a => a.category === 'finances').length,
        fournisseurs: alerts.filter(a => a.category === 'fournisseurs').length,
        livraisons: alerts.filter(a => a.category === 'livraisons').length,
        utilisateurs: alerts.filter(a => a.category === 'utilisateurs').length
      },
      byType: alerts.reduce((acc, alert) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

export default AlertService;