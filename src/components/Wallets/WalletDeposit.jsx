// src/pages/wallets/WalletDeposit.jsx
// ============================================================
// PAGE DE DÉPÔT DANS LE PORTE-MONNAIE - CORRIGÉE
// AVEC LA MÊME LOGIQUE QUE WalletsList
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Wallet,
  User,
  Phone,
  Loader2,
  AlertCircle,
  CheckCircle,
  Plus,
  RefreshCw,
  CreditCard,
  X,
  TrendingUp,
  Users,
  Banknote,
  Clock
} from 'lucide-react';
import axiosInstance from '../../components/AxiosInstance';

const WalletDeposit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [client, setClient] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [depositResult, setDepositResult] = useState(null);

  // Charger les informations du wallet - ✅ MÊME LOGIQUE QUE WalletsList
  const fetchWallet = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        navigate('/login');
        return;
      }

      // ✅ UTILISER /wallet/list/ COMME WalletsList
      const response = await axiosInstance.get('/wallet/list/');
      
      console.log('📋 Réponse wallets list:', response.data);

      let walletData = null;
      let results = [];

      // ✅ Même logique que WalletsList pour extraire les résultats
      if (response.data.results) {
        results = response.data.results;
      } else if (Array.isArray(response.data)) {
        results = response.data;
      }

      // ✅ Chercher le wallet avec l'ID correspondant
      const foundWallet = results.find(w => w.id === parseInt(id));
      
      if (foundWallet) {
        // ✅ Construire l'objet wallet avec les mêmes infos que WalletsList
        walletData = {
          ...foundWallet,
          client: {
            id: foundWallet.client,
            name: foundWallet.client_name || 'Client inconnu',
            code: foundWallet.client_code || 'N/A',
            phone: foundWallet.client_phone || 'N/A',
            type: foundWallet.client_type || 'Particulier',
            statut: foundWallet.client_statut || 'actif'
          }
        };
        
        setWallet(walletData);
        setClient(walletData.client);
        setClientId(foundWallet.client);
        console.log(`✅ Wallet trouvé: ${walletData.id} - Client: ${walletData.client.name}`);
      } else {
        // ✅ Si non trouvé dans la liste, essayer l'endpoint direct
        console.log('⚠️ Wallet non trouvé dans la liste, essai direct...');
        try {
          const directResponse = await axiosInstance.get(`/wallet/${id}/client-wallet/`);
          console.log('📋 Réponse directe:', directResponse.data);
          
          if (directResponse.data) {
            const data = directResponse.data;
            // ✅ Construire le wallet avec les données directes
            walletData = {
              id: data.id,
              balance: data.balance || 0,
              total_deposits: data.total_deposits || 0,
              total_used: data.total_used || 0,
              is_active: data.is_active !== undefined ? data.is_active : true,
              created_at: data.created_at,
              updated_at: data.updated_at,
              client: {
                id: data.client_id || data.client?.id || null,
                name: data.client_name || data.client?.name || 'Client inconnu',
                code: data.client_code || data.client?.code || 'N/A',
                phone: data.client_phone || data.client?.phone || 'N/A',
                type: data.client_type || data.client?.type || 'Particulier',
                statut: data.client_statut || data.client?.statut || 'actif'
              }
            };
            
            setWallet(walletData);
            setClient(walletData.client);
            setClientId(walletData.client.id);
            console.log(`✅ Wallet trouvé directement: ${walletData.id} - Client: ${walletData.client.name}`);
          } else {
            setError('Porte-monnaie non trouvé');
          }
        } catch (directError) {
          console.error('❌ Erreur récupération directe:', directError);
          setError('Porte-monnaie non trouvé');
        }
      }

    } catch (error) {
      console.error('❌ Erreur chargement wallet:', error);
      
      if (error.response?.status === 404) {
        setError('Porte-monnaie non trouvé. Vérifiez l\'ID.');
      } else if (error.response?.status === 403) {
        setError('Accès non autorisé.');
      } else if (error.response?.status === 401) {
        setError('Session expirée');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 500) {
        setError('Erreur serveur. Veuillez réessayer.');
      } else {
        setError('Erreur lors du chargement du porte-monnaie');
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // Soumettre le dépôt
  const handleDeposit = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Veuillez saisir un montant valide');
      return;
    }

    if (!clientId) {
      setError('Aucun client associé à ce wallet');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        navigate('/login');
        return;
      }

      // ✅ CORPS DE LA REQUÊTE CORRECT
      const depositData = {
        client_id: parseInt(clientId),
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        notes: notes || `Dépôt de ${parseFloat(amount).toLocaleString()} FCFA en ${paymentMethod}`
      };

      console.log('📤 Envoi du dépôt:', depositData);

      // ✅ Effectuer le dépôt
      const response = await axiosInstance.post(
        `/wallet/deposit/`,
        depositData
      );

      console.log('📋 Réponse dépôt:', response.data);

      if (response.data.status === 'success') {
        setSuccess(true);
        setDepositResult({
          amount: parseFloat(amount),
          new_balance: response.data.new_balance,
          balance_display: response.data.balance_display || `${response.data.new_balance.toLocaleString()} FCFA`,
          message: response.data.message || 'Dépôt effectué avec succès'
        });
        // Mettre à jour le wallet local
        setWallet(prev => ({
          ...prev,
          balance: response.data.new_balance
        }));
      } else {
        setError(response.data.error || response.data.message || 'Erreur lors du dépôt');
      }

    } catch (error) {
      console.error('❌ Erreur dépôt:', error);
      
      if (error.response) {
        console.error('📄 Réponse erreur:', error.response.data);
        console.error('📄 Status:', error.response.status);
        
        if (error.response.status === 400) {
          if (error.response.data?.error) {
            setError(error.response.data.error);
          } else if (error.response.data?.client_id) {
            setError(`Erreur client: ${error.response.data.client_id.join(', ')}`);
          } else if (error.response.data?.amount) {
            setError(`Erreur montant: ${error.response.data.amount.join(', ')}`);
          } else {
            setError('Données invalides. Vérifiez le montant et le client.');
          }
        } else if (error.response.status === 403) {
          setError('Vous n\'avez pas les droits pour effectuer un dépôt sur ce wallet');
        } else if (error.response.status === 401) {
          setError('Session expirée');
          setTimeout(() => navigate('/login'), 2000);
        } else if (error.response.status === 404) {
          setError('Wallet ou client non trouvé');
        } else if (error.response.data?.error) {
          setError(error.response.data.error);
        } else if (error.response.data?.detail) {
          setError(error.response.data.detail);
        } else {
          setError('Erreur lors du dépôt');
        }
      } else if (error.request) {
        setError('Impossible de contacter le serveur. Vérifiez votre connexion.');
      } else {
        setError('Erreur inattendue');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (walletData) => {
    if (walletData?.is_active === false) {
      return { label: 'Inactif', className: 'badge-error' };
    }
    if ((walletData?.balance || 0) <= 0) {
      return { label: 'Solde nul', className: 'badge-warning' };
    }
    return { label: 'Actif', className: 'badge-success' };
  };

  const paymentMethods = [
    { value: 'cash', label: 'Espèces', icon: Banknote },
    { value: 'card', label: 'Carte bancaire', icon: CreditCard },
    { value: 'transfer', label: 'Virement', icon: Users },
    { value: 'mobile_money', label: 'Mobile Money', icon: Phone },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-base-content/60">Chargement du porte-monnaie...</p>
        </div>
      </div>
    );
  }

  if (error && !wallet) {
    return (
      <div className="w-full px-4 sm:px-6 py-6">
        <div className="bg-error/10 border border-error/20 text-error rounded-lg p-6 text-center max-w-2xl mx-auto">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" />
          <p className="text-lg font-semibold">{error}</p>
          <p className="text-sm mt-2 text-base-content/60">
            Vérifiez que le porte-monnaie existe et que vous avez les droits d'accès.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={fetchWallet}
              className="btn btn-primary gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
            <Link
              to="/wallets"
              className="btn btn-ghost gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour à la liste
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success && depositResult) {
    return (
      <div className="w-full px-4 sm:px-6 py-6">
        <div className="bg-base-100 rounded-xl shadow-lg border border-base-200 p-8 max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold mt-4">✅ Dépôt effectué avec succès !</h2>
          <p className="text-base-content/60 mt-2">
            {depositResult.message}
          </p>
          
          <div className="bg-base-200 rounded-xl p-4 mt-4 text-left">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-base-content/40">Montant déposé</p>
                <p className="text-xl font-bold text-success">{formatAmount(depositResult.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/40">Nouveau solde</p>
                <p className="text-xl font-bold text-primary">{depositResult.balance_display}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={`/wallets/${id}`}
              className="btn btn-primary gap-2"
            >
              <Wallet className="w-4 h-4" />
              Voir le porte-monnaie
            </Link>
            <Link
              to="/wallets"
              className="btn btn-ghost gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
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
            to={`/wallets/${id}`}
            className="p-2 rounded-lg hover:bg-base-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="w-7 h-7 text-primary" />
              Déposer de l'argent
            </h1>
            <p className="text-base-content/60 text-sm flex items-center gap-2">
              {client?.name ? (
                <>
                  <span className="font-medium text-base-content">{client.name}</span>
                  <span className="text-base-content/40">-</span>
                  <span className="font-mono">{client.code}</span>
                </>
              ) : (
                '⚠️ Aucun client associé'
              )}
            </p>
          </div>
        </div>
        <button
          onClick={fetchWallet}
          className="btn btn-ghost btn-sm gap-2"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Informations du wallet */}
      {wallet && (
        <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                  {client?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-semibold text-lg">{client?.name || 'Aucun client'}</p>
                  <div className="flex flex-wrap gap-3 text-sm text-base-content/60">
                    {client?.code && (
                      <span className="font-mono bg-base-200 px-2 py-0.5 rounded">
                        {client.code}
                      </span>
                    )}
                    {client?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {client.phone}
                      </span>
                    )}
                    {client?.type && (
                      <span className="capitalize">{client.type}</span>
                    )}
                    {!client && (
                      <span className="text-warning">⚠️ Aucun client associé</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-base-content/40">Solde actuel</p>
                  <p className={`text-2xl font-bold ${(wallet.balance || 0) > 0 ? 'text-success' : 'text-base-content/40'}`}>
                    {formatAmount(wallet.balance)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-base-content/40">Statut</p>
                  <span className={`badge ${getStatusBadge(wallet).className} badge-sm`}>
                    {getStatusBadge(wallet).label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire de dépôt */}
      <div className="bg-base-100 rounded-xl shadow-lg border border-base-200 overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            Informations du dépôt
          </h3>

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

          {!client && (
            <div className="bg-warning/10 border border-warning/20 text-warning rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Aucun client associé</p>
                  <p className="text-sm">Ce wallet n'a pas de client associé. Le dépôt ne peut pas être effectué.</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleDeposit} className="space-y-4">
            {/* Montant */}
            <div>
              <label className="block text-sm font-medium text-base-content/80 mb-2">
                Montant <span className="text-error">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40">
                  <span className="font-bold text-sm">FCFA</span>
                </div>
                <input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="Saisir le montant"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError('');
                  }}
                  className="input input-bordered w-full pl-16 text-lg font-semibold"
                  required
                  disabled={!client}
                />
              </div>
              <p className="text-xs text-base-content/40 mt-1">
                Montant minimum : 1 FCFA
              </p>
            </div>

            {/* Mode de paiement */}
            <div>
              <label className="block text-sm font-medium text-base-content/80 mb-2">
                Mode de paiement <span className="text-error">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = paymentMethod === method.value;
                  return (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPaymentMethod(method.value)}
                      disabled={!client}
                      className={`
                        flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all
                        ${isSelected 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-base-200 hover:border-base-300 bg-base-100'
                        }
                        ${!client ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-base-content/40'}`} />
                      <span className={`text-xs font-medium ${isSelected ? 'text-primary' : 'text-base-content/60'}`}>
                        {method.label}
                      </span>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-base-content/80 mb-2">
                Notes
              </label>
              <textarea
                placeholder="Ajouter une note (optionnel)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="textarea textarea-bordered w-full h-20 resize-none"
                disabled={!client}
              />
            </div>

            {/* Résumé */}
            {amount && parseFloat(amount) > 0 && wallet && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Résumé du dépôt
                </h4>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-base-content/40">Montant</p>
                    <p className="font-bold text-success">{formatAmount(parseFloat(amount))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/40">Mode</p>
                    <p className="font-medium">{paymentMethods.find(m => m.value === paymentMethod)?.label || paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/40">Nouveau solde</p>
                    <p className="font-bold text-primary">
                      {formatAmount((wallet?.balance || 0) + parseFloat(amount))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/40">Client</p>
                    <p className="font-medium truncate">{client?.name || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Boutons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-base-200">
              <button
                type="submit"
                disabled={!client || !amount || parseFloat(amount) <= 0 || submitting}
                className={`
                  btn w-full sm:flex-1 h-12 text-base font-medium gap-2
                  ${!client || !amount || parseFloat(amount) <= 0 
                    ? 'btn-disabled' 
                    : 'btn-success'
                  }
                `}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Effectuer le dépôt
                  </>
                )}
              </button>
              <Link
                to={`/wallets/${id}`}
                className="btn btn-ghost w-full sm:flex-1 h-12 text-base gap-2"
              >
                <X className="w-5 h-5" />
                Annuler
              </Link>
            </div>
          </form>

          <div className="mt-4 text-center text-xs text-base-content/40 border-t border-base-200 pt-4">
            <p>Le dépôt sera crédité immédiatement sur le porte-monnaie du client</p>
            <p>Un mouvement de trésorerie sera automatiquement créé</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletDeposit;