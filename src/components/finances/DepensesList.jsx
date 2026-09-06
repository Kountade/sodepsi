// src/components/finances/DepensesList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  TrendingDown, Plus, Search, Eye, Loader2,
  RefreshCw, X, CheckCircle, AlertCircle,
  Filter, ChevronLeft, ChevronRight,
  Calendar, Check, Ban, Clock, FileText
} from 'lucide-react';

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const DepensesList = () => {
  // ==========================================================
  // HOOKS
  // ==========================================================
  const navigate = useNavigate();

  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [depenses, setDepenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categorieFilter, setCategorieFilter] = useState('all');
  const [statutFilter, setStatutFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  const [actionLoading, setActionLoading] = useState(false);

  // ==========================================================
  // FONCTIONS UTILITAIRES
  // ==========================================================
  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 FCFA';
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  const getCategorieBadge = (categorie) => {
    const configs = {
      fournitures: { label: 'Fournitures', className: 'badge-info' },
      utilities: { label: 'Services', className: 'badge-primary' },
      loyer: { label: 'Loyer', className: 'badge-warning' },
      salaires: { label: 'Salaires', className: 'badge-success' },
      marketing: { label: 'Marketing', className: 'badge-secondary' },
      transport: { label: 'Transport', className: 'badge-ghost' },
      maintenance: { label: 'Maintenance', className: 'badge-ghost' },
      formation: { label: 'Formation', className: 'badge-info' },
      informatique: { label: 'Informatique', className: 'badge-primary' },
      telecommunication: { label: 'Télécom', className: 'badge-secondary' },
      frais_bancaires: { label: 'Frais bancaires', className: 'badge-warning' },
      impots: { label: 'Impôts', className: 'badge-error' },
      assurance: { label: 'Assurance', className: 'badge-info' },
      frais_professionnels: { label: 'Frais pro', className: 'badge-ghost' },
      achat_stock: { label: 'Achat stock', className: 'badge-success' },
      autre: { label: 'Autre', className: 'badge-ghost' }
    };
    const config = configs[categorie] || { label: categorie, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  const getStatutBadge = (statut) => {
    const configs = {
      en_attente: { label: 'En attente', className: 'badge-warning' },
      approuve: { label: 'Approuvé', className: 'badge-info' },
      paye: { label: 'Payé', className: 'badge-success' },
      annule: { label: 'Annulé', className: 'badge-error' },
      rejete: { label: 'Rejeté', className: 'badge-error' }
    };
    const config = configs[statut] || { label: statut, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  // ==========================================================
  // REQUÊTES API
  // ==========================================================
  const fetchDepenses = useCallback(async () => {
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
      if (categorieFilter !== 'all') params.append('categorie', categorieFilter);
      if (statutFilter !== 'all') params.append('statut', statutFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await AxiosInstance.get(`/depenses/?${params.toString()}`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      setDepenses(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, categorieFilter, statutFilter, dateFrom, dateTo, navigate]);

  // ==========================================================
  // EFFETS
  // ==========================================================
  useEffect(() => {
    fetchDepenses();
  }, [fetchDepenses]);

  // ==========================================================
  // ACTIONS
  // ==========================================================
  const handleApprouver = async (id) => {
    if (!window.confirm('Approuver cette dépense ?')) return;
    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(`/depenses/${id}/approuver/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Dépense approuvée avec succès', 'success');
      fetchDepenses();
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors de l\'approbation', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayer = async (id) => {
    if (!window.confirm('Marquer cette dépense comme payée ?')) return;
    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(`/depenses/${id}/payer/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Dépense marquée comme payée', 'success');
      fetchDepenses();
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors du paiement', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejeter = async (id) => {
    if (!window.confirm('Rejeter cette dépense ?')) return;
    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(`/depenses/${id}/rejeter/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Dépense rejetée', 'success');
      fetchDepenses();
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors du rejet', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================================
  // FILTRES ET PAGINATION
  // ==========================================================
  const totalPages = Math.ceil(depenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDepenses = depenses.slice(startIndex, startIndex + itemsPerPage);

  // Statistiques
  const stats = {
    total: depenses.length,
    en_attente: depenses.filter(d => d.statut === 'en_attente').length,
    approuve: depenses.filter(d => d.statut === 'approuve').length,
    paye: depenses.filter(d => d.statut === 'paye').length
  };

  // ==========================================================
  // RENDU : CHARGEMENT
  // ==========================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-14 h-14 mx-auto" />
          <p className="text-lg font-medium text-gray-500">Chargement des dépenses...</p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDU : COMPOSANT PRINCIPAL
  // ==========================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">

      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-error/10 via-error/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-error/10 rounded-xl">
                <TrendingDown className="w-7 h-7 text-error" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-error">
                Dépenses
              </h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Gestion des dépenses –{' '}
              <span className="font-semibold text-gray-700">{stats.total}</span> dépense(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchDepenses} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button
              onClick={() => navigate('/depenses/nouveau')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-error to-error/80 text-white border-none shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" /> Nouvelle dépense
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
            <FileText className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">En attente</p>
              <p className="text-xl font-bold text-warning">{stats.en_attente}</p>
            </div>
            <Clock className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Approuvées</p>
              <p className="text-xl font-bold text-info">{stats.approuve}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Payées</p>
              <p className="text-xl font-bold text-success">{stats.paye}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success/20" />
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
              placeholder="Rechercher par référence ou description..."
              className="input input-bordered w-full pl-9"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              onKeyDown={(e) => e.key === 'Enter' && fetchDepenses()}
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline btn-sm sm:hidden gap-2">
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer' : 'Filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3`}>
            <select className="select select-bordered w-full" value={categorieFilter} onChange={(e) => {
              setCategorieFilter(e.target.value);
              setCurrentPage(1);
            }}>
              <option value="all">Toutes les catégories</option>
              <option value="fournitures">Fournitures</option>
              <option value="utilities">Services</option>
              <option value="loyer">Loyer</option>
              <option value="salaires">Salaires</option>
              <option value="marketing">Marketing</option>
              <option value="transport">Transport</option>
              <option value="maintenance">Maintenance</option>
              <option value="formation">Formation</option>
              <option value="informatique">Informatique</option>
              <option value="achat_stock">Achat stock</option>
            </select>
            <select className="select select-bordered w-full" value={statutFilter} onChange={(e) => {
              setStatutFilter(e.target.value);
              setCurrentPage(1);
            }}>
              <option value="all">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="approuve">Approuvé</option>
              <option value="paye">Payé</option>
              <option value="annule">Annulé</option>
              <option value="rejete">Rejeté</option>
            </select>
            <input type="date" className="input input-bordered w-full" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <input type="date" className="input input-bordered w-full" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4">Référence</th>
                <th className="py-3 px-4 hidden lg:table-cell">Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 hidden md:table-cell">Catégorie</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDepenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <TrendingDown className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucune dépense trouvée</p>
                      <p className="text-sm text-gray-400">Ajustez vos filtres ou créez une dépense</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDepenses.map((depense) => (
                  <tr key={depense.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold">{depense.reference}</td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatDate(depense.date_depense)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-medium text-sm">{depense.description}</span>
                        {depense.supplier_name && (
                          <p className="text-xs text-gray-400">{depense.supplier_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">{getCategorieBadge(depense.categorie)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-red-600">
                      {formatCurrency(depense.total)}
                    </td>
                    <td className="py-3 px-4 text-center">{getStatutBadge(depense.statut)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-1 flex-wrap">
                        <button
                          onClick={() => navigate(`/depenses/${depense.id}`)}
                          className="btn btn-ghost btn-sm btn-circle"
                          title="Voir"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {depense.statut === 'en_attente' && (
                          <>
                            <button
                              onClick={() => handleApprouver(depense.id)}
                              className="btn btn-ghost btn-sm btn-circle text-success"
                              title="Approuver"
                              disabled={actionLoading}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejeter(depense.id)}
                              className="btn btn-ghost btn-sm btn-circle text-error"
                              title="Rejeter"
                              disabled={actionLoading}
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {depense.statut === 'approuve' && (
                          <button
                            onClick={() => handlePayer(depense.id)}
                            className="btn btn-ghost btn-sm btn-circle text-primary"
                            title="Payer"
                            disabled={actionLoading}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {depenses.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Affichage de <span className="font-medium">{startIndex + 1}</span> à{' '}
              <span className="font-medium">{Math.min(currentPage * itemsPerPage, depenses.length)}</span> sur{' '}
              <span className="font-medium">{depenses.length}</span> dépenses
            </div>
            <div className="flex items-center gap-3">
              <select className="select select-bordered select-sm" value={itemsPerPage} onChange={(e) => {
                setItemsPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}>
                <option value="5">5 lignes</option>
                <option value="10">10 lignes</option>
                <option value="20">20 lignes</option>
                <option value="50">50 lignes</option>
              </select>
              <div className="join">
                <button className="join-item btn btn-sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="join-item btn btn-sm btn-disabled">{currentPage} / {totalPages}</span>
                <button className="join-item btn btn-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
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

export default DepensesList;