// src/pages/wallets/WalletPay.jsx - VERSION CORRIGÉE

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  Wallet,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import axiosInstance from '../AxiosInstance';

const WalletPay = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { walletId, clientId, clientName } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [wallet, setWallet] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');

  // Récupérer le wallet et les factures impayées
  useEffect(() => {
    if (clientId) {
      fetchWallet();
      fetchInvoices();
    }
  }, [clientId]);

  const fetchWallet = async () => {
    try {
      // ✅ URL corrigée : client-wallet (avec tiret)
      const response = await axiosInstance.get(`/clients/${clientId}/wallet/`);
      setWallet(response.data);
    } catch (error) {
      console.error('❌ Erreur chargement wallet:', error);
      setError('Erreur lors du chargement du wallet');
    }
  };

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      // ✅ URL corrigée : unpaid-invoices (avec tiret)
      const response = await axiosInstance.get(`/clients/${clientId}/unpaid-invoices/`);
      setInvoices(response.data);
      if (response.data.length === 0) {
        setMessage({ type: 'info', text: 'Aucune facture impayée pour ce client' });
      }
    } catch (error) {
      console.error('❌ Erreur chargement factures:', error);
      setError('Erreur lors du chargement des factures');
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage(null);

    try {
      // ✅ Envoi du paiement avec méthode 'wallet'
      const response = await axiosInstance.post('/wallet/pay-invoice/', {
        facture_id: parseInt(selectedInvoice),
        amount: parseFloat(amount),
        notes: notes
      });

      console.log('✅ Paiement réussi:', response.data);

      setMessage({ 
        type: 'success', 
        text: response.data.message || 'Paiement effectué avec succès' 
      });
      
      // Réinitialiser le formulaire
      setSelectedInvoice('');
      setAmount('');
      setNotes('');
      
      // Rafraîchir les données
      fetchWallet();
      fetchInvoices();

      // Rediriger après 3 secondes
      setTimeout(() => {
        navigate('/wallets');
      }, 3000);

    } catch (error) {
      console.error('❌ Erreur paiement:', error);
      
      let errorMsg = 'Erreur lors du paiement';
      if (error.response) {
        console.error('📋 Réponse erreur:', error.response.data);
        console.error('📋 Status:', error.response.status);
        
        if (error.response.status === 400) {
          // ✅ Gérer l'erreur de méthode de paiement
          if (error.response.data?.method) {
            errorMsg = `Méthode de paiement invalide: ${error.response.data.method}`;
          } else {
            errorMsg = error.response.data?.error || error.response.data?.detail || 'Données invalides';
          }
        } else if (error.response.status === 403) {
          errorMsg = 'Vous n\'avez pas les droits pour effectuer ce paiement';
        } else if (error.response.status === 404) {
          errorMsg = 'Facture ou wallet non trouvé';
        } else if (error.response.status === 401) {
          errorMsg = 'Session expirée. Veuillez vous reconnecter.';
          setTimeout(() => navigate('/login'), 2000);
        } else if (error.response.status === 500) {
          errorMsg = 'Erreur serveur. Veuillez réessayer plus tard.';
        } else {
          errorMsg = error.response.data?.error || error.response.data?.detail || 'Erreur inattendue';
        }
      } else if (error.request) {
        errorMsg = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const selectedInvoiceData = invoices.find(f => f.id === parseInt(selectedInvoice));
  const remainingAmount = selectedInvoiceData?.remaining_amount || 0;

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      {/* En-tête */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/wallets')}
          className="btn btn-ghost btn-sm gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-primary" />
          Payer une facture
        </h1>
      </div>

      {/* Infos client */}
      <div className="bg-base-100 rounded-xl p-4 border border-base-200 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {clientName?.charAt(0) || '?'}
          </div>
          <div>
            <p className="font-medium">{clientName || 'Client'}</p>
            {wallet && (
              <p className="text-sm text-success font-medium">
                Solde disponible: {formatAmount(wallet.balance)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-error/10 border border-error/20 text-error rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">Erreur</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {message && (
        <div className={`rounded-lg p-3 mb-4 flex items-start gap-2 ${
          message.type === 'success' 
            ? 'bg-success/10 border border-success/20 text-success' 
            : 'bg-info/10 border border-info/20 text-info'
        }`}>
          {message.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {message.type === 'info' && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Formulaire de paiement */}
      {invoices.length > 0 && (
        <div className="bg-base-100 rounded-xl p-6 border border-base-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Sélectionnez une facture
              </label>
              {loadingInvoices ? (
                <div className="flex items-center gap-2 text-base-content/60">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Chargement des factures...</span>
                </div>
              ) : (
                <select
                  value={selectedInvoice}
                  onChange={(e) => {
                    setSelectedInvoice(e.target.value);
                    const facture = invoices.find(f => f.id === parseInt(e.target.value));
                    if (facture) {
                      setAmount(facture.remaining_amount.toString());
                    }
                  }}
                  required
                  className="select select-bordered w-full"
                >
                  <option value="">Choisir une facture</option>
                  {invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.invoice_number} - {formatAmount(invoice.total)} 
                      (Reste: {formatAmount(invoice.remaining_amount)})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedInvoice && selectedInvoiceData && (
              <>
                <div className="bg-base-200/50 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-base-content/60">Total facture</p>
                      <p className="font-medium">{formatAmount(selectedInvoiceData.total)}</p>
                    </div>
                    <div>
                      <p className="text-base-content/60">Déjà payé</p>
                      <p className="font-medium">{formatAmount(selectedInvoiceData.amount_paid || 0)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-base-content/60">Reste à payer</p>
                      <p className="font-bold text-primary">{formatAmount(selectedInvoiceData.remaining_amount)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Montant à payer (FCFA)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="1"
                    max={remainingAmount}
                    step="1"
                    className="input input-bordered w-full"
                    placeholder="Saisir le montant"
                  />
                  <p className="text-xs text-base-content/40 mt-1">
                    Maximum: {formatAmount(remainingAmount)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="2"
                    className="textarea textarea-bordered w-full"
                    placeholder="Ajouter une note..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !selectedInvoice || !amount || parseFloat(amount) <= 0}
                  className="btn btn-primary w-full gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Traitement en cours...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4" />
                      Payer avec le wallet
                    </>
                  )}
                </button>
              </>
            )}
          </form>
        </div>
      )}

      {/* Aucune facture */}
      {!loadingInvoices && invoices.length === 0 && (
        <div className="bg-base-100 rounded-xl p-8 border border-base-200 shadow-sm text-center">
          <CheckCircle className="w-12 h-12 text-success mx-auto" />
          <p className="mt-4 font-medium">Toutes les factures sont payées</p>
          <p className="text-sm text-base-content/60">
            Ce client n'a aucune facture impayée
          </p>
        </div>
      )}
    </div>
  );
};

export default WalletPay;