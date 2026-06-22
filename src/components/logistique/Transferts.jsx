// src/components/stock/Transferts.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  MoveHorizontal, Search, RefreshCw, X, CheckCircle, AlertCircle,
  ChevronLeft, ChevronRight, Package,
  Building2, Calendar, Eye, Plus, ArrowRight
} from 'lucide-react';

const Transferts = () => {
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/movements/';
      const params = new URLSearchParams();
      
      params.append('type', 'transfer_out');
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await AxiosInstance.get(url, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setTransfers(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [dateFrom, dateTo]);

  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = !searchTerm || 
      (transfer.product_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (transfer.lot_number?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredTransfers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransfers = filteredTransfers.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: transfers.length,
    totalQuantite: transfers.reduce((sum, t) => sum + (t.quantity || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement des transferts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
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
                <MoveHorizontal className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Transferts</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Gérez les transferts entre entrepôts – {stats.total} transfert(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchTransfers} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={() => navigate('/transferts/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2">
              <Plus className="w-4 h-4" /> Nouveau transfert
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total transferts</p><p className="text-xl font-bold text-primary">{stats.total}</p></div>
            <MoveHorizontal className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Quantité totale</p><p className="text-xl font-bold text-success">{stats.totalQuantite}</p></div>
            <Package className="w-8 h-8 text-success/20" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Rechercher par produit ou lot..." 
              className="input input-bordered w-full pl-9" 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input type="date" className="input input-bordered" placeholder="Date début" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <input type="date" className="input input-bordered" placeholder="Date fin" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            <button className="btn btn-outline gap-2" onClick={() => { setDateFrom(''); setDateTo(''); setSearchTerm(''); setCurrentPage(1); fetchTransfers(); }}>
              <RefreshCw className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Tableau des transferts */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3">Date</th>
                <th className="py-3">Produit / Lot</th>
                <th className="py-3">De</th>
                <th className="py-3 text-center"></th>
                <th className="py-3">Vers</th>
                <th className="py-3 text-center">Quantité</th>
                <th className="py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransfers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <MoveHorizontal className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Aucun transfert trouvé</p>
                    <button onClick={() => navigate('/transferts/nouveau')} className="btn btn-primary btn-sm gap-2 mt-3">
                      <Plus className="w-4 h-4" /> Effectuer un transfert
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedTransfers.map(transfer => (
                  <tr key={transfer.id} className="hover:bg-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">{new Date(transfer.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{transfer.product_name}</p>
                          {transfer.lot_number && (
                            <p className="text-xs text-gray-500">Lot: {transfer.lot_number}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">{transfer.from_warehouse_name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <ArrowRight className="w-4 h-4 text-primary mx-auto" />
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">{transfer.to_warehouse_name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="font-bold text-warning">{transfer.quantity}</span>
                    </td>
                    <td className="py-3 text-center">
                      <button onClick={() => navigate(`/transferts/${transfer.id}`)} className="btn btn-ghost btn-sm btn-circle">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredTransfers.length > 0 && totalPages > 1 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(currentPage * itemsPerPage, filteredTransfers.length)} sur {filteredTransfers.length}
            </div>
            <div className="join">
              <button className="join-item btn btn-sm" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="join-item btn btn-sm btn-disabled">Page {currentPage} / {totalPages}</span>
              <button className="join-item btn btn-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transferts;