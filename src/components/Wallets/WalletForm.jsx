// src/pages/wallets/WalletForm.jsx
// ============================================================
// FORMULAIRE DE CRÉATION DE PORTE-MONNAIE - AVEC COMBOBOX
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Wallet,
  User,
  Phone,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  Plus,
  UserPlus,
  RefreshCw,
  Mail,
  Calendar,
  X,
  ChevronDown,
  ChevronUp,
  Users,
  XCircle
} from 'lucide-react';
import axiosInstance from '../AxiosInstance';

const WalletForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [creating, setCreating] = useState(false);
  const [walletCreated, setWalletCreated] = useState(null);

  // Charger les clients sans wallet
  const fetchClientsWithoutWallet = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axiosInstance.get('/clients/?limit=1000', {
        headers: { Authorization: `Token ${token}` }
      });

      const clientsWithoutWallet = [];

      for (const client of response.data) {
        try {
          await axiosInstance.get(`/wallet/client_wallet/${client.id}/`, {
            headers: { Authorization: `Token ${token}` }
          });
          // Client a un wallet, on l'ignore
        } catch (error) {
          if (error.response?.status === 404) {
            clientsWithoutWallet.push(client);
          }
        }
      }

      setClients(clientsWithoutWallet);

    } catch (error) {
      console.error('Erreur chargement clients:', error);
      setError('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchClientsWithoutWallet();
  }, [fetchClientsWithoutWallet]);

  // ============================================================
  // CRÉATION DU WALLET
  // ============================================================
  const handleCreateWallet = async () => {
    if (!selectedClientId) {
      setError('Veuillez sélectionner un client');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        setError('Session expirée, veuillez vous reconnecter');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const selectedClient = clients.find(c => c.id === parseInt(selectedClientId));

      const response = await axiosInstance.post(
        `/wallet/create-wallet/`,
        {
          client_id: selectedClientId,
          initial_balance: 0
        },
        {
          headers: { Authorization: `Token ${token}` }
        }
      );

      if (response.data.status === 'success') {
        setSuccess(true);
        setWalletCreated({
          id: response.data.wallet.id,
          client_name: selectedClient?.name || 'Client',
          client_code: selectedClient?.code || '',
          balance: response.data.wallet.balance || 0
        });
        // Mettre à jour la liste des clients sans wallet
        setClients(clients.filter(c => c.id !== parseInt(selectedClientId)));
        setSelectedClientId('');
      }

    } catch (error) {
      console.error('Erreur création wallet:', error);
      
      let errorMessage = 'Erreur lors de la création du porte-monnaie';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Le endpoint de création n\'existe pas. Vérifiez l\'URL.';
        } else if (error.response.status === 400) {
          if (typeof error.response.data === 'object') {
            const messages = Object.values(error.response.data).flat();
            errorMessage = messages.join(', ');
          } else {
            errorMessage = error.response.data.message || 'Données invalides';
          }
        } else if (error.response.status === 403) {
          errorMessage = 'Vous n\'avez pas les droits pour créer un porte-monnaie';
        } else if (error.response.status === 401) {
          errorMessage = 'Session expirée, veuillez vous reconnecter';
          setTimeout(() => navigate('/login'), 2000);
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.request) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
      }
      
      setError(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  // Récupérer le client sélectionné
  const selectedClient = clients.find(c => c.id === parseInt(selectedClientId));

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-base-content/60">Chargement des clients...</p>
        </div>
      </div>
    );
  }

  if (success && walletCreated) {
    return (
      <div className="w-full px-4 sm:px-6 py-6">
        <div className="bg-base-100 rounded-xl shadow-lg border border-base-200 p-8 max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold mt-4">✅ Porte-monnaie créé avec succès !</h2>
          <p className="text-base-content/60 mt-2">
            Le porte-monnaie a été créé pour {walletCreated.client_name}
          </p>
          
          <div className="bg-base-200 rounded-xl p-4 mt-4 text-left">
            <p className="font-semibold">{walletCreated.client_name}</p>
            <p className="text-sm text-base-content/60">
              Code: {walletCreated.client_code}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="badge badge-success">Solde: {walletCreated.balance || 0} FCFA</span>
              <span className="badge badge-primary">Actif</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(`/wallets/${walletCreated.id}`)}
              className="btn btn-primary gap-2"
            >
              <Wallet className="w-4 h-4" />
              Voir le porte-monnaie
            </button>
            <button
              onClick={() => {
                setSuccess(false);
                setWalletCreated(null);
                fetchClientsWithoutWallet();
              }}
              className="btn btn-ghost gap-2"
            >
              <Plus className="w-4 h-4" />
              Créer un autre wallet
            </button>
            <Link
              to="/wallets"
              className="btn btn-ghost gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la liste
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 py-4 space-y-6">
      
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/wallets"
            className="p-2 rounded-lg hover:bg-base-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="w-7 h-7 text-primary" />
              Créer un porte-monnaie
            </h1>
            <p className="text-base-content/60 text-sm">
              Sélectionnez un client pour créer son porte-monnaie
            </p>
          </div>
        </div>
        <button
          onClick={fetchClientsWithoutWallet}
          className="btn btn-ghost btn-sm gap-2"
          title="Actualiser la liste"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60">Clients sans wallet</p>
              <p className="text-2xl font-bold text-warning">{clients.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-warning" />
            </div>
          </div>
        </div>
        <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60">Total clients</p>
              <p className="text-2xl font-bold text-primary">0</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="bg-base-100 rounded-xl shadow-lg border border-base-200 p-12 text-center">
          <CheckCircle className="w-16 h-16 text-success mx-auto" />
          <p className="text-lg font-semibold mt-4">Tous les clients ont un porte-monnaie !</p>
          <p className="text-base-content/40 mt-2">
            Aucun client sans porte-monnaie trouvé
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/wallets" className="btn btn-primary gap-2">
              <Wallet className="w-4 h-4" />
              Voir tous les porte-monnaie
            </Link>
            <Link to="/clients" className="btn btn-ghost gap-2">
              <Users className="w-4 h-4" />
              Voir les clients
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-base-100 rounded-xl shadow-lg border border-base-200 overflow-hidden">
          <div className="p-6">
            {error && (
              <div className="bg-error/10 border border-error/20 text-error rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Erreur</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ✅ COMBOBOX POUR SÉLECTIONNER LE CLIENT */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-base-content/80 mb-2">
                  Client <span className="text-error">*</span>
                </label>

                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                    setError('');
                  }}
                  className="select select-bordered w-full text-base"
                >
                  <option value="">-- Sélectionner un client --</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.code} - {client.name} {client.phone ? `(${client.phone})` : ''}
                    </option>
                  ))}
                </select>

                {clients.length === 0 && (
                  <p className="text-sm text-base-content/40 mt-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    Tous les clients ont déjà un porte-monnaie
                  </p>
                )}
              </div>

              {/* Résumé du client sélectionné */}
              {selectedClient && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Client sélectionné
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-base-content/40">Nom</p>
                      <p className="font-medium">{selectedClient.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-base-content/40">Code</p>
                      <p className="font-mono text-sm">{selectedClient.code}</p>
                    </div>
                    <div>
                      <p className="text-xs text-base-content/40">Téléphone</p>
                      <p>{selectedClient.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-base-content/40">Type</p>
                      <p className="capitalize">{selectedClient.type || 'Particulier'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-base-content/40">Statut</p>
                      <span className={`badge ${selectedClient.statut === 'actif' ? 'badge-success' : 'badge-error'} badge-sm`}>
                        {selectedClient.statut || 'Actif'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-base-content/40">Date création</p>
                      <p>{formatDate(selectedClient.created_at)}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-primary/10">
                    <p className="text-xs text-base-content/40">Solde initial</p>
                    <p className="text-lg font-bold text-success">0 FCFA</p>
                  </div>
                </div>
              )}

              {/* Bouton de création */}
              <button
                onClick={handleCreateWallet}
                disabled={!selectedClientId || creating}
                className={`
                  btn w-full h-12 text-base font-medium gap-2
                  ${!selectedClientId 
                    ? 'btn-disabled' 
                    : 'btn-primary'
                  }
                `}
              >
                {creating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    {selectedClientId 
                      ? `Créer le porte-monnaie pour ${selectedClient?.name || 'le client'}`
                      : 'Sélectionnez un client'
                    }
                  </>
                )}
              </button>

              {/* Information supplémentaire */}
              <div className="text-center text-xs text-base-content/40">
                <p>Le porte-monnaie sera créé avec un solde initial de <span className="font-bold text-success">0 FCFA</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletForm;