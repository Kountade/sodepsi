// src/components/tresorerie/CompteBancaireDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Edit, Loader2, AlertCircle,
  Building2, Banknote, User, DollarSign,
  CreditCard, CheckCircle, XCircle,
  Calendar, Clock, Layers, Hash
} from 'lucide-react';

const CompteBancaireDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [compte, setCompte] = useState(null);
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
  // CHARGEMENT DU COMPTE
  // ============================================================
  useEffect(() => {
    let isMounted = true;

    const fetchCompte = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await AxiosInstance.get(`/comptes-bancaires/${id}/`, {
          headers: { 'Authorization': `Token ${token}` }
        });

        if (!isMounted) return;
        setCompte(response.data);
      } catch (err) {
        console.error('Erreur chargement compte:', err);

        if (!isMounted) return;

        if (err.response?.status === 404) {
          setError('Compte bancaire introuvable');
        } else if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/login');
          return;
        } else {
          setError('Erreur de chargement des donnees');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) {
      fetchCompte();
    }

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  // ============================================================
  // CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement du compte...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERREUR
  // ============================================================
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <AlertCircle className="text-error w-16 h-16 mx-auto" />
          <p className="text-lg font-semibold text-error">{error}</p>
          <button
            onClick={() => navigate('/comptes-bancaires')}
            className="btn btn-primary gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Retour a la liste
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // COMPTE NULL
  // ============================================================
  if (!compte) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <AlertCircle className="text-warning w-16 h-16 mx-auto" />
          <p className="text-gray-500">Aucune donnee disponible</p>
          <button
            onClick={() => navigate('/comptes-bancaires')}
            className="btn btn-primary gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Retour a la liste
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // VALEURS DERIVEES (safe)
  // ============================================================
  const devise = compte.devise || 'XOF';

  const warehouseLabel = compte.warehouse_name
    ? `${compte.warehouse_name}${compte.warehouse_code ? ` (${compte.warehouse_code})` : ''}`
    : (typeof compte.warehouse === 'object' && compte.warehouse !== null
        ? compte.warehouse.name
        : compte.warehouse || 'Non defini');

  const createdByLabel = compte.created_by_name
    || (typeof compte.created_by === 'object' && compte.created_by !== null
        ? compte.created_by.full_name || compte.created_by.username
        : compte.created_by)
    || '-';

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* ================= HEADER ================= */}
      <div className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/comptes-bancaires')}
                className="btn btn-ghost btn-sm gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/15 rounded-xl">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {compte.nom || 'Compte sans nom'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {compte.banque || '-'} • {compte.code || '-'} • {warehouseLabel}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/comptes-bancaires/modifier/${compte.id}`)}
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

          {/* ---------- Carte 1 : Informations generales ---------- */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Informations generales
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Code</p>
                  <p className="font-medium">{compte.code || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Banque</p>
                  <p className="font-medium">{compte.banque || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nom du compte</p>
                  <p className="font-medium">{compte.nom || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium capitalize">{compte.type_compte || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Entrepot</p>
                  <p className="font-medium">{warehouseLabel}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Devise</p>
                  <p className="font-medium">{devise}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <p className="font-medium">
                    {compte.is_active ? (
                      <span className="badge badge-success gap-1">
                        <CheckCircle className="w-3 h-3" /> Actif
                      </span>
                    ) : (
                      <span className="badge badge-error gap-1">
                        <XCircle className="w-3 h-3" /> Inactif
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Compte par defaut</p>
                  <p className="font-medium">
                    {compte.is_default ? (
                      <span className="badge badge-primary">Oui</span>
                    ) : (
                      <span className="badge badge-ghost">Non</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date d'ouverture</p>
                  <p className="font-medium">
                    {compte.date_ouverture
                      ? new Date(compte.date_ouverture).toLocaleDateString('fr-FR')
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- Carte 2 : Details bancaires ---------- */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                Details bancaires
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Numero de compte</p>
                  <p className="font-mono font-medium">{compte.numero_compte || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">IBAN</p>
                  <p className="font-mono font-medium">{compte.iban || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">BIC / SWIFT</p>
                  <p className="font-mono font-medium">{compte.bic || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- Carte 3 : Solde et metadonnees ---------- */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Solde et metadonnees
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Solde initial</p>
                  <p className="font-medium text-primary">
                    {formatNumber(compte.solde_initial, devise)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Solde actuel</p>
                  <p className="font-medium text-success text-lg">
                    {formatNumber(compte.solde_actuel, devise)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cree le</p>
                  <p className="font-medium">
                    {compte.created_at
                      ? new Date(compte.created_at).toLocaleDateString('fr-FR')
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Derniere modification</p>
                  <p className="font-medium">
                    {compte.updated_at
                      ? new Date(compte.updated_at).toLocaleDateString('fr-FR')
                      : '-'}
                  </p>
                </div>
              </div>

              {compte.description && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-medium">{compte.description}</p>
                </div>
              )}

              {createdByLabel !== '-' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">Cree par</p>
                  <p className="font-medium">{createdByLabel}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CompteBancaireDetail;