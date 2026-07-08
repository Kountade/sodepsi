// src/components/finances/RapportFinancierListe.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, LineChart,
  RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight,
  Loader2, Calendar, FileText, Download,
  BarChart3, TrendingUp, DollarSign, Clock,
  Printer, FileSpreadsheet
} from 'lucide-react';

const RapportFinancierListe = () => {
  const navigate = useNavigate();
  const [rapports, setRapports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rapportToDelete, setRapportToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [generating, setGenerating] = useState(null);
  const [downloading, setDownloading] = useState(null);

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchRapports = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('Session expirée');
        setLoading(false);
        return;
      }

      let url = '/rapports/';
      const params = new URLSearchParams();
      
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
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
      setRapports(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 401) {
        setError('Session expirée');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Erreur de chargement des rapports');
      }
      showNotification('Erreur de chargement des rapports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRapports();
  }, [typeFilter, dateFrom, dateTo]);

  const handleDelete = async () => {
    if (!rapportToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/rapports/${rapportToDelete.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Rapport supprimé avec succès', 'success');
      fetchRapports();
      setShowDeleteModal(false);
      setRapportToDelete(null);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const handleGenerer = async (id) => {
    setGenerating(id);
    try {
      const token = getToken();
      await AxiosInstance.post(`/rapports/${id}/generer/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Rapport en cours de génération', 'success');
      setTimeout(() => {
        fetchRapports();
      }, 3000);
    } catch (error) {
      showNotification('Erreur lors de la génération du rapport', 'error');
    } finally {
      setGenerating(null);
    }
  };

  // ✅ Téléchargement via la route PDF (frontend)
  const handleDownloadPdf = (id) => {
    setDownloading(id);
    try {
      // Rediriger vers la page de génération PDF qui télécharge automatiquement
      navigate(`/rapports-financiers/${id}/pdf`);
      showNotification('Téléchargement du PDF en cours...', 'success');
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors du téléchargement', 'error');
    } finally {
      setTimeout(() => setDownloading(null), 1000);
    }
  };

  const filteredRapports = rapports.filter(rapport => {
    const matchesSearch = !searchTerm || 
      (rapport.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredRapports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRapports = filteredRapports.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: rapports.length,
    bilan: rapports.filter(r => r.type === 'bilan').length,
    compte_resultat: rapports.filter(r => r.type === 'compte_resultat').length,
    tresorerie: rapports.filter(r => r.type === 'tresorerie').length,
    budget: rapports.filter(r => r.type === 'budget').length,
    ventes: rapports.filter(r => r.type === 'ventes').length,
    depenses: rapports.filter(r => r.type === 'depenses').length
  };

  const getTypeBadge = (type) => {
    const configs = {
      bilan: { label: 'Bilan comptable', className: 'badge-primary' },
      compte_resultat: { label: 'Compte de résultat', className: 'badge-success' },
      tresorerie: { label: 'Tableau de trésorerie', className: 'badge-info' },
      budget: { label: 'Suivi budgétaire', className: 'badge-warning' },
      ventes: { label: 'Rapport de ventes', className: 'badge-secondary' },
      depenses: { label: 'Rapport de dépenses', className: 'badge-error' },
      achats: { label: "Rapport d'achats", className: 'badge-ghost' },
      client: { label: 'Rapport client', className: 'badge-info' },
      fournisseur: { label: 'Rapport fournisseur', className: 'badge-warning' }
    };
    const config = configs[type] || { label: type, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  const getFormatBadge = (format) => {
    const configs = {
      pdf: { label: 'PDF', className: 'badge-error' },
      excel: { label: 'Excel', className: 'badge-success' },
      csv: { label: 'CSV', className: 'badge-info' }
    };
    const config = configs[format] || { label: format, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement des rapports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Erreur</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={fetchRapports} className="btn btn-primary">
            Réessayer
          </button>
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
      {showDeleteModal && rapportToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer ce rapport ?</p>
              <p className="font-semibold text-error mt-2">{rapportToDelete.nom}</p>
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
                <LineChart className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Rapports Financiers</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              {stats.total} rapport(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchRapports} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={() => navigate('/rapports-financiers/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2">
              <Plus className="w-4 h-4" /> Nouveau rapport
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-primary">{stats.total}</p></div>
            <LineChart className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Bilan</p><p className="text-xl font-bold text-primary">{stats.bilan}</p></div>
            <BarChart3 className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Résultat</p><p className="text-xl font-bold text-success">{stats.compte_resultat}</p></div>
            <TrendingUp className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Trésorerie</p><p className="text-xl font-bold text-info">{stats.tresorerie}</p></div>
            <DollarSign className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Budget</p><p className="text-xl font-bold text-warning">{stats.budget}</p></div>
            <LineChart className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Ventes</p><p className="text-xl font-bold text-secondary">{stats.ventes}</p></div>
            <TrendingUp className="w-8 h-8 text-secondary/20" />
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
              placeholder="Rechercher un rapport..." 
              className="input input-bordered w-full pl-9" 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline btn-sm sm:hidden gap-2">
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer' : 'Filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-3 gap-3`}>
            <select className="select select-bordered w-full" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les types</option>
              <option value="bilan">Bilan comptable</option>
              <option value="compte_resultat">Compte de résultat</option>
              <option value="tresorerie">Tableau de trésorerie</option>
              <option value="budget">Suivi budgétaire</option>
              <option value="ventes">Rapport de ventes</option>
              <option value="depenses">Rapport de dépenses</option>
              <option value="achats">Rapport d'achats</option>
              <option value="client">Rapport client</option>
              <option value="fournisseur">Rapport fournisseur</option>
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
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRapports.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <LineChart className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucun rapport trouvé</p>
                      <button onClick={() => navigate('/rapports-financiers/nouveau')} className="btn btn-primary btn-sm gap-2">
                        <Plus className="w-4 h-4" /> Créer un rapport
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRapports.map(rapport => (
                  <tr key={rapport.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium">{rapport.nom}</td>
                    <td className="py-3 px-4 hidden lg:table-cell">{getTypeBadge(rapport.type)}</td>
                    <td className="py-3 px-4 hidden lg:table-cell text-sm">
                      {formatDate(rapport.date_debut)} → {formatDate(rapport.date_fin)}
                    </td>
                    <td className="py-3 px-4">{getFormatBadge(rapport.format)}</td>
                    <td className="py-3 px-4 text-center">
                      {rapport.fichier ? (
                        <span className="badge badge-success gap-1">
                          <CheckCircle className="w-3 h-3" /> Généré
                        </span>
                      ) : (
                        <span className="badge badge-ghost gap-1">
                          <Clock className="w-3 h-3" /> En attente
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-1 flex-wrap">
                        {!rapport.fichier && (
                          <button 
                            onClick={() => handleGenerer(rapport.id)} 
                            className={`btn btn-sm btn-circle tooltip ${generating === rapport.id ? 'btn-primary loading' : 'btn-ghost text-info'}`}
                            data-tip="Générer"
                            disabled={generating === rapport.id}
                          >
                            {generating === rapport.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {/* ✅ Télécharger PDF via RapportPdf */}
                        <button 
                          onClick={() => handleDownloadPdf(rapport.id)} 
                          className={`btn btn-sm btn-circle tooltip ${downloading === rapport.id ? 'btn-primary loading' : 'btn-ghost text-primary'}`}
                          data-tip="Télécharger PDF"
                          disabled={downloading === rapport.id}
                        >
                          {downloading === rapport.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                        <button 
                          onClick={() => navigate(`/rapports-financiers/${rapport.id}`)} 
                          className="btn btn-ghost btn-sm btn-circle tooltip"
                          data-tip="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => navigate(`/rapports-financiers/${rapport.id}/modifier`)} 
                          className="btn btn-ghost btn-sm btn-circle tooltip text-warning"
                          data-tip="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setRapportToDelete(rapport); setShowDeleteModal(true); }} 
                          className="btn btn-ghost btn-sm btn-circle tooltip text-error"
                          data-tip="Supprimer"
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
        {filteredRapports.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(currentPage * itemsPerPage, filteredRapports.length)} sur {filteredRapports.length}
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

export default RapportFinancierListe;