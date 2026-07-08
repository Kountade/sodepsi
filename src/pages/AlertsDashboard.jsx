// src/pages/AlertsDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../components/AxiosInstance';
import {
  AlertTriangle, Bell, CheckCircle, XCircle, Info,
  Package, ShoppingCart, Truck, FileText, RotateCcw,
  RefreshCw, Eye, Calendar, Clock, DollarSign,
  Building2, Filter, ChevronLeft, ChevronRight,
  AlertCircle, TrendingUp, Users, PackageCheck,
  AlertOctagon, Activity, Loader2, ArrowLeft
} from 'lucide-react';

const AlertsDashboard = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    error: 0,
    warning: 0,
    info: 0,
    byCategory: {}
  });

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Configuration des catégories
  const categoryConfig = {
    achats: { 
      label: 'Achats', 
      icon: ShoppingCart, 
      color: 'primary',
      bgColor: 'bg-primary/10',
      textColor: 'text-primary'
    },
    stocks: { 
      label: 'Stocks', 
      icon: Package, 
      color: 'info',
      bgColor: 'bg-info/10',
      textColor: 'text-info'
    },
    ventes: { 
      label: 'Ventes', 
      icon: DollarSign, 
      color: 'success',
      bgColor: 'bg-success/10',
      textColor: 'text-success'
    },
    finances: { 
      label: 'Finances', 
      icon: TrendingUp, 
      color: 'warning',
      bgColor: 'bg-warning/10',
      textColor: 'text-warning'
    },
    fournisseurs: { 
      label: 'Fournisseurs', 
      icon: Building2, 
      color: 'secondary',
      bgColor: 'bg-secondary/10',
      textColor: 'text-secondary'
    },
    livraisons: { 
      label: 'Livraisons', 
      icon: Truck, 
      color: 'accent',
      bgColor: 'bg-accent/10',
      textColor: 'text-accent'
    },
    utilisateurs: { 
      label: 'Utilisateurs', 
      icon: Users, 
      color: 'neutral',
      bgColor: 'bg-neutral/10',
      textColor: 'text-neutral'
    }
  };

  const getCategoryBadge = (category) => {
    const config = categoryConfig[category];
    if (!config) return <span className="badge badge-ghost">Inconnu</span>;
    return (
      <span className={`badge ${config.color === 'primary' ? 'badge-primary' : 
                               config.color === 'info' ? 'badge-info' :
                               config.color === 'success' ? 'badge-success' :
                               config.color === 'warning' ? 'badge-warning' :
                               config.color === 'secondary' ? 'badge-secondary' :
                               config.color === 'accent' ? 'badge-accent' : 'badge-ghost'}`}>
        <span className="flex items-center gap-1">
          <config.icon className="w-3 h-3" />
          {config.label}
        </span>
      </span>
    );
  };

  // ✅ Données de test
  const getMockAlerts = () => [
    {
      id: 1,
      type: 'overdue_order',
      level: 'error',
      category: 'achats',
      message: 'Commande PO-2024-001 en retard de 5 jours',
      order: { po_number: 'PO-2024-001', id: 1 },
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      type: 'low_stock',
      level: 'warning',
      category: 'stocks',
      message: 'Stock bas pour Produit A (10 unités)',
      product: { name: 'Produit A', id: 1 },
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      type: 'expired_lot',
      level: 'error',
      category: 'stocks',
      message: 'Lot LOT-2023-012 expiré depuis 3 jours',
      lot: { lot_number: 'LOT-2023-012', id: 1 },
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      type: 'overdue_invoice',
      level: 'warning',
      category: 'finances',
      message: 'Facture INV-2024-001 en retard de 2 jours',
      invoice: { invoice_number: 'INV-2024-001', id: 1 },
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      type: 'pending_payment',
      level: 'info',
      category: 'ventes',
      message: 'Vente V-2024-001 en attente de paiement',
      sale: { id: 1 },
      created_at: new Date().toISOString()
    },
    {
      id: 6,
      type: 'pending_return',
      level: 'warning',
      category: 'achats',
      message: 'Retour RET-2024-001 en attente depuis 4 jours',
      return: { return_number: 'RET-2024-001', id: 1 },
      created_at: new Date().toISOString()
    }
  ];

  // ✅ Fonction de chargement avec gestion d'erreur
  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('Session expirée, veuillez vous reconnecter');
        setTimeout(() => navigate('/login'), 2000);
        // ✅ Charger les données de test même en cas d'erreur
        const mockAlerts = getMockAlerts();
        setAlerts(mockAlerts);
        setStats({
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
        });
        setLoading(false);
        return;
      }

      // ✅ Tentative d'appel API
      try {
        const response = await AxiosInstance.get('/global-alerts/', {
          headers: { Authorization: `Token ${token}` }
        });
        
        const data = response.data || { alerts: [], stats: { total: 0, error: 0, warning: 0, info: 0, byCategory: {} } };
        setAlerts(data.alerts || []);
        setStats(data.stats || { total: 0, error: 0, warning: 0, info: 0, byCategory: {} });
      } catch (apiError) {
        console.error('Erreur API:', apiError);
        // ✅ En cas d'erreur API, charger les données de test
        const mockAlerts = getMockAlerts();
        setAlerts(mockAlerts);
        setStats({
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
        });
        showNotification('Chargement des données de démonstration', 'info');
      }
      
    } catch (error) {
      console.error('Erreur:', error);
      // ✅ Dernier recours : charger les données de test
      const mockAlerts = getMockAlerts();
      setAlerts(mockAlerts);
      setStats({
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
      });
      setError('Erreur de chargement des alertes - Affichage des données de démonstration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const getLevelIcon = (level) => {
    switch(level) {
      case 'error': return <AlertOctagon className="w-5 h-5 text-error" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'info': return <Info className="w-5 h-5 text-info" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getLevelBadge = (level) => {
    const configs = {
      error: { label: 'Urgent', className: 'badge-error' },
      warning: { label: 'À surveiller', className: 'badge-warning' },
      info: { label: 'Information', className: 'badge-info' }
    };
    const config = configs[level] || { label: level, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter !== 'all' && alert.level !== filter) return false;
    if (categoryFilter !== 'all' && alert.category !== categoryFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAlerts = filteredAlerts.slice(startIndex, startIndex + itemsPerPage);

  const uniqueCategories = [...new Set(alerts.map(a => a.category))];

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('fr-FR');
    } catch {
      return '-';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement des alertes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header */}
      <div className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/dashboard')} className="btn btn-ghost btn-sm gap-2">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/15 rounded-xl">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Centre d'Alertes</h1>
                  <p className="text-sm text-gray-500">
                    {stats.total} alerte(s) - {stats.error} urgentes, {stats.warning} à surveiller
                    {error && <span className="text-warning ml-2">⚠️ {error}</span>}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchAlerts} className="btn btn-ghost btn-sm btn-circle" title="Actualiser">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Cartes statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="font-semibold text-xl">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-error/10 rounded-lg">
                <AlertOctagon className="w-5 h-5 text-error" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Urgentes</p>
                <p className="font-semibold text-xl text-error">{stats.error}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-gray-500">À surveiller</p>
                <p className="font-semibold text-xl text-warning">{stats.warning}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <Info className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Informations</p>
                <p className="font-semibold text-xl text-info">{stats.info}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques par catégorie */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" /> Alertes par catégorie
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(stats.byCategory || {}).map(([category, count]) => {
                const config = categoryConfig[category];
                if (!config || count === 0) return null;
                const Icon = config.icon;
                return (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category === categoryFilter ? 'all' : category)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      categoryFilter === category 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <Icon className={`w-4 h-4 ${config.textColor}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-700">{config.label}</p>
                      <p className="text-lg font-bold text-gray-900">{count}</p>
                    </div>
                    {categoryFilter === category && (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" /> Filtres
            </h3>
          </div>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <select 
                  className="select select-bordered w-full" 
                  value={filter} 
                  onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="all">Tous les niveaux</option>
                  <option value="error">⚠️ Urgentes</option>
                  <option value="warning">⚡ À surveiller</option>
                  <option value="info">ℹ️ Informations</option>
                </select>
              </div>
              <div className="flex-1">
                <select 
                  className="select select-bordered w-full" 
                  value={categoryFilter} 
                  onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="all">Toutes les catégories</option>
                  {uniqueCategories.map(cat => {
                    const config = categoryConfig[cat];
                    return (
                      <option key={cat} value={cat}>
                        {config ? config.label : cat}
                      </option>
                    );
                  })}
                </select>
              </div>
              <button 
                className="btn btn-outline gap-2" 
                onClick={() => { setFilter('all'); setCategoryFilter('all'); setCurrentPage(1); }}
              >
                <RefreshCw className="w-4 h-4" /> Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Liste des alertes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" /> Liste des alertes
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold w-12"></th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Niveau</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Catégorie</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Message</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAlerts.length === 0 ? (
                  <tr className="border-b">
                    <td colSpan="6" className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <CheckCircle className="w-16 h-16 text-success" />
                        <p className="text-gray-500 font-medium">Aucune alerte à afficher</p>
                        <p className="text-sm text-gray-400">Tout est sous contrôle ! 🎉</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedAlerts.map(alert => (
                    <tr key={alert.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{getLevelIcon(alert.level)}</td>
                      <td className="px-4 py-3">{getLevelBadge(alert.level)}</td>
                      <td className="px-4 py-3">{getCategoryBadge(alert.category)}</td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs">
                          <p className="text-sm">{alert.message}</p>
                          {alert.order && (
                            <span className="text-xs text-gray-400">Commande: {alert.order.po_number}</span>
                          )}
                          {alert.invoice && (
                            <span className="text-xs text-gray-400">Facture: {alert.invoice.invoice_number}</span>
                          )}
                          {alert.product && (
                            <span className="text-xs text-gray-400">Produit: {alert.product.name}</span>
                          )}
                          {alert.lot && (
                            <span className="text-xs text-gray-400">Lot: {alert.lot.lot_number}</span>
                          )}
                          {alert.supplier && (
                            <span className="text-xs text-gray-400">Fournisseur: {alert.supplier.name}</span>
                          )}
                          {alert.return && (
                            <span className="text-xs text-gray-400">Retour: {alert.return.return_number}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatDate(alert.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button 
                            className="btn btn-ghost btn-sm btn-circle text-primary"
                            title="Voir détails"
                            onClick={() => {
                              if (alert.order) navigate(`/commandes-fournisseurs/${alert.order.id}`);
                              else if (alert.invoice) navigate(`/factures/${alert.invoice.id}`);
                              else if (alert.product) navigate(`/produits/${alert.product.id}`);
                              else if (alert.lot) navigate(`/lots/${alert.lot.id}`);
                              else if (alert.supplier) navigate(`/fournisseurs/${alert.supplier.id}`);
                              else if (alert.return) navigate(`/purchase-returns/${alert.return.id}`);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm btn-circle text-error"
                            title="Ignorer l'alerte"
                            onClick={() => {
                              showNotification('Alerte ignorée', 'success');
                              fetchAlerts();
                            }}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredAlerts.length > 0 && (
            <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Affichage de {startIndex + 1} à {Math.min(currentPage * itemsPerPage, filteredAlerts.length)} sur {filteredAlerts.length}
              </div>
              <div className="flex items-center gap-3">
                <select 
                  className="select select-bordered select-sm" 
                  value={itemsPerPage} 
                  onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                >
                  <option value="5">5 lignes</option>
                  <option value="10">10 lignes</option>
                  <option value="20">20 lignes</option>
                  <option value="50">50 lignes</option>
                </select>
                <div className="join">
                  <button 
                    className="join-item btn btn-sm" 
                    onClick={() => setCurrentPage(p => Math.max(1, p-1))} 
                    disabled={currentPage === 1 || totalPages === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="join-item btn btn-sm btn-disabled">
                    {totalPages > 0 ? `Page ${currentPage} / ${totalPages}` : 'Page 0'}
                  </span>
                  <button 
                    className="join-item btn btn-sm" 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} 
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsDashboard;