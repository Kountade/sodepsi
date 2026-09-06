// src/components/finances/RapportsList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  Plus, Search, Eye, Loader2, FileText,
  RefreshCw, Filter, X, AlertCircle, CheckCircle,
  Calendar, ChevronLeft, ChevronRight, Download,
  FilePieChart, FileSpreadsheet
} from 'lucide-react';

const RapportsList = () => {
  const navigate = useNavigate();
  const [rapports, setRapports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchRapports = async () => {
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

      const response = await axiosInstance.get(`/rapports-financiers/?${params.toString()}`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      setRapports(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRapports();
  }, []);

  const handleDownload = async (id) => {
    try {
      const token = getToken();
      const response = await axiosInstance.get(`/rapports-financiers/${id}/download/`, {
        headers: { 'Authorization': `Token ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rapport-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showNotification('Rapport téléchargé avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors du téléchargement', 'error');
    }
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
      bilan: { label: 'Bilan', className: 'badge-primary' },
      compte_resultat: { label: 'Compte de résultat', className: 'badge-success' },
      tresorerie: { label: 'Trésorerie', className: 'badge-info' },
      budget: { label: 'Suivi budgétaire', className: 'badge-warning' },
      ventes: { label: 'Ventes', className: 'badge-secondary' },
      depenses: { label: 'Dépenses', className: 'badge-error' },
      achats: { label: 'Achats', className: 'badge-ghost' },
      client: { label: 'Client', className: 'badge-info' },
      fournisseur: { label: 'Fournisseur', className: 'badge-warning' }
    };
    const config = configs[type] || { label: type, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  const getFormatIcon = (format) => {
    if (format === 'pdf') return <FileText className="w-4 h-4" />;
    if (format === 'excel') return <FileSpreadsheet className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-14 h-14 mx-auto" />
          <p className="text-lg font-medium text-gray-500">Chargement des rapports...</p>
        </div>
      </div>
    );
  }

  const paginatedRapports = rapports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(rapports.length / itemsPerPage);

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification(null)}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-gray-200 shadow-sm w-full">
        <div className="w-full px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-xl">
                <FilePieChart className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Rapports financiers</h1>
                <p className="text-sm text-gray-500">Gestion des rapports et états financiers</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={fetchRapports} className="btn btn-sm btn-outline gap-2" disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
              </button>
              <button onClick={() => navigate('/finances/rapports/nouveau')} className="btn btn-sm btn-primary gap-2">
                <Plus className="w-4 h-4" /> Générer un rapport
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-6 py-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un rapport..."
                className="input input-bordered w-full pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline gap-2">
              <Filter className="w-4 h-4" /> {showFilters ? 'Masquer' : 'Filtres'}
            </button>
            <button onClick={fetchRapports} className="btn btn-primary gap-2">
              <Search className="w-4 h-4" /> Rechercher
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
              <div>
                <label className="label text-sm font-medium text-gray-700">Type</label>
                <select className="select select-bordered w-full" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="all">Tous</option>
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
              </div>
              <div>
                <label className="label text-sm font-medium text-gray-700">Date début</label>
                <input type="date" className="input input-bordered w-full" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div>
                <label className="label text-sm font-medium text-gray-700">Date fin</label>
                <input type="date" className="input input-bordered w-full" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-full px-6 pb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                {rapports.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <FilePieChart className="w-16 h-16 text-gray-300" />
                        <p className="text-gray-500 font-medium">Aucun rapport trouvé</p>
                        <button onClick={() => navigate('/finances/rapports/nouveau')} className="btn btn-primary btn-sm gap-2">
                          <Plus className="w-4 h-4" /> Générer un rapport
                        </button>
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
                            onClick={() => navigate(`/finances/rapports/${rapport.id}`)}
                            className="btn btn-ghost btn-sm btn-circle tooltip"
                            data-tip="Voir"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {rapport.fichier && (
                            <button 
                              onClick={() => handleDownload(rapport.id)}
                              className="btn btn-ghost btn-sm btn-circle tooltip text-primary"
                              data-tip="Télécharger"
                            >
                              <Download className="w-4 h-4" />
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

          {rapports.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500">
                Affichage {Math.min(currentPage * itemsPerPage, rapports.length)} sur {rapports.length}
              </p>
              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="join-item btn btn-sm btn-disabled">
                  Page {currentPage} / {totalPages}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default RapportsList;