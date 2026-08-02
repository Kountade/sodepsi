// pages/utilisateurs/Utilisateurs.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, Search, Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, UserCheck, UserX, Mail, Calendar,
  Shield, UserCog, RefreshCw, Filter, ChevronLeft, ChevronRight,
  UserPlus, CheckCircle, XCircle
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const Utilisateurs = () => {
  const navigate = useNavigate();
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [utilisateursFiltres, setUtilisateursFiltres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreRole, setFiltreRole] = useState('all');
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [elementsParPage] = useState(10);
  const [utilisateurSelectionne, setUtilisateurSelectionne] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [showModalStatut, setShowModalStatut] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  // Rôles disponibles
  const roles = {
    admin: { label: 'Administrateur', couleur: 'error', icone: Shield },
    vendeur: { label: 'Vendeur', couleur: 'primary', icone: UserCog }
  };

  // Charger les utilisateurs
  useEffect(() => {
    chargerUtilisateurs();
  }, []);

  const chargerUtilisateurs = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const response = await AxiosInstance.get('/users/');
      console.log('Utilisateurs chargés:', response.data);
      setUtilisateurs(response.data);
      setUtilisateursFiltres(response.data);
      setTotalPages(Math.ceil(response.data.length / elementsParPage));
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      if (err.response?.status === 401) {
        setErreur('Session expirée. Veuillez vous reconnecter.');
        navigate('/login');
      } else {
        setErreur(err.response?.data?.error || 'Impossible de charger les utilisateurs');
      }
    } finally {
      setChargement(false);
    }
  };

  // Filtrer les utilisateurs
  useEffect(() => {
    let filtre = utilisateurs;

    if (recherche) {
      const terme = recherche.toLowerCase();
      filtre = filtre.filter(utilisateur =>
        utilisateur.email?.toLowerCase().includes(terme) ||
        utilisateur.username?.toLowerCase().includes(terme) ||
        utilisateur.first_name?.toLowerCase().includes(terme) ||
        utilisateur.last_name?.toLowerCase().includes(terme)
      );
    }

    if (filtreRole !== 'all') {
      filtre = filtre.filter(utilisateur => utilisateur.role === filtreRole);
    }

    if (filtreStatut !== 'all') {
      filtre = filtre.filter(utilisateur => 
        filtreStatut === 'actif' ? utilisateur.is_active : !utilisateur.is_active
      );
    }

    setUtilisateursFiltres(filtre);
    setTotalPages(Math.ceil(filtre.length / elementsParPage));
    setPageActuelle(1);
  }, [recherche, filtreRole, filtreStatut, utilisateurs]);

  // Pagination
  const getElementsPageActuelle = () => {
    const debut = (pageActuelle - 1) * elementsParPage;
    const fin = debut + elementsParPage;
    return utilisateursFiltres.slice(debut, fin);
  };

  const allerPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setPageActuelle(page);
    }
  };

  // Activer/Désactiver un utilisateur
  const basculerStatutUtilisateur = (utilisateur) => {
    setUtilisateurSelectionne(utilisateur);
    setShowModalStatut(true);
  };

  const confirmerBasculerStatut = async () => {
    if (!utilisateurSelectionne) return;
    
    setChargementAction(true);
    try {
      const nouveauStatut = !utilisateurSelectionne.is_active;
      await AxiosInstance.patch(`/users/${utilisateurSelectionne.id}/`, { is_active: nouveauStatut });
      
      const utilisateursMisAJour = utilisateurs.map(u => 
        u.id === utilisateurSelectionne.id ? { ...u, is_active: nouveauStatut } : u
      );
      setUtilisateurs(utilisateursMisAJour);
      setShowModalStatut(false);
      setUtilisateurSelectionne(null);
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.response?.data?.error || 'Erreur lors du changement de statut');
    } finally {
      setChargementAction(false);
    }
  };

  // Supprimer un utilisateur
  const supprimerUtilisateur = async () => {
    if (!utilisateurSelectionne) return;
    
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/users/${utilisateurSelectionne.id}/`);
      setUtilisateurs(utilisateurs.filter(u => u.id !== utilisateurSelectionne.id));
      setShowModalSuppression(false);
      setUtilisateurSelectionne(null);
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setChargementAction(false);
    }
  };

  // Formatage
  const formaterDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getBadgeRole = (role) => {
    const infoRole = roles[role] || { label: role, couleur: 'gray', icone: Users };
    const Icone = infoRole.icone;
    return (
      <span className={`badge badge-${infoRole.couleur} gap-1`}>
        <Icone className="w-3 h-3" />
        {infoRole.label}
      </span>
    );
  };

  const getBadgeStatut = (estActif) => {
    return estActif ? (
      <span className="badge badge-success gap-1">
        <CheckCircle className="w-3 h-3" />
        Actif
      </span>
    ) : (
      <span className="badge badge-error gap-1">
        <XCircle className="w-3 h-3" />
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
        <button onClick={chargerUtilisateurs} className="btn btn-primary mt-4">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-base-content flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Utilisateurs
          </h1>
          <p className="text-base-content/60 mt-1">
            {utilisateursFiltres.length} utilisateur{utilisateursFiltres.length > 1 ? 's' : ''} trouvé{utilisateursFiltres.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={chargerUtilisateurs} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" />
            Rafraîchir
          </button>
          <Link to="/utilisateurs/ajouter" className="btn btn-primary gap-2">
            <UserPlus className="w-5 h-5" />
            Nouvel utilisateur
          </Link>
        </div>
      </div>

      {/* Filtres */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  className="input input-bordered w-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>
            
            <select
              className="select select-bordered"
              value={filtreRole}
              onChange={(e) => setFiltreRole(e.target.value)}
            >
              <option value="all">Tous les rôles</option>
              <option value="admin">Administrateurs</option>
              <option value="vendeur">Vendeurs</option>
            </select>
            
            <select
              className="select select-bordered"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="actif">Actifs</option>
              <option value="inactif">Inactifs</option>
            </select>
            
            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => {
                setRecherche('');
                setFiltreRole('all');
                setFiltreStatut('all');
              }}
            >
              <Filter className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      {utilisateursFiltres.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-xl">
          <Users className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-xl text-base-content/60">Aucun utilisateur trouvé</p>
          <p className="text-sm text-base-content/40 mt-2">
            {recherche || filtreRole !== 'all' || filtreStatut !== 'all' 
              ? 'Essayez de modifier vos filtres' 
              : 'Commencez par créer un nouvel utilisateur'}
          </p>
          <Link to="/utilisateurs/ajouter" className="btn btn-primary mt-4">
            Créer un utilisateur
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-xl">
            <table className="table table-zebra w-full">
              <thead>
                <tr className="bg-base-200">
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Date d'inscription</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getElementsPageActuelle().map((utilisateur) => (
                  <tr key={utilisateur.id} className="hover">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className={`w-10 h-10 rounded-full ${utilisateur.is_active ? 'bg-primary/20' : 'bg-base-300'} flex items-center justify-center`}>
                            <span className={`text-lg font-bold ${utilisateur.is_active ? 'text-primary' : 'text-base-content/40'}`}>
                              {(utilisateur.username || utilisateur.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">{utilisateur.username || utilisateur.email}</p>
                          {utilisateur.first_name && (
                            <p className="text-xs text-base-content/40">
                              {utilisateur.first_name} {utilisateur.last_name || ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-base-content/40" />
                        <span className="text-sm">{utilisateur.email}</span>
                      </div>
                    </td>
                    <td>{getBadgeRole(utilisateur.role)}</td>
                    <td>{getBadgeStatut(utilisateur.is_active)}</td>
                    <td>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-base-content/40" />
                        {formaterDate(utilisateur.created_at)}
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <Link
                          to={`/utilisateurs/${utilisateur.id}`}
                          className="btn btn-ghost btn-xs gap-1"
                          title="Voir les détails"
                        >
                          <Eye className="w-3 h-3" />
                        </Link>
                        <Link
                          to={`/utilisateurs/${utilisateur.id}/modifier`}
                          className="btn btn-ghost btn-xs gap-1"
                          title="Modifier"
                        >
                          <Edit className="w-3 h-3" />
                        </Link>
                        <button
                          onClick={() => basculerStatutUtilisateur(utilisateur)}
                          className={`btn btn-ghost btn-xs gap-1 ${utilisateur.is_active ? 'text-warning' : 'text-success'}`}
                          title={utilisateur.is_active ? 'Désactiver' : 'Activer'}
                        >
                          {utilisateur.is_active ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => {
                            setUtilisateurSelectionne(utilisateur);
                            setShowModalSuppression(true);
                          }}
                          className="btn btn-ghost btn-xs gap-1 text-error"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-base-content/60">
                Affichage de {((pageActuelle - 1) * elementsParPage) + 1} à {Math.min(pageActuelle * elementsParPage, utilisateursFiltres.length)} sur {utilisateursFiltres.length} utilisateurs
              </p>
              <div className="flex gap-1">
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => allerPage(pageActuelle - 1)}
                  disabled={pageActuelle === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  let numPage = i + 1;
                  if (totalPages > 5 && pageActuelle > 3) {
                    numPage = pageActuelle - 2 + i;
                    if (numPage > totalPages) return null;
                  }
                  return (
                    <button
                      key={numPage}
                      className={`btn btn-sm ${pageActuelle === numPage ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => allerPage(numPage)}
                    >
                      {numPage}
                    </button>
                  );
                })}
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => allerPage(pageActuelle + 1)}
                  disabled={pageActuelle === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de confirmation changement de statut */}
      {showModalStatut && utilisateurSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalStatut(false)}></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full ${utilisateurSelectionne.is_active ? 'bg-warning/20' : 'bg-success/20'} flex items-center justify-center mx-auto mb-4`}>
                {utilisateurSelectionne.is_active ? (
                  <UserX className="w-8 h-8 text-warning" />
                ) : (
                  <UserCheck className="w-8 h-8 text-success" />
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">
                {utilisateurSelectionne.is_active ? 'Désactiver' : 'Activer'} l'utilisateur
              </h3>
              <p className="text-base-content/60 mb-4">
                Êtes-vous sûr de vouloir {utilisateurSelectionne.is_active ? 'désactiver' : 'activer'} 
                l'utilisateur <span className="font-bold">{utilisateurSelectionne.email}</span> ?
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
                  className={`btn flex-1 ${utilisateurSelectionne.is_active ? 'btn-warning' : 'btn-success'}`}
                  onClick={confirmerBasculerStatut}
                  disabled={chargementAction}
                >
                  {chargementAction ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Chargement...
                    </>
                  ) : (
                    utilisateurSelectionne.is_active ? 'Désactiver' : 'Activer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation suppression */}
      {showModalSuppression && utilisateurSelectionne && (
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
                l'utilisateur <span className="font-bold">{utilisateurSelectionne.email}</span> ?
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
    </div>
  );
};

export default Utilisateurs;