// src/components/finances/ConfigurationFinanciere.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Save, X, Loader2, AlertCircle, CheckCircle,
  Settings, DollarSign, Calendar, Shield,
  RefreshCw, TrendingUp, Clock
} from 'lucide-react';

const ConfigurationFinanciere = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState(null);

  const [formData, setFormData] = useState({
    devise: 'XOF',
    devise_symbole: 'CFA',
    exercice_debut: '',
    exercice_fin: '',
    taxe_default: 18,
    arrondi: 0,
    auto_validation: false,
    budget_alerte: 80
  });

  const getToken = () => localStorage.getItem('Token');

  const fetchConfiguration = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/configuration/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      // Si une configuration existe, prendre la première
      if (response.data && response.data.length > 0) {
        const data = response.data[0];
        setConfig(data);
        setFormData({
          devise: data.devise || 'XOF',
          devise_symbole: data.devise_symbole || 'CFA',
          exercice_debut: data.exercice_debut || '',
          exercice_fin: data.exercice_fin || '',
          taxe_default: data.taxe_default || 18,
          arrondi: data.arrondi || 0,
          auto_validation: data.auto_validation || false,
          budget_alerte: data.budget_alerte || 80
        });
      } else {
        // Configurer des valeurs par défaut
        const currentYear = new Date().getFullYear();
        setFormData(prev => ({
          ...prev,
          exercice_debut: `${currentYear}-01-01`,
          exercice_fin: `${currentYear}-12-31`
        }));
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement de la configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfiguration();
  }, []);

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
        taxe_default: parseFloat(formData.taxe_default) || 0,
        arrondi: parseInt(formData.arrondi) || 0,
        budget_alerte: parseInt(formData.budget_alerte) || 80
      };

      let response;
      if (config && config.id) {
        // Mettre à jour la configuration existante
        response = await AxiosInstance.put(`/configuration/${config.id}/`, dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
      } else {
        // Créer une nouvelle configuration
        response = await AxiosInstance.post('/configuration/', dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
      }

      setConfig(response.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
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
          <p className="text-base font-medium text-gray-500">Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <div className="p-2 bg-primary/10 rounded-xl">
          <Settings className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Configuration Financière</h1>
          <p className="text-sm text-gray-500">Paramètres généraux de la comptabilité</p>
        </div>
      </div>

      {/* Notification de succès */}
      {success && (
        <div className="alert alert-success shadow-lg animate-slideDown">
          <CheckCircle className="w-5 h-5" />
          <span>Configuration enregistrée avec succès !</span>
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
            {/* Devise */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Devise *
                </span>
              </label>
              <select
                name="devise"
                value={formData.devise}
                onChange={handleChange}
                className="select select-bordered w-full"
                required
              >
                <option value="XOF">XOF - Franc CFA (Afrique de l'Ouest)</option>
                <option value="XAF">XAF - Franc CFA (Afrique Centrale)</option>
                <option value="EUR">EUR - Euro</option>
                <option value="USD">USD - Dollar Américain</option>
                <option value="GNF">GNF - Franc Guinéen</option>
                <option value="NGN">NGN - Naira Nigérian</option>
                <option value="CDF">CDF - Franc Congolais</option>
              </select>
            </div>

            {/* Symbole devise */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Symbole de la devise *</span>
              </label>
              <input
                type="text"
                name="devise_symbole"
                value={formData.devise_symbole}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="Ex: CFA, €, $..."
                required
              />
            </div>

            {/* Début exercice */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Début de l'exercice *
                </span>
              </label>
              <input
                type="date"
                name="exercice_debut"
                value={formData.exercice_debut}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
            </div>

            {/* Fin exercice */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Fin de l'exercice *
                </span>
              </label>
              <input
                type="date"
                name="exercice_fin"
                value={formData.exercice_fin}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
            </div>

            {/* TVA par défaut */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> TVA par défaut (%)
                </span>
              </label>
              <input
                type="number"
                name="taxe_default"
                value={formData.taxe_default}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="18"
                step="0.01"
                min="0"
                max="100"
              />
            </div>

            {/* Arrondi */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Nombre de décimales</span>
              </label>
              <input
                type="number"
                name="arrondi"
                value={formData.arrondi}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="0"
                min="0"
                max="2"
              />
              <label className="label">
                <span className="label-text-alt text-gray-400">0 = Pas d'arrondi, 2 = Deux décimales</span>
              </label>
            </div>

            {/* Alerte budget */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Alerte budget (%)
                </span>
              </label>
              <input
                type="number"
                name="budget_alerte"
                value={formData.budget_alerte}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="80"
                min="0"
                max="100"
              />
              <label className="label">
                <span className="label-text-alt text-gray-400">Alerte lorsque le budget est utilisé à ce pourcentage</span>
              </label>
            </div>

            {/* Options */}
            <div className="form-control md:col-span-2">
              <div className="flex flex-wrap gap-6 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="auto_validation"
                    checked={formData.auto_validation}
                    onChange={handleChange}
                    className="checkbox checkbox-primary"
                  />
                  <span className="text-sm">Validation automatique des écritures comptables</span>
                </label>
              </div>
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
              {saving ? 'Enregistrement...' : 'Enregistrer la configuration'}
            </button>
            <button
              type="button"
              onClick={fetchConfiguration}
              className="btn btn-outline gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </form>
      </div>

      {/* Informations supplémentaires */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Informations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Statut</p>
            <p className="font-semibold text-success">✅ Configuration active</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Devise</p>
            <p className="font-semibold">{formData.devise} ({formData.devise_symbole})</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Exercice comptable</p>
            <p className="font-semibold">
              {formData.exercice_debut} → {formData.exercice_fin}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationFinanciere;