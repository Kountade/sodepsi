// src/components/finances/MouvementTresorerieForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, Loader2, AlertCircle,
  CheckCircle, TrendingUp, TrendingDown,
  Wallet, Calendar, DollarSign, FileText
} from 'lucide-react';

const MouvementTresorerieForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tresorerieIdParam = queryParams.get('tresorerie');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [tresoreries, setTresoreries] = useState([]);

  const [formData, setFormData] = useState({
    tresorerie: tresorerieIdParam || '',
    type: 'entree',
    categorie: 'autre',
    montant: '',
    date_valeur: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    notes: '',
    ecriture: '',
    vente: '',
    paiement: '',
    supplier_invoice: '',
    supplier: ''
  });

  const getToken = () => localStorage.getItem('Token');

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

  const fetchMouvement = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/mouvements-tresorerie/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = response.data;
      setFormData({
        tresorerie: data.tresorerie || '',
        type: data.type || 'entree',
        categorie: data.categorie || 'autre',
        montant: data.montant || '',
        date_valeur: data.date_valeur || new Date().toISOString().split('T')[0],
        reference: data.reference || '',
        description: data.description || '',
        notes: data.notes || '',
        ecriture: data.ecriture || '',
        vente: data.vente || '',
        paiement: data.paiement || '',
        supplier_invoice: data.supplier_invoice || '',
        supplier: data.supplier || ''
      });
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement du mouvement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTresoreries();
    if (id) {
      fetchMouvement();
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
        tresorerie: parseInt(formData.tresorerie) || null,
        ecriture: formData.ecriture ? parseInt(formData.ecriture) : null,
        vente: formData.vente ? parseInt(formData.vente) : null,
        paiement: formData.paiement ? parseInt(formData.paiement) : null,
        supplier: formData.supplier ? parseInt(formData.supplier) : null
      };

      let response;
      if (id) {
        response = await AxiosInstance.put(`/mouvements-tresorerie/${id}/`, dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
      } else {
        response = await AxiosInstance.post('/mouvements-tresorerie/', dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/mouvements-tresorerie');
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
          <p className="text-base font-medium text-gray-500">Chargement du mouvement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/mouvements-tresorerie')}
          className="btn btn-ghost btn-sm btn-circle"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              {id ? 'Modifier le mouvement' : 'Nouveau mouvement de trésorerie'}
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-1">
            {id ? `Mouvement #${id}` : 'Enregistrer un nouveau mouvement de trésorerie'}
          </p>
        </div>
      </div>

      {/* Notification de succès */}
      {success && (
        <div className="alert alert-success shadow-lg animate-slideDown">
          <CheckCircle className="w-5 h-5" />
          <span>Mouvement enregistré avec succès !</span>
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
            {/* Trésorerie */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Trésorerie *</span>
              </label>
              <select
                name="tresorerie"
                value={formData.tresorerie}
                onChange={handleChange}
                className="select select-bordered w-full"
                required
              >
                <option value="">Sélectionner une trésorerie</option>
                {tresoreries.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nom} ({t.code}) - {t.solde_actuel} FCFA
                  </option>
                ))}
              </select>
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
                <option value="entree">Entrée</option>
                <option value="sortie">Sortie</option>
              </select>
            </div>

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
                <option value="vente">Vente</option>
                <option value="paiement">Paiement fournisseur</option>
                <option value="recette">Recette</option>
                <option value="depense">Dépense</option>
                <option value="transfert">Transfert entre comptes</option>
                <option value="regularisation">Régularisation</option>
                <option value="autre">Autre</option>
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

            {/* Date valeur */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Date de valeur *</span>
              </label>
              <input
                type="date"
                name="date_valeur"
                value={formData.date_valeur}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
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
                placeholder="Description du mouvement..."
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
              {saving ? 'Enregistrement...' : id ? 'Mettre à jour' : 'Créer le mouvement'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/mouvements-tresorerie')}
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

export default MouvementTresorerieForm;