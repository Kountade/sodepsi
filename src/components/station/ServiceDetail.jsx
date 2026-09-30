// src/components/station/ServiceDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Wrench, Droplet, Sparkles, Zap, Activity,
  Clock, DollarSign, CheckCircle, AlertCircle, X, Edit,
  Trash2, RefreshCw, TrendingUp, Award, FileText, Hash,
  User, Calendar, Eye
} from 'lucide-react';

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [ventes, setVentes] = useState([]);
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
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : '';

  const TYPE_ICONS = {
    lavage_manuel: Droplet,
    lavage_auto: Sparkles,
    gonflage: Zap,
    vidange: Droplet,
    graissage: Wrench,
    autre: Activity,
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await AxiosInstance.get(`/services/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setService(res.data);

      // Historique des ventes de ce service
      try {
        const ventesRes = await AxiosInstance.get(
          `/ventes-services/?service=${id}`,
          { headers: { Authorization: `Token ${token}` } }
        );
        const data = Array.isArray(ventesRes.data)
          ? ventesRes.data
          : (ventesRes.data.results || []);
        setVentes(data.slice(0, 10));
      } catch (e) { /* ignore */ }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        showNotification('Service introuvable', 'error');
        setTimeout(() => navigate('/services'), 2000);
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

  const handleToggleActif = async () => {
    try {
      const token = getToken();
      await AxiosInstance.patch(`/services/${id}/`, {
        est_actif: !service.est_actif,
      }, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification(
        service.est_actif ? 'Service désactivé' : 'Service activé',
        'success'
      );
      fetchData();
    } catch (err) {
      showNotification('Erreur lors de la mise à jour', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      const token = getToken();
      await AxiosInstance.delete(`/services/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Service supprimé', 'success');
      setTimeout(() => navigate('/services'), 1200);
    } catch (err) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  if (loading || !service) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  const Icon = TYPE_ICONS[service.type_service] || Wrench;
  const totalVentes = ventes.reduce((s, v) => s + parseFloat(v.montant_net || 0), 0);
  const nbVentes = ventes.length;

  return (
    <div className="space-y-4 p-4 sm:p-6 bg-gray-50 min-h-screen">
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
              <p className="text-gray-600">Voulez-vous vraiment supprimer ce service ?</p>
              <p className="font-semibold text-error mt-2">{service.nom}</p>
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
          <button onClick={() => navigate('/services')} className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2 bg-primary/10 rounded-xl">
            <Icon className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-primary">{service.nom}</h1>
            <p className="text-sm text-gray-500">
              {service.code} · {service.type_service_display}
            </p>
          </div>
          <span className={`badge badge-lg ${service.est_actif ? 'badge-success' : 'badge-ghost'} gap-2`}>
            {service.est_actif ? 'Actif' : 'Inactif'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={fetchData} className="btn btn-outline btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
          <button
            onClick={handleToggleActif}
            className={`btn btn-sm gap-2 ${service.est_actif ? 'btn-warning' : 'btn-success'}`}
          >
            {service.est_actif ? 'Désactiver' : 'Activer'}
          </button>
          <button
            onClick={() => navigate(`/services/${id}/modifier`)}
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
              Détails du service
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Prix</p>
                <p className="text-3xl font-black text-primary">
                  {formatNumber(service.prix)} <span className="text-lg">FCFA</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Durée estimée</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-5 h-5 text-warning" />
                  <span className="text-xl font-bold">{service.duree_estimee} min</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Type</p>
                <span className="badge badge-primary badge-lg mt-1">
                  {service.type_service_display}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Statut</p>
                <span className={`badge badge-lg mt-1 ${service.est_actif ? 'badge-success' : 'badge-ghost'}`}>
                  {service.est_actif ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>

            {service.description && (
              <>
                <div className="divider my-4"></div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Description</p>
                  <p className="bg-gray-50 p-3 rounded-lg text-sm">
                    {service.description}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Historique des ventes */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="font-bold">Ventes récentes de ce service</h2>
              </div>
              <span className="badge badge-primary">{nbVentes}</span>
            </div>

            {ventes.length === 0 ? (
              <div className="py-12 text-center">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Aucune vente enregistrée</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th>N° Vente</th>
                      <th className="hidden md:table-cell">Date</th>
                      <th className="text-right">Quantité</th>
                      <th className="text-right">Montant net</th>
                      <th className="text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventes.map(v => (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="font-medium text-sm">{v.numero_vente}</td>
                        <td className="hidden md:table-cell text-sm text-gray-600">
                          {formatDate(v.date_vente)}
                        </td>
                        <td className="text-right">{v.quantite}</td>
                        <td className="text-right font-bold text-success">
                          {formatCurrency(v.montant_net)}
                        </td>
                        <td className="text-center">
                          <span className={`badge badge-sm ${v.est_paye ? 'badge-success' : 'badge-warning'}`}>
                            {v.est_paye ? 'Payé' : 'En attente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-4">

          {/* Stats */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl shadow-md p-5 border-t-4 border-primary">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Statistiques
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Total ventes</span>
                <span className="text-xl font-black text-primary">{nbVentes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">CA généré</span>
                <span className="text-lg font-bold text-success">
                  {formatCurrency(totalVentes)}
                </span>
              </div>
              {nbVentes > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Ticket moyen</span>
                  <span className="font-semibold">
                    {formatCurrency(totalVentes / nbVentes)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-md p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Actions rapides
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/ventes-services/nouveau')}
                className="btn btn-primary w-full gap-2 justify-start"
              >
                <TrendingUp className="w-4 h-4" /> Nouvelle vente
              </button>
              <button
                onClick={() => navigate(`/ventes-services?service=${service.id}`)}
                className="btn btn-outline w-full gap-2 justify-start"
              >
                <Eye className="w-4 h-4" /> Voir toutes les ventes
              </button>
            </div>
          </div>

          {/* Métadonnées */}
          <div className="bg-white rounded-xl shadow-md p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Hash className="w-5 h-5 text-primary" />
              Métadonnées
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">ID</span>
                <span className="font-mono">#{service.id}</span>
              </div>
              {service.created_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Créé le</span>
                  <span>{formatDate(service.created_at)}</span>
                </div>
              )}
              {service.updated_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Modifié le</span>
                  <span>{formatDate(service.updated_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;