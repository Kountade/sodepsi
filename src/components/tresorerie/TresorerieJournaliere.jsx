// src/components/tresorerie/TresorerieJournaliere.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Search, Eye, Trash2, RefreshCw, Calendar,
  DollarSign, TrendingUp, TrendingDown, Building2,
  ChevronLeft, ChevronRight, X, AlertCircle, CheckCircle,
  Filter, Clock, FileText, Repeat, Edit, Save
} from 'lucide-react';

const TresorerieJournaliere = () => {
  const navigate = useNavigate();
  const [journaliers, setJournaliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('all');
  const [filterDateDebut, setFilterDateDebut] = useState('');
  const [filterDateFin, setFilterDateFin] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateDate, setGenerateDate] = useState(new Date().toISOString().split('T')[0]);
  const [generateWarehouse, setGenerateWarehouse] = useState('');
  const [generating, setGenerating] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // Charger les données
  const fetchJournaliers = async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/tresorerie-journaliere/';
      const params = new URLSearchParams();

      if (filterWarehouse !== 'all') params.append('warehouse', filterWarehouse);
      if (filterDateDebut) params.append('date__gte', filterDateDebut);
      if (filterDateFin) params.append('date__lte', filterDateFin);
      if (searchTerm) params.append('search', searchTerm);

      if (params.toString()) url += `?${params.toString()}`;

      const response = await AxiosInstance.get(url, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setJournaliers(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Charger les entrepôts
  const fetchWarehouses = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/warehouses/?is_active=true', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setWarehouses(response.data || []);
    } catch (error) {
      console.error('Erreur chargement entrepôts:', error);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchJournaliers();
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm, filterWarehouse, filterDateDebut, filterDateFin]);

  // Générer une ligne
  const handleGenerate = async () => {
    if (!generateDate || !generateWarehouse) {
      showNotification('Veuillez choisir une date et un entrepôt', 'error');
      return;
    }
    setGenerating(true);
    try {
      const token = getToken();
      await AxiosInstance.post('/tresorerie-journaliere/generer/', {
        date: generateDate,
        warehouse: generateWarehouse
      }, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Données générées avec succès', 'success');
      setShowGenerateModal(false);
      fetchJournaliers();
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors de la génération', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Supprimer
  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/tresorerie-journaliere/${itemToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Ligne supprimée avec succès', 'success');
      fetchJournaliers();
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  // Pagination
  const filteredItems = journaliers;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  // Statistiques
  const stats = {
    total: journaliers.length,
    totalEntrees: journaliers.reduce((acc, item) => acc + parseFloat(item.total_entrees || 0), 0),
    totalSorties: journaliers.reduce((acc, item) => acc + parseFloat(item.total_sorties || 0), 0),
    totalVariation: journaliers.reduce((acc, item) => acc + parseFloat(item.variation || 0), 0),
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return Number(num).toLocaleString();
  };

  const getWarehouseName = (id) => {
    const wh = warehouses.find(w => w.id === id);
    return wh ? wh.name : id;
  };

  if (loading && journaliers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement...</p>
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

      {/* Modal de suppression */}
      {showDeleteModal && itemToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer cette ligne ?</p>
              <p className="font-semibold mt-2">{itemToDelete.date} - {getWarehouseName(itemToDelete.warehouse)}</p>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button className="btn btn-ghost flex-1" onClick={() => setShowDeleteModal(false)}>Annuler</button>
              <button className="btn btn-error flex-1 gap-2" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de génération */}
      {showGenerateModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Générer une ligne journalière</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={generateDate}
                  onChange={(e) => setGenerateDate(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Entrepôt</label>
                <select
                  className="select select-bordered w-full"
                  value={generateWarehouse}
                  onChange={(e) => setGenerateWarehouse(e.target.value)}
                >
                  <option value="">Choisir un entrepôt</option>
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowGenerateModal(false)}>Annuler</button>
              <button className="btn btn-primary gap-2" onClick={handleGenerate} disabled={generating}>
                {generating ? <span className="loading loading-spinner loading-sm"></span> : <Save className="w-4 h-4" />}
                Générer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Calendar className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Trésorerie journalière</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Suivi quotidien – {stats.total} jour(s) enregistré(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchJournaliers} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={() => setShowGenerateModal(true)} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2">
              <Plus className="w-4 h-4" /> Générer
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Jours</p><p className="text-xl font-bold text-primary">{stats.total}</p></div>
            <Calendar className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total entrées</p><p className="text-xl font-bold text-success">{formatNumber(stats.totalEntrees)}</p></div>
            <TrendingUp className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total sorties</p><p className="text-xl font-bold text-error">{formatNumber(stats.totalSorties)}</p></div>
            <TrendingDown className="w-8 h-8 text-error/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Variation cumulée</p><p className={`text-xl font-bold ${stats.totalVariation >= 0 ? 'text-success' : 'text-error'}`}>{formatNumber(stats.totalVariation)}</p></div>
            <DollarSign className="w-8 h-8 text-primary/20" />
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
              placeholder="Rechercher par entrepôt, date..."
              className="input input-bordered w-full pl-9"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              className="select select-bordered w-full"
              value={filterWarehouse}
              onChange={(e) => { setFilterWarehouse(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Tous les entrepôts</option>
              {warehouses.map(wh => (
                <option key={wh.id} value={wh.id}>{wh.name}</option>
              ))}
            </select>
            <input
              type="date"
              className="input input-bordered w-full"
              value={filterDateDebut}
              onChange={(e) => { setFilterDateDebut(e.target.value); setCurrentPage(1); }}
              placeholder="Date début"
            />
            <input
              type="date"
              className="input input-bordered w-full"
              value={filterDateFin}
              onChange={(e) => { setFilterDateFin(e.target.value); setCurrentPage(1); }}
              placeholder="Date fin"
            />
          </div>
          <button
            className="btn btn-outline btn-sm gap-2 self-end"
            onClick={() => {
              setFilterWarehouse('all');
              setFilterDateDebut('');
              setFilterDateFin('');
              setSearchTerm('');
              setCurrentPage(1);
            }}
          >
            <RefreshCw className="w-4 h-4" /> Réinitialiser
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3">Date</th>
                <th className="py-3">Entrepôt</th>
                <th className="py-3 text-right">Solde ouv.</th>
                <th className="py-3 text-right">Solde ferm.</th>
                <th className="py-3 text-right">Entrées</th>
                <th className="py-3 text-right">Sorties</th>
                <th className="py-3 text-right">Variation</th>
                <th className="py-3 text-center">Opérations</th>
                <th className="py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Calendar className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucune donnée journalière trouvée</p>
                      <button onClick={() => setShowGenerateModal(true)} className="btn btn-primary btn-sm gap-2">
                        <Plus className="w-4 h-4" /> Générer
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="font-mono">{item.date}</td>
                    <td>{getWarehouseName(item.warehouse)}</td>
                    <td className="text-right">{formatNumber(item.solde_ouverture)}</td>
                    <td className="text-right">{formatNumber(item.solde_fermeture)}</td>
                    <td className="text-right text-success">{formatNumber(item.total_entrees)}</td>
                    <td className="text-right text-error">{formatNumber(item.total_sorties)}</td>
                    <td className={`text-right font-bold ${parseFloat(item.variation || 0) >= 0 ? 'text-success' : 'text-error'}`}>
                      {formatNumber(item.variation)}
                    </td>
                    <td className="text-center">
                      <span className="badge badge-ghost">{item.nb_operations}</span>
                    </td>
                    <td className="text-center">
                      <div className="flex justify-center gap-1">
                        {/* Navigation vers la page de détail */}
                        <button
                          onClick={() => navigate(`/tresorerie-journaliere/${item.id}`)}
                          className="btn btn-ghost btn-sm btn-circle"
                          title="Voir le détail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setItemToDelete(item); setShowDeleteModal(true); }}
                          className="btn btn-ghost btn-sm btn-circle text-error"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
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
        {filteredItems.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(currentPage * itemsPerPage, filteredItems.length)} sur {filteredItems.length}
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
              </select>
              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
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

export default TresorerieJournaliere;