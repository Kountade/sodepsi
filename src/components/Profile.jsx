// pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Mail, Phone, Calendar, MapPin, Edit,
  Save, Loader2, AlertCircle, CheckCircle,
  Shield, UserCog, Key, Lock, ArrowLeft
} from 'lucide-react';
import AxiosInstance from './AxiosInstance';

const Profile = () => {
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(true);
  const [chargementSauvegarde, setChargementSauvegarde] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);
  const [enEdition, setEnEdition] = useState(false);
  const [profile, setProfile] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    address: '',
    birthday: '',
    role: '',
    is_active: true
  });

  useEffect(() => {
    chargerProfile();
  }, []);

  const chargerProfile = async () => {
    setChargement(true);
    setErreur(null);
    try {
      console.log('Chargement du profil...');
      const response = await AxiosInstance.get('/profile/');
      console.log('Profil chargé:', response.data);
      setProfile(response.data);
    } catch (err) {
      console.error('Erreur chargement profil:', err);
      if (err.response?.status === 401) {
        setErreur('Session expirée. Veuillez vous reconnecter.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setErreur(err.response?.data?.error || 'Impossible de charger le profil');
      }
    } finally {
      setChargement(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargementSauvegarde(true);
    setErreur(null);
    setSucces(false);

    try {
      const dataToSend = { ...profile };
      delete dataToSend.role;
      delete dataToSend.is_active;
      delete dataToSend.id;
      delete dataToSend.created_at;
      delete dataToSend.updated_at;
      delete dataToSend.date_joined;
      delete dataToSend.last_login;
      
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null || dataToSend[key] === undefined) {
          delete dataToSend[key];
        }
      });

      console.log('Données à envoyer:', dataToSend);

      const response = await AxiosInstance.patch('/profile/', dataToSend);
      console.log('Profil mis à jour:', response.data);
      
      setProfile(response.data);
      setSucces(true);
      setEnEdition(false);
      setTimeout(() => setSucces(false), 3000);
    } catch (err) {
      console.error('Erreur mise à jour:', err);
      if (err.response?.data) {
        const errors = Object.values(err.response.data).flat();
        setErreur(errors.join(', '));
      } else {
        setErreur(err.response?.data?.error || 'Erreur lors de la mise à jour');
      }
    } finally {
      setChargementSauvegarde(false);
    }
  };

  const formaterDate = (dateStr) => {
    if (!dateStr) return 'Non définie';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getInitials = () => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();
    }
    if (profile.username) return profile.username.charAt(0).toUpperCase();
    if (profile.email) return profile.email.charAt(0).toUpperCase();
    return '?';
  };

  const getRoleLabel = (role) => {
    const roles = {
      admin: { label: 'Administrateur', couleur: 'error' },
      vendeur: { label: 'Vendeur', couleur: 'primary' }
    };
    return roles[role] || { label: role || 'Inconnu', couleur: 'gray' };
  };

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (erreur && !profile.email) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p className="text-xl text-base-content/70">{erreur}</p>
        <button onClick={chargerProfile} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  const roleInfo = getRoleLabel(profile.role);
  const RoleIcon = profile.role === 'admin' ? Shield : UserCog;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/')} 
          className="btn btn-ghost btn-circle"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <User className="w-8 h-8 text-primary" />
            Mon Profil
          </h1>
          <p className="text-base-content/60">
            Gérez vos informations personnelles
          </p>
        </div>
        <div>
          {!enEdition ? (
            <button
              onClick={() => setEnEdition(true)}
              className="btn btn-primary gap-2"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </button>
          ) : (
            <button
              onClick={() => {
                setEnEdition(false);
                chargerProfile();
              }}
              className="btn btn-ghost gap-2"
            >
              Annuler
            </button>
          )}
        </div>
      </div>

      {succes && (
        <div className="alert alert-success mb-6 shadow-lg">
          <CheckCircle className="w-6 h-6" />
          <span>Profil mis à jour avec succès !</span>
        </div>
      )}

      {erreur && (
        <div className="alert alert-error mb-6 shadow-lg">
          <AlertCircle className="w-6 h-6" />
          <span>{erreur}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex flex-col items-center mb-6">
              <div className="avatar placeholder">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-4xl font-bold text-primary">
                    {getInitials()}
                  </span>
                </div>
              </div>
              <p className="text-sm text-base-content/40 mt-2">
                {profile.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`badge badge-${roleInfo.couleur} gap-2 py-2 px-3`}>
                  <RoleIcon className="w-4 h-4" />
                  {roleInfo.label}
                </span>
                <span className={`badge ${profile.is_active ? 'badge-success' : 'badge-error'} gap-2 py-2 px-3`}>
                  {profile.is_active ? '✅ Actif' : '❌ Inactif'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </span>
                </label>
                <input
                  type="email"
                  className="input input-bordered bg-base-200"
                  value={profile.email || ''}
                  disabled
                />
                <span className="text-xs text-base-content/40 mt-1">
                  L'email ne peut pas être modifié
                </span>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nom d'utilisateur
                  </span>
                </label>
                <input
                  type="text"
                  name="username"
                  className="input input-bordered"
                  value={profile.username || ''}
                  onChange={handleChange}
                  disabled={!enEdition}
                  placeholder="Votre pseudo"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Prénom</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  className="input input-bordered"
                  value={profile.first_name || ''}
                  onChange={handleChange}
                  disabled={!enEdition}
                  placeholder="Votre prénom"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Nom</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  className="input input-bordered"
                  value={profile.last_name || ''}
                  onChange={handleChange}
                  disabled={!enEdition}
                  placeholder="Votre nom"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Téléphone
                  </span>
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  className="input input-bordered"
                  value={profile.phone_number || ''}
                  onChange={handleChange}
                  disabled={!enEdition}
                  placeholder="+221 XX XXX XX XX"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date de naissance
                  </span>
                </label>
                {enEdition ? (
                  <input
                    type="date"
                    name="birthday"
                    className="input input-bordered"
                    value={profile.birthday || ''}
                    onChange={handleChange}
                  />
                ) : (
                  <p className="py-2 text-base-content/70">
                    {formaterDate(profile.birthday)}
                  </p>
                )}
              </div>

              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Adresse
                  </span>
                </label>
                {enEdition ? (
                  <textarea
                    name="address"
                    className="textarea textarea-bordered"
                    value={profile.address || ''}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Votre adresse complète"
                  />
                ) : (
                  <p className="py-2 text-base-content/70">
                    {profile.address || 'Aucune adresse renseignée'}
                  </p>
                )}
              </div>
            </div>

            {enEdition && (
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="btn btn-primary flex-1 gap-2"
                  disabled={chargementSauvegarde}
                >
                  {chargementSauvegarde ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Enregistrer les modifications
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </form>

      <div className="card bg-base-100 shadow-xl mt-6">
        <div className="card-body">
          <h3 className="card-title text-lg flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Sécurité
          </h3>
          <div className="flex flex-wrap gap-4 mt-2">
            <Link to="/changer-mot-de-passe" className="btn btn-outline gap-2">
              <Key className="w-4 h-4" />
              Changer le mot de passe
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;