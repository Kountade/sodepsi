// src/components/station/CuvesList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, RefreshCw, X,
  CheckCircle, AlertCircle, Eye, Fuel, Droplet,
  TrendingUp, TrendingDown, AlertTriangle,
  Warehouse, Gauge, Activity, BarChart3
} from 'lucide-react';

const CuvesList = () => {
  const navigate = useNavigate();
  const [cuves, setCuves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [alerteFilter, setAlerteFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cuveToDelete, setCuveToDelete] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [stats, setStats] = useState({
    total: 0, enAlerte: 0, actives: 0, capaciteTotale: 0, niveauTotal: 0
  });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchCuves = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type_carburant', typeFilter);
      if (alerteFilter === 'alerte') params.append('en_alerte', 'true');
      if (alerteFilter === 'normale') params.append('en_alerte', 'false');
      if (searchTerm) params.append('search', searchTerm);

      let url = '/cuves/';
      if (params.toString()) url += `?${params.toString()}`;

      const response = await AxiosInstance.get(url, {
        headers: { Authorization: `Token ${token}` }
      });
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setCuves(data);

      // Stats
      const total = data.length;
      const enAlerte = data.filter(c => c.est_en_alerte).length;
      const actives = data.filter(c => c.est_active).length;
      const capaciteTotale = data.reduce((sum, c) => sum + parseFloat(c.capacite_max || 0), 0);
      const niveauTotal = data.reduce((sum, c) => sum + parseFloat(c.niveau_actuel || 0), 0);
      setStats({ total, enAlerte, actives, capaciteTotale, niveauTotal });
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement des cuves', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCuves();
  }, [typeFilter, alerteFilter]);

  useEffect(() => {
    const t = setTimeout(() => { if (searchTerm !== undefined) fetchCuves(); }, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleDelete = async () => {
    if (!cuveToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/cuves/${cuveToDelete.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Cuve supprimée', 'success');
      setShowDeleteModal(false);
      setCuveToDelete(null);
      fetchCuves();
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const getTypeBadge = (type) => {
    const configs = {
      essence: { label: 'Essence', cls: 'badge-warning' },
      diesel: { label: 'Diesel', cls: 'badge-info' },
      gpl: { label: 'GPL', cls: 'badge-success' },
      ethanol: { label: 'Ethanol', cls: 'badge-secondary' },
      e10: { label: 'E10', cls: 'badge-primary' },
      e85: { label: 'E85', cls: 'badge-accent' },
    };
    const c = configs[type] || { label: type, cls: 'badge-ghost' };
    return <span className={`badge ${c.cls} gap-1`}><Droplet className="w-3 h-3" />{c.label}</span>;
  };

  const getNiveauColor = (taux, enAlerte) => {
    if (enAlerte) return 'bg-error';
    if (taux < 30) return 'bg-warning';
    if (taux < 70) return 'bg-info';
    return 'bg-success';
  };

  const formatNumber = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement des cuves...</p>
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
      {showDeleteModal && cuveToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer cette cuve ?</p>
              <p className="font-semibold text-error mt-2">{cuveToDelete.nom}</p>
              <p className="text-sm text-gray-500 mt-1">{cuveToDelete.code}</p>
              {cuveToDelete.niveau_actuel > 0 && (
                <p className="text-warning text-sm mt-2">
                  ⚠️ Cette cuve contient encore {formatNumber(cuveToDelete.niveau_actuel)} L
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
                <Fuel className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Gestion des Cuves</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Gérez vos réservoirs de carburant – {stats.total} cuve(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchCuves} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button
              onClick={() => navigate('/cuves/nouveau')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" /> Nouvelle cuve
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total cuves</p>
              <p className="text-xl font-bold text-primary">{stats.total}</p>
            </div>
            <Fuel className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">En alerte</p>
              <p className="text-xl font-bold text-error">{stats.enAlerte}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-error/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Stock total</p>
              <p className="text-xl font-bold text-info">{formatNumber(stats.niveauTotal)} L</p>
            </div>
            <Droplet className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Capacité</p>
              <p className="text-xl font-bold text-success">{formatNumber(stats.capaciteTotale)} L</p>
            </div>
            <Gauge className="w-8 h-8 text-success/20" />
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">Tous les carburants</option>
            <option value="essence">Essence</option>
            <option value="diesel">Diesel</option>
            <option value="gpl">GPL</option>
            <option value="ethanol">Ethanol</option>
            <option value="e10">E10</option>
            <option value="e85">E85</option>
          </select>
          <select
            className="select select-bordered w-full"
            value={alerteFilter}
            onChange={(e) => setAlerteFilter(e.target.value)}
          >
            <option value="all">Toutes les cuves</option>
            <option value="alerte">En alerte</option>
            <option value="normale">Niveau normal</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th>Cuve</th>
                <th className="hidden md:table-cell">Emplacement</th>
                <th className="text-center">Type</th>
                <th className="text-center">Niveau</th>
                <th className="text-center hidden lg:table-cell">Taux</th>
                <th className="text-center">Statut</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cuves.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Fuel className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucune cuve trouvée</p>
                      <button
                        onClick={() => navigate('/cuves/nouveau')}
                        className="btn btn-primary btn-sm gap-2"
                      >
                        <Plus className="w-4 h-4" /> Ajouter une cuve
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                cuves.map(cuve => {
                  const taux = cuve.taux_remplissage || 0;
                  const enAlerte = cuve.est_en_alerte;
                  return (
                    <tr key={cuve.id} className="hover:bg-gray-50">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${enAlerte ? 'bg-error/10' : 'bg-primary/10'}`}>
                            <Fuel className={`w-5 h-5 ${enAlerte ? 'text-error' : 'text-primary'}`} />
                          </div>
                          <div>
                            <p className="font-semibold">{cuve.nom}</p>
                            <p className="text-xs text-gray-500">{cuve.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Warehouse className="w-3 h-3" />
                          <span>{cuve.emplacement || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="text-center">{getTypeBadge(cuve.type_carburant)}</td>
                      <td className="text-center">
                        <div className="space-y-1">
                          <p className="font-semibold text-sm">
                            {formatNumber(cuve.niveau_actuel)} / {formatNumber(cuve.capacite_max)} L
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getNiveauColor(taux, enAlerte)}`}
                              style={{ width: `${Math.min(taux, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center hidden lg:table-cell">
                        <span className={`badge ${enAlerte ? 'badge-error' : taux < 30 ? 'badge-warning' : 'badge-success'}`}>
                          {taux.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-center">
                        {enAlerte ? (
                          <span className="badge badge-error gap-1">
                            <AlertTriangle className="w-3 h-3" /> Alerte
                          </span>
                        ) : cuve.est_active ? (
                          <span className="badge badge-success gap-1">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="badge badge-ghost gap-1">Inactive</span>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => navigate(`/cuves/${cuve.id}`)}
                            className="btn btn-ghost btn-sm btn-circle"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/cuves/${cuve.id}/modifier`)}
                            className="btn btn-ghost btn-sm btn-circle"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setCuveToDelete(cuve); setShowDeleteModal(true); }}
                            className="btn btn-ghost btn-sm btn-circle text-error"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CuvesList;