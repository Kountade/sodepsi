// src/components/station/PompeDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Server, Fuel, Droplet, Gauge, Activity,
  TrendingUp, Plus, RefreshCw, AlertTriangle, CheckCircle,
  Clock, User, FileText, Zap, Wrench, X, BarChart3
} from 'lucide-react';
import VentePompeModal from './VentePompeModal';

const PompeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pompe, setPompe] = useState(null);
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVenteModal, setShowVenteModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');
  const formatNumber = (n) => new Intl.NumberFormat('fr-FR').format(parseFloat(n || 0));
  const formatDate = (d) => d ? new Date(d).toLocaleString('fr-FR') : '';

  const fetchPompe = async () => {
    try {
      const token = getToken();
      const res = await AxiosInstance.get(`/pompes/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setPompe(res.data);
    } catch (e) {
      showNotification('Erreur de chargement', 'error');
    }
  };

  const fetchMouvements = async () => {
    try {
      const token = getToken();
      const res = await AxiosInstance.get(`/mouvements-pompes/?pompe=${id}`, {
        headers: { Authorization: `Token ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setMouvements(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([fetchPompe(), fetchMouvements()]);
    setLoading(false);
    showNotification('Données actualisées', 'success');
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchPompe(), fetchMouvements()]);
      setLoading(false);
    })();
  }, [id]);

  const getStatutBadge = (statut) => {
    const configs = {
      active: { label: 'Active', cls: 'badge-success', icon: Zap },
      inactive: { label: 'Inactive', cls: 'badge-ghost', icon: Activity },
      maintenance: { label: 'Maintenance', cls: 'badge-warning', icon: Wrench },
      panne: { label: 'En panne', cls: 'badge-error', icon: AlertTriangle },
    };
    const c = configs[statut] || { label: statut, cls: 'badge-ghost', icon: Activity };
    const Icon = c.icon;
    return <span className={`badge ${c.cls} badge-lg gap-2`}><Icon className="w-4 h-4" />{c.label}</span>;
  };

  if (loading || !pompe) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {notification.show && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl`}>
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {showVenteModal && (
        <VentePompeModal
          pompe={pompe}
          onClose={() => setShowVenteModal(false)}
          onSuccess={() => {
            setShowVenteModal(false);
            handleRefresh();
            showNotification('Vente enregistrée avec succès', 'success');
          }}
        />
      )}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pompes')} className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className={`p-2 rounded-xl ${pompe.est_disponible ? 'bg-success/10' : 'bg-gray-100'}`}>
            <Server className={`w-7 h-7 ${pompe.est_disponible ? 'text-success' : 'text-gray-400'}`} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-primary">{pompe.nom}</h1>
            <p className="text-sm text-gray-500">{pompe.code}</p>
          </div>
          {getStatutBadge(pompe.statut)}
        </div>
        <div className="flex gap-2">
          <button onClick={handleRefresh} className="btn btn-outline btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
          <button
            onClick={() => setShowVenteModal(true)}
            disabled={!pompe.est_disponible}
            className="btn btn-success btn-sm gap-2"
          >
            <Plus className="w-4 h-4" /> Enregistrer vente
          </button>
          <button
            onClick={() => navigate(`/pompes/${id}/modifier`)}
            className="btn btn-primary btn-sm gap-2"
          >
            Modifier
          </button>
        </div>
      </div>

      {/* Cartes info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cuve associée */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center gap-2 mb-3">
            <Fuel className="w-5 h-5 text-primary" />
            <h3 className="font-bold">Cuve associée</h3>
          </div>
          {pompe.cuve_details ? (
            <>
              <p className="text-lg font-bold">{pompe.cuve_details.nom}</p>
              <p className="text-xs text-gray-500 mb-3">{pompe.cuve_details.code}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="badge badge-info badge-sm">
                    {pompe.cuve_details.type_carburant_display}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Niveau</span>
                  <span className="font-semibold">
                    {formatNumber(pompe.cuve_details.niveau_actuel)} L
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div
                  className={`h-2 rounded-full ${
                    pompe.cuve_details.est_en_alerte ? 'bg-error' :
                    pompe.cuve_details.taux_remplissage < 50 ? 'bg-warning' : 'bg-success'
                  }`}
                  style={{ width: `${Math.min(pompe.cuve_details.taux_remplissage || 0, 100)}%` }}
                ></div>
              </div>
            </>
          ) : (
            <p className="text-gray-400">Aucune cuve associée</p>
          )}
        </div>

        {/* Compteur */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="w-5 h-5 text-primary" />
            <h3 className="font-bold">Compteur</h3>
          </div>
          <p className="text-3xl font-black text-primary">
            {formatNumber(pompe.compteur_actuel)} L
          </p>
          <div className="space-y-2 text-sm mt-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Compteur initial</span>
              <span className="font-medium">{formatNumber(pompe.compteur_initial)} L</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total vendu</span>
              <span className="font-bold text-success">
                {formatNumber(pompe.total_vendu)} L
              </span>
            </div>
          </div>
        </div>

        {/* Prix et config */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-bold">Configuration</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Prix au litre</span>
              <span className="font-bold text-primary text-lg">
                {formatNumber(pompe.prix_litre)} FCFA
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Emplacement</span>
              <span className="font-medium">{pompe.emplacement || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Statut</span>
              <span className="font-medium">{pompe.statut_display}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Active</span>
              {pompe.is_active ? (
                <span className="badge badge-success badge-sm">Oui</span>
              ) : (
                <span className="badge badge-ghost badge-sm">Non</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Historique des mouvements */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="font-bold">Historique des mouvements</h2>
          </div>
          <span className="badge badge-primary">{mouvements.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th>Date</th>
                <th className="text-center">Type</th>
                <th className="text-right">Quantité</th>
                <th className="text-right hidden md:table-cell">Montant</th>
                <th className="text-right hidden md:table-cell">Compteur après</th>
                <th className="hidden lg:table-cell">Référence</th>
                <th className="hidden lg:table-cell">Par</th>
              </tr>
            </thead>
            <tbody>
              {mouvements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-500">
                    Aucun mouvement enregistré
                  </td>
                </tr>
              ) : (
                mouvements.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="text-sm">{formatDate(m.created_at)}</td>
                    <td className="text-center">
                      <span className={`badge badge-${m.type_mouvement === 'vente' ? 'success' : 'info'} gap-1`}>
                        <TrendingUp className="w-3 h-3" />
                        {m.type_mouvement_display || m.type_mouvement}
                      </span>
                    </td>
                    <td className="text-right font-semibold text-success">
                      +{formatNumber(m.quantite)} L
                    </td>
                    <td className="text-right hidden md:table-cell font-semibold">
                      {formatNumber(m.montant)} FCFA
                    </td>
                    <td className="text-right hidden md:table-cell text-gray-500">
                      {formatNumber(m.nouveau_compteur)} L
                    </td>
                    <td className="hidden lg:table-cell text-sm text-gray-500">
                      {m.reference || '—'}
                    </td>
                    <td className="hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-sm">
                        <User className="w-3 h-3 text-gray-400" />
                        <span>{m.created_by_details?.full_name || '—'}</span>
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

export default PompeDetail;