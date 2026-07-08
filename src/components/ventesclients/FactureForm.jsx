// src/components/factures/FactureForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, AlertCircle, CheckCircle,
  FileText, Users, Calendar, DollarSign,
  Loader2, Building2, Phone, Mail, MapPin
} from 'lucide-react';

const FactureForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    sale: '',
    due_date: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [backendErrors, setBackendErrors] = useState({});

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Charger les ventes non facturées
  const fetchSales = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await AxiosInstance.get('/sales/?status=confirmed', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setSales(response.data || []);
    } catch (error) {
      console.error('Erreur chargement ventes:', error);
    }
  };

  // Charger les clients
  const fetchClients = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await AxiosInstance.get('/clients/?statut=actif', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setClients(response.data || []);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    }
  };

  // Charger la facture si édition
  const fetchFacture = async () => {
    if (!isEdit) return;
    
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      const response = await AxiosInstance.get(`/factures/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      const data = response.data;
      setFormData({
        sale: data.sale || '',
        due_date: data.due_date || '',
        notes: data.notes || ''
      });
      
      // Récupérer la vente associée
      if (data.sale) {
        const saleRes = await AxiosInstance.get(`/sales/${data.sale}/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        setSelectedSale(saleRes.data);
      }
    } catch (error) {
      console.error('Erreur chargement facture:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement des données', 'error');
        setTimeout(() => navigate('/factures'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchClients();
    fetchFacture();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (backendErrors[name]) {
      setBackendErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSaleSelect = async (saleId) => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/sales/${saleId}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setSelectedSale(response.data);
      setFormData(prev => ({ ...prev, sale: saleId }));
    } catch (error) {
      console.error('Erreur chargement vente:', error);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.sale) newErrors.sale = 'La vente est requise';
    if (!formData.due_date) newErrors.due_date = 'La date d\'échéance est requise';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      showNotification('Veuillez corriger les erreurs', 'error');
      return;
    }

    setSubmitting(true);
    setBackendErrors({});
    
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      const url = isEdit ? `/factures/${id}/` : '/factures/';
      const method = isEdit ? 'put' : 'post';
      
      const dataToSend = {
        sale: parseInt(formData.sale),
        due_date: formData.due_date,
        notes: formData.notes || ''
      };
      
      const response = await AxiosInstance[method](url, dataToSend, {
        headers: { 'Authorization': `Token ${token}` }
      });

      showNotification(
        isEdit ? 'Facture modifiée avec succès' : 'Facture créée avec succès',
        'success'
      );

      setTimeout(() => {
        navigate(`/factures/${response.data.id}`);
      }, 1500);

    } catch (error) {
      console.error('Erreur:', error);
      
      if (error.response?.status === 400) {
        const backendData = error.response.data;
        if (typeof backendData === 'object') {
          setBackendErrors(backendData);
          let errorMessage = 'Erreur de validation: ';
          const errorList = [];
          Object.keys(backendData).forEach(key => {
            const msg = Array.isArray(backendData[key]) 
              ? backendData[key][0] 
              : backendData[key];
            errorList.push(`${key}: ${msg}`);
          });
          errorMessage += errorList.join(', ');
          showNotification(errorMessage, 'error');
        } else {
          showNotification(backendData || 'Erreur de validation des données', 'error');
        }
      } else if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification(error.response?.data?.message || 'Erreur réseau', 'error');
      }
    } finally {
      setSubmitting(false);
    }
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
              <button onClick={() => navigate('/factures')} className="btn btn-ghost btn-sm gap-2">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/15 rounded-xl">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {isEdit ? 'Modifier la facture' : 'Nouvelle facture'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isEdit ? 'Modifiez les informations de la facture' : 'Créez une nouvelle facture'}
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
            
            {/* Informations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Informations de la facture
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {/* Sélection de la vente */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Vente associée <span className="text-error">*</span>
                  </label>
                  <select
                    name="sale"
                    value={formData.sale}
                    onChange={(e) => {
                      handleChange(e);
                      if (e.target.value) handleSaleSelect(e.target.value);
                    }}
                    className={`select select-bordered w-full ${errors.sale || backendErrors.sale ? 'select-error' : ''}`}
                  >
                    <option value="">Sélectionner une vente</option>
                    {sales.map(sale => (
                      <option key={sale.id} value={sale.id}>
                        {sale.invoice_number} - {sale.client_name} ({formatCurrency(sale.total)})
                      </option>
                    ))}
                  </select>
                  {(errors.sale || backendErrors.sale) && (
                    <p className="text-error text-xs mt-1">{backendErrors.sale || errors.sale}</p>
                  )}
                </div>

                {/* Détails de la vente sélectionnée */}
                {selectedSale && (
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <h4 className="font-semibold text-primary mb-2">Détails de la vente</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Client:</span>
                        <span className="font-medium ml-2">{selectedSale.client_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Montant:</span>
                        <span className="font-medium ml-2 text-primary">{formatCurrency(selectedSale.total)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <span className="font-medium ml-2">{formatDate(selectedSale.sale_date)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Statut:</span>
                        <span className="font-medium ml-2">{selectedSale.status}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Date d'échéance */}
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Date d'échéance <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.due_date || backendErrors.due_date ? 'input-error' : ''}`}
                  />
                  {(errors.due_date || backendErrors.due_date) && (
                    <p className="text-error text-xs mt-1">{backendErrors.due_date || errors.due_date}</p>
                  )}
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
                onClick={() => navigate('/factures')}
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
                {isEdit ? 'Modifier' : 'Créer'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

// Fonctions utilitaires
const formatCurrency = (amount) => {
  if (!amount) return '0 FCFA';
  return `${amount.toLocaleString('fr-FR')} FCFA`;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return '-';
  }
};

export default FactureForm;