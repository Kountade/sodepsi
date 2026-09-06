// src/components/paiements/PaiementForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import { 
  ArrowLeft, 
  Save, 
  X, 
  CreditCard, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  FileText,
  Wallet,
  Hash,
  MessageSquare,
  Banknote,
  Smartphone,
  Landmark
} from 'lucide-react';

const PaiementForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [factures, setFactures] = useState([]);
  const [notification, setNotification] = useState(null);
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [formData, setFormData] = useState({
    facture: '',
    amount: '',
    method: 'cash',
    reference: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Charger les factures
  const fetchFactures = async () => {
    try {
      const token = getToken();
      if (!token) {
        setFactures(getMockFactures());
        return;
      }

      const response = await AxiosInstance.get('/factures/', {
        headers: { 'Authorization': `Token ${token}` },
        params: { status: 'sent,overdue,partial' }
      });
      
      if (response.data && response.data.length > 0) {
        setFactures(response.data);
      } else {
        setFactures(getMockFactures());
      }
    } catch (error) {
      console.error('Erreur chargement factures:', error);
      setFactures(getMockFactures());
      showNotification('Erreur de chargement des factures', 'error');
    }
  };

  // Données de test
  const getMockFactures = () => [
    {
      id: 1,
      invoice_number: 'FAC-2024-001',
      client_name: 'Client Test 1',
      total: 150000,
      amount_paid: 0,
      remaining_amount: 150000,
      due_date: '2024-12-31',
      status: 'sent'
    },
    {
      id: 2,
      invoice_number: 'FAC-2024-002',
      client_name: 'Client Test 2',
      total: 250000,
      amount_paid: 50000,
      remaining_amount: 200000,
      due_date: '2024-11-30',
      status: 'overdue'
    },
    {
      id: 3,
      invoice_number: 'FAC-2024-003',
      client_name: 'Client Test 3',
      total: 75000,
      amount_paid: 0,
      remaining_amount: 75000,
      due_date: '2025-01-15',
      status: 'sent'
    }
  ];

  // Charger le paiement si édition
  const fetchPaiement = async () => {
    if (!isEdit) return;
    
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      const response = await AxiosInstance.get(`/payments/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      const data = response.data;
      setFormData({
        facture: data.sale || '',
        amount: data.amount || '',
        method: data.method || 'cash',
        reference: data.reference || '',
        notes: data.notes || ''
      });
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement du paiement', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFactures();
    if (isEdit) fetchPaiement();
  }, []);

  // Mettre à jour les infos de la facture sélectionnée
  useEffect(() => {
    if (formData.facture) {
      const facture = factures.find(f => f.id === parseInt(formData.facture));
      setSelectedFacture(facture);
    } else {
      setSelectedFacture(null);
    }
  }, [formData.facture, factures]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Validation du montant
  const validateAmount = (value) => {
    const amount = parseFloat(value);
    
    if (isNaN(amount) || amount <= 0) {
      return { valid: false, message: 'Le montant doit être supérieur à 0' };
    }
    
    if (selectedFacture) {
      const remaining = selectedFacture.remaining_amount || selectedFacture.total;
      if (amount > remaining) {
        return { valid: false, message: `Montant maximum: ${remaining.toLocaleString('fr-FR')} FCFA` };
      }
    }
    
    return { valid: true, message: '' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.facture) {
      showNotification('Veuillez sélectionner une facture', 'error');
      return;
    }
    
    const amountValidation = validateAmount(formData.amount);
    if (!amountValidation.valid) {
      showNotification(amountValidation.message, 'error');
      return;
    }

    setSubmitting(true);
    
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      const dataToSend = {
        amount: parseFloat(formData.amount),
        method: formData.method,
        reference: formData.reference || '',
        notes: formData.notes || ''
      };
      
      if (isEdit) {
        await AxiosInstance.put(`/payments/${id}/`, dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
        showNotification('Paiement modifié avec succès', 'success');
      } else {
        await AxiosInstance.post(`/factures/${formData.facture}/register_payment/`, dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
        showNotification('Paiement enregistré avec succès', 'success');
      }

      setTimeout(() => navigate('/paiements'), 1500);

    } catch (error) {
      console.error('Erreur:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Erreur lors de l\'enregistrement';
      showNotification(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 FCFA';
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  const getStatusBadge = (status) => {
    const configs = {
      sent: { label: 'Envoyée', className: 'badge-info' },
      overdue: { label: 'En retard', className: 'badge-error' },
      draft: { label: 'Brouillon', className: 'badge-ghost' },
      paid: { label: 'Payée', className: 'badge-success' },
      partial: { label: 'Partielle', className: 'badge-warning' }
    };
    const config = configs[status] || { label: status, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  // Méthodes de paiement avec icônes
  const paymentMethods = [
    { value: 'cash', label: 'Espèces', icon: Banknote },
    { value: 'card', label: 'Carte bancaire', icon: CreditCard },
    { value: 'check', label: 'Chèque', icon: FileText },
    { value: 'transfer', label: 'Virement', icon: Landmark },
    { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
    { value: 'credit', label: 'Crédit', icon: Wallet }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 w-full">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-14 h-14 mx-auto" />
          <p className="text-lg font-medium text-gray-500">Chargement du paiement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button 
              className="btn btn-ghost btn-xs btn-circle" 
              onClick={() => setNotification(null)}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm w-full">
        <div className="w-full px-6 sm:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/paiements')} 
                className="btn btn-ghost gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" /> Retour
              </button>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <CreditCard className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {isEdit ? 'Modifier le paiement' : 'Nouveau paiement'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isEdit ? 'Modifiez les informations du paiement' : 'Enregistrez un nouveau paiement client'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="font-medium">{isEdit ? 'Modification' : 'Nouveau'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire - Full Width avec 2 colonnes */}
      <div className="w-full px-6 sm:px-8 py-6">
        <form onSubmit={handleSubmit} className="w-full">
          
          {/* Grille 2 colonnes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            
            {/* Colonne 1 - Informations facture */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50/80 px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2.5 text-gray-700">
                  <FileText className="w-5 h-5 text-primary" /> 
                  Informations facture
                </h3>
                {selectedFacture && (
                  <span>{getStatusBadge(selectedFacture.status)}</span>
                )}
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700 pb-1">
                    Sélectionner une facture <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="facture"
                    value={formData.facture}
                    onChange={handleChange}
                    className="select select-bordered w-full h-12 text-base"
                  >
                    <option value="">Choisir une facture</option>
                    {factures.length === 0 ? (
                      <option value="" disabled>Aucune facture disponible</option>
                    ) : (
                      factures.map(facture => (
                        <option key={facture.id} value={facture.id}>
                          {facture.invoice_number} - {facture.client_name} 
                          (Reste: {formatCurrency(facture.remaining_amount || facture.total)})
                        </option>
                      ))
                    )}
                  </select>
                  {factures.length === 0 && (
                    <p className="text-warning text-sm mt-2 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      Aucune facture trouvée. 
                      <button 
                        type="button" 
                        className="text-primary hover:underline ml-1 font-medium"
                        onClick={() => navigate('/factures/nouvelle')}
                      >
                        Créer une facture
                      </button>
                    </p>
                  )}
                </div>

                {selectedFacture && (
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">N° Facture</p>
                      <p className="font-semibold text-base">{selectedFacture.invoice_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Client</p>
                      <p className="font-semibold text-base truncate">{selectedFacture.client_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Total</p>
                      <p className="font-semibold text-base text-primary">{formatCurrency(selectedFacture.total)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Reste à payer</p>
                      <p className="font-semibold text-base text-success">{formatCurrency(selectedFacture.remaining_amount || selectedFacture.total)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Colonne 2 - Montant et méthode */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50/80 px-5 py-3.5 border-b border-gray-200">
                <h3 className="font-semibold flex items-center gap-2.5 text-gray-700">
                  <Wallet className="w-5 h-5 text-primary" /> 
                  Montant & Paiement
                </h3>
              </div>
              <div className="p-5 space-y-4">
                {/* Montant */}
                <div>
                  <label className="label text-sm font-medium text-gray-700 pb-1">
                    Montant (FCFA) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Banknote className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="Ex: 10 000"
                      className={`input input-bordered w-full pl-10 h-12 text-base ${errors.amount ? 'input-error' : ''}`}
                      min="1"
                      step="1"
                      onBlur={(e) => {
                        const value = e.target.value;
                        const validation = validateAmount(value);
                        if (!validation.valid && value) {
                          setErrors(prev => ({ ...prev, amount: validation.message }));
                        } else {
                          setErrors(prev => ({ ...prev, amount: '' }));
                        }
                      }}
                      onFocus={() => {
                        setErrors(prev => ({ ...prev, amount: '' }));
                      }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                      FCFA
                    </span>
                  </div>
                  
                  {errors.amount && (
                    <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      {errors.amount}
                    </p>
                  )}
                  
                  {formData.amount && !errors.amount && parseFloat(formData.amount) > 0 && (
                    <p className="text-green-600 text-sm mt-1.5 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      {formatCurrency(parseFloat(formData.amount))}
                    </p>
                  )}
                  
                  <p className="text-gray-400 text-xs mt-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                    Montant minimum : 1 FCFA
                    {selectedFacture && (
                      <span className="ml-2">
                        • Maximum : {formatCurrency(selectedFacture.remaining_amount || selectedFacture.total)}
                      </span>
                    )}
                  </p>
                </div>

                {/* Méthode de paiement */}
                <div>
                  <label className="label text-sm font-medium text-gray-700 pb-1">
                    Méthode de paiement <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      const isSelected = formData.method === method.value;
                      return (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, method: method.value }))}
                          className={`
                            flex items-center justify-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all
                            ${isSelected 
                              ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                              : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                            }
                          `}
                        >
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />
                          {method.label}
                        </button>
                      );
                    })}
                  </div>
                  <input type="hidden" name="method" value={formData.method} />
                </div>
              </div>
            </div>

            {/* Colonne 1 - Référence (2ème ligne) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50/80 px-5 py-3.5 border-b border-gray-200">
                <h3 className="font-semibold flex items-center gap-2.5 text-gray-700">
                  <Hash className="w-5 h-5 text-primary" /> 
                  Référence
                </h3>
              </div>
              <div className="p-5">
                <input
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleChange}
                  placeholder="Numéro de référence ou de transaction..."
                  className="input input-bordered w-full h-12 text-base"
                />
                <p className="text-gray-400 text-xs mt-2">
                  Ex: N° de chèque, numéro de transaction, code de validation
                </p>
              </div>
            </div>

            {/* Colonne 2 - Notes (2ème ligne) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50/80 px-5 py-3.5 border-b border-gray-200">
                <h3 className="font-semibold flex items-center gap-2.5 text-gray-700">
                  <MessageSquare className="w-5 h-5 text-primary" /> 
                  Notes
                </h3>
              </div>
              <div className="p-5">
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Informations complémentaires..."
                  className="textarea textarea-bordered w-full min-h-[100px] resize-none text-base"
                />
              </div>
            </div>

          </div>

          {/* Boutons d'action - Full Width en bas */}
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4 w-full">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="text-base text-gray-600">
                {selectedFacture ? (
                  <span>
                    Solde restant: <strong className="text-primary text-lg">{formatCurrency(selectedFacture.remaining_amount || selectedFacture.total)}</strong>
                  </span>
                ) : (
                  <span className="text-gray-400">Aucune facture sélectionnée</span>
                )}
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => navigate('/paiements')}
                  className="btn btn-ghost gap-2 flex-1 sm:flex-none h-12 px-6 text-base"
                  disabled={submitting}
                >
                  <X className="w-5 h-5" /> Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary gap-2 flex-1 sm:flex-none h-12 px-8 text-base min-w-[180px]"
                  disabled={submitting || !!errors.amount || !formData.amount || !formData.facture}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {isEdit ? 'Modifier le paiement' : 'Enregistrer le paiement'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default PaiementForm;