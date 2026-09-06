// src/components/finances/RapportsFinanciersList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  FilePieChart, Plus, Search, Eye, Loader2,
  RefreshCw, X, CheckCircle, AlertCircle,
  Filter, ChevronLeft, ChevronRight,
  Calendar, Download, FileText, FileSpreadsheet,
  TrendingUp, TrendingDown, Wallet, Building2,
  PieChart, BarChart3, FileCheck, Clock
} from 'lucide-react';

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const RapportsFinanciersList = () => {
  // ==========================================================
  // HOOKS
  // ==========================================================
  const navigate = useNavigate();

  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [rapports, setRapports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
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
  const [downloading, setDownloading] = useState(null);

  // ==========================================================
  // FONCTIONS UTILITAIRES
  // ==========================================================
  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
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

  const getTypeBadge = (type) => {
    const configs = {
      bilan: { label: 'Bilan', className: 'badge-primary', icon: BarChart3 },
      compte_resultat: { label: 'Compte de résultat', className: 'badge-success', icon: TrendingUp },
      tresorerie: { label: 'Trésorerie', className: 'badge-info', icon: Wallet },
      budget: { label: 'Suivi budgétaire', className: 'badge-warning', icon: PieChart },
      ventes: { label: 'Ventes', className: 'badge-secondary', icon: TrendingUp },
      depenses: { label: 'Dépenses', className: 'badge-error', icon: TrendingDown },
      achats: { label: 'Achats', className: 'badge-ghost', icon: ShoppingBag },
      client: { label: 'Client', className: 'badge-info', icon: Building2 },
      fournisseur: { label: 'Fournisseur', className: 'badge-warning', icon: Building2 }
    };
    const config = configs[type] || { label: type, className: 'badge-ghost', icon: FileText };
    const Icon = config.icon;
    return (
      <span className={`badge ${config.className} gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getFormatIcon = (format) => {
    if (format === 'pdf') return <FileText className="w-4 h-4" />;
    if (format === 'excel') return <FileSpreadsheet className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  // ==========================================================
  // REQUÊTES API
  // ==========================================================
  const fetchRapports = useCallback(async () => {
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
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await AxiosInstance.get(`/rapports-financiers/?${params.toString()}`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      setRapports(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, typeFilter, dateFrom, dateTo, navigate]);

  // ==========================================================
  // EFFETS
  // ==========================================================
  useEffect(() => {
    fetchRapports();
  }, [fetchRapports]);

  // ==========================================================
  // ACTIONS
  // ==========================================================
  const handleDownload = async (id, format) => {
    setDownloading(id);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/rapports-financiers/${id}/download/`, {
        headers: { 'Authorization': `Token ${token}` },
        responseType: 'blob'
      });

      const extension = format === 'pdf' ? 'pdf' : 'xlsx';
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rapport-${id}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showNotification('Rapport téléchargé avec succès', 'success');
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors du téléchargement', 'error');
    } finally {
      setDownloading(null);
    }
  };

  // ==========================================================
  // FILTRES ET PAGINATION
  // ==========================================================
  const totalPages = Math.ceil(rapports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRapports = rapports.slice(startIndex, startIndex + itemsPerPage);

  // Statistiques
  const stats = {
    total: rapports.length,
    bilan: rapports.filter(r => r.type === 'bilan').length,
    compte_resultat: rapports.filter(r => r.type === 'compte_resultat').length,
    tresorerie: rapports.filter(r => r.type === 'tresorerie').length,
    budget: rapports.filter(r => r.type === 'budget').length
  };

  // ==========================================================
  // RENDU : CHARGEMENT
  // ==========================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 w-full">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-14 h-14 mx-auto" />
          <p className="text-lg font-medium text-gray-500">Chargement des rapports...</p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDU : COMPOSANT PRINCIPAL - FULL WIDTH
  // ==========================================================
  return (
    <div className="w-full min-h-screen bg-gray-50">

      {/* ======================================================
          NOTIFICATION
          ====================================================== */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
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

      {/* ======================================================
          EN-TÊTE
          ====================================================== */}
      <div className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-50 rounded-xl">
                <FilePieChart className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-purple-600">
                  Rapports financiers
                </h1>
                <p className="text-sm text-gray-500">
                  Gestion des rapports et états financiers –{' '}
                  <span className="font-semibold text-gray-700">{stats.total}</span> rapport(s)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={fetchRapports}
                className="btn btn-sm sm:btn-md btn-outline gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Actualiser
              </button>
              <button
                onClick={() => navigate('/rapports-financiers/nouveau')}
                className="btn btn-sm sm:btn-md bg-gradient-to-r from-purple-600 to-purple-700 text-white border-none shadow-lg gap-2"
              >
                <Plus className="w-4 h-4" /> Générer un rapport
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          STATISTIQUES
          ====================================================== */}
      <div className="w-full px-6 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white shadow-md rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-xl font-bold text-primary">{stats.total}</p>
              </div>
              <FilePieChart className="w-8 h-8 text-primary/20" />
            </div>
          </div>
          <div className="bg-white shadow-md rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Bilans</p>
                <p className="text-xl font-bold text-primary">{stats.bilan}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary/20" />
            </div>
          </div>
          <div className="bg-white shadow-md rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Comptes de résultat</p>
                <p className="text-xl font-bold text-success">{stats.compte_resultat}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success/20" />
            </div>
          </div>
          <div className="bg-white shadow-md rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Trésorerie / Budget</p>
                <p className="text-xl font-bold text-info">{stats.tresorerie + stats.budget}</p>
              </div>
              <Wallet className="w-8 h-8 text-info/20" />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          FILTRES
          ====================================================== */}
      <div className="w-full px-6 pb-4">
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex flex-col gap-3">

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un rapport..."
                className="input input-bordered w-full pl-9"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                onKeyDown={(e) => e.key === 'Enter' && fetchRapports()}
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-outline btn-sm sm:hidden gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Masquer' : 'Filtres'}
            </button>

            <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-3 gap-3`}>
              <select
                className="select select-bordered w-full"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">Tous les types</option>
                <option value="bilan">Bilan comptable</option>
                <option value="compte_resultat">Compte de résultat</option>
                <option value="tresorerie">Tableau de trésorerie</option>
                <option value="budget">Suivi budgétaire</option>
                <option value="ventes">Ventes</option>
                <option value="depenses">Dépenses</option>
                <option value="achats">Achats</option>
                <option value="client">Client</option>
                <option value="fournisseur">Fournisseur</option>
              </select>
              <input
                type="date"
                className="input input-bordered w-full"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="Date début"
              />
              <input
                type="date"
                className="input input-bordered w-full"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="Date fin"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          TABLEAU
          ====================================================== */}
      <div className="w-full px-6 pb-6">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4">Nom</th>
                  <th className="py-3 px-4 hidden md:table-cell">Type</th>
                  <th className="py-3 px-4 hidden lg:table-cell">Période</th>
                  <th className="py-3 px-4 text-center">Format</th>
                  <th className="py-3 px-4 hidden md:table-cell">Date</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRapports.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <FilePieChart className="w-16 h-16 text-gray-300" />
                        <p className="text-gray-500 font-medium">Aucun rapport trouvé</p>
                        <p className="text-sm text-gray-400">Ajustez vos filtres ou générez un rapport</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRapports.map((rapport) => (
                    <tr key={rapport.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-semibold">{rapport.nom}</td>
                      <td className="py-3 px-4 hidden md:table-cell">{getTypeBadge(rapport.type)}</td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {formatDate(rapport.date_debut)}
                          </div>
                          <div className="text-gray-400 text-xs">→ {formatDate(rapport.date_fin)}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="badge badge-ghost gap-1">
                          {getFormatIcon(rapport.format)}
                          {rapport.format?.toUpperCase() || 'PDF'}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell text-sm text-gray-500">
                        {formatDate(rapport.created_at)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => navigate(`/rapports-financiers/${rapport.id}`)}
                            className="btn btn-ghost btn-sm btn-circle"
                            title="Voir"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {rapport.fichier && (
                            <button
                              onClick={() => handleDownload(rapport.id, rapport.format || 'pdf')}
                              className="btn btn-ghost btn-sm btn-circle text-primary"
                              title="Télécharger"
                              disabled={downloading === rapport.id}
                            >
                              {downloading === rapport.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
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

          {/* ====================================================
              PAGINATION
              ==================================================== */}
          {rapports.length > 0 && (
            <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
              <div className="text-sm text-gray-500">
                Affichage de <span className="font-medium">{startIndex + 1}</span> à{' '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, rapports.length)}</span> sur{' '}
                <span className="font-medium">{rapports.length}</span> rapports
              </div>
              <div className="flex items-center gap-3">
                <select
                  className="select select-bordered select-sm"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
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
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="join-item btn btn-sm btn-disabled">
                    {currentPage} / {totalPages}
                  </span>
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
    </div>
  );
};

export default RapportsFinanciersList;