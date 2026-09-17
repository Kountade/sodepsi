// src/components/retours-clients/RetoursClientsList.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Search, RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight, Calendar,
  FileText, Loader2, Download, Printer, Undo2,
  DollarSign, Package, Ban, AlertTriangle
} from 'lucide-react';

const RetoursClientsList = () => {
  const navigate = useNavigate();
  const [avoirs, setAvoirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    total_amount: 0,
    by_type: {}
  });

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 FCFA';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0 FCFA';
    return `${num.toLocaleString('fr-FR')} FCFA`;
  };

  // ============================================================
  // CHARGEMENT DES AVOIRS
  // ============================================================
  const fetchAvoirs = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await AxiosInstance.get(
        `/avoirs/?${params.toString()}`,
        { headers: { 'Authorization': `Token ${token}` } }
      );

      let data = response.data;
      let avoirsData = Array.isArray(data) ? data : (data.results || []);

      setAvoirs(avoirsData);

      // Calcul des stats
      const totalAmount = avoirsData.reduce(
        (sum, a) => sum + parseFloat(a.amount || 0), 0
      );
      const byType = {};
      avoirsData.forEach(a => {
        byType[a.type] = (byType[a.type] || 0) + 1;
      });

      setStats({
        total: avoirsData.length,
        total_amount: totalAmount,
        by_type: byType
      });
    } catch (error) {
      console.error('Erreur chargement avoirs:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [searchTerm, typeFilter, navigate]);

  useEffect(() => {
    fetchAvoirs();
  }, [fetchAvoirs]);

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer définitivement cet avoir ?')) return;

    try {
      const token = getToken();
      await AxiosInstance.delete(`/avoirs/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Avoir supprimé', 'success');
      fetchAvoirs();
    } catch (error) {
      console.error('Erreur suppression:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  // ============================================================
  // BADGES
  // ============================================================
  const getTypeBadge = (type) => {
    const configs = {
      refund: { label: 'Remboursement', className: 'badge-error' },
      return: { label: 'Retour', className: 'badge-warning' },
      discount: { label: 'Remise', className: 'badge-info' },
      error: { label: 'Erreur', className: 'badge-ghost' }
    };
    const config = configs[type] || { label: type, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  // ============================================================
  // PAGINATION
  // ============================================================
  const paginatedAvoirs = avoirs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(avoirs.length / itemsPerPage);

  // ============================================================
  // RENDU
  // ============================================================
  if (loading && avoirs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-base font-medium text-gray-500">Chargement des retours...</p>
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
              {notification.type === 'success'
                ? <CheckCircle className="w-4 h-4" />
                : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification(null)}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-warning/10 via-warning/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-warning/10 rounded-xl">
                <Undo2 className="w-7 h-7 text-warning" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-warning">Retours Clients</h1>
              {loading && avoirs.length > 0 && (
                <Loader2 className="w-5 h-5 text-warning animate-spin ml-2" />
              )}
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Gestion des avoirs et remboursements clients
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchAvoirs}
              className="btn btn-sm sm:btn-md btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={() => navigate('/retours-clients/nouveau')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-warning to-warning/80 text-white border-none shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" /> Nouveau retour
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold text-warning">{stats.total}</p>
            </div>
            <Undo2 className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Montant total</p>
              <p className="text-xl font-bold text-error">{formatCurrency(stats.total_amount)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-error/20" />
          </div>
        </div>
        {Object.entries(stats.by_type).map(([type, count]) => (
          <div key={type} className="bg-white shadow-md rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">
                  {type === 'refund' ? 'Remboursements' :
                   type === 'return' ? 'Retours' :
                   type === 'discount' ? 'Remises' : 'Autres'}
                </p>
                <p className="text-xl font-bold">{count}</p>
              </div>
              <span className="badge badge-ghost">{count}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro, client, raison..."
              className="input input-bordered w-full pl-9"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline btn-sm sm:hidden gap-2"
          >
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer' : 'Filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 gap-3`}>
            <select
              className="select select-bordered w-full"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Tous les types</option>
              <option value="refund">Remboursement</option>
              <option value="return">Retour</option>
              <option value="discount">Remise</option>
              <option value="error">Erreur</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4">N° Avoir</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4 hidden lg:table-cell">Date</th>
                <th className="py-3 px-4 text-center">Type</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4 hidden md:table-cell">Raison</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && avoirs.length === 0 && (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 w-20 bg-gray-200 rounded"></div></td>
                    <td className="py-3 px-4"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
                    <td className="py-3 px-4 hidden lg:table-cell"><div className="h-4 w-16 bg-gray-200 rounded"></div></td>
                    <td className="py-3 px-4 text-center"><div className="h-6 w-16 bg-gray-200 rounded mx-auto"></div></td>
                    <td className="py-3 px-4 text-right"><div className="h-4 w-16 bg-gray-200 rounded ml-auto"></div></td>
                    <td className="py-3 px-4 hidden md:table-cell"><div className="h-4 w-32 bg-gray-200 rounded"></div></td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-1">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {!loading && paginatedAvoirs.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Undo2 className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucun retour trouvé</p>
                      <button
                        onClick={() => navigate('/retours-clients/nouveau')}
                        className="btn btn-warning btn-sm gap-2"
                      >
                        <Plus className="w-4 h-4" /> Créer un retour
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && paginatedAvoirs.map(avoir => (
                <tr key={avoir.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono font-semibold">{avoir.avoir_number}</span>
                  </td>
                  <td className="py-3 px-4 font-medium">{avoir.client_name || '-'}</td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      {formatDate(avoir.date)}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">{getTypeBadge(avoir.type)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-error">
                    {formatCurrency(avoir.amount)}
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="text-sm text-gray-600 line-clamp-1">
                      {avoir.reason || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center gap-1 flex-wrap">
                      <button
                        onClick={() => navigate(`/retours-clients/${avoir.id}`)}
                        className="btn btn-ghost btn-sm btn-circle tooltip"
                        data-tip="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/retours-clients/${avoir.id}/modifier`)}
                        className="btn btn-ghost btn-sm btn-circle tooltip text-warning"
                        data-tip="Modifier"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/retours-clients/${avoir.id}/pdf`)}
                        className="btn btn-ghost btn-sm btn-circle tooltip text-primary"
                        data-tip="Télécharger PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(avoir.id)}
                        className="btn btn-ghost btn-sm btn-circle tooltip text-error"
                        data-tip="Supprimer"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {avoirs.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, avoirs.length)} sur {avoirs.length}
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
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || totalPages === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="join-item btn btn-sm btn-disabled">
                  {totalPages > 0 ? `Page ${currentPage} / ${totalPages}` : 'Page 0'}
                </span>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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

export default RetoursClientsList;