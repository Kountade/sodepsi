// src/components/achats/PurchaseAlerts.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  AlertTriangle, Bell, CheckCircle, XCircle, Info,
  Package, ShoppingCart, Truck, FileText, RotateCcw,
  RefreshCw, Eye, Calendar, Clock, DollarSign,
  Building2, Filter, ChevronLeft, ChevronRight,
  AlertCircle, TrendingUp, Users, PackageCheck,
  Download, Mail, BellRing, AlertOctagon
} from 'lucide-react';

const PurchaseAlerts = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, error, warning, info
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [notification, setNotification] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    error: 0,
    warning: 0,
    info: 0
  });

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await AxiosInstance.get('/purchase-alerts/', {
        headers: { Authorization: `Token ${token}` }
      });

      setAlerts(response.data.alerts || []);
      setStats(response.data.stats || { total: 0, error: 0, warning: 0, info: 0 });
    } catch (error) {
      console.error('Erreur chargement alertes:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        showNotification('Erreur de chargement des alertes', 'error');
        // Données de test pour le développement
        setAlerts(getMockAlerts());
        setStats({ total: 8, error: 2, warning: 4, info: 2 });
      }
    } finally {
      setLoading(false);
    }
  };

  // Données de test
  const getMockAlerts = () => [
    {
      id: 1,
      type: 'overdue_order',
      level: 'error',
      message: 'Commande PO-2024-001 en retard de 5 jours',
      order: { po_number: 'PO-2024-001', id: 1 },
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      type: 'low_stock',
      level: 'warning',
      message: 'Stock bas pour Produit A (10 unités)',
      product: { name: 'Produit A', id: 1 },
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      type: 'expired_lot',
      level: 'error',
      message: 'Lot LOT-2023-012 expiré depuis 3 jours',
      lot: { lot_number: 'LOT-2023-012', id: 1 },
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      type: 'upcoming_invoice_due',
      level: 'info',
      message: 'Facture INV-2024-001 à payer dans 3 jours',
      invoice: { invoice_number: 'INV-2024-001', id: 1 },
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      type: 'pending_return',
      level: 'warning',
      message: 'Retour RET-2024-001 en attente depuis 4 jours',
      return: { return_number: 'RET-2024-001', id: 1 },
      created_at: new Date().toISOString()
    }
  ];

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
      warning: { label: 'A surveiller', className: 'badge-warning' },
      info: { label: 'Information', className: 'badge-info' }
    };
    const config = configs[level] || { label: level, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  const getTypeIcon = (type) => {
    const icons = {
      overdue_order: <Clock className="w-4 h-4" />,
      upcoming_receipt: <Truck className="w-4 h-4" />,
      no_receipt: <PackageCheck className="w-4 h-4" />,
      overdue_invoice: <DollarSign className="w-4 h-4" />,
      upcoming_invoice_due: <FileText className="w-4 h-4" />,
      low_stock: <Package className="w-4 h-4" />,
      expiring_lot: <Calendar className="w-4 h-4" />,
      expired_lot: <AlertCircle className="w-4 h-4" />,
      supplier_high_delay: <TrendingUp className="w-4 h-4" />,
      supplier_low_rating: <Building2 className="w-4 h-4" />,
      pending_return: <RotateCcw className="w-4 h-4" />
    };
    return icons[type] || <AlertCircle className="w-4 h-4" />;
  };

  const getTypeLabel = (type) => {
    const labels = {
      overdue_order: 'Commande en retard',
      upcoming_receipt: 'Réception à venir',
      no_receipt: 'Sans réception',
      overdue_invoice: 'Facture en retard',
      upcoming_invoice_due: 'Facture à échéance',
      low_stock: 'Stock bas',
      expiring_lot: 'Lot à expirer',
      expired_lot: 'Lot expiré',
      supplier_high_delay: 'Fournisseur retardataire',
      supplier_low_rating: 'Fournisseur mal noté',
      pending_return: 'Retour en attente'
    };
    return labels[type] || type;
  };

  const handleDismissAlert = async (alertId) => {
    try {
      const token = getToken();
      await AxiosInstance.post(`/purchase-alerts/${alertId}/dismiss/`, {}, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Alerte ignorée', 'success');
      fetchAlerts();
    } catch (error) {
      showNotification('Erreur lors de l\'ignorance de l\'alerte', 'error');
    }
  };

  const handleSendReport = async () => {
    try {
      const token = getToken();
      await AxiosInstance.post('/purchase-alerts/send-report/', {}, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Rapport envoyé avec succès', 'success');
    } catch (error) {
      showNotification('Erreur lors de l\'envoi du rapport', 'error');
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter !== 'all' && alert.level !== filter) return false;
    if (typeFilter !== 'all' && alert.type !== typeFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAlerts = filteredAlerts.slice(startIndex, startIndex + itemsPerPage);

  const uniqueTypes = [...new Set(alerts.map(a => a.type))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement des alertes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification(null)}>
              <XCircle className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-error/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-error/10 rounded-xl">
                <BellRing className="w-7 h-7 text-error" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-800">Alertes Achats</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              {stats.total} alerte(s) - {stats.error} urgentes, {stats.warning} à surveiller, {stats.info} informations
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchAlerts} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
            </button>
            <button onClick={handleSendReport} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2">
              <Mail className="w-4 h-4" /> Envoyer rapport
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold text-primary">{stats.total}</p>
            </div>
            <BellRing className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Urgentes</p>
              <p className="text-xl font-bold text-error">{stats.error}</p>
            </div>
            <AlertOctagon className="w-8 h-8 text-error/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">À surveiller</p>
              <p className="text-xl font-bold text-warning">{stats.warning}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Informations</p>
              <p className="text-xl font-bold text-info">{stats.info}</p>
            </div>
            <Info className="w-8 h-8 text-info/20" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select 
                className="select select-bordered w-full pl-9" 
                value={filter} 
                onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">Tous les niveaux</option>
                <option value="error">⚠️ Urgentes</option>
                <option value="warning">⚡ À surveiller</option>
                <option value="info">ℹ️ Informations</option>
              </select>
            </div>
          </div>
          <div className="flex-1">
            <select 
              className="select select-bordered w-full" 
              value={typeFilter} 
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Tous les types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{getTypeLabel(type)}</option>
              ))}
            </select>
          </div>
          <button 
            className="btn btn-outline gap-2" 
            onClick={() => { setFilter('all'); setTypeFilter('all'); setCurrentPage(1); }}
          >
            <RefreshCw className="w-4 h-4" /> Réinitialiser
          </button>
        </div>
      </div>

      {/* Liste des alertes */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 w-12"></th>
                <th className="py-3">Niveau</th>
                <th className="py-3">Type</th>
                <th className="py-3">Message</th>
                <th className="py-3 hidden lg:table-cell">Date</th>
                <th className="py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAlerts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <CheckCircle className="w-16 h-16 text-success" />
                      <p className="text-gray-500 font-medium">Aucune alerte à afficher</p>
                      <p className="text-sm text-gray-400">Tout est sous contrôle ! 🎉</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedAlerts.map(alert => (
                  <tr key={alert.id} className="hover:bg-gray-50">
                    <td className="py-3">{getLevelIcon(alert.level)}</td>
                    <td className="py-3">{getLevelBadge(alert.level)}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(alert.type)}
                        <span className="text-sm font-medium">{getTypeLabel(alert.type)}</span>
                      </div>
                    </td>
                    <td className="py-3">
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
                    <td className="py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button 
                          className="btn btn-ghost btn-sm btn-circle text-primary"
                          title="Voir détails"
                          onClick={() => {
                            if (alert.order) navigate(`/commandes-fournisseurs/${alert.order.id}`);
                            else if (alert.invoice) navigate(`/factures/${alert.invoice.id}`);
                            else if (alert.product) navigate(`/produits/${alert.product.id}`);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          className="btn btn-ghost btn-sm btn-circle text-error"
                          title="Ignorer l'alerte"
                          onClick={() => handleDismissAlert(alert.id)}
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
  );
};

export default PurchaseAlerts;