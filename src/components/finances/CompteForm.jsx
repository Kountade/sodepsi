// src/components/finances/CompteForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, Loader2, AlertCircle,
  CheckCircle, Grid3x3, Building2, Wallet
} from 'lucide-react';

const CompteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [comptesParents, setComptesParents] = useState([]);

  const [formData, setFormData] = useState({
    numero: '',
    nom: '',
    nom_complet: '',
    type: 'actif',
    classe: '1',
    parent: '',
    solde_initial: 0,
    is_analytique: false,
    is_budgetaire: false,
    is_active: true,
    notes: ''
  });

  const getToken = () => localStorage.getItem('Token');

  const fetchCompte = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/comptes/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = response.data;
      setFormData({
        numero: data.numero || '',
        nom: data.nom || '',
        nom_complet: data.nom_complet || '',
        type: data.type || 'actif',
        classe: data.classe || '1',
        parent: data.parent || '',
        solde_initial: data.solde_initial || 0,
        is_analytique: data.is_analytique || false,
        is_budgetaire: data.is_budgetaire || false,
        is_active: data.is_active !== undefined ? data.is_active : true,
        notes: data.notes || ''
      });
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement du compte');
    } finally {
      setLoading(false);
    }
  };

  const fetchComptesParents = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/comptes/?parent=null', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setComptesParents(response.data.filter(c => c.id !== parseInt(id)));
    } catch (error) {
      console.error('Erreur chargement parents:', error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCompte();
    }
    fetchComptesParents();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
        solde_initial: parseFloat(formData.solde_initial) || 0,
        parent: formData.parent || null
      };

      let response;
      if (id) {
        response = await AxiosInstance.put(`/comptes/${id}/`, dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
      } else {
        response = await AxiosInstance.post('/comptes/', dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/comptes');
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
          <p className="text-base font-medium text-gray-500">Chargement du compte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/comptes')}
          className="btn btn-ghost btn-sm btn-circle"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Grid3x3 className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              {id ? 'Modifier le compte' : 'Nouveau compte comptable'}
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-1">
            {id ? `Compte #${id}` : 'Créer un nouveau compte dans le plan comptable'}
          </p>
        </div>
      </div>

      {/* Notification de succès */}
      {success && (
        <div className="alert alert-success shadow-lg animate-slideDown">
          <CheckCircle className="w-5 h-5" />
          <span>Compte enregistré avec succès !</span>
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
            {/* Numéro */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Numéro de compte *</span>
              </label>
              <input
                type="text"
                name="numero"
                value={formData.numero}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="Ex: 101, 411, 512..."
                required
              />
            </div>

            {/* Nom */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Nom du compte *</span>
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="Ex: Caisse, Banque, Clients..."
                required
              />
            </div>

            {/* Nom complet */}
            <div className="form-control md:col-span-2">
              <label className="label">
                <span className="label-text font-medium">Nom complet</span>
              </label>
              <input
                type="text"
                name="nom_complet"
                value={formData.nom_complet}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="Ex: Caisse centrale, Banque VISTA BANK..."
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
                <option value="actif">Actif</option>
                <option value="passif">Passif</option>
                <option value="capitaux">Capitaux propres</option>
                <option value="produits">Produits</option>
                <option value="charges">Charges</option>
              </select>
            </div>

            {/* Classe */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Classe *</span>
              </label>
              <select
                name="classe"
                value={formData.classe}
                onChange={handleChange}
                className="select select-bordered w-full"
                required
              >
                <option value="1">Classe 1 - Capital</option>
                <option value="2">Classe 2 - Immobilisations</option>
                <option value="3">Classe 3 - Stocks</option>
                <option value="4">Classe 4 - Tiers</option>
                <option value="5">Classe 5 - Trésorerie</option>
                <option value="6">Classe 6 - Charges</option>
                <option value="7">Classe 7 - Produits</option>
                <option value="8">Classe 8 - Régularisation</option>
              </select>
            </div>

            {/* Compte parent */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Compte parent</span>
              </label>
              <select
                name="parent"
                value={formData.parent}
                onChange={handleChange}
                className="select select-bordered w-full"
              >
                <option value="">Aucun (compte principal)</option>
                {comptesParents.map(c => (
                  <option key={c.id} value={c.id}>{c.numero} - {c.nom}</option>
                ))}
              </select>
            </div>

            {/* Solde initial */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Solde initial</span>
              </label>
              <input
                type="number"
                name="solde_initial"
                value={formData.solde_initial}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="0"
                step="0.01"
              />
            </div>

            {/* Options */}
            <div className="form-control md:col-span-2">
              <div className="flex flex-wrap gap-6 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_analytique"
                    checked={formData.is_analytique}
                    onChange={handleChange}
                    className="checkbox checkbox-primary"
                  />
                  <span className="text-sm">Compte analytique</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_budgetaire"
                    checked={formData.is_budgetaire}
                    onChange={handleChange}
                    className="checkbox checkbox-primary"
                  />
                  <span className="text-sm">Compte budgétaire</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="checkbox checkbox-success"
                  />
                  <span className="text-sm">Actif</span>
                </label>
              </div>
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
                className="textarea textarea-bordered w-full h-24"
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
              {saving ? 'Enregistrement...' : id ? 'Mettre à jour' : 'Créer le compte'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/comptes')}
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

export default CompteForm;