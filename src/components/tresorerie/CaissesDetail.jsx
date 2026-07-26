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

  useEffect(() => {
    const fetchCaisse = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        const response = await AxiosInstance.get(`/caisses/${id}/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        setCaisse(response.data);
      } catch (err) {
        console.error('Erreur chargement caisse:', err);
        setError(
          err.response?.status === 404
            ? 'Caisse introuvable'
            : 'Erreur de chargement des données'
        );
        if (err.response?.status === 401) {
          // Token expiré, rediriger vers login
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCaisse();
  }, [id, navigate]);

  // Affichage du chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement de la caisse...</p>
        </div>
      </div>
    );
  }

  // Affichage de l'erreur
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

  // Si la caisse est null (cas improbable)
  if (!caisse) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  // Rendu principal
  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header */}
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
                    {caisse.nom}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Code: {caisse.code} • {caisse.warehouse_name || 'Entrepôt inconnu'}
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

      {/* Contenu détail - en cartes 3 colonnes */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Carte 1 : Informations générales */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> Informations générales
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Code</p>
                  <p className="font-medium">{caisse.code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nom</p>
                  <p className="font-medium">{caisse.nom}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium capitalize">{caisse.type_caisse}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Entrepôt</p>
                  <p className="font-medium">
                    {caisse.warehouse_name || caisse.warehouse || 'Non défini'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Responsable</p>
                  <p className="font-medium">{caisse.responsable || 'Non défini'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Devise</p>
                  <p className="font-medium">{caisse.devise || 'XOF'}</p>
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
                  <p className="font-medium">{caisse.description || 'Aucune'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Carte 2 : Paramètres financiers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> Paramètres financiers
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Solde initial</p>
                  <p className="font-medium text-lg text-primary">
                    {Number(caisse.solde_initial).toLocaleString()} {caisse.devise || 'XOF'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Solde actuel</p>
                  <p className="font-medium text-lg text-success">
                    {Number(caisse.solde_actuel).toLocaleString()} {caisse.devise || 'XOF'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Seuil minimum (alerte)</p>
                  <p className="font-medium">
                    {Number(caisse.seuil_min).toLocaleString()} {caisse.devise || 'XOF'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Seuil maximum (plafond)</p>
                  <p className="font-medium">
                    {Number(caisse.seuil_max).toLocaleString()} {caisse.devise || 'XOF'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Carte 3 : Métadonnées */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Métadonnées
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Créée le</p>
                  <p className="font-medium">
                    {caisse.created_at ? new Date(caisse.created_at).toLocaleDateString() : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dernière modification</p>
                  <p className="font-medium">
                    {caisse.updated_at ? new Date(caisse.updated_at).toLocaleDateString() : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Créée par</p>
                  <p className="font-medium">{caisse.created_by || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaissesDetail;