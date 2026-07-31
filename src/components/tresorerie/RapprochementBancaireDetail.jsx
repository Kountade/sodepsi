// src/components/tresorerie/RapprochementBancaireDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Building2, Calendar, DollarSign, FileText,
  RefreshCw, CheckCircle, AlertCircle, X, Edit, Trash2,
  Printer, Download, TrendingUp, TrendingDown, Clock
} from 'lucide-react';

const RapprochementBancaireDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rapprochement, setRapprochement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warehouseName, setWarehouseName] = useState('');
  const [compteName, setCompteName] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/rapprochements/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setRapprochement(response.data);

      // Récupérer les noms de l'entrepôt et du compte
      try {
        const [whRes, cptRes] = await Promise.all([
          AxiosInstance.get(`/warehouses/${response.data.warehouse}/`, {
            headers: { 'Authorization': `Token ${token}` }
          }),
          AxiosInstance.get(`/comptes-bancaires/${response.data.compte_bancaire}/`, {
            headers: { 'Authorization': `Token ${token}` }
          })
        ]);
        setWarehouseName(whRes.data.name);
        setCompteName(`${cptRes.data.banque} - ${cptRes.data.nom} (${cptRes.data.numero_compte})`);
      } catch {
        setWarehouseName(response.data.warehouse);
        setCompteName(response.data.compte_bancaire);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Impossible de charger les détails de ce rapprochement.');
      showNotification('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  // Valider le rapprochement
  const handleValider = async () => {
    if (!window.confirm('Voulez-vous valider ce rapprochement ?')) return;
    try {
      const token = getToken();
      await AxiosInstance.post(`/rapprochements/${id}/valider_rapprochement/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Rapprochement validé avec succès', 'success');
      fetchDetail();
    } catch (error) {
      showNotification('Erreur lors de la validation', 'error');
    }
  };

  // Supprimer
  const handleDelete = async () => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce rapprochement ?')) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/rapprochements/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Rapprochement supprimé avec succès', 'success');
      setTimeout(() => navigate('/rapprochement-bancaire'), 1500);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return Number(num).toLocaleString();
  };

  const formatCurrency = (num) => `${formatNumber(num)} FCFA`;

  const getStatusBadge = (status) => {
    const map = {
      'brouillon': { label: 'Brouillon', color: 'badge-ghost' },
      'en_cours': { label: 'En cours', color: 'badge-warning' },
      'partiel': { label: 'Partiel', color: 'badge-info' },
      'complete': { label: 'Complet', color: 'badge-success' },
      'ecart': { label: 'Écart', color: 'badge-error' },
    };
    const info = map[status] || { label: status, color: 'badge-ghost' };
    return <span className={`badge ${info.color} text-sm py-2 px-4`}>{info.label}</span>;
  };

  const isRapproche = (item) => {
    return Math.abs(parseFloat(item?.ecart || 0)) < 1;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (error || !rapprochement) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-error" />
          <p className="text-xl font-semibold text-gray-700">{error || 'Rapprochement non trouvé'}</p>
          <button onClick={() => navigate('/rapprochement-bancaire')} className="btn btn-primary gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour à la liste
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
            <button onClick={() => navigate('/rapprochement-bancaire')} className="btn btn-ghost btn-sm gap-2 mb-2">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-primary">Rapprochement bancaire</h1>
                <p className="text-sm text-gray-500">
                  {rapprochement.reference} – {compteName}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchDetail} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            {rapprochement.status !== 'complete' && (
              <button onClick={handleValider} className="btn btn-sm sm:btn-md btn-success gap-2">
                <CheckCircle className="w-4 h-4" /> Valider
              </button>
            )}
            <button onClick={() => navigate(`/rapprochement-bancaire/modifier/${id}`)} className="btn btn-sm sm:btn-md btn-warning gap-2">
              <Edit className="w-4 h-4" /> Modifier
            </button>
            <button onClick={handleDelete} className="btn btn-sm sm:btn-md btn-error gap-2">
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* Cartes récapitulatives */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Solde comptable</p>
              <p className="text-2xl font-bold">{formatCurrency(rapprochement.solde_comptable)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Solde bancaire</p>
              <p className="text-2xl font-bold">{formatCurrency(rapprochement.solde_bancaire)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Écart</p>
              <p className={`text-2xl font-bold ${isRapproche(rapprochement) ? 'text-success' : 'text-error'}`}>
                {formatCurrency(rapprochement.ecart)}
                {!isRapproche(rapprochement) && <span className="text-sm ml-1">⚠️</span>}
              </p>
            </div>
            {isRapproche(rapprochement) ? (
              <CheckCircle className="w-8 h-8 text-success/20" />
            ) : (
              <AlertCircle className="w-8 h-8 text-error/20" />
            )}
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Statut</p>
              <div className="mt-1">{getStatusBadge(rapprochement.status)}</div>
            </div>
            <Clock className="w-8 h-8 text-primary/20" />
          </div>
        </div>
      </div>

      {/* Détails du rapprochement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations générales */}
        <div className="bg-white shadow-md rounded-xl p-5">
          <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Informations générales
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Référence</span>
              <span className="font-mono font-bold">{rapprochement.reference}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Entrepôt</span>
              <span>{warehouseName}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Compte bancaire</span>
              <span>{compteName}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Période</span>
              <span>{rapprochement.date_debut} → {rapprochement.date_fin}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Statut</span>
              <span>{getStatusBadge(rapprochement.status)}</span>
            </div>
          </div>
        </div>

        {/* Détails des écarts */}
        <div className="bg-white shadow-md rounded-xl p-5">
          <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Détail des écarts
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Solde comptable</span>
              <span className="font-bold">{formatCurrency(rapprochement.solde_comptable)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Solde bancaire</span>
              <span className="font-bold">{formatCurrency(rapprochement.solde_bancaire)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">En-cours d'émission</span>
              <span>{formatCurrency(rapprochement.encours_emission)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">En-cours d'encaissement</span>
              <span>{formatCurrency(rapprochement.encours_encaissement)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Commissions bancaires</span>
              <span>{formatCurrency(rapprochement.commissions)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Autres écarts</span>
              <span>{formatCurrency(rapprochement.autres_ecarts)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-bold">Écart</span>
              <span className={`font-bold ${isRapproche(rapprochement) ? 'text-success' : 'text-error'}`}>
                {formatCurrency(rapprochement.ecart)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t">
              <span className="text-gray-600 font-bold">Solde rapproché</span>
              <span className="font-bold text-primary">{formatCurrency(rapprochement.solde_rapproche)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {rapprochement.notes && (
        <div className="bg-white shadow-md rounded-xl p-5">
          <h2 className="text-lg font-bold text-primary mb-2">Notes</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{rapprochement.notes}</p>
        </div>
      )}

      {/* Métadonnées */}
      <div className="bg-white shadow-md rounded-xl p-5 text-sm text-gray-500">
        <div className="grid grid-cols-2 gap-4">
          <div><span className="font-semibold">Créé le :</span> {new Date(rapprochement.created_at).toLocaleString()}</div>
          <div><span className="font-semibold">Mis à jour :</span> {new Date(rapprochement.updated_at).toLocaleString()}</div>
          {rapprochement.date_validation && (
            <div><span className="font-semibold">Validé le :</span> {new Date(rapprochement.date_validation).toLocaleString()}</div>
          )}
          {rapprochement.valide_par && (
            <div><span className="font-semibold">Validé par :</span> {rapprochement.valide_par}</div>
          )}
          <div><span className="font-semibold">ID :</span> {rapprochement.id}</div>
        </div>
      </div>
    </div>
  );
};

export default RapprochementBancaireDetail;