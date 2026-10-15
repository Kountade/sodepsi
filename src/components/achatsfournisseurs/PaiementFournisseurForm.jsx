// src/components/achats/PaiementFournisseurForm.jsx
// ============================================================
// VERSION CORRIGÉE - Formulaire paiement fournisseur
// ============================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, CheckCircle, AlertCircle,
  FileText, AlertTriangle, RefreshCw, Search,
  HandCoins, Plus, Building2, Loader2
} from 'lucide-react';

// ============================================================
// CONSTANTES
// ============================================================
const DEBOUNCE_MS = 400;

// ============================================================
// COMPOSANT
// ============================================================
const PaiementFournisseurForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ----- États -----
  const [loading, setLoading] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [loadingCaisses, setLoadingCaisses] = useState(false);
  const [loadingComptes, setLoadingComptes] = useState(false);

  // ----- Listes -----
  const [invoices, setInvoices] = useState([]);
  const [caisses, setCaisses] = useState([]);
  const [comptesBancaires, setComptesBancaires] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // ----- Recherche -----
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // ----- Notification -----
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  // ----- Formulaire -----
  const [formData, setFormData] = useState({
    supplier_invoice: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    method: 'virement',
    reference_number: '',
    notes: '',
    caisse_destination_id: '',
    compte_destination_id: '',
  });

  const abortInvoicesRef = useRef(null);
  const abortCaissesRef = useRef(null);

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      5000
    );
  }, []);

  const getToken = () => localStorage.getItem('Token');

  // ============================================================
  // CHARGEMENT FACTURES IMPAYÉES
  // ============================================================
  const fetchInvoices = useCallback(async (search = '') => {
    if (abortInvoicesRef.current) abortInvoicesRef.current.abort();
    const controller = new AbortController();
    abortInvoicesRef.current = controller;

    setLoadingInvoices(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      params.append('paiement_status', 'unpaid,partial,overdue');
      params.append('page_size', '100');
      if (search) params.append('search', search);

      const response = await AxiosInstance.get(
        `/supplier-invoices/?${params.toString()}`,
        {
          headers: { Authorization: `Token ${token}` },
          signal: controller.signal,
        }
      );

      const data = response.data;
      const results = Array.isArray(data) ? data : data.results || [];
      setInvoices(results);
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') return;
      console.error('❌ Erreur chargement factures:', error);
      showNotification('Erreur de chargement des factures', 'error');
    } finally {
      setLoadingInvoices(false);
    }
  }, [showNotification]);

  // ============================================================
  // CHARGEMENT CAISSES
  // ============================================================
  const fetchCaisses = useCallback(async () => {
    if (abortCaissesRef.current) abortCaissesRef.current.abort();
    const controller = new AbortController();
    abortCaissesRef.current = controller;

    setLoadingCaisses(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(
        '/caisses/?is_active=true&page_size=100',
        {
          headers: { Authorization: `Token ${token}` },
          signal: controller.signal,
        }
      );
      const data = response.data;
      const results = Array.isArray(data) ? data : data.results || [];
      setCaisses(results);
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') return;
      console.error('❌ Erreur chargement caisses:', error);
    } finally {
      setLoadingCaisses(false);
    }
  }, []);

  // ============================================================
  // CHARGEMENT COMPTES BANCAIRES
  // ============================================================
  const fetchComptesBancaires = useCallback(async () => {
    setLoadingComptes(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(
        '/comptes-bancaires/?is_active=true&page_size=100',
        { headers: { Authorization: `Token ${token}` } }
      );
      const data = response.data;
      const results = Array.isArray(data) ? data : data.results || [];
      setComptesBancaires(results);
    } catch (error) {
      console.error('❌ Erreur chargement comptes:', error);
    } finally {
      setLoadingComptes(false);
    }
  }, []);

  // ============================================================
  // EFFETS
  // ============================================================
  useEffect(() => {
    fetchInvoices();
    fetchCaisses();
    fetchComptesBancaires();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce recherche
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (debouncedSearch !== undefined) {
      fetchInvoices(debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Pré-sélection depuis URL ?facture=xxx
  useEffect(() => {
    const factureParam = searchParams.get('facture');
    if (factureParam && invoices.length > 0) {
      const invoice = invoices.find((i) => i.id === parseInt(factureParam));
      if (invoice) {
        setFormData((prev) => ({
          ...prev,
          supplier_invoice: factureParam,
          amount: invoice.remaining_amount?.toString() || '',
        }));
        setSelectedInvoice(invoice);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices]);

  // ============================================================
  // SELECTION FACTURE
  // ============================================================
  useEffect(() => {
    if (formData.supplier_invoice) {
      const invoice = invoices.find(
        (i) => i.id === parseInt(formData.supplier_invoice)
      );
      setSelectedInvoice(invoice || null);
      if (invoice) {
        setFormData((prev) => ({
          ...prev,
          amount: invoice.remaining_amount?.toString() || '',
        }));
      }
    } else {
      setSelectedInvoice(null);
      setFormData((prev) => ({ ...prev, amount: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.supplier_invoice]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'caisse_destination_id' && value) {
      setFormData((prev) => ({ ...prev, compte_destination_id: '' }));
    }
    if (name === 'compte_destination_id' && value) {
      setFormData((prev) => ({ ...prev, caisse_destination_id: '' }));
    }
  };

  const handlePayAll = () => {
    if (selectedInvoice) {
      setFormData((prev) => ({
        ...prev,
        amount: selectedInvoice.remaining_amount?.toString() || '',
      }));
    }
  };

  const handleSetPercentage = (percentage) => {
    if (selectedInvoice) {
      const amount = (selectedInvoice.remaining_amount * percentage) / 100;
      setFormData((prev) => ({ ...prev, amount: amount.toFixed(2) }));
    }
  };

  const handleCancel = () => {
    navigate('/paiements-fournisseurs');
  };

  // ============================================================
  // SOUMISSION
  // ============================================================
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Validations
    if (!formData.supplier_invoice) {
      showNotification('Veuillez sélectionner une facture', 'error');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      showNotification('Veuillez saisir un montant valide', 'error');
      return;
    }

    if (selectedInvoice && amount > selectedInvoice.remaining_amount) {
      showNotification(
        `Le montant (${amount.toLocaleString('fr-FR')} FCFA) dépasse le solde restant (${selectedInvoice.remaining_amount.toLocaleString('fr-FR')} FCFA)`,
        'error'
      );
      return;
    }

    if (!formData.payment_date) {
      showNotification('Veuillez saisir la date de paiement', 'error');
      return;
    }

    if (!formData.caisse_destination_id && !formData.compte_destination_id) {
      showNotification(
        'Veuillez sélectionner une caisse ou un compte bancaire',
        'error'
      );
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      const dataToSend = {
        supplier_invoice: parseInt(formData.supplier_invoice),
        amount,
        payment_date: formData.payment_date,
        method: formData.method,
        reference_number: formData.reference_number,
        notes: formData.notes,
        caisse_destination_id: formData.caisse_destination_id
          ? parseInt(formData.caisse_destination_id)
          : null,
        compte_destination_id: formData.compte_destination_id
          ? parseInt(formData.compte_destination_id)
          : null,
      };

      const response = await AxiosInstance.post(
        '/fournisseur-paiements/',
        dataToSend,
        { headers: { Authorization: `Token ${token}` } }
      );

      const remaining = response.data.remaining_amount || 0;
      if (remaining > 0) {
        showNotification(
          `✅ Paiement enregistré ! Solde restant : ${remaining.toLocaleString('fr-FR')} FCFA`,
          'success'
        );
      } else {
        showNotification('✅ Facture entièrement payée !', 'success');
      }

      setTimeout(() => navigate('/paiements-fournisseurs'), 2000);
    } catch (error) {
      console.error('❌ Erreur:', error);
      let errorMsg = "Erreur lors de l'enregistrement du paiement";

      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'object') {
          if (data.message) errorMsg = data.message;
          else if (data.detail) errorMsg = data.detail;
          else if (data.non_field_errors)
            errorMsg = data.non_field_errors.join(', ');
          else {
            const firstError = Object.values(data)[0];
            if (Array.isArray(firstError)) errorMsg = firstError[0];
            else if (typeof firstError === 'string') errorMsg = firstError;
          }
        } else if (typeof data === 'string') {
          errorMsg = data;
        }
      }

      showNotification(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // CALCULS
  // ============================================================
  const getRemainingAfterPayment = () => {
    if (!selectedInvoice) return 0;
    const amount = parseFloat(formData.amount) || 0;
    return Math.max(0, selectedInvoice.remaining_amount - amount);
  };

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown max-w-md">
          <div
            className={`alert ${
              notification.type === 'success'
                ? 'alert-success'
                : notification.type === 'warning'
                ? 'alert-warning'
                : 'alert-error'
            } shadow-xl rounded-xl`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : notification.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="font-medium text-sm">{notification.message}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() =>
                setNotification((prev) => ({ ...prev, show: false }))
              }
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-success/10 via-success/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-success/10 rounded-xl">
                  <HandCoins className="w-7 h-7 text-success" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-success">
                  Nouveau paiement fournisseur
                </h1>
              </div>
              <p className="text-sm text-gray-500 ml-1">
                Sélectionnez une facture impayée et enregistrez le paiement
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchInvoices()}
            className="btn btn-sm btn-outline gap-2"
            disabled={loadingInvoices}
          >
            <RefreshCw
              className={`w-4 h-4 ${loadingInvoices ? 'animate-spin' : ''}`}
            />
            Rafraîchir
          </button>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-xl shadow-xl p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Facture */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facture à payer <span className="text-error">*</span>
              </label>

              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className="input input-bordered w-full pl-9"
                  placeholder="Rechercher une facture par numéro ou fournisseur…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                {loadingInvoices && (
                  <Loader2 className="w-4 h-4 animate-spin text-primary absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>

              <select
                name="supplier_invoice"
                className="select select-bordered w-full"
                value={formData.supplier_invoice}
                onChange={handleChange}
                disabled={loadingInvoices}
              >
                <option value="">
                  {loadingInvoices
                    ? '⏳ Chargement…'
                    : invoices.length === 0
                    ? '⚠️ Aucune facture impayée disponible'
                    : '📄 Sélectionner une facture…'}
                </option>
                {invoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoice_number} - {invoice.supplier_name} (
                    {invoice.remaining_amount?.toLocaleString('fr-FR')} FCFA
                    restant)
                    {invoice.paiement_status === 'partial' &&
                      ' 🔄 Partiellement payée'}
                    {invoice.paiement_status === 'overdue' && ' 🔴 En retard'}
                  </option>
                ))}
              </select>

              {!loadingInvoices && invoices.length === 0 && (
                <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-700">
                        Aucune facture impayée disponible
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Vous devez d'abord créer une facture dans la section
                        Factures fournisseurs.
                      </p>
                      <div className="mt-2 flex gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() =>
                            navigate('/factures-fournisseurs/nouveau')
                          }
                          className="btn btn-primary btn-sm gap-2"
                        >
                          <Plus className="w-4 h-4" /> Créer une facture
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('/factures-fournisseurs')}
                          className="btn btn-outline btn-sm gap-2"
                        >
                          <FileText className="w-4 h-4" /> Voir les factures
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Détails facture */}
            {selectedInvoice && (
              <div className="md:col-span-2 bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">N° Facture</p>
                    <p className="font-semibold">
                      {selectedInvoice.invoice_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Fournisseur</p>
                    <p className="font-semibold">
                      {selectedInvoice.supplier_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total TTC</p>
                    <p className="font-semibold text-primary">
                      {selectedInvoice.total_amount?.toLocaleString('fr-FR')}{' '}
                      FCFA
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Reste à payer</p>
                    <p className="font-semibold text-error">
                      {selectedInvoice.remaining_amount?.toLocaleString(
                        'fr-FR'
                      )}{' '}
                      FCFA
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">
                      Progression du paiement
                    </span>
                    <span className="font-semibold">
                      {selectedInvoice.paid_percentage?.toFixed(1) || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        selectedInvoice.paid_percentage >= 100
                          ? 'bg-success'
                          : selectedInvoice.paid_percentage >= 50
                          ? 'bg-warning'
                          : 'bg-error'
                      }`}
                      style={{
                        width: `${Math.min(
                          selectedInvoice.paid_percentage || 0,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions rapides */}
            {selectedInvoice && selectedInvoice.remaining_amount > 0 && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actions rapides
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handlePayAll}
                    className="btn btn-success btn-sm gap-1"
                  >
                    <CheckCircle className="w-3 h-3" /> Payer tout
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPercentage(50)}
                    className="btn btn-outline btn-sm"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPercentage(25)}
                    className="btn btn-outline btn-sm"
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPercentage(75)}
                    className="btn btn-outline btn-sm"
                  >
                    75%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPercentage(10)}
                    className="btn btn-outline btn-sm"
                  >
                    10%
                  </button>
                </div>
              </div>
            )}

            {/* Montant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant à payer <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  F
                </span>
                <input
                  type="number"
                  name="amount"
                  className="input input-bordered w-full pl-8"
                  placeholder="0"
                  value={formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
              {selectedInvoice && (
                <div className="flex justify-between text-xs mt-1 flex-wrap gap-2">
                  <span className="text-gray-400">
                    Solde restant :{' '}
                    <span className="font-semibold text-error">
                      {selectedInvoice.remaining_amount?.toLocaleString(
                        'fr-FR'
                      )}{' '}
                      FCFA
                    </span>
                  </span>
                  {parseFloat(formData.amount) > 0 &&
                    selectedInvoice.remaining_amount > 0 && (
                      <span className="text-gray-400">
                        Reste après paiement :{' '}
                        <span className="font-semibold text-warning">
                          {getRemainingAfterPayment().toLocaleString('fr-FR')}{' '}
                          FCFA
                        </span>
                      </span>
                    )}
                </div>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de paiement <span className="text-error">*</span>
              </label>
              <input
                type="date"
                name="payment_date"
                className="input input-bordered w-full"
                value={formData.payment_date}
                onChange={handleChange}
                required
              />
            </div>

            {/* Méthode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Méthode de paiement <span className="text-error">*</span>
              </label>
              <select
                name="method"
                className="select select-bordered w-full"
                value={formData.method}
                onChange={handleChange}
                required
              >
                <option value="especes">💵 Espèces</option>
                <option value="cheque">📄 Chèque</option>
                <option value="virement">🏦 Virement bancaire</option>
                <option value="transfert">🔄 Transfert</option>
                <option value="mobile_money">📱 Mobile Money</option>
                <option value="autre">🔧 Autre</option>
              </select>
            </div>

            {/* Référence */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Référence de paiement
              </label>
              <input
                type="text"
                name="reference_number"
                className="input input-bordered w-full"
                placeholder="Référence (chèque, virement, etc.)"
                value={formData.reference_number}
                onChange={handleChange}
              />
            </div>

            {/* Caisse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Caisse de destination
              </label>
              <select
                name="caisse_destination_id"
                className="select select-bordered w-full"
                value={formData.caisse_destination_id}
                onChange={handleChange}
                disabled={!!formData.compte_destination_id || loadingCaisses}
              >
                <option value="">
                  {loadingCaisses
                    ? '⏳ Chargement…'
                    : 'Sélectionner une caisse…'}
                </option>
                {caisses.map((caisse) => (
                  <option key={caisse.id} value={caisse.id}>
                    {caisse.nom} ({caisse.code}) -{' '}
                    {caisse.solde_actuel?.toLocaleString('fr-FR')} FCFA
                  </option>
                ))}
              </select>
            </div>

            {/* Compte bancaire */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compte bancaire de destination
              </label>
              <select
                name="compte_destination_id"
                className="select select-bordered w-full"
                value={formData.compte_destination_id}
                onChange={handleChange}
                disabled={!!formData.caisse_destination_id || loadingComptes}
              >
                <option value="">
                  {loadingComptes
                    ? '⏳ Chargement…'
                    : 'Sélectionner un compte…'}
                </option>
                {comptesBancaires.map((compte) => (
                  <option key={compte.id} value={compte.id}>
                    {compte.banque} - {compte.nom} ({compte.numero_compte})
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                className="textarea textarea-bordered w-full"
                rows="3"
                placeholder="Notes supplémentaires…"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>

            {/* Aide */}
            <div className="md:col-span-2 bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h4 className="font-semibold text-sm text-blue-700 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Informations
              </h4>
              <ul className="text-sm text-blue-600 space-y-1 mt-2">
                <li>
                  • Le paiement sera automatiquement enregistré dans la
                  trésorerie
                </li>
                <li>• Le solde de la facture sera mis à jour automatiquement</li>
                <li>• Vous pouvez payer par tranches (paiements partiels)</li>
                <li>
                  • Choisissez une seule destination (caisse OU compte bancaire)
                </li>
                <li>• Le montant ne peut pas dépasser le solde restant</li>
                <li>
                  • 💡 Utilisez les boutons rapides pour pré-remplir le montant
                </li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-ghost flex-1 sm:flex-none order-2 sm:order-1"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn bg-gradient-to-r from-success to-success/80 text-white border-none flex-1 sm:flex-none order-1 sm:order-2 gap-2"
              disabled={
                loading || loadingInvoices || invoices.length === 0
              }
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Enregistrer le paiement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaiementFournisseurForm;