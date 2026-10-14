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
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const getToken = () => localStorage.getItem('Token');

  // ============================================================
  // FORMATAGE DES NOMBRES
  // ============================================================
  const formatNumber = (value, devise = 'FCFA') => {
    const num = parseFloat(value);
    if (isNaN(num)) return `0 ${devise}`;
    return `${num.toLocaleString('fr-FR')} ${devise}`;
  };

  const formatCurrency = (num) => formatNumber(num, 'FCFA');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await AxiosInstance.get(`/rapprochements/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setRapprochement(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 404) {
        setError('Rapprochement introuvable');
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
        return;
      } else {
        setError('Impossible de charger les details de ce rapprochement.');
      }
      showNotification('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Valider le rapprochement
  const handleValider = async () => {
    if (!window.confirm('Voulez-vous valider ce rapprochement ?')) return;
    try {
      const token = getToken();
      await AxiosInstance.post(`/rapprochements/${id}/valider_rapprochement/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Rapprochement valide avec succes', 'success');
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
      showNotification('Rapprochement supprime avec succes', 'success');
      setTimeout(() => navigate('/rapprochement-bancaire'), 1500);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'brouillon': { label: 'Brouillon', color: 'badge-ghost' },
      'en_cours': { label: 'En cours', color: 'badge-warning' },
      'partiel': { label: 'Partiel', color: 'badge-info' },
      'complete': { label: 'Complet', color: 'badge-success' },
      'ecart': { label: 'Ecart', color: 'badge-error' },
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
          <p className="text-base font-semibold text-gray-500">Chargement des details...</p>
        </div>
      </div>
    );
  }

  if (error || !rapprochement) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-error" />
          <p className="text-xl font-semibold text-gray-700">{error || 'Rapprochement non trouve'}</p>
          <button onClick={() => navigate('/rapprochement-bancaire')} className="btn btn-primary gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour a la liste
          </button>
        </div>
      </div>
    );
  }

  // Valeurs derivees
  const warehouseLabel = rapprochement.warehouse_nom
    || rapprochement.warehouse_name
    || (typeof rapprochement.warehouse === 'object' && rapprochement.warehouse !== null
        ? rapprochement.warehouse.name
        : rapprochement.warehouse || '-');

  const compteLabel = rapprochement.compte_bancaire_nom
    || rapprochement.compte_name
    || (typeof rapprochement.compte_bancaire === 'object' && rapprochement.compte_bancaire !== null
        ? `${rapprochement.compte_bancaire.banque} - ${rapprochement.compte_bancaire.nom}`
        : rapprochement.compte_bancaire || '-');

  const valideParLabel = rapprochement.valide_par_name
    || (typeof rapprochement.valide_par === 'object' && rapprochement.valide_par !== null
        ? rapprochement.valide_par.full_name || rapprochement.valide_par.username
        : rapprochement.valide_par)
    || '-';

  const createdByLabel = rapprochement.created_by_name
    || (typeof rapprochement.created_by === 'object' && rapprochement.created_by !== null
        ? rapprochement.created_by.full_name || rapprochement.created_by.username
        : rapprochement.created_by)
    || '-';

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

      {/* En-tete */}
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
                  {rapprochement.reference} - {compteLabel}
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

      {/* Cartes recapitulatives */}
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
              <p className="text-xs text-gray-500">Ecart</p>
              <p className={`text-2xl font-bold ${isRapproche(rapprochement) ? 'text-success' : 'text-error'}`}>
                {formatCurrency(rapprochement.ecart)}
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

      {/* Details du rapprochement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations generales */}
        <div className="bg-white shadow-md rounded-xl p-5">
          <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Informations generales
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Reference</span>
              <span className="font-mono font-bold">{rapprochement.reference}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Entrepot</span>
              <span>{warehouseLabel}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Compte bancaire</span>
              <span>{compteLabel}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Periode</span>
              <span>{rapprochement.date_debut} - {rapprochement.date_fin}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Statut</span>
              <span>{getStatusBadge(rapprochement.status)}</span>
            </div>
          </div>
        </div>

        {/* Details des ecarts */}
        <div className="bg-white shadow-md rounded-xl p-5">
          <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Detail des ecarts
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
              <span className="text-gray-600">En-cours d'emission</span>
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
              <span className="text-gray-600">Autres ecarts</span>
              <span>{formatCurrency(rapprochement.autres_ecarts)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-bold">Ecart</span>
              <span className={`font-bold ${isRapproche(rapprochement) ? 'text-success' : 'text-error'}`}>
                {formatCurrency(rapprochement.ecart)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t">
              <span className="text-gray-600 font-bold">Solde rapproche</span>
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

      {/* Metadonnees */}
      <div className="bg-white shadow-md rounded-xl p-5 text-sm text-gray-500">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-semibold">Cree le :</span>{' '}
            {rapprochement.created_at ? new Date(rapprochement.created_at).toLocaleString('fr-FR') : '-'}
          </div>
          <div>
            <span className="font-semibold">Mis a jour :</span>{' '}
            {rapprochement.updated_at ? new Date(rapprochement.updated_at).toLocaleString('fr-FR') : '-'}
          </div>
          {rapprochement.date_validation && (
            <div>
              <span className="font-semibold">Valide le :</span>{' '}
              {new Date(rapprochement.date_validation).toLocaleString('fr-FR')}
            </div>
          )}
          <div>
            <span className="font-semibold">Valide par :</span> {valideParLabel}
          </div>
          <div>
            <span className="font-semibold">Cree par :</span> {createdByLabel}
          </div>
          <div>
            <span className="font-semibold">ID :</span> {rapprochement.id}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RapprochementBancaireDetail;