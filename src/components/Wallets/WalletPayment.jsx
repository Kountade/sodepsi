// src/pages/wallets/WalletPayment.jsx
// ============================================================
// PAGE DE PAIEMENT AVEC LE PORTE-MONNAIE - CORRIGÉE
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Wallet,
  Phone,
  Loader2,
  AlertCircle,
  CheckCircle,
  Plus,
  RefreshCw,
  CreditCard,
  Calendar,
  X,
  Clock,
  FileText,
  Search,
  ChevronDown,
  ChevronUp,
  Receipt,
  AlertTriangle,
  User
} from 'lucide-react';
import AxiosInstance from '../../components/AxiosInstance';

const WalletPayment = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const isValidId = id && !isNaN(parseInt(id));

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [client, setClient] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInvoiceList, setShowInvoiceList] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [availableClients, setAvailableClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);

  // Charger les informations du wallet et les factures
  const fetchData = useCallback(async () => {
    if (!isValidId) {
      setError('ID de porte-monnaie invalide');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    setDebugInfo('');
    setUnpaidInvoices([]);
    
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        navigate('/login');
        return;
      }

      // 1. Récupérer le wallet
      console.log('🔍 1. Récupération du wallet...');
      const walletResponse = await AxiosInstance.get(
        `/wallet/${id}/client-wallet/`
      );
      
      console.log('📋 Réponse wallet:', walletResponse.data);

      if (walletResponse.data) {
        const walletData = walletResponse.data;
        setWallet(walletData);
        
        let currentClientId = null;
        
        // ✅ Récupérer l'ID du client - Supporte plusieurs structures
        if (walletData.client_id) {
          currentClientId = walletData.client_id;
          console.log(`✅ Client ID trouvé dans wallet: ${currentClientId}`);
        } else if (walletData.client && walletData.client.id) {
          currentClientId = walletData.client.id;
          setClient(walletData.client);
          console.log(`✅ Client trouvé dans wallet: ID=${currentClientId}, Nom=${walletData.client.name}`);
        } else if (walletData.id) {
          // ✅ Si le wallet n'a pas de client, on peut essayer de récupérer via l'API
          console.log('⚠️ Le wallet n\'a pas de client associé');
          setDebugInfo('Ce wallet n\'a pas de client associé. Veuillez sélectionner un client.');
          setShowClientSelector(true);
          
          // Charger la liste des clients disponibles
          try {
            const clientsResponse = await AxiosInstance.get('/clients/', { 
              params: { statut: 'actif' } 
            });
            let clientsData = [];
            if (Array.isArray(clientsResponse.data)) {
              clientsData = clientsResponse.data;
            } else if (clientsResponse.data?.results) {
              clientsData = clientsResponse.data.results;
            }
            setAvailableClients(clientsData);
            console.log(`📋 ${clientsData.length} clients disponibles`);
          } catch (clientsError) {
            console.error('❌ Erreur chargement clients:', clientsError);
          }
        }
        
        // Si on a un client ID, charger les factures
        if (currentClientId) {
          setClientId(currentClientId);
          await fetchInvoices(currentClientId);
        } else {
          // Pas de client associé
          setDebugInfo('Aucun client associé à ce wallet');
          setUnpaidInvoices([]);
        }
      } else {
        setError('Porte-monnaie non trouvé');
      }

    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      if (error.response?.status === 404) {
        setError('Porte-monnaie non trouvé');
      } else if (error.response?.status === 403) {
        setError('Accès non autorisé.');
      } else if (error.response?.status === 401) {
        setError('Session expirée');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Erreur lors du chargement des données');
      }
    } finally {
      setLoading(false);
    }
  }, [id, isValidId, navigate]);

  // Fonction pour charger les factures d'un client
  const fetchInvoices = async (clientIdToFetch) => {
    if (!clientIdToFetch) return;
    
    try {
      console.log(`🔍 2. Récupération des factures pour client ID: ${clientIdToFetch}`);
      
      const invoicesResponse = await AxiosInstance.get(
        `/factures/`,
        { 
          params: { 
            client: clientIdToFetch,
            status: 'sent,overdue,partial'
          } 
        }
      );
      
      let invoicesData = [];
      if (Array.isArray(invoicesResponse.data)) {
        invoicesData = invoicesResponse.data;
      } else if (invoicesResponse.data?.results) {
        invoicesData = invoicesResponse.data.results;
      } else if (invoicesResponse.data?.data) {
        invoicesData = invoicesResponse.data.data;
      }
      
      console.log(`📋 ${invoicesData.length} factures trouvées`);
      
      // Filtrer les factures avec reste à payer
      const unpaid = invoicesData.filter(inv => {
        const total = parseFloat(inv.total || 0);
        const paid = parseFloat(inv.amount_paid || 0);
        return (total - paid) > 0;
      });
      
      console.log(`📋 ${unpaid.length} factures avec reste à payer`);
      
      if (unpaid.length === 0 && invoicesData.length > 0) {
        setDebugInfo(`${invoicesData.length} facture(s) trouvée(s), mais toutes sont payées.`);
      } else if (invoicesData.length === 0) {
        setDebugInfo('Aucune facture trouvée pour ce client.');
      }
      
      setUnpaidInvoices(unpaid);
      
    } catch (invError) {
      console.error('❌ Erreur chargement factures:', invError);
      setDebugInfo('Erreur lors du chargement des factures');
      setUnpaidInvoices([]);
    }
  };

  // ✅ Fonction pour associer un client au wallet
  const associateClientToWallet = async (clientIdToAssociate) => {
    try {
      setSubmitting(true);
      
      // 1. Récupérer les infos du client
      const clientResponse = await AxiosInstance.get(`/clients/${clientIdToAssociate}/`);
      const clientData = clientResponse.data;
      
      // 2. Mettre à jour le wallet avec le client (via API)
      // On suppose qu'il y a un endpoint pour ça, sinon on crée un nouveau wallet
      // Pour l'instant, on va juste récupérer le wallet avec le client
      setClient(clientData);
      setClientId(clientIdToAssociate);
      setShowClientSelector(false);
      setDebugInfo(`Client "${clientData.name}" associé au wallet`);
      
      // 3. Charger les factures du client
      await fetchInvoices(clientIdToAssociate);
      
      // 4. Mettre à jour le wallet local
      setWallet(prev => ({
        ...prev,
        client: clientData,
        client_id: clientIdToAssociate
      }));
      
    } catch (error) {
      console.error('❌ Erreur association client:', error);
      setError('Erreur lors de l\'association du client');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isValidId && !loading) {
      navigate('/wallets');
    }
  }, [isValidId, loading, navigate]);

  // Filtrer les factures par recherche
  const filteredInvoices = unpaidInvoices.filter(invoice =>
    invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculer le montant restant dû
  const getRemainingAmount = (invoice) => {
    return (parseFloat(invoice.total || 0) - parseFloat(invoice.amount_paid || 0));
  };

  // Sélectionner une facture
  const selectInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceList(false);
    setSearchTerm('');
    const remaining = getRemainingAmount(invoice);
    setAmount(String(remaining > 0 ? remaining : 0));
    setError('');
  };

  // Soumettre le paiement
  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!selectedInvoice) {
      setError('Veuillez sélectionner une facture');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Veuillez saisir un montant valide');
      return;
    }

    const remainingAmount = getRemainingAmount(selectedInvoice);
    if (parseFloat(amount) > remainingAmount) {
      setError(`Le montant dépasse le solde restant (${formatAmount(remainingAmount)})`);
      return;
    }

    if (parseFloat(amount) > (wallet?.balance || 0)) {
      setError(`Solde insuffisant. Disponible : ${formatAmount(wallet.balance)}`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await AxiosInstance.post(
        `/wallet/pay-invoice/`,
        {
          facture_id: selectedInvoice.id,
          amount: parseFloat(amount),
          notes: notes || `Paiement facture ${selectedInvoice.invoice_number}`
        }
      );

      console.log('📋 Réponse paiement:', response.data);

      if (response.data.status === 'success') {
        setSuccess(true);
        setPaymentResult({
          invoice_number: selectedInvoice.invoice_number,
          amount: parseFloat(amount),
          new_balance: response.data.wallet_balance || response.data.new_balance,
          balance_display: response.data.balance_display,
          message: response.data.message,
          facture_remaining: response.data.facture_remaining,
          facture_status: response.data.facture_status
        });
        
        const newBalance = response.data.wallet_balance || response.data.new_balance;
        setWallet(prev => ({
          ...prev,
          balance: newBalance
        }));
        
        setUnpaidInvoices(prev => prev.filter(inv => inv.id !== selectedInvoice.id));
        setSelectedInvoice(null);
        setAmount('');
      } else {
        setError(response.data.error || 'Erreur lors du paiement');
      }

    } catch (error) {
      console.error('❌ Erreur paiement:', error);
      if (error.response) {
        if (error.response.status === 403) {
          setError('Vous n\'avez pas les droits pour effectuer ce paiement');
        } else if (error.response.status === 401) {
          setError('Session expirée');
          setTimeout(() => navigate('/login'), 2000);
        } else if (error.response.data?.error) {
          setError(error.response.data.error);
        } else {
          setError('Erreur lors du paiement');
        }
      } else {
        setError('Impossible de contacter le serveur.');
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
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

  const getInvoiceStatusBadge = (status) => {
    const statusMap = {
      'draft': { label: 'Brouillon', className: 'badge-ghost' },
      'sent': { label: 'Envoyée', className: 'badge-info' },
      'partial': { label: 'Partielle', className: 'badge-warning' },
      'paid': { label: 'Payée', className: 'badge-success' },
      'overdue': { label: 'En retard', className: 'badge-error' },
      'cancelled': { label: 'Annulée', className: 'badge-error' }
    };
    return statusMap[status] || { label: status, className: 'badge-ghost' };
  };

  // Afficher le sélecteur de client
  if (showClientSelector) {
    return (
      <div className="w-full px-4 sm:px-6 py-6">
        <div className="bg-base-100 rounded-xl shadow-lg border border-base-200 p-8 max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
              <User className="w-8 h-8 text-warning" />
            </div>
            <h2 className="text-xl font-bold mt-4">Associer un client au wallet</h2>
            <p className="text-base-content/60 mt-2">
              Ce wallet n'a pas de client associé. Veuillez sélectionner un client.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Sélectionner un client</label>
              <select
                value={selectedClientId || ''}
                onChange={(e) => setSelectedClientId(e.target.value ? parseInt(e.target.value) : null)}
                className="select select-bordered w-full"
              >
                <option value="">Choisir un client...</option>
                {availableClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.code} - {client.name} ({client.phone || 'N/A'})
                  </option>
                ))}
              </select>
            </div>

            {availableClients.length === 0 && (
              <div className="bg-info/10 border border-info/20 text-info rounded-lg p-4">
                <p className="text-sm">Aucun client disponible. Veuillez créer un client d'abord.</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  if (selectedClientId) {
                    associateClientToWallet(selectedClientId);
                  }
                }}
                disabled={!selectedClientId || submitting}
                className="btn btn-primary flex-1 gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Association...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Associer ce client
                  </>
                )}
              </button>
              <Link
                to="/wallets"
                className="btn btn-ghost flex-1 gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à la liste
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Afficher l'état de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-base-content/60">Chargement des données...</p>
        </div>
      </div>
    );
  }

  // Afficher l'erreur si le wallet n'existe pas
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
            <button onClick={fetchData} className="btn btn-primary gap-2">
              <RefreshCw className="w-4 h-4" /> Réessayer
            </button>
            <Link to="/wallets" className="btn btn-ghost gap-2">
              <Wallet className="w-4 h-4" /> Liste
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Afficher le succès
  if (success && paymentResult) {
    return (
      <div className="w-full px-4 sm:px-6 py-6">
        <div className="bg-base-100 rounded-xl shadow-lg border border-base-200 p-8 max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold mt-4">✅ Paiement effectué avec succès !</h2>
          <p className="text-base-content/60 mt-2">{paymentResult.message}</p>
          
          <div className="bg-base-200 rounded-xl p-4 mt-4 text-left">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-base-content/40">Facture</p>
                <p className="font-bold">{paymentResult.invoice_number}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/40">Montant payé</p>
                <p className="text-xl font-bold text-success">{formatAmount(paymentResult.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/40">Nouveau solde</p>
                <p className="text-xl font-bold text-primary">{paymentResult.balance_display}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/40">Statut facture</p>
                <span className={`badge ${paymentResult.facture_status === 'paid' ? 'badge-success' : 'badge-warning'} badge-sm`}>
                  {paymentResult.facture_status === 'paid' ? 'Payée' : 'Partielle'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={`/wallets/${id}`} className="btn btn-primary gap-2">
              <Wallet className="w-4 h-4" />
              Voir le wallet
            </Link>
            <button
              onClick={() => {
                setSuccess(false);
                setPaymentResult(null);
                setSelectedInvoice(null);
                setAmount('');
                setNotes('');
                fetchData();
              }}
              className="btn btn-ghost gap-2"
            >
              <Plus className="w-4 h-4" />
              Effectuer un autre paiement
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Afficher le formulaire principal
  return (
    <div className="w-full px-4 sm:px-6 py-4 space-y-6">
      
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={`/wallets/${id}`} className="p-2 rounded-lg hover:bg-base-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="w-7 h-7 text-primary" />
              Payer avec le wallet
            </h1>
            <p className="text-base-content/60 text-sm">
              {client?.name ? `Client: ${client.name}` : '⚠️ Aucun client associé'}
            </p>
          </div>
        </div>
        <button onClick={fetchData} className="btn btn-ghost btn-sm gap-2" disabled={loading}>
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
                      <span className="font-mono bg-base-200 px-2 py-0.5 rounded">{client.code}</span>
                    )}
                    {client?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {client.phone}
                      </span>
                    )}
                    {!client && (
                      <span className="text-warning flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Aucun client associé
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-base-content/40">Solde disponible</p>
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

      {/* Formulaire de paiement */}
      <div className="bg-base-100 rounded-xl shadow-lg border border-base-200 overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Receipt className="w-5 h-5 text-primary" />
            Informations du paiement
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

          {/* Debug info */}
          {debugInfo && (
            <div className="bg-info/10 border border-info/20 text-info rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Information</p>
                  <p className="text-sm">{debugInfo}</p>
                </div>
              </div>
            </div>
          )}

          {/* Si pas de client, afficher un message */}
          {!client && (
            <div className="bg-warning/10 border border-warning/20 text-warning rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Aucun client associé</p>
                  <p className="text-sm">Ce wallet n'a pas de client associé. Les factures ne peuvent pas être chargées.</p>
                  <button
                    onClick={() => setShowClientSelector(true)}
                    className="btn btn-warning btn-sm mt-2 gap-2"
                  >
                    <User className="w-4 h-4" />
                    Associer un client
                  </button>
                </div>
              </div>
            </div>
          )}

          {client && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-base-content/60">
                  {unpaidInvoices.length} facture(s) impayée(s) disponible(s)
                </span>
                {unpaidInvoices.length === 0 && !selectedInvoice && (
                  <span className="badge badge-success">✅ Aucune facture à payer</span>
                )}
              </div>

              <form onSubmit={handlePayment} className="space-y-4">
                {/* Sélection de la facture */}
                <div>
                  <label className="block text-sm font-medium text-base-content/80 mb-2">
                    Facture à payer <span className="text-error">*</span>
                  </label>

                  {selectedInvoice ? (
                    <div className="bg-base-200 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-semibold">{selectedInvoice.invoice_number}</p>
                            <div className="flex flex-wrap gap-3 text-sm text-base-content/60">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(selectedInvoice.invoice_date)}
                              </span>
                              <span className="flex items-center gap-1">
                                Total: <span className="font-semibold">{formatAmount(selectedInvoice.total)}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                Restant: <span className="font-semibold text-warning">{formatAmount(getRemainingAmount(selectedInvoice))}</span>
                              </span>
                              <span className={`badge ${getInvoiceStatusBadge(selectedInvoice.status).className} badge-sm`}>
                                {getInvoiceStatusBadge(selectedInvoice.status).label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedInvoice(null)}
                        className="btn btn-ghost btn-sm btn-square"
                        title="Changer de facture"
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
                            placeholder="Rechercher une facture..."
                            value={searchTerm}
                            onChange={(e) => {
                              setSearchTerm(e.target.value);
                              setShowInvoiceList(true);
                            }}
                            onFocus={() => setShowInvoiceList(true)}
                            className="input input-bordered w-full pl-9"
                            disabled={unpaidInvoices.length === 0}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowInvoiceList(!showInvoiceList)}
                          className="btn btn-ghost btn-sm"
                          disabled={unpaidInvoices.length === 0}
                        >
                          {showInvoiceList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                      {showInvoiceList && unpaidInvoices.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-base-100 rounded-xl shadow-xl border border-base-200 max-h-60 overflow-y-auto">
                          {filteredInvoices.length === 0 ? (
                            <div className="p-4 text-center text-base-content/40 text-sm">
                              Aucune facture trouvée
                            </div>
                          ) : (
                            filteredInvoices.map((invoice) => {
                              const remaining = getRemainingAmount(invoice);
                              const statusBadge = getInvoiceStatusBadge(invoice.status);
                              return (
                                <button
                                  key={invoice.id}
                                  onClick={() => selectInvoice(invoice)}
                                  className="w-full text-left p-3 hover:bg-base-200 transition-colors border-b border-base-200/50 last:border-0"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-sm">{invoice.invoice_number}</p>
                                      <p className="text-xs text-base-content/40 flex items-center gap-2">
                                        <span>{formatDate(invoice.invoice_date)}</span>
                                        <span className="w-1 h-1 rounded-full bg-base-content/20"></span>
                                        <span>Total: {formatAmount(invoice.total)}</span>
                                        <span className="w-1 h-1 rounded-full bg-base-content/20"></span>
                                        <span className="text-warning font-semibold">Reste: {formatAmount(remaining)}</span>
                                      </p>
                                    </div>
                                    <span className={`badge ${statusBadge.className} badge-sm`}>
                                      {statusBadge.label}
                                    </span>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {unpaidInvoices.length === 0 && !selectedInvoice && client && (
                    <p className="text-sm text-base-content/40 mt-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Aucune facture impayée disponible pour ce client
                    </p>
                  )}
                </div>

                {/* Montant à payer */}
                {selectedInvoice && (
                  <div>
                    <label className="block text-sm font-medium text-base-content/80 mb-2">
                      Montant à payer <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40">
                        <span className="font-bold text-sm">FCFA</span>
                      </div>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        max={getRemainingAmount(selectedInvoice)}
                        placeholder="Saisir le montant"
                        value={amount}
                        onChange={(e) => {
                          setAmount(e.target.value);
                          setError('');
                        }}
                        className="input input-bordered w-full pl-16 text-lg font-semibold"
                        required
                      />
                    </div>
                    <div className="flex justify-between text-xs text-base-content/40 mt-1">
                      <span>Montant restant : {formatAmount(getRemainingAmount(selectedInvoice))}</span>
                      <span>Solde disponible : {formatAmount(wallet?.balance || 0)}</span>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-base-content/80 mb-2">Notes</label>
                  <textarea
                    placeholder="Ajouter une note (optionnel)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="textarea textarea-bordered w-full h-20 resize-none"
                  />
                </div>

                {/* Résumé du paiement */}
                {selectedInvoice && amount && parseFloat(amount) > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Résumé du paiement
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-base-content/40">Facture</p>
                        <p className="font-medium">{selectedInvoice.invoice_number}</p>
                      </div>
                      <div>
                        <p className="text-xs text-base-content/40">Montant</p>
                        <p className="font-bold text-success">{formatAmount(parseFloat(amount))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-base-content/40">Nouveau solde wallet</p>
                        <p className="font-bold text-primary">
                          {formatAmount((wallet?.balance || 0) - parseFloat(amount))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-base-content/40">Reste à payer</p>
                        <p className="font-bold text-warning">
                          {formatAmount(getRemainingAmount(selectedInvoice) - parseFloat(amount))}
                        </p>
                      </div>
                    </div>
                    {(wallet?.balance || 0) < parseFloat(amount) && (
                      <div className="mt-2 bg-error/10 border border-error/20 text-error rounded-lg p-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <p className="text-xs">Solde insuffisant. Disponible : {formatAmount(wallet?.balance || 0)}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Boutons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-base-200">
                  <button
                    type="submit"
                    disabled={!selectedInvoice || !amount || parseFloat(amount) <= 0 || submitting || (wallet?.balance || 0) < parseFloat(amount)}
                    className={`
                      btn w-full sm:flex-1 h-12 text-base font-medium gap-2
                      ${!selectedInvoice || !amount || parseFloat(amount) <= 0 || (wallet?.balance || 0) < parseFloat(amount)
                        ? 'btn-disabled' 
                        : 'btn-primary'
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
                        <CreditCard className="w-5 h-5" />
                        Payer avec le wallet
                      </>
                    )}
                  </button>
                  <Link to={`/wallets/${id}`} className="btn btn-ghost w-full sm:flex-1 h-12 text-base gap-2">
                    <X className="w-5 h-5" />
                    Annuler
                  </Link>
                </div>
              </form>
            </>
          )}

          <div className="mt-4 text-center text-xs text-base-content/40 border-t border-base-200 pt-4">
            <p>Le paiement sera débité immédiatement du porte-monnaie du client</p>
            <p>Un mouvement de trésorerie sera automatiquement créé</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPayment;