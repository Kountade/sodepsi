// src/components/finances/DepenseForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, Loader2, AlertCircle,
  CheckCircle, FileText, Calendar, DollarSign,
  Building2, Plus, Search
} from 'lucide-react';

const DepenseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [tresoreries, setTresoreries] = useState([]);

  const [formData, setFormData] = useState({
    categorie: 'autre',
    description: '',
    montant: '',
    taxe: 0,
    date_depense: new Date().toISOString().split('T')[0],
    date_echeance: '',
    mode_paiement: '',
    reference_paiement: '',
    supplier: '',
    supplier_name: '',
    tresorerie: '',
    purchase_order: '',
    notes: ''
  });

  const getToken = () => localStorage.getItem('Token');

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

  const fetchTresoreries = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/tresorerie/?is_active=true', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setTresoreries(response.data);
    } catch (error) {
      console.error('Erreur chargement trésoreries:', error);
    }
  };

  const fetchDepense = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/depenses/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = response.data;
      setFormData({
        categorie: data.categorie || 'autre',
        description: data.description || '',
        montant: data.montant || '',
        taxe: data.taxe || 0,
        date_depense: data.date_depense || new Date().toISOString().split('T')[0],
        date_echeance: data.date_echeance || '',
        mode_paiement: data.mode_paiement || '',
        reference_paiement: data.reference_paiement || '',
        supplier: data.supplier || '',
        supplier_name: data.supplier_name || '',
        tresorerie: data.tresorerie || '',
        purchase_order: data.purchase_order || '',
        notes: data.notes || ''
      });
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement de la dépense');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFournisseurs();
    fetchTresoreries();
    if (id) {
      fetchDepense();
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
        supplier: formData.supplier ? parseInt(formData.supplier) : null,
        tresorerie: formData.tresorerie ? parseInt(formData.tresorerie) : null
      };

      let response;
      if (id) {
        response = await AxiosInstance.put(`/depenses/${id}/`, dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
      } else {
        response = await AxiosInstance.post('/depenses/', dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/depenses');
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
          <p className="text-base font-medium text-gray-500">Chargement de la dépense...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/depenses')}
          className="btn btn-ghost btn-sm btn-circle"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              {id ? 'Modifier la dépense' : 'Nouvelle dépense'}
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-1">
            {id ? `Dépense #${id}` : 'Enregistrer une nouvelle dépense'}
          </p>
        </div>
      </div>

      {/* Notification de succès */}
      {success && (
        <div className="alert alert-success shadow-lg animate-slideDown">
          <CheckCircle className="w-5 h-5" />
          <span>Dépense enregistrée avec succès !</span>
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
            {/* Catégorie */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Catégorie *</span>
              </label>
              <select
                name="categorie"
                value={formData.categorie}
                onChange={handleChange}
                className="select select-bordered w-full"
                required
              >
                <option value="fournitures">Fournitures de bureau</option>
                <option value="utilities">Services publics</option>
                <option value="loyer">Loyer</option>
                <option value="salaires">Salaires</option>
                <option value="marketing">Marketing</option>
                <option value="transport">Transport</option>
                <option value="maintenance">Maintenance</option>
                <option value="formation">Formation</option>
                <option value="informatique">Informatique</option>
                <option value="telecommunication">Télécommunication</option>
                <option value="frais_bancaires">Frais bancaires</option>
                <option value="impots">Impôts et taxes</option>
                <option value="assurance">Assurance</option>
                <option value="frais_professionnels">Frais professionnels</option>
                <option value="achat_stock">Achat de stock</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            {/* Date dépense */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Date de la dépense *</span>
              </label>
              <input
                type="date"
                name="date_depense"
                value={formData.date_depense}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
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
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* Nom fournisseur (libre) */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Nom du fournisseur (libre)</span>
              </label>
              <input
                type="text"
                name="supplier_name"
                value={formData.supplier_name}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="Nom du fournisseur..."
              />
            </div>

            {/* Trésorerie */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Trésorerie</span>
              </label>
              <select
                name="tresorerie"
                value={formData.tresorerie}
                onChange={handleChange}
                className="select select-bordered w-full"
              >
                <option value="">Sélectionner une trésorerie</option>
                {tresoreries.map(t => (
                  <option key={t.id} value={t.id}>{t.nom} ({t.code})</option>
                ))}
              </select>
            </div>

            {/* Mode de paiement */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Mode de paiement</span>
              </label>
              <input
                type="text"
                name="mode_paiement"
                value={formData.mode_paiement}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="Espèces, Virement, Chèque..."
              />
            </div>

            {/* Référence paiement */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Référence paiement</span>
              </label>
              <input
                type="text"
                name="reference_paiement"
                value={formData.reference_paiement}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="Référence du paiement..."
              />
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
                placeholder="Description de la dépense..."
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
              {saving ? 'Enregistrement...' : id ? 'Mettre à jour' : 'Créer la dépense'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/depenses')}
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

export default DepenseForm;