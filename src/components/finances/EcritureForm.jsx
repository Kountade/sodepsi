// src/components/finances/EcritureForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, Loader2, AlertCircle,
  CheckCircle, BookOpen, Calendar, DollarSign,
  User, Building2, FileText, Plus, Search
} from 'lucide-react';

const EcritureForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [comptes, setComptes] = useState([]);
  const [clients, setClients] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [ventes, setVentes] = useState([]);
  const [factures, setFactures] = useState([]);
  const [paiements, setPaiements] = useState([]);

  const [formData, setFormData] = useState({
    date_ecriture: new Date().toISOString().split('T')[0],
    date_echeance: '',
    compte_debit: '',
    compte_credit: '',
    montant: '',
    taxe: 0,
    reference: '',
    type: 'autre',
    vente: '',
    facture: '',
    paiement: '',
    supplier_invoice: '',
    purchase_order: '',
    supplier: '',
    client: '',
    description: '',
    notes: ''
  });

  const getToken = () => localStorage.getItem('Token');

  const fetchComptes = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/comptes/?is_active=true', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setComptes(response.data);
    } catch (error) {
      console.error('Erreur chargement comptes:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/clients/?statut=actif', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setClients(response.data);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    }
  };

  const fetchFournisseurs = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/fournisseurs/?is_active=true', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setFournisseurs(response.data);
    } catch (error) {
      console.error('Erreur chargement fournisseurs:', error);
    }
  };

  const fetchEcriture = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/ecritures/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = response.data;
      setFormData({
        date_ecriture: data.date_ecriture || '',
        date_echeance: data.date_echeance || '',
        compte_debit: data.compte_debit || '',
        compte_credit: data.compte_credit || '',
        montant: data.montant || '',
        taxe: data.taxe || 0,
        reference: data.reference || '',
        type: data.type || 'autre',
        vente: data.vente || '',
        facture: data.facture || '',
        paiement: data.paiement || '',
        supplier_invoice: data.supplier_invoice || '',
        purchase_order: data.purchase_order || '',
        supplier: data.supplier || '',
        client: data.client || '',
        description: data.description || '',
        notes: data.notes || ''
      });
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement de l\'écriture');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComptes();
    fetchClients();
    fetchFournisseurs();
    if (id) {
      fetchEcriture();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const token = getToken();
      const dataToSend = {
        ...formData,
        montant: parseFloat(formData.montant) || 0,
        taxe: parseFloat(formData.taxe) || 0,
        compte_debit: parseInt(formData.compte_debit) || null,
        compte_credit: parseInt(formData.compte_credit) || null,
        vente: formData.vente ? parseInt(formData.vente) : null,
        facture: formData.facture ? parseInt(formData.facture) : null,
        paiement: formData.paiement ? parseInt(formData.paiement) : null,
        supplier: formData.supplier ? parseInt(formData.supplier) : null,
        client: formData.client ? parseInt(formData.client) : null
      };

      let response;
      if (id) {
        response = await AxiosInstance.put(`/ecritures/${id}/`, dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
      } else {
        response = await AxiosInstance.post('/ecritures/', dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/ecritures');
      }, 1500);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.data) {
        const errors = Object.values(error.response.data).flat().join(' ');
        setError(errors || 'Erreur lors de l\'enregistrement');
      } else {
        setError('Erreur lors de l\'enregistrement');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement de l'écriture...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/ecritures')}
          className="btn btn-ghost btn-sm btn-circle"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              {id ? 'Modifier l\'écriture' : 'Nouvelle écriture comptable'}
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-1">
            {id ? `Écriture #${id}` : 'Créer une nouvelle écriture comptable'}
          </p>
        </div>
      </div>

      {/* Notification de succès */}
      {success && (
        <div className="alert alert-success shadow-lg animate-slideDown">
          <CheckCircle className="w-5 h-5" />
          <span>Écriture enregistrée avec succès !</span>
        </div>
      )}

      {/* Formulaire */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Erreur */}
          {error && (
            <div className="alert alert-error shadow-lg">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
              <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setError(null)}>
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date écriture */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Date d'écriture *</span>
              </label>
              <input
                type="date"
                name="date_ecriture"
                value={formData.date_ecriture}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
            </div>

            {/* Date échéance */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Date d'échéance</span>
              </label>
              <input
                type="date"
                name="date_echeance"
                value={formData.date_echeance}
                onChange={handleChange}
                className="input input-bordered w-full"
              />
            </div>

            {/* Compte Débit */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Compte Débit *</span>
              </label>
              <select
                name="compte_debit"
                value={formData.compte_debit}
                onChange={handleChange}
                className="select select-bordered w-full"
                required
              >
                <option value="">Sélectionner un compte</option>
                {comptes.map(c => (
                  <option key={c.id} value={c.id}>{c.numero} - {c.nom}</option>
                ))}
              </select>
            </div>

            {/* Compte Crédit */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Compte Crédit *</span>
              </label>
              <select
                name="compte_credit"
                value={formData.compte_credit}
                onChange={handleChange}
                className="select select-bordered w-full"
                required
              >
                <option value="">Sélectionner un compte</option>
                {comptes.map(c => (
                  <option key={c.id} value={c.id}>{c.numero} - {c.nom}</option>
                ))}
              </select>
            </div>

            {/* Montant */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Montant *</span>
              </label>
              <input
                type="number"
                name="montant"
                value={formData.montant}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="0"
                step="0.01"
                required
              />
            </div>

            {/* Taxe */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Taxe (TVA)</span>
              </label>
              <input
                type="number"
                name="taxe"
                value={formData.taxe}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="0"
                step="0.01"
              />
            </div>

            {/* Type */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Type *</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="select select-bordered w-full"
                required
              >
                <option value="vente">Vente</option>
                <option value="achat">Achat</option>
                <option value="paiement_client">Paiement Client</option>
                <option value="paiement_fournisseur">Paiement Fournisseur</option>
                <option value="recette">Recette</option>
                <option value="depense">Dépense</option>
                <option value="tresorerie">Trésorerie</option>
                <option value="regularisation">Régularisation</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            {/* Référence */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Référence</span>
              </label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="Référence externe..."
              />
            </div>

            {/* Client */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Client</span>
              </label>
              <select
                name="client"
                value={formData.client}
                onChange={handleChange}
                className="select select-bordered w-full"
              >
                <option value="">Sélectionner un client</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>

            {/* Fournisseur */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Fournisseur</span>
              </label>
              <select
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                className="select select-bordered w-full"
              >
                <option value="">Sélectionner un fournisseur</option>
                {fournisseurs.map(f => (
                  <option key={f.id} value={f.id}>{f.code} - {f.name}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="form-control md:col-span-2">
              <label className="label">
                <span className="label-text font-medium">Description *</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="textarea textarea-bordered w-full h-24"
                placeholder="Description de l'écriture..."
                required
              />
            </div>

            {/* Notes */}
            <div className="form-control md:col-span-2">
              <label className="label">
                <span className="label-text font-medium">Notes</span>
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="textarea textarea-bordered w-full h-20"
                placeholder="Notes supplémentaires..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <button
              type="submit"
              className="btn btn-primary gap-2"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Enregistrement...' : id ? 'Mettre à jour' : 'Créer l\'écriture'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/ecritures')}
              className="btn btn-ghost gap-2"
            >
              <X className="w-4 h-4" /> Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EcritureForm;