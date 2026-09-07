// src/pages/wallets/WalletsList.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet,
  Search,
  Plus,
  Eye,
  TrendingUp,
  TrendingDown,
  Filter,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  User,
  Phone,
  Calendar,
  CreditCard,
  History,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronRight
} from 'lucide-react';
import axiosInstance from '../../components/AxiosInstance';

const WalletsList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState([]);
  const [filteredWallets, setFilteredWallets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    minBalance: '',
    maxBalance: '',
    status: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    totalBalance: 0,
    activeCount: 0,
    inactiveCount: 0
  });

  useEffect(() => {
    fetchWallets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [wallets, searchTerm, filters]);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axiosInstance.get('/clients/', {
        headers: { Authorization: `Token ${token}` }
      });

      const walletsData = [];
      for (const client of response.data) {
        try {
          const walletRes = await axiosInstance.get(`/clients/${client.id}/wallet/`, {
            headers: { Authorization: `Token ${token}` }
          });
          if (walletRes.data) {
            walletsData.push({
              ...walletRes.data,
              client: client
            });
          }
        } catch (error) {
          console.warn(`Wallet non trouvé pour le client ${client.id}`);
        }
      }

      setWallets(walletsData);
      calculateStats(walletsData);

    } catch (error) {
      console.error('Erreur chargement wallets:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const total = data.length;
    const totalBalance = data.reduce((sum, w) => sum + (w.balance || 0), 0);
    const activeCount = data.filter(w => w.is_active !== false).length;
    const inactiveCount = data.filter(w => w.is_active === false).length;
    
    setStats({
      total,
      totalBalance,
      activeCount,
      inactiveCount
    });
  };

  const applyFilters = () => {
    let filtered = [...wallets];

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(w =>
        w.client?.name?.toLowerCase().includes(searchLower) ||
        w.client?.code?.toLowerCase().includes(searchLower) ||
        w.client?.phone?.includes(searchTerm)
      );
    }

    if (filters.minBalance) {
      const min = parseFloat(filters.minBalance);
      filtered = filtered.filter(w => (w.balance || 0) >= min);
    }

    if (filters.maxBalance) {
      const max = parseFloat(filters.maxBalance);
      filtered = filtered.filter(w => (w.balance || 0) <= max);
    }

    if (filters.status === 'active') {
      filtered = filtered.filter(w => w.is_active !== false);
    } else if (filters.status === 'inactive') {
      filtered = filtered.filter(w => w.is_active === false);
    }

    setFilteredWallets(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      minBalance: '',
      maxBalance: '',
      status: 'all'
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

  const getStatusBadge = (wallet) => {
    if (wallet.is_active === false) {
      return { label: 'Inactif', className: 'badge-error' };
    }
    if ((wallet.balance || 0) <= 0) {
      return { label: 'Solde nul', className: 'badge-warning' };
    }
    return { label: 'Actif', className: 'badge-success' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-base-content/60">Chargement des porte-monnaie...</p>
        </div>
      </div>
    );
  }

  return (
    // ✅ SUPPRESSION de max-w-7xl et mx-auto pour pleine largeur
    // ✅ Ajout de px-0 pour aucun padding
    <div className="w-full px-0 space-y-6">
      
      {/* En-tête - avec un peu de padding interne mais pas de marge externe */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-7 h-7 text-primary" />
            Porte-monnaie Clients
          </h1>
          <p className="text-base-content/60 text-sm">
            Gérez les porte-monnaie de vos clients
          </p>
        </div>
        <button
          onClick={() => navigate('/clients')}
          className="btn btn-primary btn-sm gap-2"
        >
          <Plus className="w-4 h-4" />
          Voir les clients
        </button>
      </div>

      {/* Statistiques - pleine largeur avec padding interne */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 sm:px-6">
        <div className="bg-base-100 rounded-xl p-4 border border-base-200 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <Wallet className="w-4 h-4" />
            <span className="text-xs text-base-content/60">Total</span>
          </div>
          <p className="text-xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-base-100 rounded-xl p-4 border border-base-200 shadow-sm">
          <div className="flex items-center gap-2 text-success">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs text-base-content/60">Solde total</span>
          </div>
          <p className="text-xl font-bold">{formatAmount(stats.totalBalance)}</p>
        </div>
        <div className="bg-base-100 rounded-xl p-4 border border-base-200 shadow-sm">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs text-base-content/60">Actifs</span>
          </div>
          <p className="text-xl font-bold">{stats.activeCount}</p>
        </div>
        <div className="bg-base-100 rounded-xl p-4 border border-base-200 shadow-sm">
          <div className="flex items-center gap-2 text-error">
            <XCircle className="w-4 h-4" />
            <span className="text-xs text-base-content/60">Inactifs</span>
          </div>
          <p className="text-xl font-bold">{stats.inactiveCount}</p>
        </div>
      </div>

      {/* Barre de recherche - pleine largeur */}
      <div className="bg-base-100 shadow-sm border-t border-b border-base-200 py-4 px-4 sm:px-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              placeholder="Rechercher un client (nom, code, téléphone)..."
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
            <button
              onClick={fetchWallets}
              className="btn btn-ghost btn-sm gap-2"
              title="Actualiser"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-base-200">
            <div>
              <label className="block text-xs font-medium text-base-content/60 mb-1">
                Solde minimum
              </label>
              <input
                type="number"
                placeholder="Min"
                value={filters.minBalance}
                onChange={(e) => handleFilterChange('minBalance', e.target.value)}
                className="input input-bordered input-sm w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-base-content/60 mb-1">
                Solde maximum
              </label>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxBalance}
                onChange={(e) => handleFilterChange('maxBalance', e.target.value)}
                className="input input-bordered input-sm w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-base-content/60 mb-1">
                Statut
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="select select-bordered select-sm w-full"
              >
                <option value="all">Tous</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>
            <div className="md:col-span-3 flex justify-end">
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

      {/* Liste des wallets - pleine largeur, sans padding */}
      {filteredWallets.length === 0 ? (
        <div className="bg-base-100 shadow-sm border-t border-b border-base-200 p-12 text-center">
          <Wallet className="w-16 h-16 text-base-content/20 mx-auto" />
          <p className="text-base-content/40 mt-4">
            {wallets.length === 0 
              ? 'Aucun porte-monnaie trouvé' 
              : 'Aucun résultat ne correspond à vos critères'
            }
          </p>
          {wallets.length === 0 && (
            <p className="text-sm text-base-content/30 mt-1">
              Les porte-monnaie sont créés automatiquement lors de la création des clients
            </p>
          )}
        </div>
      ) : (
        <div className="bg-base-100 shadow-sm border-t border-b border-base-200 overflow-x-auto">
          <table className="table table-hover w-full">
            <thead className="bg-base-200/50">
              <tr>
                <th className="text-xs font-medium uppercase px-4 py-3 text-left">Client</th>
                <th className="text-xs font-medium uppercase px-4 py-3 text-left">Code</th>
                <th className="text-xs font-medium uppercase px-4 py-3 text-right">Solde</th>
                <th className="text-xs font-medium uppercase px-4 py-3 text-right">Dépôts</th>
                <th className="text-xs font-medium uppercase px-4 py-3 text-right">Utilisé</th>
                <th className="text-xs font-medium uppercase px-4 py-3 text-center">Statut</th>
                <th className="text-xs font-medium uppercase px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWallets.map((wallet) => {
                const status = getStatusBadge(wallet);
                return (
                  <tr key={wallet.id} className="hover:bg-base-200/50 transition-colors border-b border-base-200/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {wallet.client?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{wallet.client?.name || 'Client inconnu'}</p>
                          <p className="text-xs text-base-content/40 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {wallet.client?.phone || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono bg-base-200 px-2 py-1 rounded">
                        {wallet.client?.code || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${(wallet.balance || 0) > 0 ? 'text-success' : 'text-base-content/40'}`}>
                        {formatAmount(wallet.balance)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {formatAmount(wallet.total_deposits || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {formatAmount(wallet.total_used || 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${status.className} badge-sm`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          to={`/wallets/${wallet.id}`}
                          className="btn btn-ghost btn-xs btn-square"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/wallets/${wallet.id}/deposit`}
                          className="btn btn-success btn-xs btn-square"
                          title="Déposer"
                        >
                          <Plus className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/wallets/${wallet.id}/transactions`}
                          className="btn btn-info btn-xs btn-square"
                          title="Historique"
                        >
                          <History className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WalletsList;