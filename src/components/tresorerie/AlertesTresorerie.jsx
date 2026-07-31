// src/components/tresorerie/AlertesTresorerie.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  AlertTriangle, CheckCircle, X, RefreshCw, Bell,
  TrendingUp, TrendingDown, DollarSign, Building2,
  AlertCircle, Clock, Ban, FileText, Wallet, Calendar
} from 'lucide-react';

const AlertesTresorerie = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [alertes, setAlertes] = useState({
    caisses: [],
    mouvements: [],
    previsions: [],
    rapprochements: []
  });
  const [totalAlertes, setTotalAlertes] = useState(0);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const fetchAlertes = async () => {
    setLoading(true);
    try {
      const token = getToken();
      
      // 1. Caisses avec seuils dépassés
      const caissesRes = await AxiosInstance.get('/caisses/?is_active=true', {
        headers: { 'Authorization': `Token ${token}` }
      });
      const caisses = caissesRes.data || [];
      const caissesAlertes = caisses.filter(c => 
        (c.seuil_min > 0 && parseFloat(c.solde_actuel) < parseFloat(c.seuil_min)) ||
        (c.seuil_max > 0 && parseFloat(c.solde_actuel) > parseFloat(c.seuil_max))
      );

      // 2. Mouvements en attente ou planifiés (non effectués)
      const mouvementsRes = await AxiosInstance.get('/mouvements/?status=en_attente&status=planifie', {
        headers: { 'Authorization': `Token ${token}` }
      });
      const mouvements = mouvementsRes.data || [];

      // 3. Prévisions avec écart
      const previsionsRes = await AxiosInstance.get('/previsions/?statut=ecart', {
        headers: { 'Authorization': `Token ${token}` }
      });
      const previsions = previsionsRes.data || [];

      // 4. Rapprochements avec écart
      const rapprochementsRes = await AxiosInstance.get('/rapprochements/?status=ecart', {
        headers: { 'Authorization': `Token ${token}` }
      });
      const rapprochements = rapprochementsRes.data || [];

      setAlertes({
        caisses: caissesAlertes,
        mouvements: mouvements,
        previsions: previsions,
        rapprochements: rapprochements
      });

      setTotalAlertes(
        caissesAlertes.length + 
        mouvements.length + 
        previsions.length + 
        rapprochements.length
      );

    } catch (error) {
      console.error('Erreur chargement alertes:', error);
      showNotification('Erreur de chargement des alertes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertes();
  }, []);

  // Rendu d'une alerte de caisse
  const renderCaisseAlerte = (caisse) => {
    const estSous = parseFloat(caisse.solde_actuel) < parseFloat(caisse.seuil_min);
    const estSur = parseFloat(caisse.solde_actuel) > parseFloat(caisse.seuil_max);
    const type = estSous ? 'sous_seuil' : 'sur_seuil';
    const icon = estSous ? <TrendingDown className="w-5 h-5 text-error" /> : <TrendingUp className="w-5 h-5 text-warning" />;
    const message = estSous 
      ? `Solde (${Number(caisse.solde_actuel).toLocaleString()} FCFA) inférieur au seuil minimum (${Number(caisse.seuil_min).toLocaleString()} FCFA)`
      : `Solde (${Number(caisse.solde_actuel).toLocaleString()} FCFA) supérieur au seuil maximum (${Number(caisse.seuil_max).toLocaleString()} FCFA)`;
    
    return (
      <div key={`caisse-${caisse.id}`} className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
        <div className={`p-2 rounded-full ${estSous ? 'bg-error/10' : 'bg-warning/10'}`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">{caisse.code} - {caisse.nom}</span>
            <span className={`badge ${estSous ? 'badge-error' : 'badge-warning'}`}>
              {estSous ? 'Sous seuil' : 'Sur seuil'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{message}</p>
          <p className="text-xs text-gray-400 mt-1">Entrepôt: {caisse.warehouse?.name || caisse.warehouse}</p>
        </div>
        <button 
          onClick={() => navigate(`/caisses/${caisse.id}`)}
          className="btn btn-ghost btn-sm"
        >
          Voir
        </button>
      </div>
    );
  };

  // Rendu d'une alerte de mouvement
  const renderMouvementAlerte = (mvt) => {
    const typeLabel = mvt.type_mouvement === 'encaissement' ? 'Encaissement' : 
                      mvt.type_mouvement === 'decaissement' ? 'Décaissement' : 'Transfert';
    const icon = mvt.type_mouvement === 'encaissement' ? 
      <TrendingUp className="w-5 h-5 text-success" /> : 
      mvt.type_mouvement === 'decaissement' ? 
      <TrendingDown className="w-5 h-5 text-error" /> : 
      <Ban className="w-5 h-5 text-warning" />;

    return (
      <div key={`mvt-${mvt.id}`} className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
        <div className={`p-2 rounded-full ${mvt.type_mouvement === 'encaissement' ? 'bg-success/10' : 'bg-error/10'}`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">{mvt.reference}</span>
            <span className="badge badge-warning">En attente</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {typeLabel} de {Number(mvt.montant).toLocaleString()} FCFA - {mvt.libelle}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Mode: {mvt.mode_paiement} - Date prévue: {mvt.date_prevue || mvt.date_mouvement}
          </p>
        </div>
        <button 
          onClick={() => navigate(`/mouvements-tresorerie/${mvt.id}`)}
          className="btn btn-ghost btn-sm"
        >
          Voir
        </button>
      </div>
    );
  };

  // Rendu d'une alerte de prévision
  const renderPrevisionAlerte = (prev) => {
    const ecart = parseFloat(prev.ecart || 0);
    const isPositif = ecart > 0;
    const icon = isPositif ? <TrendingUp className="w-5 h-5 text-success" /> : <TrendingDown className="w-5 h-5 text-error" />;
    const message = `Écart de ${Number(prev.ecart).toLocaleString()} FCFA (${prev.pourcentage_ecart?.toFixed(2) || 0}%)`;

    return (
      <div key={`prev-${prev.id}`} className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
        <div className={`p-2 rounded-full ${isPositif ? 'bg-success/10' : 'bg-error/10'}`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">{prev.reference} - {prev.titre}</span>
            <span className="badge badge-error">Écart</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{message}</p>
          <p className="text-xs text-gray-400 mt-1">
            Prévision: {Number(prev.montant_prevu).toLocaleString()} FCFA - Réel: {Number(prev.montant_reel).toLocaleString()} FCFA
          </p>
        </div>
        <button 
          onClick={() => navigate(`/previsions/${prev.id}`)}
          className="btn btn-ghost btn-sm"
        >
          Voir
        </button>
      </div>
    );
  };

  // Rendu d'une alerte de rapprochement
  const renderRapprochementAlerte = (rapp) => {
    return (
      <div key={`rapp-${rapp.id}`} className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
        <div className="p-2 rounded-full bg-error/10">
          <AlertCircle className="w-5 h-5 text-error" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">{rapp.reference}</span>
            <span className="badge badge-error">Écart</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Écart de {Number(rapp.ecart).toLocaleString()} FCFA entre comptable et bancaire
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Comptable: {Number(rapp.solde_comptable).toLocaleString()} FCFA - Bancaire: {Number(rapp.solde_bancaire).toLocaleString()} FCFA
          </p>
        </div>
        <button 
          onClick={() => navigate(`/rapprochement-bancaire/${rapp.id}`)}
          className="btn btn-ghost btn-sm"
        >
          Voir
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement des alertes...</p>
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
      <div className="relative overflow-hidden bg-gradient-to-r from-warning/10 via-warning/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-warning/10 rounded-xl">
                <Bell className="w-7 h-7 text-warning" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-warning">Alertes de trésorerie</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              {totalAlertes} alerte(s) nécessitant votre attention
            </p>
          </div>
          <button onClick={fetchAlertes} className="btn btn-sm sm:btn-md btn-outline gap-2">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Caisses</p><p className="text-xl font-bold text-error">{alertes.caisses.length}</p></div>
            <Wallet className="w-8 h-8 text-error/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Mouvements en attente</p><p className="text-xl font-bold text-warning">{alertes.mouvements.length}</p></div>
            <Clock className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Prévisions avec écart</p><p className="text-xl font-bold text-info">{alertes.previsions.length}</p></div>
            <TrendingUp className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Rapprochements en écart</p><p className="text-xl font-bold text-error">{alertes.rapprochements.length}</p></div>
            <FileText className="w-8 h-8 text-error/20" />
          </div>
        </div>
      </div>

      {/* Contenu des alertes */}
      <div className="space-y-6">
        {/* Alertes Caisses */}
        {alertes.caisses.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2 mb-3">
              <Wallet className="w-5 h-5 text-error" /> Caisses hors seuil ({alertes.caisses.length})
            </h2>
            <div className="space-y-3">
              {alertes.caisses.map(renderCaisseAlerte)}
            </div>
          </div>
        )}

        {/* Alertes Mouvements */}
        {alertes.mouvements.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-warning" /> Mouvements en attente ({alertes.mouvements.length})
            </h2>
            <div className="space-y-3">
              {alertes.mouvements.map(renderMouvementAlerte)}
            </div>
          </div>
        )}

        {/* Alertes Prévisions */}
        {alertes.previsions.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-info" /> Prévisions avec écart ({alertes.previsions.length})
            </h2>
            <div className="space-y-3">
              {alertes.previsions.map(renderPrevisionAlerte)}
            </div>
          </div>
        )}

        {/* Alertes Rapprochements */}
        {alertes.rapprochements.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-error" /> Rapprochements en écart ({alertes.rapprochements.length})
            </h2>
            <div className="space-y-3">
              {alertes.rapprochements.map(renderRapprochementAlerte)}
            </div>
          </div>
        )}

        {totalAlertes === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm">
            <CheckCircle className="w-16 h-16 text-success" />
            <p className="text-xl font-semibold text-gray-700 mt-4">Aucune alerte</p>
            <p className="text-gray-500">Toutes les caisses, mouvements, prévisions et rapprochements sont en ordre.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertesTresorerie;