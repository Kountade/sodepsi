// src/pages/wallets/WalletDeposit.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Wallet,
  Banknote,
  CreditCard,
  Smartphone,
  Loader2,
  AlertCircle,
  CheckCircle,
  User,
  Calendar,
  Plus,
  Building2,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import axiosInstance from '../../components/AxiosInstance';

const WalletDeposit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [wallet, setWallet] = useState(null);
  const [client, setClient] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'cash',
    notes: ''
  });

  useEffect(() => {
    fetchWallet();
  }, [id]);

  const fetchWallet = async () => {
    setWalletLoading(true);
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axiosInstance.get(`/clients/${id}/wallet/`, {
        headers: { Authorization: `Token ${token}` }
      });

      if (response.data) {
        setWallet(response.data);
        setClient(response.data.client);
      }
    } catch (error) {
      console.error('Erreur chargement wallet:', error);
      if (error.response?.status === 404) {
        setError('Porte-monnaie non trouvé');
      } else {
        setError('Erreur lors du chargement des données');
      }
    } finally {
      setWalletLoading(false);
    }
  };

  const paymentMethods = [
    { value: 'cash', label: 'Espèces', icon: Banknote, color: 'success' },
    { value: 'card', label: 'Carte bancaire', icon: CreditCard, color: 'primary' },
    { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone, color: 'info' },
    { value: 'transfer', label: 'Virement', icon: Building2, color: 'secondary' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      setError('Veuillez saisir un montant valide');
      return;
    }

    if (amount < 100) {
      setError('Le montant minimum est de 100 FCFA');
      return;
    }

    if (amount > 10000000) {
      setError('Le montant maximum est de 10 000 000 FCFA');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('Token');
      const response = await axiosInstance.post(
        `/clients/${id}/wallet/deposit/`,
        {
          amount: amount,
          payment_method: formData.payment_method,
          notes: formData.notes || `Dépôt de ${amount} FCFA pour ${client?.name}`
        },
        {
          headers: { Authorization: `Token ${token}` }
        }
      );

      if (response.data.status === 'success') {
        setSuccess(true);
        setTimeout(() => {
          navigate(`/wallets/${id}`);
        }, 3000);
      }

    } catch (error) {
      console.error('Erreur dépôt:', error);
      setError(
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Une erreur est survenue lors du dépôt'
      );
    } finally {
      setLoading(false);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (walletLoading) {
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
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-base-100 rounded-xl shadow-lg border border-base-200 p-8 text-center">
          <AlertCircle className="w-16 h-16 text-error mx-auto" />
          <p className="text-error font-semibold mt-4">{error}</p>
          <Link to="/wallets" className="btn btn-primary btn-sm mt-4">
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-base-100 rounded-xl shadow-lg border border-base-200 p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-xl font-bold mt-4">Dépôt effectué avec succès !</h2>
          <p className="text-base-content/60 mt-2">
            {formatAmount(parseFloat(formData.amount))} ajouté au porte-monnaie
          </p>
          <div className="bg-success/5 rounded-lg p-3 mt-3">
            <p className="text-sm text-base-content/60">Nouveau solde</p>
            <p className="text-2xl font-bold text-success">
              {formatAmount((wallet?.balance || 0) + parseFloat(formData.amount))}
            </p>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => navigate(`/wallets/${id}`)}
              className="btn btn-primary btn-sm"
            >
              Voir le porte-monnaie
            </button>
            <button
              onClick={() => {
                setSuccess(false);
                setFormData({ amount: '', payment_method: 'cash', notes: '' });
                fetchWallet();
              }}
              className="btn btn-ghost btn-sm"
            >
              Nouveau dépôt
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Bouton retour */}
      <button
        onClick={() => navigate(`/wallets/${id}`)}
        className="flex items-center gap-2 text-base-content/60 hover:text-base-content transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au porte-monnaie
      </button>

      <div className="bg-base-100 rounded-xl shadow-lg border border-base-200 overflow-hidden">
        {/* En-tête avec infos client */}
        <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-content">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-content/20 flex items-center justify-center text-2xl font-bold">
              {client?.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{client?.name || 'Client inconnu'}</h2>
              <div className="flex flex-wrap gap-3 text-primary-content/80 text-sm mt-1">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {client?.code || 'N/A'}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {client?.phone || 'N/A'}
                </span>
                {client?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {client.email}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-primary-content/60 text-xs">Solde actuel</p>
              <p className="text-2xl font-bold">{formatAmount(wallet?.balance || 0)}</p>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="p-6">
          {error && (
            <div className="bg-error/10 border border-error/20 text-error rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Montant */}
            <div>
              <label className="block text-sm font-medium text-base-content/80 mb-2">
                Montant à déposer <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 font-medium">
                  FCFA
                </span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0"
                  min="100"
                  max="10000000"
                  step="100"
                  className="input input-bordered w-full pl-20 text-2xl font-bold h-14"
                  disabled={loading}
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-xs text-base-content/40">
                  Min: 100 FCFA • Max: 10 000 000 FCFA
                </p>
                <p className="text-xs text-base-content/40">
                  Nouveau solde: <span className="font-semibold text-success">
                    {formatAmount((wallet?.balance || 0) + (parseFloat(formData.amount) || 0))}
                  </span>
                </p>
              </div>
            </div>

            {/* Méthode de paiement */}
            <div>
              <label className="block text-sm font-medium text-base-content/80 mb-2">
                Moyen de paiement <span className="text-error">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = formData.payment_method === method.value;
                  return (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, payment_method: method.value }))}
                      className={`
                        flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                        ${isSelected 
                          ? `border-${method.color} bg-${method.color}/5 text-${method.color}`
                          : 'border-base-200 hover:border-base-300 text-base-content/60'
                        }
                        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      disabled={loading}
                    >
                      <Icon className={`w-6 h-6 ${isSelected ? `text-${method.color}` : ''}`} />
                      <span className="text-xs font-medium">{method.label}</span>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-success"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-base-content/80 mb-2">
                Notes (optionnel)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Ajouter une note (motif du dépôt, référence, etc.)..."
                className="textarea textarea-bordered w-full resize-none h-20"
                disabled={loading}
              />
            </div>

            {/* Résumé */}
            <div className="bg-base-200 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-base-content/60">Montant à déposer</span>
                <span className="font-bold text-lg text-success">
                  {formatAmount(parseFloat(formData.amount) || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-base-content/60">Moyen de paiement</span>
                <span className="font-medium">
                  {paymentMethods.find(m => m.value === formData.payment_method)?.label || '-'}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-base-300">
                <span className="text-base-content/60">Nouveau solde</span>
                <span className="font-bold text-lg text-success">
                  {formatAmount((wallet?.balance || 0) + (parseFloat(formData.amount) || 0))}
                </span>
              </div>
            </div>

            {/* Bouton submit */}
            <button
              type="submit"
              className="btn btn-success w-full gap-2 h-12 text-base font-medium"
              disabled={loading || !formData.amount || parseFloat(formData.amount) < 100}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Déposer {formatAmount(parseFloat(formData.amount) || 0)}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WalletDeposit;