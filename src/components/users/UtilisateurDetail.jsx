// pages/utilisateurs/UtilisateurDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, User, Mail, Phone, Calendar, MapPin,
  Shield, UserCog, Edit, Trash2, Loader2,
  AlertCircle, CheckCircle, XCircle, UserCheck,
  UserX, Clock, Activity, Key, Home
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const UtilisateurDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [showModalStatut, setShowModalStatut] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    chargerUtilisateur();
  }, [id]);

  const chargerUtilisateur = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const response = await AxiosInstance.get(`/users/${id}/`);
      setUtilisateur(response.data);
    } catch (err) {
      console.error('Erreur:', err);
      setErreur(err.response?.data?.error || 'Impossible de charger l\'utilisateur');
      if (err.response?.status === 404) {
        setErreur('Utilisateur non trouvé');
      }
    } finally {
      setChargement(false);
    }
  };

  const basculerStatut = async () => {
    if (!utilisateur) return;
    setChargementAction(true);
    try {
      const nouveauStatut = !utilisateur.is_active;
      await AxiosInstance.patch(`/users/${id}/`, { is_active: nouveauStatut });
      setUtilisateur({ ...utilisateur, is_active: nouveauStatut });
      setShowModalStatut(false);
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.response?.data?.error || 'Erreur lors du changement de statut');
    } finally {
      setChargementAction(false);
    }
  };

  const supprimerUtilisateur = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/users/${id}/`);
      navigate('/utilisateurs');
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
      setShowModalSuppression(false);
    } finally {
      setChargementAction(false);
    }
  };

  const formaterDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formaterDateHeure = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBadgeRole = (role) => {
    const roles = {
      admin: { label: 'Administrateur', couleur: 'error', icone: Shield },
      vendeur: { label: 'Vendeur', couleur: 'primary', icone: UserCog }
    };
    const info = roles[role] || { label: role, couleur: 'gray', icone: User };
    const Icone = info.icone;
    return (
      <span className={`badge badge-${info.couleur} gap-2 text-sm py-3 px-4`}>
        <Icone className="w-4 h-4" />
        {info.label}
      </span>
    );
  };

  const getBadgeStatut = (estActif) => {
    return estActif ? (
      <span className="badge badge-success gap-2 text-sm py-3 px-4">
        <CheckCircle className="w-4 h-4" />
        Actif
      </span>
    ) : (
      <span className="badge badge-error gap-2 text-sm py-3 px-4">
        <XCircle className="w-4 h-4" />
        Inactif
      </span>
    );
  };

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70">{erreur}</p>
        <button onClick={chargerUtilisateur} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  if (!utilisateur) return null;

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/utilisateurs')} 
            className="btn btn-ghost btn-circle"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {utilisateur.username || utilisateur.email}
            </h1>
            <p className="text-base-content/60">
              ID: {utilisateur.id} • Inscrit le {formaterDate(utilisateur.created_at)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowModalStatut(true)}
            className={`btn ${utilisateur.is_active ? 'btn-warning' : 'btn-success'} gap-2`}
          >
            {utilisateur.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            {utilisateur.is_active ? 'Désactiver' : 'Activer'}
          </button>
          <Link
            to={`/utilisateurs/${id}/modifier`}
            className="btn btn-primary gap-2"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </Link>
          <button
            onClick={() => setShowModalSuppression(true)}
            className="btn btn-error gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Informations personnelles
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-sm text-base-content/40">Email</label>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4 text-base-content/40" />
                    {utilisateur.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-base-content/40">Rôle</label>
                  <p>{getBadgeRole(utilisateur.role)}</p>
                </div>
                <div>
                  <label className="text-sm text-base-content/40">Nom d'utilisateur</label>
                  <p className="font-medium">{utilisateur.username || 'Non défini'}</p>
                </div>
                <div>
                  <label className="text-sm text-base-content/40">Statut</label>
                  <p>{getBadgeStatut(utilisateur.is_active)}</p>
                </div>
                {utilisateur.first_name && (
                  <div>
                    <label className="text-sm text-base-content/40">Prénom</label>
                    <p className="font-medium">{utilisateur.first_name}</p>
                  </div>
                )}
                {utilisateur.last_name && (
                  <div>
                    <label className="text-sm text-base-content/40">Nom</label>
                    <p className="font-medium">{utilisateur.last_name}</p>
                  </div>
                )}
                {utilisateur.birthday && (
                  <div>
                    <label className="text-sm text-base-content/40">Date de naissance</label>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-base-content/40" />
                      {formaterDate(utilisateur.birthday)}
                    </p>
                  </div>
                )}
                {utilisateur.phone_number && (
                  <div>
                    <label className="text-sm text-base-content/40">Téléphone</label>
                    <p className="font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4 text-base-content/40" />
                      {utilisateur.phone_number}
                    </p>
                  </div>
                )}
              </div>

              {utilisateur.address && (
                <div className="mt-4 pt-4 border-t border-base-200">
                  <label className="text-sm text-base-content/40">Adresse</label>
                  <p className="font-medium flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-base-content/40 mt-1" />
                    {utilisateur.address}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl mt-6">
            <div className="card-body">
              <h3 className="card-title text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-info" />
                Informations système
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-sm text-base-content/40">Date d'inscription</label>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-base-content/40" />
                    {formaterDateHeure(utilisateur.created_at)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-base-content/40">Dernière mise à jour</label>
                  <p className="font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-base-content/40" />
                    {formaterDateHeure(utilisateur.updated_at)}
                  </p>
                </div>
                {utilisateur.last_login && (
                  <div>
                    <label className="text-sm text-base-content/40">Dernière connexion</label>
                    <p className="font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4 text-base-content/40" />
                      {formaterDateHeure(utilisateur.last_login)}
                    </p>
                  </div>
                )}
                {utilisateur.last_login_ip && (
                  <div>
                    <label className="text-sm text-base-content/40">Dernière IP</label>
                    <p className="font-medium font-mono">{utilisateur.last_login_ip}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-base-content/40">Statut en ligne</label>
                  <p>
                    {utilisateur.is_online ? (
                      <span className="badge badge-success gap-1">
                        <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                        En ligne
                      </span>
                    ) : (
                      <span className="badge badge-ghost">Hors ligne</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-base-content/40">Staff</label>
                  <p>{utilisateur.is_staff ? 'Oui' : 'Non'}</p>
                </div>
                <div>
                  <label className="text-sm text-base-content/40">Superutilisateur</label>
                  <p>{utilisateur.is_superuser ? 'Oui' : 'Non'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body text-center">
              <div className="avatar placeholder">
                <div className={`w-24 h-24 rounded-full mx-auto ${utilisateur.is_active ? 'bg-primary/20' : 'bg-base-300'}`}>
                  <span className={`text-4xl font-bold ${utilisateur.is_active ? 'text-primary' : 'text-base-content/40'}`}>
                    {(utilisateur.username || utilisateur.email).charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <h3 className="text-xl font-bold mt-2">
                {utilisateur.username || utilisateur.email}
              </h3>
              <p className="text-sm text-base-content/40">{utilisateur.email}</p>
              <div className="flex justify-center gap-2 mt-2">
                {getBadgeRole(utilisateur.role)}
                {getBadgeStatut(utilisateur.is_active)}
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl mt-6">
            <div className="card-body">
              <h4 className="font-medium flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                Permissions
              </h4>
              <div className="mt-2 space-y-1">
                {utilisateur.role === 'admin' ? (
                  <>
                    <p className="text-sm flex items-center gap-2 text-success">
                      <CheckCircle className="w-3 h-3" />
                      Accès total
                    </p>
                    <p className="text-sm text-base-content/60 pl-5">
                      • Gestion des utilisateurs<br />
                      • Gestion des produits<br />
                      • Gestion des ventes<br />
                      • Rapports et statistiques
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm flex items-center gap-2 text-info">
                      <CheckCircle className="w-3 h-3" />
                      Accès limité
                    </p>
                    <p className="text-sm text-base-content/60 pl-5">
                      • Voir les produits<br />
                      • Effectuer des ventes<br />
                      • Voir ses propres ventes
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModalSuppression && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSuppression(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer l'utilisateur</h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir supprimer définitivement 
                l'utilisateur <span className="font-bold">{utilisateur.email}</span> ?
                <br />
                <span className="text-error text-sm">Cette action est irréversible !</span>
              </p>
              <div className="flex gap-3">
                <button
                  className="btn flex-1"
                  onClick={() => setShowModalSuppression(false)}
                  disabled={chargementAction}
                >
                  Annuler
                </button>
                <button
                  className="btn btn-error flex-1"
                  onClick={supprimerUtilisateur}
                  disabled={chargementAction}
                >
                  {chargementAction ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Suppression...
                    </>
                  ) : (
                    'Supprimer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModalStatut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalStatut(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full ${utilisateur.is_active ? 'bg-warning/20' : 'bg-success/20'} flex items-center justify-center mx-auto mb-4`}>
                {utilisateur.is_active ? (
                  <UserX className="w-8 h-8 text-warning" />
                ) : (
                  <UserCheck className="w-8 h-8 text-success" />
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">
                {utilisateur.is_active ? 'Désactiver' : 'Activer'} l'utilisateur
              </h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir {utilisateur.is_active ? 'désactiver' : 'activer'} 
                l'utilisateur <span className="font-bold">{utilisateur.email}</span> ?
              </p>
              <div className="flex gap-3">
                <button
                  className="btn flex-1"
                  onClick={() => setShowModalStatut(false)}
                  disabled={chargementAction}
                >
                  Annuler
                </button>
                <button
                  className={`btn flex-1 ${utilisateur.is_active ? 'btn-warning' : 'btn-success'}`}
                  onClick={basculerStatut}
                  disabled={chargementAction}
                >
                  {chargementAction ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Chargement...
                    </>
                  ) : (
                    utilisateur.is_active ? 'Désactiver' : 'Activer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UtilisateurDetails;