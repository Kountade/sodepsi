// src/components/finances/ComptesList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Building2, Plus, Search, Eye, Edit, Trash2, Loader2,
  RefreshCw, X, CheckCircle, AlertCircle,
  Filter, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, Boxes
} from 'lucide-react';

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const ComptesList = () => {
  // ==========================================================
  // HOOKS
  // ==========================================================
  const navigate = useNavigate();

  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [comptes, setComptes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [classeFilter, setClasseFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

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

  const getTypeBadge = (type) => {
    const configs = {
      actif: { label: 'Actif', className: 'badge-success' },
      passif: { label: 'Passif', className: 'badge-error' },
      capitaux: { label: 'Capitaux', className: 'badge-primary' },
      produits: { label: 'Produits', className: 'badge-info' },
      charges: { label: 'Charges', className: 'badge-warning' }
    };
    const config = configs[type] || { label: type, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  // ==========================================================
  // REQUÊTES API
  // ==========================================================
  const fetchComptes = useCallback(async () => {
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
      if (classeFilter !== 'all') params.append('classe', classeFilter);

      const response = await AxiosInstance.get(`/comptes-comptables/?${params.toString()}`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      setComptes(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, typeFilter, classeFilter, navigate]);

  // ==========================================================
  // EFFETS
  // ==========================================================
  useEffect(() => {
    fetchComptes();
  }, [fetchComptes]);

  // ==========================================================
  // ACTIONS
  // ==========================================================
  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce compte ?')) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/comptes-comptables/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Compte supprimé avec succès', 'success');
      fetchComptes();
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ==========================================================
  // FILTRES ET PAGINATION
  // ==========================================================
  const rootComptes = comptes.filter(c => !c.parent);
  const getChildren = (parentId) => comptes.filter(c => c.parent === parentId);

  const totalPages = Math.ceil(rootComptes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedComptes = rootComptes.slice(startIndex, startIndex + itemsPerPage);

  // Statistiques
  const stats = {
    total: comptes.length,
    actif: comptes.filter(c => c.type === 'actif').length,
    passif: comptes.filter(c => c.type === 'passif').length,
    produits: comptes.filter(c => c.type === 'produits').length,
    charges: comptes.filter(c => c.type === 'charges').length
  };

  // ==========================================================
  // RENDU : CHARGEMENT
  // ==========================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-14 h-14 mx-auto" />
          <p className="text-lg font-medium text-gray-500">Chargement des comptes...</p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDU : COMPOSANT PRINCIPAL
  // ==========================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">

      {/* ======================================================
          NOTIFICATION
          ====================================================== */}
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

      {/* ======================================================
          EN-TÊTE
          ====================================================== */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          {/* Titre */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Plan comptable
              </h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Gestion des comptes comptables –{' '}
              <span className="font-semibold text-gray-700">{stats.total}</span> compte(s)
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchComptes}
              className="btn btn-sm sm:btn-md btn-outline gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button
              onClick={() => navigate('/comptes-comptables/nouveau')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" /> Nouveau compte
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================
          STATISTIQUES
          ====================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold text-primary">{stats.total}</p>
            </div>
            <Building2 className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Actif</p>
              <p className="text-xl font-bold text-success">{stats.actif}</p>
            </div>
            <Boxes className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Passif</p>
              <p className="text-xl font-bold text-error">{stats.passif}</p>
            </div>
            <Boxes className="w-8 h-8 text-error/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Produits / Charges</p>
              <p className="text-xl font-bold text-info">{stats.produits} / {stats.charges}</p>
            </div>
            <Boxes className="w-8 h-8 text-info/20" />
          </div>
        </div>
      </div>

      {/* ======================================================
          FILTRES
          ====================================================== */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col gap-3">

          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro ou nom..."
              className="input input-bordered w-full pl-9"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              onKeyDown={(e) => e.key === 'Enter' && fetchComptes()}
            />
          </div>

          {/* Bouton filtres mobile */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline btn-sm sm:hidden gap-2"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Masquer' : 'Filtres'}
          </button>

          {/* Filtres */}
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-2 gap-3`}>
            <select
              className="select select-bordered w-full"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tous les types</option>
              <option value="actif">Actif</option>
              <option value="passif">Passif</option>
              <option value="capitaux">Capitaux propres</option>
              <option value="produits">Produits</option>
              <option value="charges">Charges</option>
            </select>
            <select
              className="select select-bordered w-full"
              value={classeFilter}
              onChange={(e) => {
                setClasseFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Toutes les classes</option>
              <option value="1">Classe 1 - Capital</option>
              <option value="2">Classe 2 - Immobilisations</option>
              <option value="3">Classe 3 - Stocks</option>
              <option value="4">Classe 4 - Tiers</option>
              <option value="5">Classe 5 - Trésorerie</option>
              <option value="6">Classe 6 - Charges</option>
              <option value="7">Classe 7 - Produits</option>
              <option value="8">Classe 8 - Régularisation</option>
            </select>
          </div>
        </div>
      </div>

      {/* ======================================================
          TABLEAU
          ====================================================== */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 w-10"></th>
                <th className="py-3 px-4">Numéro</th>
                <th className="py-3 px-4">Nom</th>
                <th className="py-3 px-4 hidden md:table-cell">Type</th>
                <th className="py-3 px-4 hidden lg:table-cell">Classe</th>
                <th className="py-3 px-4 text-right">Solde</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedComptes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Building2 className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucun compte trouvé</p>
                      <p className="text-sm text-gray-400">Ajustez vos filtres ou créez un compte</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedComptes.map((compte) => {
                  const children = getChildren(compte.id);
                  const isExpanded = expandedRows[compte.id];

                  return (
                    <React.Fragment key={compte.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          {children.length > 0 && (
                            <button
                              onClick={() => toggleRow(compte.id)}
                              className="btn btn-ghost btn-xs btn-circle"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold">{compte.numero}</td>
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-medium">{compte.nom}</span>
                            {compte.nom_complet && (
                              <p className="text-xs text-gray-400">{compte.nom_complet}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">{getTypeBadge(compte.type)}</td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          <span className="badge badge-ghost">Classe {compte.classe}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-primary">
                          {formatCurrency(compte.solde)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => navigate(`/comptes-comptables/${compte.id}`)}
                              className="btn btn-ghost btn-sm btn-circle"
                              title="Voir"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/comptes-comptables/${compte.id}/modifier`)}
                              className="btn btn-ghost btn-sm btn-circle text-warning"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(compte.id)}
                              className="btn btn-ghost btn-sm btn-circle text-error"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && children.map((child) => (
                        <tr key={child.id} className="hover:bg-gray-50 transition-colors bg-gray-50/50">
                          <td className="py-3 px-4"></td>
                          <td className="py-3 px-4 font-mono text-sm text-gray-600 pl-8">{child.numero}</td>
                          <td className="py-3 px-4 pl-8">
                            <span className="text-sm">└─ {child.nom}</span>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">{getTypeBadge(child.type)}</td>
                          <td className="py-3 px-4 hidden lg:table-cell">
                            <span className="badge badge-ghost badge-sm">Classe {child.classe}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-primary text-sm">
                            {formatCurrency(child.solde)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center gap-1">
                              <button
                                onClick={() => navigate(`/comptes-comptables/${child.id}`)}
                                className="btn btn-ghost btn-xs btn-circle"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => navigate(`/comptes-comptables/${child.id}/modifier`)}
                                className="btn btn-ghost btn-xs btn-circle text-warning"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ====================================================
            PAGINATION
            ==================================================== */}
        {rootComptes.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Affichage de <span className="font-medium">{startIndex + 1}</span> à{' '}
              <span className="font-medium">{Math.min(currentPage * itemsPerPage, rootComptes.length)}</span> sur{' '}
              <span className="font-medium">{rootComptes.length}</span> comptes
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
  );
};

export default ComptesList;