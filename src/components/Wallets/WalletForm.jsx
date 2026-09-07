// src/pages/wallets/WalletForm.jsx

import React, { useState, useEffect } from 'react';
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
  Building2,
  Calendar,
  X
} from 'lucide-react';
import axiosInstance from '../../components/AxiosInstance';

const WalletForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showClientList, setShowClientList] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [creating, setCreating] = useState(false);
  const [walletCreated, setWalletCreated] = useState(null);

  // Charger les clients sans wallet
  useEffect(() => {
    fetchClientsWithoutWallet();
  }, []);

  const fetchClientsWithoutWallet = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Récupérer tous les clients
      const response = await axiosInstance.get('/clients/', {
        headers: { Authorization: `Token ${token}` }
      });

      // Filtrer les clients qui n'ont pas de wallet
      const clientsWithWallet = [];
      const clientsWithoutWallet = [];

      for (const client of response.data) {
        try {
          await axiosInstance.get(`/clients/${client.id}/wallet/`, {
            headers: { Authorization: `Token ${token}` }
          });
          clientsWithWallet.push(client);
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
  };

  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  );

  const selectClient = (client) => {
    setSelectedClient(client);
    setShowClientList(false);
    setSearchTerm('');
    setError('');
  };

  const handleCreateWallet = async () => {
    if (!selectedClient) {
      setError('Veuillez sélectionner un client');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const token = localStorage.getItem('Token');
      const response = await axiosInstance.post(
        `/clients/${selectedClient.id}/create-wallet/`,
        {},
        {
          headers: { Authorization: `Token ${token}` }
        }
      );

      if (response.data.status === 'success') {
        setSuccess(true);
        setWalletCreated(response.data.wallet);
        // Mettre à jour la liste des clients sans wallet
        setClients(clients.filter(c => c.id !== selectedClient.id));
        setSelectedClient(null);
      }

    } catch (error) {
      console.error('Erreur création wallet:', error);
      setError(
        error.response?.data?.message ||
        'Erreur lors de la création du porte-monnaie'
      );
    } finally {
      setCreating(false);
    }
  };

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-base-content/60">Chargement des clients...</p>
        </div>
      </div>
    );
  }

  if (success && walletCreated) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-base-100 rounded-xl shadow-lg border border-base-200 p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold mt-4">✅ Porte-monnaie créé avec succès !</h2>
          <p className="text-base-content/60 mt-2">
            Le porte-monnaie a été créé pour le client sélectionné
          </p>
          
          <div className="bg-base-200 rounded-xl p-4 mt-4 text-left">
            <p className="font-semibold">{walletCreated.client_name}</p>
            <p className="text-sm text-base-content/60">
              Code: {walletCreated.client_code}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="badge badge-success">Solde: 0 FCFA</span>
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
    <div className="max-w-3xl mx-auto p-4">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/wallets')}
            className="p-2 rounded-lg hover:bg-base-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
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
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Statistiques */}
      <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-base-content/60">Clients sans porte-monnaie</p>
            <p className="text-2xl font-bold text-warning">{clients.length}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-warning" />
          </div>
        </div>
      </div>

      {clients.length === 0 && !selectedClient ? (
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
              <div className="bg-error/10 border border-error/20 text-error rounded-lg p-3 mb-4 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Sélection du client */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-base-content/80 mb-2">
                  Client <span className="text-error">*</span>
                </label>

                {selectedClient ? (
                  <div className="bg-base-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {selectedClient.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{selectedClient.name}</p>
                        <div className="flex flex-wrap gap-3 text-sm text-base-content/60">
                          <span className="flex items-center gap-1">
                            <span className="font-mono bg-base-300 px-2 py-0.5 rounded">
                              {selectedClient.code}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {selectedClient.phone || 'N/A'}
                          </span>
                          {selectedClient.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {selectedClient.email}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(selectedClient.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedClient(null)}
                      className="btn btn-ghost btn-sm btn-square"
                      title="Changer de client"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="text"
                          placeholder="Rechercher un client (nom, code, téléphone)..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setShowClientList(true);
                          }}
                          onFocus={() => setShowClientList(true)}
                          className="input input-bordered w-full pl-9"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowClientList(!showClientList)}
                        className="btn btn-ghost btn-sm"
                      >
                        {showClientList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {showClientList && clients.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-base-100 rounded-xl shadow-xl border border-base-200 max-h-60 overflow-y-auto">
                        {filteredClients.length === 0 ? (
                          <div className="p-4 text-center text-base-content/40 text-sm">
                            {clients.length === 0 
                              ? 'Aucun client sans porte-monnaie' 
                              : 'Aucun client trouvé'}
                          </div>
                        ) : (
                          filteredClients.map((client) => (
                            <button
                              key={client.id}
                              onClick={() => selectClient(client)}
                              className="w-full text-left p-3 hover:bg-base-200 transition-colors border-b border-base-200/50 last:border-0 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                  {client.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{client.name}</p>
                                  <p className="text-xs text-base-content/40 flex items-center gap-2">
                                    <span className="font-mono">{client.code}</span>
                                    <span className="w-1 h-1 rounded-full bg-base-content/20"></span>
                                    <Phone className="w-3 h-3" />
                                    {client.phone || 'N/A'}
                                  </p>
                                </div>
                              </div>
                              <span className="badge badge-warning badge-sm">Sans wallet</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {clients.length === 0 && !selectedClient && (
                  <p className="text-sm text-base-content/40 mt-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    Tous les clients ont déjà un porte-monnaie
                  </p>
                )}
              </div>

              {/* Résumé */}
              {selectedClient && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-primary" />
                    Résumé de la création
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-base-content/40">Client</p>
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
                      <p className="text-xs text-base-content/40">Statut</p>
                      <span className="badge badge-warning badge-sm">Nouveau wallet</span>
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
                disabled={!selectedClient || creating}
                className={`
                  btn w-full h-12 text-base font-medium gap-2
                  ${!selectedClient 
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
                    {selectedClient 
                      ? `Créer le porte-monnaie pour ${selectedClient.name}`
                      : 'Sélectionnez un client'
                    }
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Ajout des imports manquants
import { ChevronDown, ChevronUp, Users } from 'lucide-react';

export default WalletForm;