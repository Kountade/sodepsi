// src/components/achats/PaiementFournisseurForm.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, CheckCircle, AlertCircle,
  CreditCard, Calendar, DollarSign, Building2, 
  Receipt, Clock, Banknote, Wallet, Landmark,
  FileText, AlertTriangle, RefreshCw, Search,
  HandCoins, Plus
} from 'lucide-react';

const PaiementFournisseurForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [caisses, setCaisses] = useState([]);
  const [comptesBancaires, setComptesBancaires] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    supplier_invoice: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    method: 'virement',
    reference_number: '',
    notes: '',
    caisse_destination_id: '',
    compte_destination_id: ''
  });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // Récupérer TOUTES les factures pour déboguer
  const fetchAllInvoices = async () => {
    try {
      const response = await AxiosInstance.get('/supplier-invoices/');
      setAllInvoices(response.data || []);
      console.log('📦 Toutes les factures:', response.data);
      console.log('📊 Statuts disponibles:', [...new Set(response.data.map(i => i.paiement_status))]);
      return response.data;
    } catch (error) {
      console.error('Erreur chargement toutes les factures:', error);
      return [];
    }
  };

  // Récupérer les factures impayées
  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      // Récupérer toutes les factures d'abord
      const allData = await fetchAllInvoices();
      
      // Filtrer les factures impayées (unpaid, partial, overdue)
      const unpaidInvoices = allData.filter(
        invoice => invoice.paiement_status === 'unpaid' || 
                   invoice.paiement_status === 'partial' || 
                   invoice.paiement_status === 'overdue'
      );
      
      console.log('✅ Factures impayées:', unpaidInvoices);
      setInvoices(unpaidInvoices);
      
      if (unpaidInvoices.length === 0) {
        const paidCount = allData.filter(i => i.paiement_status === 'paid').length;
        showNotification(
          `Aucune facture impayée. ${allData.length} facture(s) au total (${paidCount} payée(s))`,
          'warning'
        );
      }
    } catch (error) {
      console.error('❌ Erreur chargement factures:', error);
      showNotification('Erreur de chargement des factures', 'error');
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Récupérer les caisses
  const fetchCaisses = async () => {
    try {
      const response = await AxiosInstance.get('/caisses/?is_active=true');
      setCaisses(response.data || []);
    } catch (error) {
      console.error('Erreur chargement caisses:', error);
    }
  };

  // Récupérer les comptes bancaires
  const fetchComptesBancaires = async () => {
    try {
      const response = await AxiosInstance.get('/comptes-bancaires/?is_active=true');
      setComptesBancaires(response.data || []);
    } catch (error) {
      console.error('Erreur chargement comptes:', error);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchCaisses();
    fetchComptesBancaires();
  }, []);

  // Quand une facture est sélectionnée
  useEffect(() => {
    if (formData.supplier_invoice) {
      const invoice = invoices.find(i => i.id === parseInt(formData.supplier_invoice));
      setSelectedInvoice(invoice);
      if (invoice) {
        setFormData(prev => ({
          ...prev,
          amount: invoice.remaining_amount?.toString() || ''
        }));
      }
    } else {
      setSelectedInvoice(null);
      setFormData(prev => ({
        ...prev,
        amount: ''
      }));
    }
  }, [formData.supplier_invoice, invoices]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'caisse_destination_id' && value) {
      setFormData(prev => ({ ...prev, compte_destination_id: '' }));
    }
    if (name === 'compte_destination_id' && value) {
      setFormData(prev => ({ ...prev, caisse_destination_id: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.supplier_invoice) {
      showNotification('Veuillez sélectionner une facture', 'error');
      setLoading(false);
      return;
    }

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      showNotification('Veuillez saisir un montant valide', 'error');
      setLoading(false);
      return;
    }

    if (selectedInvoice && amount > selectedInvoice.remaining_amount) {
      showNotification(`Le montant (${amount.toLocaleString()} FCFA) dépasse le solde restant (${selectedInvoice.remaining_amount.toLocaleString()} FCFA)`, 'error');
      setLoading(false);
      return;
    }

    if (!formData.payment_date) {
      showNotification('Veuillez saisir la date de paiement', 'error');
      setLoading(false);
      return;
    }

    if (!formData.method) {
      showNotification('Veuillez sélectionner une méthode de paiement', 'error');
      setLoading(false);
      return;
    }

    if (!formData.caisse_destination_id && !formData.compte_destination_id) {
      showNotification('Veuillez sélectionner une caisse ou un compte bancaire', 'error');
      setLoading(false);
      return;
    }

    try {
      const dataToSend = {
        supplier_invoice: parseInt(formData.supplier_invoice),
        amount: amount,
        payment_date: formData.payment_date,
        method: formData.method,
        reference_number: formData.reference_number,
        notes: formData.notes,
        caisse_destination_id: formData.caisse_destination_id ? parseInt(formData.caisse_destination_id) : null,
        compte_destination_id: formData.compte_destination_id ? parseInt(formData.compte_destination_id) : null
      };

      const response = await AxiosInstance.post('/fournisseur-paiements/', dataToSend);

      showNotification('Paiement enregistré avec succès', 'success');

      setTimeout(() => {
        navigate(`/paiements-fournisseurs/${response.data.id}`);
      }, 1500);

    } catch (error) {
      console.error('Erreur:', error);
      const errorMsg = error.response?.data?.message || 
                       error.response?.data?.detail ||
                       'Erreur lors de l\'enregistrement du paiement';
      showNotification(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/paiements-fournisseurs');
  };

  // Filtrer les factures
  const filteredInvoices = invoices.filter(invoice => {
    const search = searchTerm.toLowerCase();
    return (invoice.invoice_number?.toLowerCase() || '').includes(search) ||
           (invoice.supplier_name?.toLowerCase() || '').includes(search);
  });

  // Compter les statuts des factures
  const getStatusCount = () => {
    const counts = { total: allInvoices.length };
    allInvoices.forEach(inv => {
      counts[inv.paiement_status] = (counts[inv.paiement_status] || 0) + 1;
    });
    return counts;
  };

  const statusCount = getStatusCount();

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : notification.type === 'warning' ? 'alert-warning' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification({ ...notification, show: false })}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-success/10 via-success/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={handleCancel} className="btn btn-ghost btn-sm btn-circle">
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
            onClick={fetchInvoices} 
            className="btn btn-sm btn-outline gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-xl shadow-xl p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sélection de la facture */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facture à payer <span className="text-error">*</span>
              </label>
              
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className="input input-bordered w-full pl-9"
                  placeholder="Rechercher une facture par numéro ou fournisseur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {loadingInvoices && (
                  <span className="loading loading-spinner loading-sm absolute right-3 top-1/2 -translate-y-1/2"></span>
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
                  {loadingInvoices ? '⏳ Chargement des factures...' : 
                   invoices.length === 0 ? '⚠️ Aucune facture impayée disponible' : 
                   '📄 Sélectionner une facture...'}
                </option>
                {filteredInvoices.map(invoice => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoice_number} - {invoice.supplier_name} 
                    ({invoice.remaining_amount?.toLocaleString()} FCFA restant)
                    {invoice.paiement_status === 'overdue' && ' 🔴 En retard'}
                  </option>
                ))}
              </select>

              {/* Statistiques des factures */}
              {!loadingInvoices && (
                <div className="mt-2 text-xs text-gray-400 flex flex-wrap gap-3">
                  <span>Total: {statusCount.total || 0}</span>
                  {statusCount.unpaid > 0 && <span className="text-error">Non payées: {statusCount.unpaid}</span>}
                  {statusCount.partial > 0 && <span className="text-warning">Partielles: {statusCount.partial}</span>}
                  {statusCount.paid > 0 && <span className="text-success">Payées: {statusCount.paid}</span>}
                  {statusCount.overdue > 0 && <span className="text-error">En retard: {statusCount.overdue}</span>}
                </div>
              )}
              
              {!loadingInvoices && invoices.length === 0 && (
                <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-700">Aucune facture impayée disponible</p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Vous devez d'abord créer une facture dans la section 
                        <button 
                          onClick={() => navigate('/factures-fournisseurs/nouveau')}
                          className="text-primary font-semibold hover:underline mx-1"
                        >
                          Factures fournisseurs
                        </button>
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button 
                          onClick={() => navigate('/factures-fournisseurs/nouveau')} 
                          className="btn btn-primary btn-sm gap-2"
                        >
                          <Plus className="w-4 h-4" /> Créer une facture
                        </button>
                        <button 
                          onClick={() => navigate('/factures-fournisseurs')} 
                          className="btn btn-outline btn-sm gap-2"
                        >
                          <FileText className="w-4 h-4" /> Voir toutes les factures
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!loadingInvoices && invoices.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {invoices.length} facture(s) impayée(s) disponible(s)
                </p>
              )}
            </div>

            {/* Détails de la facture sélectionnée */}
            {selectedInvoice && (
              <div className="md:col-span-2 bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">N° Facture</p>
                    <p className="font-semibold">{selectedInvoice.invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Fournisseur</p>
                    <p className="font-semibold">{selectedInvoice.supplier_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total TTC</p>
                    <p className="font-semibold text-primary">{selectedInvoice.total_amount?.toLocaleString()} FCFA</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Reste à payer</p>
                    <p className="font-semibold text-error">{selectedInvoice.remaining_amount?.toLocaleString()} FCFA</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Progression</span>
                    <span className="font-semibold">
                      {((selectedInvoice.total_amount - selectedInvoice.remaining_amount) / selectedInvoice.total_amount * 100 || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-success h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${((selectedInvoice.total_amount - selectedInvoice.remaining_amount) / selectedInvoice.total_amount * 100) || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Montant à payer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant à payer <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">F</span>
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
                <p className="text-xs text-gray-400 mt-1">
                  Solde restant: <span className="font-semibold text-error">{selectedInvoice.remaining_amount?.toLocaleString()} FCFA</span>
                </p>
              )}
            </div>

            {/* Date de paiement */}
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

            {/* Méthode de paiement */}
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

            {/* Référence de paiement */}
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

            {/* Destination - Caisse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Caisse de destination
              </label>
              <select
                name="caisse_destination_id"
                className="select select-bordered w-full"
                value={formData.caisse_destination_id}
                onChange={handleChange}
                disabled={!!formData.compte_destination_id}
              >
                <option value="">Sélectionner une caisse...</option>
                {caisses.map(caisse => (
                  <option key={caisse.id} value={caisse.id}>
                    {caisse.nom} ({caisse.code}) - {caisse.solde_actuel?.toLocaleString()} FCFA
                  </option>
                ))}
              </select>
            </div>

            {/* Destination - Compte bancaire */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compte bancaire de destination
              </label>
              <select
                name="compte_destination_id"
                className="select select-bordered w-full"
                value={formData.compte_destination_id}
                onChange={handleChange}
                disabled={!!formData.caisse_destination_id}
              >
                <option value="">Sélectionner un compte...</option>
                {comptesBancaires.map(compte => (
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
                placeholder="Notes supplémentaires..."
                value={formData.notes}
                onChange={handleChange}
              />
            </div>

            {/* Informations */}
            <div className="md:col-span-2 bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h4 className="font-semibold text-sm text-blue-700 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Informations
              </h4>
              <ul className="text-sm text-blue-600 space-y-1 mt-2">
                <li>• Le paiement sera automatiquement enregistré dans la trésorerie</li>
                <li>• Le solde de la facture sera mis à jour automatiquement</li>
                <li>• Choisissez une seule destination (caisse OU compte bancaire)</li>
                <li>• Le montant ne peut pas dépasser le solde restant</li>
                <li>• 💡 Si aucune facture n'apparaît, créez-en une d'abord</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-ghost flex-1 sm:flex-none order-2 sm:order-1"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn bg-gradient-to-r from-success to-success/80 text-white border-none flex-1 sm:flex-none order-1 sm:order-2 gap-2"
              disabled={loading || loadingInvoices || invoices.length === 0}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Enregistrement...
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