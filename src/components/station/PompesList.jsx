// src/components/station/PompesList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, RefreshCw, X,
  CheckCircle, AlertCircle, Eye, Fuel, Droplet,
  Gauge, Activity, BarChart3, Wrench, AlertTriangle,
  TrendingUp, Zap, Server
} from 'lucide-react';

const PompesList = () => {
  const navigate = useNavigate();
  const [pompes, setPompes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState('all');
  const [cuveFilter, setCuveFilter] = useState('all');
  const [cuves, setCuves] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pompeToDelete, setPompeToDelete] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [stats, setStats] = useState({
    total: 0, actives: 0, maintenance: 0, panne: 0,
    ventesTotales: 0, compteurTotal: 0
  });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');
  const formatNumber = (n) => new Intl.NumberFormat('fr-FR').format(parseFloat(n || 0));

  // Charger les cuves pour le filtre
  const fetchCuves = async () => {
    try {
      const token = getToken();
      const res = await AxiosInstance.get('/cuves/', {
        headers: { Authorization: `Token ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setCuves(data);
    } catch (e) { console.error(e); }
  };

  const fetchPompes = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (statutFilter !== 'all') params.append('statut', statutFilter);
      if (cuveFilter !== 'all') params.append('cuve', cuveFilter);
      if (searchTerm) params.append('search', searchTerm);

      let url = '/pompes/';
      if (params.toString()) url += `?${params.toString()}`;

      const res = await AxiosInstance.get(url, {
        headers: { Authorization: `Token ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setPompes(data);

      // Stats
      setStats({
        total: data.length,
        actives: data.filter(p => p.statut === 'active').length,
        maintenance: data.filter(p => p.statut === 'maintenance').length,
        panne: data.filter(p => p.statut === 'panne').length,
        ventesTotales: data.reduce((s, p) => s + parseFloat(p.total_vendu || 0), 0),
        compteurTotal: data.reduce((s, p) => s + parseFloat(p.compteur_actuel || 0), 0),
      });
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement des pompes', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCuves();
  }, []);

  useEffect(() => {
    fetchPompes();
  }, [statutFilter, cuveFilter]);

  useEffect(() => {
    const t = setTimeout(() => fetchPompes(), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleDelete = async () => {
    if (!pompeToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/pompes/${pompeToDelete.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Pompe supprimée', 'success');
      setShowDeleteModal(false);
      setPompeToDelete(null);
      fetchPompes();
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const getStatutBadge = (statut) => {
    const configs = {
      active: { label: 'Active', cls: 'badge-success', icon: Zap },
      inactive: { label: 'Inactive', cls: 'badge-ghost', icon: Activity },
      maintenance: { label: 'Maintenance', cls: 'badge-warning', icon: Wrench },
      panne: { label: 'En panne', cls: 'badge-error', icon: AlertTriangle },
    };
    const c = configs[statut] || { label: statut, cls: 'badge-ghost', icon: Activity };
    const Icon = c.icon;
    return <span className={`badge ${c.cls} gap-1`}><Icon className="w-3 h-3" />{c.label}</span>;
  };

  if (loading && pompes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement des pompes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50">
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
      {showDeleteModal && pompeToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer cette pompe ?</p>
              <p className="font-semibold text-error mt-2">{pompeToDelete.nom}</p>
              <p className="text-sm text-gray-500 mt-1">{pompeToDelete.code}</p>
              {parseFloat(pompeToDelete.compteur_actuel || 0) > 0 && (
                <p className="text-warning text-sm mt-2">
                  ⚠️ Compteur actuel : {formatNumber(pompeToDelete.compteur_actuel)} L
                </p>
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
                <Server className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Gestion des Pompes</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Gérez vos pompes à carburant – {stats.total} pompe(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchPompes} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button
              onClick={() => navigate('/pompes/nouveau')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" /> Nouvelle pompe
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total pompes</p>
              <p className="text-xl font-bold text-primary">{stats.total}</p>
            </div>
            <Server className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3 border-l-4 border-success">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Actives</p>
              <p className="text-xl font-bold text-success">{stats.actives}</p>
            </div>
            <Zap className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3 border-l-4 border-warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Maintenance</p>
              <p className="text-xl font-bold text-warning">{stats.maintenance}</p>
            </div>
            <Wrench className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3 border-l-4 border-info">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total vendu</p>
              <p className="text-xl font-bold text-info">{formatNumber(stats.ventesTotales)} L</p>
            </div>
            <TrendingUp className="w-8 h-8 text-info/20" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par code, nom, emplacement..."
              className="input input-bordered w-full pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="select select-bordered w-full"
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actives</option>
            <option value="inactive">Inactives</option>
            <option value="maintenance">En maintenance</option>
            <option value="panne">En panne</option>
          </select>
          <select
            className="select select-bordered w-full"
            value={cuveFilter}
            onChange={(e) => setCuveFilter(e.target.value)}
          >
            <option value="all">Toutes les cuves</option>
            {cuves.map(c => (
              <option key={c.id} value={c.id}>{c.nom} ({c.code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th>Pompe</th>
                <th className="hidden md:table-cell">Cuve associée</th>
                <th className="text-center hidden lg:table-cell">Prix/L</th>
                <th className="text-center">Compteur</th>
                <th className="text-center hidden lg:table-cell">Total vendu</th>
                <th className="text-center">Statut</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pompes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Server className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucune pompe trouvée</p>
                      <button
                        onClick={() => navigate('/pompes/nouveau')}
                        className="btn btn-primary btn-sm gap-2"
                      >
                        <Plus className="w-4 h-4" /> Ajouter une pompe
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                pompes.map(pompe => (
                  <tr key={pompe.id} className="hover:bg-gray-50">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${pompe.est_disponible ? 'bg-success/10' : 'bg-gray-100'}`}>
                          <Server className={`w-5 h-5 ${pompe.est_disponible ? 'text-success' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <p className="font-semibold">{pompe.nom}</p>
                          <p className="text-xs text-gray-500">{pompe.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">
                      <div className="flex items-center gap-1 text-sm">
                        <Fuel className="w-3 h-3 text-gray-400" />
                        <span>{pompe.cuve_details?.nom || pompe.cuve || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="text-center hidden lg:table-cell">
                      <span className="font-semibold text-primary">
                        {formatNumber(pompe.prix_litre)} FCFA
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Gauge className="w-3 h-3 text-gray-400" />
                        <span className="font-semibold">{formatNumber(pompe.compteur_actuel)} L</span>
                      </div>
                    </td>
                    <td className="text-center hidden lg:table-cell">
                      <span className="badge badge-info badge-sm">
                        {formatNumber(pompe.total_vendu)} L
                      </span>
                    </td>
                    <td className="text-center">{getStatutBadge(pompe.statut)}</td>
                    <td className="text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => navigate(`/pompes/${pompe.id}`)}
                          className="btn btn-ghost btn-sm btn-circle"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/pompes/${pompe.id}/modifier`)}
                          className="btn btn-ghost btn-sm btn-circle"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setPompeToDelete(pompe); setShowDeleteModal(true); }}
                          className="btn btn-ghost btn-sm btn-circle text-error"
                          title="Supprimer"
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
      </div>
    </div>
  );
};

export default PompesList;