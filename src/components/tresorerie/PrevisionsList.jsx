// src/components/tresorerie/PrevisionsList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Search, Eye, Edit, Trash2, RefreshCw, Filter, X,
  AlertCircle, CheckCircle, Clock, Ban, Building2,
  BarChart3, Calendar, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, DollarSign, Tag
} from 'lucide-react';

const PrevisionsList = () => {
  const navigate = useNavigate();
  const [previsions, setPrevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterWarehouse, setFilterWarehouse] = useState('all');
  const [filterPeriode, setFilterPeriode] = useState('all');
  const [filterDateDebut, setFilterDateDebut] = useState('');
  const [filterDateFin, setFilterDateFin] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const getToken = () => localStorage.getItem('Token');

  // NORMALISATION : tableau direct OU reponse paginee DRF
  const normalizeData = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // Charger la liste
  const fetchPrevisions = async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/previsions/';
      const params = new URLSearchParams();

      // Charger un maximum de previsions
      params.append('page_size', '500');

      if (filterWarehouse !== 'all') params.append('warehouse', filterWarehouse);
      if (filterType !== 'all') params.append('type_prevision', filterType);
      if (filterStatus !== 'all') params.append('statut', filterStatus);
      if (filterPeriode !== 'all') params.append('periode', filterPeriode);
      if (filterDateDebut) params.append('date_debut__gte', filterDateDebut);
      if (filterDateFin) params.append('date_fin__lte', filterDateFin);
      if (searchTerm) params.append('search', searchTerm);

      url += `?${params.toString()}`;

      const response = await AxiosInstance.get(url, {
        headers: { 'Authorization': `Token ${token}` }
      });

      // NORMALISATION
      setPrevisions(normalizeData(response.data));
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement des previsions', 'error');
      setPrevisions([]);
    } finally {
      setLoading(false);
    }
  };

  // Charger les entrepots
  const fetchWarehouses = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get(
        '/warehouses/?is_active=true&page_size=1000',
        { headers: { 'Authorization': `Token ${token}` } }
      );
      // NORMALISATION
      setWarehouses(normalizeData(response.data));
    } catch (error) {
      console.error('Erreur chargement entrepots:', error);
      setWarehouses([]);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchPrevisions();
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm, filterWarehouse, filterType, filterStatus, filterPeriode, filterDateDebut, filterDateFin]);

  // Suppression
  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/previsions/${itemToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Prevision supprimee avec succes', 'success');
      fetchPrevisions();
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  // Protection contre previsions non tableau
  const safePrevisions = Array.isArray(previsions) ? previsions : [];

  // Pagination
  const filteredItems = safePrevisions;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  // Statistiques
  const stats = {
    total: safePrevisions.length,
    entrees: safePrevisions.filter(p => p.type_prevision === 'entree').length,
    sorties: safePrevisions.filter(p => p.type_prevision === 'sortie').length,
    validees: safePrevisions.filter(p => p.statut === 'valide').length,
    realisees: safePrevisions.filter(p => p.statut === 'realise').length,
    ecart: safePrevisions.filter(p => parseFloat(p.ecart || 0) !== 0).length,
    totalMontantPrevu: safePrevisions.reduce((acc, p) => acc + parseFloat(p.montant_prevu || 0), 0),
    totalMontantReel: safePrevisions.reduce((acc, p) => acc + parseFloat(p.montant_reel || 0), 0),
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return Number(num).toLocaleString();
  };

  const formatCurrency = (num) => formatNumber(num);

  const getWarehouseName = (id) => {
    const wh = warehouses.find(w => w.id === id);
    return wh ? wh.name : id;
  };

  const getTypeBadge = (type) => {
    const map = {
      'entree': { label: 'Entree', color: 'badge-success' },
      'sortie': { label: 'Sortie', color: 'badge-error' }
    };
    const info = map[type] || { label: type, color: 'badge-ghost' };
    return <span className={`badge ${info.color}`}>{info.label}</span>;
  };

  const getStatusBadge = (status) => {
    const map = {
      'brouillon': { label: 'Brouillon', color: 'badge-ghost' },
      'en_cours': { label: 'En cours', color: 'badge-warning' },
      'valide': { label: 'Validee', color: 'badge-info' },
      'realise': { label: 'Realise', color: 'badge-success' },
      'annule': { label: 'Annule', color: 'badge-error' },
      'ecart': { label: 'Ecart', color: 'badge-error' }
    };
    const info = map[status] || { label: status, color: 'badge-ghost' };
    return <span className={`badge ${info.color}`}>{info.label}</span>;
  };

  const getPeriodeLabel = (periode) => {
    const map = {
      'journalier': 'Journalier',
      'hebdomadaire': 'Hebdomadaire',
      'mensuel': 'Mensuel',
      'trimestriel': 'Trimestriel',
      'annuel': 'Annuel'
    };
    return map[periode] || periode;
  };

  if (loading && safePrevisions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement des previsions...</p>
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

      {/* Modal Suppression */}
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
              <p className="text-gray-600">Voulez-vous vraiment supprimer cette prevision ?</p>
              <p className="font-semibold mt-2">{itemToDelete.reference} - {itemToDelete.titre}</p>
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

      {/* En-tete */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <BarChart3 className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Previsions de tresorerie</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Planification financiere - {stats.total} prevision(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchPrevisions} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={() => navigate('/previsions/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2">
              <Plus className="w-4 h-4" /> Nouvelle prevision
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-primary">{stats.total}</p></div>
            <BarChart3 className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Entrees</p><p className="text-xl font-bold text-success">{stats.entrees}</p></div>
            <TrendingUp className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Sorties</p><p className="text-xl font-bold text-error">{stats.sorties}</p></div>
            <TrendingDown className="w-8 h-8 text-error/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Validees</p><p className="text-xl font-bold text-info">{stats.validees}</p></div>
            <CheckCircle className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Realisees</p><p className="text-xl font-bold text-success">{stats.realisees}</p></div>
            <Clock className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Ecarts</p><p className="text-xl font-bold text-warning">{stats.ecart}</p></div>
            <AlertCircle className="w-8 h-8 text-warning/20" />
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
              placeholder="Rechercher par reference, titre..."
              className="input input-bordered w-full pl-9"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline btn-sm sm:hidden gap-2">
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer' : 'Filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-6 gap-3`}>
            <select
              className="select select-bordered w-full"
              value={filterWarehouse}
              onChange={(e) => { setFilterWarehouse(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Tous les entrepots</option>
              {warehouses.map(wh => (
                <option key={wh.id} value={wh.id}>{wh.name}</option>
              ))}
            </select>
            <select
              className="select select-bordered w-full"
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Tous les types</option>
              <option value="entree">Entree</option>
              <option value="sortie">Sortie</option>
            </select>
            <select
              className="select select-bordered w-full"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="en_cours">En cours</option>
              <option value="valide">Validee</option>
              <option value="realise">Realise</option>
              <option value="annule">Annule</option>
              <option value="ecart">Ecart</option>
            </select>
            <select
              className="select select-bordered w-full"
              value={filterPeriode}
              onChange={(e) => { setFilterPeriode(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Toutes les periodes</option>
              <option value="journalier">Journalier</option>
              <option value="hebdomadaire">Hebdomadaire</option>
              <option value="mensuel">Mensuel</option>
              <option value="trimestriel">Trimestriel</option>
              <option value="annuel">Annuel</option>
            </select>
            <input
              type="date"
              className="input input-bordered w-full"
              value={filterDateDebut}
              onChange={(e) => { setFilterDateDebut(e.target.value); setCurrentPage(1); }}
              placeholder="Date debut"
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
              setFilterType('all');
              setFilterStatus('all');
              setFilterPeriode('all');
              setFilterDateDebut('');
              setFilterDateFin('');
              setSearchTerm('');
              setCurrentPage(1);
            }}
          >
            <RefreshCw className="w-4 h-4" /> Reinitialiser
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3">Reference</th>
                <th className="py-3">Titre</th>
                <th className="py-3 hidden md:table-cell">Type</th>
                <th className="py-3 text-right">Montant prevu</th>
                <th className="py-3 text-right">Montant reel</th>
                <th className="py-3 text-right">Ecart</th>
                <th className="py-3 hidden lg:table-cell">Periode</th>
                <th className="py-3 text-center">Statut</th>
                <th className="py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <BarChart3 className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucune prevision trouvee</p>
                      <button onClick={() => navigate('/previsions/nouveau')} className="btn btn-primary btn-sm gap-2">
                        <Plus className="w-4 h-4" /> Ajouter
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const ecart = parseFloat(item.ecart || 0);
                  const isEcart = ecart !== 0;
                  const isPositive = ecart > 0;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">{item.reference}</span>
                        </div>
                      </td>
                      <td className="max-w-xs truncate">{item.titre}</td>
                      <td className="hidden md:table-cell">{getTypeBadge(item.type_prevision)}</td>
                      <td className="text-right">{formatCurrency(item.montant_prevu)}</td>
                      <td className="text-right">{formatCurrency(item.montant_reel)}</td>
                      <td className={`text-right font-bold ${isEcart ? (isPositive ? 'text-success' : 'text-error') : 'text-gray-400'}`}>
                        {formatCurrency(item.ecart)}
                        {isEcart && <span className="ml-1 text-xs">{isPositive ? 'HAUT' : 'BAS'}</span>}
                      </td>
                      <td className="hidden lg:table-cell">{getPeriodeLabel(item.periode)}</td>
                      <td className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          {getStatusBadge(item.statut)}
                          {item.probabilite && (
                            <span className="badge badge-ghost badge-xs">{item.probabilite}%</span>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => navigate(`/previsions/${item.id}`)} className="btn btn-ghost btn-sm btn-circle">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => navigate(`/previsions/modifier/${item.id}`)} className="btn btn-ghost btn-sm btn-circle">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setItemToDelete(item); setShowDeleteModal(true); }}
                            className="btn btn-ghost btn-sm btn-circle text-error"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredItems.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} a {Math.min(currentPage * itemsPerPage, filteredItems.length)} sur {filteredItems.length}
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

export default PrevisionsList;