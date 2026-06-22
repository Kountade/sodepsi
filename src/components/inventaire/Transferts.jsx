// src/pages/transferts/Transferts.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Eye, CheckCircle, XCircle, Send, Truck, Ban, AlertCircle,
  Package, ArrowLeftRight, Clock, Filter, Search, RefreshCw
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: 'secondary', icon: Clock },
  pending_approval: { label: 'En attente', color: 'warning', icon: Send },
  approved: { label: 'Approuvé', color: 'info', icon: CheckCircle },
  rejected: { label: 'Rejeté', color: 'error', icon: XCircle },
  in_transit: { label: 'En transit', color: 'info', icon: Truck },
  partial: { label: 'Partiellement reçu', color: 'warning', icon: Clock },
  completed: { label: 'Terminé', color: 'success', icon: CheckCircle },
  cancelled: { label: 'Annulé', color: 'neutral', icon: Ban }
};

const Transferts = () => {
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [agences, setAgences] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [userAgencesIds, setUserAgencesIds] = useState([]);

  // Récupérer l'utilisateur et ses permissions
  const getUserInfo = () => {
    try {
      const userData = localStorage.getItem('User');
      const user = userData ? JSON.parse(userData) : null;
      const agenceCourante = JSON.parse(localStorage.getItem('AgenceCourante') || '{}');
      
      let role = 'autre';
      let agencesAccessibles = [];
      
      if (user?.role_global === 'pdg') {
        role = 'pdg';
      } else if (user?.role_global === 'drh') {
        role = 'drh';
      } else if (user?.roles_agence) {
        // Pour les chefs d'agence, on récupère leurs agences
        agencesAccessibles = user.roles_agence
          .filter(r => r.est_actif)
          .map(r => r.agence_id);
        
        const currentRole = user.roles_agence.find(
          r => r.agence_id === agenceCourante.id && r.est_actif
        );
        if (currentRole) {
          role = currentRole.role;
        }
      }
      
      return { user, role, agencesAccessibles, agenceCourante };
    } catch {
      return { user: null, role: 'autre', agencesAccessibles: [], agenceCourante: {} };
    }
  };

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      let url = '/transfers/';
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (params.toString()) url += `?${params.toString()}`;
      const res = await AxiosInstance.get(url);
      
      // Ajouter les informations d'agence formatées
      const transfersWithInfo = res.data.map(transfer => ({
        ...transfer,
        from_agence_nom: transfer.from_agence?.nom || transfer.from_warehouse?.agence?.nom || 'N/A',
        from_agence_id: transfer.from_agence?.id || transfer.from_warehouse?.agence?.id,
        to_agence_nom: transfer.to_agence?.nom || transfer.to_warehouse?.agence?.nom || 'N/A',
        to_agence_id: transfer.to_agence?.id || transfer.to_warehouse?.agence?.id,
        from_warehouse_nom: transfer.from_warehouse?.name || 'N/A',
        to_warehouse_nom: transfer.to_warehouse?.name || 'N/A'
      }));
      
      setTransfers(transfersWithInfo);
    } catch (error) {
      console.error('Erreur chargement transferts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgences = async () => {
    try {
      const res = await AxiosInstance.get('agences/');
      setAgences(res.data);
    } catch (error) {
      console.error('Erreur chargement agences:', error);
    }
  };

  useEffect(() => {
    const { role, agencesAccessibles } = getUserInfo();
    setUserRole(role);
    setUserAgencesIds(agencesAccessibles);
    
    fetchTransfers();
    fetchAgences();
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const resetFilters = () => {
    setFilters({ status: '', search: '' });
  };

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    const Icon = config.icon;
    return (
      <span className={`badge badge-${config.color} gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  // Vérifier si l'utilisateur peut soumettre une demande (chef agence DESTINATION)
  const canSubmit = (transfer) => {
    const { agenceCourante, role } = getUserInfo();
    
    // Seul le chef d'agence de DESTINATION peut soumettre
    if (transfer.status !== 'draft') return false;
    
    // Vérifier si l'utilisateur est le chef de l'agence de destination
    const isDestinationChef = transfer.to_agence_id === agenceCourante?.id && 
                              (role === 'chef_agence');
    
    // Le PDG et DRH ne soumettent pas (ils approuvent directement)
    if (role === 'pdg' || role === 'drh') return false;
    
    return isDestinationChef;
  };

  // Vérifier si l'utilisateur peut approuver (chef agence SOURCE ou PDG)
  const canApprove = (transfer) => {
    const { agenceCourante, role } = getUserInfo();
    
    if (transfer.status !== 'pending_approval') return false;
    
    // PDG peut tout approuver
    if (role === 'pdg') return true;
    
    // Chef d'agence SOURCE peut approuver
    const isSourceChef = transfer.from_agence_id === agenceCourante?.id && 
                         (role === 'chef_agence');
    
    return isSourceChef;
  };

  // Vérifier si l'utilisateur peut rejeter (même que approver)
  const canReject = (transfer) => {
    return canApprove(transfer);
  };

  // Vérifier si l'utilisateur peut annuler
  const canCancel = (transfer) => {
    const { agenceCourante, role } = getUserInfo();
    
    if (transfer.status !== 'draft' && transfer.status !== 'pending_approval') return false;
    
    // PDG peut tout annuler
    if (role === 'pdg') return true;
    
    // Chef d'agence SOURCE ou DESTINATION peut annuler
    const isSourceOrDestination = (transfer.from_agence_id === agenceCourante?.id || 
                                   transfer.to_agence_id === agenceCourante?.id) && 
                                  (role === 'chef_agence');
    
    return isSourceOrDestination;
  };

  const handleAction = async (id, action) => {
    try {
      let res;
      switch (action) {
        case 'submit':
          res = await AxiosInstance.post(`/transfers/${id}/submit/`);
          break;
        case 'approve':
          res = await AxiosInstance.post(`/transfers/${id}/approve/`);
          break;
        case 'reject':
          const reason = prompt('Motif du rejet :');
          if (!reason && reason !== '') return;
          res = await AxiosInstance.post(`/transfers/${id}/reject/`, { reason });
          break;
        case 'cancel':
          if (!window.confirm('Annuler ce transfert ?')) return;
          res = await AxiosInstance.post(`/transfers/${id}/cancel/`);
          break;
        default:
          return;
      }
      if (res.status === 200 || res.status === 201) {
        fetchTransfers();
      }
    } catch (error) {
      console.error(`Erreur lors de l'action ${action}:`, error);
      alert(error.response?.data?.error || 'Une erreur est survenue');
    }
  };

  // Récupérer les infos utilisateur pour l'affichage
  const { agenceCourante } = getUserInfo();

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
            <ArrowLeftRight className="w-7 h-7 text-primary" />
            Transferts entre entrepôts
          </h1>
          <p className="text-base-content/60 text-sm mt-1">
            Gérez les demandes de transfert de stock
          </p>
          {agenceCourante?.nom && (
            <div className="mt-2 text-xs text-base-content/50">
              Agence courante : <span className="font-semibold text-primary">{agenceCourante.nom}</span>
              {userRole === 'chef_agence' && ' (Chef d\'agence)'}
              {userRole === 'pdg' && ' (PDG - Accès total)'}
              {userRole === 'drh' && ' (DRH)'}
            </div>
          )}
        </div>
        <Link to="/transferts/nouveau" className="btn btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Nouveau transfert
        </Link>
      </div>

      {/* Filtres */}
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-base-content/60" />
              <span className="font-medium">Filtres</span>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-sm btn-ghost"
              >
                {showFilters ? 'Masquer' : 'Afficher'}
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={fetchTransfers} className="btn btn-sm btn-outline gap-1">
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </button>
              {(filters.status || filters.search) && (
                <button onClick={resetFilters} className="btn btn-sm btn-ghost">
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Statut</span>
                </label>
                <select
                  name="status"
                  className="select select-bordered"
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  <option value="">Tous</option>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Recherche</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                  <input
                    type="text"
                    name="search"
                    placeholder="Référence, produit..."
                    className="input input-bordered w-full pl-9"
                    value={filters.search}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto bg-base-100 rounded-xl shadow-md">
        <table className="table table-zebra">
          <thead>
            <tr className="bg-base-200">
              <th>Référence</th>
              <th>Statut</th>
              <th>Origine</th>
              <th>Destination</th>
              <th>Nb articles</th>
              <th>Date création</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="7" className="text-center py-8">Chargement...</td></tr>
            )}
            {!loading && transfers.length === 0 && (
              <tr><td colSpan="7" className="text-center py-8">Aucun transfert trouvé</td></tr>
            )}
            {!loading && transfers.map((transfer) => {
              const showSubmit = canSubmit(transfer);
              const showApprove = canApprove(transfer);
              const showReject = canReject(transfer);
              const showCancel = canCancel(transfer);
              
              return (
                <tr key={transfer.id} className="hover">
                  <td className="font-mono text-sm font-medium">{transfer.reference}</td>
                  <td>{getStatusBadge(transfer.status)}</td>
                  <td>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{transfer.from_warehouse_nom}</span>
                      <span className="text-xs text-base-content/50">{transfer.from_agence_nom}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{transfer.to_warehouse_nom}</span>
                      <span className="text-xs text-base-content/50">{transfer.to_agence_nom}</span>
                    </div>
                  </td>
                  <td className="text-center">
                    <span className="badge badge-neutral">{transfer.items?.length || 0}</span>
                  </td>
                  <td className="text-sm">{new Date(transfer.created_at).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <div className="flex flex-wrap gap-1 justify-center">
                      <Link to={`/transferts/${transfer.id}`} className="btn btn-xs btn-ghost" title="Voir détails">
                        <Eye className="w-3 h-3" />
                      </Link>
                      
                      {/* Bouton SOUMETTRE (Chef agence DESTINATION) */}
                      {showSubmit && (
                        <button 
                          onClick={() => handleAction(transfer.id, 'submit')} 
                          className="btn btn-xs btn-warning gap-1"
                          title="Soumettre la demande"
                        >
                          <Send className="w-3 h-3" /> Soumettre
                        </button>
                      )}
                      
                      {/* Bouton APPROUVER (Chef agence SOURCE ou PDG) */}
                      {showApprove && (
                        <button 
                          onClick={() => handleAction(transfer.id, 'approve')} 
                          className="btn btn-xs btn-success gap-1"
                          title="Approuver le transfert"
                        >
                          <CheckCircle className="w-3 h-3" /> Approuver
                        </button>
                      )}
                      
                      {/* Bouton REJETER (Chef agence SOURCE ou PDG) */}
                      {showReject && (
                        <button 
                          onClick={() => handleAction(transfer.id, 'reject')} 
                          className="btn btn-xs btn-error gap-1"
                          title="Rejeter la demande"
                        >
                          <XCircle className="w-3 h-3" /> Rejeter
                        </button>
                      )}
                      
                      {/* Bouton ANNULER (Chef SOURCE/DESTINATION ou PDG) */}
                      {showCancel && (
                        <button 
                          onClick={() => handleAction(transfer.id, 'cancel')} 
                          className="btn btn-xs btn-outline gap-1"
                          title="Annuler le transfert"
                        >
                          <Ban className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Légende des actions */}
      <div className="mt-4 p-3 bg-base-200 rounded-lg text-xs text-base-content/60">
        <div className="flex flex-wrap gap-4">
          <span className="flex items-center gap-1"><Send className="w-3 h-3 text-warning" /> Soumettre : Chef agence destination</span>
          <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-success" /> Approuver : Chef agence source ou PDG</span>
          <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-error" /> Rejeter : Chef agence source ou PDG</span>
          <span className="flex items-center gap-1"><Ban className="w-3 h-3" /> Annuler : Chef source/destination ou PDG</span>
        </div>
      </div>
    </div>
  );
};

export default Transferts;