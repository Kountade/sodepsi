// src/components/tresorerie/RapprochementBancaireList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Search, Eye, Edit, Trash2, RefreshCw, Filter, X,
  AlertCircle, CheckCircle, Clock, Ban, Building2,
  Wallet, Calendar, ChevronLeft, ChevronRight,
  Check, FileText, TrendingUp, TrendingDown
} from 'lucide-react';

const RapprochementBancaireList = () => {
  const navigate = useNavigate();
  const [rapprochements, setRapprochements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('all');
  const [filterCompte, setFilterCompte] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateDebut, setFilterDateDebut] = useState('');
  const [filterDateFin, setFilterDateFin] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [comptes, setComptes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // Charger la liste
  const fetchRapprochements = async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/rapprochements/';
      const params = new URLSearchParams();

      if (filterWarehouse !== 'all') params.append('warehouse', filterWarehouse);
      if (filterCompte !== 'all') params.append('compte_bancaire', filterCompte);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterDateDebut) params.append('date_debut__gte', filterDateDebut);
      if (filterDateFin) params.append('date_fin__lte', filterDateFin);
      if (searchTerm) params.append('search', searchTerm);

      if (params.toString()) url += `?${params.toString()}`;

      const response = await AxiosInstance.get(url, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setRapprochements(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement des rapprochements', 'error');
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

  // Charger les comptes bancaires
  const fetchComptes = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/comptes-bancaires/?is_active=true', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setComptes(response.data || []);
    } catch (error) {
      console.error('Erreur chargement comptes:', error);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchComptes();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchRapprochements();
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm, filterWarehouse, filterCompte, filterStatus, filterDateDebut, filterDateFin]);

  // Suppression
  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/rapprochements/${itemToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Rapprochement supprimé avec succès', 'success');
      fetchRapprochements();
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  // Valider un rapprochement (action personnalisée)
  const handleValider = async (id) => {
    if (!window.confirm('Voulez-vous valider ce rapprochement ?')) return;
    try {
      const token = getToken();
      await AxiosInstance.post(`/rapprochements/${id}/valider_rapprochement/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Rapprochement validé avec succès', 'success');
      fetchRapprochements();
    } catch (error) {
      showNotification('Erreur lors de la validation', 'error');
    }
  };

  // Pagination
  const filteredItems = rapprochements;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  // Statistiques
  const stats = {
    total: rapprochements.length,
    complets: rapprochements.filter(r => r.status === 'complete').length,
    partiels: rapprochements.filter(r => r.status === 'partiel').length,
    ecart: rapprochements.filter(r => r.status === 'ecart').length,
    enCours: rapprochements.filter(r => r.status === 'en_cours' || r.status === 'brouillon').length,
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return Number(num).toLocaleString();
  };

  const getWarehouseName = (id) => {
    const wh = warehouses.find(w => w.id === id);
    return wh ? wh.name : id;
  };

  const getCompteName = (id) => {
    const cpt = comptes.find(c => c.id === id);
    return cpt ? `${cpt.banque} - ${cpt.nom}` : id;
  };

  const getStatusBadge = (status) => {
    const map = {
      'brouillon': { label: 'Brouillon', color: 'badge-ghost' },
      'en_cours': { label: 'En cours', color: 'badge-warning' },
      'partiel': { label: 'Partiel', color: 'badge-info' },
      'complete': { label: 'Complet', color: 'badge-success' },
      'ecart': { label: 'Écart', color: 'badge-error' },
    };
    const info = map[status] || { label: status, color: 'badge-ghost' };
    return <span className={`badge ${info.color}`}>{info.label}</span>;
  };

  const isRapproche = (item) => {
    return Math.abs(parseFloat(item.ecart || 0)) < 1;
  };

  if (loading && rapprochements.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement des rapprochements...</p>
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
              <p className="text-gray-600">Voulez-vous vraiment supprimer ce rapprochement ?</p>
              <p className="font-semibold mt-2">{itemToDelete.reference}</p>
              <p className="text-sm text-gray-500 mt-1">{itemToDelete.compte_bancaire}</p>
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

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Rapprochements bancaires</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Suivi des rapprochements – {stats.total} enregistrement(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchRapprochements} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={() => navigate('/rapprochement-bancaire/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2">
              <Plus className="w-4 h-4" /> Nouveau rapprochement
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-primary">{stats.total}</p></div>
            <FileText className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Complets</p><p className="text-xl font-bold text-success">{stats.complets}</p></div>
            <CheckCircle className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Partiels</p><p className="text-xl font-bold text-info">{stats.partiels}</p></div>
            <Clock className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Écarts</p><p className="text-xl font-bold text-error">{stats.ecart}</p></div>
            <AlertCircle className="w-8 h-8 text-error/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">En cours</p><p className="text-xl font-bold text-warning">{stats.enCours}</p></div>
            <RefreshCw className="w-8 h-8 text-warning/20" />
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
              placeholder="Rechercher par référence..."
              className="input input-bordered w-full pl-9"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline btn-sm sm:hidden gap-2">
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer' : 'Filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-5 gap-3`}>
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
            <select
              className="select select-bordered w-full"
              value={filterCompte}
              onChange={(e) => { setFilterCompte(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Tous les comptes</option>
              {comptes.map(c => (
                <option key={c.id} value={c.id}>{c.banque} - {c.nom}</option>
              ))}
            </select>
            <select
              className="select select-bordered w-full"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="en_cours">En cours</option>
              <option value="partiel">Partiel</option>
              <option value="complete">Complet</option>
              <option value="ecart">Écart</option>
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
              setFilterCompte('all');
              setFilterStatus('all');
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
                <th className="py-3">Référence</th>
                <th className="py-3">Compte</th>
                <th className="py-3 hidden md:table-cell">Période</th>
                <th className="py-3 text-right">Solde comptable</th>
                <th className="py-3 text-right">Solde bancaire</th>
                <th className="py-3 text-right">Écart</th>
                <th className="py-3 text-center">Statut</th>
                <th className="py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Building2 className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucun rapprochement trouvé</p>
                      <button onClick={() => navigate('/rapprochement-bancaire/nouveau')} className="btn btn-primary btn-sm gap-2">
                        <Plus className="w-4 h-4" /> Ajouter
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">{item.reference}</span>
                      </div>
                    </td>
                    <td>{getCompteName(item.compte_bancaire)}</td>
                    <td className="hidden md:table-cell">
                      {item.date_debut} → {item.date_fin}
                    </td>
                    <td className="text-right">{formatNumber(item.solde_comptable)}</td>
                    <td className="text-right">{formatNumber(item.solde_bancaire)}</td>
                    <td className={`text-right font-bold ${isRapproche(item) ? 'text-success' : 'text-error'}`}>
                      {formatNumber(item.ecart)}
                      {!isRapproche(item) && <span className="ml-1 text-xs">(⚠️)</span>}
                    </td>
                    <td className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        {getStatusBadge(item.status)}
                        {isRapproche(item) && item.status !== 'complete' && (
                          <span className="badge badge-success badge-xs">✅ OK</span>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => navigate(`/rapprochement-bancaire/${item.id}`)} className="btn btn-ghost btn-sm btn-circle">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => navigate(`/rapprochement-bancaire/modifier/${item.id}`)} className="btn btn-ghost btn-sm btn-circle">
                          <Edit className="w-4 h-4" />
                        </button>
                        {item.status !== 'complete' && (
                          <button
                            onClick={() => handleValider(item.id)}
                            className="btn btn-ghost btn-sm btn-circle text-success"
                            title="Valider"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => { setItemToDelete(item); setShowDeleteModal(true); }}
                          className="btn btn-ghost btn-sm btn-circle text-error"
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

export default RapprochementBancaireList;