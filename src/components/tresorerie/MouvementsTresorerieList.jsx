// src/components/tresorerie/MouvementsTresorerieList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Search, Edit, Eye, Trash2, RefreshCw,
  TrendingUp, TrendingDown, Repeat, Filter, X,
  AlertCircle, CheckCircle, Clock, Ban,
  DollarSign, Building2, Wallet, Calendar,
  ChevronLeft, ChevronRight, Check, Archive
} from 'lucide-react';

const MouvementsTresorerieList = () => {
  const navigate = useNavigate();
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMode, setFilterMode] = useState('all');
  const [filterWarehouse, setFilterWarehouse] = useState('all');
  const [warehouses, setWarehouses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mouvementToDelete, setMouvementToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  // Charger les mouvements
  const fetchMouvements = async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/mouvements/';
      const params = new URLSearchParams();

      if (filterType !== 'all') params.append('type_mouvement', filterType);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterMode !== 'all') params.append('mode_paiement', filterMode);
      if (filterWarehouse !== 'all') params.append('warehouse', filterWarehouse);
      if (searchTerm) params.append('search', searchTerm);

      if (params.toString()) url += `?${params.toString()}`;

      const response = await AxiosInstance.get(url, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setMouvements(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement des mouvements', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Charger les entrepôts pour le filtre
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
    fetchMouvements();
    fetchWarehouses();
  }, []);

  // Recharger quand les filtres changent
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchMouvements();
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm, filterType, filterStatus, filterMode, filterWarehouse]);

  // Suppression
  const handleDelete = async () => {
    if (!mouvementToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/mouvements/${mouvementToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Mouvement supprimé avec succès', 'success');
      fetchMouvements();
      setShowDeleteModal(false);
      setMouvementToDelete(null);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  // Annuler un mouvement (action personnalisée)
  const handleAnnuler = async (id) => {
    if (!window.confirm('Voulez-vous vraiment annuler ce mouvement ?')) return;
    try {
      const token = getToken();
      await AxiosInstance.post(`/mouvements/${id}/annuler/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Mouvement annulé avec succès', 'success');
      fetchMouvements();
    } catch (error) {
      showNotification('Erreur lors de l\'annulation', 'error');
    }
  };

  // Filtrer et paginer
  const filteredMouvements = mouvements.filter(mvt => {
    const matchesSearch = !searchTerm ||
      (mvt.reference?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (mvt.libelle?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || mvt.type_mouvement === filterType;
    const matchesStatus = filterStatus === 'all' || mvt.status === filterStatus;
    const matchesMode = filterMode === 'all' || mvt.mode_paiement === filterMode;
    const matchesWarehouse = filterWarehouse === 'all' || mvt.warehouse === parseInt(filterWarehouse);

    return matchesSearch && matchesType && matchesStatus && matchesMode && matchesWarehouse;
  });

  const totalPages = Math.ceil(filteredMouvements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMouvements = filteredMouvements.slice(startIndex, startIndex + itemsPerPage);

  // Statistiques
  const stats = {
    total: mouvements.length,
    encaissements: mouvements.filter(m => m.type_mouvement === 'encaissement').length,
    decaissements: mouvements.filter(m => m.type_mouvement === 'decaissement').length,
    transferts: mouvements.filter(m => m.type_mouvement === 'transfert').length,
    effectues: mouvements.filter(m => m.status === 'effectue').length,
    total_entrees: mouvements
      .filter(m => m.type_mouvement === 'encaissement')
      .reduce((acc, m) => acc + parseFloat(m.montant || 0), 0),
    total_sorties: mouvements
      .filter(m => m.type_mouvement === 'decaissement')
      .reduce((acc, m) => acc + parseFloat(m.montant || 0), 0),
  };

  // Utilitaires d'affichage
  const getTypeIcon = (type) => {
    switch (type) {
      case 'encaissement': return <TrendingUp className="w-4 h-4 text-success" />;
      case 'decaissement': return <TrendingDown className="w-4 h-4 text-error" />;
      case 'transfert': return <Repeat className="w-4 h-4 text-primary" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type) => {
    const map = {
      'encaissement': 'Encaissement',
      'decaissement': 'Décaissement',
      'transfert': 'Transfert'
    };
    return map[type] || type;
  };

  const getStatusBadge = (status) => {
    const map = {
      'planifie': { label: 'Planifié', color: 'badge-ghost' },
      'en_attente': { label: 'En attente', color: 'badge-warning' },
      'effectue': { label: 'Effectué', color: 'badge-success' },
      'annule': { label: 'Annulé', color: 'badge-error' },
      'rejete': { label: 'Rejeté', color: 'badge-error' }
    };
    const info = map[status] || { label: status, color: 'badge-ghost' };
    return <span className={`badge ${info.color}`}>{info.label}</span>;
  };

  const getModeLabel = (mode) => {
    const map = {
      'especes': 'Espèces',
      'carte': 'Carte bancaire',
      'cheque': 'Chèque',
      'virement': 'Virement',
      'mobile_money': 'Mobile Money',
      'prelevement': 'Prélèvement',
      'autre': 'Autre'
    };
    return map[mode] || mode;
  };

  if (loading && mouvements.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement des mouvements...</p>
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
      {showDeleteModal && mouvementToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer ce mouvement ?</p>
              <p className="font-semibold text-error mt-2">{mouvementToDelete.reference}</p>
              <p className="text-sm text-gray-500 mt-1">{mouvementToDelete.libelle}</p>
              {parseFloat(mouvementToDelete.montant || 0) > 0 && (
                <p className="text-warning text-sm mt-2">⚠️ Montant: {parseFloat(mouvementToDelete.montant || 0).toLocaleString()} FCFA</p>
              )}
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
                <DollarSign className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Mouvements de trésorerie</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Suivi des opérations – {stats.total} mouvement(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchMouvements} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={() => navigate('/mouvements-tresorerie/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2">
              <Plus className="w-4 h-4" /> Nouveau mouvement
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-primary">{stats.total}</p></div>
            <DollarSign className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Encaissements</p><p className="text-xl font-bold text-success">{stats.encaissements}</p></div>
            <TrendingUp className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Décaissements</p><p className="text-xl font-bold text-error">{stats.decaissements}</p></div>
            <TrendingDown className="w-8 h-8 text-error/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Transferts</p><p className="text-xl font-bold text-primary">{stats.transferts}</p></div>
            <Repeat className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3 sm:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total encaissements / décaissements</p>
              <p className="text-xl font-bold text-primary">
                +{stats.total_entrees.toLocaleString()} / -{stats.total_sorties.toLocaleString()} FCFA
              </p>
            </div>
            <Wallet className="w-8 h-8 text-primary/20" />
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
              placeholder="Rechercher par référence, libellé..."
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
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Tous les types</option>
              <option value="encaissement">Encaissement</option>
              <option value="decaissement">Décaissement</option>
              <option value="transfert">Transfert</option>
            </select>
            <select
              className="select select-bordered w-full"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Tous les statuts</option>
              <option value="planifie">Planifié</option>
              <option value="en_attente">En attente</option>
              <option value="effectue">Effectué</option>
              <option value="annule">Annulé</option>
              <option value="rejete">Rejeté</option>
            </select>
            <select
              className="select select-bordered w-full"
              value={filterMode}
              onChange={(e) => { setFilterMode(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Tous les modes</option>
              <option value="especes">Espèces</option>
              <option value="carte">Carte bancaire</option>
              <option value="cheque">Chèque</option>
              <option value="virement">Virement</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="prelevement">Prélèvement</option>
              <option value="autre">Autre</option>
            </select>
            <select
              className="select select-bordered w-full"
              value={filterWarehouse}
              onChange={(e) => { setFilterWarehouse(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Tous les entrepôts</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <button
              className="btn btn-outline gap-2"
              onClick={() => {
                setFilterType('all');
                setFilterStatus('all');
                setFilterMode('all');
                setFilterWarehouse('all');
                setSearchTerm('');
                setCurrentPage(1);
              }}
            >
              <RefreshCw className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Tableau des mouvements */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3">Référence</th>
                <th className="py-3">Type</th>
                <th className="py-3">Libellé</th>
                <th className="py-3">Montant</th>
                <th className="py-3 hidden sm:table-cell">Mode</th>
                <th className="py-3 hidden lg:table-cell">Caisse / Compte</th>
                <th className="py-3 hidden md:table-cell">Date</th>
                <th className="py-3 text-center">Statut</th>
                <th className="py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMouvements.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <DollarSign className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucun mouvement trouvé</p>
                      <button onClick={() => navigate('/mouvements-tresorerie/nouveau')} className="btn btn-primary btn-sm gap-2">
                        <Plus className="w-4 h-4" /> Ajouter un mouvement
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMouvements.map((mvt) => (
                  <tr key={mvt.id} className="hover:bg-gray-50">
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {getTypeIcon(mvt.type_mouvement)}
                        </div>
                        <span className="font-mono text-sm font-medium">{mvt.reference}</span>
                      </div>
                    </td>
                    <td>
                      <span className="flex items-center gap-1">
                        {getTypeIcon(mvt.type_mouvement)}
                        {getTypeLabel(mvt.type_mouvement)}
                      </span>
                    </td>
                    <td className="max-w-xs truncate">{mvt.libelle}</td>
                    <td className="font-bold">
                      <span className={mvt.type_mouvement === 'encaissement' ? 'text-success' : 'text-error'}>
                        {mvt.type_mouvement === 'encaissement' ? '+' : '-'}
                        {Number(mvt.montant).toLocaleString()} {mvt.devise || 'XOF'}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell">
                      <span className="badge badge-ghost">{getModeLabel(mvt.mode_paiement)}</span>
                    </td>
                    <td className="hidden lg:table-cell">
                      {mvt.caisse ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Wallet className="w-3 h-3" /> {mvt.caisse.nom || mvt.caisse}
                        </span>
                      ) : mvt.compte_bancaire ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Building2 className="w-3 h-3" /> {mvt.compte_bancaire.nom || mvt.compte_bancaire}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="hidden md:table-cell">
                      {mvt.date_mouvement ? new Date(mvt.date_mouvement).toLocaleDateString() : '-'}
                    </td>
                    <td className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        {getStatusBadge(mvt.status)}
                        {mvt.rapproche && (
                          <span className="badge badge-primary badge-xs">✅ rapproché</span>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => navigate(`/mouvements-tresorerie/${mvt.id}`)} className="btn btn-ghost btn-sm btn-circle">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => navigate(`/mouvements-tresorerie/modifier/${mvt.id}`)} className="btn btn-ghost btn-sm btn-circle">
                          <Edit className="w-4 h-4" />
                        </button>
                        {mvt.status === 'effectue' && (
                          <button
                            onClick={() => handleAnnuler(mvt.id)}
                            className="btn btn-ghost btn-sm btn-circle text-warning"
                            title="Annuler"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => { setMouvementToDelete(mvt); setShowDeleteModal(true); }}
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
        {filteredMouvements.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(currentPage * itemsPerPage, filteredMouvements.length)} sur {filteredMouvements.length}
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

export default MouvementsTresorerieList;