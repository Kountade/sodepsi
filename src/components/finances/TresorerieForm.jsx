// src/components/finances/TresorerieForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, Loader2, AlertCircle,
  CheckCircle, Wallet, Building2, CreditCard,
  Landmark, Smartphone, DollarSign
} from 'lucide-react';

const TresorerieForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    type: 'banque',
    banque: '',
    iban: '',
    bic: '',
    titulaire: '',
    solde_initial: 0,
    solde_minimum: 0,
    is_active: true,
    is_default: false,
    notes: ''
  });

  const getToken = () => localStorage.getItem('Token');

  const fetchTresorerie = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/tresorerie/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = response.data;
      setFormData({
        nom: data.nom || '',
        code: data.code || '',
        type: data.type || 'banque',
        banque: data.banque || '',
        iban: data.iban || '',
        bic: data.bic || '',
        titulaire: data.titulaire || '',
        solde_initial: data.solde_initial || 0,
        solde_minimum: data.solde_minimum || 0,
        is_active: data.is_active !== undefined ? data.is_active : true,
        is_default: data.is_default || false,
        notes: data.notes || ''
      });
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement de la trésorerie');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTresorerie();
    }
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
        solde_minimum: parseFloat(formData.solde_minimum) || 0
      };

      let response;
      if (id) {
        response = await AxiosInstance.put(`/tresorerie/${id}/`, dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
      } else {
        response = await AxiosInstance.post('/tresorerie/', dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/tresorerie');
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

  const getTypeIcon = (type) => {
    const icons = {
      banque: <Landmark className="w-5 h-5" />,
      caisse: <Wallet className="w-5 h-5" />,
      especes: <DollarSign className="w-5 h-5" />,
      mobile_money: <Smartphone className="w-5 h-5" />,
      virement: <CreditCard className="w-5 h-5" />
    };
    return icons[type] || <Wallet className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement de la trésorerie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/tresorerie')}
          className="btn btn-ghost btn-sm btn-circle"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              {id ? 'Modifier la trésorerie' : 'Nouvelle trésorerie'}
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-1">
            {id ? `Trésorerie #${id}` : 'Créer un nouveau compte de trésorerie'}
          </p>
        </div>
      </div>

      {/* Notification de succès */}
      {success && (
        <div className="alert alert-success shadow-lg animate-slideDown">
          <CheckCircle className="w-5 h-5" />
          <span>Trésorerie enregistrée avec succès !</span>
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
            {/* Nom */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Nom *</span>
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="Ex: VISTA BANK, Caisse Principale..."
                required
              />
            </div>

            {/* Code */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Code *</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="Ex: BANQ001, CAISSE001..."
                required
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
                <option value="banque">Banque</option>
                <option value="caisse">Caisse</option>
                <option value="especes">Espèces</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="virement">Virement</option>
              </select>
            </div>

            {/* Banque */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Banque</span>
              </label>
              <input
                type="text"
                name="banque"
                value={formData.banque}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="Nom de la banque..."
              />
            </div>

            {/* Titulaire */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Titulaire</span>
              </label>
              <input
                type="text"
                name="titulaire"
                value={formData.titulaire}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="Nom du titulaire..."
              />
            </div>

            {/* IBAN */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">IBAN</span>
              </label>
              <input
                type="text"
                name="iban"
                value={formData.iban}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="Numéro IBAN..."
              />
            </div>

            {/* BIC */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">BIC/SWIFT</span>
              </label>
              <input
                type="text"
                name="bic"
                value={formData.bic}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="Code BIC/SWIFT..."
              />
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

            {/* Solde minimum */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Solde minimum</span>
              </label>
              <input
                type="number"
                name="solde_minimum"
                value={formData.solde_minimum}
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
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="checkbox checkbox-success"
                  />
                  <span className="text-sm">Actif</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleChange}
                    className="checkbox checkbox-primary"
                  />
                  <span className="text-sm">Par défaut</span>
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
              {saving ? 'Enregistrement...' : id ? 'Mettre à jour' : 'Créer la trésorerie'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/tresorerie')}
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

export default TresorerieForm;