// src/components/tresorerie/CaissesDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Edit, Loader2, AlertCircle,
  Banknote, Building2, User, DollarSign,
  AlertTriangle, Shield, CheckCircle, XCircle,
  Calendar, Clock, Hash, Layers
} from 'lucide-react';

const CaissesDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [caisse, setCaisse] = useState(null);
  const [error, setError] = useState(null);

  const getToken = () => localStorage.getItem('Token');

  // ============================================================
  // FORMATAGE DES NOMBRES
  // ============================================================
  const formatNumber = (value, devise = 'XOF') => {
    const num = parseFloat(value);
    if (isNaN(num)) return `0 ${devise}`;
    return `${num.toLocaleString('fr-FR')} ${devise}`;
  };

  // ============================================================
  // CHARGEMENT DE LA CAISSE
  // ============================================================
  useEffect(() => {
    let isMounted = true;

    const fetchCaisse = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await AxiosInstance.get(`/caisses/${id}/`, {
          headers: { 'Authorization': `Token ${token}` }
        });

        if (!isMounted) return;
        setCaisse(response.data);
      } catch (err) {
        console.error('Erreur chargement caisse:', err);

        if (!isMounted) return;

        if (err.response?.status === 404) {
          setError('Caisse introuvable');
        } else if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/login');
          return;
        } else {
          setError('Erreur de chargement des données');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) {
      fetchCaisse();
    }

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  // ============================================================
  // AFFICHAGE DU CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">
            Chargement de la caisse...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // AFFICHAGE DE L'ERREUR
  // ============================================================
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <AlertCircle className="text-error w-16 h-16 mx-auto" />
          <p className="text-lg font-semibold text-error">{error}</p>
          <button
            onClick={() => navigate('/caisses')}
            className="btn btn-primary gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // SI LA CAISSE EST NULL
  // ============================================================
  if (!caisse) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <AlertCircle className="text-warning w-16 h-16 mx-auto" />
          <p className="text-gray-500">Aucune donnée disponible</p>
          <button
            onClick={() => navigate('/caisses')}
            className="btn btn-primary gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // VALEURS DERIVEES (safe)
  // ============================================================
  const devise = caisse.devise || 'XOF';
  const warehouseLabel = caisse.warehouse_name
    ? `${caisse.warehouse_name}${caisse.warehouse_code ? ` (${caisse.warehouse_code})` : ''}`
    : (typeof caisse.warehouse === 'object' && caisse.warehouse !== null
        ? caisse.warehouse.name
        : caisse.warehouse || 'Non défini');

  const responsableLabel = caisse.responsable_name
    || (typeof caisse.responsable === 'object' && caisse.responsable !== null
        ? caisse.responsable.full_name || caisse.responsable.username
        : caisse.responsable)
    || 'Non défini';

  const createdByLabel = caisse.created_by_name
    || (typeof caisse.created_by === 'object' && caisse.created_by !== null
        ? caisse.created_by.full_name || caisse.created_by.username
        : caisse.created_by)
    || '-';

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* ================= HEADER ================= */}
      <div className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/caisses')}
                className="btn btn-ghost btn-sm gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/15 rounded-xl">
                  <Banknote className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {caisse.nom || 'Caisse sans nom'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Code: {caisse.code || '-'} • {warehouseLabel}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/caisses/modifier/${caisse.id}`)}
                className="btn btn-primary btn-sm gap-2"
              >
                <Edit className="w-4 h-4" /> Modifier
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= CONTENU ================= */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">

          {/* ---------- Carte 1 : Informations générales ---------- */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Informations générales
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Code</p>
                  <p className="font-medium">{caisse.code || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nom</p>
                  <p className="font-medium">{caisse.nom || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium capitalize">
                    {caisse.type_caisse || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Entrepôt</p>
                  <p className="font-medium">{warehouseLabel}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Responsable</p>
                  <p className="font-medium">{responsableLabel}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Devise</p>
                  <p className="font-medium">{devise}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <p className="font-medium">
                    {caisse.is_active ? (
                      <span className="badge badge-success gap-1">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="badge badge-error gap-1">
                        <XCircle className="w-3 h-3" /> Inactive
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Caisse par défaut</p>
                  <p className="font-medium">
                    {caisse.is_default ? (
                      <span className="badge badge-primary">Oui</span>
                    ) : (
                      <span className="badge badge-ghost">Non</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-medium">
                    {caisse.description || 'Aucune'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- Carte 2 : Paramètres financiers ---------- */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Paramètres financiers
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Solde initial</p>
                  <p className="font-medium text-lg text-primary">
                    {formatNumber(caisse.solde_initial, devise)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Solde actuel</p>
                  <p className="font-medium text-lg text-success">
                    {formatNumber(caisse.solde_actuel, devise)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    Seuil minimum (alerte)
                  </p>
                  <p className="font-medium">
                    {formatNumber(caisse.seuil_min, devise)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    Seuil maximum (plafond)
                  </p>
                  <p className="font-medium">
                    {formatNumber(caisse.seuil_max, devise)}
                  </p>
                </div>
              </div>

              {/* Alertes */}
              {(caisse.est_sous_seuil_min || caisse.est_sur_seuil_max) && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                  {caisse.est_sous_seuil_min && (
                    <span className="badge badge-error gap-1">
                      <AlertTriangle className="w-3 h-3" /> Solde sous le seuil minimum
                    </span>
                  )}
                  {caisse.est_sur_seuil_max && (
                    <span className="badge badge-warning gap-1">
                      <AlertTriangle className="w-3 h-3" /> Solde au-dessus du seuil maximum
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ---------- Carte 3 : Métadonnées ---------- */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Métadonnées
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Créée le</p>
                  <p className="font-medium">
                    {caisse.created_at
                      ? new Date(caisse.created_at).toLocaleDateString('fr-FR')
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dernière modification</p>
                  <p className="font-medium">
                    {caisse.updated_at
                      ? new Date(caisse.updated_at).toLocaleDateString('fr-FR')
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Créée par</p>
                  <p className="font-medium">{createdByLabel}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- Carte 4 : Statistiques ---------- */}
          {caisse.total_mouvements !== undefined && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary" />
                  Statistiques
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-primary/5 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Total mouvements</p>
                    <p className="font-bold text-2xl text-primary">
                      {caisse.total_mouvements || 0}
                    </p>
                  </div>
                  {caisse.est_sous_seuil_min !== undefined && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">État seuil minimum</p>
                      <p className={`font-bold text-2xl ${caisse.est_sous_seuil_min ? 'text-error' : 'text-success'}`}>
                        {caisse.est_sous_seuil_min ? 'Alerte' : 'OK'}
                      </p>
                    </div>
                  )}
                  {caisse.est_sur_seuil_max !== undefined && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">État seuil maximum</p>
                      <p className={`font-bold text-2xl ${caisse.est_sur_seuil_max ? 'text-warning' : 'text-success'}`}>
                        {caisse.est_sur_seuil_max ? 'Alerte' : 'OK'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CaissesDetail;