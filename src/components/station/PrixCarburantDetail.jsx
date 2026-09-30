// src/components/station/PrixCarburantDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, BadgeDollarSign, Fuel, Calendar, Clock,
  CheckCircle, AlertCircle, X, Edit, Trash2, RefreshCw,
  Droplet, TrendingUp, FileText, User, Hash
} from 'lucide-react';

const PrixCarburantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [prix, setPrix] = useState(null);
  const [cuve, setCuve] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');
  const formatNumber = (n) => new Intl.NumberFormat('fr-FR').format(parseFloat(n || 0));
  const formatCurrency = (n) => new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'XOF'
  }).format(parseFloat(n || 0)).replace('XOF', 'FCFA');
  const formatDate = (d) => d ? new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : '';

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await AxiosInstance.get(`/prix-carburant/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setPrix(res.data);

      // Charger la cuve
      if (res.data.cuve) {
        try {
          const cuveRes = await AxiosInstance.get(`/cuves/${res.data.cuve}/`, {
            headers: { Authorization: `Token ${token}` }
          });
          setCuve(cuveRes.data);

          // Charger l'historique de la même cuve
          const histRes = await AxiosInstance.get(
            `/prix-carburant/?cuve=${res.data.cuve}`,
            { headers: { Authorization: `Token ${token}` } }
          );
          const histData = Array.isArray(histRes.data)
            ? histRes.data
            : (histRes.data.results || []);
          setHistorique(histData.filter(p => p.id !== res.data.id).slice(0, 10));
        } catch (e) { console.error(e); }
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        showNotification('Prix introuvable', 'error');
        setTimeout(() => navigate('/prix-carburant'), 2000);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    try {
      const token = getToken();
      await AxiosInstance.delete(`/prix-carburant/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Prix supprimé avec succès', 'success');
      setTimeout(() => navigate('/prix-carburant'), 1200);
    } catch (err) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const handleToggleActif = async () => {
    try {
      const token = getToken();
      await AxiosInstance.patch(`/prix-carburant/${id}/`, {
        est_actif: !prix.est_actif,
      }, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification(
        prix.est_actif ? 'Prix désactivé' : 'Prix activé',
        'success'
      );
      fetchData();
    } catch (err) {
      showNotification('Erreur lors de la mise à jour', 'error');
    }
  };

  if (loading || !prix) {
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
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium text-sm">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification({ ...notification, show: false })}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer ce prix ?</p>
              <p className="font-semibold text-error mt-2">
                {formatCurrency(prix.prix_litre)} / L
              </p>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/prix-carburant')} className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2 bg-primary/10 rounded-xl">
            <BadgeDollarSign className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-primary">
              {formatCurrency(prix.prix_litre)} / L
            </h1>
            <p className="text-sm text-gray-500">
              Prix pour {cuve?.nom || 'Cuve inconnue'} ({cuve?.code || '—'})
            </p>
          </div>
          <span className={`badge badge-lg ${prix.est_actif ? 'badge-success' : 'badge-ghost'} gap-2`}>
            {prix.est_actif ? (
              <><CheckCircle className="w-4 h-4" /> Actif</>
            ) : (
              <><Clock className="w-4 h-4" /> Inactif</>
            )}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={fetchData} className="btn btn-outline btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
          <button onClick={handleToggleActif} className={`btn btn-sm gap-2 ${prix.est_actif ? 'btn-warning' : 'btn-success'}`}>
            {prix.est_actif ? 'Désactiver' : 'Activer'}
          </button>
          <button
            onClick={() => navigate(`/prix-carburant/${id}/modifier`)}
            className="btn btn-primary btn-sm gap-2"
          >
            <Edit className="w-4 h-4" /> Modifier
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn btn-error btn-sm gap-2"
          >
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-4">

          {/* Détails */}
          <div className="bg-white rounded-xl shadow-md p-5">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Détails du prix
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Prix au litre</p>
                <p className="text-3xl font-black text-primary">
                  {formatNumber(prix.prix_litre)} <span className="text-lg">FCFA</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Statut</p>
                <span className={`badge badge-lg ${prix.est_actif ? 'badge-success' : 'badge-ghost'} gap-2 mt-1`}>
                  {prix.est_actif ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date d'application</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium">{formatDate(prix.date_application)}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date de fin</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">
                    {prix.date_fin ? formatDate(prix.date_fin) : (
                      <span className="badge badge-success badge-sm">En cours</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {prix.notes && (
              <>
                <div className="divider my-4"></div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Notes</p>
                  <p className="bg-gray-50 p-3 rounded-lg italic text-sm">
                    "{prix.notes}"
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Historique de la cuve */}
          {historique.length > 0 && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-5 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h2 className="font-bold">Autres prix de cette cuve</h2>
                </div>
                <span className="badge badge-primary">{historique.length}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th>Prix / L</th>
                      <th className="hidden md:table-cell">Date d'application</th>
                      <th className="hidden lg:table-cell">Fin</th>
                      <th className="text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historique.map(h => (
                      <tr
                        key={h.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/prix-carburant/${h.id}`)}
                      >
                        <td className="font-bold text-primary">
                          {formatNumber(h.prix_litre)} FCFA
                        </td>
                        <td className="hidden md:table-cell text-sm text-gray-600">
                          {formatDate(h.date_application)}
                        </td>
                        <td className="hidden lg:table-cell text-sm text-gray-600">
                          {h.date_fin ? formatDate(h.date_fin) : '—'}
                        </td>
                        <td className="text-center">
                          <span className={`badge badge-sm ${h.est_actif ? 'badge-success' : 'badge-ghost'}`}>
                            {h.est_actif ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-4">

          {/* Info cuve */}
          {cuve && (
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Fuel className="w-5 h-5 text-primary" />
                Cuve associée
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nom</span>
                  <span className="font-semibold">{cuve.nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Code</span>
                  <span className="font-mono text-xs">{cuve.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="badge badge-info badge-sm gap-1">
                    <Droplet className="w-3 h-3" />
                    {cuve.type_carburant_display}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Niveau</span>
                  <span className="font-semibold text-info">
                    {formatNumber(cuve.niveau_actuel)} L
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate(`/cuves/${cuve.id}`)}
                className="btn btn-ghost btn-sm w-full mt-3 gap-2"
              >
                Voir la cuve →
              </button>
            </div>
          )}

          {/* Métadonnées */}
          <div className="bg-white rounded-xl shadow-md p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Hash className="w-5 h-5 text-primary" />
              Métadonnées
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">ID</span>
                <span className="font-mono">#{prix.id}</span>
              </div>
              {prix.created_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Créé le</span>
                  <span>{formatDate(prix.created_at)}</span>
                </div>
              )}
              {prix.created_by_details && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Créé par</span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {prix.created_by_details.full_name || '—'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrixCarburantDetail;