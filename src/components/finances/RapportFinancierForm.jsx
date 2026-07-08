// src/components/finances/RapportFinancierForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, Loader2, AlertCircle,
  CheckCircle, LineChart, Calendar, FileText,
  FileSpreadsheet, File
} from 'lucide-react';

const RapportFinancierForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    type: 'bilan',
    nom: '',
    date_debut: '',
    date_fin: '',
    format: 'pdf'
  });

  const getToken = () => localStorage.getItem('Token');

  const fetchRapport = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/rapports/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = response.data;
      setFormData({
        type: data.type || 'bilan',
        nom: data.nom || '',
        date_debut: data.date_debut || '',
        date_fin: data.date_fin || '',
        format: data.format || 'pdf'
      });
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement du rapport');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRapport();
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
        ...formData
      };

      let response;
      if (id) {
        response = await AxiosInstance.put(`/rapports/${id}/`, dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
      } else {
        response = await AxiosInstance.post('/rapports/', dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/rapports-financiers');
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

  const getTypeLabel = (type) => {
    const labels = {
      bilan: 'Bilan comptable',
      compte_resultat: 'Compte de résultat',
      tresorerie: 'Tableau de trésorerie',
      budget: 'Suivi budgétaire',
      ventes: 'Rapport de ventes',
      depenses: 'Rapport de dépenses',
      achats: "Rapport d'achats",
      client: 'Rapport client',
      fournisseur: 'Rapport fournisseur'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement du rapport...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/rapports-financiers')}
          className="btn btn-ghost btn-sm btn-circle"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <LineChart className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              {id ? 'Modifier le rapport' : 'Nouveau rapport financier'}
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-1">
            {id ? `Rapport #${id}` : 'Créer un nouveau rapport financier'}
          </p>
        </div>
      </div>

      {/* Notification de succès */}
      {success && (
        <div className="alert alert-success shadow-lg animate-slideDown">
          <CheckCircle className="w-5 h-5" />
          <span>Rapport enregistré avec succès !</span>
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
            {/* Type */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Type de rapport *</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="select select-bordered w-full"
                required
              >
                <option value="bilan">Bilan comptable</option>
                <option value="compte_resultat">Compte de résultat</option>
                <option value="tresorerie">Tableau de trésorerie</option>
                <option value="budget">Suivi budgétaire</option>
                <option value="ventes">Rapport de ventes</option>
                <option value="depenses">Rapport de dépenses</option>
                <option value="achats">Rapport d'achats</option>
                <option value="client">Rapport client</option>
                <option value="fournisseur">Rapport fournisseur</option>
              </select>
            </div>

            {/* Nom */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Nom du rapport *</span>
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="Ex: Bilan 2024, Rapport ventes janvier..."
                required
              />
            </div>

            {/* Date début */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Date début *</span>
              </label>
              <input
                type="date"
                name="date_debut"
                value={formData.date_debut}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
            </div>

            {/* Date fin */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Date fin *</span>
              </label>
              <input
                type="date"
                name="date_fin"
                value={formData.date_fin}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
            </div>

            {/* Format */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Format *</span>
              </label>
              <select
                name="format"
                value={formData.format}
                onChange={handleChange}
                className="select select-bordered w-full"
                required
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
              </select>
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
              {saving ? 'Enregistrement...' : id ? 'Mettre à jour' : 'Créer le rapport'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/rapports-financiers')}
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

export default RapportFinancierForm;