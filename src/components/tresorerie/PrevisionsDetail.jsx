// src/components/tresorerie/PrevisionsDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Calendar, DollarSign, TrendingUp, TrendingDown,
  RefreshCw, Edit, Trash2, AlertCircle, CheckCircle, X,
  BarChart3, Clock, Tag, Percent, FileText, Building2
} from 'lucide-react';

const PrevisionsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prevision, setPrevision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warehouseName, setWarehouseName] = useState('');
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

      const response = await AxiosInstance.get(`/previsions/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setPrevision(response.data);

      // Le serializer renvoie deja warehouse_nom, mais on garde un fallback
      if (response.data.warehouse_nom) {
        setWarehouseName(response.data.warehouse_nom);
      } else if (response.data.warehouse_name) {
        setWarehouseName(response.data.warehouse_name);
      } else if (response.data.warehouse) {
        setWarehouseName(String(response.data.warehouse));
      }
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 404) {
        setError('Prevision introuvable');
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
        return;
      } else {
        setError('Impossible de charger les details de cette prevision.');
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

  const handleDelete = async () => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette prevision ?')) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/previsions/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Prevision supprimee avec succes', 'success');
      setTimeout(() => navigate('/previsions'), 1500);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const getTypeBadge = (type) => {
    const map = {
      'entree': { label: 'Entree prevue', color: 'badge-success' },
      'sortie': { label: 'Sortie prevue', color: 'badge-error' }
    };
    const info = map[type] || { label: type, color: 'badge-ghost' };
    return <span className={`badge ${info.color} text-sm py-2 px-4`}>{info.label}</span>;
  };

  const getPeriodeLabel = (periode) => {
    const map = {
      'journalier': 'Journalier',
      'hebdomadaire': 'Hebdomadaire',
      'mensuel': 'Mensuel',
      'trimestriel': 'Trimestriel',
      'annuel': 'Annuel'
    };
    return map[periode] || periode;
  };

  const getStatusBadge = (status) => {
    const map = {
      'brouillon': { label: 'Brouillon', color: 'badge-ghost' },
      'en_cours': { label: 'En cours', color: 'badge-warning' },
      'valide': { label: 'Validee', color: 'badge-info' },
      'realise': { label: 'Realise', color: 'badge-success' },
      'annule': { label: 'Annule', color: 'badge-error' },
      'ecart': { label: 'Ecart constate', color: 'badge-error' }
    };
    const info = map[status] || { label: status, color: 'badge-ghost' };
    return <span className={`badge ${info.color} text-sm py-2 px-4`}>{info.label}</span>;
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

  if (error || !prevision) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-error" />
          <p className="text-xl font-semibold text-gray-700">{error || 'Prevision non trouvee'}</p>
          <button onClick={() => navigate('/previsions')} className="btn btn-primary gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour a la liste
          </button>
        </div>
      </div>
    );
  }

  const isEcart = parseFloat(prevision.ecart || 0) !== 0;
  const ecartPositive = parseFloat(prevision.ecart || 0) > 0;

  // Valeurs derivees pour l'affichage
  const warehouseLabel = warehouseName || prevision.warehouse_nom || prevision.warehouse_name || prevision.warehouse || '-';

  const createdByLabel = prevision.created_by_name
    || (typeof prevision.created_by === 'object' && prevision.created_by !== null
        ? prevision.created_by.full_name || prevision.created_by.username
        : prevision.created_by)
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
            <button onClick={() => navigate('/previsions')} className="btn btn-ghost btn-sm gap-2 mb-2">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <BarChart3 className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-primary">Prevision de tresorerie</h1>
                <p className="text-sm text-gray-500">
                  {prevision.reference} - {prevision.titre}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchDetail} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={() => navigate(`/previsions/modifier/${id}`)} className="btn btn-sm sm:btn-md btn-warning gap-2">
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
              <p className="text-xs text-gray-500">Montant prevu</p>
              <p className="text-2xl font-bold">{formatCurrency(prevision.montant_prevu)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Montant reel</p>
              <p className="text-2xl font-bold">{formatCurrency(prevision.montant_reel)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Ecart</p>
              <p className={`text-2xl font-bold ${isEcart ? (ecartPositive ? 'text-success' : 'text-error') : 'text-gray-500'}`}>
                {formatCurrency(prevision.ecart)}
              </p>
            </div>
            {isEcart ? (
              ecartPositive ? <TrendingUp className="w-8 h-8 text-success/20" /> : <TrendingDown className="w-8 h-8 text-error/20" />
            ) : (
              <CheckCircle className="w-8 h-8 text-gray-300" />
            )}
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Probabilite</p>
              <p className="text-2xl font-bold">{prevision.probabilite || 0}%</p>
            </div>
            <Percent className="w-8 h-8 text-primary/20" />
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations generales */}
        <div className="bg-white shadow-md rounded-xl p-5">
          <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Informations generales
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Reference</span>
              <span className="font-mono font-bold">{prevision.reference}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Titre</span>
              <span className="font-bold">{prevision.titre}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Entrepot</span>
              <span>{warehouseLabel}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Type</span>
              <span>{getTypeBadge(prevision.type_prevision)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Periode</span>
              <span>{getPeriodeLabel(prevision.periode)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Statut</span>
              <span>{getStatusBadge(prevision.statut)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Probabilite</span>
              <span>{prevision.probabilite || 0}%</span>
            </div>
          </div>
        </div>

        {/* Periode et ecarts */}
        <div className="bg-white shadow-md rounded-xl p-5">
          <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Periode & ecarts
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Date debut</span>
              <span>{prevision.date_debut}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Date fin</span>
              <span>{prevision.date_fin}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Montant prevu</span>
              <span className="font-bold">{formatCurrency(prevision.montant_prevu)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Montant reel</span>
              <span className="font-bold">{formatCurrency(prevision.montant_reel)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Ecart</span>
              <span className={`font-bold ${isEcart ? (ecartPositive ? 'text-success' : 'text-error') : 'text-gray-500'}`}>
                {formatCurrency(prevision.ecart)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">% Ecart</span>
              <span className={`font-bold ${isEcart ? (ecartPositive ? 'text-success' : 'text-error') : 'text-gray-500'}`}>
                {prevision.pourcentage_ecart ? `${Number(prevision.pourcentage_ecart).toFixed(2)}%` : '0%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Categorie et source */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-xl p-5">
          <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5" /> Categorisation
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Categorie</span>
              <span>{prevision.categorie || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Sous-categorie</span>
              <span>{prevision.sous_categorie || '-'}</span>
            </div>
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-5">
          <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" /> Source
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Type source</span>
              <span>{prevision.source_type || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ID source</span>
              <span>{prevision.source_id || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {prevision.notes && (
        <div className="bg-white shadow-md rounded-xl p-5">
          <h2 className="text-lg font-bold text-primary mb-2">Notes</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{prevision.notes}</p>
        </div>
      )}

      {/* Metadonnees */}
      <div className="bg-white shadow-md rounded-xl p-5 text-sm text-gray-500">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-semibold">Cree le :</span>{' '}
            {prevision.created_at ? new Date(prevision.created_at).toLocaleString('fr-FR') : '-'}
          </div>
          <div>
            <span className="font-semibold">Mis a jour :</span>{' '}
            {prevision.updated_at ? new Date(prevision.updated_at).toLocaleString('fr-FR') : '-'}
          </div>
          <div>
            <span className="font-semibold">Cree par :</span> {createdByLabel}
          </div>
          <div>
            <span className="font-semibold">ID :</span> {prevision.id}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrevisionsDetail;