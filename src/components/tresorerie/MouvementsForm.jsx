// src/components/tresorerie/MouvementTresorerieForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, AlertCircle, CheckCircle,
  DollarSign, TrendingUp, TrendingDown, Repeat,
  Calendar, Clock, Hash, Layers, Building2,
  Wallet, CreditCard, FileText, Loader2,
  Info, Plus, Search
} from 'lucide-react';

const MouvementTresorerieForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Listes pour les selects
  const [warehouses, setWarehouses] = useState([]);
  const [caisses, setCaisses] = useState([]);
  const [comptes, setComptes] = useState([]);
  const [ventes, setVentes] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [factures, setFactures] = useState([]);
  const [paiements, setPaiements] = useState([]);

  const [formData, setFormData] = useState({
    reference: '',
    type_mouvement: 'encaissement',
    warehouse: '',
    source_type: 'autre',
    source_id: '',
    source_reference: '',
    montant: '0',
    mode_paiement: 'especes',
    caisse: '',
    compte_bancaire: '',
    date_mouvement: new Date().toISOString().slice(0, 16),
    date_valeur: new Date().toISOString().split('T')[0],
    date_prevue: '',
    status: 'planifie',
    reference_externe: '',
    piece_justificative: '',
    libelle: '',
    notes: '',
    vente: '',
    purchase_order: '',
    facture_vente: '',
    paiement: ''
  });
  const [errors, setErrors] = useState({});

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Générer une référence automatique (même logique que le backend)
  const generateReference = async (type) => {
    const prefixMap = {
      'encaissement': 'ENC',
      'decaissement': 'DEC',
      'transfert': 'TRF'
    };
    const prefix = prefixMap[type] || 'TRES';
    const month = new Date().toISOString().slice(0, 7).replace('-', '');
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/mouvements/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      const mouvements = response.data || [];
      const filtered = mouvements.filter(m => m.reference && m.reference.startsWith(prefix + month));
      const maxNum = filtered.reduce((max, m) => {
        const num = parseInt(m.reference.replace(prefix + month, ''), 10);
        return num > max ? num : max;
      }, 0);
      const nextNum = maxNum + 1;
      return `${prefix}${month}${String(nextNum).padStart(4, '0')}`;
    } catch {
      return `${prefix}${month}0001`;
    }
  };

  // Charger les listes
  const fetchWarehouses = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/warehouses/?is_active=true', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setWarehouses(response.data || []);
    } catch (error) {
      console.error('Erreur chargement entrepôts:', error);
    }
  };

  const fetchCaisses = async (warehouseId) => {
    if (!warehouseId) return;
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/caisses/?warehouse=${warehouseId}&is_active=true`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setCaisses(response.data || []);
    } catch (error) {
      console.error('Erreur chargement caisses:', error);
    }
  };

  const fetchComptes = async (warehouseId) => {
    if (!warehouseId) return;
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/comptes-bancaires/?warehouse=${warehouseId}&is_active=true`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setComptes(response.data || []);
    } catch (error) {
      console.error('Erreur chargement comptes:', error);
    }
  };

  // Charger les entités liées (ventes, commandes, factures, paiements) - simplifié avec des listes récentes
  const fetchVentes = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/ventes/?limit=50', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setVentes(response.data || []);
    } catch (error) {
      console.error('Erreur chargement ventes:', error);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/achats/?limit=50', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setPurchaseOrders(response.data || []);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
    }
  };

  const fetchFactures = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/factures/?limit=50', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setFactures(response.data || []);
    } catch (error) {
      console.error('Erreur chargement factures:', error);
    }
  };

  const fetchPaiements = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/paiements/?limit=50', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setPaiements(response.data || []);
    } catch (error) {
      console.error('Erreur chargement paiements:', error);
    }
  };

  // Charger le mouvement en édition
  const fetchMouvement = async () => {
    if (!isEdit) {
      // Générer la référence par défaut
      const ref = await generateReference('encaissement');
      setFormData(prev => ({ ...prev, reference: ref }));
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/mouvements/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = response.data;
      // Formater les dates pour les inputs
      const dateMouvement = data.date_mouvement ? data.date_mouvement.slice(0, 16) : '';
      const dateValeur = data.date_valeur || '';
      const datePrevue = data.date_prevue || '';

      setFormData({
        reference: data.reference || '',
        type_mouvement: data.type_mouvement || 'encaissement',
        warehouse: data.warehouse || '',
        source_type: data.source_type || 'autre',
        source_id: data.source_id || '',
        source_reference: data.source_reference || '',
        montant: data.montant || '0',
        mode_paiement: data.mode_paiement || 'especes',
        caisse: data.caisse || '',
        compte_bancaire: data.compte_bancaire || '',
        date_mouvement: dateMouvement,
        date_valeur: dateValeur,
        date_prevue: datePrevue,
        status: data.status || 'planifie',
        reference_externe: data.reference_externe || '',
        piece_justificative: data.piece_justificative || '',
        libelle: data.libelle || '',
        notes: data.notes || '',
        vente: data.vente || '',
        purchase_order: data.purchase_order || '',
        facture_vente: data.facture_vente || '',
        paiement: data.paiement || ''
      });

      // Charger les caisses et comptes pour l'entrepôt sélectionné
      if (data.warehouse) {
        await fetchCaisses(data.warehouse);
        await fetchComptes(data.warehouse);
      }
    } catch (error) {
      console.error('Erreur chargement mouvement:', error);
      showNotification('Erreur de chargement des données', 'error');
      setTimeout(() => navigate('/mouvements-tresorerie'), 2000);
    } finally {
      setLoading(false);
    }
  };

  // Charger les listes au montage
  useEffect(() => {
    fetchWarehouses();
    fetchVentes();
    fetchPurchaseOrders();
    fetchFactures();
    fetchPaiements();
    fetchMouvement();
  }, [id]);

  // Mettre à jour les caisses et comptes quand l'entrepôt change
  useEffect(() => {
    if (formData.warehouse) {
      fetchCaisses(formData.warehouse);
      fetchComptes(formData.warehouse);
      // Réinitialiser les champs caisse et compte si l'entrepôt change
      setFormData(prev => ({ ...prev, caisse: '', compte_bancaire: '' }));
    } else {
      setCaisses([]);
      setComptes([]);
    }
  }, [formData.warehouse]);

  // Mettre à jour la référence quand le type change
  useEffect(() => {
    if (!isEdit) {
      const updateRef = async () => {
        const ref = await generateReference(formData.type_mouvement);
        setFormData(prev => ({ ...prev, reference: ref }));
      };
      updateRef();
    }
  }, [formData.type_mouvement]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.type_mouvement) newErrors.type_mouvement = 'Le type est requis';
    if (!formData.warehouse) newErrors.warehouse = "L'entrepôt est requis";
    if (!formData.montant || parseFloat(formData.montant) <= 0) {
      newErrors.montant = 'Le montant doit être supérieur à 0';
    }
    if (!formData.mode_paiement) newErrors.mode_paiement = 'Le mode de paiement est requis';
    if (!formData.caisse && !formData.compte_bancaire) {
      newErrors.caisse = 'Veuillez sélectionner une caisse ou un compte bancaire';
    }
    if (!formData.date_mouvement) newErrors.date_mouvement = 'La date du mouvement est requise';
    if (!formData.date_valeur) newErrors.date_valeur = 'La date de valeur est requise';
    if (!formData.libelle.trim()) newErrors.libelle = 'Le libellé est requis';

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
    try {
      const token = getToken();
      const dataToSend = {
        ...formData,
        montant: parseFloat(formData.montant) || 0,
        source_id: formData.source_id || null,
        caisse: formData.caisse || null,
        compte_bancaire: formData.compte_bancaire || null,
        vente: formData.vente || null,
        purchase_order: formData.purchase_order || null,
        facture_vente: formData.facture_vente || null,
        paiement: formData.paiement || null,
        date_prevue: formData.date_prevue || null,
        date_valeur: formData.date_valeur || null,
      };

      const url = isEdit ? `/mouvements/${id}/` : '/mouvements/';
      const method = isEdit ? 'put' : 'post';

      const response = await AxiosInstance[method](url, dataToSend, {
        headers: { 'Authorization': `Token ${token}` }
      });

      showNotification(
        isEdit ? 'Mouvement modifié avec succès' : 'Mouvement créé avec succès',
        'success'
      );

      setTimeout(() => {
        navigate(`/mouvements-tresorerie/${response.data.id}`);
      }, 1500);

    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.data) {
        const backendErrors = error.response.data;
        const newErrors = {};
        Object.keys(backendErrors).forEach(key => {
          newErrors[key] = Array.isArray(backendErrors[key])
            ? backendErrors[key][0]
            : backendErrors[key];
        });
        setErrors(newErrors);
        showNotification('Erreur lors de l\'enregistrement', 'error');
      } else {
        showNotification('Erreur réseau', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const typeOptions = [
    { value: 'encaissement', label: 'Encaissement', icon: TrendingUp },
    { value: 'decaissement', label: 'Décaissement', icon: TrendingDown },
    { value: 'transfert', label: 'Transfert', icon: Repeat }
  ];

  const sourceTypeOptions = [
    { value: 'vente', label: 'Vente' },
    { value: 'achat', label: 'Achat' },
    { value: 'facture_client', label: 'Facture client' },
    { value: 'facture_fournisseur', label: 'Facture fournisseur' },
    { value: 'paiement_client', label: 'Paiement client' },
    { value: 'paiement_fournisseur', label: 'Paiement fournisseur' },
    { value: 'salaire', label: 'Salaire' },
    { value: 'frais', label: 'Frais' },
    { value: 'caisse', label: 'Caisse' },
    { value: 'compte_bancaire', label: 'Compte bancaire' },
    { value: 'transfert_interne', label: 'Transfert interne' },
    { value: 'autre', label: 'Autre' }
  ];

  const modeOptions = [
    { value: 'especes', label: 'Espèces' },
    { value: 'carte', label: 'Carte bancaire' },
    { value: 'cheque', label: 'Chèque' },
    { value: 'virement', label: 'Virement' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'prelevement', label: 'Prélèvement' },
    { value: 'autre', label: 'Autre' }
  ];

  const statusOptions = [
    { value: 'planifie', label: 'Planifié' },
    { value: 'en_attente', label: 'En attente' },
    { value: 'effectue', label: 'Effectué' },
    { value: 'annule', label: 'Annulé' },
    { value: 'rejete', label: 'Rejeté' }
  ];

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
              <button onClick={() => navigate('/mouvements-tresorerie')} className="btn btn-ghost btn-sm gap-2">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/15 rounded-xl">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {isEdit ? 'Modifier le mouvement' : 'Nouveau mouvement'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isEdit ? 'Modifiez les informations du mouvement' : 'Enregistrez une nouvelle opération'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Section 1 : Informations générales */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> Informations générales
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Référence <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="reference"
                    value={formData.reference}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.reference ? 'input-error' : ''}`}
                    readOnly
                  />
                  {errors.reference && <p className="text-error text-xs mt-1">{errors.reference}</p>}
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Type de mouvement <span className="text-error">*</span>
                  </label>
                  <select
                    name="type_mouvement"
                    value={formData.type_mouvement}
                    onChange={handleChange}
                    className={`select select-bordered w-full ${errors.type_mouvement ? 'select-error' : ''}`}
                  >
                    {typeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {errors.type_mouvement && <p className="text-error text-xs mt-1">{errors.type_mouvement}</p>}
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Entrepôt <span className="text-error">*</span>
                  </label>
                  <select
                    name="warehouse"
                    value={formData.warehouse}
                    onChange={handleChange}
                    className={`select select-bordered w-full ${errors.warehouse ? 'select-error' : ''}`}
                  >
                    <option value="">Sélectionner un entrepôt</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                  {errors.warehouse && <p className="text-error text-xs mt-1">{errors.warehouse}</p>}
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Source
                  </label>
                  <select
                    name="source_type"
                    value={formData.source_type}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    {sourceTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Référence source
                  </label>
                  <input
                    type="text"
                    name="source_reference"
                    value={formData.source_reference}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    placeholder="Référence externe"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 : Montant et mode */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> Montant et mode de paiement
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Montant <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    name="montant"
                    value={formData.montant}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.montant ? 'input-error' : ''}`}
                    placeholder="0"
                    step="100"
                    min="0"
                  />
                  {errors.montant && <p className="text-error text-xs mt-1">{errors.montant}</p>}
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Mode de paiement <span className="text-error">*</span>
                  </label>
                  <select
                    name="mode_paiement"
                    value={formData.mode_paiement}
                    onChange={handleChange}
                    className={`select select-bordered w-full ${errors.mode_paiement ? 'select-error' : ''}`}
                  >
                    {modeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {errors.mode_paiement && <p className="text-error text-xs mt-1">{errors.mode_paiement}</p>}
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Libellé <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="libelle"
                    value={formData.libelle}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.libelle ? 'input-error' : ''}`}
                    placeholder="Ex: Paiement fournisseur"
                  />
                  {errors.libelle && <p className="text-error text-xs mt-1">{errors.libelle}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 : Caisse / Compte bancaire */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" /> Caisse ou compte bancaire
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Caisse
                  </label>
                  <select
                    name="caisse"
                    value={formData.caisse}
                    onChange={handleChange}
                    className={`select select-bordered w-full ${errors.caisse ? 'select-error' : ''}`}
                    disabled={!formData.warehouse}
                  >
                    <option value="">Sélectionner une caisse</option>
                    {caisses.map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.nom}</option>
                    ))}
                  </select>
                  {errors.caisse && <p className="text-error text-xs mt-1">{errors.caisse}</p>}
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Compte bancaire
                  </label>
                  <select
                    name="compte_bancaire"
                    value={formData.compte_bancaire}
                    onChange={handleChange}
                    className={`select select-bordered w-full ${errors.compte_bancaire ? 'select-error' : ''}`}
                    disabled={!formData.warehouse}
                  >
                    <option value="">Sélectionner un compte</option>
                    {comptes.map(c => (
                      <option key={c.id} value={c.id}>{c.banque} - {c.nom}</option>
                    ))}
                  </select>
                  {errors.compte_bancaire && <p className="text-error text-xs mt-1">{errors.compte_bancaire}</p>}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Sélectionnez une caisse OU un compte bancaire.</p>
            </div>
          </div>

          {/* Section 4 : Dates */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Dates
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Date du mouvement <span className="text-error">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="date_mouvement"
                    value={formData.date_mouvement}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.date_mouvement ? 'input-error' : ''}`}
                  />
                  {errors.date_mouvement && <p className="text-error text-xs mt-1">{errors.date_mouvement}</p>}
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Date de valeur <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    name="date_valeur"
                    value={formData.date_valeur}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.date_valeur ? 'input-error' : ''}`}
                  />
                  {errors.date_valeur && <p className="text-error text-xs mt-1">{errors.date_valeur}</p>}
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Date prévue (optionnelle)
                  </label>
                  <input
                    type="date"
                    name="date_prevue"
                    value={formData.date_prevue}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 5 : Statut et références */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Statut et références
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Statut <span className="text-error">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Référence externe
                  </label>
                  <input
                    type="text"
                    name="reference_externe"
                    value={formData.reference_externe}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    placeholder="Référence du fournisseur/client"
                  />
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Pièce justificative
                  </label>
                  <input
                    type="text"
                    name="piece_justificative"
                    value={formData.piece_justificative}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    placeholder="N° de pièce"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 6 : Liens vers les entités */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Liens vers d'autres entités
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Vente associée
                  </label>
                  <select
                    name="vente"
                    value={formData.vente}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    <option value="">Aucune</option>
                    {ventes.map(v => (
                      <option key={v.id} value={v.id}>{v.reference} - {v.client_name || v.id}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Commande fournisseur
                  </label>
                  <select
                    name="purchase_order"
                    value={formData.purchase_order}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    <option value="">Aucune</option>
                    {purchaseOrders.map(p => (
                      <option key={p.id} value={p.id}>{p.reference}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Facture vente
                  </label>
                  <select
                    name="facture_vente"
                    value={formData.facture_vente}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    <option value="">Aucune</option>
                    {factures.map(f => (
                      <option key={f.id} value={f.id}>{f.numero} - {f.client_name || f.id}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label text-sm font-medium text-gray-700">
                    Paiement
                  </label>
                  <select
                    name="paiement"
                    value={formData.paiement}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    <option value="">Aucun</option>
                    {paiements.map(p => (
                      <option key={p.id} value={p.id}>{p.reference}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 7 : Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" /> Notes
              </h3>
            </div>
            <div className="p-6">
              <div>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="textarea textarea-bordered w-full min-h-[80px]"
                  placeholder="Informations complémentaires..."
                />
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate('/mouvements-tresorerie')}
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
  );
};

export default MouvementTresorerieForm;