// src/components/paiements/PaiementForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import { ArrowLeft, Save, X, CreditCard, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const PaiementForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [factures, setFactures] = useState([]);
  const [notification, setNotification] = useState(null);
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
        console.warn('Token non trouvé');
        // Données de test
        setFactures(getMockFactures());
        return;
      }

      console.log('Chargement des factures...');
      const response = await AxiosInstance.get('/factures/', {
        headers: { 'Authorization': `Token ${token}` },
        params: { status: 'sent,overdue,partial' }
      });
      
      console.log('Factures reçues:', response.data);
      
      if (response.data && response.data.length > 0) {
        setFactures(response.data);
      } else {
        console.log('Aucune facture trouvée, chargement des données de test');
        setFactures(getMockFactures());
      }
    } catch (error) {
      console.error('Erreur chargement factures:', error);
      console.error('Response:', error.response);
      // Données de test en cas d'erreur
      setFactures(getMockFactures());
      showNotification('Erreur de chargement - Données de test affichées', 'error');
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.facture) {
      showNotification('Veuillez sélectionner une facture', 'error');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showNotification('Le montant est requis', 'error');
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
      
      console.log('Envoi des données:', dataToSend);
      
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
      console.error('Response:', error.response);
      
      if (error.response?.status === 404) {
        showNotification('La vue "register_payment" n\'existe pas. Veuillez contacter l\'administrateur.', 'error');
      } else {
        showNotification(error.response?.data?.message || 'Erreur lors de l\'enregistrement', 'error');
      }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification(null)}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/paiements')} className="btn btn-ghost btn-sm gap-2">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/15 rounded-xl">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {isEdit ? 'Modifier le paiement' : 'Nouveau paiement'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isEdit ? 'Modifiez les informations du paiement' : 'Enregistrez un nouveau paiement'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" /> Informations du paiement
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {/* Sélection de la facture */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Facture <span className="text-error">*</span>
                  </label>
                  <select
                    name="facture"
                    value={formData.facture}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    <option value="">Sélectionner une facture</option>
                    {factures.length === 0 ? (
                      <option value="" disabled>Aucune facture disponible</option>
                    ) : (
                      factures.map(facture => (
                        <option key={facture.id} value={facture.id}>
                          {facture.invoice_number} - {facture.client_name} 
                          (Reste: {formatCurrency(facture.remaining_amount || facture.total)})
                          {facture.status === 'overdue' && ' 🔴'}
                        </option>
                      ))
                    )}
                  </select>
                  {factures.length === 0 && (
                    <p className="text-warning text-xs mt-1">
                      ⚠️ Aucune facture trouvée. 
                      <button 
                        type="button" 
                        className="text-primary hover:underline ml-1"
                        onClick={() => navigate('/factures/nouvelle')}
                      >
                        Créer une facture
                      </button>
                    </p>
                  )}
                </div>

                {/* Montant */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Montant <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0"
                    className="input input-bordered w-full"
                    min="0"
                    step="100"
                  />
                </div>

                {/* Méthode de paiement */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Méthode de paiement <span className="text-error">*</span>
                  </label>
                  <select
                    name="method"
                    value={formData.method}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    <option value="cash">Espèces</option>
                    <option value="card">Carte bancaire</option>
                    <option value="check">Chèque</option>
                    <option value="transfer">Virement bancaire</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="credit">Crédit</option>
                  </select>
                </div>

                {/* Référence */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Référence
                  </label>
                  <input
                    type="text"
                    name="reference"
                    value={formData.reference}
                    onChange={handleChange}
                    placeholder="Numéro de référence..."
                    className="input input-bordered w-full"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Notes supplémentaires..."
                    className="textarea textarea-bordered w-full min-h-[80px]"
                  />
                </div>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={() => navigate('/paiements')}
                className="btn btn-ghost gap-2"
                disabled={submitting}
              >
                <X className="w-4 h-4" /> Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isEdit ? 'Modifier' : 'Enregistrer'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default PaiementForm;