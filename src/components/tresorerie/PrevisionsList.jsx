// src/components/tresorerie/PrevisionsList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Search, Edit, Eye, Trash2, RefreshCw,
  Filter, X, AlertCircle, CheckCircle,
  Calendar, DollarSign, Building2,
  ChevronLeft, ChevronRight, Check, Archive,
  TrendingUp, TrendingDown, Clock, BarChart3,
  Target, Percent
} from 'lucide-react';

const PrevisionsList = () => {
  const navigate = useNavigate();
  const [previsions, setPrevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPeriode, setFilterPeriode] = useState('all');
  const [filterStatut, setFilterStatut] = useState('all');
  const [filterWarehouse, setFilterWarehouse] = useState('all');
  const [warehouses, setWarehouses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [prevToDelete, setPrevToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchPrevisions = async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/previsions/';
      const params = new URLSearchParams();

      if (filterType !== 'all') params.append('type_prevision', filterType);
      if (filterPeriode !== 'all') params.append('periode', filterPeriode);
      if (filterStatut !== 'all') params.append('statut', filterStatut);
      if (filterWarehouse !== 'all') params.append('warehouse', filterWarehouse);
      if (searchTerm) params.append('search', searchTerm);

      if (params.toString()) url += `?${params.toString()}`;

      const response = await AxiosInstance.get(url, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setPrevisions(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement des prévisions', 'error');
    } finally {
      setLoading(false);
    }
  };

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
    fetchPrevisions();
    fetchWarehouses();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchPrevisions();
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm, filterType, filterPeriode, filterStatut, filterWarehouse]);

  const handleDelete = async () => {
    if (!prevToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/previsions/${prevToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Prévision supprimée avec succès', 'success');
      fetchPrevisions();
      setShowDeleteModal(false);
      setPrevToDelete(null);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const filteredPrevisions = previsions.filter(p => {
    const matchesSearch = !searchTerm ||
      (p.reference?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (p.titre?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || p.type_prevision === filterType;
    const matchesPeriode = filterPeriode === 'all' || p.periode === filterPeriode;
    const matchesStatut = filterStatut === 'all' || p.statut === filterStatut;
    const matchesWarehouse = filterWarehouse === 'all' || p.warehouse === parseInt(filterWarehouse);

    return matchesSearch && matchesType && matchesPeriode && matchesStatut && matchesWarehouse;
  });

  const totalPages = Math.ceil(filteredPrevisions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPrevisions = filteredPrevisions.slice(startIndex, startIndex + itemsPerPage);

  // Statistiques
  const stats = {
    total: previsions.length,
    entrees: previsions.filter(p => p.type_prevision === 'entree').length,
    sorties: previsions.filter(p => p.type_prevision === 'sortie').length,
    validees: previsions.filter(p => p.statut === 'valide').length,
    realisees: previsions.filter(p => p.statut === 'realise').length,
    total_prevu: previsions.reduce((acc, p) => acc + parseFloat(p.montant_prevu || 0), 0),
    total_reel: previsions.reduce((acc, p) => acc + parseFloat(p.montant_reel || 0), 0),
    ecart_total: previsions.reduce((acc, p) => acc + parseFloat(p.ecart || 0), 0)
  };

  // Utilitaires d'affichage
  const getTypeLabel = (type) => type === 'entree' ? 'Entrée' : 'Sortie';
  const getTypeBadge = (type) => {
    const map = {
      'entree': 'badge-success',
      'sortie': 'badge-error'
    };
    return <span className={`badge ${map[type] || 'badge-ghost'}`}>{getTypeLabel(type)}</span>;
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

  const getStatutBadge = (statut) => {
    const map = {
      'brouillon': { label: 'Brouillon', color: 'badge-ghost' },
      'en_cours': { label: 'En cours', color: 'badge-warning' },
      'valide': { label: 'Validée', color: 'badge-info' },
      'realise': { label: 'Réalisé', color: 'badge-success' },
      'annule': { label: 'Annulé', color: 'badge-error' },
      'ecart': { label: 'Écart', color: 'badge-error' }
    };
    const info = map[statut] || { label: statut, color: 'badge-ghost' };
    return <span className={`badge ${info.color}`}>{info.label}</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading && previsions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement des prévisions...</p>
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
      {showDeleteModal && prevToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer cette prévision ?</p>
              <p className="font-semibold text-error mt-2">{prevToDelete.titre}</p>
              <p className="text-sm text-gray-500 mt-1">{prevToDelete.reference}</p>
              {parseFloat(prevToDelete.montant_prevu || 0) > 0 && (
                <p className="text-warning text-sm mt-2">⚠️ Montant prévu: {parseFloat(prevToDelete.montant_prevu || 0).toLocaleString()} FCFA</p>
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
                <Target className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Prévisions de trésorerie</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Planification financière – {stats.total} prévision(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchPrevisions} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={() => navigate('/previsions/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2">
              <Plus className="w-4 h-4" /> Nouvelle prévision
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-primary">{stats.total}</p></div>
            <Target className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Entrées</p><p className="text-xl font-bold text-success">{stats.entrees}</p></div>
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
            <div><p className="text-xs text-gray-500">Validées</p><p className="text-xl font-bold text-info">{stats.validees}</p></div>
            <CheckCircle className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3 sm:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Montant prévu / réalisé</p>
              <p className="text-xl font-bold text-primary">
                {stats.total_prevu.toLocaleString()} / {stats.total_reel.toLocaleString()} FCFA
              </p>
            </div>
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
              placeholder="Rechercher par référence, titre..."
              className="input input-bordered w-full pl-9"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline btn-sm sm:hidden gap-2">
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer' : 'Filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-4 gap-3`}>
            <select
              className="select select-bordered w-full"
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Tous types</option>
              <option value="entree">Entrée prévue</option>
              <option value="sortie">Sortie prévue</option>
            </select>
            <select
              className="select select-bordered w-full"
              value={filterPeriode}
              onChange={(e) => { setFilterPeriode(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Toutes périodes</option>
              <option value="journalier">Journalier</option>
              <option value="hebdomadaire">Hebdomadaire</option>
              <option value="mensuel">Mensuel</option>
              <option value="trimestriel">Trimestriel</option>
              <option value="annuel">Annuel</option>
            </select>
            <select
              className="select select-bordered w-full"
              value={filterStatut}
              onChange={(e) => { setFilterStatut(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Tous statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="en_cours">En cours</option>
              <option value="valide">Validée</option>
              <option value="realise">Réalisé</option>
              <option value="annule">Annulé</option>
              <option value="ecart">Écart</option>
            </select>
            <select
              className="select select-bordered w-full"
              value={filterWarehouse}
              onChange={(e) => { setFilterWarehouse(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Tous entrepôts</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <button
              className="btn btn-outline gap-2"
              onClick={() => {
                setFilterType('all');
                setFilterPeriode('all');
                setFilterStatut('all');
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

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3">Réf.</th>
                <th className="py-3">Titre</th>
                <th className="py-3 hidden sm:table-cell">Type</th>
                <th className="py-3 hidden lg:table-cell">Période</th>
                <th className="py-3">Montant prévu</th>
                <th className="py-3 hidden md:table-cell">Réalisé</th>
                <th className="py-3 hidden lg:table-cell">Écart</th>
                <th className="py-3 hidden xl:table-cell">Dates</th>
                <th className="py-3 text-center">Statut</th>
                <th className="py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPrevisions.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Target className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucune prévision trouvée</p>
                      <button onClick={() => navigate('/previsions/nouveau')} className="btn btn-primary btn-sm gap-2">
                        <Plus className="w-4 h-4" /> Ajouter une prévision
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPrevisions.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <BarChart3 className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-mono text-sm font-medium">{p.reference}</span>
                      </div>
                    </td>
                    <td className="font-medium">{p.titre}</td>
                    <td className="hidden sm:table-cell">{getTypeBadge(p.type_prevision)}</td>
                    <td className="hidden lg:table-cell">{getPeriodeLabel(p.periode)}</td>
                    <td className="font-bold text-primary">
                      {Number(p.montant_prevu).toLocaleString()} FCFA
                    </td>
                    <td className="hidden md:table-cell">
                      {Number(p.montant_reel).toLocaleString()} FCFA
                    </td>
                    <td className="hidden lg:table-cell">
                      <span className={p.ecart >= 0 ? 'text-success' : 'text-error'}>
                        {Number(p.ecart).toLocaleString()} FCFA
                        {p.pourcentage_ecart && (
                          <span className="text-xs ml-1">
                            ({p.pourcentage_ecart.toFixed(1)}%)
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="hidden xl:table-cell">
                      <div className="text-xs">
                        <div>{formatDate(p.date_debut)} → {formatDate(p.date_fin)}</div>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        {getStatutBadge(p.statut)}
                        {p.probabilite && p.probabilite < 50 && (
                          <span className="badge badge-warning badge-xs">⚠️ {p.probabilite}%</span>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => navigate(`/previsions/${p.id}`)} className="btn btn-ghost btn-sm btn-circle">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => navigate(`/previsions/modifier/${p.id}`)} className="btn btn-ghost btn-sm btn-circle">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setPrevToDelete(p); setShowDeleteModal(true); }}
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
        {filteredPrevisions.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(currentPage * itemsPerPage, filteredPrevisions.length)} sur {filteredPrevisions.length}
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