// src/pages/wallets/WalletDetail.jsx
// ============================================================
// PAGE DE DÉTAIL D'UN PORTE-MONNAIE - CORRIGÉE
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
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Banknote,
  Clock,
  History,
  Eye,
  Mail,
  Building2,
  XCircle,
  ChevronRight,
  Copy,
  Check
} from 'lucide-react';
import axiosInstance from '../../components/AxiosInstance';

const WalletDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // ✅ Vérifier que l'ID est un nombre valide
  const isValidId = id && !isNaN(parseInt(id));
  
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [client, setClient] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalUsed: 0,
    transactionCount: 0
  });

  // Charger les informations du wallet
  const fetchWallet = useCallback(async () => {
    // ✅ Vérifier que l'ID est valide avant de faire la requête
    if (!isValidId) {
      setError('ID de porte-monnaie invalide');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = { Authorization: `Token ${token}` };

      // ✅ Récupérer le wallet via /wallet/{id}/client_wallet/
      const response = await axiosInstance.get(
        `/wallet/${id}/client_wallet/`,
        { headers }
      );
      
      console.log('📋 Réponse wallet:', response.data);

      if (response.data && response.data.wallet) {
        const walletData = response.data.wallet;
        setWallet(walletData);
        
        // Récupérer les infos du client
        if (walletData.client) {
          setClient(walletData.client);
        } else if (walletData.client_id) {
          try {
            const clientResponse = await axiosInstance.get(
              `/clients/${walletData.client_id}/`,
              { headers }
            );
            setClient(clientResponse.data);
          } catch (clientError) {
            console.warn('Erreur chargement client:', clientError);
          }
        }
      } else {
        setError('Porte-monnaie non trouvé');
      }

      // ✅ Récupérer les transactions via /wallet/{id}/wallet_transactions/
      try {
        const transResponse = await axiosInstance.get(
          `/wallet/${id}/wallet_transactions/`,
          { headers }
        );
        
        console.log('📋 Réponse transactions:', transResponse.data);
        
        if (transResponse.data && transResponse.data.transactions) {
          const transactionsData = transResponse.data.transactions || [];
          setTransactions(transactionsData);
          
          // Calculer les statistiques
          let totalDeposits = 0;
          let totalUsed = 0;
          transactionsData.forEach(t => {
            if (t.type === 'credit') {
              totalDeposits += t.amount || 0;
            } else if (t.type === 'debit') {
              totalUsed += t.amount || 0;
            }
          });
          
          setStats({
            totalDeposits,
            totalUsed,
            transactionCount: transactionsData.length
          });
        }
      } catch (transError) {
        console.warn('Erreur chargement transactions:', transError);
        // Ne pas bloquer l'affichage si les transactions échouent
      }

    } catch (error) {
      console.error('❌ Erreur chargement wallet:', error);
      if (error.response?.status === 404) {
        setError('Porte-monnaie non trouvé');
      } else if (error.response?.status === 403) {
        setError('Accès non autorisé. Vous devez être administrateur.');
      } else if (error.response?.status === 401) {
        setError('Session expirée');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Erreur lors du chargement du porte-monnaie');
      }
    } finally {
      setLoading(false);
    }
  }, [id, isValidId, navigate]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // ✅ Redirection si l'ID est invalide
  useEffect(() => {
    if (!isValidId && !loading) {
      navigate('/wallets');
    }
  }, [isValidId, loading, navigate]);

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const getTransactionTypeBadge = (type) => {
    if (type === 'credit') {
      return { label: 'Crédit', className: 'badge-success', icon: TrendingUp };
    }
    return { label: 'Débit', className: 'badge-error', icon: TrendingDown };
  };

  const getTransactionSourceLabel = (source) => {
    const sources = {
      'deposit': 'Dépôt',
      'payment': 'Paiement',
      'avoir': 'Avoir',
      'refund': 'Remboursement',
      'transfer': 'Transfert',
      'adjustment': 'Ajustement'
    };
    return sources[source] || source || 'N/A';
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // ✅ Vérification de l'ID valide
  if (!isValidId && !loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-error">ID invalide</h2>
          <p className="text-base-content/60 mt-2">L'identifiant du porte-monnaie est invalide.</p>
          <Link to="/wallets" className="btn btn-primary mt-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

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
              Détails du porte-monnaie
            </h1>
            <p className="text-base-content/60 text-sm">
              {client?.name || 'Client'} - {client?.code || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchWallet}
            className="btn btn-ghost btn-sm gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <Link
            to={`/wallets/${id}/deposit`}
            className="btn btn-success btn-sm gap-2"
          >
            <Plus className="w-4 h-4" />
            Déposer
          </Link>
        </div>
      </div>

      {/* Informations du wallet */}
      {wallet && client && (
        <>
          {/* Carte principale */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-base-100 rounded-xl shadow-lg border border-primary/20 overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Client info */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl flex-shrink-0">
                    {client.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{client.name}</h2>
                    <div className="flex flex-wrap gap-3 text-sm text-base-content/60">
                      <span className="font-mono bg-base-200 px-2 py-0.5 rounded flex items-center gap-1">
                        {client.code}
                        <button
                          onClick={() => copyToClipboard(client.code)}
                          className="hover:text-primary transition-colors"
                          title="Copier le code"
                        >
                          {copied ? (
                            <Check className="w-3 h-3 text-success" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </span>
                      {client.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {client.phone}
                        </span>
                      )}
                      {client.type && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {client.type}
                        </span>
                      )}
                      {client.address && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {client.address}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Solde et statut */}
                <div className="flex flex-wrap items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-base-content/40">Solde disponible</p>
                    <p className={`text-3xl font-bold ${(wallet.balance || 0) > 0 ? 'text-success' : 'text-base-content/40'}`}>
                      {formatAmount(wallet.balance)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-base-content/40">Statut</p>
                    <span className={`badge ${getStatusBadge(wallet).className} badge-lg`}>
                      {getStatusBadge(wallet).label}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-base-content/40">Créé le</p>
                    <p className="text-sm font-medium">{formatDate(wallet.created_at)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-base-content/40">ID Wallet</p>
                    <p className="text-sm font-mono font-bold">#{wallet.id}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-base-100 rounded-xl p-4 border border-base-200 shadow-sm">
              <div className="flex items-center gap-2 text-success">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs text-base-content/60">Total dépôts</span>
              </div>
              <p className="text-xl font-bold">{formatAmount(stats.totalDeposits)}</p>
            </div>
            <div className="bg-base-100 rounded-xl p-4 border border-base-200 shadow-sm">
              <div className="flex items-center gap-2 text-error">
                <TrendingDown className="w-4 h-4" />
                <span className="text-xs text-base-content/60">Total utilisé</span>
              </div>
              <p className="text-xl font-bold">{formatAmount(stats.totalUsed)}</p>
            </div>
            <div className="bg-base-100 rounded-xl p-4 border border-base-200 shadow-sm">
              <div className="flex items-center gap-2 text-primary">
                <History className="w-4 h-4" />
                <span className="text-xs text-base-content/60">Transactions</span>
              </div>
              <p className="text-xl font-bold">{stats.transactionCount}</p>
            </div>
            <div className="bg-base-100 rounded-xl p-4 border border-base-200 shadow-sm">
              <div className="flex items-center gap-2 text-warning">
                <Wallet className="w-4 h-4" />
                <span className="text-xs text-base-content/60">ID Wallet</span>
              </div>
              <p className="text-sm font-mono font-bold truncate">#{wallet.id}</p>
            </div>
          </div>

          {/* Historique des transactions */}
          <div className="bg-base-100 rounded-xl shadow-lg border border-base-200 overflow-hidden">
            <div className="p-4 border-b border-base-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Historique des transactions
                <span className="badge badge-ghost badge-sm">{transactions.length}</span>
              </h3>
              <span className="text-xs text-base-content/40">
                {transactions.length > 0 ? `${transactions.length} transaction(s)` : 'Aucune transaction'}
              </span>
            </div>

            {transactions.length === 0 ? (
              <div className="p-12 text-center">
                <History className="w-16 h-16 text-base-content/20 mx-auto" />
                <p className="text-base-content/40 mt-4">Aucune transaction</p>
                <p className="text-sm text-base-content/30">Les transactions apparaîtront ici</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-hover w-full">
                  <thead className="bg-base-200/50">
                    <tr>
                      <th className="text-xs font-medium uppercase px-4 py-3 text-left">Date</th>
                      <th className="text-xs font-medium uppercase px-4 py-3 text-left">Type</th>
                      <th className="text-xs font-medium uppercase px-4 py-3 text-left">Source</th>
                      <th className="text-xs font-medium uppercase px-4 py-3 text-right">Montant</th>
                      <th className="text-xs font-medium uppercase px-4 py-3 text-right">Solde après</th>
                      <th className="text-xs font-medium uppercase px-4 py-3 text-left">Référence</th>
                      <th className="text-xs font-medium uppercase px-4 py-3 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction, index) => {
                      const typeInfo = getTransactionTypeBadge(transaction.type);
                      const Icon = typeInfo.icon;
                      const isCredit = transaction.type === 'credit';
                      return (
                        <tr key={transaction.id || index} className="hover:bg-base-200/50 transition-colors border-b border-base-200/50">
                          <td className="px-4 py-3 text-sm">
                            {formatDate(transaction.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge ${typeInfo.className} badge-sm gap-1`}>
                              <Icon className="w-3 h-3" />
                              {typeInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {getTransactionSourceLabel(transaction.source)}
                          </td>
                          <td className={`px-4 py-3 text-right font-bold ${isCredit ? 'text-success' : 'text-error'}`}>
                            {isCredit ? '+' : '-'}{formatAmount(transaction.amount)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {formatAmount(transaction.balance_after)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono bg-base-200 px-2 py-0.5 rounded">
                              {transaction.reference || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-base-content/60 max-w-xs truncate">
                            {transaction.notes || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Actions rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to={`/wallets/${id}/deposit`}
              className="btn btn-success gap-2"
            >
              <Plus className="w-4 h-4" />
              Déposer
            </Link>
            <Link
              to={`/wallets/${id}/pay`}
              className="btn btn-primary gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Payer
            </Link>
            <button
              className="btn btn-outline gap-2"
              onClick={fetchWallet}
            >
              <RefreshCw className="w-4 h-4" />
              Rafraîchir
            </button>
            <Link
              to="/wallets"
              className="btn btn-ghost gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Link>
          </div>

          {/* Information supplémentaire */}
          <div className="bg-base-200/50 rounded-lg p-4 text-center text-xs text-base-content/40">
            <p>Le porte-monnaie permet au client de payer ses factures et de recevoir des dépôts.</p>
            <p className="mt-1">Toutes les transactions sont traçables et sécurisées.</p>
          </div>
        </>
      )}
    </div>
  );
};

export default WalletDetail;