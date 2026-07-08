// src/components/finances/BudgetListe.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, PiggyBank,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight,
  Loader2, Calendar, TrendingUp, TrendingDown,
  Clock, BarChart3, DollarSign
} from 'lucide-react';

const BudgetListe = () => {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statutFilter, setStatutFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [actionLoading, setActionLoading] = useState(null);

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/budgets/';
      const params = new URLSearchParams();
      
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      if (statutFilter !== 'all') {
        params.append('statut', statutFilter);
      }
      if (dateFrom) {
        params.append('date_from', dateFrom);
      }
      if (dateTo) {
        params.append('date_to', dateTo);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await AxiosInstance.get(url, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setBudgets(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement des budgets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [typeFilter, statutFilter, dateFrom, dateTo]);

  const handleDelete = async () => {
    if (!budgetToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/budgets/${budgetToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Budget supprimé avec succès', 'success');
      fetchBudgets();
      setShowDeleteModal(false);
      setBudgetToDelete(null);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const handleUpdateUtilise = async (id) => {
    setActionLoading(id);
    try {
      const token = getToken();
      await AxiosInstance.post(`/budgets/${id}/update_utilise/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Budget mis à jour avec succès', 'success');
      fetchBudgets();
    } catch (error) {
      showNotification('Erreur lors de la mise à jour', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBudgets = budgets.filter(budget => {
    const matchesSearch = !searchTerm || 
      (budget.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredBudgets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBudgets = filteredBudgets.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: budgets.length,
    totalMontant: budgets.reduce((sum, b) => sum + (b.montant_total || 0), 0),
    en_cours: budgets.filter(b => b.statut === 'en_cours').length,
    termine: budgets.filter(b => b.statut === 'termine').length,
    annule: budgets.filter(b => b.statut === 'annule').length,
    annuel: budgets.filter(b => b.type === 'annuel').length,
    trimestriel: budgets.filter(b => b.type === 'trimestriel').length,
    mensuel: budgets.filter(b => b.type === 'mensuel').length
  };

  const getTypeBadge = (type) => {
    const configs = {
      annuel: { label: 'Annuel', className: 'badge-primary' },
      trimestriel: { label: 'Trimestriel', className: 'badge-info' },
      mensuel: { label: 'Mensuel', className: 'badge-success' },
      projet: { label: 'Projet', className: 'badge-secondary' }
    };
    const config = configs[type] || { label: type, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  const getStatutBadge = (statut) => {
    const configs = {
      en_cours: { label: 'En cours', className: 'badge-success' },
      termine: { label: 'Terminé', className: 'badge-info' },
      annule: { label: 'Annulé', className: 'badge-error' }
    };
    const config = configs[statut] || { label: statut, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 FCFA';
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  const getProgressColor = (pourcentage) => {
    if (pourcentage < 50) return 'bg-success';
    if (pourcentage < 75) return 'bg-warning';
    if (pourcentage < 90) return 'bg-info';
    return 'bg-error';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement des budgets...</p>
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
      {showDeleteModal && budgetToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer ce budget ?</p>
              <p className="font-semibold text-error mt-2">{budgetToDelete.nom}</p>
              <p className="text-sm text-gray-500">{formatCurrency(budgetToDelete.montant_total)}</p>
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
                <PiggyBank className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Budgets</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              {stats.total} budget(s) - {formatCurrency(stats.totalMontant)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchBudgets} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={() => navigate('/budgets/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2">
              <Plus className="w-4 h-4" /> Nouveau budget
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-primary">{stats.total}</p></div>
            <PiggyBank className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">En cours</p><p className="text-xl font-bold text-success">{stats.en_cours}</p></div>
            <Clock className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Terminés</p><p className="text-xl font-bold text-info">{stats.termine}</p></div>
            <CheckCircle className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Annulés</p><p className="text-xl font-bold text-error">{stats.annule}</p></div>
            <X className="w-8 h-8 text-error/20" />
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
              placeholder="Rechercher un budget..." 
              className="input input-bordered w-full pl-9" 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline btn-sm sm:hidden gap-2">
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer' : 'Filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-4 gap-3`}>
            <select className="select select-bordered w-full" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les types</option>
              <option value="annuel">Annuel</option>
              <option value="trimestriel">Trimestriel</option>
              <option value="mensuel">Mensuel</option>
              <option value="projet">Projet</option>
            </select>
            <select className="select select-bordered w-full" value={statutFilter} onChange={(e) => { setStatutFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les statuts</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
              <option value="annule">Annulé</option>
            </select>
            <input type="date" className="input input-bordered" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <input type="date" className="input input-bordered" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4">Nom</th>
                <th className="py-3 px-4 hidden lg:table-cell">Type</th>
                <th className="py-3 px-4 hidden lg:table-cell">Période</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4 text-center">Progression</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBudgets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <PiggyBank className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucun budget trouvé</p>
                      <button onClick={() => navigate('/budgets/nouveau')} className="btn btn-primary btn-sm gap-2">
                        <Plus className="w-4 h-4" /> Créer un budget
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedBudgets.map(budget => {
                  const pourcentage = budget.pourcentage_utilise || 0;
                  const progressColor = getProgressColor(pourcentage);
                  
                  return (
                    <tr key={budget.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium">{budget.nom}</td>
                      <td className="py-3 px-4 hidden lg:table-cell">{getTypeBadge(budget.type)}</td>
                      <td className="py-3 px-4 hidden lg:table-cell text-sm">
                        {formatDate(budget.date_debut)} → {formatDate(budget.date_fin)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-primary">{formatCurrency(budget.montant_total)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${progressColor}`}
                              style={{ width: `${Math.min(pourcentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium">{pourcentage}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">{getStatutBadge(budget.statut)}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1 flex-wrap">
                          <button 
                            onClick={() => navigate(`/budgets/${budget.id}`)} 
                            className="btn btn-ghost btn-sm btn-circle tooltip"
                            data-tip="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => navigate(`/budgets/${budget.id}/modifier`)} 
                            className="btn btn-ghost btn-sm btn-circle tooltip text-warning"
                            data-tip="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleUpdateUtilise(budget.id)} 
                            className={`btn btn-sm btn-circle tooltip ${actionLoading === budget.id ? 'btn-primary loading' : 'btn-ghost text-info'}`}
                            data-tip="Mettre à jour"
                            disabled={actionLoading === budget.id}
                          >
                            {actionLoading === budget.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </button>
                          {budget.statut !== 'termine' && (
                            <button 
                              onClick={() => { setBudgetToDelete(budget); setShowDeleteModal(true); }} 
                              className="btn btn-ghost btn-sm btn-circle tooltip text-error"
                              data-tip="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
        {filteredBudgets.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(currentPage * itemsPerPage, filteredBudgets.length)} sur {filteredBudgets.length}
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

export default BudgetListe;