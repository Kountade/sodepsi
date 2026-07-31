// src/components/tresorerie/DashboardTresorerie.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  DollarSign, Building2, TrendingUp, TrendingDown,
  RefreshCw, Eye, AlertCircle, CheckCircle, X,
  Wallet, Calendar, BarChart3, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const DashboardTresorerie = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/dashboard/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setDashboard(response.data);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      setError('Impossible de charger les données du tableau de bord.');
      showNotification('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return Number(num).toLocaleString();
  };

  const formatCurrency = (num) => `${formatNumber(num)} FCFA`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-error" />
          <p className="text-xl font-semibold text-gray-700">{error || 'Données non disponibles'}</p>
          <button onClick={fetchDashboard} className="btn btn-primary gap-2">
            <RefreshCw className="w-4 h-4" /> Réessayer
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

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <BarChart3 className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">Tableau de bord – Trésorerie</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Vue d'ensemble de la trésorerie – {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>
          <button onClick={fetchDashboard} className="btn btn-sm sm:btn-md btn-outline gap-2">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
        </div>
      </div>

      {/* Cartes principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total caisses</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(dashboard.total_soldes_caisses)}</p>
              <p className="text-xs text-gray-400">{dashboard.nb_caisses} caisses actives</p>
            </div>
            <Wallet className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total comptes bancaires</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(dashboard.total_soldes_comptes)}</p>
              <p className="text-xs text-gray-400">{dashboard.nb_comptes} comptes actifs</p>
            </div>
            <Building2 className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Trésorerie globale</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(dashboard.total_global)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Flux du jour</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-success font-bold">+{formatCurrency(dashboard.entree_total_jour)}</span>
                <span className="text-error font-bold">-{formatCurrency(dashboard.sortie_total_jour)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <TrendingUp className="w-5 h-5 text-success" />
              <TrendingDown className="w-5 h-5 text-error" />
            </div>
          </div>
        </div>
      </div>

      {/* Soldes par entrepôt */}
      <div className="bg-white shadow-md rounded-xl p-5">
        <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-primary" /> Soldes par entrepôt
        </h2>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th>Entrepôt</th>
                <th className="text-right">Caisses</th>
                <th className="text-right">Comptes bancaires</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.soldes_par_entrepot && dashboard.soldes_par_entrepot.length > 0 ? (
                dashboard.soldes_par_entrepot.map((wh) => (
                  <tr key={wh.warehouse_id} className="hover:bg-gray-50">
                    <td>{wh.warehouse_name}</td>
                    <td className="text-right">{formatCurrency(wh.total_caisses)}</td>
                    <td className="text-right">{formatCurrency(wh.total_comptes)}</td>
                    <td className="text-right font-bold">{formatCurrency(wh.total)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-500">Aucun entrepôt actif</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Derniers mouvements */}
      <div className="bg-white shadow-md rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" /> Derniers mouvements
          </h2>
          <button onClick={() => navigate('/mouvements-tresorerie')} className="btn btn-ghost btn-sm gap-1">
            Voir tout <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th>Référence</th>
                <th>Type</th>
                <th>Montant</th>
                <th>Date</th>
                <th className="hidden md:table-cell">Caisse / Compte</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.mouvements_recents && dashboard.mouvements_recents.length > 0 ? (
                dashboard.mouvements_recents.map((mvt, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="font-mono text-sm">{mvt.reference}</td>
                    <td>
                      <span className={`badge ${mvt.type === 'encaissement' ? 'badge-success' : mvt.type === 'decaissement' ? 'badge-error' : 'badge-warning'}`}>
                        {mvt.type === 'encaissement' ? 'Encaissement' : mvt.type === 'decaissement' ? 'Décaissement' : 'Transfert'}
                      </span>
                    </td>
                    <td className={mvt.type === 'encaissement' ? 'text-success' : 'text-error'}>
                      {mvt.type === 'encaissement' ? '+' : '-'}{Number(mvt.montant).toLocaleString()}
                    </td>
                    <td>{mvt.date}</td>
                    <td className="hidden md:table-cell">{mvt.caisse || mvt.compte || '-'}</td>
                    <td className="text-center">
                      <button className="btn btn-ghost btn-sm btn-circle" onClick={() => navigate('/mouvements-tresorerie')}>
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-500">Aucun mouvement récent</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardTresorerie;