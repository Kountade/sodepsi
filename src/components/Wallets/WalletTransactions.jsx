// src/pages/wallets/WalletTransactions.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Wallet,
  History,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  User,
  Phone,
  FileText,
  Download,
  Printer
} from 'lucide-react';
import axiosInstance from '../../components/AxiosInstance';

const WalletTransactions = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [client, setClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    source: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total_credits: 0,
    total_debits: 0,
    count: 0
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchTerm, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Récupérer le wallet
      const walletRes = await axiosInstance.get(`/clients/${id}/wallet/`, {
        headers: { Authorization: `Token ${token}` }
      });

      if (walletRes.data) {
        setWallet(walletRes.data);
        setClient(walletRes.data.client);
      }

      // Récupérer les transactions
      const transactionsRes = await axiosInstance.get(`/clients/${id}/wallet/transactions/`, {
        headers: { Authorization: `Token ${token}` }
      });

      setTransactions(transactionsRes.data || []);
      calculateStats(transactionsRes.data || []);

    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const credits = data.filter(t => t.type === 'credit');
    const debits = data.filter(t => t.type === 'debit');
    setStats({
      total_credits: credits.reduce((sum, t) => sum + t.amount, 0),
      total_debits: debits.reduce((sum, t) => sum + t.amount, 0),
      count: data.length
    });
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        (t.reference && t.reference.toLowerCase().includes(searchLower)) ||
        (t.notes && t.notes.toLowerCase().includes(searchLower)) ||
        (t.source_display && t.source_display.toLowerCase().includes(searchLower))
      );
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    if (filters.source !== 'all') {
      filtered = filtered.filter(t => t.source === filters.source);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(t => new Date(t.created_at) >= new Date(filters.dateFrom));
    }

    if (filters.dateTo) {
      filtered = filtered.filter(t => new Date(t.created_at) <= new Date(filters.dateTo + 'T23:59:59'));
    }

    setFilteredTransactions(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      source: 'all',
      dateFrom: '',
      dateTo: ''
    });
    setSearchTerm('');
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

  const getTypeColor = (type) => {
    return type === 'credit' ? 'text-success' : 'text-error';
  };

  const getTypeBg = (type) => {
    return type === 'credit' ? 'bg-success/10' : 'bg-error/10';
  };

  const getTypeIcon = (type) => {
    return type === 'credit' ? <TrendingDown className="w-4 h-4 text-success" /> : <TrendingUp className="w-4 h-4 text-error" />;
  };

  const getSourceIcon = (source) => {
    const icons = {
      deposit: <Banknote className="w-4 h-4" />,
      payment: <CreditCard className="w-4 h-4" />,
      avoir: <FileText className="w-4 h-4" />,
      refund: <RefreshCw className="w-4 h-4" />,
      transfer: <Building2 className="w-4 h-4" />,
      adjustment: <AlertCircle className="w-4 h-4" />
    };
    return icons[source] || <Wallet className="w-4 h-4" />;
  };

  const getSourceLabel = (source) => {
    const labels = {
      deposit: 'Dépôt',
      payment: 'Paiement',
      avoir: 'Avoir',
      refund: 'Remboursement',
      transfer: 'Transfert',
      adjustment: 'Ajustement'
    };
    return labels[source] || source;
  };

  const sourceOptions = [
    { value: 'all', label: 'Toutes les sources' },
    { value: 'deposit', label: 'Dépôts' },
    { value: 'payment', label: 'Paiements' },
    { value: 'avoir', label: 'Avoirs' },
    { value: 'refund', label: 'Remboursements' },
    { value: 'transfer', label: 'Transferts' },
    { value: 'adjustment', label: 'Ajustements' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-base-content/60">Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-0 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/wallets/${id}`)}
            className="p-2 rounded-lg hover:bg-base-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <History className="w-7 h-7 text-primary" />
              Historique des transactions
            </h1>
            <p className="text-base-content/60 text-sm">
              {client?.name || 'Client inconnu'} • {client?.code || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="btn btn-ghost btn-sm gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
          <button
            className="btn btn-ghost btn-sm gap-2"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-4 px-4 sm:px-6">
        <div className="bg-success/5 rounded-lg p-4 text-center border border-success/20">
          <p className="text-xs text-base-content/60">Total crédits</p>
          <p className="text-success font-bold text-lg">{formatAmount(stats.total_credits)}</p>
        </div>
        <div className="bg-error/5 rounded-lg p-4 text-center border border-error/20">
          <p className="text-xs text-base-content/60">Total débits</p>
          <p className="text-error font-bold text-lg">{formatAmount(stats.total_debits)}</p>
        </div>
        <div className="bg-primary/5 rounded-lg p-4 text-center border border-primary/20">
          <p className="text-xs text-base-content/60">Transactions</p>
          <p className="text-primary font-bold text-lg">{stats.count}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-base-100 shadow-sm border-t border-b border-base-200 py-4 px-4 sm:px-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              placeholder="Rechercher par référence ou note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-bordered w-full pl-10"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-ghost btn-sm gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtres
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-base-200">
            <div>
              <label className="block text-xs font-medium text-base-content/60 mb-1">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="select select-bordered select-sm w-full"
              >
                <option value="all">Tous</option>
                <option value="credit">Crédits</option>
                <option value="debit">Débits</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-base-content/60 mb-1">
                Source
              </label>
              <select
                value={filters.source}
                onChange={(e) => handleFilterChange('source', e.target.value)}
                className="select select-bordered select-sm w-full"
              >
                {sourceOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-base-content/60 mb-1">
                Date début
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="input input-bordered input-sm w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-base-content/60 mb-1">
                Date fin
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="input input-bordered input-sm w-full"
              />
            </div>
            <div className="md:col-span-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="btn btn-ghost btn-xs"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Liste des transactions */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-base-100 shadow-sm border-t border-b border-base-200 p-12 text-center">
          <History className="w-16 h-16 text-base-content/20 mx-auto" />
          <p className="text-base-content/40 mt-4">
            {transactions.length === 0 
              ? 'Aucune transaction effectuée' 
              : 'Aucune transaction ne correspond aux filtres'
            }
          </p>
        </div>
      ) : (
        <div className="bg-base-100 shadow-sm border-t border-b border-base-200">
          <div className="overflow-x-auto">
            <table className="table table-hover w-full">
              <thead className="bg-base-200/50">
                <tr>
                  <th className="text-xs font-medium uppercase px-4 py-3 text-left">Type</th>
                  <th className="text-xs font-medium uppercase px-4 py-3 text-left">Source</th>
                  <th className="text-xs font-medium uppercase px-4 py-3 text-left">Référence</th>
                  <th className="text-xs font-medium uppercase px-4 py-3 text-left">Date</th>
                  <th className="text-xs font-medium uppercase px-4 py-3 text-right">Montant</th>
                  <th className="text-xs font-medium uppercase px-4 py-3 text-right">Solde après</th>
                  <th className="text-xs font-medium uppercase px-4 py-3 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-base-200/50 transition-colors border-b border-base-200/50">
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-2 ${getTypeColor(transaction.type)}`}>
                        {getTypeIcon(transaction.type)}
                        <span className="font-medium">
                          {transaction.type === 'credit' ? 'Crédit' : 'Débit'}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 text-sm">
                        {getSourceIcon(transaction.source)}
                        <span>{getSourceLabel(transaction.source)}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono bg-base-200 px-2 py-1 rounded">
                        {transaction.reference || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-base-content/60">
                      {formatDate(transaction.created_at)}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${getTypeColor(transaction.type)}`}>
                      {transaction.type === 'credit' ? '+' : '-'}
                      {formatAmount(transaction.amount)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatAmount(transaction.balance_after)}
                    </td>
                    <td className="px-4 py-3 text-sm text-base-content/60 max-w-xs truncate">
                      {transaction.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer avec total */}
          <div className="bg-base-200/50 px-4 py-3 border-t border-base-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-base-content/60">
                {filteredTransactions.length} transaction(s)
              </span>
              <div className="flex gap-6 text-sm">
                <span>
                  Crédits: <span className="font-semibold text-success">
                    {formatAmount(filteredTransactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0))}
                  </span>
                </span>
                <span>
                  Débits: <span className="font-semibold text-error">
                    {formatAmount(filteredTransactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0))}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletTransactions;