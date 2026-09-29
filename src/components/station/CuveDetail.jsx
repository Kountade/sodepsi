// src/components/station/CuveDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Fuel, Droplet, Warehouse, Gauge, Activity,
  TrendingUp, TrendingDown, Plus, Minus, RefreshCw,
  AlertTriangle, CheckCircle, Clock, User
} from 'lucide-react';
import ApprovisionnementModal from './ApprovisionnementModal';
import RetraitModal from './RetraitModal';

const CuveDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cuve, setCuve] = useState(null);
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApproModal, setShowApproModal] = useState(false);
  const [showRetraitModal, setShowRetraitModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchCuve = async () => {
    try {
      const token = getToken();
      const res = await AxiosInstance.get(`/cuves/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setCuve(res.data);
    } catch (error) {
      showNotification('Erreur de chargement', 'error');
    }
  };

  const fetchMouvements = async () => {
    try {
      const token = getToken();
      const res = await AxiosInstance.get(`/cuves/${id}/mouvements/`, {
        headers: { Authorization: `Token ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setMouvements(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchCuve(), fetchMouvements()]);
      setLoading(false);
    })();
  }, [id]);

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([fetchCuve(), fetchMouvements()]);
    setLoading(false);
    showNotification('Données actualisées', 'success');
  };

  const formatNumber = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);
  const formatDate = (d) => d ? new Date(d).toLocaleString('fr-FR') : '';

  const getMouvementBadge = (type) => {
    const configs = {
      approvisionnement: { label: 'Approvisionnement', cls: 'badge-success', icon: TrendingUp },
      vente: { label: 'Vente', cls: 'badge-info', icon: TrendingDown },
      transfert: { label: 'Transfert', cls: 'badge-warning', icon: Activity },
      ajustement: { label: 'Ajustement', cls: 'badge-secondary', icon: Activity },
      fuite: { label: 'Fuite / Perte', cls: 'badge-error', icon: AlertTriangle },
    };
    const c = configs[type] || { label: type, cls: 'badge-ghost', icon: Activity };
    const Icon = c.icon;
    return <span className={`badge ${c.cls} gap-1`}><Icon className="w-3 h-3" />{c.label}</span>;
  };

  if (loading || !cuve) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement de la cuve...</p>
        </div>
      </div>
    );
  }

  const taux = cuve.taux_remplissage || 0;
  const enAlerte = cuve.est_en_alerte;

  return (
    <div className="space-y-4 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl`}>
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Modals */}
      {showApproModal && (
        <ApprovisionnementModal
          cuve={cuve}
          onClose={() => setShowApproModal(false)}
          onSuccess={() => { setShowApproModal(false); handleRefresh(); showNotification('Approvisionnement enregistré', 'success'); }}
        />
      )}
      {showRetraitModal && (
        <RetraitModal
          cuve={cuve}
          onClose={() => setShowRetraitModal(false)}
          onSuccess={() => { setShowRetraitModal(false); handleRefresh(); showNotification('Retrait enregistré', 'success'); }}
        />
      )}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/cuves')} className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-primary">{cuve.nom}</h1>
            <p className="text-sm text-gray-500">{cuve.code}</p>
          </div>
          {enAlerte && (
            <span className="badge badge-error gap-1 animate-pulse">
              <AlertTriangle className="w-4 h-4" /> ALERTE
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={handleRefresh} className="btn btn-outline btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
          <button
            onClick={() => setShowApproModal(true)}
            className="btn btn-success btn-sm gap-2"
          >
            <Plus className="w-4 h-4" /> Approvisionner
          </button>
          <button
            onClick={() => setShowRetraitModal(true)}
            className="btn btn-warning btn-sm gap-2"
          >
            <Minus className="w-4 h-4" /> Retirer
          </button>
        </div>
      </div>

      {/* Carte principale */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Niveau */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="w-5 h-5 text-primary" />
            <h2 className="font-bold">Niveau actuel</h2>
          </div>

          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-4xl font-black text-primary">
                {formatNumber(cuve.niveau_actuel)} L
              </p>
              <p className="text-sm text-gray-500">
                sur {formatNumber(cuve.capacite_max)} L de capacité
              </p>
            </div>
            <div className={`text-3xl font-bold ${enAlerte ? 'text-error' : taux < 30 ? 'text-warning' : 'text-success'}`}>
              {taux.toFixed(1)}%
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
            <div
              className={`h-6 rounded-full transition-all duration-500 ${
                enAlerte ? 'bg-error' : taux < 30 ? 'bg-warning' : taux < 70 ? 'bg-info' : 'bg-success'
              }`}
              style={{ width: `${Math.min(taux, 100)}%` }}
            ></div>
          </div>

          {enAlerte && (
            <div className="mt-4 alert alert-error">
              <AlertTriangle className="w-5 h-5" />
              <span>Niveau en dessous du seuil d'alerte ({formatNumber(cuve.capacite_alerte)} L)</span>
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Fuel className="w-5 h-5 text-primary" />
            <h2 className="font-bold">Informations</h2>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Type</span>
              <span className="badge badge-info gap-1">
                <Droplet className="w-3 h-3" /> {cuve.type_carburant_display}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Emplacement</span>
              <span className="font-medium">{cuve.emplacement || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Seuil d'alerte</span>
              <span className="font-medium">{formatNumber(cuve.capacite_alerte)} L</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Statut</span>
              {cuve.est_active ? (
                <span className="badge badge-success gap-1"><CheckCircle className="w-3 h-3" /> Active</span>
              ) : (
                <span className="badge badge-ghost">Inactive</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Dernière livraison</span>
              <span className="font-medium text-xs">{formatDate(cuve.derniere_livraison) || 'Aucune'}</span>
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
                <th className="text-right hidden md:table-cell">Avant</th>
                <th className="text-right hidden md:table-cell">Après</th>
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
                    <td className="text-center">{getMouvementBadge(m.type_mouvement)}</td>
                    <td className={`text-right font-semibold ${
                      ['approvisionnement', 'ajustement'].includes(m.type_mouvement) ? 'text-success' : 'text-error'
                    }`}>
                      {['approvisionnement'].includes(m.type_mouvement) ? '+' : '-'}{formatNumber(m.quantite)} L
                    </td>
                    <td className="text-right hidden md:table-cell text-gray-500">
                      {formatNumber(m.ancien_niveau)} L
                    </td>
                    <td className="text-right hidden md:table-cell font-medium">
                      {formatNumber(m.nouveau_niveau)} L
                    </td>
                    <td className="hidden lg:table-cell text-sm text-gray-500">
                      {m.reference || '—'}
                    </td>
                    <td className="hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-sm">
                        <User className="w-3 h-3 text-gray-400" />
                        <span>{m.created_by_details?.full_name || m.created_by_details?.username || '—'}</span>
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

export default CuveDetail;