// pages/utilisateurs/UtilisateurForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, UserPlus, Mail, Lock, User, Shield,
  Loader2, AlertCircle, CheckCircle, Phone,
  Calendar, MapPin, Save, Edit, UserCog
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const UtilisateurForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);
  
  const estEdition = id && id !== 'ajouter' && id !== 'creer';
  const userId = estEdition ? id : null;
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    role: 'vendeur',
    first_name: '',
    last_name: '',
    phone_number: '',
    address: '',
    birthday: '',
    is_active: true
  });

  useEffect(() => {
    if (estEdition && userId) {
      chargerUtilisateur(userId);
    }
  }, [id]);

  const chargerUtilisateur = async (userId) => {
    setChargementInitial(true);
    setErreur(null);
    try {
      const response = await AxiosInstance.get(`/users/${userId}/`);
      const data = response.data;
      setFormData({
        email: data.email || '',
        password: '',
        username: data.username || '',
        role: data.role || 'vendeur',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone_number: data.phone_number || '',
        address: data.address || '',
        birthday: data.birthday || '',
        is_active: data.is_active !== undefined ? data.is_active : true
      });
    } catch (err) {
      console.error('Erreur:', err);
      setErreur('Impossible de charger les données de l\'utilisateur');
      if (err.response?.status === 404) {
        setErreur('Utilisateur non trouvé');
      }
    } finally {
      setChargementInitial(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    try {
      const dataToSend = { ...formData };
      if (!dataToSend.password) {
        delete dataToSend.password;
      }
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null) {
          delete dataToSend[key];
        }
      });

      if (estEdition && userId) {
        await AxiosInstance.patch(`/users/${userId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => {
          navigate(`/utilisateurs/${userId}`);
        }, 1500);
      } else {
        await AxiosInstance.post('/users/', dataToSend);
        setSucces(true);
        setTimeout(() => {
          navigate('/utilisateurs');
        }, 1500);
      }
    } catch (err) {
      console.error('Erreur:', err);
      if (err.response?.data) {
        const errors = Object.values(err.response.data).flat();
        setErreur(errors.join(', '));
      } else {
        setErreur(err.response?.data?.error || 'Erreur lors de l\'enregistrement');
      }
    } finally {
      setChargement(false);
    }
  };

  if (chargementInitial) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate(estEdition && userId ? `/utilisateurs/${userId}` : '/utilisateurs')} 
          className="btn btn-ghost btn-circle"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          {estEdition ? (
            <>
              <Edit className="w-8 h-8 text-primary" />
              Modifier l'utilisateur
            </>
          ) : (
            <>
              <UserPlus className="w-8 h-8 text-primary" />
              Nouvel utilisateur
            </>
          )}
        </h1>
      </div>

      {succes && (
        <div className="alert alert-success mb-6 shadow-lg">
          <CheckCircle className="w-6 h-6" />
          <span>
            {estEdition 
              ? 'Utilisateur modifié avec succès !' 
              : 'Utilisateur créé avec succès !'}
          </span>
        </div>
      )}

      {erreur && (
        <div className="alert alert-error mb-6 shadow-lg">
          <AlertCircle className="w-6 h-6" />
          <span>{erreur}</span>
        </div>
      )}

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email *
                  </span>
                </label>
                <input
                  type="email"
                  name="email"
                  className="input input-bordered"
                  value={formData.email}
                  onChange={handleChange}
                  required={!estEdition}
                  disabled={estEdition}
                  placeholder="exemple@email.com"
                />
                {estEdition && (
                  <span className="text-xs text-base-content/40 mt-1">
                    L'email ne peut pas être modifié
                  </span>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    {estEdition ? 'Nouveau mot de passe' : 'Mot de passe *'}
                  </span>
                </label>
                <input
                  type="password"
                  name="password"
                  className="input input-bordered"
                  value={formData.password}
                  onChange={handleChange}
                  required={!estEdition}
                  minLength="6"
                  placeholder={estEdition ? 'Laisser vide pour conserver' : '••••••••'}
                />
                {estEdition && (
                  <span className="text-xs text-base-content/40 mt-1">
                    Laisser vide pour conserver le mot de passe actuel
                  </span>
                )}
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
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="pseudo"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Rôle *
                  </span>
                </label>
                <select
                  name="role"
                  className="select select-bordered"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="vendeur">Vendeur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Prénom</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  className="input input-bordered"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Prénom"
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
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Nom"
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
                  value={formData.phone_number}
                  onChange={handleChange}
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
                <input
                  type="date"
                  name="birthday"
                  className="input input-bordered"
                  value={formData.birthday}
                  onChange={handleChange}
                />
              </div>

              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Adresse
                  </span>
                </label>
                <textarea
                  name="address"
                  className="textarea textarea-bordered"
                  value={formData.address}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Adresse complète"
                />
              </div>

              <div className="form-control md:col-span-2">
                <label className="label cursor-pointer justify-start gap-4">
                  <span className="label-text font-medium">Compte actif</span>
                  <input
                    type="checkbox"
                    name="is_active"
                    className="toggle toggle-primary"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => navigate(estEdition && userId ? `/utilisateurs/${userId}` : '/utilisateurs')}
                className="btn flex-1"
                disabled={chargement}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1 gap-2"
                disabled={chargement}
              >
                {chargement ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {estEdition ? 'Modification...' : 'Création...'}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {estEdition ? 'Modifier' : 'Créer'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UtilisateurForm;