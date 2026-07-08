// src/components/finances/BudgetCategorieForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, Loader2, AlertCircle,
  CheckCircle, ChartPie, Tag, Hash, FileText
} from 'lucide-react';

const BudgetCategorieForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    description: '',
    is_active: true
  });

  const getToken = () => localStorage.getItem('Token');

  const fetchCategorie = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/budget-categories/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = response.data;
      setFormData({
        nom: data.nom || '',
        code: data.code || '',
        description: data.description || '',
        is_active: data.is_active !== undefined ? data.is_active : true
      });
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement de la catégorie');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCategorie();
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
        code: formData.code.toUpperCase().trim()
      };

      let response;
      if (id) {
        response = await AxiosInstance.put(`/budget-categories/${id}/`, dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
      } else {
        response = await AxiosInstance.post('/budget-categories/', dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/budget-categories');
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
          <p className="text-base font-medium text-gray-500">Chargement de la catégorie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/budget-categories')}
          className="btn btn-ghost btn-sm btn-circle"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <ChartPie className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              {id ? 'Modifier la catégorie' : 'Nouvelle catégorie de budget'}
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-1">
            {id ? `Catégorie #${id}` : 'Créer une nouvelle catégorie de budget'}
          </p>
        </div>
      </div>

      {/* Notification de succès */}
      {success && (
        <div className="alert alert-success shadow-lg animate-slideDown">
          <CheckCircle className="w-5 h-5" />
          <span>Catégorie enregistrée avec succès !</span>
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
            {/* Code */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <Hash className="w-4 h-4" /> Code *
                </span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="input input-bordered w-full uppercase"
                placeholder="Ex: FOURN, ENERG, LOYER..."
                required
              />
              <label className="label">
                <span className="label-text-alt text-gray-400">Code unique en majuscules</span>
              </label>
            </div>

            {/* Nom */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Nom *
                </span>
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="Ex: Fournitures de bureau, Énergie..."
                required
              />
            </div>

            {/* Description */}
            <div className="form-control md:col-span-2">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Description
                </span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="textarea textarea-bordered w-full h-24"
                placeholder="Description de la catégorie de budget..."
              />
            </div>

            {/* Active */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Statut</span>
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
              {saving ? 'Enregistrement...' : id ? 'Mettre à jour' : 'Créer la catégorie'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/budget-categories')}
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

export default BudgetCategorieForm;