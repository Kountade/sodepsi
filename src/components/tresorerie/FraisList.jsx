// src/components/tresorerie/FraisList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Search, Edit, Eye, Trash2, RefreshCw,
  Receipt, Filter, X, AlertCircle, CheckCircle,
  Calendar, DollarSign, Building2, User,
  CreditCard, FileText, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, AlertTriangle,
  Check, Archive
} from 'lucide-react';

const FraisList = () => {
  const navigate = useNavigate();
  const [frais, setFrais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterWarehouse, setFilterWarehouse] = useState('all');
  const [warehouses, setWarehouses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fraisToDelete, setFraisToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  // Charger les frais
  const fetchFrais = async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/frais/';
      const params = new URLSearchParams();

      if (filterCategorie !== 'all') params.append('categorie', filterCategorie);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterWarehouse !== 'all') params.append('warehouse', filterWarehouse);
      if (searchTerm) params.append('search', searchTerm);

      if (params.toString()) url += `?${params.toString()}`;

      const response = await AxiosInstance.get(url, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setFrais(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement des frais', 'error');
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
    fetchFrais();
    fetchWarehouses();
  }, []);

  // Recharger quand les filtres changent
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchFrais();
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm, filterCategorie, filterStatus, filterWarehouse]);

  // Suppression
  const handleDelete = async () => {
    if (!fraisToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/frais/${fraisToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Frais supprimé avec succès', 'success');
      fetchFrais();
      setShowDeleteModal(false);
      setFraisToDelete(null);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  // Filtrer et paginer
  const filteredFrais = frais.filter(item => {
    const matchesSearch = !searchTerm ||
      (item.reference?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.titre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.beneficiaire?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesCategorie = filterCategorie === 'all' || item.categorie === filterCategorie;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesWarehouse = filterWarehouse === 'all' || item.warehouse === parseInt(filterWarehouse);

    return matchesSearch && matchesCategorie && matchesStatus && matchesWarehouse;
  });

  const totalPages = Math.ceil(filteredFrais.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFrais = filteredFrais.slice(startIndex, startIndex + itemsPerPage);

  // Statistiques
  const stats = {
    total: frais.length,
    brouillon: frais.filter(f => f.status === 'brouillon').length,
    en_attente: frais.filter(f => f.status === 'en_attente').length,
    paye: frais.filter(f => f.status === 'paye').length,
    total_montant: frais.reduce((acc, f) => acc + parseFloat(f.montant || 0), 0),
    total_payes: frais.filter(f => f.status === 'paye').reduce((acc, f) => acc + parseFloat(f.montant || 0), 0)
  };

  // Utilitaires d'affichage
  const getCategorieLabel = (cat) => {
    const map = {
      'transport': 'Transport',
      'restauration': 'Restauration',
      'fournitures': 'Fournitures de bureau',
      'communication': 'Communication',
      'entretien': 'Entretien',
      'formation': 'Formation',
      'mission': 'Mission',
      'representations': 'Représentation',
      'assurances': 'Assurances',
      'impots': 'Impôts et taxes',
      'loyer': 'Loyer',
      'services': 'Services',
      'fournisseur': 'Paiement fournisseur',
      'autre': 'Autre'
    };
    return map[cat] || cat;
  };

  const getStatusBadge = (status) => {
    const map = {
      'brouillon': { label: 'Brouillon', color: 'badge-ghost' },
      'en_attente': { label: 'En attente', color: 'badge-warning' },
      'valide': { label: 'Validé', color: 'badge-info' },
      'paye': { label: 'Payé', color: 'badge-success' },
      'refuse': { label: 'Refusé', color: 'badge-error' },
      'annule': { label: 'Annulé', color: 'badge-error' }
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

  if (loading && frais.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement des frais...</p>
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
      {showDeleteModal && fraisToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer ce frais ?</p>
              <p className="font-semibold text-error mt-2">{fraisToDelete.titre}</p>
              <p className="text-sm text-gray-500 mt-1">{fraisToDelete.reference}</p>
              {parseFloat(fraisToDelete.montant || 0) > 0 && (
                <p className="text-warning text-sm mt-2">⚠️ Montant: {parseFloat(fraisToDelete.montant || 0).toLocaleString()} FCFA</p>
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
                <Receipt className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Frais et dépenses</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Gestion des frais – {stats.total} enregistrement(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchFrais} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={() => navigate('/frais/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2">
              <Plus className="w-4 h-4" /> Nouveau frais
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-primary">{stats.total}</p></div>
            <Receipt className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Payés</p><p className="text-xl font-bold text-success">{stats.paye}</p></div>
            <Check className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">En attente</p><p className="text-xl font-bold text-warning">{stats.en_attente}</p></div>
            <AlertTriangle className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Brouillons</p><p className="text-xl font-bold text-gray-500">{stats.brouillon}</p></div>
            <FileText className="w-8 h-8 text-gray-500/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3 sm:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Montant total</p>
              <p className="text-xl font-bold text-primary">{stats.total_montant.toLocaleString()} FCFA</p>
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
              placeholder="Rechercher par référence, titre, bénéficiaire..."
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
              value={filterCategorie}
              onChange={(e) => { setFilterCategorie(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Toutes catégories</option>
              <option value="transport">Transport</option>
              <option value="restauration">Restauration</option>
              <option value="fournitures">Fournitures</option>
              <option value="communication">Communication</option>
              <option value="entretien">Entretien</option>
              <option value="formation">Formation</option>
              <option value="mission">Mission</option>
              <option value="representations">Représentation</option>
              <option value="assurances">Assurances</option>
              <option value="impots">Impôts</option>
              <option value="loyer">Loyer</option>
              <option value="services">Services</option>
              <option value="fournisseur">Fournisseur</option>
              <option value="autre">Autre</option>
            </select>
            <select
              className="select select-bordered w-full"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Tous statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="en_attente">En attente</option>
              <option value="valide">Validé</option>
              <option value="paye">Payé</option>
              <option value="refuse">Refusé</option>
              <option value="annule">Annulé</option>
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
                setFilterCategorie('all');
                setFilterStatus('all');
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

      {/* Tableau des frais */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3">Référence</th>
                <th className="py-3">Titre</th>
                <th className="py-3 hidden lg:table-cell">Catégorie</th>
                <th className="py-3 hidden md:table-cell">Bénéficiaire</th>
                <th className="py-3">Montant</th>
                <th className="py-3 hidden sm:table-cell">Mode</th>
                <th className="py-3 hidden lg:table-cell">Date</th>
                <th className="py-3 text-center">Statut</th>
                <th className="py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFrais.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Receipt className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucun frais trouvé</p>
                      <button onClick={() => navigate('/frais/nouveau')} className="btn btn-primary btn-sm gap-2">
                        <Plus className="w-4 h-4" /> Ajouter un frais
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedFrais.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Receipt className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-mono text-sm font-medium">{item.reference}</span>
                      </div>
                    </td>
                    <td className="font-medium">{item.titre}</td>
                    <td className="hidden lg:table-cell">
                      <span className="badge badge-ghost">{getCategorieLabel(item.categorie)}</span>
                    </td>
                    <td className="hidden md:table-cell">{item.beneficiaire}</td>
                    <td className="font-bold text-error">
                      {Number(item.montant).toLocaleString()} FCFA
                    </td>
                    <td className="hidden sm:table-cell">
                      <span className="badge badge-ghost">{getModeLabel(item.mode_paiement)}</span>
                    </td>
                    <td className="hidden lg:table-cell">
                      {item.date_frais ? new Date(item.date_frais).toLocaleDateString() : '-'}
                    </td>
                    <td className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        {getStatusBadge(item.status)}
                        {item.status === 'paye' && item.mouvement && (
                          <span className="badge badge-primary badge-xs">✅ mouvement</span>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => navigate(`/frais/${item.id}`)} className="btn btn-ghost btn-sm btn-circle">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => navigate(`/frais/modifier/${item.id}`)} className="btn btn-ghost btn-sm btn-circle">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setFraisToDelete(item); setShowDeleteModal(true); }}
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
        {filteredFrais.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(currentPage * itemsPerPage, filteredFrais.length)} sur {filteredFrais.length}
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

export default FraisList;